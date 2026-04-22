// jsonyo - merge command
// https://voiddo.com/tools/jsonyo/

const fs = require('fs');
const { parse, stringify } = require('../core/parser');
const { merge } = require('../core/transformer');
const { colors } = require('../utils/output');
const { checkFileSize, checkMergeLimit } = require('../license/limits');
const { isPro } = require('../license/checker');

function run(files, options = {}) {
  const { strategy = 'overwrite', output = null, onConflict = null } = options;

  if (files.length < 2) {
    console.log(colors.error('bruh. need at least 2 files to merge'));
    process.exit(1);
  }

  // Check merge limit
  const mergeCheck = checkMergeLimit(files.length);
  if (!mergeCheck.allowed) {
    process.exit(1);
  }

  // Legacy PRO gate retained as no-op (stubs always pass).
  if ((onConflict || files.length > 2) && !isPro()) {
    const { showUpsell, UPSELL_TYPES } = require('../utils/upsell');
    showUpsell(UPSELL_TYPES.PRO_FEATURE, { feature: 'merge' });
    process.exit(1);
  }

  // Check file sizes and parse all files
  const objects = [];

  for (const file of files) {
    const sizeCheck = checkFileSize(file);
    if (!sizeCheck.allowed) {
      process.exit(1);
    }

    const input = fs.readFileSync(file, 'utf8');
    const result = parse(input);

    if (!result.success) {
      console.log(colors.error(`✗ invalid JSON in ${file}: ${result.error}`));
      process.exit(1);
    }

    if (typeof result.data !== 'object' || Array.isArray(result.data)) {
      console.log(colors.error(`✗ ${file} must be an object (not array or primitive)`));
      process.exit(1);
    }

    objects.push(result.data);
  }

  // Merge all objects
  let result = objects[0];
  for (let i = 1; i < objects.length; i++) {
    result = merge(result, objects[i], strategy);
  }

  const output_str = stringify(result, 2);

  if (output) {
    fs.writeFileSync(output, output_str);
    console.log(colors.success(`✓ merged ${files.length} files → ${output}`));
  } else {
    console.log(output_str);
  }
}

module.exports = { run };
