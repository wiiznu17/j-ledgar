import React from 'react';
import { ScrollView, Text } from 'react-native';
import { AppButton } from '@/components/common/AppButton';
import { StepWrapper } from '@/components/common/StepWrapper';
import { GlassPanel } from '@/components/common/GlassPanel';
import { StepHeader } from './StepHeader';
import { TERMS_AND_CONDITIONS } from '@/constants/mockData';

interface TermsStepProps {
  visible: boolean;
  isLoading: boolean;
  onAccept: () => void;
}

export const TermsStep: React.FC<TermsStepProps> = ({ visible, isLoading, onAccept }) => (
  <StepWrapper visible={visible}>
    <StepHeader title="Terms of Service" subtitle="Please accept our terms to continue." />
    <GlassPanel className="h-[300] mb-8" intensity={10}>
      <ScrollView>
        <Text className="text-xs font-manrope font-medium leading-relaxed p-4">
          {TERMS_AND_CONDITIONS}
        </Text>
      </ScrollView>
    </GlassPanel>
    <AppButton title="Accept and Continue" loading={isLoading} onPress={onAccept} />
  </StepWrapper>
);
