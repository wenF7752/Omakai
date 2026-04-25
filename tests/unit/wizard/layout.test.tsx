import { describe, it, expect } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { WizardProvider, useWizard, WIZARD_STEPS } from '@/components/wizard/WizardContext';

function wrapper({ children, initialStep = 1 }: { children: React.ReactNode; initialStep?: number }) {
  return <WizardProvider initialStep={initialStep}>{children}</WizardProvider>;
}

describe('WizardContext', () => {
  it('provider exposes currentStep, totalSteps, next, back', () => {
    const { result } = renderHook(() => useWizard(), { wrapper });
    expect(result.current.currentStep).toBe(1);
    expect(result.current.totalSteps).toBe(WIZARD_STEPS);
    expect(typeof result.current.next).toBe('function');
    expect(typeof result.current.back).toBe('function');
  });

  it('next() advances by 1, never exceeds totalSteps', () => {
    const { result } = renderHook(() => useWizard(), {
      wrapper: ({ children }) => wrapper({ children, initialStep: 1 }),
    });
    act(() => result.current.next());
    expect(result.current.currentStep).toBe(2);
    for (let i = 0; i < 10; i++) act(() => result.current.next());
    expect(result.current.currentStep).toBe(WIZARD_STEPS);
  });

  it('back() decreases by 1, never goes below 1', () => {
    const { result } = renderHook(() => useWizard(), {
      wrapper: ({ children }) => wrapper({ children, initialStep: 3 }),
    });
    act(() => result.current.back());
    expect(result.current.currentStep).toBe(2);
    for (let i = 0; i < 10; i++) act(() => result.current.back());
    expect(result.current.currentStep).toBe(1);
  });

  it('useWizard outside a provider throws a helpful error', () => {
    function Inner() {
      useWizard();
      return null;
    }
    expect(() => render(<Inner />)).toThrowError(/WizardProvider/);
  });

  it('nested useWizard returns the same context value', () => {
    function Child() {
      const w = useWizard();
      return <div data-testid="step">{w.currentStep}</div>;
    }
    render(
      <WizardProvider initialStep={4}>
        <Child />
      </WizardProvider>,
    );
    expect(screen.getByTestId('step').textContent).toBe('4');
  });
});
