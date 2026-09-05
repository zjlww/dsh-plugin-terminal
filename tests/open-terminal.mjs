import assert from "node:assert/strict";

import {
  createTerminalOpenCoordinator,
  decideTerminalOpen,
} from "../src/open-terminal.js";

assert.deepEqual(
  decideTerminalOpen({ open: false, bootReady: true, handled: true }),
  { handled: false, ensure: false },
  "closing rearms the next open",
);
assert.deepEqual(
  decideTerminalOpen({ open: true, bootReady: false, handled: false }),
  { handled: false, ensure: false },
  "opening waits for restored sessions",
);
assert.deepEqual(
  decideTerminalOpen({ open: true, bootReady: true, handled: false }),
  { handled: true, ensure: true },
  "a fresh open requests host-backed validation",
);
assert.deepEqual(
  decideTerminalOpen({ open: true, bootReady: true, handled: true }),
  { handled: true, ensure: false },
  "an exit while already open does not start another validation",
);

async function runEnsure(active, sessions) {
  let creates = 0;
  let reconciled;
  const coordinator = createTerminalOpenCoordinator();
  await coordinator.ensure({
    active,
    listSessions: async () => sessions,
    reconcileSessions: (next) => { reconciled = next; },
    createTerminal: async () => { creates++; },
  });
  assert.equal(reconciled, sessions, "the browser reconciles cached exit state with the host");
  return creates;
}

assert.equal(
  await runEnsure({ id: "live", exited: false }, [{ id: "live", exited: false }]),
  0,
  "opening a host-confirmed live terminal does nothing",
);
assert.equal(
  await runEnsure({ id: "dead", exited: false }, [{ id: "dead", exited: true }]),
  1,
  "a terminal that exited while collapsed gets a fresh replacement",
);
assert.equal(
  await runEnsure({ id: "missing", exited: false }, []),
  1,
  "a host-missing active terminal gets a fresh replacement",
);
assert.equal(
  await runEnsure(null, []),
  1,
  "opening without an active terminal creates the initial session",
);

function deferred() {
  let resolve;
  const promise = new Promise((next) => { resolve = next; });
  return { promise, resolve };
}

const delayed = deferred();
let listCalls = 0;
let createCalls = 0;
const coordinator = createTerminalOpenCoordinator();
const options = {
  active: { id: "dead", exited: false },
  listSessions: async () => {
    listCalls++;
    return delayed.promise;
  },
  reconcileSessions: () => {},
  createTerminal: async () => { createCalls++; },
};
const first = coordinator.ensure(options);
const rapidReopen = coordinator.ensure(options);
assert.equal(first, rapidReopen, "rapid reopen shares the in-flight validation");
assert.equal(listCalls, 1, "rapid reopen lists host sessions once");
delayed.resolve([{ id: "dead", exited: true }]);
await Promise.all([first, rapidReopen]);
assert.equal(createCalls, 1, "rapid reopen creates exactly one replacement terminal");

const changed = deferred();
let staleCreates = 0;
const changedCoordinator = createTerminalOpenCoordinator();
const stale = changedCoordinator.ensure({
  ...options,
  listSessions: async () => changed.promise,
  createTerminal: async () => { staleCreates++; },
});
const updated = changedCoordinator.ensure({
  ...options,
  active: { id: "live", exited: false },
  listSessions: async () => changed.promise,
  createTerminal: async () => { staleCreates++; },
});
assert.equal(stale, updated, "updated open state still shares the host request");
changed.resolve([{ id: "dead", exited: true }, { id: "live", exited: false }]);
await updated;
assert.equal(staleCreates, 0, "the settled request uses the latest active terminal");

const cancelled = deferred();
let cancelledCreates = 0;
const cancelledCoordinator = createTerminalOpenCoordinator();
const obsolete = cancelledCoordinator.ensure({
  ...options,
  listSessions: async () => cancelled.promise,
  createTerminal: async () => { cancelledCreates++; },
});
cancelledCoordinator.cancel();
cancelled.resolve([{ id: "dead", exited: true }]);
await obsolete;
assert.equal(cancelledCreates, 0, "closing or unmounting cancels obsolete terminal creation");

console.log("PASS: opening revalidates host state and safely deduplicates replacement creation");
