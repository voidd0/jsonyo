# jsonyo

A command line tool for everyday JSON work: validate, format, query, diff, merge and convert between YAML, TOML, CSV and XML. Reach for it when you want one tool for the usual JSON chores, including generating type definitions from a sample file.

[![npm](https://img.shields.io/npm/v/@v0idd0/jsonyo?color=00f6d0&labelColor=050914)](https://www.npmjs.com/package/@v0idd0/jsonyo)
[![test](https://github.com/voidd0/jsonyo/actions/workflows/test.yml/badge.svg)](https://github.com/voidd0/jsonyo/actions/workflows/test.yml)
[![license](https://img.shields.io/badge/license-MIT-00f6d0?labelColor=050914)](LICENSE)

## Install

```bash
npm install -g @v0idd0/jsonyo
```

Or run it once without installing: `npx @v0idd0/jsonyo --help`. Needs Node.js 18 or newer. Depends on chalk, chokidar and glob.

## Example

The demo file `users.json` holds three users on one line. `format` pretty prints it. Output from a real run on 2026-11-26:

```console
$ cat users.json
{"users":[{"name":"Ada","age":36,"active":true},{"name":"Bob","age":17,"active":false},{"name":"Cy","age":42,"active":true}]}

$ jsonyo format users.json
{
  "users": [
    {
      "name": "Ada",
      "age": 36,
      "active": true
    },
    {
      "name": "Bob",
      "age": 17,
      "active": false
    },
    {
      "name": "Cy",
      "age": 42,
      "active": true
    }
  ]
}
```

`query` keeps the users older than 18:

```console
$ jsonyo query users.json -p '$.users[?(@.age > 18)]'
[
  {
    "name": "Ada",
    "age": 36,
    "active": true
  },
  {
    "name": "Cy",
    "age": 42,
    "active": true
  }
]
```

`convert` writes the same data as YAML:

```console
$ jsonyo convert users.json --to yaml
users:
  -
    name: Ada
    age: 36
    active: true
  -
    name: Bob
    age: 17
    active: false
  -
    name: Cy
    age: 42
    active: true
```


## Usage

```text
  jsonyo: JSON command line tool with 18 commands.

  Usage:
    jsonyo <command> [options] [file]
    cat file.json | jsonyo <command>

  Commands:
    validate, v     Check if JSON is valid
    format, f       Pretty print JSON
    minify, m       Minify JSON
    query, q        Extract value by path (JSONPath, filters, recursion)
    keys, k         List all keys at any depth
    type, t         Show type and structural summary
    diff, d         Compare two JSON files (text or RFC 6902 patch)
    stats, s        Shape + cardinality statistics
    merge           Merge two or more JSON files (overwrite or concat-arrays)
    flatten         Flatten nested JSON with custom separators
    unflatten       Unflatten dotted keys back to nested
    sort            Sort keys or arrays by one or many fields
    filter          Filter array elements with predicates
    convert         JSON ↔ YAML / TOML / CSV / XML
    schema          Validate against JSON Schema, or generate one
    generate        Generate TypeScript / Go / Python / Rust types
    batch           Run a command on many files at once (glob pattern, up to 1000 files)
    watch           Watch files and auto-process on change

  Options:
    -i, --indent    Indentation for format (default: 2)
    -p, --path      JSONPath for query
    --depth         Depth for keys (default: 1)
    --by            Field to sort by (comma-separated for multi-key)
    --where         Filter predicate
    --to            Target format for convert (json, yaml, toml, csv, xml); csv for query
    --from          Source format for convert (default: from file extension, else json)
    --schema        Schema file for validation
    --tabs          Indent format output with tabs
    --sort-keys     Sort object keys (format)
    --key-order     Comma-separated key order for format
    --trailing-commas  Add trailing commas in format output
    --select        Fields to keep in filter (comma-separated)
    --desc          Sort descending
    --numeric       Sort values as numbers
    --strategy      Merge strategy: overwrite (default) or concat-arrays
    --format        Diff output: text (default), json or patch
    --ignore        Diff paths to ignore (comma-separated)
    --root-name     Root type name for generate and schema
    --separator     Separator for flatten and unflatten (default: .)
    -o, --output    Output file
    -h, --help      Show this help
    --version       Show version

  Examples:
    jsonyo validate data.json
    jsonyo format data.json -i 4
    jsonyo query data.json -p "$.users[?(@.age > 18)]"
    jsonyo diff old.json new.json --format patch
    jsonyo merge a.json b.json c.json -o combined.json
    jsonyo flatten nested.json --separator /
    jsonyo sort data.json --by "country,name"
    jsonyo filter data.json -p users --where "age > 18 && active"
    jsonyo convert data.json --to yaml
    jsonyo generate types data.json -o types.ts
    jsonyo batch format "./data/**/*.json"

  Docs and issues: https://github.com/voidd0/jsonyo
```

## Commands

| Command | What it does |
|---|---|
| `validate` | Check that the input is valid JSON, optionally against a JSON Schema |
| `format` | Pretty print, with sorted or ordered keys if you ask |
| `minify` | Remove all whitespace |
| `query` | Extract values with a JSONPath expression |
| `keys` | List keys down to a chosen depth |
| `type` | Show the type and structure of the data |
| `diff` | Compare two files, as text, JSON or an RFC 6902 patch |
| `stats` | Count objects, arrays, strings, numbers and nesting depth |
| `merge` | Merge two or more JSON files |
| `flatten` | Turn nested JSON into flat dotted keys |
| `unflatten` | Turn dotted keys back into nested JSON |
| `sort` | Sort arrays by one or more fields |
| `filter` | Keep array items that match a condition |
| `convert` | Convert between JSON, YAML, TOML, CSV and XML |
| `schema` | Generate a JSON Schema, or validate data against one |
| `generate` | Generate TypeScript, Go, Python or Rust types |
| `batch` | Run a command on all files that match a glob pattern |
| `watch` | Re-run a command when matching files change |

Input comes from a file argument or from stdin.

## Limits

A path after a filter, such as `$.users[?(@.age > 18)].name`, is not applied: the matching items come back whole. `filter --where` accepts `&&` and `||` without parentheses.

## License

MIT, see [LICENSE](LICENSE).

---

Made by [vøiddo](https://voiddo.com/?src=gh). More command line tools: [voiddo.com/packages](https://voiddo.com/packages/?src=gh).
We also run data scrapers for job boards, shops and ad libraries: [voiddo.com/scrapers](https://voiddo.com/scrapers/?src=gh).
