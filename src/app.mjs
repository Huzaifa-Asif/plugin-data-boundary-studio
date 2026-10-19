import { auditDocument, blankDocument, blankFlow, INPUT_LIMIT_BYTES, normalizeDocument, parseDocument, reportMarkdown, safeSample } from "./core.mjs";

let state = blankDocument();
let undo = null;
let undoTimer = null;
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[char]);

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  link.click();
  URL.revokeObjectURL(url);
}

function syncHeader() {
  state.project = $("#project").value.slice(0, 120);
  state.privacy_url = $("#privacy-url").value.slice(0, 500);
  state.security_contact = $("#security-contact").value.slice(0, 300);
}

function card(flow, index) {
  return `<article class="flow-card" data-id="${esc(flow.id)}">
    <div class="card-head"><div><span class="eyebrow">Data flow ${index + 1}</span><h3>${esc(flow.tool || "Unnamed flow")}</h3></div><button class="remove ghost" type="button" aria-label="Remove ${esc(flow.tool || `flow ${index + 1}`)}">Remove</button></div>
    <div class="grid two">
      <label>Tool or workflow<input class="tool" maxlength="200" value="${esc(flow.tool)}"></label>
      <label>Specific purpose<input class="purpose" maxlength="1000" value="${esc(flow.purpose)}"></label>
      <label>Minimum data elements<textarea class="data" maxlength="1000">${esc(flow.data)}</textarea></label>
      <label>Data category<select class="category"><option value="public">Public</option><option value="account">Account data</option><option value="personal">Personal data</option><option value="sensitive">Sensitive data</option><option value="credential">Credential material</option></select></label>
      <label>Source boundary<input class="source" maxlength="300" value="${esc(flow.source)}"></label>
      <label>Destination boundary<input class="destination" maxlength="300" value="${esc(flow.destination)}"></label>
      <label>Authentication<select class="auth"><option value="none">None / public</option><option value="builtin">Built-in identity</option><option value="oauth">OAuth 2.1</option></select></label>
      <label>Minimum scopes or identity claims<textarea class="scopes" maxlength="1000">${esc(flow.scopes)}</textarea></label>
      <label>Retention<select class="retention"><option value="none">No retention</option><option value="session">Current session</option><option value="days">Fixed days</option><option value="unknown">Unknown / undecided</option></select></label>
      <label>Retention days<input class="retention-days" inputmode="numeric" maxlength="20" value="${esc(flow.retention_days)}"></label>
      <label>Logging<select class="logging"><option value="none">No logging</option><option value="metadata">Metadata only</option><option value="redacted">Redacted fields</option><option value="full">Full payload</option></select></label>
      <label>Redaction plan<textarea class="redaction" maxlength="1000">${esc(flow.redaction)}</textarea></label>
      <label>State effect<select class="action"><option value="read">Read only</option><option value="write">Change state</option><option value="destructive">Difficult to reverse</option></select></label>
      <label>Third-party disclosure<textarea class="disclosure" maxlength="1000">${esc(flow.disclosure)}</textarea></label>
    </div>
    <div class="checks">
      <label><input class="model-visible" type="checkbox" ${flow.model_visible ? "checked" : ""}> Visible to model</label>
      <label><input class="user-visible" type="checkbox" ${flow.user_visible ? "checked" : ""}> Inspectable by user</label>
      <label><input class="third-party" type="checkbox" ${flow.third_party ? "checked" : ""}> Leaves first-party boundary</label>
      <label><input class="confirmation" type="checkbox" ${flow.confirmation ? "checked" : ""}> Explicit confirmation</label>
      <label><input class="required" type="checkbox" ${flow.required ? "checked" : ""}> Required for the goal</label>
    </div>
  </article>`;
}

function hydrateCard(element, flow) {
  for (const [selector, value] of [[".category", flow.category],[".auth", flow.auth],[".retention", flow.retention],[".logging", flow.logging],[".action", flow.action]]) element.querySelector(selector).value = value;
}

function readCard(element) {
  const old = state.flows.find(flow => flow.id === element.dataset.id) ?? blankFlow();
  return { ...old,
    tool: element.querySelector(".tool").value,
    purpose: element.querySelector(".purpose").value,
    data: element.querySelector(".data").value,
    category: element.querySelector(".category").value,
    source: element.querySelector(".source").value,
    destination: element.querySelector(".destination").value,
    auth: element.querySelector(".auth").value,
    scopes: element.querySelector(".scopes").value,
    model_visible: element.querySelector(".model-visible").checked,
    user_visible: element.querySelector(".user-visible").checked,
    third_party: element.querySelector(".third-party").checked,
    disclosure: element.querySelector(".disclosure").value,
    retention: element.querySelector(".retention").value,
    retention_days: element.querySelector(".retention-days").value,
    logging: element.querySelector(".logging").value,
    redaction: element.querySelector(".redaction").value,
    action: element.querySelector(".action").value,
    confirmation: element.querySelector(".confirmation").checked,
    required: element.querySelector(".required").checked
  };
}

function syncCards() { state.flows = [...document.querySelectorAll(".flow-card")].map(readCard); }

