import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTimeService } from '../services/timeServices';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../navigation/storage';
import { leaveGroup, deleteGroup } from '../services/groupService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'GroupDetail'>;
};
// ─── Paleta de colores ───────────────────────────────────────
const COLORS = {
    background: '#1a1d24',
    surface: '#2c323d',
    textPrimary: '#e0e1dd',
    textSecondary: '#8e9aaf',
    accent: '#6c63ff',
    progress: '#4ecdc4',
};

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_GROUP = {
    id: '1',
    name: 'Study Squad',
    invite_code: 'ABC123',
    total_minutes: 120,
    used_minutes: 45,
    streak_days: 7,
    best_streak: 14,
    is_alive: true,
    reset_period: 'daily' as const,
    banned_apps: ['Instagram', 'TikTok', 'Twitter', 'YouTube'],
};

const MOCK_PARTICIPANTS = [
    { id: '1', username: 'Carlos', minutes_used: 18 },
    { id: '2', username: 'María', minutes_used: 15 },
    { id: '3', username: 'Andrés', minutes_used: 12 },
];

// ─── Constantes del círculo ──────────────────────────────────
const CIRCLE_SIZE = 200;
const STROKE_WIDTH = 14;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function GroupDetailScreen({ navigation }: Props) {
    const [showCode, setShowCode] = useState(false);
    const [groupId, setGroupId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [inviteCode, setInviteCode] = useState<string>('------');
    const [bannedApps, setBannedApps] = useState<string[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // 1. Le preguntas a Supabase quién es el usuario que está usando la app
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) throw new Error("No hay un usuario autenticado");

                setUserId(user.id); // Guardamos la ID para el timeService

                // 2. Buscamos el grupo al que pertenece el usuario
                const { data: membership } = await supabase
                    .from('memberships')
                    .select('group_id')
                    .eq('user_id', user.id)
                    .single();

                if (membership?.group_id) {
                    setGroupId(membership.group_id);
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchUser();
    }, []);

    // ── Fetch datos del grupo (invite_code, banned_apps) y participantes ──
    useEffect(() => {
        if (!groupId) return;

        const fetchGroupExtras = async () => {
            try {
                const { data, error } = await supabase
                    .from('groups')
                    .select('invite_code, banned_apps')
                    .eq('id', groupId)
                    .single();

                if (error) throw error;
                if (data) {
                    setInviteCode(data.invite_code ?? '------');
                    setBannedApps(data.banned_apps ?? []);
                }
            } catch (error) {
                console.log('Error al traer extras del grupo:', error);
            }
        };

        const fetchUsersFromGroup = async () => {
            try {
                const { data: membershipsData, error } = await supabase
                    .from('memberships')
                    .select(`
                        user_id,
                        users (id, username)
                    `)
                    .eq('group_id', groupId);

                if (error) throw error;

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const { data: sessionsData, error: sessionsError } = await supabase
                    .from('sessions')
                    .select('user_id, minutes_used, started_at, ended_at')
                    .eq('group_id', groupId)
                    .gte('started_at', today.toISOString());

                if (sessionsError) throw sessionsError;

                if (membershipsData) {
                    const now = new Date();
                    const formattedUsers = membershipsData.map((m: any) => {
                        const userSessions = sessionsData?.filter((s: any) => s.user_id === m.user_id) || [];
                        
                        const totalMinutesToday = userSessions.reduce((sum: number, s: any) => {
                            if (s.minutes_used !== null) {
                                return sum + s.minutes_used;
                            } else if (s.started_at && !s.ended_at) {
                                // Sesión activa: calcular minutos transcurridos hasta ahora
                                const start = new Date(s.started_at);
                                const elapsedMs = now.getTime() - start.getTime();
                                return sum + Math.max(0, elapsedMs / (1000 * 60));
                            }
                            return sum;
                        }, 0);
                        
                        return {
                            id: m.users.id,
                            username: m.users.username,
                            minutes_used: Math.floor(totalMinutesToday)
                        };
                    });
                    setParticipants(formattedUsers);
                }
            } catch (error) {
                console.log('Error al traer participantes:', error);
            }
        };

        fetchGroupExtras();
        fetchUsersFromGroup();

        // Si tenemos groupId, nos suscribimos a los cambios en tiempo real
        if (!groupId) return;

        const channel = supabase
            .channel(`group-details-${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Escuchar INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'memberships',
                    filter: `group_id=eq.${groupId}`,
                },
                (payload) => {
                    console.log('Cambio detectado en membresías:', payload);
                    fetchUsersFromGroup(); // Recarga la lista inmediatamente
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*', // Escuchar INSERT, UPDATE
                    schema: 'public',
                    table: 'sessions',
                    filter: `group_id=eq.${groupId}`,
                },
                (payload) => {
                    console.log('Cambio detectado en sesiones:', payload);
                    fetchUsersFromGroup(); // Actualiza los minutos cuando se cierra una sesión
                }
            )
            .subscribe();

        // Importante: Limpiar la suscripción cuando el usuario sale de la pantalla
        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    // 3. Le pasamos el groupId y el userId al hook
    const { group, loading, activeSession, startSession, endSession } = useTimeService(groupId, userId);

    const handleScrollingFoo = async (app: string) => {
        if (!isScrolling) {
            setIsScrolling(true);
            Alert.alert(
                '⏱ Simulando uso',
                `Estás usando ${app}... El tiempo del grupo corre.`
            );
            await startSession(app);
        } else {
            setIsScrolling(false);
            Alert.alert(
                '⏹️ Simulacro detenido',
                `Has dejado de usar la app.`
            );
            await endSession();
        }
    };

    // 4. Usamos los datos (Fallback a MOCK_GROUP si no han cargado)
    const total_minutes = group?.totalMinutes ?? MOCK_GROUP.total_minutes;
    const used_minutes = group?.usedMinutes ?? MOCK_GROUP.used_minutes;
    const streak_days = group?.streakDays ?? MOCK_GROUP.streak_days;
    const name = group?.name ?? MOCK_GROUP.name;
    const remaining = total_minutes - used_minutes;
    const usedRatio = used_minutes / total_minutes;
    const progressOffset = CIRCUMFERENCE * (1 - usedRatio);

    // ── Porcentaje para la barra lineal ──
    const barPercent = (used_minutes / total_minutes) * 100;

    const handleGoHome = () => {
        navigation.navigate('Home');
    };

    const handleAbandonGroup = async () => {
        if (!userId || !groupId) return;

        Alert.alert(
            'Abandonar grupo',
            'Saldrás definitivamente de este grupo. ¿Estás seguro?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Abandonar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await leaveGroup(userId, groupId);
                            await AsyncStorage.removeItem(STORAGE_KEYS.GROUP_ID);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Home' }],
                            });
                        } catch (error: any) {
                            Alert.alert('Error', 'No se pudo abandonar el grupo: ' + error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteGroup = async () => {
        if (!groupId) return;

        Alert.alert(
            'Borrar grupo',
            'Se eliminará el grupo y a todos sus participantes definitivamente. ¿Estás seguro?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteGroup(groupId);
                            await AsyncStorage.removeItem(STORAGE_KEYS.GROUP_ID);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Home' }],
                            });
                        } catch (error: any) {
                            Alert.alert('Error', 'No se pudo eliminar el grupo: ' + error.message);
                        }
                    },
                },
            ]
        );
    };

    const isOwner = group?.createdBy === userId;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Cabecera ── */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity
                            style={styles.titleRow}
                            activeOpacity={0.7}
                            onPress={() => setShowCode(!showCode)}
                        >
                            <Text style={styles.groupName}>{name}</Text>
                        </TouchableOpacity>

                        <View style={styles.headerButtons}>
                            {isOwner && (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={handleDeleteGroup}
                                >
                                    <View style={styles.trashCircle}>
                                        <Text style={{ fontSize: 10 }}>🗑️</Text>
                                    </View>
                                </TouchableOpacity>
                            )}

                            {!isOwner && (
                                <TouchableOpacity
                                    style={styles.abandonButton}
                                    onPress={handleAbandonGroup}
                                >
                                    <Text style={styles.abandonButtonText}>Abandonar</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.exitButton}
                                onPress={handleGoHome}
                            >
                                <Text style={styles.exitButtonText}>Salir</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showCode && (
                        <View style={styles.codeBadge}>
                            <Text style={styles.codeText}>{inviteCode}</Text>
                        </View>
                    )}

                    {/* ── Racha ── */}
                    <Text style={styles.streak}>
                        🔥 {streak_days} Días de racha
                    </Text>
                </View>

                {/* ── Visualizador Circular ── */}
                <View style={styles.circleContainer}>
                    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                        {/* Fondo */}
                        <Circle
                            cx={CIRCLE_SIZE / 2}
                            cy={CIRCLE_SIZE / 2}
                            r={RADIUS}
                            stroke={COLORS.surface}
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                        />
                        {/* Progreso (usado) */}
                        <Circle
                            cx={CIRCLE_SIZE / 2}
                            cy={CIRCLE_SIZE / 2}
                            r={RADIUS}
                            stroke={COLORS.progress}
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={progressOffset}
                            strokeLinecap="round"
                            rotation="-90"
                            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
                        />
                    </Svg>
                    {/* Centro — minutos restantes */}
                    <View style={styles.circleCenter}>
                        <Text style={styles.circleNumber}>{remaining}</Text>
                        <Text style={styles.circleLabel}>min restantes</Text>
                    </View>
                </View>

                {/* ── Barra de Progreso Lineal ── */}
                <View style={styles.barContainer}>
                    <View style={styles.barBackground}>
                        <View style={[styles.barFill, { width: `${barPercent}%` }]} />
                        {/* Punto decorativo en la unión */}
                        <View style={[styles.barDot, { left: `${barPercent}%` }]} />
                    </View>
                </View>

                {/* ── Lista de Participantes ── */}
                <View style={styles.participantsSection}>
                    <Text style={styles.sectionTitle}>Participantes</Text>
                    {(participants.length > 0 ? participants : MOCK_PARTICIPANTS).map((p) => (
                        <View key={p.id} style={styles.participantRow}>
                            {/* Avatar — inicial */}
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {p.username.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.participantName}>{p.username}</Text>
                            <Text style={styles.participantMinutes}>
                                {p.minutes_used} min
                            </Text>
                        </View>
                    ))}
                </View>

                {/* ── Simulador de Apps Prohibidas ── */}
                <View style={styles.bannedAppsSection}>
                    <Text style={styles.sectionTitle}>Simular uso de app</Text>
                    <View style={styles.bannedAppsRow}>
                        {(bannedApps.length > 0 ? bannedApps : MOCK_GROUP.banned_apps).map((app) => (
                            <TouchableOpacity
                                key={app}
                                style={[
                                    styles.appCircle,
                                    activeSession?.appName === app && { borderWidth: 2, borderColor: COLORS.progress }
                                ]}
                                activeOpacity={0.7}
                                onPress={() => handleScrollingFoo(app)}
                            >
                                <Text style={styles.appCircleText}>
                                    {app.charAt(0).toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Estilos ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 40,
    },

    // ── Cabecera ──
    header: {
        marginBottom: 32,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    abandonButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(142, 154, 175, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(142, 154, 175, 0.3)',
    },
    abandonButtonText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontSize: 12,
    },
    deleteButton: {
        padding: 8,
    },
    trashCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 69, 58, 0.3)',
    },
    exitButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 69, 58, 0.3)',
    },
    exitButtonText: {
        color: '#ff453a',
        fontWeight: '600',
        fontSize: 12,
    },
    titleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    groupName: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.textPrimary,
        letterSpacing: 0.5,
    },
    codeBadge: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    codeText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.progress,
        letterSpacing: 1,
    },
    streak: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 8,
    },

    // ── Círculo ──
    circleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    circleCenter: {
        position: 'absolute',
        alignItems: 'center',
    },
    circleNumber: {
        fontSize: 42,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    circleLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },

    // ── Barra lineal ──
    barContainer: {
        paddingHorizontal: 8,
        marginBottom: 36,
    },
    barBackground: {
        height: 6,
        backgroundColor: COLORS.surface,
        borderRadius: 3,
        overflow: 'visible',
        position: 'relative',
    },
    barFill: {
        height: 6,
        backgroundColor: COLORS.progress,
        borderRadius: 3,
    },
    barDot: {
        position: 'absolute',
        top: -4,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.textPrimary,
        marginLeft: -7,
        borderWidth: 2,
        borderColor: COLORS.background,
    },

    // ── Participantes ──
    participantsSection: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.progress,
    },
    participantName: {
        flex: 1,
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    participantMinutes: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },

    // ── Apps Prohibidas ──
    bannedAppsSection: {
        marginTop: 24,
    },
    bannedAppsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    appCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appCircleText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.accent,
    },
});
