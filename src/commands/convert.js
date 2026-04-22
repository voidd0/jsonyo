// jsonyo - convert command
// https://voiddo.com/tools/jsonyo/

const fs = require('fs');
const path = require('path');
const { parse, stringify } = require('../core/parser');
const { toYAML, fromYAML, toTOML, fromTOML, toCSV, fromCSV, toXML, fromXML } = require('../core/converter');
const { colors, success } = require('../utils/output');
const { checkInputSize, requirePro } = require('../license/limits');

const FORMATS = ['json', 'yaml', 'yml', 'toml', 'csv', 'xml'];

function detectFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  if (ext === 'yml') return 'yaml';
  return FORMATS.includes(ext) ? ext : 'json';
}

function run(input, options = {}) {
  const { to, output = null, from = null, inputFile = null } = options;

  // Legacy PRO gate retained as no-op (stubs always pass).
  if (!requirePro('convert')) {
    process.exit(1);
  }

  // Check input size
  const sizeCheck = checkInputSize(input);
  if (!sizeCheck.allowed) {
    process.exit(1);
  }

  // Detect input format
  let sourceFormat = from;
  if (!sourceFormat && inputFile) {
    sourceFormat = detectFormat(inputFile);
  }
  sourceFormat = sourceFormat || 'json';

  // Parse input
  let data;
  try {
    switch (sourceFormat) {
      case 'yaml':
      case 'yml':
        data = fromYAML(input);
        break;
      case 'toml':
        data = fromTOML(input);
        break;
      case 'csv':
        data = fromCSV(input);
        break;
      case 'xml':
        data = fromXML(input);
        break;
      default:
        const result = parse(input);
        if (!result.success) {
          console.log(colors.error(`✗ invalid JSON: ${result.error}`));
          process.exit(1);
        }
        data = result.data;
    }
  } catch (e) {
    console.log(colors.error(`✗ failed to parse ${sourceFormat}: ${e.message}`));
    process.exit(1);
  }

  // Determine output format
  let targetFormat = to;
  if (!targetFormat && output) {
    targetFormat = detectFormat(output);
  }

  if (!targetFormat) {
    console.log(colors.error('bruh. need --to format or -o output.ext'));
    process.exit(1);
  }

  // Convert to target format
  let result;
  try {
    switch (targetFormat) {
      case 'yaml':
      case 'yml':
        result = toYAML(data);
        break;
      case 'toml':
        result = toTOML(data);
        break;
      case 'csv':
        result = toCSV(data);
        break;
      case 'xml':
        result = toXML(data);
        break;
      case 'json':
      default:
        result = stringify(data, 2);
    }
  } catch (e) {
    console.log(colors.error(`✗ failed to convert to ${targetFormat}: ${e.message}`));
    process.exit(1);
  }

  if (output) {
    fs.writeFileSync(output, result);
    success(`converted ${sourceFormat} → ${targetFormat} → ${output}`);
  } else {
    console.log(result);
  }
}

module.exports = { run };
