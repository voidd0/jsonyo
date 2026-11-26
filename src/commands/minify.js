// jsonyo - minify command

const { parse, minify } = require('../core/parser');
const { colors } = require('../utils/output');

function run(input) {
  const result = parse(input);

  if (!result.success) {
    console.log(colors.error(`✗ invalid JSON: ${result.error}`));
    process.exit(1);
  }

  return minify(result.data);
}

module.exports = { run };
