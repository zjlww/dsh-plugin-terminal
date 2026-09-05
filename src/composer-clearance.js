/** DSH's stable marker for the sticky/absolute chat composer seat. */
export const COMPOSER_SEAT_SELECTOR = "[data-composer-seat]";

/**
 * Reserve vertical space beneath the composer while the fixed terminal panel
 * is mounted. The margin participates in DSH's flex layout, moving the
 * composer upward and shrinking the message viewport by the same amount.
 *
 * The previous inline margin is restored on unmount so this plugin does not
 * erase layout state owned by DSH or another extension.
 */
export function createComposerClearance(rootEl) {
  const seat = rootEl?.closest?.(COMPOSER_SEAT_SELECTOR) ?? null;
  if (seat === null) return null;

  const previousMarginBottom = seat.style.marginBottom;
  let restored = false;

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
    },
  };
}
