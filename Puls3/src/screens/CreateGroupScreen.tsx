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
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Plus, Clock, Users as UsersIcon } from 'lucide-react-native';
import { createGroup } from '../services/groupService';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../navigation/storage';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'CreateGroup'>;
};

export default function CreateGroupScreen({ navigation }: Props) {
    const [groupName, setGroupName] = useState('');
    const [bannedAppsInput, setBannedAppsInput] = useState('');
    const [timePerPerson, setTimePerPerson] = useState('60');
    const [maxMembers, setMaxMembers] = useState('10');
    const [touched, setTouched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isNameValid = groupName.trim().length > 0;
    const isAppsValid = bannedAppsInput.trim().length > 0;
    const isValid = isNameValid && isAppsValid;

    const handleCreateGroup = async () => {
        setTouched(true);
        if (!isValid) return;

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Debes estar autenticado para crear un grupo');

            const bannedAppsArray = bannedAppsInput
                .split(',')
                .map(app => app.trim())
                .filter(app => app.length > 0);

            const group = await createGroup({
                name: groupName,
                bannedApps: bannedAppsArray,
                timePerPerson: parseInt(timePerPerson) || 60,
                maxMembers: parseInt(maxMembers) || 10,
                isPublic: true,
                createdBy: user.id,
            });

            await AsyncStorage.setItem(STORAGE_KEYS.GROUP_ID, group.id);
            navigation.replace('GroupDetail');
        } catch (error: any) {
            Alert.alert("Error", error.message || "Ocurrió un error al crear el grupo");
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
                <Text style={styles.headerTitle}>Nuevo Grupo</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>Nombre del Grupo</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: High Focus Productivity"
                        placeholderTextColor={COLORS.textMuted}
                        value={groupName}
                        onChangeText={setGroupName}
                        editable={!isLoading}
                    />

                    <Text style={styles.label}>Apps Prohibidas</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="Instagram, TikTok, YouTube..."
                        placeholderTextColor={COLORS.textMuted}
                        value={bannedAppsInput}
                        onChangeText={setBannedAppsInput}
                        multiline
                        editable={!isLoading}
                    />
                    <Text style={styles.hint}>Separa los nombres de las aplicaciones con comas.</Text>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Tiempo (min)</Text>
                            <View style={styles.inputWithIcon}>
                                <Clock size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.smallInput}
                                    value={timePerPerson}
                                    onChangeText={setTimePerPerson}
                                    keyboardType="numeric"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>
                        <View style={{ width: SPACING.lg }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Máx miembros</Text>
                            <View style={styles.inputWithIcon}>
                                <UsersIcon size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.smallInput}
                                    value={maxMembers}
                                    onChangeText={setMaxMembers}
                                    keyboardType="numeric"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>
                    </View>

                    {touched && !isValid && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>
                                {!isNameValid ? '• El nombre es obligatorio\n' : ''}
                                {!isAppsValid ? '• Añade al menos una app' : ''}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.createButton, (!isValid || isLoading) && styles.buttonDisabled]}
                        onPress={handleCreateGroup}
                        disabled={!isValid || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.black} />
                        ) : (
                            <>
                                <Text style={styles.createButtonText}>Crear Grupo</Text>
                                <Plus size={20} color={COLORS.black} />
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
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
    scrollContent: { padding: SPACING.lg },
    label: {
        fontSize: 14,
        fontWeight: FONTS.medium as any,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        color: COLORS.textPrimary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    hint: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    row: { flexDirection: 'row', marginTop: SPACING.md },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingLeft: SPACING.md,
    },
    inputIcon: { marginRight: SPACING.xs },
    smallInput: {
        flex: 1,
        padding: SPACING.md,
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    errorBox: {
        marginTop: SPACING.lg,
        padding: SPACING.md,
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        borderRadius: BORDER_RADIUS.md,
    },
    errorText: { color: COLORS.error, fontSize: 13, lineHeight: 18 },
    createButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.full,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xxl,
        gap: 8,
    },
    buttonDisabled: { opacity: 0.5 },
    createButtonText: { fontSize: 18, fontWeight: FONTS.bold as any, color: COLORS.black },
});
