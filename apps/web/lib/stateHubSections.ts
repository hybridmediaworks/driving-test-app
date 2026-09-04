/**
 * The anchor ids the state hub's progress sidebar jumps to, and the mapping from a ladder phase's
 * real category title to wherever that phase actually lives on the page.
 *
 * Two phases are rendered as their own full-width sections rather than as rungs in the ladder (see
 * PhaseLadderSection), so a step in the sidebar has to know which of the two it is before it can
 * scroll anywhere. Keyed by the category titles the API returns.
 */
export const PROMOTED_SECTION_IDS: Record<string, string> = {
  "The exam simulator": "exam-simulator",
  "The extra support": "extra-support",
};

/** Phase titles the ladder skips because they render as their own section. */
export const PROMOTED_TO_OWN_SECTION = Object.keys(PROMOTED_SECTION_IDS);

export const HANDBOOK_SECTION_ID = "handbook";

/** Anchor id for a phase that is still a rung in the ladder. */
export function phaseAnchorId(phaseNumber: number): string {
  return `phase-${phaseNumber}`;
}

/** Where a phase with this title and number lives on the page. */
export function sectionIdForPhase(title: string, phaseNumber: number): string {
  return PROMOTED_SECTION_IDS[title] ?? phaseAnchorId(phaseNumber);
}

/**
 * Smooth-scrolls to a section, if it's on the page. Returns whether it found one, so a caller can
 * leave the browser's own anchor handling alone when it didn't.
 */
export function scrollToSection(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}
