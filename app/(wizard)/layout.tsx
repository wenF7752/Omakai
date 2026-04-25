import type { ReactNode } from 'react';
import { WizardProvider } from '@/components/wizard/WizardContext';

export default function WizardLayout({ children }: { children: ReactNode }) {
  return <WizardProvider>{children}</WizardProvider>;
}
