import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  COMPOSER_SEAT_SELECTOR,
  createComposerClearance,
} from "../src/composer-clearance.js";

const source = readFileSync(new URL("../src/client-main.js", import.meta.url), "utf8");

/* The terminal remains a bottom-fixed panel. */
assert.match(source, /\.dshTermRoot\{position:fixed;bottom:0;z-index:50/);

/* Clearance targets DSH's explicit composer boundary, not UI-content guesses. */
const calls = [];
const seat = { style: { marginBottom: "7px" } };
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

assert.equal(clearance.setHeight(211.6), 212);
assert.equal(seat.style.marginBottom, "212px");
assert.equal(clearance.setHeight(34), 34);
assert.equal(seat.style.marginBottom, "34px");
assert.equal(clearance.setHeight(-5), 0);
assert.equal(seat.style.marginBottom, "0px");

clearance.restore();
assert.equal(seat.style.marginBottom, "7px");
clearance.restore();
assert.equal(seat.style.marginBottom, "7px");
assert.equal(clearance.setHeight(300), 0);
assert.equal(seat.style.marginBottom, "7px");

assert.equal(createComposerClearance({ closest: () => null }), null);
assert.equal(createComposerClearance(null), null);

console.log("PASS: fixed terminal reserves and restores composer-seat clearance");
