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
import type { RootStackParamList } from '../../App';

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

    // Espacio para integración con el Backend
    const handleCreateUser = () => {
        console.log('Nombre del usuario:', userName);
        navigation.replace('Home');
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

                {/* ── Botón ── */}
                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.7}
                    onPress={handleCreateUser}
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
    buttonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
});
