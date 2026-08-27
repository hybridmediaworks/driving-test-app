import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Paragraph from "@/components/ui/Paragraph";
import type { QuizTranslationKey, TFunction } from "@/lib/i18n/quiz";

type Shortcut = { keys: string[]; label: QuizTranslationKey };

// Each entry's `keys` is one badge per element — chords like "ta" render as a single badge to
// match how they're actually typed (press t, then a), while "1 2 3 4" render as four.
const generalShortcuts: Shortcut[] = [
  { keys: ["1", "2", "3", "4"], label: "shortcutSelectAnswer" },
  { keys: ["enter"], label: "shortcutConfirmNext" },
  { keys: ["n"], label: "shortcutNextQuestion" },
  { keys: ["p"], label: "shortcutPreviousQuestion" },
  { keys: ["c"], label: "shortcutCurrentQuestion" },
  { keys: ["ta"], label: "shortcutAnswerPopularity" },
  { keys: ["tf"], label: "shortcutFontSize" },
];

const voiceOverShortcuts: Shortcut[] = [
  { keys: ["tv"], label: "shortcutVoiceOverOnOff" },
  { keys: ["v"], label: "shortcutStartStopVoiceOver" },
  { keys: ["e"], label: "shortcutStartStopExplanation" },
];

const reviewShortcuts: Shortcut[] = [
  { keys: ["←"], label: "shortcutPreviousQuestion" },
  { keys: ["→"], label: "shortcutNextQuestion" },
  { keys: ["c"], label: "shortcutCurrentQuestion" },
];

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-neutral-100 px-1.5 text-xs font-semibold text-neutral-600 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
      {children}
    </kbd>
  );
}

function ShortcutRow({ shortcut, t }: { shortcut: Shortcut; t: TFunction }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex shrink-0 items-center gap-1">
        {shortcut.keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </div>
      <Paragraph size="sm" color="dark">
        {t(shortcut.label)}
      </Paragraph>
    </div>
  );
}

function Group({ title, shortcuts, t }: { title: string; shortcuts: Shortcut[]; t: TFunction }) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-neutral-900">{title}</p>
      <div className="divide-y divide-border/60">
        {shortcuts.map((shortcut) => (
          <ShortcutRow key={`${shortcut.label}-${shortcut.keys.join("")}`} shortcut={shortcut} t={t} />
        ))}
      </div>
    </div>
  );
}

/**
 * Reference sheet for the quiz-taking keyboard shortcuts, opened from the settings menu's
 * "Keyboard shortcuts" row or by pressing Shift + ?. Purely informational — the shortcuts
 * themselves are handled by the global keydown listener in QuizExperience's QuizTaker.
 */
export default function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: TFunction;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl! rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{t("keyboardShortcuts")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
          <Group title={t("shortcutsGeneral")} shortcuts={generalShortcuts} t={t} />
          <div className="space-y-6">
            <Group title={t("shortcutsVoiceOverGroup")} shortcuts={voiceOverShortcuts} t={t} />
            <Group title={t("shortcutsReviewMode")} shortcuts={reviewShortcuts} t={t} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
