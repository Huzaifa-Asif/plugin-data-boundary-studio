# Plugin Data Boundary Studio

A browser-local technical inventory for mapping the data handled by an OpenAI plugin's tools. It helps teams make collection purpose, source and destination boundaries, model/user visibility, authentication, minimum scopes, retention, logging, redaction, third-party transfer, and confirmation requirements reviewable before release.

This is not a privacy-policy generator, legal advice, certification, or an OpenAI submission tool. Passing its deliberately narrow checks does not prove that an implementation matches the inventory.

## Why it exists

Plugin architecture documentation explains what skills, MCP servers, and optional UI can do, but release reviewers still need concrete evidence about each data flow. General privacy-threat-modeling products are broader; this project focuses on a small, exportable plugin-tool inventory without collecting the underlying records.

## Run locally

Requires Node.js 20 or newer. The project has no runtime or development dependencies.

```sh
npm run check
npm start
```

Open `http://127.0.0.1:4176`. The local server binds only to loopback, checks the Host header, serves a fixed allowlist, and sends a restrictive Content Security Policy.

## CLI

```sh
node src/cli.mjs path/to/data-boundary.json
node src/cli.mjs path/to/data-boundary.json --json
```

Exit codes are 0 for no blocking automated findings, 1 for findings, and 2 for invalid input. Input must be a regular JSON file no larger than 1 MB.

## Privacy and security

- All editing and checks run in the browser; there are no analytics, cookies, accounts, remote APIs, or third-party scripts.
- Do not enter credentials, access tokens, production records, personal records, or regulated data. Describe field names and categories only.
- Imports are limited to 1 MB and 60 flows, normalized through an allowlist, and rendered as text.
- The exporter scans for common credential shapes and blocks machine-readable export when it finds one.
- GitHub Pages, like other web hosting, receives normal request metadata such as IP address and user agent.

See [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md), and [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md).

## Development

`npm run check` runs whitespace linting, JavaScript syntax checks, the static production build, and unit/security tests. Pull requests should include relevant negative and boundary tests.

MIT licensed. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SUPPORT.md](SUPPORT.md).
