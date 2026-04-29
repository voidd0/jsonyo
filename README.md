# jsonyo

> **JSON swiss army knife. Eighteen commands. Zero limits. Free forever.**
> A gift to the terminal from [**vøiddo**](https://voiddo.com).

[![npm](https://img.shields.io/npm/v/@v0idd0/jsonyo?color=%2322c55e&label=%40v0idd0%2Fjsonyo)](https://www.npmjs.com/package/@v0idd0/jsonyo)
[![downloads](https://img.shields.io/npm/dm/@v0idd0/jsonyo?color=%2322c55e)](https://www.npmjs.com/package/@v0idd0/jsonyo)
[![license](https://img.shields.io/npm/l/@v0idd0/jsonyo?color=%2322c55e)](./LICENSE)
[![node](https://img.shields.io/node/v/@v0idd0/jsonyo?color=%2322c55e)](./package.json)

**[Homepage](https://voiddo.com/tools/jsonyo/)** · **[GitHub](https://github.com/voidd0/jsonyo)** · **[npm](https://www.npmjs.com/package/@v0idd0/jsonyo)** · **[All tools](https://voiddo.com/tools/)** · **[Contact](mailto:support@voiddo.com)**

---

## Why jsonyo

Every other JSON CLI gives you three commands and paywalls the rest. `jq` is powerful but hostile. Online editors leak your data. Online formatters die on anything over a megabyte.

**jsonyo is one binary, eighteen commands, and no artificial limits.** No file-size caps. No daily quota. No PRO tier. No sign-up. No telemetry. No "upgrade to unlock" nag screens. You install it, you use it, it works.

It exists because we got tired of paying `$9.99/mo` to format JSON that already lived on our own laptop.

## Install

```bash
# npm
npm install -g @v0idd0/jsonyo

# or pnpm / yarn / bun
pnpm add -g @v0idd0/jsonyo
yarn global add @v0idd0/jsonyo
bun add -g @v0idd0/jsonyo

# one-shot via npx (no install)
npx @v0idd0/jsonyo format data.json
```

Requires Node.js **≥ 14**.

## The Commands

| Command | What it does |
|---|---|
| `validate` · `v` | Check if JSON is valid (optionally against a JSON Schema) |
| `format` · `f` | Pretty-print with custom indent, tabs, sorted keys, fixed key order, trailing commas |
| `minify` · `m` | Compress to a single line |
| `query` · `q` | Extract values by JSONPath (filters, recursion, wildcards) |
| `keys` · `k` | List every key at any depth |
| `type` · `t` | Show inferred type and structural summary |
| `diff` · `d` | Compare two files — text diff or RFC 6902 patch |
| `stats` · `s` | Cardinality + shape statistics |
| `merge` | Merge unlimited files (last-wins, deep, or custom conflict strategy) |
| `flatten` | Flatten nested JSON with a custom separator |
| `unflatten` | Reverse it — rebuild nesting from dotted keys |
| `sort` | Sort keys or arrays by one or many fields |
| `filter` | Filter array elements with expressive predicates |
| `convert` | JSON ↔ YAML, TOML, CSV, XML — both directions |
| `schema` | Generate a JSON Schema from data, or validate against one |
| `generate` | Generate **TypeScript**, **Go**, **Python**, or **Rust** types from a sample |
| `batch` | Process **thousands of files** at once with glob patterns |
| `watch` | Watch files and auto-process on change |

## Usage

```bash
# validate
jsonyo validate data.json
cat data.json | jsonyo v

# format (4 spaces, keys sorted)
jsonyo format data.json -i 4 --sort-keys

# minify + save
jsonyo minify huge.json -o huge.min.json

# JSONPath query
jsonyo query users.json -p "$.users[?(@.age > 18)].email"

# diff as patch
jsonyo diff old.json new.json --format patch

# merge — unlimited files, deep strategy
jsonyo merge a.json b.json c.json d.json --strategy deep -o combined.json

# flatten with custom separator
jsonyo flatten nested.json --separator /

# sort by multiple keys
jsonyo sort data.json --by "country,name"

# filter with a predicate
jsonyo filter users.json --where "age > 18 && active"

# convert to YAML / TOML / CSV / XML
jsonyo convert data.json --to yaml
jsonyo convert data.json --to csv -o data.csv

# generate TypeScript types
jsonyo generate types response.json -o types.ts

# batch — glob across thousands of files
jsonyo batch format "./data/**/*.json" --sort-keys

# watch — auto-validate on save
jsonyo watch validate "./src/**/*.json"
```

## Pipe-friendly

Every command reads from stdin when no file is given, so jsonyo plays well with the rest of your toolbox.

```bash
curl -s https://api.example.com/data | jsonyo format -i 2
kubectl get pods -o json | jsonyo query -p "$.items[*].metadata.name"
aws ec2 describe-instances | jsonyo filter --where "State.Name == 'running'"
```

## Big files, big pipelines

- **No 10 MB cap** — if your laptop can hold it, jsonyo can chew it.
- **No op-per-day limit** — loop it, cron it, bake it into CI.
- **No network calls** — jsonyo is a local CLI. Your JSON never leaves your machine.

## Why free forever

We are [**vøiddo**](https://voiddo.com) — a studio building small, sharp tools and a few serious products ([scrb](https://scrb.voiddo.com), [rankd](https://rankd.voiddo.com), [gridlock](https://gl.voiddo.com), and more). The serious products pay for themselves. The tools are gifts.

We write them because _we_ need them, and leaving them free means we don't have to build a billing flow for a terminal utility.

## From the same studio

- **[@v0idd0/tokcount](https://www.npmjs.com/package/@v0idd0/tokcount)** — count LLM tokens before you pay for them
- **[@v0idd0/envguard](https://www.npmjs.com/package/@v0idd0/envguard)** — stop shipping `.env` drift to staging
- **[@v0idd0/depcheck](https://www.npmjs.com/package/@v0idd0/depcheck)** — find unused dependencies
- **[@v0idd0/gitstats](https://www.npmjs.com/package/@v0idd0/gitstats)** — git repo analytics, one command
- **[View all tools →](https://voiddo.com/tools/)**

## Contributing

Bugs, feature ideas, PRs welcome. Open an issue at [github.com/voidd0/jsonyo/issues](https://github.com/voidd0/jsonyo/issues) or drop a line to [support@voiddo.com](mailto:support@voiddo.com).

## License

MIT — see [LICENSE](./LICENSE).

---

Built by [vøiddo](https://voiddo.com/) — a small studio shipping AI-flavoured products, free dev tools, Chrome extensions and weird browser games.
