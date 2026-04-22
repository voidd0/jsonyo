// jsonyo - JSON transformations
// https://voiddo.com/tools/jsonyo/

// Flatten nested JSON into dot notation
function flatten(obj, prefix = '', separator = '.') {
  const result = {};

  function recurse(current, path) {
    if (current === null || typeof current !== 'object') {
      result[path] = current;
      return;
    }

    if (Array.isArray(current)) {
      if (current.length === 0) {
        result[path] = [];
        return;
      }
      current.forEach((item, i) => {
        recurse(item, path ? `${path}[${i}]` : `[${i}]`);
      });
      return;
    }

    const keys = Object.keys(current);
    if (keys.length === 0) {
      result[path] = {};
      return;
    }

    for (const key of keys) {
      const newPath = path ? `${path}${separator}${key}` : key;
      recurse(current[key], newPath);
    }
  }

  recurse(obj, prefix);
  return result;
}

// Unflatten dot notation back to nested JSON
function unflatten(obj, separator = '.') {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split(separator);
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      const isNextArray = /^\[\d+\]$/.test(nextPart) || /^\d+$/.test(nextPart);

      if (!(part in current)) {
        current[part] = isNextArray ? [] : {};
      }
      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    const arrayMatch = lastPart.match(/^\[(\d+)\]$/);
    if (arrayMatch) {
      current[parseInt(arrayMatch[1])] = value;
    } else {
      current[lastPart] = value;
    }
  }

  return result;
}

// Deep merge objects
function merge(target, source, strategy = 'overwrite') {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (key in result) {
      if (typeof result[key] === 'object' && typeof source[key] === 'object') {
        if (Array.isArray(result[key]) && Array.isArray(source[key])) {
          if (strategy === 'concat-arrays') {
            result[key] = [...result[key], ...source[key]];
          } else {
            result[key] = source[key];
          }
        } else if (!Array.isArray(result[key]) && !Array.isArray(source[key])) {
          result[key] = merge(result[key], source[key], strategy);
        } else {
          result[key] = source[key];
        }
      } else {
        result[key] = source[key];
      }
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// Sort keys recursively
function sortKeys(obj, order = null) {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sortKeys(item, order));
  }

  const keys = Object.keys(obj);
  let sortedKeys;

  if (order && Array.isArray(order)) {
    const orderSet = new Set(order);
    const orderedKeys = order.filter(k => k in obj);
    const remainingKeys = keys.filter(k => !orderSet.has(k)).sort();
    sortedKeys = [...orderedKeys, ...remainingKeys];
  } else {
    sortedKeys = keys.sort();
  }

  const result = {};
  for (const key of sortedKeys) {
    result[key] = sortKeys(obj[key], order);
  }
  return result;
}

// Sort array by one or many fields. `field` may be comma-separated
// ("country,name,-age"). A leading `-` on a key reverses that key's direction.
function sortArray(arr, field, options = {}) {
  const { desc = false, numeric = false } = options;

  const keys = String(field)
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .map((k) => (k.startsWith('-') ? { path: k.slice(1).trim(), desc: true } : { path: k, desc: false }));

  const cmp = (a, b) => {
    for (const { path, desc: keyDesc } of keys) {
      let aVal = getNestedValue(a, path);
      let bVal = getNestedValue(b, path);

      if (numeric) {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      let result;
      if (aVal === undefined && bVal === undefined) result = 0;
      else if (aVal === undefined) result = 1;
      else if (bVal === undefined) result = -1;
      else if (aVal < bVal) result = -1;
      else if (aVal > bVal) result = 1;
      else result = 0;

      const dir = keyDesc || desc ? -1 : 1;
      if (result !== 0) return result * dir;
    }
    return 0;
  };

  return [...arr].sort(cmp);
}

// Get nested value by path
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    const arrayMatch = part.match(/^(\w*)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      if (key) current = current[key];
      current = current?.[parseInt(index)];
    } else {
      current = current[part];
    }
  }

  return current;
}

// Set nested value by path
function setNestedValue(obj, path, value) {
  const parts = path.replace(/^\$\.?/, '').split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
  return obj;
}

