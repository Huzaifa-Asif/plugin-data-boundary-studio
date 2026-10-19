# Threat model

## Assets and trust boundaries

The app should contain only schema descriptions, decisions, and public review metadata. Browser memory and user-created downloads are the principal assets. Trust boundaries are imported JSON, DOM rendering, file downloads, browser local storage for the theme, the development server, and static hosting.

## Controls

| Threat | Control | Residual risk |
| --- | --- | --- |
| A user pastes a credential | UI warnings, common-secret detection, blocked ready state, report redaction | Detection is heuristic; users must not paste secrets |
| Imported active content executes | JSON-only input, strict enum/type and duplicate-ID rejection, allowlist normalization, escaped DOM and Markdown output, CSP | Browser defects and future unsafe changes remain possible |
| Oversized or deeply broad input degrades the page | Pre-read 1 MB file check, fail-closed maximum 60 flows, string length caps | Highly nested JSON within 1 MB can still consume parsing time |
| Development server leaks files | Loopback bind, Host-header check, fixed route allowlist, no directory traversal | Local malware can access loopback services |
| Inventory silently leaves the browser | No fetches, remote APIs, analytics, fonts, or third-party scripts; CSP `connect-src 'none'` | Hosting still receives ordinary request metadata |
| Generated evidence is mistaken for certification | Persistent scope notices in UI, exports, README, and docs | A downstream reader can remove notices |
| Sensitive action lacks user control | Automated confirmation rule for write/destructive flows | Actual implementation may diverge from declaration |
| Retention or logging is understated | Explicit categories and rules plus required human implementation check | Declarations remain self-reported |

## Non-goals

This project does not inspect network traffic, credentials, remote systems, source code, privacy law, or actual data deletion. It does not create OAuth clients, request grants, submit plugins, or attest compliance.
