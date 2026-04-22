// jsonyo - validate command
// https://voiddo.com/tools/jsonyo/

const fs = require('fs');
const { parseWithLocation, getErrorContext } = require('../core/parser');
const { colors, success, jsonError } = require('../utils/output');
const { checkInputSize, checkFileSize } = require('../license/limits');
const { isPro } = require('../license/checker');
const { validateAgainstSchema } = require('../core/validator');

function run(input, options = {}) {
  const { schema } = options;

  // Check input size
  const sizeCheck = checkInputSize(input);
  if (!sizeCheck.allowed) {
    process.exit(1);
  }

  // Parse JSON
  const result = parseWithLocation(input);

  if (!result.success) {
    jsonError(input, result.error);
    process.exit(1);
  }

  // Legacy PRO gate retained as no-op (stubs always pass).
  if (schema) {
    if (!isPro()) {
      const { showUpsell, UPSELL_TYPES } = require('../utils/upsell');
      showUpsell(UPSELL_TYPES.PRO_FEATURE, { feature: 'schema' });
      process.exit(1);
    }

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

      success('valid JSON, matches schema. nice.');
    } catch (e) {
      console.log(colors.error(`✗ error reading schema: ${e.message}`));
      process.exit(1);
    }
  } else {
    success('valid JSON. nice.');
  }
}

module.exports = { run };
