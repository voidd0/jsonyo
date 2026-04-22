// jsonyo - JSONPath query implementation
// https://voiddo.com/tools/jsonyo/

const { getNestedValue } = require('./transformer');

// Simple JSONPath query (FREE version)
function querySimple(obj, path) {
  // Handle basic paths like $.users[0].name or $.items[*].id
  const cleanPath = path.replace(/^\$\.?/, '');

  if (!cleanPath) return obj;

  // Handle wildcard [*] for arrays
  if (cleanPath.includes('[*]')) {
    return queryWildcard(obj, cleanPath);
  }

  return getNestedValue(obj, cleanPath);
}

// Handle wildcard queries
function queryWildcard(obj, path) {
  const parts = path.split(/\.|\[/).filter(Boolean).map(p => p.replace(/\]$/, ''));

  function traverse(current, partIndex) {
    if (partIndex >= parts.length) return current;

    const part = parts[partIndex];

    if (part === '*') {
      if (!Array.isArray(current)) return undefined;
      return current.map(item => traverse(item, partIndex + 1)).filter(x => x !== undefined);
    }

    if (/^\d+$/.test(part)) {
      if (!current || !current[parseInt(part)]) return undefined;
      return traverse(current[parseInt(part)], partIndex + 1);
    }

    if (!current || !(part in current)) return undefined;
    return traverse(current[part], partIndex + 1);
  }

  return traverse(obj, 0);
}

// Advanced JSONPath query with filters (PRO version)
function queryAdvanced(obj, path) {
  // Handle recursive descent ..
  if (path.includes('..')) {
    return queryRecursive(obj, path);
  }

  // Handle filter expressions [?(...)]
  if (path.includes('[?')) {
    return queryWithFilter(obj, path);
  }

  // Handle slice notation [start:end]
  if (/\[\d*:\d*\]/.test(path)) {
    return queryWithSlice(obj, path);
  }

  return querySimple(obj, path);
}

// Recursive descent (..)
function queryRecursive(obj, path) {
  const results = [];
  const targetKey = path.split('..')[1]?.replace(/^\$\.?/, '').split('.')[0];

  if (!targetKey) return results;

  function recurse(current) {
    if (current === null || typeof current !== 'object') return;

    if (Array.isArray(current)) {
      current.forEach(item => recurse(item));
    } else {
      for (const [key, value] of Object.entries(current)) {
        if (key === targetKey) {
          results.push(value);
        }
        if (typeof value === 'object') {
          recurse(value);
        }
      }
    }
  }

  recurse(obj);
  return results;
}

// Filter expressions [?(@.field == value)]
function queryWithFilter(obj, path) {
  // Extract the array path and filter expression
  const filterMatch = path.match(/\[\?\((.+?)\)\]/);
  if (!filterMatch) return querySimple(obj, path);

  const filterExpr = filterMatch[1];
  const arrayPath = path.substring(0, path.indexOf('[?'));

  // Get the array
  const arr = arrayPath ? querySimple(obj, arrayPath) : obj;
  if (!Array.isArray(arr)) return [];

  // Parse filter expression
  return arr.filter(item => evaluateFilterExpression(item, filterExpr));
}

// Evaluate filter expression
function evaluateFilterExpression(item, expr) {
  // Handle regex: @.field =~ /pattern/
  const regexMatch = expr.match(/@\.(\w+(?:\.\w+)*)\s*=~\s*\/(.+?)\/(\w*)/);
  if (regexMatch) {
    const [, field, pattern, flags] = regexMatch;
    const value = getNestedValue(item, field);
    const regex = new RegExp(pattern, flags);
    return regex.test(String(value));
  }

  // Handle compound expressions with &&
  if (expr.includes('&&')) {
    return expr.split('&&').every(part => evaluateFilterExpression(item, part.trim()));
  }

  // Handle compound expressions with ||
  if (expr.includes('||')) {
    return expr.split('||').some(part => evaluateFilterExpression(item, part.trim()));
  }

  // Handle comparison: @.field op value
  const compMatch = expr.match(/@\.(\w+(?:\.\w+)*)\s*(==|!=|>|<|>=|<=)\s*(.+)/);
  if (compMatch) {
    const [, field, op, rawValue] = compMatch;
    const itemValue = getNestedValue(item, field);
    let compareValue = rawValue.trim();

    // Parse value
    if (compareValue === 'true') compareValue = true;
    else if (compareValue === 'false') compareValue = false;
    else if (compareValue === 'null') compareValue = null;
    else if (/^['"].*['"]$/.test(compareValue)) compareValue = compareValue.slice(1, -1);
    else if (!isNaN(Number(compareValue))) compareValue = Number(compareValue);

    switch (op) {
      case '==': return itemValue == compareValue;
      case '!=': return itemValue != compareValue;
      case '>': return itemValue > compareValue;
      case '<': return itemValue < compareValue;
      case '>=': return itemValue >= compareValue;
      case '<=': return itemValue <= compareValue;
    }
  }

  // Handle simple truthy check: @.field
  const truthyMatch = expr.match(/@\.(\w+(?:\.\w+)*)/);
  if (truthyMatch) {
    const value = getNestedValue(item, truthyMatch[1]);
    return Boolean(value);
  }

  return false;
}

// Slice notation [start:end]
function queryWithSlice(obj, path) {
  const sliceMatch = path.match(/\[(\d*):(\d*)\]/);
  if (!sliceMatch) return querySimple(obj, path);

  const arrayPath = path.substring(0, path.indexOf('['));
  const arr = arrayPath ? querySimple(obj, arrayPath) : obj;

  if (!Array.isArray(arr)) return arr;

  const start = sliceMatch[1] ? parseInt(sliceMatch[1]) : 0;
  const end = sliceMatch[2] ? parseInt(sliceMatch[2]) : arr.length;

  return arr.slice(start, end);
}

module.exports = {
  querySimple,
  queryAdvanced,
  queryWildcard,
  queryRecursive,
  queryWithFilter,
  queryWithSlice,
};