// Filter array by condition
function filterArray(arr, condition) {
  return arr.filter(item => evaluateCondition(item, condition));
}

// Simple condition evaluator
function evaluateCondition(item, condition) {
  // Parse simple conditions like "age > 18" or "active == true"
  const match = condition.match(/^(\w+(?:\.\w+)*)\s*(==|!=|>|<|>=|<=)\s*(.+)$/);
  if (!match) {
    // Treat as truthy check
    const value = getNestedValue(item, condition.trim());
    return Boolean(value);
  }

  const [, field, op, rawValue] = match;
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
    default: return false;
  }
}

// Compute diff between two objects
function computeDiff(obj1, obj2, path = '$') {
  const differences = [];

  function compare(a, b, currentPath) {
    if (typeof a !== typeof b) {
      differences.push({
        path: currentPath,
        type: 'type_change',
        from: a === null ? 'null' : typeof a,
        to: b === null ? 'null' : typeof b,
      });
      return;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        differences.push({
          path: currentPath,
          type: 'array_length',
          from: a.length,
          to: b.length,
        });
      }
      const maxLen = Math.max(a.length, b.length);
      for (let i = 0; i < maxLen; i++) {
        if (i >= a.length) {
          differences.push({ path: `${currentPath}[${i}]`, type: 'added', value: b[i] });
        } else if (i >= b.length) {
          differences.push({ path: `${currentPath}[${i}]`, type: 'removed', value: a[i] });
        } else {
          compare(a[i], b[i], `${currentPath}[${i}]`);
        }
      }
    } else if (typeof a === 'object' && a !== null && b !== null) {
      const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const key of allKeys) {
        const newPath = `${currentPath}.${key}`;
        if (!(key in a)) {
          differences.push({ path: newPath, type: 'added', value: b[key] });
        } else if (!(key in b)) {
          differences.push({ path: newPath, type: 'removed', value: a[key] });
        } else {
          compare(a[key], b[key], newPath);
        }
      }
    } else if (a !== b) {
      differences.push({ path: currentPath, type: 'value_change', from: a, to: b });
    }
  }

  compare(obj1, obj2, path);
  return differences;
}

// Convert diff to JSON Patch (RFC 6902)
function diffToPatch(differences) {
  return differences.map(d => {
    const path = d.path.replace(/^\$/, '').replace(/\./g, '/').replace(/\[(\d+)\]/g, '/$1');

    switch (d.type) {
      case 'added':
        return { op: 'add', path, value: d.value };
      case 'removed':
        return { op: 'remove', path };
      case 'value_change':
      case 'type_change':
        return { op: 'replace', path, value: d.to };
      default:
        return null;
    }
  }).filter(Boolean);
}

// Compute statistics
function computeStats(obj) {
  const counts = {
    objects: 0,
    arrays: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
  };
  let maxDepth = 0;

  function traverse(current, depth = 0) {
    maxDepth = Math.max(maxDepth, depth);

    if (Array.isArray(current)) {
      counts.arrays++;
      current.forEach(item => traverse(item, depth + 1));
    } else if (current === null) {
      counts.nulls++;
    } else if (typeof current === 'object') {
      counts.objects++;
      Object.values(current).forEach(val => traverse(val, depth + 1));
    } else if (typeof current === 'string') {
      counts.strings++;
    } else if (typeof current === 'number') {
      counts.numbers++;
    } else if (typeof current === 'boolean') {
      counts.booleans++;
    }
  }

  traverse(obj);
  return { ...counts, maxDepth };
}

// Get all keys at specified depth
function getAllKeys(obj, maxDepth = 1, currentDepth = 0, prefix = '') {
  const keys = [];

  if (currentDepth >= maxDepth) return keys;
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return keys;

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.push(fullKey);

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], maxDepth, currentDepth + 1, fullKey));
    }
  }

  return keys;
}

module.exports = {
  flatten,
  unflatten,
  merge,
  sortKeys,
  sortArray,
  getNestedValue,
  setNestedValue,
  filterArray,
  evaluateCondition,
  computeDiff,
  diffToPatch,
  computeStats,
  getAllKeys,
};
