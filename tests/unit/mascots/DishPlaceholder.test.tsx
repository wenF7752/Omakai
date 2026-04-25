import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DishPlaceholder } from '@/components/mascots/DishPlaceholder';

describe('DishPlaceholder', () => {
  it('renders default props', () => {
    const { container } = render(<DishPlaceholder />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('accepts label prop and shows it', () => {
    const { getByText } = render(<DishPlaceholder label="HERO PHOTO" />);
    expect(getByText('HERO PHOTO')).toBeInTheDocument();
  });
});
