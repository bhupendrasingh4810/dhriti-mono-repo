"use client";

import { useHrmsToast } from "../layout";
import { HrmsRecruitment } from "@/features/hrms/recruitment";

export default function Page() {
  const onToast = useHrmsToast();

  return <HrmsRecruitment onToast={onToast} />;
}
