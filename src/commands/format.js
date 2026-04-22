// jsonyo - format command
// https://voiddo.com/tools/jsonyo/

const { parse, stringify } = require('../core/parser');
const { sortKeys } = require('../core/transformer');
const { colors } = require('../utils/output');
const { checkInputSize } = require('../license/limits');
const { isPro } = require('../license/checker');

function run(input, options = {}) {
  const {
    indent = 2,
    tabs = false,
    sortKeysFlag = false,
    keyOrder = null,
    trailingCommas = false,
  } = options;

  // Check input size
  const sizeCheck = checkInputSize(input);
  if (!sizeCheck.allowed) {
    process.exit(1);
  }

  // Legacy PRO gate retained as no-op (stubs always pass).
  if ((sortKeysFlag || keyOrder || trailingCommas) && !isPro()) {
    const { showUpsell, UPSELL_TYPES } = require('../utils/upsell');
    showUpsell(UPSELL_TYPES.PRO_FEATURE, { feature: 'format' });
    process.exit(1);
  }

  const result = parse(input);

  if (!result.success) {
    console.log(colors.error(`✗ invalid JSON: ${result.error}`));
    process.exit(1);
  }

  let data = result.data;

  // Sort keys if requested
  if (sortKeysFlag) {
    data = sortKeys(data);
  } else if (keyOrder) {
    const order = keyOrder.split(',').map(k => k.trim());
    data = sortKeys(data, order);
  }

  // Format
  const indentValue = tabs ? '\t' : indent;
  let output = stringify(data, indentValue);

  // Trailing commas (for JS config files)
  if (trailingCommas) {
    output = output.replace(/([}\]"'\d])\n(\s*[}\]])/g, '$1,\n$2');
  }

  return output;
}

module.exports = { run };
