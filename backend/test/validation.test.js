const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeClassName, validClassName, validPhone, visitorUsername } = require("../utils/validation");

test("normalizes and validates school classes", () => {
  assert.equal(normalizeClassName("9a1"), "9A1");
  assert.equal(validClassName("9A1"), true);
  assert.equal(validClassName("9 A1"), false);
  assert.equal(validClassName("9A01"), false);
});

test("accepts only configured Vietnamese mobile prefixes", () => {
  assert.equal(validPhone("0321234567"), true);
  assert.equal(validPhone("0901234567"), true);
  assert.equal(validPhone("0123456789"), false);
  assert.equal(validPhone("090123456"), false);
});

test("creates visitor usernames using initials and a collision-ready base", () => {
  assert.equal(visitorUsername("Đặng Ngọc Trường", "8a12"), "dntruong8a12");
});
