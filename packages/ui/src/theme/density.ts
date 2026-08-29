export type DensityMode = "compact" | "comfortable" | "spacious";

export type DensityScale = {
  controlHeight: number;
  inputPaddingY: number;
  menuItemMinHeight: number;
  listItemMinHeight: number;
  tableCellPaddingY: number;
  cardPadding: number;
};

export const densityScale: Record<DensityMode, DensityScale> = {
  compact: {
    controlHeight: 32,
    inputPaddingY: 7,
    menuItemMinHeight: 32,
    listItemMinHeight: 32,
    tableCellPaddingY: 8,
    cardPadding: 12,
  },
  comfortable: {
    controlHeight: 38,
    inputPaddingY: 10,
    menuItemMinHeight: 38,
    listItemMinHeight: 38,
    tableCellPaddingY: 12,
    cardPadding: 16,
  },
  spacious: {
    controlHeight: 44,
    inputPaddingY: 12,
    menuItemMinHeight: 44,
    listItemMinHeight: 44,
    tableCellPaddingY: 16,
    cardPadding: 20,
  },
};
