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
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../navigation/storage';
import { leaveGroup, deleteGroup } from '../services/groupService';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../theme';
import { 
    Flame, 
    Trash2, 
    LogOut, 
    X, 
    Smartphone, 
    Activity,
    Info,
    Copy,
    Users as UsersIcon
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'GroupDetail'>;
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
const CIRCLE_SIZE = 220;
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function GroupDetailScreen({ navigation }: Props) {
    const [showCode, setShowCode] = useState(false);
    const [groupId, setGroupId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [username, setUsername] = useState<string | undefined>(undefined);
    const [inviteCode, setInviteCode] = useState<string>('------');
    const [bannedApps, setBannedApps] = useState<string[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) throw new Error("No hay un usuario autenticado");
                setUserId(user.id);

                const { data: userData } = await supabase
                    .from('users')
                    .select('username')
                    .eq('id', user.id)
                    .single();
                if (userData?.username) setUsername(userData.username);

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
                    const formattedUsers = membershipsData
                        .filter((m: any) => m.users)
                        .map((m: any) => {
                            const userSessions = sessionsData?.filter((s: any) => s.user_id === m.user_id) || [];
                            const totalMinutesToday = userSessions.reduce((sum: number, s: any) => {
                                if (s.minutes_used !== null) {
                                    return sum + s.minutes_used;
                                } else if (s.started_at && !s.ended_at) {
                                    const start = new Date(s.started_at);
                                    const elapsedMs = now.getTime() - start.getTime();
                                    return sum + Math.max(0, elapsedMs / (1000 * 60));
                                }
                                return sum;
                            }, 0);

                            return {
                                id: m.users?.id || m.user_id,
                                username: m.users?.username || 'Usuario',
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

        if (!groupId) return;

        const channel = supabase
            .channel(`group-details-${groupId}-${Date.now()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `group_id=eq.${groupId}` }, () => fetchUsersFromGroup())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `group_id=eq.${groupId}` }, () => fetchUsersFromGroup())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    const { group, loading, activeSession, startSession, endSession } = useTimeService(groupId, userId, username);

    const handleScrollingFoo = async (app: string) => {
        if (!isScrolling) {
            setIsScrolling(true);
            await startSession(app);
        } else {
            setIsScrolling(false);
            await endSession();
        }
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(inviteCode);
        Alert.alert('Copiado', 'Código de invitación copiado al portapapeles.');
    };

    const total_minutes = group?.totalMinutes ?? MOCK_GROUP.total_minutes;
    const used_minutes = group?.usedMinutes ?? MOCK_GROUP.used_minutes;
    const streak_days = group?.streakDays ?? MOCK_GROUP.streak_days;
    const name = group?.name ?? MOCK_GROUP.name;
    const remaining = Math.max(0, total_minutes - used_minutes);
    const usedRatio = Math.min(1, used_minutes / total_minutes);
    const progressOffset = CIRCUMFERENCE * (1 - usedRatio);

    const handleGoHome = () => navigation.navigate('Home');

    const handleAbandonGroup = async () => {
        if (!userId || !groupId) return;
        Alert.alert('Abandonar grupo', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Abandonar',
                style: 'destructive',
                onPress: async () => {
                    await leaveGroup(userId, groupId);
                    await AsyncStorage.removeItem(STORAGE_KEYS.GROUP_ID);
                    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                },
            },
        ]);
    };

    const handleDeleteGroup = async () => {
        if (!groupId) return;
        Alert.alert('Borrar grupo', 'Se eliminará definitivamente. ¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    await deleteGroup(groupId);
                    await AsyncStorage.removeItem(STORAGE_KEYS.GROUP_ID);
                    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                },
            },
        ]);
    };

    const isOwner = group?.createdBy === userId;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            
            <View style={styles.topHeader}>
                <TouchableOpacity onPress={handleGoHome} style={styles.backButton}>
                    <X color={COLORS.textPrimary} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.groupName} numberOfLines={1}>{name}</Text>
                    <TouchableOpacity onPress={() => setShowCode(!showCode)} style={styles.codeIndicator}>
                        <Info size={14} color={COLORS.primary} />
                        <Text style={styles.codeIndicatorText}>Información del grupo</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerActions}>
                    {isOwner ? (
                        <TouchableOpacity onPress={handleDeleteGroup} style={styles.iconButton}>
                            <Trash2 color={COLORS.error} size={20} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleAbandonGroup} style={styles.iconButton}>
                            <LogOut color={COLORS.error} size={20} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {showCode && (
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Código de invitación</Text>
                            <TouchableOpacity onPress={copyToClipboard} style={styles.copyBox}>
                                <Text style={styles.codeText}>{inviteCode}</Text>
                                <Copy size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Estado</Text>
                            <View style={styles.statusBadge}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Activo</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.streakContainer}>
                    <Flame color={COLORS.primary} fill={COLORS.primary} size={20} />
                    <Text style={styles.streakText}>{streak_days} Días de racha</Text>
                </View>

                <View style={styles.circleContainer}>
                    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                        <Circle cx={CIRCLE_SIZE/2} cy={CIRCLE_SIZE/2} r={RADIUS} stroke={COLORS.surfaceLight} strokeWidth={STROKE_WIDTH} fill="none" />
                        <Circle 
                            cx={CIRCLE_SIZE/2} cy={CIRCLE_SIZE/2} r={RADIUS} 
                            stroke={COLORS.primary} strokeWidth={STROKE_WIDTH} fill="none"
                            strokeDasharray={CIRCUMFERENCE} strokeDashoffset={progressOffset}
                            strokeLinecap="round" rotation="-90" origin={`${CIRCLE_SIZE/2}, ${CIRCLE_SIZE/2}`}
                        />
                    </Svg>
                    <View style={styles.circleCenter}>
                        <Text style={styles.circleNumber}>{remaining}</Text>
                        <Text style={styles.circleLabel}>min restantes</Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <UsersIcon size={20} color={COLORS.textSecondary} />
                    <Text style={styles.sectionTitle}>Participantes</Text>
                </View>

                <View style={styles.participantsList}>
                    {(participants.length > 0 ? participants : MOCK_PARTICIPANTS).map((p) => (
                        <View key={p.id} style={styles.participantRow}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{p.username.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.participantMeta}>
                                <Text style={styles.participantName}>{p.username}</Text>
                                <View style={styles.participantProgressContainer}>
                                    <View style={styles.pProgressBar}>
                                        <View style={[styles.pProgressFill, { width: `${Math.min(100, (p.minutes_used / total_minutes) * 100)}%` }]} />
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.participantMinutes}>{p.minutes_used} min</Text>
                        </View>
                    ))}
                </View>

                <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
                    <Smartphone size={20} color={COLORS.textSecondary} />
                    <Text style={styles.sectionTitle}>Simular Uso de App</Text>
                </View>

                <View style={styles.appsGrid}>
                    {(bannedApps.length > 0 ? bannedApps : MOCK_GROUP.banned_apps).map((app) => (
                        <TouchableOpacity
                            key={app}
                            style={[
                                styles.appCard,
                                activeSession?.appName === app && styles.appCardActive
                            ]}
                            onPress={() => handleScrollingFoo(app)}
                        >
                            <View style={[styles.appIcon, { backgroundColor: activeSession?.appName === app ? COLORS.primary : COLORS.surfaceLight }]}>
                                <Activity size={24} color={activeSession?.appName === app ? COLORS.black : COLORS.textPrimary} />
                            </View>
                            <Text style={styles.appName} numberOfLines={1}>{app}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: { padding: 4 },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    groupName: { fontSize: 18, fontWeight: FONTS.bold as any, color: COLORS.textPrimary },
    codeIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
    codeIndicatorText: { fontSize: 12, color: COLORS.textSecondary },
    headerActions: { flexDirection: 'row', gap: 12 },
    iconButton: { padding: 4 },
    scrollContent: { padding: SPACING.lg, paddingBottom: 100 },
    infoCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoLabel: { fontSize: 14, color: COLORS.textSecondary },
    copyBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm },
    codeText: { fontSize: 14, fontWeight: FONTS.semiBold as any, color: COLORS.primary, letterSpacing: 1 },
    infoDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(50, 215, 75, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
    statusText: { fontSize: 12, color: COLORS.success, fontWeight: FONTS.medium as any },
    streakContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: SPACING.lg },
    streakText: { fontSize: 16, fontWeight: FONTS.semiBold as any, color: COLORS.primary },
    circleContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: SPACING.xl },
    circleCenter: { position: 'absolute', alignItems: 'center' },
    circleNumber: { fontSize: 56, fontWeight: FONTS.bold as any, color: COLORS.textPrimary },
    circleLabel: { fontSize: 14, color: COLORS.textSecondary, marginTop: -4 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.md },
    sectionTitle: { fontSize: 18, fontWeight: FONTS.semiBold as any, color: COLORS.textPrimary },
    participantsList: { gap: 12 },
    participantRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 16, fontWeight: FONTS.bold as any, color: COLORS.primary },
    participantMeta: { flex: 1, marginLeft: 12 },
    participantName: { fontSize: 15, fontWeight: FONTS.medium as any, color: COLORS.textPrimary },
    participantProgressContainer: { marginTop: 4, height: 4, width: '80%' },
    pProgressBar: { height: 4, backgroundColor: COLORS.surfaceLight, borderRadius: 2, overflow: 'hidden' },
    pProgressFill: { height: '100%', backgroundColor: COLORS.primary },
    participantMinutes: { fontSize: 14, fontWeight: FONTS.semiBold as any, color: COLORS.textSecondary },
    appsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    appCard: { width: '30.5%', backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border },
    appCardActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(205, 255, 0, 0.05)' },
    appIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    appName: { fontSize: 12, color: COLORS.textSecondary, fontWeight: FONTS.medium as any },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 15, 18, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
});
