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
    const [touched, setTouched] = useState(false);
    const isValid = groupName.trim().length > 0;

    // Espacio para integración con el Backend
    const handleCreateGroup = () => {
        setTouched(true);
        if (!isValid) return;
        console.log('Nombre del grupo:', groupName);
        navigation.navigate('GroupDetail');
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
                    placeholder="Escribe el nombre del grupo..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={groupName}
                    onChangeText={setGroupName}
                />

                {/* ── Error ── */}
                {touched && !isValid && (
                    <Text style={styles.errorText}>El nombre no puede estar vacío</Text>
                )}

                {/* ── Botón ── */}
                <TouchableOpacity
                    style={[styles.button, !isValid && styles.buttonDisabled]}
                    activeOpacity={0.7}
                    onPress={handleCreateGroup}
                    disabled={!isValid}
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
