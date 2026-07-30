/**
 * Table geometry, shared by DataTable and its loading skeleton.
 *
 * Kept in its own module rather than exported from DataTable: the skeleton is
 * in the initial bundle and DataTable is lazily loaded, so importing from the
 * component would drag the whole chunk in eagerly and defeat the code split.
 */

/** Row height in px. Fixed, because virtualization needs to know it up front. */
export const ROW_HEIGHT = 40;

/** Rows visible at once. The scroll body is sized from this. */
export const VISIBLE_ROWS = 5;

/** The sticky column-header row, which sits inside the scroll body. */
export const HEADER_HEIGHT = 35;

/** The scroll body's fixed height — the same box the skeleton reserves. */
export const SCROLL_BODY_HEIGHT = VISIBLE_ROWS * ROW_HEIGHT + HEADER_HEIGHT;
