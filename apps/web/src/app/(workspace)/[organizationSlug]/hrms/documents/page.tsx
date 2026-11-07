"use client";

import { useHrmsToast } from "../layout";
import { HrmsDocuments } from "@/features/hrms/documents";

export default function Page() {
  const onToast = useHrmsToast();

  return <HrmsDocuments onToast={onToast} />;
}
