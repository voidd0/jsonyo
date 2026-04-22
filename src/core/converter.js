// jsonyo - format conversion
// https://voiddo.com/tools/jsonyo/

// Convert JSON to YAML
function toYAML(data, indent = 2) {
  function serialize(value, level = 0) {
    const prefix = ' '.repeat(level * indent);

    if (value === null) return 'null';
    if (value === undefined) return 'null';

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return value.map(item => {
        const itemStr = serialize(item, level + 1);
        if (typeof item === 'object' && item !== null) {
          return `${prefix}-\n${itemStr.split('\n').map(l => prefix + '  ' + l.trimStart()).join('\n')}`;
        }
        return `${prefix}- ${itemStr}`;
      }).join('\n');
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      return entries.map(([key, val]) => {
        const valStr = serialize(val, level + 1);
        if (typeof val === 'object' && val !== null && !Array.isArray(val) && Object.keys(val).length > 0) {
          return `${prefix}${key}:\n${valStr}`;
        }
        if (Array.isArray(val) && val.length > 0) {
          return `${prefix}${key}:\n${valStr}`;
        }
        return `${prefix}${key}: ${valStr}`;
      }).join('\n');
    }

    if (typeof value === 'string') {
      // Check if needs quoting
      if (/[:\[\]{}&*!|>'"#%@`]/.test(value) ||
          value.includes('\n') ||
          /^[\s-]/.test(value) ||
          value === '' ||
          /^(true|false|null|yes|no|on|off)$/i.test(value)) {
        // Use double quotes and escape
        return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
      }
      return value;
    }

    return String(value);
  }

  return serialize(data);
}

// Convert YAML to JSON (simple parser)
function fromYAML(yaml) {
  const lines = yaml.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));

  function parseValue(str) {
    str = str.trim();
    if (str === 'null' || str === '~') return null;
    if (str === 'true' || str === 'yes' || str === 'on') return true;
    if (str === 'false' || str === 'no' || str === 'off') return false;
    if (/^-?\d+$/.test(str)) return parseInt(str);
    if (/^-?\d+\.\d+$/.test(str)) return parseFloat(str);
    if (/^['"].*['"]$/.test(str)) return str.slice(1, -1);
    if (str === '[]') return [];
    if (str === '{}') return {};
    return str;
  }

  function getIndent(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  function parse(startIndex = 0, baseIndent = 0) {
    let result = null;
    let isArray = false;
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i];
      const indent = getIndent(line);
      const trimmed = line.trim();

      if (indent < baseIndent) break;
      if (indent > baseIndent && result !== null) {
        i++;
        continue;
      }

      // Array item
      if (trimmed.startsWith('- ')) {
        if (result === null) {
          result = [];
          isArray = true;
        }
        const value = trimmed.slice(2);
        if (value.includes(':')) {
          // Inline object
          const [key, val] = value.split(':').map(s => s.trim());
          result.push({ [key]: parseValue(val) });
        } else {
          result.push(parseValue(value));
        }
        i++;
        continue;
      }

      // Key-value pair
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        if (result === null) result = {};

        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();

        if (value === '' || value === '|' || value === '>') {
          // Multi-line or nested
          const nextIndent = i + 1 < lines.length ? getIndent(lines[i + 1]) : indent;
          if (nextIndent > indent) {
            const nested = parse(i + 1, nextIndent);
            result[key] = nested.result;
            i = nested.endIndex;
            continue;
          }
          result[key] = null;
        } else {
          result[key] = parseValue(value);
        }
      }

      i++;
    }

    return { result: result || {}, endIndex: i };
  }

  return parse().result;
}

// Convert JSON to TOML
function toTOML(data, prefix = '') {
  const lines = [];
  const tables = [];

  function serialize(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = path ? `${path}.${key}` : key;

      if (value === null) {
        // TOML doesn't have null, skip or use empty string
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length === 0) {
          lines.push(`${key} = []`);
        } else if (typeof value[0] === 'object' && value[0] !== null) {
          // Array of tables
          for (const item of value) {
            tables.push(`[[${fullKey}]]`);
            for (const [k, v] of Object.entries(item)) {
              tables.push(`${k} = ${toTOMLValue(v)}`);
            }
            tables.push('');
          }
        } else {
          lines.push(`${key} = [${value.map(toTOMLValue).join(', ')}]`);
        }
      } else if (typeof value === 'object') {
        tables.push(`[${fullKey}]`);
        serialize(value, fullKey);
        tables.push('');
      } else {
        lines.push(`${key} = ${toTOMLValue(value)}`);
      }
    }
  }

  serialize(data, prefix);
  return [...lines, '', ...tables].join('\n').trim();
}

