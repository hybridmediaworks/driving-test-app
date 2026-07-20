import Link from "next/link";
import type { PaginatedResponse } from "@driving-test-app/shared";
import { Button } from "@/components/ui/ShadcnButton";

function linkLabel(label: string): string {
  return label.replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&hellip;/g, "…").replace(/&nbsp;/g, " ");
}

export default function Paginator({ meta }: { meta: PaginatedResponse<unknown>["meta"] }) {
  const { from, to, total, last_page: lastPage, links } = meta;
  const summary = total === 0 ? "No results" : from == null || to == null ? `${total} total` : `Showing ${from}–${to} of ${total}`;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{summary}</p>
      {lastPage > 1 && (
        <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Pagination">
          {links.map((link, i) =>
            link.url ? (
              <Button key={i} variant={link.active ? "default" : "outline"} size="sm" className="min-w-9 px-2" render={<Link href={link.url} className={link.active ? "pointer-events-none cursor-default" : ""} />}>
                {linkLabel(link.label)}
              </Button>
            ) : (
              <Button key={i} variant="outline" size="sm" className="min-w-9 px-2" disabled>
                {linkLabel(link.label)}
              </Button>
            ),
          )}
        </nav>
      )}
    </div>
  );
}
