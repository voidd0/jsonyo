// jsonyo - filter command

const { parse, stringify } = require('../core/parser');
const { filterArray, getNestedValue } = require('../core/transformer');
const { colors } = require('../utils/output');

function run(input, options = {}) {
  const { path = null, where, select = null } = options;

  if (!where) {
    console.log(colors.error('need a --where condition'));
    process.exit(1);
  }

  const result = parse(input);

  if (!result.success) {
    console.log(colors.error(`✗ invalid JSON: ${result.error}`));
    process.exit(1);
  }

  // Get array to filter
  let arr = result.data;
  if (path) {
    const cleanPath = path.replace(/^\$\.?/, '');
    arr = getNestedValue(result.data, cleanPath);
  }

  if (!Array.isArray(arr)) {
    console.log(colors.error(`✗ target is not an array`));
    process.exit(1);
  }

  // Normalize condition
  let normalizedWhere = where
    .replace(/\bAND\b/gi, '&&')
    .replace(/\bOR\b/gi, '||');

  // Filter
  const filtered = filterArray(arr, normalizedWhere);

  // Select specific fields
  if (select) {
    const fields = select.split(',').map(f => f.trim());
    const selected = filtered.map(item => {
      const obj = {};
      for (const field of fields) {
        obj[field] = getNestedValue(item, field);
      }
      return obj;
    });
    return stringify(selected, 2);
  }

  return stringify(filtered, 2);
}

module.exports = { run };
