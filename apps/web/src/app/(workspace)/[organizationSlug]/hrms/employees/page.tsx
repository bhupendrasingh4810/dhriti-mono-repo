"use client";

import { useHrmsToast } from "../layout";
import { hrmsDemoData } from "@/features/hrms/demo-data";
import { HrmsEmployees } from "@/features/hrms/employees";

export default function Page() {
  const onToast = useHrmsToast();

  return (
    <HrmsEmployees
      employees={hrmsDemoData.employees}
      onAdd={() => onToast("Add employee opened")}
      onToast={onToast}
    />
  );
}
