import Link from "next/link";
import { Lock } from "lucide-react";
import type { PublicFlashcard } from "@driving-test-app/shared";

/**
 * One flashcard in a browse grid.
 *
 * The back text is shown underneath rather than hidden behind a flip. This is the browse grid, not
 * the study session — someone scanning it is deciding whether this deck is the right one, and a
 * grid of cards that each have to be clicked to reveal anything answers nothing. The study session
 * is where the answer is supposed to be withheld.
 *
 * A locked premium card is the exception: its answer is blurred, because that is the thing being
 * paid for.
 */
export default function FlashcardCard({ card, studyHref }: { card: PublicFlashcard; studyHref: string }) {
  const scope = [card.topic, card.category?.title, card.state?.name, card.vehicle_type?.title].filter(Boolean).join(" · ");

  return (
    <Link
      href={studyHref}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_20px_44px_-26px_rgba(16,24,40,0.5)] focus-visible:ring-2 focus-visible:ring-chart-1 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-foreground transition-colors group-hover:text-chart-1">{card.front_text}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Shown whenever the card is marked premium, regardless of whether this viewer (e.g. an
              admin) is actually locked out — distinct from the padlock, which is about this viewer. */}
          {card.is_premium && (
            <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-900 dark:text-amber-200">
              Premium
            </span>
          )}
          {card.locked && <Lock aria-hidden className="size-4 text-amber-600" />}
        </div>
      </div>

      {card.image_url && (
        <div className="overflow-hidden rounded-xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.image_url}
            alt=""
            className="h-28 w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </div>
      )}

      {card.back_text && (
        <p className={`line-clamp-2 text-sm text-muted-foreground ${card.locked ? "blur-[3px] select-none" : ""}`}>
          {card.back_text}
        </p>
      )}

      {scope && <p className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground">{scope}</p>}
    </Link>
  );
}
