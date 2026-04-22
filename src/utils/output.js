// jsonyo - colored output utilities
// https://voiddo.com/tools/jsonyo/

const chalk = require('chalk');

const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  muted: chalk.gray,
  accent: chalk.magenta,
  highlight: chalk.bold.white,
  pro: chalk.hex('#FFD700'),
  brand: chalk.hex('#00D4FF'),
};

function success(msg) {
  console.log(colors.success('✓') + ' ' + msg);
}

function error(msg) {
  console.error(colors.error('✗') + ' ' + msg);
}

function warning(msg) {
  console.log(colors.warning('⚠') + ' ' + msg);
}

function info(msg) {
  console.log(colors.info('ℹ') + ' ' + msg);
}

function divider() {
  console.log(colors.muted('━'.repeat(53)));
}

function box(content, options = {}) {
  const { title, color = 'info' } = options;
  divider();
  if (title) {
    console.log(colors[color](title));
  }
  console.log(content);
  divider();
}

function proBox(content) {
  divider();
  console.log(content);
  divider();
}

function jsonError(input, errorMsg) {
  // Try to parse and find line number from error
  const lineMatch = errorMsg.match(/position (\d+)/i) || errorMsg.match(/at (\d+)/i);

  if (lineMatch) {
    const position = parseInt(lineMatch[1]);
    const lines = input.split('\n');
    let charCount = 0;
    let errorLine = 0;
    let errorCol = 0;

    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= position) {
        errorLine = i + 1;
        errorCol = position - charCount;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }

    console.log(colors.error(`✗ invalid JSON at line ${errorLine}, column ${errorCol}`));
    console.log(colors.muted(`  ${errorMsg}\n`));

    // Show context
    const start = Math.max(0, errorLine - 2);
    const end = Math.min(lines.length, errorLine + 1);

    for (let i = start; i < end; i++) {
      const lineNum = String(i + 1).padStart(4, ' ');
      if (i + 1 === errorLine) {
        console.log(colors.error(`${lineNum} | ${lines[i]}`));
        console.log(colors.error(' '.repeat(6 + errorCol) + '^'));
      } else {
        console.log(colors.muted(`${lineNum} | ${lines[i]}`));
      }
    }
  } else {
    console.log(colors.error('✗ invalid JSON'));
    console.log(colors.muted(`  ${errorMsg}`));
  }
}

function formatNumber(num) {
  return num.toLocaleString();
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

module.exports = {
  colors,
  success,
  error,
  warning,
  info,
  divider,
  box,
  proBox,
  jsonError,
  formatNumber,
  formatBytes,
};
