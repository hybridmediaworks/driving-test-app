import { Bookmark } from "lucide-react";
import Button from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

/**
 * Gate shown when a signed-out visitor tries to use an account-only feature (currently:
 * bookmarking a quiz question). Matches the PremiumDialog/RestartDialog layout so every quiz-taking
 * gate reads as the same family of popup.
 */
export default function SignInDialog({
  open,
  onOpenChange,
  title = "Sign in to save questions",
  description = "Create a free account or log in to bookmark questions and pick up right where you left off.",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl! gap-0 overflow-hidden rounded-3xl p-0">
        <div className="flex items-center justify-center bg-blue-50 py-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            <Bookmark className="h-9 w-9 text-blue-600" strokeWidth={2.25} />
          </div>
        </div>

        <div className="space-y-5 bg-white p-10 text-center">
          <Heading size="xs">{title}</Heading>
          <Paragraph className="text-center">{description}</Paragraph>

          <div className="flex items-center gap-3 pt-2">
            <Button href="/register" variant="ghost" className="flex-1 border border-blue-300 hover:bg-blue-50">
              Sign Up
            </Button>
            <Button href="/login" className="flex-1">
              Log In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
