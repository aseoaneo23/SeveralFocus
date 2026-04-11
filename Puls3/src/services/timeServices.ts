import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';

interface GroupState {
  id: string;
  name: string;
  totalMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  isAlive: boolean;
  killedBy?: string;
  streakDays: number;
  createdBy: string;
}

interface ActiveSession {
  id: string;
  groupId: string;
  appName: string;
  startedAt: Date;
}

export const useTimeService = (groupId: string | null, userId?: string, username?: string) => {
  const session = useMemo(() => ({ user: { id: userId || 'ID_DE_USUARIO_AQUI' } }), [userId]);
  const [group, setGroup] = useState<GroupState | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(false);

  const loadGroup = useCallback(async () => {
    if (!groupId || !session?.user.id) return;

    const { data, error } = await supabase
      .from('groups')
      .select('id, name, total_minutes, used_minutes, is_alive, killed_by, streak_days, created_by')
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
      createdBy: data.created_by,
    });
  }, [groupId, session]);

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-time-${groupId}-${Date.now()}`)
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

  const startSession = useCallback(
    async (appName: string) => {

      if (!groupId || !session?.user.id) {
        throw new Error('No hay grupo activo o usuario no autenticado');
      }
      if (activeSession) return;

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

        // Evento app_opened
        await supabase.from('events').insert({
          group_id: groupId,
          user_id: session.user.id,
          event_type: 'app_opened',
          app_name: appName,
          metadata: {
            username: username || session.user.id.substring(0, 6)
          },
        });

        return data.id;
      } catch (error: any) {
        console.error('Error starting session:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [groupId, session, activeSession, username]
  );

  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(async () => {
      await supabase.from('events').insert({
        group_id: activeSession.groupId,
        user_id: session.user.id,
        event_type: 'milestone_5',
        app_name: activeSession.appName,
        metadata: {
          username: username || session.user.id.substring(0, 6),
        },
      });

      console.log("⏱️ milestone enviado");
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const endSession = useCallback(async () => {
    if (!activeSession) return null;

    setLoading(true);
    try {
      // 1. Cerramos la sesión en la DB usando el RPC (esto calcula minutos usados)
      const { data, error } = await supabase.rpc('close_session', {
        p_session_id: activeSession.id,
      });

      if (error) throw error;

      setActiveSession(null);
      return data;
    } catch (error: any) {
      console.error('Error ending session:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeSession, groupId, session, username]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && activeSession) {
        endSession();
      }
    });
    return () => subscription.remove();
  }, [activeSession, endSession]);

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