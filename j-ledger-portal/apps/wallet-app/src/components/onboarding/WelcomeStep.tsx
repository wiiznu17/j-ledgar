import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { AppButton } from '@/components/common/AppButton';
import { StepWrapper } from '@/components/common/StepWrapper';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WelcomeStepProps {
  visible: boolean;
  onGetStarted: () => void;
  onBackToLogin: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  visible,
  onGetStarted,
  onBackToLogin,
}) => (
  <StepWrapper visible={visible} direction="vertical">
    <View style={{ minHeight: SCREEN_HEIGHT * 0.7 }} className="items-center justify-center">
      <View className="items-center mb-12">
        <Image
          source={require('../../../assets/images/j_ledger_logo_1776536282920.png')}
          className="w-32 h-32 mb-8"
          resizeMode="contain"
        />
        <Text className="text-4xl font-manrope font-black tracking-tighter text-on-surface text-center mb-4">
          Welcome to{'\n'}J-Ledger
        </Text>
      </View>

      <View className="w-full gap-y-4">
        <AppButton
          title="Get Started"
          onPress={onGetStarted}
          icon={<ArrowRight size={20} color="white" />}
        />
        <AppButton
          title="Already have an account? Log In"
          variant="ghost"
          onPress={onBackToLogin}
        />
      </View>
    </View>
  </StepWrapper>
);
