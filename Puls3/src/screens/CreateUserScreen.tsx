import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { User, ArrowRight } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { OneSignal } from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../navigation/storage';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'CreateUser'>;
};

export default function CreateUserScreen({ navigation }: Props) {
    const [userName, setUserName] = useState('');
    const [touched, setTouched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isValid = userName.trim().length >= 3;

    const handleCreateUser = async () => {
        setTouched(true);
        if (!isValid) return;

        try {
            setIsLoading(true);
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) throw error;

            const userId = data.user?.id;
            if (userId) {
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({ id: userId, username: userName });
                if (insertError) throw insertError;

                await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
                OneSignal.login(userId);

                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
        } catch (error: any) {
            console.error('Error creando usuario:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.centerContent}>
                    <View style={styles.iconCircle}>
                        <User size={48} color={COLORS.primary} />
                    </View>
                    
                    <Text style={styles.title}>¿Cómo te llamas?</Text>
                    <Text style={styles.subtitle}>
                        Este nombre será visible para tus compañeros de grupo.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Tu nombre o alias"
                        placeholderTextColor={COLORS.textMuted}
                        value={userName}
                        onChangeText={setUserName}
                        maxLength={20}
                        editable={!isLoading}
                    />

                    {touched && !isValid && (
                        <Text style={styles.errorText}>Mínimo 3 caracteres.</Text>
                    )}

                    <TouchableOpacity
                        style={[styles.primaryButton, (!isValid || isLoading) && styles.buttonDisabled]}
                        onPress={handleCreateUser}
                        disabled={!isValid || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.black} />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Continuar</Text>
                                <ArrowRight size={20} color={COLORS.black} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContent: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: `${COLORS.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: FONTS.bold as any,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xxl,
        paddingHorizontal: SPACING.lg,
    },
    input: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        color: COLORS.textPrimary,
        fontSize: 18,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 13,
        marginTop: SPACING.sm,
    },
    primaryButton: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.full,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xxl,
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: FONTS.bold as any,
        color: COLORS.black,
    },
});
