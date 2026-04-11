import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { ShieldCheck, Users, BarChart3, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../theme';
import { STORAGE_KEYS } from '../navigation/storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    title: 'Control Total',
    description: 'Gestiona el tiempo que pasas en las aplicaciones que más te distraen.',
    icon: ShieldCheck,
    color: '#CDFF00',
  },
  {
    title: 'En Comunidad',
    description: 'Únete a grupos de rendición de cuentas y mejora junto a otros.',
    icon: Users,
    color: '#00D1FF',
  },
  {
    title: 'Mide tu Progreso',
    description: 'Visualiza tus rachas y estadísticas para mantener la motivación.',
    icon: BarChart3,
    color: '#FF453A',
  },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export default function OnboardingScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, 'true');
      navigation.replace('CreateUser');
    }
  };

  const Step = STEPS[currentStep];
  const Icon = Step.icon;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <Animated.View 
          key={`step-${currentStep}`}
          entering={SlideInRight.duration(400)}
          exiting={SlideOutLeft.duration(400)}
          style={styles.stepContainer}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${Step.color}20` }]}>
            <Icon size={80} color={Step.color} strokeWidth={1.5} />
          </View>
          
          <Text style={styles.title}>{Step.title}</Text>
          <Text style={styles.description}>{Step.description}</Text>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentStep && styles.activeDot,
                  { backgroundColor: i === currentStep ? Step.color : COLORS.surfaceLight }
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: COLORS.white }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {currentStep === STEPS.length - 1 ? 'Empezar' : 'Continuar'}
            </Text>
            <ChevronRight size={20} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: FONTS.bold as any,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: SPACING.md,
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xxl,
    left: SPACING.xl,
    right: SPACING.xl,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
  },
  button: {
    width: '100%',
    height: 60,
    borderRadius: BORDER_RADIUS.full,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: FONTS.semiBold as any,
    color: COLORS.black,
  },
});
