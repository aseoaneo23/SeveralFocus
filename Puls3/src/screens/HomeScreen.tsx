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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';

type HomeScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

// ─── Paleta de colores ───────────────────────────────────────
const COLORS = {
    background: '#1a1d24',
    surface: '#2c323d',
    textPrimary: '#e0e1dd',
    textSecondary: '#8e9aaf',
    accent: '#6c63ff',
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
                <View style={[styles.content, { justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.content}>
                {/* ── Título ── */}
                <Text style={styles.title}>Grupo</Text>

                {/* ── Subtítulo ── */}
                <Text style={styles.subtitle}>
                    {userGroupId 
                        ? 'Gestiona tu participación en el grupo' 
                        : 'Selecciona una opción para comenzar'}
                </Text>

                {/* ── Botón Crear Grupo ── */}
                <View style={{ width: '100%' }}>
                    <TouchableOpacity
                        style={[styles.button, userGroupId && styles.buttonDisabled]}
                        activeOpacity={0.7}
                        onPress={handleCreateGroup}
                        disabled={!!userGroupId}
                    >
                        <Text style={styles.buttonText}>Crear Grupo</Text>
                    </TouchableOpacity>
                    
                    {userGroupId && (
                        <Text style={styles.infoText}>
                            Ya perteneces a un grupo. Debes salir de este para crear uno nuevo.
                        </Text>
                    )}
                </View>

                {/* ── Botón Dinámico (Unirme / Ver Grupo) ── */}
                <TouchableOpacity
                    style={[styles.button, { marginTop: 8 }]}
                    activeOpacity={0.7}
                    onPress={handleActionGroup}
                >
                    <Text style={styles.buttonText}>
                        {userGroupId ? 'Ver mi grupo' : 'Unirse a un Grupo'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Estilos ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 40,
    },
    button: {
        width: '100%',
        backgroundColor: COLORS.surface,
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
});
