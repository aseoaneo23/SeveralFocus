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

// ─── Paleta de colores ───────────────────────────────────────
const COLORS = {
    background: '#1a1d24',
    surface: '#2c323d',
    textPrimary: '#e0e1dd',
    textSecondary: '#8e9aaf',
};

export default function HomeScreen() {
    const [groupName, setGroupName] = useState('');

    // Espacio para integración con el Backend
    const handleCreateGroup = () => {
        console.log('Nombre del grupo:', groupName);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="light" />

            <View style={styles.content}>
                {/* ── Título ── */}
                <Text style={styles.title}>Nombre de Grupo</Text>

                {/* ── Input ── */}
                <TextInput
                    style={styles.input}
                    placeholder="Escribe el nombre..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={groupName}
                    onChangeText={setGroupName}
                />

                {/* ── Botón ── */}
                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.7}
                    onPress={handleCreateGroup}
                >
                    <Text style={styles.buttonText}>Crear Grupo</Text>
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
