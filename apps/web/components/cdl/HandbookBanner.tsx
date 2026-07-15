import { BookOpenText, ChevronRight, CloudDownload, Headset } from "lucide-react";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";

export default function HandbookBanner() {
  return (
    <div className="relative flex items-center justify-between overflow-hidden rounded-2xl bg-blue-50 ps-5 pr-15">
      <div className="space-y-3 py-5">
        <Paragraph className="max-w-md" size="sm">
          Not your typical read — this interactive handbook is designed for engagement. Study anytime, anywhere:
          read, listen, chat with it or download for offline access.
        </Paragraph>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-11 items-center justify-center rounded-full border-2 border-blue-primary text-blue-primary">
              <BookOpenText className="size-5" />
            </div>
            <div className="space-y-0">
              <p className="text-sm font-semibold">Read</p>
              <span className="text-sm text-grey">PDF (112 pages)</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-11 items-center justify-center rounded-full border-2 border-blue-primary text-blue-primary">
              <Headset className="size-5" />
            </div>
            <div className="space-y-0">
              <p className="text-sm font-semibold">Listen</p>
              <span className="text-sm text-grey">MP3 (2h 04m)</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-11 items-center justify-center rounded-full border-2 border-blue-primary text-blue-primary">
              <CloudDownload className="size-5" />
            </div>
            <div className="space-y-0">
              <p className="text-sm font-semibold">Download</p>
              <span className="text-sm text-grey">13 MB</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" className="p-0!" size="sm">
          Open Handbook <ChevronRight className="w-4" />
        </Button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Oregon.avif" className="max-w-35.5 shrink-0 object-cover pt-5" alt="" />
    </div>
  );
}
