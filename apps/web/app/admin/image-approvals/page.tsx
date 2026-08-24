"use client";

import { Suspense, useState } from "react";
import { Check, RefreshCw, Trash2, Upload, X, type LucideIcon } from "lucide-react";
import type { ImageRegeneration } from "@driving-test-app/shared";
import AdminGuard from "@/components/admin/AdminGuard";
import AuthImage from "@/components/admin/AuthImage";
import Lightbox from "@/components/admin/Lightbox";
import AppLayout from "@/components/app/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Paginator from "@/components/ui/Paginator";
import { usePaginatedList, useUrlQuery } from "@/hooks/use-paginated-list";
import { api, ApiError } from "@/lib/api";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="aspect-[1080/420] w-full overflow-hidden rounded-md border border-border bg-muted">{children}</div>
  );
}

function ActionIcon({
  title,
  Icon,
  onClick,
  disabled,
  spinning,
  className,
}: {
  title: string;
  Icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  spinning?: boolean;
  className: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <Icon className={`size-5 ${spinning ? "animate-spin" : ""}`} />
    </button>
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
  const [busy, setBusy] = useState<"approve" | "reject" | "generate" | "upload" | "discard" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");

  async function run(action: "approve" | "reject" | "generate" | "upload" | "discard", fn: () => Promise<unknown>) {
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

  const generate = () =>
    run("generate", () =>
      api.post(`/admin/image-approvals/${row.id}/generate`, customPrompt.trim() ? { prompt: customPrompt.trim() } : {}),
    );

  function upload(file: File) {
    const formData = new FormData();
    formData.append("image", file);
    return run("upload", () => api.post(`/admin/image-approvals/${row.id}/upload`, formData));
  }

  const discard = () => run("discard", () => api.post(`/admin/image-approvals/${row.id}/discard`));

  const isApproved = row.status === "approved" && row.has_backup;

  return (
    <li className="grid gap-4 p-4 sm:grid-cols-[1fr_1fr_280px] sm:items-stretch">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Original</p>
        <Frame>
          {isApproved && row.backup_url ? (
            // The live original was overwritten on approval — show the backed-up pre-approval one.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.backup_url}
              alt="Original (backed up)"
              className="h-full w-full cursor-zoom-in object-cover"
              onClick={() => onPreview(row.backup_url as string)}
            />
          ) : isApproved ? (
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
          ) : row.candidate_url ? (
            // Direct (signed) URL — loads from storage without streaming through the API.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.candidate_url}
              alt="Regenerated"
              className="h-full w-full cursor-zoom-in object-cover"
              onClick={() => onPreview(row.candidate_url as string)}
            />
          ) : row.has_candidate ? (
            <AuthImage
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

      <div className="flex h-full flex-col gap-3">
        <div className="space-y-1">
          <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
            {row.status.replace("_", " ")}
          </span>
          <p className="text-xs text-muted-foreground">Used in {row.usage_count} questions</p>
          {row.error && <p className="text-xs break-words text-destructive">{row.error}</p>}
          {error && <p className="text-xs break-words text-destructive">{error}</p>}
        </div>

        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Optional fix — e.g. keep the sign symbol, no extra cars, motorcycle facing right…"
          disabled={busy !== null}
          className="min-h-24 w-full flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm leading-snug disabled:opacity-50"
        />

        <div className="flex items-center justify-between gap-2">
          <ActionIcon
            title={row.has_candidate ? "Regenerate" : "Generate"}
            Icon={RefreshCw}
            onClick={generate}
            disabled={busy !== null}
            spinning={busy === "generate"}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          />

          <label
            title="Upload image"
            aria-label="Upload image"
            className={`inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-neutral-700 transition hover:bg-neutral-50 ${
              busy !== null ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <Upload className="size-5" />
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
            <>
              <ActionIcon
                title="Approve"
                Icon={Check}
                onClick={() => decide("approve")}
                disabled={busy !== null}
                className="border-green-600 bg-green-600 text-white hover:bg-green-700"
              />
              <ActionIcon
                title="Reject"
                Icon={X}
                onClick={() => decide("reject")}
                disabled={busy !== null}
                className="border-red-500 bg-red-500 text-white hover:bg-red-600"
              />
            </>
          )}
          {(row.has_candidate || row.status === "approved") && (
            <ActionIcon
              title={row.status === "approved" ? "Revert approval — restore original" : "Delete generated image"}
              Icon={Trash2}
              onClick={discard}
              disabled={busy !== null}
              spinning={busy === "discard"}
              className="border-red-300 text-red-600 hover:bg-red-50"
            />
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
