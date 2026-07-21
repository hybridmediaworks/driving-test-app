"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { PassGuaranteeClaim } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Paginator from "@/components/ui/Paginator";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { api, ApiError } from "@/lib/api";

function ClaimRow({ claim, onChanged }: { claim: PassGuaranteeClaim; onChanged: () => void }) {
  const [busy, setBusy] = useState<"approve" | "deny" | "refund" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: "approve" | "deny" | "refund") {
    setBusy(action);
    setError(null);
    try {
      await api.post(`/admin/pass-guarantee-claims/${claim.id}/${action}`);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="space-y-2 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{claim.user?.name ?? "Unknown user"}</p>
          <p className="text-xs text-muted-foreground">{claim.user?.email}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{claim.status}</span>
      </div>
      {claim.proof_notes && <p className="text-sm">{claim.proof_notes}</p>}
      <p className="text-xs text-muted-foreground">
        Practice completed {claim.completed_practice_at ? new Date(claim.completed_practice_at).toLocaleDateString() : "—"}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 pt-1">
        {(claim.status === "submitted" || claim.status === "under_review") && (
          <>
            <Button onClick={() => decide("approve")} disabled={busy !== null}>
              {busy === "approve" ? "Approving…" : "Approve"}
            </Button>
            <Button variant="outline" onClick={() => decide("deny")} disabled={busy !== null}>
              {busy === "deny" ? "Denying…" : "Deny"}
            </Button>
          </>
        )}
        {claim.status === "approved" && (
          <Button onClick={() => decide("refund")} disabled={busy !== null}>
            {busy === "refund" ? "Refunding…" : "Issue refund"}
          </Button>
        )}
      </div>
    </li>
  );
}

function AdminPassGuaranteeClaimsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const { data: claims, reload } = usePaginatedList<PassGuaranteeClaim>(`/admin/pass-guarantee-claims${query ? `?${query}` : ""}`);
  const rows = claims?.data ?? [];

  function updateFilter(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.replace(`/admin/pass-guarantee-claims?${params.toString()}`);
  }

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "Pass Guarantee Claims", href: "/admin/pass-guarantee-claims" }]}>
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Pass Guarantee claims</h1>
            <p className="text-sm text-muted-foreground">Review and decide refund claims</p>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="f-status">Status</label>
            <select
              id="f-status"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={searchParams.get("status") ?? ""}
              onChange={(e) => updateFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Claims <span className="font-normal text-muted-foreground">({claims?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No claims found.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {rows.map((claim) => (
                    <ClaimRow key={claim.id} claim={claim} onChanged={reload} />
                  ))}
                </ul>
              )}
              {claims && claims.meta.total > 0 && <Paginator meta={claims.meta} />}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AdminGuard>
  );
}

export default function AdminPassGuaranteeClaimsPage() {
  return (
    <Suspense>
      <AdminPassGuaranteeClaimsInner />
    </Suspense>
  );
}
