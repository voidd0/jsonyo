// jsonyo - query command
// https://voiddo.com/tools/jsonyo/

const { parse, stringify } = require('../core/parser');
const { querySimple, queryAdvanced } = require('../core/query');
const { colors } = require('../utils/output');
const { checkInputSize } = require('../license/limits');
const { isPro } = require('../license/checker');

function run(input, options = {}) {
  const { path, outputFormat = 'json' } = options;

  if (!path) {
    console.log(colors.error('bruh. need a path. use -p "$.your.path"'));
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

  // Check for advanced query features
  const isAdvancedQuery = path.includes('..') ||
                          path.includes('[?') ||
                          /\[\d*:\d*\]/.test(path) ||
                          path.includes('=~');

  let queryResult;

  if (isAdvancedQuery) {
    if (!isPro()) {
      const { showUpsell, UPSELL_TYPES } = require('../utils/upsell');
      showUpsell(UPSELL_TYPES.PRO_FEATURE, { feature: 'query' });
      process.exit(1);
    }
    queryResult = queryAdvanced(result.data, path);
  } else {
    queryResult = querySimple(result.data, path);
  }

  if (queryResult === undefined) {
    console.log(colors.error(`✗ path not found: ${path}`));
    process.exit(1);
  }

  // Output formatting
  if (outputFormat === 'csv' && isPro() && Array.isArray(queryResult)) {
    const { toCSV } = require('../core/converter');
    return toCSV(queryResult);
  }

  if (typeof queryResult === 'object' && queryResult !== null) {
    return stringify(queryResult, 2);
  }

  return String(queryResult);
}

module.exports = { run };
