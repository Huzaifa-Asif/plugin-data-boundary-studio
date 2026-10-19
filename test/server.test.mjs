import test from "node:test";
import assert from "node:assert/strict";
import { isLoopbackHost, resolveRoute } from "../src/server.mjs";

test("server accepts only loopback hosts", () => {
  assert.equal(isLoopbackHost("127.0.0.1:4176"), true);
  assert.equal(isLoopbackHost("localhost"), true);
  assert.equal(isLoopbackHost("evil.test"), false);
});

test("server exposes a fixed route allowlist", () => {
  assert.ok(resolveRoute("/"));
  assert.equal(resolveRoute("/../../etc/passwd"), null);
  assert.equal(resolveRoute("/package.json"), null);
});
