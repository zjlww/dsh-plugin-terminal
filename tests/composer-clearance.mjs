import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  COMPOSER_SEAT_SELECTOR,
  COMPOSER_SEAT_TERMINAL_Z_INDEX,
  createComposerClearance,
} from "../src/composer-clearance.js";

const source = readFileSync(new URL("../src/client-main.js", import.meta.url), "utf8");

/* The terminal remains a bottom-fixed panel. */
assert.match(source, /\.dshTermRoot\{position:fixed;bottom:0;z-index:2147483647/);

/* Clearance targets DSH's explicit composer boundary, not UI-content guesses. */
const calls = [];
const seat = { style: { paddingBottom: "7px", zIndex: "3" } };
const root = {
  closest(selector) {
    calls.push(selector);
    return selector === COMPOSER_SEAT_SELECTOR ? seat : null;
  },
};

const clearance = createComposerClearance(root);
assert.notEqual(clearance, null);
assert.deepEqual(calls, ["[data-composer-seat]"]);
assert.equal(clearance.seat, seat);
assert.equal(COMPOSER_SEAT_TERMINAL_Z_INDEX, "10");
assert.equal(seat.style.zIndex, "10");

assert.equal(clearance.setHeight(211.6), 212);
assert.equal(seat.style.paddingBottom, "212px");
assert.equal(clearance.setHeight(34), 34);
assert.equal(seat.style.paddingBottom, "34px");
assert.equal(clearance.setHeight(-5), 0);
assert.equal(seat.style.paddingBottom, "0px");

clearance.restore();
assert.equal(seat.style.paddingBottom, "7px");
assert.equal(seat.style.zIndex, "3");
clearance.restore();
assert.equal(seat.style.paddingBottom, "7px");
assert.equal(seat.style.zIndex, "3");
assert.equal(clearance.setHeight(300), 0);
assert.equal(seat.style.paddingBottom, "7px");

assert.equal(createComposerClearance({ closest: () => null }), null);
assert.equal(createComposerClearance(null), null);

console.log("PASS: fixed terminal reserves and restores composer-seat clearance");
