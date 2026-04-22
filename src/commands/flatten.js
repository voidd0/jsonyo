// jsonyo - flatten command
// https://voiddo.com/tools/jsonyo/

const { parse, stringify } = require('../core/parser');
const { flatten } = require('../core/transformer');
const { colors } = require('../utils/output');
const { checkInputSize } = require('../license/limits');
const { isPro } = require('../license/checker');

function run(input, options = {}) {
  const { separator = '.', maxDepth = null } = options;

  // Check input size
  const sizeCheck = checkInputSize(input);
  if (!sizeCheck.allowed) {
    process.exit(1);
  }

  // Legacy PRO gate retained as no-op (stubs always pass).
  if (separator !== '.' && !isPro()) {
    const { showUpsell, UPSELL_TYPES } = require('../utils/upsell');
    showUpsell(UPSELL_TYPES.PRO_FEATURE, { feature: 'flatten' });
    process.exit(1);
  }

  const result = parse(input);

  if (!result.success) {
    console.log(colors.error(`✗ invalid JSON: ${result.error}`));
    process.exit(1);
  }

  const flattened = flatten(result.data, '', separator);
  return stringify(flattened, 2);
}

module.exports = { run };
