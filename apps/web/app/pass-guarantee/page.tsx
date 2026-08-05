"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { PassGuaranteeClaim } from "@driving-test-app/shared";
import AppLayout from "@/components/app/AppLayout";
import Button from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  denied: "Denied",
  refunded: "Refunded",
};

export default function PassGuaranteePage() {
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [claims, setClaims] = useState<PassGuaranteeClaim[] | null>(null);
  const [proofNotes, setProofNotes] = useState("");
  const [examDate, setExamDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function load() {
    api.get<{ eligible: boolean; reason: string | null }>("/pass-guarantee/eligibility").then((res) => {
      setEligible(res.eligible);
      setReason(res.reason);
    });
    api.get<{ data: PassGuaranteeClaim[] }>("/pass-guarantee/claims").then((res) => setClaims(res.data));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/pass-guarantee/claims", {
        proof_notes: proofNotes || undefined,
        exam_date: examDate || undefined,
      });
      setProofNotes("");
      setExamDate("");
      load();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't submit your claim. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasOpenClaim = claims?.some((c) => c.status === "submitted" || c.status === "under_review") ?? false;

  return (
    <AppLayout breadcrumbs={[{ title: "Pass Guarantee", href: "/pass-guarantee" }]}>
      <div className="app-page space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Pass Guarantee</h1>
          <p className="text-sm text-muted-foreground">
            Complete an Exam Simulator attempt on an active plan and still don&apos;t pass your official test? Submit a
            claim below.
          </p>
        </div>

        {eligible === false && reason && !hasOpenClaim && (
          <div className="rounded-2xl border bg-muted p-5 text-sm">{reason}</div>
        )}

        {eligible === true && !hasOpenClaim && (
          <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-2xl border p-5">
            <div className="grid gap-2">
              <Label htmlFor="exam_date">Official exam date (optional)</Label>
              <input
                id="exam_date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="proof_notes">Tell us what happened</Label>
              <Textarea
                id="proof_notes"
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                placeholder="I practiced with the Exam Simulator but still didn't pass my official test on..."
              />
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit claim"}
            </Button>
          </form>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Your claims</h2>
          {claims && claims.length === 0 && <p className="text-sm text-muted-foreground">No claims submitted yet.</p>}
          {claims?.map((claim) => (
            <div key={claim.id} className="space-y-1 rounded-xl border p-4 text-sm">
              <p className="font-medium">{STATUS_LABELS[claim.status] ?? claim.status}</p>
              <p className="text-muted-foreground">Submitted {new Date(claim.created_at).toLocaleDateString()}</p>
              {claim.admin_notes && <p className="pt-1">{claim.admin_notes}</p>}
              {claim.refund_amount_cents !== null && (
                <p className="text-green-700">Refunded ${(claim.refund_amount_cents / 100).toFixed(2)}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
