import type { Allergen } from '@/lib/types';

export interface AllergyCheckboxProps {
  allergen: Allergen;
  checked: boolean;
  onToggle: () => void;
}

const LABELS: Record<Allergen, string> = {
  peanut: 'peanut',
  tree_nut: 'tree nut',
  shellfish: 'shellfish',
  dairy: 'dairy',
  gluten: 'gluten',
  egg: 'egg',
  soy: 'soy',
  sesame: 'sesame',
};

export function AllergyCheckbox({ allergen, checked, onToggle }: AllergyCheckboxProps) {
  const label = LABELS[allergen];
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        border: '2px solid var(--a-ink)',
        borderRadius: 14,
        background: checked ? 'var(--a-peach-deep)' : '#fff8e8',
        color: 'var(--a-ink)',
        fontWeight: 600,
        fontFamily: 'inherit',
        fontSize: 14,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: '2px solid var(--a-ink)',
          background: checked ? 'var(--a-ink)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <span style={{ color: 'var(--a-peach-deep)', fontSize: 12 }}>✓</span>}
      </span>
      {label}
    </button>
  );
}
