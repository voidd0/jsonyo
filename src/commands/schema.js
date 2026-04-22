// jsonyo - schema command
// https://voiddo.com/tools/jsonyo/

const fs = require('fs');
const { parse, stringify } = require('../core/parser');
const { generateSchema, validateAgainstSchema } = require('../core/validator');
const { colors, success, error } = require('../utils/output');
const { checkInputSize, requirePro } = require('../license/limits');

function run(subcommand, input, options = {}) {
  // Legacy PRO gate retained as no-op (stubs always pass).
  if (!requirePro('schema')) {
    process.exit(1);
  }

  if (subcommand === 'generate') {
    return runGenerate(input, options);
  } else if (subcommand === 'validate') {
    return runValidate(input, options);
  } else {
    console.log(colors.error('bruh. use: jsonyo schema generate OR jsonyo schema validate'));
    process.exit(1);
  }
}

function runGenerate(input, options = {}) {
  const { output = null, title = 'Generated Schema' } = options;

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

  const schema = generateSchema(result.data, { title });
  const schemaJson = stringify(schema, 2);

  if (output) {
    fs.writeFileSync(output, schemaJson);
    success(`schema generated → ${output}`);
  } else {
    console.log(schemaJson);
  }
}

function runValidate(input, options = {}) {
  const { schema: schemaFile } = options;

  if (!schemaFile) {
    console.log(colors.error('bruh. need --schema <file>'));
    process.exit(1);
  }

  // Check input size
  const sizeCheck = checkInputSize(input);
  if (!sizeCheck.allowed) {
    process.exit(1);
  }

  // Parse data
  const result = parse(input);
  if (!result.success) {
    console.log(colors.error(`✗ invalid JSON: ${result.error}`));
    process.exit(1);
  }

  // Read schema
  let schema;
  try {
    const schemaContent = fs.readFileSync(schemaFile, 'utf8');
    schema = JSON.parse(schemaContent);
  } catch (e) {
    console.log(colors.error(`✗ invalid schema file: ${e.message}`));
    process.exit(1);
  }

  // Validate
  const errors = validateAgainstSchema(result.data, schema);

  if (errors.length === 0) {
    success('valid - data matches schema. nice.');
  } else {
    console.log(colors.error('✗ schema validation failed:'));
    for (const err of errors) {
      console.log(colors.muted(`  - ${err.path}: ${err.message}`));
    }
    process.exit(1);
  }
}

module.exports = { run };
