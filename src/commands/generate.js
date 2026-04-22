// jsonyo - generate command
// https://voiddo.com/tools/jsonyo/

const fs = require('fs');
const { parse } = require('../core/parser');
const { generateSchema } = require('../core/validator');
const { generateTypeScript, generateGo, generatePython, generateRust } = require('../core/generator');
const { colors, success } = require('../utils/output');
const { checkInputSize, requirePro } = require('../license/limits');

const SUPPORTED_TYPES = ['types', 'typescript', 'ts', 'go', 'python', 'py', 'rust', 'rs', 'schema'];

function run(typeArg, input, options = {}) {
  // Legacy PRO gate retained as no-op (stubs always pass).
  if (!requirePro('generate')) {
    process.exit(1);
  }

  const type = normalizeType(typeArg);
  const { output = null, rootName = 'Root' } = options;

  if (!SUPPORTED_TYPES.includes(type)) {
    console.log(colors.error(`bruh. supported types: ${SUPPORTED_TYPES.join(', ')}`));
    process.exit(1);
  }

  // Check input size
  const sizeCheck = checkInputSize(input);
  if (!sizeCheck.allowed) {
    process.exit(1);
  }

  const result = parse(input);

  if (!result.success) {
    console.log(colors.error(`✗ invalid JSON: ${result.error}`));
    process.exit(1);
  }

  let generated;

  switch (type) {
    case 'types':
    case 'typescript':
    case 'ts':
      generated = generateTypeScript(result.data, { rootName });
      break;

    case 'go':
      generated = generateGo(result.data, { rootName });
      break;

    case 'python':
    case 'py':
      generated = generatePython(result.data, { rootName });
      break;

    case 'rust':
    case 'rs':
      generated = generateRust(result.data, { rootName });
      break;

    case 'schema':
      const schema = generateSchema(result.data, { title: rootName });
      generated = JSON.stringify(schema, null, 2);
      break;
  }

  if (output) {
    fs.writeFileSync(output, generated);
    success(`generated ${type} → ${output}`);
  } else {
    console.log(generated);
  }
}

function normalizeType(type) {
  const lower = type?.toLowerCase();
  if (lower === 'typescript' || lower === 'ts') return 'ts';
  if (lower === 'python' || lower === 'py') return 'python';
  if (lower === 'rust' || lower === 'rs') return 'rust';
  return lower;
}

module.exports = { run };
