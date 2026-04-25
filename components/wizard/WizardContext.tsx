'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export const WIZARD_STEPS = 5;

export interface WizardContextValue {
  currentStep: number;
  totalSteps: number;
  next: () => void;
  back: () => void;
  goTo: (step: number) => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({
  children,
  initialStep = 1,
}: {
  children: ReactNode;
  initialStep?: number;
}) {
  const [currentStep, setCurrentStep] = useState(() =>
    Math.max(1, Math.min(WIZARD_STEPS, initialStep)),
  );

  const next = useCallback(() => {
    setCurrentStep((s) => Math.min(WIZARD_STEPS, s + 1));
  }, []);
  const back = useCallback(() => {
    setCurrentStep((s) => Math.max(1, s - 1));
  }, []);
  const goTo = useCallback((s: number) => {
    setCurrentStep(Math.max(1, Math.min(WIZARD_STEPS, s)));
  }, []);

  const value = useMemo<WizardContextValue>(
    () => ({ currentStep, totalSteps: WIZARD_STEPS, next, back, goTo }),
    [currentStep, next, back, goTo],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used inside a WizardProvider');
  return ctx;
}
