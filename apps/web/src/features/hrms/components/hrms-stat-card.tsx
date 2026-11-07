"use client";

import { Badge, Card, Icon, type IconName } from "./ui-primitives";

export type HrmsStat = {
  label: string;
  value: string;
  meta: string;
  icon: IconName;
  tone: string;
};

export function HrmsStatCard({ item }: { item: HrmsStat }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${item.tone}`}>
          <Icon name={item.icon} size={20} />
        </div>
        <Badge tone="success">
          <Icon name="trend" size={12} className="mr-1" />
          Live
        </Badge>
      </div>
      <p className="mt-5 text-sm font-medium text-text-secondary">{item.label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-text-primary">{item.value}</p>
      <p className="mt-1 text-xs text-text-muted">{item.meta}</p>
    </Card>
  );
}
