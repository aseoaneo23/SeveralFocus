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
    SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Hash, ArrowRight } from 'lucide-react-native';
import { joinGroup } from '../services/groupService';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../navigation/storage';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'JoinGroup'>;
};

export default function JoinGroupsScreen({ navigation }: Props) {
    const [groupCode, setGroupCode] = useState('');
    const [touched, setTouched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isValid = groupCode.trim().length >= 6; // Assuming 6 chars min

    const handleJoinGroup = async () => {
        setTouched(true);
        if (!isValid) return;

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Debes estar autenticado para unirte a un grupo');

            const group = await joinGroup(groupCode.trim().toUpperCase(), user.id);
            await AsyncStorage.setItem(STORAGE_KEYS.GROUP_ID, group.id);
            navigation.replace('GroupDetail');
        } catch (error: any) {
            Alert.alert("Error", error.message || "Ocurrió un error al unirse");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={COLORS.textPrimary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Unirse a Grupo</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Hash size={48} color={COLORS.primary} />
                    </View>
                    
                    <Text style={styles.title}>Código de Invitación</Text>
                    <Text style={styles.subtitle}>
                        Ingresa el código de 6 dígitos que te proporcionó el creador del grupo.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="ABC123"
                        placeholderTextColor={COLORS.textMuted}
                        value={groupCode}
                        onChangeText={setGroupCode}
                        autoCapitalize="characters"
                        maxLength={6}
                        editable={!isLoading}
                    />

                    {touched && !isValid && (
                        <Text style={styles.errorText}>Ingresa un código válido de 6 caracteres.</Text>
                    )}

                    <TouchableOpacity
                        style={[styles.joinButton, (!isValid || isLoading) && styles.buttonDisabled]}
                        onPress={handleJoinGroup}
                        disabled={!isValid || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.black} />
                        ) : (
                            <>
                                <Text style={styles.joinButtonText}>Unirse ahora</Text>
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
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: FONTS.bold as any,
        color: COLORS.textPrimary,
        marginLeft: SPACING.md,
    },
    content: {
        flex: 1,
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: `${COLORS.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: FONTS.bold as any,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xxl,
    },
    input: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        color: COLORS.textPrimary,
        fontSize: 32,
        fontWeight: FONTS.bold as any,
        textAlign: 'center',
        letterSpacing: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    errorText: { color: COLORS.error, fontSize: 13, marginTop: SPACING.sm },
    joinButton: {
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
    buttonDisabled: { opacity: 0.5 },
    joinButtonText: { fontSize: 18, fontWeight: FONTS.bold as any, color: COLORS.black },
});
