import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { PlusCircle, Users, LayoutDashboard, LogOut } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type HomeScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const [userGroupId, setUserGroupId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const checkMembership = async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const { data: membership, error } = await supabase
                        .from('memberships')
                        .select('group_id')
                        .eq('user_id', user.id)
                        .single();

                    if (membership) {
                        setUserGroupId(membership.group_id);
                    } else {
                        setUserGroupId(null);
                    }
                } catch (error) {
                    console.log('Error checking membership:', error);
                    setUserGroupId(null);
                } finally {
                    setIsLoading(false);
                }
            };

            checkMembership();
        }, [])
    );

    const handleCreateGroup = () => {
        if (!userGroupId) {
            navigation.navigate('CreateGroup');
        }
    };

    const handleActionGroup = () => {
        if (userGroupId) {
            navigation.navigate('GroupDetail');
        } else {
            navigation.navigate('JoinGroup');
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Cargando datos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Control</Text>
                    <Text style={[styles.title, { color: COLORS.primary }]}>Social</Text>
                </View>

                <Text style={styles.subtitle}>
                    {userGroupId
                        ? 'Estás listo para continuar con tu grupo de enfoque.'
                        : 'Elige cómo quieres empezar a mejorar tu productividad hoy.'}
                </Text>

                <View style={styles.cardsContainer}>
                    <TouchableOpacity
                        style={[styles.card, userGroupId && styles.cardDisabled]}
                        activeOpacity={0.8}
                        onPress={handleCreateGroup}
                        disabled={!!userGroupId}
                    >
                        <View style={[styles.iconBox, { backgroundColor: `${COLORS.primary}15` }]}>
                            <PlusCircle size={28} color={COLORS.primary} />
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>Crear Grupo</Text>
                            <Text style={styles.cardDesc}>Inicia tu propia comunidad de enfoque.</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.8}
                        onPress={handleActionGroup}
                    >
                        <View style={[styles.iconBox, { backgroundColor: userGroupId ? `${COLORS.success}15` : `${COLORS.secondary}15` }]}>
                            {userGroupId ? (
                                <LayoutDashboard size={28} color={COLORS.success} />
                            ) : (
                                <Users size={28} color={COLORS.secondary} />
                            )}
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>
                                {userGroupId ? 'Mi Dashboard' : 'Unirse a Grupo'}
                            </Text>
                            <Text style={styles.cardDesc}>
                                {userGroupId ? 'Ver estadísticas y progreso actual.' : 'Busca un grupo existente con un código.'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {userGroupId && (
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            Ya eres miembro de un grupo. Sal para unirte a otro o crear uno nuevo.
                        </Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        marginBottom: SPACING.sm,
    },
    title: {
        fontSize: 40,
        fontWeight: FONTS.bold as any,
        color: COLORS.textPrimary,
        marginRight: 10,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xxl,
        lineHeight: 24,
    },
    cardsContainer: {
        gap: SPACING.md,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardDisabled: {
        opacity: 0.5,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: BORDER_RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.lg,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: FONTS.semiBold as any,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    infoBox: {
        marginTop: SPACING.xl,
        padding: SPACING.md,
        backgroundColor: 'rgba(205, 255, 0, 0.05)',
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(205, 255, 0, 0.1)',
    },
    infoText: {
        fontSize: 12,
        color: COLORS.primary,
        textAlign: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: FONTS.medium as any,
        marginTop: SPACING.md,
    },
});
