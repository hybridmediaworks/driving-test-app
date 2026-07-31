"use client";

import DrivingTestContent from "@/components/state/DrivingTestContent";
import PermitTestContent from "@/components/state/PermitTestContent";
import { useWebLayout } from "@/lib/web-layout-context";

export default function StateTestTypeContent() {
  const { selectedTestType, hasResolvedTestType } = useWebLayout();

  // Wait until the stored test type is read from localStorage before picking
  // a track — rendering PermitTestContent by default here would flash the
  // wrong content for a frame whenever Driving Test is the active selection.
  if (!hasResolvedTestType) return null;

  return selectedTestType === "driving_test" ? <DrivingTestContent /> : <PermitTestContent />;
}
