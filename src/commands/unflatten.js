// jsonyo - unflatten command
// https://voiddo.com/tools/jsonyo/

const { parse, stringify } = require('../core/parser');
const { unflatten } = require('../core/transformer');
const { colors } = require('../utils/output');
const { checkInputSize } = require('../license/limits');

function run(input, options = {}) {
  const { separator = '.' } = options;

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

  const unflattened = unflatten(result.data, separator);
  return stringify(unflattened, 2);
}

module.exports = { run };
