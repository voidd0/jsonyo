// jsonyo - stats command
// https://voiddo.com/tools/jsonyo/

const { parse, minify } = require('../core/parser');
const { computeStats } = require('../core/transformer');
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

  const stats = computeStats(result.data);
  const originalSize = Buffer.byteLength(input, 'utf8');
  const minifiedSize = minify(result.data).length;

  console.log(colors.highlight('JSON stats:'));
  console.log(`  objects:   ${colors.info(formatNumber(stats.objects))}`);
  console.log(`  arrays:    ${colors.info(formatNumber(stats.arrays))}`);
  console.log(`  strings:   ${colors.info(formatNumber(stats.strings))}`);
  console.log(`  numbers:   ${colors.info(formatNumber(stats.numbers))}`);
  console.log(`  booleans:  ${colors.info(formatNumber(stats.booleans))}`);
  console.log(`  nulls:     ${colors.info(formatNumber(stats.nulls))}`);
  console.log(`  max depth: ${colors.info(stats.maxDepth)}`);
  console.log(`  size:      ${colors.info(formatBytes(originalSize))}`);
  console.log(`  minified:  ${colors.info(formatBytes(minifiedSize))}`);
}

module.exports = { run };
