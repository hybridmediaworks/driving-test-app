import { ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

export default function ChallangeBankBanner() {
  return (
    <>
      <Heading size="xs" className="mb-2">
        The Challenge Bank™{" "}
      </Heading>
      <div className="relative flex items-center justify-start rounded-2xl bg-blue-50 px-5">
        <div className="space-y-3 py-5">
          <Paragraph className="max-w-md" size="sm">
            Your personalized Challenge Bank™ automatically retests you on all your missed questions until you nail
            every single one. No shame - we all have weaknesses!
          </Paragraph>
          <p className="max-w-md text-sm" />

          <Button variant="ghost" className="p-0!">
            Start Challenge Bank™ <ChevronRight className="w-4" />
          </Button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/CB-illustration.svg" alt="" className="relative -top-5" />
      </div>
    </>
  );
}
