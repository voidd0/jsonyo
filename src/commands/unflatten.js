// jsonyo - unflatten command

const { parse, stringify } = require('../core/parser');
const { unflatten } = require('../core/transformer');
const { colors } = require('../utils/output');

function run(input, options = {}) {
  const { separator = '.' } = options;

  const result = parse(input);

  if (!result.success) {
    console.log(colors.error(`✗ invalid JSON: ${result.error}`));
    process.exit(1);
  }

  const unflattened = unflatten(result.data, separator);
  return stringify(unflattened, 2);
}

module.exports = { run };
