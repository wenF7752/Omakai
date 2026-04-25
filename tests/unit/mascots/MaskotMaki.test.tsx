import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MaskotMaki } from '@/components/mascots/MaskotMaki';

describe('MaskotMaki', () => {
  it('renders default props (mood=happy)', () => {
    const { container } = render(<MaskotMaki />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders mood='thinking' with circle eyes (snapshot differs from default)", () => {
    const { container: happy } = render(<MaskotMaki mood="happy" />);
    const { container: thinking } = render(<MaskotMaki mood="thinking" />);
    expect(thinking.innerHTML).not.toBe(happy.innerHTML);
    expect(thinking.querySelectorAll('circle[r="2"]').length).toBeGreaterThanOrEqual(2);
  });

  it('accepts size prop → root <svg> has width and height equal to prop', () => {
    const { container } = render(<MaskotMaki size={120} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('120');
    expect(svg?.getAttribute('height')).toBe('120');
  });

  it('accepts style prop → root <svg> has matching inline style', () => {
    const { container } = render(<MaskotMaki style={{ marginTop: 16 }} />);
    const svg = container.querySelector('svg');
    expect((svg as SVGSVGElement | null)?.style.marginTop).toBe('16px');
  });
});
