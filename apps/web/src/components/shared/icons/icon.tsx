import type { CSSProperties } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

const icons = {
  add: Plus,
  arrowDown: ArrowDown,
  arrowUp: ArrowUp,
  arrowUpDown: ArrowUpDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  close: X,
  delete: Trash2,
  edit: Pencil,
  save: Save,
  view: Eye,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 18,
  color = "currentColor",
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  const IconComponent = icons[name];

  return <IconComponent aria-hidden="true" color={color} size={size} style={style} />;
}
