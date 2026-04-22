// jsonyo - batch command
// https://voiddo.com/tools/jsonyo/

const fs = require('fs');
const path = require('path');
const { parse, stringify, minify } = require('../core/parser');
const { validateAgainstSchema } = require('../core/validator');
const { toYAML, toTOML, toCSV, toXML } = require('../core/converter');
const { colors, success, formatNumber } = require('../utils/output');
const { requirePro, checkFileSize } = require('../license/limits');

function run(command, pattern, options = {}) {
  // Legacy PRO gate retained as no-op (stubs always pass).
  if (!requirePro('batch')) {
    process.exit(1);
  }

  const { output: outputDir = null, schema = null, to = null, ignore = null } = options;

  // Get files matching pattern
  const files = resolveFiles(pattern, ignore);

  if (files.length === 0) {
    console.log(colors.warning('no files found matching pattern'));
    process.exit(0);
  }

  if (files.length > 1000) {
    console.log(colors.error(`bruh. too many files (${files.length}). max is 1000`));
    process.exit(1);
  }

  console.log(colors.info(`processing ${formatNumber(files.length)} files...\n`));

  let passed = 0;
  let failed = 0;
  const errors = [];

  for (const file of files) {
    try {
      // Check file size
      const sizeCheck = checkFileSize(file);
      if (!sizeCheck.allowed) {
        failed++;
        errors.push({ file, error: 'file too large' });
        continue;
      }

      const input = fs.readFileSync(file, 'utf8');
      const result = parse(input);

      if (!result.success) {
        failed++;
        errors.push({ file, error: result.error });
        console.log(colors.error(`✗ ${file}`));
        continue;
      }

      switch (command) {
        case 'validate':
          if (schema) {
            const schemaContent = fs.readFileSync(schema, 'utf8');
            const schemaObj = JSON.parse(schemaContent);
            const validationErrors = validateAgainstSchema(result.data, schemaObj);

            if (validationErrors.length > 0) {
              failed++;
              errors.push({ file, error: validationErrors[0].message });
              console.log(colors.error(`✗ ${file} - ${validationErrors[0].message}`));
              continue;
            }
          }
          passed++;
          console.log(colors.success(`✓ ${file}`));
          break;

        case 'format':
          const formatted = stringify(result.data, 2);
          writeOutput(file, formatted, outputDir, '.json');
          passed++;
          console.log(colors.success(`✓ ${file}`));
          break;

        case 'minify':
          const minified = minify(result.data);
          writeOutput(file, minified, outputDir, '.min.json');
          passed++;
          console.log(colors.success(`✓ ${file}`));
          break;

        case 'convert':
          if (!to) {
            console.log(colors.error('bruh. need --to format for batch convert'));
            process.exit(1);
          }

          let converted;
          let ext;
          switch (to) {
            case 'yaml':
            case 'yml':
              converted = toYAML(result.data);
              ext = '.yaml';
              break;
            case 'toml':
              converted = toTOML(result.data);
              ext = '.toml';
              break;
            case 'csv':
              converted = toCSV(result.data);
              ext = '.csv';
              break;
            case 'xml':
              converted = toXML(result.data);
              ext = '.xml';
              break;
            default:
              converted = stringify(result.data, 2);
              ext = '.json';
          }

          writeOutput(file, converted, outputDir, ext);
          passed++;
          console.log(colors.success(`✓ ${file} → ${to}`));
          break;

        default:
          console.log(colors.error(`unknown batch command: ${command}`));
          process.exit(1);
      }
    } catch (e) {
      failed++;
      errors.push({ file, error: e.message });
      console.log(colors.error(`✗ ${file} - ${e.message}`));
    }
  }

  // Summary
  console.log('');
  if (failed === 0) {
    success(`${passed}/${passed} passed`);
  } else {
    console.log(colors.warning(`${passed}/${passed + failed} passed, ${failed} failed`));
  }
}

function resolveFiles(pattern, ignore) {
  const glob = require('glob');

  let files;
  if (pattern.includes('*')) {
    files = glob.sync(pattern, { nodir: true });
  } else if (fs.existsSync(pattern) && fs.statSync(pattern).isDirectory()) {
    files = glob.sync(path.join(pattern, '**/*.json'), { nodir: true });
  } else if (fs.existsSync(pattern)) {
    files = [pattern];
  } else {
    files = [];
  }

  // Apply ignore patterns
  if (ignore) {
    const ignorePatterns = ignore.split(',').map(p => p.trim());
    files = files.filter(f =>
      !ignorePatterns.some(ip => f.includes(ip))
    );
  }

  return files;
}

function writeOutput(inputFile, content, outputDir, extension) {
  let outputPath;

  if (outputDir) {
    // Create output directory if needed
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseName = path.basename(inputFile, path.extname(inputFile));
    outputPath = path.join(outputDir, baseName + extension);
  } else {
    // In-place modification
    if (extension !== '.json' && extension !== path.extname(inputFile)) {
      const baseName = path.basename(inputFile, path.extname(inputFile));
      outputPath = path.join(path.dirname(inputFile), baseName + extension);
    } else {
      outputPath = inputFile;
    }
  }

  fs.writeFileSync(outputPath, content);
}

module.exports = { run };
