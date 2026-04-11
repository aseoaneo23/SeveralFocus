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
import { createGroup } from '../services/groupService';
import { supabase } from '../lib/supabase';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'CreateGroup'>;
};

// ─── Paleta de colores ───────────────────────────────────────
const COLORS = {
    background: '#1a1d24',
    surface: '#2c323d',
    textPrimary: '#e0e1dd',
    textSecondary: '#8e9aaf',
};

export default function CreateGroupScreen({ navigation }: Props) {
    const [groupName, setGroupName] = useState('');
    const [bannedAppsInput, setBannedAppsInput] = useState('');
    const [touched, setTouched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isNameValid = groupName.trim().length > 0;
    const isAppsValid = bannedAppsInput.trim().length > 0;
    const isValid = isNameValid && isAppsValid;

    // Integración con el Backend
    const handleCreateGroup = async () => {
        setTouched(true);
        if (!isValid) return;

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Debes estar autenticado para crear un grupo');
            }

            const bannedAppsArray = bannedAppsInput
                .split(',')
                .map(app => app.trim())
                .filter(app => app.length > 0);

            await createGroup({
                name: groupName,
                bannedApps: bannedAppsArray,
                timePerPerson: 60, // Valor por defecto en minutos
                maxMembers: 10, // Valor por defecto
                isPublic: true, // Valor por defecto
                createdBy: user.id,
            });

            Alert.alert("¡Éxito!", "Grupo creado correctamente");
            navigation.navigate('GroupDetail');
        } catch (error: any) {
            Alert.alert("Error", error.message || "Ocurrió un error al crear el grupo");
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
                <Text style={styles.title}>Crear Grupo</Text>

                {/* ── Input Nombre ── */}
                <Text style={styles.label}>Nombre de Grupo</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Escribe el nombre del grupo..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={groupName}
                    onChangeText={setGroupName}
                    editable={!isLoading}
                />

                {/* ── Input Apps Prohibidas ── */}
                <Text style={styles.label}>Aplicaciones Prohibidas (separadas por coma)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Instagram, TikTok, Twitter..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={bannedAppsInput}
                    onChangeText={setBannedAppsInput}
                    editable={!isLoading}
                />

                {/* ── Error Nombre ── */}
                {touched && !isNameValid && (
                    <Text style={styles.errorText}>El nombre no puede estar vacío</Text>
                )}

                {/* ── Error Apps Prohibidas ── */}
                {touched && !isAppsValid && (
                    <Text style={styles.errorText}>Debes añadir al menos una aplicación prohibida</Text>
                )}

                {/* ── Botón ── */}
                <TouchableOpacity
                    style={[styles.button, (!isValid || isLoading) && styles.buttonDisabled]}
                    activeOpacity={0.7}
                    onPress={handleCreateGroup}
                    disabled={!isValid || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.textPrimary} />
                    ) : (
                        <Text style={styles.buttonText}>Crear Grupo</Text>
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
    label: {
        alignSelf: 'flex-start',
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
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
