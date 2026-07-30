import { describe, expect, it } from 'vitest';

import { designTokens } from '@/styles/design-tokens';

describe('design tokens', () => {
  it('locks the approved emerald and semantic status colors', () => {
    expect(designTokens.colors.emerald[500]).toBe('#288848');
    expect(designTokens.colors.neutral[50]).toBe('#F8F9F9');
    expect(designTokens.semantic.primary).toBe('#288848');
    expect(designTokens.semantic.minimum).toBe('#F59E0B');
    expect(designTokens.semantic.recovery).toBe('#8B5CF6');
    expect(designTokens.semantic.danger).toBe('#EF4444');
  });

  it('locks responsive breakpoints and accessible target sizes', () => {
    expect(designTokens.breakpoints.desktopNavigation).toBe(1024);
    expect(designTokens.sizing.pointerTarget).toBe(40);
    expect(designTokens.sizing.touchTarget).toBe(44);
    expect(designTokens.sizing.mobilePrimaryAction).toBe(48);
  });
});
