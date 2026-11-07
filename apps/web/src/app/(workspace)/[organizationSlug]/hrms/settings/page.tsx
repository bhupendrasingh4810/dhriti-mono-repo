"use client";

import { useHrmsToast } from "../layout";
import { HrmsSettings } from "@/features/hrms/settings";

export default function Page() {
  const onToast = useHrmsToast();

  return <HrmsSettings onToast={onToast} />;
}
