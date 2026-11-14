# heysteff agent skills

Skills so your coding agent (Claude Code, Codex, Cursor and any agent that reads `SKILL.md`) can integrate, automate and observe the [heysteff](https://developers.heysteff.com) API, with **the same `POST /v1/messages` for WhatsApp, Instagram, Messenger, SMS and email**.

[Español](./README.md) · [Docs](https://developers.heysteff.com/en/docs/coding-agents#skill) · [GitHub](https://github.com/heysteff-com/agent-skills)

| Skill | What for |
| --- | --- |
| [`heysteff-integrate`](skills/heysteff-integrate/SKILL.md) | API key, sending on any channel, webhooks, customers and setup links |
| [`heysteff-automate`](skills/heysteff-automate/SKILL.md) | Flows, campaigns (bulk sends) and WhatsApp templates |
| [`heysteff-observe`](skills/heysteff-observe/SKILL.md) | Message status, webhook deliveries, retries, API logs and plan usage |

Each skill ships dependency-free `.mjs` scripts. The ones that send something to a real person do nothing without `--confirm`, and none of them prints the key. The skills and script output are in Spanish.

## Requirements

- An account at [developers.heysteff.com](https://developers.heysteff.com/console/register?lang=en) (Developer Free costs nothing).
- An API key created in [the console](https://developers.heysteff.com/console/) → API keys, with the scopes for what you ask for:

  | Skill | Scopes |
  | --- | --- |
  | `heysteff-integrate` | `messages:write`, `conversations:read`, `webhooks:read`, `webhooks:write`, `customers:read`, `customers:write` |
  | `heysteff-automate` | `automations:trigger`, `campaigns:read`, `campaigns:write`, `messages:write`, `templates:write` |
  | `heysteff-observe` | `conversations:read`, `webhooks:read`, `webhooks:write` |

  A test key (`sk_test_…`) is enough to start: it sends through the [sandbox](https://developers.heysteff.com/en/docs/sandbox) with `messages:write`, `conversations:read` and `conversations:write`.
- Node 20 or newer, for the scripts.

## Quickstart

1. Install the skills:

   ```bash
   npx skills add heysteff-com/agent-skills
   ```

   Or copy a skill folder to `~/.claude/skills/` (Claude Code) or to your agent's skills folder.

2. Set the key in your environment (or in `.env.local`, outside git). The scripts read `HEYSTEFF_API_KEY`:

   ```bash
   export HEYSTEFF_API_KEY=<YOUR_API_KEY>
   ```

3. Join the sandbox with your WhatsApp: in the console, under Developers, there is a code (`DEV-…`) and a button that opens WhatsApp with the message ready. Send it from your phone.

4. Ask your agent: "With the heysteff-integrate skill, send 'Hello from the sandbox' on WhatsApp to my phone". The agent first runs the script without `--confirm`, shows you what it would send and waits for your yes:

   ```bash
   node skills/heysteff-integrate/scripts/send-message.mjs --channel whatsapp_cloud --to +15551234567 --text "Hello from the sandbox"
   ```

5. Once you confirm, it repeats it with `--confirm` and checks the status with `message-status.mjs <id>`.

## Usage

### heysteff-integrate

```bash
node scripts/send-message.mjs --channel instagram --contact-ref <id> --text "Hi" --confirm
node scripts/send-message.mjs --channel whatsapp_cloud --to +15551234567 --template order_ready --lang en --param "Ana" --confirm
node scripts/send-message.mjs --channel whatsapp_cloud --to +15551234567 --text "Hi" --customer-id <uuid> --confirm
node scripts/message-status.mjs <message_id>
node scripts/webhooks.mjs create --url https://your-app.com/webhooks/heysteff --events message:received --confirm
node scripts/customers.mjs create --external-id acme-42 --name "Acme Inc"
node scripts/customers.mjs link <customer_id> --channels whatsapp_cloud,instagram
```

Channels (`--channel`): `whatsapp_cloud`, `whatsapp_baileys`, `instagram`, `facebook`, `sms` and `gmail`. Every send carries an `Idempotency-Key`: repeating the same command after a network error does not duplicate the message.

### heysteff-automate

```bash
node scripts/trigger-flow.mjs <flow_id> --phone +15551234567 --var order=1042 --confirm
node scripts/campaign.mjs create --file campaign.json --confirm
node scripts/bulk-send.mjs --file list.csv --template order_ready --lang en --confirm
node scripts/templates.mjs list
```

### heysteff-observe

```bash
node scripts/webhook-deliveries.mjs --status failed
node scripts/retry-delivery.mjs <delivery_id> --confirm
node scripts/message-status.mjs <message_id>
```

The scripts use `https://app.heysteff.com/api` by default; set another base with `HEYSTEFF_API_URL`.

## Set it up with your AI

Copy this text and paste it into Claude Code, Cursor, Codex or ChatGPT:

```text
I want you to use the heysteff skills (github.com/heysteff-com/agent-skills) to integrate,
automate and check WhatsApp, Instagram, Messenger, SMS and email messages. They all go out
with the same POST /v1/messages.

Sources of truth (read them before acting; they win over what you remember):
- https://developers.heysteff.com/AGENTS.md
- https://app.heysteff.com/api/v1/llms-full.txt
- The SKILL.md of each skill

Steps:
1. Check Node 20+. Install the skills with npx skills add heysteff-com/agent-skills
   (or copy skills/heysteff-integrate, skills/heysteff-automate and skills/heysteff-observe to
   your skills folder).
2. The key goes in the HEYSTEFF_API_KEY variable. If a file is needed, create .env.local with
   HEYSTEFF_API_KEY=<YOUR_API_KEY>, make sure it is in .gitignore and I will replace the value.
   Do not ask me for the key in the chat. For testing I will use a test key (sk_test_…).
3. Verify: run skills/heysteff-integrate/scripts/send-message.mjs with --channel whatsapp_cloud
   --to <PHONE_JOINED_TO_THE_SANDBOX> --text "Hello from the heysteff sandbox" WITHOUT --confirm,
   show me what it would send and wait for my yes. Then repeat it with --confirm and check the
   status with message-status.mjs <id>.

Safety rules:
- Never write the API key in code, in tracked files, in commits, in logs or in this chat,
  and never pass it as a command argument.
- Before any send to real people (message, template, campaign, flow or webhook retry), show me
  the exact recipient, channel and text and wait for my confirmation.
- Do not invent endpoints: only the routes under https://app.heysteff.com/api/v1/ exist.
- A 403 means the key is missing a scope: tell me instead of working around it.
```

## Links

- Docs: [Coding agents and MCP](https://developers.heysteff.com/en/docs/coding-agents) · [Sandbox](https://developers.heysteff.com/en/docs/sandbox) · [Webhooks](https://developers.heysteff.com/en/docs/webhooks)
- GitHub: [heysteff-com/agent-skills](https://github.com/heysteff-com/agent-skills)
- Plugin for Claude Code, Cursor and Codex: [heysteff-com/agent-plugins](https://github.com/heysteff-com/agent-plugins)
- CLI: [@heysteff/cli](https://www.npmjs.com/package/@heysteff/cli) · SDK: [@heysteff/sdk](https://www.npmjs.com/package/@heysteff/sdk)
- License: [MIT](./LICENSE)
