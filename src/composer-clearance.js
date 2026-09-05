/** DSH's stable marker for the sticky/absolute chat composer seat. */
export const COMPOSER_SEAT_SELECTOR = "[data-composer-seat]";

/**
 * DSH's conversation width handles occupy stacking layer 8 and its trigger
 * menu raises the composer seat to layer 9. Layer 10 keeps the fixed terminal
 * above both without depending on the generated width-handle class name.
 */
export const COMPOSER_SEAT_TERMINAL_Z_INDEX = "10";

/**
 * Reserve vertical space beneath the composer while the fixed terminal panel
 * is mounted. Bottom padding keeps the composer content directly above the
 * terminal and is included in DSH's composer-seat offsetHeight measurement,
 * so its chat viewport and scroll anchoring move upward by the same amount.
 *
 * The previous inline padding and stacking layer are restored on unmount so
 * this plugin does not erase layout state owned by DSH or another extension.
 */
export function createComposerClearance(rootEl) {
  const seat = rootEl?.closest?.(COMPOSER_SEAT_SELECTOR) ?? null;
  if (seat === null) return null;

  const previousPaddingBottom = seat.style.paddingBottom;
  const previousZIndex = seat.style.zIndex;
  let restored = false;

  seat.style.zIndex = COMPOSER_SEAT_TERMINAL_Z_INDEX;

  return {
    seat,
    setHeight(height) {
      if (restored) return 0;
      const pixels = Number.isFinite(height) ? Math.max(0, Math.round(height)) : 0;
      seat.style.paddingBottom = pixels + "px";
      return pixels;
    },
    restore() {
      if (restored) return;
      restored = true;
      seat.style.paddingBottom = previousPaddingBottom;
      seat.style.zIndex = previousZIndex;
    },
  };
}
