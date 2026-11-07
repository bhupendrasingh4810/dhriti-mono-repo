"use client";

import { useHrmsToast } from "../layout";
import { HrmsLeave } from "@/features/hrms/leave";

export default function Page() {
  const onToast = useHrmsToast();

  return <HrmsLeave onToast={onToast} />;
}
