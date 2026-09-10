/**
 * The Trustpilot claim the site makes about itself, in one place so every surface quotes the same
 * numbers. There's no reviews endpoint — these are the published marketing figures, and the hero
 * on `/{state}/{test-slug}` and the methodology panel both read them from here rather than each
 * carrying their own copy of the score.
 */
export const TRUSTPILOT_SCORE = "4.7";
export const TRUSTPILOT_MAX = 5;
export const TRUSTPILOT_REVIEW_COUNT = "38,000+";
