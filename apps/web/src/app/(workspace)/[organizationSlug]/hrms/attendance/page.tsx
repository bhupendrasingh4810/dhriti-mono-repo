"use client";

import { HrmsAttendance } from "@/features/hrms/attendance";
import { useHrmsToast } from "../layout";

export default function Page() {
  const onToast = useHrmsToast();

  return <HrmsAttendance onToast={onToast} />;
}
