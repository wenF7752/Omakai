import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StickerBadge } from '@/components/mascots/StickerBadge';

describe('StickerBadge', () => {
  it('renders with required text prop', () => {
    const { container } = render(<StickerBadge text="ORDER NOW" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('text appears inside <textPath> element', () => {
    const { container } = render(<StickerBadge text="OMAKAI" />);
    const textPath = container.querySelector('textPath');
    expect(textPath).not.toBeNull();
    expect(textPath?.textContent).toContain('OMAKAI');
  });

  it('color and textColor props override defaults → outer <circle> fill matches color prop', () => {
    const { container } = render(
      <StickerBadge text="HI" color="#123456" textColor="#abcdef" />,
    );
    const circles = container.querySelectorAll('circle');
    const filled = Array.from(circles).find((c) => c.getAttribute('fill') === '#123456');
    expect(filled).toBeDefined();
    const outlined = Array.from(circles).find((c) => c.getAttribute('stroke') === '#abcdef');
    expect(outlined).toBeDefined();
  });
});
