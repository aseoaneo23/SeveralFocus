import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { OneSignal } from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../navigation/storage';

// ─── Paleta de colores ───────────────────────────────────────
const COLORS = {
    background: '#1a1d24',
    surface: '#2c323d',
    textPrimary: '#e0e1dd',
    textSecondary: '#8e9aaf',
};

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'CreateUser'>;
};

export default function CreateUserScreen({ navigation }: Props) {
    const [userName, setUserName] = useState('');
    const [touched, setTouched] = useState(false);
    const isValid = userName.trim().length > 0;

    // Espacio para integración con el Backend
    const handleCreateUser = async () => {
        setTouched(true);
        if (!isValid) return;

        try {
            // 1. Iniciar sesión anónimamente en Auth
            const { data, error } = await supabase.auth.signInAnonymously();
            
            if (error) throw error;

            const userId = data.user?.id;

            if (userId) {
                // 2. Insertar el usuario en tu tabla pública "users"
                await supabase.from('users').upsert({ id: userId, username: userName });

                // 3. Guardar persistencia de sesión en AsyncStorage
                await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);

                // 4. Registrar este dispositivo en OneSignal con el UUID real
                OneSignal.login(userId);

                // 5. Navegar al Home
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
        } catch (error: any) {
            console.error('Error creando usuario:', error.message);
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
                <Text style={styles.title}>Nombre de Usuario</Text>

                {/* ── Input ── */}
                <TextInput
                    style={styles.input}
                    placeholder="Escribe tu nombre..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={userName}
                    onChangeText={setUserName}
                />

                {/* ── Error ── */}
                {touched && !isValid && (
                    <Text style={styles.errorText}>El nombre no puede estar vacío</Text>
                )}

                {/* ── Botón ── */}
                <TouchableOpacity
                    style={[styles.button, !isValid && styles.buttonDisabled]}
                    activeOpacity={0.7}
                    onPress={handleCreateUser}
                    disabled={!isValid}
                >
                    <Text style={styles.buttonText}>Crear Usuario</Text>
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
