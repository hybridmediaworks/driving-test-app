"use client";

import { Suspense, useState } from "react";
import type { ImageRegeneration } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AuthImage from "@/components/admin/AuthImage";
import Lightbox from "@/components/admin/Lightbox";
import AppLayout from "@/components/app/AppLayout";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Paginator from "@/components/ui/Paginator";
import { usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";
import { api, ApiError } from "@/lib/api";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="aspect-[1080/420] w-full overflow-hidden rounded-md border border-border bg-muted">{children}</div>
  );
}

function ApprovalRow({
  row,
  onChanged,
  onPreview,
}: {
  row: ImageRegeneration;
  onChanged: () => void;
  onPreview: (src: string) => void;
}) {
  const [busy, setBusy] = useState<"approve" | "reject" | "generate" | "upload" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "approve" | "reject" | "generate" | "upload", fn: () => Promise<unknown>) {
    setBusy(action);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  const decide = (action: "approve" | "reject") =>
    run(action, () => api.post(`/admin/image-approvals/${row.id}/${action}`));

  const generate = () => run("generate", () => api.post(`/admin/image-approvals/${row.id}/generate`));

  function upload(file: File) {
    const formData = new FormData();
    formData.append("image", file);
    return run("upload", () => api.post(`/admin/image-approvals/${row.id}/upload`, formData));
  }

  const isApproved = row.status === "approved" && row.has_backup;

  return (
    <li className="grid gap-4 p-4 sm:grid-cols-[1fr_1fr_minmax(180px,auto)] sm:items-start">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Original</p>
        <Frame>
          {isApproved ? (
            // The live original file was overwritten on approval — show the backed-up pre-approval one.
            <AuthImage
              path={`/admin/image-approvals/${row.id}/backup`}
              alt="Original (backed up)"
              className="h-full w-full cursor-zoom-in object-cover"
              onClick={onPreview}
            />
          ) : row.original_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.original_url}
              alt="Original"
              className="h-full w-full cursor-zoom-in object-cover"
              onClick={() => onPreview(row.original_url as string)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
        </Frame>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Regenerated</p>
        <Frame>
          {isApproved && row.original_url ? (
            // After approval the approved image IS the live original (cache-bust so it refreshes).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${row.original_url}?v=${row.attempts}`}
              alt="Regenerated (approved)"
              className="h-full w-full cursor-zoom-in object-cover"
              onClick={() => onPreview(`${row.original_url}?v=${row.attempts}`)}
            />
          ) : row.has_candidate ? (
            <AuthImage
              // `attempts` changes on every regenerate/upload; it busts the cache so the new candidate
              // loads without a manual refresh (the /candidate URL itself is otherwise stable).
              path={`/admin/image-approvals/${row.id}/candidate?v=${row.attempts}`}
              alt="Regenerated"
              className="h-full w-full cursor-zoom-in object-cover"
              onClick={onPreview}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              {row.status === "failed" ? "Generation failed" : "Not generated yet"}
            </div>
          )}
        </Frame>
      </div>

      <div className="space-y-2">
        <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
          {row.status.replace("_", " ")}
        </span>
        <p className="text-xs text-muted-foreground">Used in {row.usage_count} questions</p>
        {row.error && <p className="text-xs text-destructive">{row.error}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-2 pt-1">
          <Button variant="outline" onClick={generate} disabled={busy !== null}>
            {busy === "generate" ? "Generating…" : row.has_candidate ? "Regenerate" : "Generate"}
          </Button>

          <label
            className={`inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted ${
              busy !== null ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {busy === "upload" ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={busy !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
          </label>

          {row.has_candidate && (
            <div className="flex gap-2">
              <Button onClick={() => decide("approve")} disabled={busy !== null}>
                {busy === "approve" ? "Approving…" : "Approve"}
              </Button>
              <Button variant="outline" onClick={() => decide("reject")} disabled={busy !== null}>
                {busy === "reject" ? "Rejecting…" : "Reject"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function AdminImageApprovalsInner() {
  const { searchParams, filterQuery, page, updateFilter, setPage } = useUrlQuery();
  const [preview, setPreview] = useState<string | null>(null);

  const { data: rows, reload } = usePaginatedList<ImageRegeneration>(
    `/admin/image-approvals${filterQuery ? `?${filterQuery}` : ""}`,
    page,
  );
  const items = rows?.data ?? [];

  return (
    <AdminGuard>
      <AppLayout
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Image Approvals", href: "/admin/image-approvals" },
        ]}
      >
        <div className="app-page">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold">Image approvals</h1>
            <p className="text-sm text-muted-foreground">
              Review AI-regenerated quiz images. Approving replaces the original everywhere it&apos;s used (the
              original is backed up); rejecting queues it for another pass.
            </p>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="f-status">
              Status
            </label>
            <select
              id="f-status"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={searchParams.get("status") ?? "awaiting_review"}
              onChange={(e) => updateFilter("status", e.target.value)}
            >
              <option value="awaiting_review">Awaiting review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="all">All</option>
            </select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Images <span className="font-normal text-muted-foreground">({rows?.meta.total ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 ? (
                <div className="text-sm text-muted-foreground">No images found.</div>
              ) : (
                <ul className="divide-y divide-border rounded-md border">
                  {items.map((row) => (
                    <ApprovalRow key={row.id} row={row} onChanged={reload} onPreview={setPreview} />
                  ))}
                </ul>
              )}
              {rows && rows.meta.total > 0 && <Paginator meta={rows.meta} onPageChange={setPage} />}
            </CardContent>
          </Card>
        </div>

        <Lightbox src={preview} onClose={() => setPreview(null)} />
      </AppLayout>
    </AdminGuard>
  );
}

export default function AdminImageApprovalsPage() {
  return (
    <Suspense>
      <AdminImageApprovalsInner />
    </Suspense>
  );
}
