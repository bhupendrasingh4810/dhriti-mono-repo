export type DensityMode = "compact" | "comfortable" | "spacious";

export type DensityScale = {
  controlHeight: number;
  buttonHeight: Record<"small" | "medium" | "large", number>;
  buttonLoaderSize: Record<"small" | "medium" | "large", number>;
  inputPaddingY: number;
  menuItemMinHeight: number;
  listItemMinHeight: number;
  tableCellPaddingY: number;
  cardPadding: number;
};

export const densityScale: Record<DensityMode, DensityScale> = {
  compact: {
    controlHeight: 32,
    buttonHeight: { small: 28, medium: 32, large: 40 },
    buttonLoaderSize: { small: 16, medium: 20, large: 24 },
    inputPaddingY: 7,
    menuItemMinHeight: 32,
    listItemMinHeight: 32,
    tableCellPaddingY: 8,
    cardPadding: 12,
  },
  comfortable: {
    controlHeight: 38,
    buttonHeight: { small: 32, medium: 38, large: 44 },
    buttonLoaderSize: { small: 16, medium: 20, large: 24 },
    inputPaddingY: 10,
    menuItemMinHeight: 38,
    listItemMinHeight: 38,
    tableCellPaddingY: 12,
    cardPadding: 16,
  },
  spacious: {
    controlHeight: 44,
    buttonHeight: { small: 36, medium: 44, large: 52 },
    buttonLoaderSize: { small: 16, medium: 20, large: 24 },
    inputPaddingY: 12,
    menuItemMinHeight: 44,
    listItemMinHeight: 44,
    tableCellPaddingY: 16,
    cardPadding: 20,
  },
};
