"use client";

import { use, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import type { PublicHandbook } from "@driving-test-app/shared";

/**
 * Our own real handbook reader — embeds the actual DMV-published PDF via the browser's native
 * PDF viewer. The crawl never captured real handbook text (only a marketing blurb about the
 * source site's download page, plus the genuine PDF file itself), so rendering the PDF directly
 * is the only way to show the real, authentic document rather than the wrong scraped copy.
 * Exists specifically so "Read online" on HandbookCard doesn't have to send users to the
 * driving-tests.org page we crawled it from; we have the real PDF ourselves.
 */
export default function HandbookReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [handbook, setHandbook] = useState<PublicHandbook | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ handbook: PublicHandbook }>(`/handbooks/${id}`)
      .then((res) => setHandbook(res.handbook))
      .catch((err) => setNotFoundError(err instanceof ApiError ? err.message : "This handbook isn't available."));
  }, [id]);

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl space-y-4 px-5 py-10 lg:py-14">
            {notFoundError && <p className="text-center text-sm text-destructive">{notFoundError}</p>}
            {!handbook && !notFoundError && <p className="text-center text-sm text-neutral-500">Loading…</p>}

            {handbook && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h1 className="text-xl font-semibold text-neutral-900">{handbook.title}</h1>
                  {handbook.pdf_url && <Button href={handbook.pdf_url}>Download PDF</Button>}
                </div>

                {handbook.pdf_url ? (
                  <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    <iframe
                      src={handbook.pdf_url}
                      title={handbook.title}
                      className="h-[85vh] w-full"
                    />
                  </div>
                ) : (
                  <p className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
                    No PDF is available for this handbook yet.
                  </p>
                )}
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
