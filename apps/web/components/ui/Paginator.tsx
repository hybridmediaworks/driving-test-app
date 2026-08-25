import type { PaginatedResponse } from "@driving-test-app/shared";
import { Button } from "@/components/ui/ShadcnButton";

function linkLabel(label: string): string {
  return label.replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&hellip;/g, "…").replace(/&nbsp;/g, " ");
}

// Laravel's pagination links are absolute API-origin URLs (built from APP_URL) — only the `page`
// query param is meaningful to us; everything else about the URL is the wrong origin to navigate
// to directly (see the note in hooks/use-paginated-list.ts).
function pageFromUrl(url: string): number | null {
  try {
    // Pass a base URL so RELATIVE links parse too — behind a proxy Laravel often emits paths like
    // "/api/v1/...?page=2" (no host), which `new URL(url)` alone rejects, leaving every page button
    // disabled and clicks doing nothing. The base is only used to resolve relative URLs.
    const page = new URL(url, "http://paginator.local").searchParams.get("page");
    return page ? Number(page) : null;
  } catch {
    return null;
  }
}

export default function Paginator({
  meta,
  onPageChange,
}: {
  meta: PaginatedResponse<unknown>["meta"];
  onPageChange: (page: number) => void;
}) {
  const { from, to, total, last_page: lastPage, links } = meta;
  const summary = total === 0 ? "No results" : from == null || to == null ? `${total} total` : `Showing ${from}–${to} of ${total}`;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{summary}</p>
      {lastPage > 1 && (
        <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Pagination">
          {links.map((link, i) => {
            const page = link.url ? pageFromUrl(link.url) : null;
            return page ? (
              <Button
                key={i}
                variant={link.active ? "default" : "outline"}
                size="sm"
                className="min-w-9 px-2"
                disabled={link.active}
                onClick={() => onPageChange(page)}
              >
                {linkLabel(link.label)}
              </Button>
            ) : (
              <Button key={i} variant="outline" size="sm" className="min-w-9 px-2" disabled>
                {linkLabel(link.label)}
              </Button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
