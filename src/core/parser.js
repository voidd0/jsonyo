// jsonyo - JSON parsing with better errors
// https://voiddo.com/tools/jsonyo/

function parse(input) {
  try {
    return { success: true, data: JSON.parse(input), error: null };
  } catch (e) {
    return { success: false, data: null, error: e.message };
  }
}

function parseWithLocation(input) {
  try {
    const data = JSON.parse(input);
    return { success: true, data, error: null, line: null, column: null };
  } catch (e) {
    const posMatch = e.message.match(/position (\d+)/i) || e.message.match(/at (\d+)/i);
    let line = null;
    let column = null;

    if (posMatch) {
      const position = parseInt(posMatch[1]);
      const lines = input.split('\n');
      let charCount = 0;

      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= position) {
          line = i + 1;
          column = position - charCount + 1;
          break;
        }
        charCount += lines[i].length + 1;
      }
    }

    return { success: false, data: null, error: e.message, line, column };
  }
}

function stringify(data, indent = 2) {
  return JSON.stringify(data, null, indent);
}

function minify(data) {
  return JSON.stringify(data);
}

// Get context lines around an error
function getErrorContext(input, line, contextLines = 2) {
  const lines = input.split('\n');
  const start = Math.max(0, line - 1 - contextLines);
  const end = Math.min(lines.length, line + contextLines);

  return lines.slice(start, end).map((content, i) => ({
    lineNumber: start + i + 1,
    content,
    isError: start + i + 1 === line,
  }));
}

module.exports = {
  parse,
  parseWithLocation,
  stringify,
  minify,
  getErrorContext,
};