function render({ focusId = null } = {}) {
  $("#project").value = state.project;
  $("#privacy-url").value = state.privacy_url;
  $("#security-contact").value = state.security_contact;
  const list = $("#flows");
  list.innerHTML = state.flows.map(card).join("") || `<div class="empty"><h3>No data flows yet</h3><p>Add a flow or load the sample. Enter descriptions, never real records or credentials.</p></div>`;
  [...list.querySelectorAll(".flow-card")].forEach((element, index) => hydrateCard(element, state.flows[index]));
  bindCards();
  renderAudit();
  if (focusId) list.querySelector(`[data-id="${CSS.escape(focusId)}"] .tool`)?.focus();
}

function renderAudit() {
  syncHeader();
  syncCards();
  const audit = auditDocument(state);
  const errors = audit.findings.filter(item => item.severity === "error").length;
  const warnings = audit.findings.length - errors;
  $("#status-title").textContent = audit.ready ? "Ready for human review" : state.flows.length ? "Needs attention" : "No flows loaded";
  $("#status-copy").textContent = audit.ready ? `${warnings} warning${warnings === 1 ? "" : "s"}; verify the declarations against implementation.` : `${errors} blocking finding${errors === 1 ? "" : "s"} must be resolved before JSON export.`;
  $("#status").dataset.ready = String(audit.ready);
  $("#findings").innerHTML = audit.findings.length ? audit.findings.map(item => `<li class="${item.severity}"><strong>${esc(item.code)}</strong><span>${esc(item.message)}</span></li>`).join("") : `<li class="success"><strong>clear</strong><span>No automated findings.</span></li>`;
  $("#export-json").disabled = !audit.ready;
  document.querySelectorAll(".flow-card").forEach((element, index) => {
    const flow = state.flows[index];
    element.querySelector(".retention-days").closest("label").hidden = flow.retention !== "days";
    element.querySelector(".redaction").closest("label").hidden = flow.logging !== "redacted";
    element.querySelector(".disclosure").closest("label").hidden = !flow.third_party;
  });
}

function bindCards() {
  document.querySelectorAll(".flow-card").forEach(element => {
    element.addEventListener("input", renderAudit);
    element.addEventListener("change", renderAudit);
    element.querySelector(".tool").addEventListener("input", event => { element.querySelector("h3").textContent = event.target.value || "Unnamed flow"; });
    element.querySelector(".remove").addEventListener("click", () => {
      syncHeader(); syncCards();
      const index = state.flows.findIndex(flow => flow.id === element.dataset.id);
      state.flows.splice(index, 1); render();
      const buttons = [...document.querySelectorAll(".remove")];
      (buttons[Math.min(index, buttons.length - 1)] ?? $("#add"))?.focus();
    });
  });
}

function clearState() {
  syncHeader(); syncCards();
  undo = structuredClone(state);
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { undo = null; $("#undo").hidden = true; }, 10_000);
  state = blankDocument();
  render();
  $("#undo").hidden = false;
}

function replaceState(next) {
  syncHeader(); syncCards();
  undo = structuredClone(state);
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { undo = null; $("#undo").hidden = true; }, 10_000);
  state = next;
  render();
  $("#undo").hidden = false;
}

document.querySelectorAll("#project,#privacy-url,#security-contact").forEach(element => element.addEventListener("input", renderAudit));
$("#add").addEventListener("click", () => { syncHeader(); syncCards(); const flow = blankFlow(); state.flows.push(flow); render({ focusId: flow.id }); });
$("#sample").addEventListener("click", () => replaceState(safeSample()));
$("#clear").addEventListener("click", clearState);
$("#undo").addEventListener("click", () => { if (!undo) return; state = undo; undo = null; clearTimeout(undoTimer); $("#undo").hidden = true; render(); });
$("#export-json").addEventListener("click", () => { syncHeader(); syncCards(); const audit = auditDocument(state); if (audit.ready) download("plugin-data-boundaries.json", JSON.stringify(audit.document, null, 2), "application/json"); });
$("#export-report").addEventListener("click", () => { syncHeader(); syncCards(); download("plugin-data-boundary-review.md", reportMarkdown(state), "text/markdown"); });
$("#file").addEventListener("change", async event => { const file = event.target.files[0]; if (!file) return; try { if (file.size > INPUT_LIMIT_BYTES) throw new Error("Input exceeds the 1 MB limit."); replaceState(parseDocument(await file.text())); } catch (error) { alert(`Import failed: ${error.message}`); } finally { event.target.value = ""; } });
$("#theme").addEventListener("click", () => { const next = document.documentElement.dataset.theme === "light" ? "dark" : "light"; document.documentElement.dataset.theme = next; localStorage.setItem("boundary-theme", next); $("#theme").textContent = next === "light" ? "Use dark theme" : "Use light theme"; });
const theme = localStorage.getItem("boundary-theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
document.documentElement.dataset.theme = theme;
$("#theme").textContent = theme === "light" ? "Use dark theme" : "Use light theme";
state = normalizeDocument(state);
render();
