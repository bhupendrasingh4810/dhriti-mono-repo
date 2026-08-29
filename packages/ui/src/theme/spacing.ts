export const spacingScale = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
} as const;

export const spacing = (factor: number): string => `${factor * 4}px`;

export const spacingAliases = {
  pageX: spacingScale.xl,
  pageY: spacingScale.xl,
  sectionGap: spacingScale["2xl"],
  cardPadding: spacingScale.lg,
} as const;
