// jsonyo - sort command
// https://voiddo.com/tools/jsonyo/

const { parse, stringify } = require('../core/parser');
const { sortKeys, sortArray, getNestedValue, setNestedValue } = require('../core/transformer');
const { colors } = require('../utils/output');
const { checkInputSize } = require('../license/limits');
const { isPro } = require('../license/checker');

function run(input, options = {}) {
  const { path = null, by = null, desc = false, numeric = false } = options;

  // Check input size
  const sizeCheck = checkInputSize(input);
  if (!sizeCheck.allowed) {
    process.exit(1);
  }

  // Legacy PRO gate retained as no-op (stubs always pass).
  if (by && by.includes(',') && !isPro()) {
    const { showUpsell, UPSELL_TYPES } = require('../utils/upsell');
    showUpsell(UPSELL_TYPES.PRO_FEATURE, { feature: 'sort' });
    process.exit(1);
  }

  const result = parse(input);

  if (!result.success) {
    console.log(colors.error(`✗ invalid JSON: ${result.error}`));
    process.exit(1);
  }

  let data = result.data;

  // Sort array at specific path
  if (path && by) {
    const cleanPath = path.replace(/^\$\.?/, '');
    const arr = getNestedValue(data, cleanPath);

    if (!Array.isArray(arr)) {
      console.log(colors.error(`✗ path ${path} is not an array`));
      process.exit(1);
    }

    const sorted = sortArray(arr, by, { desc, numeric });

    // Set back
    if (cleanPath) {
      const parts = cleanPath.split('.');
      let current = data;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = sorted;
    } else {
      data = sorted;
    }
  }
  // Sort object keys
  else if (!path && !by) {
    data = sortKeys(data);
  }
  // Sort root array
  else if (!path && by) {
    if (!Array.isArray(data)) {
      console.log(colors.error('✗ root is not an array'));
      process.exit(1);
    }
    data = sortArray(data, by, { desc, numeric });
  }

  return stringify(data, 2);
}

module.exports = { run };
