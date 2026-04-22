// jsonyo - diff command
// https://voiddo.com/tools/jsonyo/

const fs = require('fs');
const { parse, stringify } = require('../core/parser');
const { computeDiff, diffToPatch } = require('../core/transformer');
const { colors, success } = require('../utils/output');
const { checkFileSize } = require('../license/limits');
const { isPro } = require('../license/checker');

function run(file1, file2, options = {}) {
  const { format = 'text', ignore = null, visual = false } = options;

  // Check file sizes
  const size1 = checkFileSize(file1);
  if (!size1.allowed) process.exit(1);

  const size2 = checkFileSize(file2);
  if (!size2.allowed) process.exit(1);

  // Legacy PRO gate retained as no-op (stubs always pass).
  if ((format === 'patch' || ignore || visual) && !isPro()) {
    const { showUpsell, UPSELL_TYPES } = require('../utils/upsell');
    showUpsell(UPSELL_TYPES.PRO_FEATURE, { feature: 'diff' });
    process.exit(1);
  }

  const input1 = fs.readFileSync(file1, 'utf8');
  const input2 = fs.readFileSync(file2, 'utf8');

  const result1 = parse(input1);
  const result2 = parse(input2);

  if (!result1.success) {
    console.log(colors.error(`✗ invalid JSON in ${file1}: ${result1.error}`));
    process.exit(1);
  }

  if (!result2.success) {
    console.log(colors.error(`✗ invalid JSON in ${file2}: ${result2.error}`));
    process.exit(1);
  }

  let differences = computeDiff(result1.data, result2.data);

  // Filter ignored paths
  if (ignore) {
    const ignorePaths = ignore.split(',').map(p => p.trim());
    differences = differences.filter(d =>
      !ignorePaths.some(ip => d.path.startsWith(ip))
    );
  }

  if (differences.length === 0) {
    success('no differences. nice.');
    return;
  }

  // Output format
  if (format === 'patch') {
    const patch = diffToPatch(differences);
    console.log(stringify(patch, 2));
    return;
  }

  if (format === 'json') {
    console.log(stringify(differences, 2));
    return;
  }

  // Text format
  console.log(`found ${differences.length} difference(s):\n`);

  for (const d of differences) {
    switch (d.type) {
      case 'added':
        console.log(colors.success(`  + ${d.path}: ${JSON.stringify(d.value)}`));
        break;
      case 'removed':
        console.log(colors.error(`  - ${d.path}: ${JSON.stringify(d.value)}`));
        break;
      case 'value_change':
        console.log(colors.warning(`  ~ ${d.path}: ${JSON.stringify(d.from)} → ${JSON.stringify(d.to)}`));
        break;
      case 'type_change':
        console.log(colors.accent(`  ! ${d.path}: type ${d.from} → ${d.to}`));
        break;
      case 'array_length':
        console.log(colors.info(`  # ${d.path}: length ${d.from} → ${d.to}`));
        break;
    }
  }
}

module.exports = { run };
