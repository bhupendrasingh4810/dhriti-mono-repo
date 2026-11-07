"use client";

import { Badge, Button, Card, CardTitle, Icon } from "./ui-primitives";

const data: Record<string, string[][]> = {
  Departments: [
    ["Engineering", "168 employees", "Rohan Kapoor"],
    ["Product & Design", "74 employees", "Meera Iyer"],
    ["People", "26 employees", "Neha Mehta"],
    ["Finance", "38 employees", "Priya Verma"],
  ],
  Designations: [
    ["Software Engineer", "82 employees", "Engineering"],
    ["Product Manager", "18 employees", "Product"],
    ["People Partner", "8 employees", "People"],
    ["Finance Analyst", "14 employees", "Finance"],
  ],
  Locations: [
    ["Bengaluru", "214 employees", "India"],
    ["Hyderabad", "108 employees", "India"],
    ["Mumbai", "84 employees", "India"],
    ["Remote", "80 employees", "Multiple"],
  ],
  "Employment types": [
    ["Full-time", "438 employees", "Active"],
    ["Contract", "28 employees", "Active"],
    ["Intern", "14 employees", "Active"],
    ["Part-time", "6 employees", "Active"],
  ],
};

export function EmployeeMasterData({ type, onToast }: { type: string; onToast: (message: string) => void }) {
  return (
    <Card className="overflow-hidden">
      <CardTitle
        title={type}
        subtitle={`Manage organization ${type.toLowerCase()}`}
        action={
          <Button icon="plus" onClick={() => onToast(`Create ${type.toLowerCase()} form opened`)}>
            Add {type.replace(/s$/, "")}
          </Button>
        }
      />
      <div className="divide-y divide-border">
        {(data[type] ?? []).map((row) => (
          <div key={row[0]} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-muted text-brand">
              <Icon name={type === "Locations" ? "grid" : "users"} size={17} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{row[0]}</p>
              <p className="text-xs text-text-muted">{row[1]}</p>
            </div>
            <Badge>{row[2]}</Badge>
            <Button variant="ghost" icon="dots">
              Manage
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
