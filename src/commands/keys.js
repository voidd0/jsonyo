// jsonyo - keys command
// https://voiddo.com/tools/jsonyo/

const { parse } = require('../core/parser');
const { getAllKeys } = require('../core/transformer');
const { colors } = require('../utils/output');
const { checkInputSize } = require('../license/limits');

function run(input, options = {}) {
  const { depth = 1 } = options;

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

  const keys = getAllKeys(result.data, depth);
  return keys.join('\n');
}

module.exports = { run };
