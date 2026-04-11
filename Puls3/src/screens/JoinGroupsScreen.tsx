import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { joinGroup } from '../services/groupService';
import { supabase } from '../lib/supabase';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'JoinGroup'>;
};

// ─── Paleta de colores ───────────────────────────────────────
const COLORS = {
    background: '#1a1d24',
    surface: '#2c323d',
    textPrimary: '#e0e1dd',
    textSecondary: '#8e9aaf',
};

export default function JoinGroupsScreen({ navigation }: Props) {
    const [groupCode, setGroupCode] = useState('');
    const [touched, setTouched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isValid = groupCode.trim().length > 0;

    // Integración con el Backend (GroupCode)
    const handleJoinGroup = async () => {
        setTouched(true);
        if (!isValid) return;

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Debes estar autenticado para unirte a un grupo');
            }

            await joinGroup(groupCode, user.id);
            Alert.alert("¡Éxito!", "Te has unido al grupo correctamente");
            navigation.navigate('GroupDetail');
        } catch (error: any) {
            Alert.alert("Error", error.message || "Ocurrió un error al unirse");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="light" />

            <View style={styles.content}>
                {/* ── Título ── */}
                <Text style={styles.title}>Codigo de Grupo</Text>

                {/* ── Input ── */}
                <TextInput
                    style={styles.input}
                    placeholder="Escribe el codigo de tu grupo..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={groupCode}
                    onChangeText={setGroupCode}
                    editable={!isLoading}
                />

                {/* ── Error ── */}
                {touched && !isValid && (
                    <Text style={styles.errorText}>El código no puede estar vacío</Text>
                )}

                {/* ── Botón ── */}
                <TouchableOpacity
                    style={[styles.button, (!isValid || isLoading) && styles.buttonDisabled]}
                    activeOpacity={0.7}
                    onPress={handleJoinGroup}
                    disabled={!isValid || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.textPrimary} />
                    ) : (
                        <Text style={styles.buttonText}>Unirse al Grupo</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 32,
        letterSpacing: 0.5,
    },
    input: {
        width: '100%',
        backgroundColor: COLORS.surface,
        color: COLORS.textPrimary,
        fontSize: 16,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    button: {
        width: '100%',
        backgroundColor: COLORS.surface,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    errorText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    buttonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
});
