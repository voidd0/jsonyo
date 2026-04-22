// jsonyo - comprehensive test suite
// https://voiddo.com/tools/jsonyo/

const fs = require('fs');
const path = require('path');

// Core modules
const { parse, parseWithLocation, stringify, minify } = require('./src/core/parser');
const { querySimple, queryAdvanced, queryWithFilter } = require('./src/core/query');
const {
  flatten,
  unflatten,
  merge,
  sortKeys,
  sortArray,
  getNestedValue,
  filterArray,
  computeDiff,
  diffToPatch,
  computeStats,
  getAllKeys,
} = require('./src/core/transformer');
const { generateSchema, validateAgainstSchema } = require('./src/core/validator');
const { toYAML, fromYAML, toTOML, fromTOML, toCSV, fromCSV, toXML, fromXML } = require('./src/core/converter');
const { generateTypeScript, generateGo, generatePython } = require('./src/core/generator');

console.log('running tests... bruh.\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`\x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } catch (e) {
    console.log(`\x1b[31m✗\x1b[0m ${name}`);
    console.log(`  ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ============ PARSER TESTS ============
console.log('\n--- Parser Tests ---');

test('parse: valid JSON object', () => {
  const result = parse('{"name": "test", "value": 123}');
  assert(result.success === true);
  assertEqual(result.data, { name: 'test', value: 123 });
});

test('parse: valid JSON array', () => {
  const result = parse('[1, 2, 3, "four"]');
  assert(result.success === true);
  assertEqual(result.data, [1, 2, 3, 'four']);
});

test('parse: invalid JSON returns error', () => {
  const result = parse('{invalid}');
  assert(result.success === false);
  assert(result.error !== null);
});

test('parse: empty object', () => {
  const result = parse('{}');
  assert(result.success === true);
  assertEqual(result.data, {});
});

test('parse: null value', () => {
  const result = parse('null');
  assert(result.success === true);
  assert(result.data === null);
});

test('parseWithLocation: provides error location', () => {
  const result = parseWithLocation('{\n  "a": 1,\n  "b": }');
  assert(result.success === false);
  // Should have line info
  assert(result.error !== null);
});

test('stringify: formats with default indent', () => {
  const result = stringify({ a: 1, b: 2 });
  assert(result.includes('\n'));
  assert(result.includes('  "a"'));
});

test('stringify: respects custom indent', () => {
  const result = stringify({ a: 1 }, 4);
  assert(result.includes('    "a"'));
});

test('minify: removes whitespace', () => {
  const data = { a: 1, b: [1, 2, 3] };
  const result = minify(data);
  assert(!result.includes(' '));
  assert(!result.includes('\n'));
});

// ============ QUERY TESTS ============
console.log('\n--- Query Tests ---');

test('querySimple: root path', () => {
  const data = { name: 'test' };
  const result = querySimple(data, '$');
  assertEqual(result, data);
});

test('querySimple: simple property', () => {
  const data = { name: 'john' };
  const result = querySimple(data, '$.name');
  assert(result === 'john');
});

test('querySimple: nested property', () => {
  const data = { user: { name: 'john', age: 30 } };
  const result = querySimple(data, '$.user.name');
  assert(result === 'john');
});

test('querySimple: array index', () => {
  const data = { items: ['a', 'b', 'c'] };
  const result = querySimple(data, '$.items[1]');
  assert(result === 'b');
});

test('querySimple: wildcard array', () => {
  const data = { items: [{ id: 1 }, { id: 2 }, { id: 3 }] };
  const result = querySimple(data, '$.items[*].id');
  assertEqual(result, [1, 2, 3]);
});

test('querySimple: returns undefined for missing path', () => {
  const data = { a: 1 };
  const result = querySimple(data, '$.nonexistent');
  assert(result === undefined);
});

test('queryAdvanced: recursive descent', () => {
  const data = { a: { name: 'x' }, b: { c: { name: 'y' } } };
  const result = queryAdvanced(data, '$..name');
  assertEqual(result, ['x', 'y']);
});

test('queryAdvanced: filter expression', () => {
  const data = { users: [{ age: 15 }, { age: 25 }, { age: 35 }] };
  const result = queryAdvanced(data, '$.users[?(@.age > 20)]');
  assertEqual(result, [{ age: 25 }, { age: 35 }]);
});

test('queryAdvanced: slice notation', () => {
  const data = { items: [1, 2, 3, 4, 5] };
  const result = queryAdvanced(data, '$.items[1:4]');
  assertEqual(result, [2, 3, 4]);
});

// ============ TRANSFORMER TESTS ============
console.log('\n--- Transformer Tests ---');

test('flatten: simple object', () => {
  const data = { user: { name: 'john', age: 30 } };
  const result = flatten(data);
  assertEqual(result, { 'user.name': 'john', 'user.age': 30 });
});

test('flatten: with arrays', () => {
  const data = { items: ['a', 'b'] };
  const result = flatten(data);
  assert('items[0]' in result);
  assert(result['items[0]'] === 'a');
});

test('unflatten: simple object', () => {
  const data = { 'user.name': 'john', 'user.age': 30 };
  const result = unflatten(data);
  assertEqual(result, { user: { name: 'john', age: 30 } });
});

test('merge: simple merge', () => {
  const a = { x: 1, y: 2 };
  const b = { y: 3, z: 4 };
  const result = merge(a, b);
  assertEqual(result, { x: 1, y: 3, z: 4 });
});

test('merge: deep merge', () => {
  const a = { user: { name: 'john', settings: { theme: 'dark' } } };
  const b = { user: { settings: { lang: 'en' } } };
  const result = merge(a, b);
  assertEqual(result.user.settings, { theme: 'dark', lang: 'en' });
});

test('merge: concat arrays strategy', () => {
  const a = { items: [1, 2] };
  const b = { items: [3, 4] };
  const result = merge(a, b, 'concat-arrays');
  assertEqual(result.items, [1, 2, 3, 4]);
});

test('sortKeys: alphabetically', () => {
  const data = { z: 1, a: 2, m: 3 };
  const result = sortKeys(data);
  assertEqual(Object.keys(result), ['a', 'm', 'z']);
});

test('sortKeys: nested objects', () => {
  const data = { z: { b: 1, a: 2 } };
  const result = sortKeys(data);
  assertEqual(Object.keys(result.z), ['a', 'b']);
});

test('sortArray: by field', () => {
  const data = [{ name: 'charlie' }, { name: 'alice' }, { name: 'bob' }];
  const result = sortArray(data, 'name');
  assertEqual(result.map(x => x.name), ['alice', 'bob', 'charlie']);
});

test('sortArray: descending', () => {
  const data = [{ age: 20 }, { age: 30 }, { age: 10 }];
  const result = sortArray(data, 'age', { desc: true });
  assertEqual(result.map(x => x.age), [30, 20, 10]);
});

test('sortArray: numeric', () => {
  const data = [{ v: '10' }, { v: '2' }, { v: '100' }];
  const result = sortArray(data, 'v', { numeric: true });
  assertEqual(result.map(x => x.v), ['2', '10', '100']);
});

test('filterArray: simple condition', () => {
  const data = [{ age: 15 }, { age: 25 }, { age: 35 }];
  const result = filterArray(data, 'age > 20');
  assertEqual(result, [{ age: 25 }, { age: 35 }]);
});

test('filterArray: equality', () => {
  const data = [{ status: 'active' }, { status: 'inactive' }];
  const result = filterArray(data, "status == 'active'");
  assertEqual(result, [{ status: 'active' }]);
});

test('filterArray: truthy check', () => {
  const data = [{ active: true }, { active: false }, { active: true }];
  const result = filterArray(data, 'active');
  assert(result.length === 2);
});

test('computeDiff: identical objects', () => {
  const a = { x: 1, y: 2 };
  const b = { x: 1, y: 2 };
  const result = computeDiff(a, b);
  assert(result.length === 0);
});

test('computeDiff: value change', () => {
  const a = { x: 1 };
  const b = { x: 2 };
  const result = computeDiff(a, b);
  assert(result.length === 1);
  assert(result[0].type === 'value_change');
});

test('computeDiff: added key', () => {
  const a = { x: 1 };
  const b = { x: 1, y: 2 };
  const result = computeDiff(a, b);
  assert(result.some(d => d.type === 'added'));
});

test('computeDiff: removed key', () => {
  const a = { x: 1, y: 2 };
  const b = { x: 1 };
  const result = computeDiff(a, b);
  assert(result.some(d => d.type === 'removed'));
});

test('diffToPatch: creates valid patch', () => {
  const diff = [
    { path: '$.name', type: 'value_change', from: 'old', to: 'new' },
    { path: '$.age', type: 'added', value: 30 },
  ];
  const patch = diffToPatch(diff);
  assert(patch.length === 2);
  assert(patch[0].op === 'replace');
  assert(patch[1].op === 'add');
});

test('computeStats: counts types', () => {
  const data = { a: 'str', b: 123, c: true, d: null, e: [1, 2], f: { x: 1 } };
  const result = computeStats(data);
  assert(result.strings === 1);
  assert(result.numbers === 4); // 123, 1, 2, x:1
  assert(result.booleans === 1);
  assert(result.nulls === 1);
  assert(result.arrays === 1);
  assert(result.objects === 2);
});

test('computeStats: calculates depth', () => {
  const data = { a: { b: { c: { d: 1 } } } };
  const result = computeStats(data);
  assert(result.maxDepth === 4);
});

test('getAllKeys: depth 1', () => {
  const data = { a: { b: 1 }, c: 2 };
  const result = getAllKeys(data, 1);
  assert(result.includes('a'));
  assert(result.includes('c'));
  assert(!result.includes('a.b'));
});

test('getAllKeys: depth 2', () => {
  const data = { a: { b: { c: 1 } } };
  const result = getAllKeys(data, 2);
  assert(result.includes('a'));
  assert(result.includes('a.b'));
  assert(!result.includes('a.b.c'));
});

// ============ VALIDATOR TESTS ============
console.log('\n--- Validator Tests ---');

test('generateSchema: from object', () => {
  const data = { name: 'test', age: 30 };
  const schema = generateSchema(data);
  assert(schema.type === 'object');
  assert(schema.properties.name.type === 'string');
  assert(schema.properties.age.type === 'integer');
});

test('generateSchema: from array', () => {
  const data = [{ id: 1 }, { id: 2 }];
  const schema = generateSchema(data);
  assert(schema.type === 'array');
  assert(schema.items.type === 'object');
});

test('generateSchema: detects email format', () => {
  const data = { email: 'test@example.com' };
  const schema = generateSchema(data);
  assert(schema.properties.email.format === 'email');
});

test('generateSchema: detects date format', () => {
  const data = { date: '2024-01-15' };
  const schema = generateSchema(data);
  assert(schema.properties.date.format === 'date');
});

test('validateAgainstSchema: valid data', () => {
  const data = { name: 'test', age: 30 };
  const schema = { type: 'object', properties: { name: { type: 'string' }, age: { type: 'integer' } } };
  const errors = validateAgainstSchema(data, schema);
  assert(errors.length === 0);
});

test('validateAgainstSchema: type mismatch', () => {
  const data = { age: 'thirty' };
  const schema = { type: 'object', properties: { age: { type: 'integer' } } };
  const errors = validateAgainstSchema(data, schema);
  assert(errors.length > 0);
});

test('validateAgainstSchema: required missing', () => {
  const data = { name: 'test' };
  const schema = { type: 'object', properties: { age: { type: 'integer' } }, required: ['age'] };
  const errors = validateAgainstSchema(data, schema);
  assert(errors.some(e => e.message.includes('required')));
});

// ============ CONVERTER TESTS ============
console.log('\n--- Converter Tests ---');

test('toYAML: simple object', () => {
  const data = { name: 'test', value: 123 };
  const yaml = toYAML(data);
  assert(yaml.includes('name: test'));
  assert(yaml.includes('value: 123'));
});

test('toYAML: nested object', () => {
  const data = { user: { name: 'john' } };
  const yaml = toYAML(data);
  assert(yaml.includes('user:'));
  assert(yaml.includes('name: john'));
});

test('fromYAML: simple object', () => {
  const yaml = 'name: test\nvalue: 123';
  const data = fromYAML(yaml);
  assertEqual(data, { name: 'test', value: 123 });
});

test('toTOML: simple object', () => {
  const data = { name: 'test', value: 123 };
  const toml = toTOML(data);
  assert(toml.includes('name = "test"'));
  assert(toml.includes('value = 123'));
});

test('fromTOML: simple object', () => {
  const toml = 'name = "test"\nvalue = 123';
  const data = fromTOML(toml);
  assertEqual(data, { name: 'test', value: 123 });
});

test('toCSV: array of objects', () => {
  const data = [{ name: 'alice', age: 30 }, { name: 'bob', age: 25 }];
  const csv = toCSV(data);
  assert(csv.includes('name,age'));
  assert(csv.includes('alice,30'));
  assert(csv.includes('bob,25'));
});

test('fromCSV: parse with headers', () => {
  const csv = 'name,age\nalice,30\nbob,25';
  const data = fromCSV(csv);
  assert(data.length === 2);
  assert(data[0].name === 'alice');
  assert(data[0].age === 30);
});

test('toXML: simple object', () => {
  const data = { name: 'test' };
  const xml = toXML(data);
  assert(xml.includes('<?xml'));
  assert(xml.includes('<name>test</name>'));
});

test('fromXML: simple object', () => {
  const xml = '<?xml version="1.0"?><root><name>test</name><value>123</value></root>';
  const data = fromXML(xml);
  assert(data.name === 'test');
  assert(data.value === 123);
});

// ============ GENERATOR TESTS ============
console.log('\n--- Generator Tests ---');

test('generateTypeScript: simple object', () => {
  const data = { name: 'test', age: 30 };
  const ts = generateTypeScript(data);
  assert(ts.includes('interface Root'));
  assert(ts.includes('name: string'));
  assert(ts.includes('age: number'));
});

test('generateTypeScript: with arrays', () => {
  const data = { items: [{ id: 1 }] };
  const ts = generateTypeScript(data);
  assert(ts.includes('items: Items[]') || ts.includes('items: ItemsItem[]'));
});

test('generateGo: simple object', () => {
  const data = { name: 'test', age: 30 };
  const go = generateGo(data);
  assert(go.includes('type Root struct'));
  assert(go.includes('Name string'));
  assert(go.includes('Age int'));
});

test('generatePython: simple object', () => {
  const data = { name: 'test', age: 30 };
  const py = generatePython(data);
  assert(py.includes('@dataclass'));
  assert(py.includes('class Root'));
  assert(py.includes('name: str'));
  assert(py.includes('age: int'));
});

// ============ EDGE CASES ============
console.log('\n--- Edge Cases ---');

test('edge: empty object', () => {
  const result = parse('{}');
  assert(result.success);
  const keys = getAllKeys(result.data, 1);
  assert(keys.length === 0);
});

test('edge: empty array', () => {
  const result = parse('[]');
  assert(result.success);
  assert(Array.isArray(result.data));
});

test('edge: deeply nested', () => {
  const data = { a: { b: { c: { d: { e: { f: 1 } } } } } };
  const stats = computeStats(data);
  assert(stats.maxDepth === 6);
});

test('edge: unicode strings', () => {
  const data = { name: '日本語テスト', emoji: '🎉' };
  const json = stringify(data);
  const parsed = parse(json);
  assertEqual(parsed.data, data);
});

test('edge: special characters in keys', () => {
  const data = { 'key-with-dash': 1, 'key.with.dot': 2 };
  const json = stringify(data);
  const parsed = parse(json);
  assert(parsed.data['key-with-dash'] === 1);
});

test('edge: large numbers', () => {
  const data = { big: 9007199254740991 };
  const json = stringify(data);
  const parsed = parse(json);
  assert(parsed.data.big === 9007199254740991);
});

test('edge: boolean values', () => {
  const data = { t: true, f: false };
  const flat = flatten(data);
  assert(flat.t === true);
  assert(flat.f === false);
});

test('edge: null values', () => {
  const data = { empty: null };
  const flat = flatten(data);
  assert(flat.empty === null);
});

// ============ SUMMARY ============
console.log(`\n${'='.repeat(40)}`);
console.log(`${passed}/${passed + failed} tests passed`);

if (failed > 0) {
  console.log(`\x1b[31m${failed} tests failed\x1b[0m`);
  process.exit(1);
} else {
  console.log('\x1b[32mall tests passed. bruh.\x1b[0m');
  process.exit(0);
}
