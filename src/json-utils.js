// jsonyo - JSON swiss army knife
// https://voiddo.com/tools/jsonyo/

function validate(input) {
  try {
    JSON.parse(input);
    return { valid: true, error: null };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

function format(input, indent = 2) {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, indent);
}

function minify(input) {
  const parsed = JSON.parse(input);
  return JSON.stringify(parsed);
}

function query(input, path) {
  const parsed = JSON.parse(input);
  const parts = path.replace(/^\$\.?/, '').split('.').filter(Boolean);
  
  let result = parsed;
  for (const part of parts) {
    // Handle array notation: items[0]
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      if (key) {
        result = result[key];
      }
      result = result[parseInt(index)];
    } else {
      result = result[part];
    }
    
    if (result === undefined) {
      return undefined;
    }
  }
  
  return result;
}

function getKeys(input, depth = 1) {
  const parsed = JSON.parse(input);
  const keys = [];
  
  function traverse(obj, currentDepth, prefix = '') {
    if (currentDepth > depth) return;
    
    for (const key of Object.keys(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      keys.push(fullKey);
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        traverse(obj[key], currentDepth + 1, fullKey);
      }
    }
  }
  
  if (typeof parsed === 'object' && parsed !== null) {
    traverse(parsed, 1);
  }
  
  return keys;
}

function getType(input) {
  const parsed = JSON.parse(input);
  
  if (Array.isArray(parsed)) {
    return { type: 'array', length: parsed.length };
  } else if (parsed === null) {
    return { type: 'null' };
  } else if (typeof parsed === 'object') {
    return { type: 'object', keys: Object.keys(parsed).length };
  } else {
    return { type: typeof parsed };
  }
}

function diff(input1, input2) {
  const obj1 = JSON.parse(input1);
  const obj2 = JSON.parse(input2);
  const differences = [];
  
  function compare(a, b, path = '$') {
    if (typeof a !== typeof b) {
      differences.push({ path, type: 'type_change', from: typeof a, to: typeof b });
      return;
    }
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        differences.push({ path, type: 'array_length', from: a.length, to: b.length });
      }
      const maxLen = Math.max(a.length, b.length);
      for (let i = 0; i < maxLen; i++) {
        if (i >= a.length) {
          differences.push({ path: `${path}[${i}]`, type: 'added', value: b[i] });
        } else if (i >= b.length) {
          differences.push({ path: `${path}[${i}]`, type: 'removed', value: a[i] });
        } else {
          compare(a[i], b[i], `${path}[${i}]`);
        }
      }
    } else if (typeof a === 'object' && a !== null && b !== null) {
      const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const key of allKeys) {
        const newPath = `${path}.${key}`;
        if (!(key in a)) {
          differences.push({ path: newPath, type: 'added', value: b[key] });
        } else if (!(key in b)) {
          differences.push({ path: newPath, type: 'removed', value: a[key] });
        } else {
          compare(a[key], b[key], newPath);
        }
      }
    } else if (a !== b) {
      differences.push({ path, type: 'value_change', from: a, to: b });
    }
  }
  
  compare(obj1, obj2);
  return differences;
}

function stats(input) {
  const parsed = JSON.parse(input);
  let counts = { objects: 0, arrays: 0, strings: 0, numbers: 0, booleans: 0, nulls: 0 };
  let maxDepth = 0;
  
  function traverse(obj, depth = 0) {
    maxDepth = Math.max(maxDepth, depth);
    
    if (Array.isArray(obj)) {
      counts.arrays++;
      obj.forEach(item => traverse(item, depth + 1));
    } else if (obj === null) {
      counts.nulls++;
    } else if (typeof obj === 'object') {
      counts.objects++;
      Object.values(obj).forEach(val => traverse(val, depth + 1));
    } else if (typeof obj === 'string') {
      counts.strings++;
    } else if (typeof obj === 'number') {
      counts.numbers++;
    } else if (typeof obj === 'boolean') {
      counts.booleans++;
    }
  }
  
  traverse(parsed);
  
  return {
    ...counts,
    maxDepth,
    size: input.length,
    minifiedSize: JSON.stringify(parsed).length
  };
}

module.exports = { validate, format, minify, query, getKeys, getType, diff, stats };
