// jsonyo - watch command
// https://voiddo.com/tools/jsonyo/

const fs = require('fs');
const path = require('path');
const { parse, stringify, minify } = require('../core/parser');
const { validateAgainstSchema } = require('../core/validator');
const { colors, success } = require('../utils/output');
const { requirePro, checkFileSize } = require('../license/limits');

function run(command, pattern, options = {}) {
  // Legacy PRO gate retained as no-op (stubs always pass).
  if (!requirePro('watch')) {
    process.exit(1);
  }

  const { schema = null, output: outputDir = null } = options;

  console.log(colors.info(`watching: ${pattern}`));
  console.log(colors.muted('press Ctrl+C to stop\n'));

  // Get initial files
  const files = new Set();
  const glob = require('glob');

  function refreshFiles() {
    const found = glob.sync(pattern, { nodir: true });
    found.forEach(f => files.add(f));
  }

  refreshFiles();

  // Process a single file
  function processFile(file) {
    try {
      const sizeCheck = checkFileSize(file);
      if (!sizeCheck.allowed) {
        console.log(colors.warning(`⚠ ${file} - file too large`));
        return;
      }

      const input = fs.readFileSync(file, 'utf8');
      const result = parse(input);

      if (!result.success) {
        console.log(colors.error(`✗ ${file} - ${result.error}`));
        return;
      }

      switch (command) {
        case 'validate':
          if (schema) {
            const schemaContent = fs.readFileSync(schema, 'utf8');
            const schemaObj = JSON.parse(schemaContent);
            const errors = validateAgainstSchema(result.data, schemaObj);

            if (errors.length > 0) {
              console.log(colors.error(`✗ ${file} - ${errors[0].message}`));
              return;
            }
          }
          console.log(colors.success(`✓ ${file} - valid`));
          break;

        case 'format':
          const formatted = stringify(result.data, 2);

          if (outputDir) {
            const outFile = path.join(outputDir, path.basename(file));
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }
            fs.writeFileSync(outFile, formatted);
            console.log(colors.success(`✓ ${file} → ${outFile}`));
          } else {
            fs.writeFileSync(file, formatted);
            console.log(colors.success(`✓ ${file} - formatted`));
          }
          break;

        case 'minify':
          const minified = minify(result.data);

          if (outputDir) {
            const baseName = path.basename(file, '.json') + '.min.json';
            const outFile = path.join(outputDir, baseName);
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }
            fs.writeFileSync(outFile, minified);
            console.log(colors.success(`✓ ${file} → ${outFile}`));
          } else {
            const minFile = file.replace('.json', '.min.json');
            fs.writeFileSync(minFile, minified);
            console.log(colors.success(`✓ ${file} → ${minFile}`));
          }
          break;

        default:
          console.log(colors.error(`unknown watch command: ${command}`));
          process.exit(1);
      }
    } catch (e) {
      console.log(colors.error(`✗ ${file} - ${e.message}`));
    }
  }

  // Set up file watching
  const chokidar = require('chokidar');

  const watcher = chokidar.watch(pattern, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  watcher
    .on('change', (file) => {
      console.log(colors.muted(`[${new Date().toLocaleTimeString()}] changed: ${file}`));
      processFile(file);
    })
    .on('add', (file) => {
      console.log(colors.muted(`[${new Date().toLocaleTimeString()}] added: ${file}`));
      files.add(file);
      processFile(file);
    })
    .on('unlink', (file) => {
      console.log(colors.muted(`[${new Date().toLocaleTimeString()}] removed: ${file}`));
      files.delete(file);
    })
    .on('error', (error) => {
      console.log(colors.error(`watch error: ${error.message}`));
    });

  // Process existing files initially
  for (const file of files) {
    processFile(file);
  }

  // Keep process alive
  process.on('SIGINT', () => {
    console.log(colors.muted('\nstopping watch...'));
    watcher.close();
    process.exit(0);
  });
}

module.exports = { run };
