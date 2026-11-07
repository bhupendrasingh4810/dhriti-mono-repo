"use client";

import { HrmsAssets } from "@/features/hrms/assets";
import { useHrmsToast } from "../layout";

export default function Page() {
  const onToast = useHrmsToast();

  return <HrmsAssets onToast={onToast} />;
}
