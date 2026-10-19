import test from "node:test";
import assert from "node:assert/strict";
import { auditDocument, blankDocument, normalizeDocument, parseDocument, redact, reportMarkdown, safeSample } from "../src/core.mjs";

test("safe sample is ready for human review", () => {
  const result = auditDocument(safeSample());
  assert.equal(result.ready, true);
  assert.equal(result.findings.filter(finding => finding.severity === "error").length, 0);
});

test("empty inventory is blocked", () => {
  const result = auditDocument(blankDocument());
  assert.equal(result.ready, false);
  assert.deepEqual(result.findings.map(finding => finding.code), ["project-required", "flow-required"]);
});

test("non-public data requires authentication and scopes", () => {
  const doc = safeSample();
  doc.flows[0].auth = "none";
  doc.flows[0].scopes = "";
  assert.ok(auditDocument(doc).findings.some(finding => finding.code === "auth-required"));
  doc.flows[0].auth = "oauth";
  assert.ok(auditDocument(doc).findings.some(finding => finding.code === "scopes-required"));
});

test("credential material cannot be model visible or logged", () => {
  const doc = safeSample();
  Object.assign(doc.flows[0], { category: "credential", model_visible: true, logging: "metadata", retention: "none" });
  assert.ok(auditDocument(doc).findings.some(finding => finding.code === "credential-exposure"));
});

test("personal and sensitive data cannot use full logging", () => {
  const doc = safeSample();
  Object.assign(doc.flows[0], { category: "sensitive", logging: "full", retention: "session" });
  assert.ok(auditDocument(doc).findings.some(finding => finding.code === "sensitive-full-log"));
});

test("sensitive categories need a known retention decision", () => {
  const doc = safeSample();
  Object.assign(doc.flows[0], { category: "personal", retention: "unknown" });
  assert.ok(auditDocument(doc).findings.some(finding => finding.code === "retention-unknown"));
});

test("fixed retention days have bounded integer validation", () => {
  for (const value of ["0", "1.5", "3651", "forever"]) {
    const doc = safeSample();
    Object.assign(doc.flows[0], { retention: "days", retention_days: value });
    assert.ok(auditDocument(doc).findings.some(finding => finding.code === "retention-days-invalid"), value);
  }
});

test("third-party transfer needs disclosure", () => {
  const doc = safeSample();
  Object.assign(doc.flows[0], { third_party: true, disclosure: "" });
  assert.ok(auditDocument(doc).findings.some(finding => finding.code === "third-party-disclosure"));
});

test("redacted logging needs a concrete plan", () => {
  const doc = safeSample();
  doc.flows[1].redaction = "";
  assert.ok(auditDocument(doc).findings.some(finding => finding.code === "redaction-plan-required"));
});

test("write and destructive actions require confirmation", () => {
  for (const action of ["write", "destructive"]) {
    const doc = safeSample();
    Object.assign(doc.flows[0], { action, confirmation: false });
    assert.ok(auditDocument(doc).findings.some(finding => finding.code === "confirmation-required"), action);
  }
});

test("duplicate normalized flows are rejected", () => {
  const doc = safeSample();
  doc.flows.push({ ...doc.flows[0], id: crypto.randomUUID() });
  assert.ok(auditDocument(doc).findings.some(finding => finding.code === "duplicate-flow"));
});

test("privacy URL must be credential-free HTTPS", () => {
  for (const privacy_url of ["http://example.org/privacy", "https://user:pass@example.org/privacy", "not-a-url"]) {
    const doc = safeSample();
    doc.privacy_url = privacy_url;
    assert.ok(auditDocument(doc).findings.some(finding => finding.code === "privacy-url-invalid"), privacy_url);
  }
});

test("possible secrets are detected and redacted", () => {
  const doc = safeSample();
  doc.security_contact = "api_key=abcdefghijklmnop";
  assert.ok(auditDocument(doc).findings.some(finding => finding.code === "possible-secret"));
  assert.equal(redact("client_secret=abcdefghijklmnop"), "[REDACTED]");
  assert.ok(!reportMarkdown(doc).includes("abcdefghijklmnop"));
});

test("normalization allowlists fields and rejects invalid enums", () => {
  const normalized = normalizeDocument({ project: "x", extra: "discard", flows: [{ tool: "t", injected: true }] });
  assert.equal(normalized.extra, undefined);
  assert.equal(normalized.flows[0].injected, undefined);
  assert.throws(() => normalizeDocument({ project: "x", flows: [{ category: "invalid" }] }), /unsupported value/);
});

test("parser rejects non-objects and input beyond one megabyte", () => {
  assert.throws(() => parseDocument("[]"), /JSON object/);
  assert.throws(() => parseDocument(`{"project":"${"x".repeat(1_048_576)}"}`), /1 MB/);
});

test("report labels automated scope and human checks", () => {
  const report = reportMarkdown(safeSample());
  assert.match(report, /Required human checks/);
  assert.match(report, /not a privacy policy, legal advice, certification, or directory approval/);
});

test("invalid booleans and duplicate ids fail closed", () => {
  const doc = safeSample();
  doc.flows[0].confirmation = "yes";
  assert.throws(() => normalizeDocument(doc), /must be a boolean/);
  doc.flows[0].confirmation = false;
  doc.flows[1].id = doc.flows[0].id;
  assert.throws(() => normalizeDocument(doc), /Duplicate flow id/);
});

test("flow overflow is rejected rather than truncated", () => {
  assert.throws(() => normalizeDocument({ project: "x", flows: Array.from({ length: 61 }, () => ({})) }), /exceeds 60/);
});

test("emitted credentials are redacted before Markdown escaping", () => {
  const doc = safeSample();
  doc.project = `sk-${"z".repeat(24)}`;
  doc.flows[0].tool = `sk-${"y".repeat(24)}`;
  const report = reportMarkdown(doc);
  assert.doesNotMatch(report, /z{24}|y{24}/);
});

test("Markdown neutralizes raw HTML and includes review fields", () => {
  const doc = safeSample();
  doc.project = "<img src=x onerror=alert(1)>";
  const report = reportMarkdown(doc);
  assert.doesNotMatch(report, /<img/);
  assert.match(report, /&lt;img/);
  assert.match(report, /Privacy URL:/);
  assert.match(report, /Security contact\/process:/);
  assert.match(report, /Redaction:/);
  assert.match(report, /disclosure=/);
});
