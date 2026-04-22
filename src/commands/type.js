// jsonyo - type command
// https://voiddo.com/tools/jsonyo/

const { parse } = require('../core/parser');
const { colors, formatNumber, formatBytes } = require('../utils/output');
const { checkInputSize } = require('../license/limits');

function run(input) {
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

  const data = result.data;

  if (Array.isArray(data)) {
    const output = `array (${formatNumber(data.length)} items)`;
    console.log(colors.info(output));
  } else if (data === null) {
    console.log(colors.muted('null'));
  } else if (typeof data === 'object') {
    const keyCount = Object.keys(data).length;
    const output = `object (${formatNumber(keyCount)} keys)`;
    console.log(colors.info(output));
  } else {
    console.log(colors.info(typeof data));
  }
}

module.exports = { run };
