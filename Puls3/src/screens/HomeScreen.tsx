import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

// ─── Paleta de colores ───────────────────────────────────────
const COLORS = {
    background: '#1a1d24',
    surface: '#2c323d',
    textPrimary: '#e0e1dd',
    textSecondary: '#8e9aaf',
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
    // Espacio para integración con el Backend
    const handleCreateGroup = () => {
        console.log('Navegando a Crear Grupo...');
        navigation.navigate('CreateGroup');
    };

    // Espacio para integración con el Backend
    const handleJoinGroup = () => {
        console.log('Navegando a Unirse a Grupo...');
        navigation.navigate('JoinGroup');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.content}>
                {/* ── Título ── */}
                <Text style={styles.title}>Grupo</Text>

                {/* ── Subtítulo ── */}
                <Text style={styles.subtitle}>
                    Selecciona una opción para comenzar
                </Text>

                {/* ── Botón Crear Grupo ── */}
                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.7}
                    onPress={handleCreateGroup}
                >
                    <Text style={styles.buttonText}>Crear Grupo</Text>
                </TouchableOpacity>

                {/* ── Botón Unirse a un Grupo ── */}
                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.7}
                    onPress={handleJoinGroup}
                >
                    <Text style={styles.buttonText}>Unirse a un Grupo</Text>
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
    buttonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
});
