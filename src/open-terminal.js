/** Resolve one terminal-panel open effect pass. */
export function decideTerminalOpen({ open, bootReady, handled }) {
  if (!open) return { handled: false, ensure: false };
  if (!bootReady || handled) return { handled, ensure: false };
  return { handled: true, ensure: true };
}

/**
 * Serialize server-backed checks performed for closed -> open transitions.
 *
 * The browser's cached tab state can be stale while the panel is collapsed,
 * because its terminal panes (and WebSockets) are unmounted. The host session
 * list is therefore authoritative. A shared pending promise prevents duplicate
 * requests, while each ensure call replaces the state/callbacks that will be
 * used when that promise settles. cancel() prevents an old panel from creating
 * a terminal after it closes or unmounts.
 */
export function createTerminalOpenCoordinator() {
  let pending = null;
  let latest = null;
  let requested = false;

  return {
    ensure(options) {
      latest = options;
      requested = true;
      if (pending !== null) return pending;

      const run = (async () => {
        const sessions = await options.listSessions();
        if (!requested || latest === null) return;

        const current = latest;
        current.reconcileSessions(sessions);
        const hostActive = current.active === null
          ? null
          : sessions.find((session) => session.id === current.active.id);
        if (current.active === null || hostActive === undefined || hostActive.exited === true) {
          await current.createTerminal();
        }
      })();
      const tracked = run.finally(() => {
        if (pending === tracked) pending = null;
      });
      pending = tracked;
      return tracked;
    },

    cancel() {
      requested = false;
      latest = null;
    },
  };
}
