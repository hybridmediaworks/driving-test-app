import Button from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

export default function PremiumDialog({
  open,
  onOpenChange,
  title = "Premium Members Only",
  description = "This is a premium feature. Unlock full access to premium quizzes, the Exam Simulator, cheat sheets, flashcards, a Pass Guarantee, and more.",
  ctaLabel = "View All Plans",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  ctaLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl! gap-0 overflow-hidden rounded-3xl p-0">
        <div className="flex items-center justify-center bg-blue-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/premium_feature.svg" alt="" />
        </div>

        <div className="space-y-5 bg-white p-10 text-center">
          <Heading size="xs">{title}</Heading>
          <Paragraph className="text-center">{description}</Paragraph>

          <Button href="/pricing" className="w-full">
            {ctaLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
