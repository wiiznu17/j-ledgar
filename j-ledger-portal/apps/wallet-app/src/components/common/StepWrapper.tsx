import React from 'react';
import { MotiView, AnimatePresence } from 'moti';

interface StepWrapperProps {
  children: React.ReactNode;
  visible: boolean;
  direction?: 'horizontal' | 'vertical';
}

export function StepWrapper({ children, visible, direction = 'horizontal' }: StepWrapperProps) {
  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{
            opacity: 0,
            translateX: direction === 'horizontal' ? 20 : 0,
            translateY: direction === 'vertical' ? 20 : 0,
          }}
          animate={{
            opacity: 1,
            translateX: 0,
            translateY: 0,
          }}
          exit={{
            opacity: 0,
            translateX: direction === 'horizontal' ? -20 : 0,
            translateY: direction === 'vertical' ? -20 : 0,
          }}
          transition={{
            type: 'timing',
            duration: 300,
          }}
          style={{ width: '100%' }}
        >
          {children}
        </MotiView>
      )}
    </AnimatePresence>
  );
}
