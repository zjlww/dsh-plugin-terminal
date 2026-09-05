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
 * is mounted. The margin participates in DSH's flex layout, moving the
 * composer upward and shrinking the message viewport by the same amount.
 *
 * The previous inline margin and stacking layer are restored on unmount so
 * this plugin does not erase layout state owned by DSH or another extension.
 */
export function createComposerClearance(rootEl) {
  const seat = rootEl?.closest?.(COMPOSER_SEAT_SELECTOR) ?? null;
  if (seat === null) return null;

  const previousMarginBottom = seat.style.marginBottom;
  const previousZIndex = seat.style.zIndex;
  let restored = false;

  seat.style.zIndex = COMPOSER_SEAT_TERMINAL_Z_INDEX;

  return {
    seat,
    setHeight(height) {
      if (restored) return 0;
      const pixels = Number.isFinite(height) ? Math.max(0, Math.round(height)) : 0;
      seat.style.marginBottom = pixels + "px";
      return pixels;
    },
    restore() {
      if (restored) return;
      restored = true;
      seat.style.marginBottom = previousMarginBottom;
      seat.style.zIndex = previousZIndex;
    },
  };
}
