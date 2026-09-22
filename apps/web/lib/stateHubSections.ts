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

/**
 * CDL is not a ladder of equal steps the way car and motorcycle are: one endorsement is the program
 * the learner is working towards, and the rest are optional add-ons chosen per job. So the hub
 * numbers a single main program and lists everything else separately under "Optional endorsements",
 * rather than numbering all nine as if they were a sequence.
 *
 * driving-tests.org picks the main program from the learner's own answer to "What's your CDL goal?".
 * We have no such selector yet, so it is fixed here — change this one line to move it.
 */
export const CDL_MAIN_PROGRAM_TITLE = "Hazardous Materials (HazMat)";

/**
 * Splits the ladder into the numbered main program and the un-numbered optional endorsements.
 * Only CDL splits — every other vehicle keeps its whole ladder numbered, unchanged.
 */
export function splitLadderPhases<T extends { header: { headerTitle: string } }>(
  phases: T[],
  vehicle: string,
): { ladder: T[]; endorsements: T[] } {
  if (vehicle !== "CDL") return { ladder: phases, endorsements: [] };

  return {
    ladder: phases.filter(
      (p) =>
        p.header.headerTitle === CDL_MAIN_PROGRAM_TITLE ||
        PROMOTED_TO_OWN_SECTION.includes(p.header.headerTitle),
    ),
    // Categories that already render as their own full-width section ("The extra support") are not
    // endorsements and must not be listed as one — the ladder bucket still carries them so the
    // sidebar can keep linking to wherever they live.
    endorsements: phases.filter(
      (p) =>
        p.header.headerTitle !== CDL_MAIN_PROGRAM_TITLE &&
        !PROMOTED_TO_OWN_SECTION.includes(p.header.headerTitle),
    ),
  };
}

/** Anchor for the optional-endorsements section, and for a single endorsement inside it. */
export const ENDORSEMENTS_SECTION_ID = "endorsements";
export function endorsementAnchorId(phaseNumber: number): string {
  return `endorsement-${phaseNumber}`;
}
