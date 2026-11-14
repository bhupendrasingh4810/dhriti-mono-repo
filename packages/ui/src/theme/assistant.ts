import { spacingScale } from "./spacing";

export const assistantTokens = {
  launcherSize: 56,
  iconSize: 20,
  panelWidth: 384,
  expandedWidth: 560,
  panelHeight: 560,
  welcomeWidth: 288,
  viewportMargin: spacingScale.lg,
  panelGap: spacingScale.md,
  dragThreshold: spacingScale.xs,
} as const;
