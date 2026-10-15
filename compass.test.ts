import test from "node:test";
import assert from "node:assert/strict";
import { getCompassHeadingText } from "./src/utils/compass.ts";

test("maps cardinal headings", () => {
  assert.equal(getCompassHeadingText(0), "0° N");
  assert.equal(getCompassHeadingText(90), "90° E");
  assert.equal(getCompassHeadingText(180), "180° S");
  assert.equal(getCompassHeadingText(270), "270° W");
});

test("uses exact 16-point sector boundaries, not rounded display values", () => {
  assert.equal(getCompassHeadingText(11.24), "11° N");
  assert.equal(getCompassHeadingText(11.25), "11° NNE");
  assert.equal(getCompassHeadingText(348.74), "349° NNW");
  assert.equal(getCompassHeadingText(348.75), "349° N");
});

test("normalizes negative and overflowing headings", () => {
  assert.equal(getCompassHeadingText(-90), "270° W");
  assert.equal(getCompassHeadingText(450), "90° E");
  assert.equal(getCompassHeadingText(359.8), "0° N");
});

test("handles non-finite values defensively", () => {
  assert.equal(getCompassHeadingText(Number.NaN), "0° N");
  assert.equal(getCompassHeadingText(Number.POSITIVE_INFINITY), "0° N");
});
