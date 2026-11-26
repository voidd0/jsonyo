// jsonyo - validate command

const fs = require('fs');
const { parseWithLocation, getErrorContext } = require('../core/parser');
const { colors, success, jsonError } = require('../utils/output');
const { validateAgainstSchema } = require('../core/validator');

function run(input, options = {}) {
  const { schema } = options;

  // Parse JSON
  const result = parseWithLocation(input);

  if (!result.success) {
    jsonError(input, result.error);
    process.exit(1);
  }

  if (schema) {
    try {
      const schemaContent = fs.readFileSync(schema, 'utf8');
      const schemaObj = JSON.parse(schemaContent);
      const errors = validateAgainstSchema(result.data, schemaObj);

      if (errors.length > 0) {
        console.log(colors.error('✗ schema validation failed:'));
        for (const err of errors) {
          console.log(colors.muted(`  - ${err.path}: ${err.message}`));
        }
        process.exit(1);
      }

      success('valid JSON, matches schema.');
    } catch (e) {
      console.log(colors.error(`✗ error reading schema: ${e.message}`));
      process.exit(1);
    }
  } else {
    success('valid JSON.');
  }
}

module.exports = { run };
