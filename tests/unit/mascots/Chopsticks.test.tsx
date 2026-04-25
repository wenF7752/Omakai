import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Chopsticks } from '@/components/mascots/Chopsticks';

describe('Chopsticks', () => {
  it('renders default props', () => {
    const { container } = render(<Chopsticks />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('accepts color prop → at least one rect uses the custom color', () => {
    const { container } = render(<Chopsticks color="#ff0000" />);
    const rects = container.querySelectorAll('rect');
    const reddish = Array.from(rects).find((r) => r.getAttribute('fill') === '#ff0000');
    expect(reddish).toBeDefined();
  });
});
