import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
// import { useAuth } from './useAuth'; // Comentado temporalmente porque aún no tienes creado este hook

interface GroupState {
  id: string;
  name: string;
  totalMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  isAlive: boolean;
  killedBy?: string;
  streakDays: number;
}

interface ActiveSession {
  id: string;
  groupId: string;
  appName: string;
  startedAt: Date;
}

export const useTimeService = (groupId: string | null, userId?: string) => {
  // const { session } = useAuth(); // Depende de useAuth
  // Mock de la sesión temporal usando el parámetro o un string vacío
  Alert.alert('El user id en useTimeService es userId', userId);
  const session = { user: { id: userId || 'ID_DE_USUARIO_AQUI' } };
  const [group, setGroup] = useState<GroupState | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(false);
  const appStateSubscription = useRef<any>(null);

  // Cargar el estado inicial del grupo
  const loadGroup = useCallback(async () => {
    if (!groupId || !session?.user.id) return;

    const { data, error } = await supabase
      .from('groups')
      .select('id, name, total_minutes, used_minutes, is_alive, killed_by, streak_days')
      .eq('id', groupId)
      .single();

    if (error) {
      console.error('Error loading group:', error);
      return;
    }

    setGroup({
      id: data.id,
      name: data.name,
      totalMinutes: data.total_minutes,
      usedMinutes: data.used_minutes,
      remainingMinutes: data.total_minutes - data.used_minutes,
      isAlive: data.is_alive,
      killedBy: data.killed_by,
      streakDays: data.streak_days,
    });
  }, [groupId, session]);

  // Suscripción en tiempo real a cambios en el grupo (para actualizar used_minutes)
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setGroup((prev) =>
            prev
              ? {
                ...prev,
                usedMinutes: updated.used_minutes,
                remainingMinutes: updated.total_minutes - updated.used_minutes,
                isAlive: updated.is_alive,
                killedBy: updated.killed_by,
                streakDays: updated.streak_days,
              }
              : null
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);


  // Iniciar sesión (cuando el usuario abre una app prohibida)
  const startSession = useCallback(
    async (appName: string) => {
      if (!groupId || !session?.user.id) {
        throw new Error('No hay grupo activo o usuario no autenticado');
      }
      if (activeSession) {
        console.warn('Ya hay una sesión activa. Ciérrala primero.');
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sessions')
          .insert({
            group_id: groupId,
            user_id: session.user.id,
            app_name: appName,
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) throw error;

        setActiveSession({
          id: data.id,
          groupId,
          appName,
          startedAt: new Date(),
        });

        // Opcional: registrar evento de app_opened (aunque close_session ya lo hace)
        await supabase.from('events').insert({
          group_id: groupId,
          user_id: session.user.id,
          event_type: 'app_opened',
          app_name: appName,
          metadata: { started_at: new Date().toISOString() },
        });

        return data.id;
      } catch (error: any) {
        console.error('Error starting session:', error);
        Alert.alert('Error', 'No se pudo iniciar la sesión: ' + error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [groupId, session, activeSession]
  );

  // Finalizar sesión (cuando el usuario cierra la app o deja de scrollear)
  const endSession = useCallback(async () => {
    if (!activeSession) {
      console.warn('No hay sesión activa para cerrar');
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('close_session', {
        p_session_id: activeSession.id,
      });

      if (error) throw error;

      // data contiene: { status, minutes_left, killer_name, streak_lost, ... }
      setActiveSession(null)
      await supabase.from('events').insert({
        group_id: groupId,
        user_id: session.user.id,
        event_type: 'app_closed',
        app_name: data.appName,
        minutes_used: data.minutes_used,
        minutes_left: data.minutes_left,
        killer_name: data.killer_name,
        streak_lost: data.streak_lost,
        status: data.status,
        metadata: { started_at: new Date().toISOString() },
      });

      return data;
    } catch (error: any) {
      console.error('Error ending session:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeSession]);

  // Detectar cuando la app pasa a segundo plano / primer plano (opcional)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && activeSession) {
        // Si la app pasa a segundo plano y hay sesión activa, la cerramos automáticamente
        endSession();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [activeSession, endSession]);

  // Cargar grupo inicial
  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  return {
    group,
    activeSession,
    loading,
    startSession,
    endSession,
    refreshGroup: loadGroup,
  };
};