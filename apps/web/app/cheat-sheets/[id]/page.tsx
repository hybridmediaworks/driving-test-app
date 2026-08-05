"use client";

import { use, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { CheatSheetShowResponse } from "@driving-test-app/shared";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import { api, ApiError, downloadFile } from "@/lib/api";
import { WebLayoutProvider } from "@/lib/web-layout-context";

export default function CheatSheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<CheatSheetShowResponse | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CheatSheetShowResponse>(`/cheat-sheets/${id}`)
      .then(setData)
      .catch((err) => setNotFoundError(err instanceof ApiError ? err.message : "This cheat sheet isn't available."));
  }, [id]);

  async function handleDownload() {
    if (!data) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadFile(`/cheat-sheets/${id}/download`, `${data.cheat_sheet.slug}.pdf`);
    } catch (err) {
      setDownloadError(err instanceof ApiError ? err.message : "Failed to download the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-2xl space-y-6 px-5 py-10 lg:py-14">
            {notFoundError && <p className="text-center text-sm text-destructive">{notFoundError}</p>}
            {!data && !notFoundError && <p className="text-center text-sm text-neutral-500">Loading…</p>}

            {data && (
              <>
                <div className="space-y-3 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                  {data.cheat_sheet.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.cheat_sheet.cover_image_url}
                      alt=""
                      className="mb-2 max-h-48 w-full rounded-2xl object-cover"
                    />
                  )}
                  <h1 className="text-2xl font-semibold text-neutral-900">{data.cheat_sheet.title}</h1>
                  <Paragraph color="muted">{data.cheat_sheet.summary}</Paragraph>

                  {!data.locked && (
                    <div>
                      <Button onClick={handleDownload} disabled={downloading}>
                        {downloading ? "Preparing PDF…" : "Download PDF"}
                      </Button>
                      {downloadError && <p className="mt-2 text-sm text-destructive">{downloadError}</p>}
                    </div>
                  )}
                </div>

                {data.locked ? (
                  <div className="space-y-4 rounded-3xl border border-blue-100 bg-blue-50 p-8 text-center">
                    <Lock className="mx-auto h-8 w-8 text-amber-600" />
                    <h2 className="text-lg font-semibold text-neutral-900">This is a premium cheat sheet</h2>
                    <Paragraph color="muted">Upgrade to read the full sheet and download it as a PDF.</Paragraph>
                    <Button href="/pricing">View plans</Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {data.sections?.map((section) => (
                      <div key={section.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-3 text-lg font-semibold text-neutral-900">{section.heading}</h2>
                        <div className="text-neutral-700 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5">
                          <ReactMarkdown>{section.body_markdown}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
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
