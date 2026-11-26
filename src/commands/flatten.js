// jsonyo - flatten command

const { parse, stringify } = require('../core/parser');
const { flatten } = require('../core/transformer');
const { colors } = require('../utils/output');

function run(input, options = {}) {
  const { separator = '.', maxDepth = null } = options;

  const result = parse(input);

  if (!result.success) {
    console.log(colors.error(`✗ invalid JSON: ${result.error}`));
    process.exit(1);
  }

  const flattened = flatten(result.data, '', separator);
  return stringify(flattened, 2);
}

module.exports = { run };
