"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/**
 * The learner's own target date for the official written exam, and saving changes to it
 * (PUT /me/exam-date). Shared by the progress sidebar's pencil and the signed-in hero's
 * "Reschedule exam date", so both write through the same path and both see the update immediately
 * — the saved value goes straight back into the auth context rather than waiting for a refetch.
 */
export function useExamDate(): {
  examDate: string | null;
  save: (next: string | null) => Promise<boolean>;
  saving: boolean;
  error: string | null;
} {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string | null): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await api.put<{ exam_date: string | null }>("/me/exam-date", {
        exam_date: next || null,
      });
      if (user) setUser({ ...user, exam_date: res.exam_date });
      return true;
    } catch {
      setError("Couldn't save that date. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { examDate: user?.exam_date ?? null, save, saving, error };
}
