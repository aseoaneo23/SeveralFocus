import React, { useState } from 'react'
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'

const COLORS = {
    bg: '#1a1d24',
    surface: '#2c323d',
    label: '#8e9aaf',
    text: '#e0e1dd',
}

export default function UserCreationScreen() {
    const [apodo, setApodo] = useState('')

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar style="light" />
            <View style={styles.container}>
                <Text style={styles.label}>Nombre de Usuario</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Escribe tu apodo..."
                    placeholderTextColor={COLORS.label}
                    value={apodo}
                    onChangeText={setApodo}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <TouchableOpacity style={styles.button} activeOpacity={0.8}>
                    <Text style={styles.buttonText}>Crear Usuario</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    label: {
        color: COLORS.label,
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 0.6,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: COLORS.surface,
        color: COLORS.text,
        fontSize: 16,
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    button: {
        backgroundColor: COLORS.surface,
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
})
