# Research and scope decision

Research was refreshed on 2026-10-20 MYT from official OpenAI, MCP, OWASP, LINDDUN, GitHub, and Vercel sources before implementation.

## OpenAI baseline

- [Package plugins](https://developers.openai.com/plugins/build/plugins): a plugin can package skills, MCP configuration, or both; `plugin.json` is the package manifest.
- [MCP server](https://developers.openai.com/plugins/build/mcp-server): tools expose live data and actions and need clear schemas, errors, authentication, and safety boundaries.
- [ChatGPT UI](https://developers.openai.com/plugins/build/chatgpt-ui): UI should add value for structured inspection, comparison, editing, confirmation, or navigation while tools remain useful without it.
- [Authentication](https://developers.openai.com/plugins/build/auth): use supported OAuth 2.1 patterns, validate tokens fully, and request minimum scopes.
- [Security and privacy](https://developers.openai.com/plugins/guides/security-privacy): minimize data, protect secrets, define retention and deletion, constrain third parties, and make consequential actions clear.
- [Use-case inventory](https://developers.openai.com/plugins/plan/use-case): record the user goal, request, result, context, capability, safety boundary, and support decision before implementation.
- [Testing](https://developers.openai.com/plugins/deploy/connect-chatgpt): test direct, indirect, follow-up, negative, and boundary behavior.
- [Submission and guidelines](https://developers.openai.com/plugins/deploy/submission): directory submission, identity, policy review, and publishing are separate human-governed actions.

## Alternatives and originality

- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) tests and debugs existing MCP servers through web, CLI, and TUI workflows. It does not create a pre-release, plugin-specific data minimization and retention inventory.
- [OWASP Threat Dragon](https://github.com/OWASP/threat-dragon) is a general threat-modeling and data-flow-diagram tool.
- [LINDDUN](https://linddun.org/) is a general privacy threat-modeling methodology.
- OpenAI's plugin creator helps package plugin projects; it is not a standalone evidence worksheet for declared tool-level data boundaries.

The useful gap is deliberately smaller: a no-account, no-upload inventory that creates reviewable JSON and Markdown evidence for plugin tool data flows. It does not replace general threat modeling, legal review, a privacy policy, implementation tests, or OpenAI review.

## Hosting choice

GitHub Pages was selected because this is a static personal open-source project and public repositories can use Pages under GitHub Free. No paid runner or service is required. GitHub documents request logging and Pages limits; the site contains no backend or user records. Vercel Hobby was evaluated but not needed.