function toTOMLValue(value) {
  if (typeof value === 'string') {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (value === null) return '""';
  if (Array.isArray(value)) return `[${value.map(toTOMLValue).join(', ')}]`;
  return '""';
}

// Convert TOML to JSON (simple parser)
function fromTOML(toml) {
  const result = {};
  let currentSection = result;
  let currentPath = [];

  for (const line of toml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Section header [section] or [[array]]
    const sectionMatch = trimmed.match(/^\[+([^\]]+)\]+$/);
    if (sectionMatch) {
      const isArray = trimmed.startsWith('[[');
      const path = sectionMatch[1].split('.');

      currentSection = result;
      for (let i = 0; i < path.length; i++) {
        const key = path[i];
        if (i === path.length - 1 && isArray) {
          if (!currentSection[key]) currentSection[key] = [];
          currentSection[key].push({});
          currentSection = currentSection[key][currentSection[key].length - 1];
        } else {
          if (!currentSection[key]) currentSection[key] = {};
          currentSection = currentSection[key];
        }
      }
      currentPath = path;
      continue;
    }

    // Key = value
    const kvMatch = trimmed.match(/^([^=]+)=(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const value = parseTOMLValue(kvMatch[2].trim());
      currentSection[key] = value;
    }
  }

  return result;
}

function parseTOMLValue(str) {
  str = str.trim();
  if (str === 'true') return true;
  if (str === 'false') return false;
  if (/^-?\d+$/.test(str)) return parseInt(str);
  if (/^-?\d+\.\d+$/.test(str)) return parseFloat(str);
  if (/^".*"$/.test(str) || /^'.*'$/.test(str)) return str.slice(1, -1);
  if (str.startsWith('[') && str.endsWith(']')) {
    const inner = str.slice(1, -1);
    if (!inner.trim()) return [];
    return inner.split(',').map(s => parseTOMLValue(s.trim()));
  }
  return str;
}

// Convert JSON array to CSV
function toCSV(data, options = {}) {
  const { separator = ',', headers = true } = options;

  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Get all unique keys from all objects
  const allKeys = new Set();
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(k => allKeys.add(k));
    }
  });

  const keys = Array.from(allKeys);
  const lines = [];

  if (headers) {
    lines.push(keys.map(k => csvEscape(k, separator)).join(separator));
  }

  for (const item of data) {
    const values = keys.map(k => {
      const val = item?.[k];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return csvEscape(JSON.stringify(val), separator);
      return csvEscape(String(val), separator);
    });
    lines.push(values.join(separator));
  }

  return lines.join('\n');
}

function csvEscape(str, separator = ',') {
  if (str.includes(separator) || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Convert CSV to JSON
function fromCSV(csv, options = {}) {
  const { separator = ',', headers = true } = options;
  const lines = csv.split('\n').filter(l => l.trim());

  if (lines.length === 0) return [];

  function parseLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    return values.map(v => {
      if (v === '') return null;
      if (/^-?\d+$/.test(v)) return parseInt(v);
      if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    });
  }

  if (!headers) {
    return lines.map(parseLine);
  }

  const headerRow = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseLine(line);
    const obj = {};
    headerRow.forEach((key, i) => {
      obj[key] = values[i] ?? null;
    });
    return obj;
  });
}

// Convert JSON to XML
function toXML(data, options = {}) {
  const { rootName = 'root', indent = 2 } = options;

  function serialize(value, name, level = 0) {
    const prefix = ' '.repeat(level * indent);

    if (value === null || value === undefined) {
      return `${prefix}<${name} />`;
    }

    if (Array.isArray(value)) {
      return value.map(item => serialize(item, name, level)).join('\n');
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return `${prefix}<${name} />`;
      }
      const children = entries.map(([key, val]) => serialize(val, key, level + 1)).join('\n');
      return `${prefix}<${name}>\n${children}\n${prefix}</${name}>`;
    }

    const escaped = String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    return `${prefix}<${name}>${escaped}</${name}>`;
  }

  const xmlContent = serialize(data, rootName, 0);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
}

// Convert XML to JSON (simple parser)
function fromXML(xml) {
  // Remove XML declaration
  xml = xml.replace(/<\?xml[^?]*\?>/g, '').trim();

  function parseNode(str) {
    str = str.trim();

    // Self-closing tag
    const selfClose = str.match(/^<(\w+)\s*\/>$/);
    if (selfClose) {
      return { [selfClose[1]]: null };
    }

    // Opening tag
    const openMatch = str.match(/^<(\w+)>([\s\S]*)<\/\1>$/);
    if (openMatch) {
      const [, name, content] = openMatch;
      const trimmedContent = content.trim();

      // Check if content is just text
      if (!trimmedContent.includes('<')) {
        let value = trimmedContent;
        if (/^-?\d+$/.test(value)) value = parseInt(value);
        else if (/^-?\d+\.\d+$/.test(value)) value = parseFloat(value);
        else if (value === 'true') value = true;
        else if (value === 'false') value = false;
        return { [name]: value };
      }

      // Parse child elements
      const children = {};
      const tagRegex = /<(\w+)(?:\s[^>]*)?>[\s\S]*?<\/\1>|<(\w+)\s*\/>/g;
      let match;

      while ((match = tagRegex.exec(trimmedContent)) !== null) {
        const childResult = parseNode(match[0]);
        for (const [key, val] of Object.entries(childResult)) {
          if (key in children) {
            if (!Array.isArray(children[key])) {
              children[key] = [children[key]];
            }
            children[key].push(val);
          } else {
            children[key] = val;
          }
        }
      }

      return { [name]: children };
    }

    return {};
  }

  const result = parseNode(xml);
  // Return content of root element
  const keys = Object.keys(result);
  return keys.length === 1 ? result[keys[0]] : result;
}

module.exports = {
  toYAML,
  fromYAML,
  toTOML,
  fromTOML,
  toCSV,
  fromCSV,
  toXML,
  fromXML,
};
