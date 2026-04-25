import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stepper } from '@/components/wizard/Stepper';
import { Chip } from '@/components/wizard/Chip';
import { BudgetCard } from '@/components/wizard/BudgetCard';
import { AllergyCheckbox } from '@/components/wizard/AllergyCheckbox';

describe('Stepper', () => {
  it('renders total bars and counter', () => {
    const { container } = render(<Stepper step={2} total={5} />);
    const bars = container.querySelectorAll('[data-stepper-bar]');
    expect(bars).toHaveLength(5);
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('marks the right number of bars as filled', () => {
    const { container } = render(<Stepper step={3} total={5} />);
    const filled = container.querySelectorAll('[data-stepper-bar="filled"]');
    expect(filled).toHaveLength(3);
  });
});

describe('Chip', () => {
  it('fires onToggle on click', async () => {
    const onToggle = vi.fn();
    render(
      <Chip active={false} onToggle={onToggle}>
        spicy
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button', { name: /spicy/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('active=true applies aria-pressed and rotation styling', () => {
    render(
      <Chip active={true} onToggle={() => {}}>
        spicy
      </Chip>,
    );
    const btn = screen.getByRole('button', { name: /spicy/i });
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.style.transform).toMatch(/rotate/);
  });

  it('color prop overrides default background when active', () => {
    render(
      <Chip active={true} onToggle={() => {}} color="#abcdef">
        spicy
      </Chip>,
    );
    const btn = screen.getByRole('button', { name: /spicy/i });
    expect(btn.style.background).toContain('rgb(171, 205, 239)');
  });
});

describe('BudgetCard', () => {
  it('selected=true applies tilt rotation + filled background', () => {
    render(
      <BudgetCard
        tier="$$"
        label="comfort zone"
        range="$15-30"
        emoji="🍣"
        selected
        onSelect={() => {}}
      />,
    );
    const btn = screen.getByRole('button', { name: /comfort zone/i });
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('data-selected')).toBe('true');
    expect(btn.style.transform).toMatch(/rotate/);
  });

  it('fires onSelect on click', async () => {
    const onSelect = vi.fn();
    render(
      <BudgetCard
        tier="$"
        label="cheap eats"
        range="under $15"
        emoji="🌶"
        selected={false}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /cheap eats/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('AllergyCheckbox', () => {
  it('checked=true renders the checkmark', () => {
    render(<AllergyCheckbox allergen="peanut" checked={true} onToggle={() => {}} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('checked=false omits the checkmark', () => {
    render(<AllergyCheckbox allergen="peanut" checked={false} onToggle={() => {}} />);
    expect(screen.queryByText('✓')).toBeNull();
  });

  it('fires onToggle on click anywhere in the button', async () => {
    const onToggle = vi.fn();
    render(<AllergyCheckbox allergen="peanut" checked={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /peanut/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('exposes aria-checked reflecting state', () => {
    render(<AllergyCheckbox allergen="peanut" checked={true} onToggle={() => {}} />);
    expect(screen.getByRole('checkbox', { name: /peanut/i }).getAttribute('aria-checked')).toBe(
      'true',
    );
  });
});
