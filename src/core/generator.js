// jsonyo - type generation
// https://voiddo.com/tools/jsonyo/

// Generate TypeScript interfaces from JSON
function generateTypeScript(data, options = {}) {
  const { rootName = 'Root', exportTypes = true } = options;
  const interfaces = new Map();

  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function sanitizeName(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '');
  }

  function inferType(value, name = 'Value') {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    if (Array.isArray(value)) {
      if (value.length === 0) return 'unknown[]';

      // Check if all items are same type
      const itemTypes = value.slice(0, 10).map((item, i) => inferType(item, `${name}Item`));
      const uniqueTypes = [...new Set(itemTypes)];

      if (uniqueTypes.length === 1) {
        return `${uniqueTypes[0]}[]`;
      }

      // Mixed types
      return `(${uniqueTypes.join(' | ')})[]`;
    }

    if (typeof value === 'object') {
      const interfaceName = capitalizeFirst(sanitizeName(name));

      if (!interfaces.has(interfaceName)) {
        const properties = [];

        for (const [key, val] of Object.entries(value)) {
          const propName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
          const propType = inferType(val, capitalizeFirst(sanitizeName(key)));
          const optional = val === null || val === undefined;
          properties.push({ name: propName, type: propType, optional });
        }

        interfaces.set(interfaceName, properties);
      }

      return interfaceName;
    }

    if (typeof value === 'string') {
      // Check for literal types
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'string'; // Date string
      return 'string';
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'number' : 'number';
    }

    if (typeof value === 'boolean') return 'boolean';

    return 'unknown';
  }

  // Start inference
  inferType(data, rootName);

  // Generate output
  const lines = [];

  for (const [name, properties] of interfaces) {
    const prefix = exportTypes ? 'export ' : '';
    lines.push(`${prefix}interface ${name} {`);

    for (const { name: propName, type, optional } of properties) {
      const optionalMarker = optional ? '?' : '';
      lines.push(`  ${propName}${optionalMarker}: ${type};`);
    }

    lines.push('}');
    lines.push('');
  }

  return lines.join('\n').trim();
}

// Generate Go structs from JSON
function generateGo(data, options = {}) {
  const { rootName = 'Root', packageName = 'main' } = options;
  const structs = new Map();

  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function toGoName(str) {
    return str.split(/[-_\s]/).map(capitalizeFirst).join('');
  }

  function inferType(value, name = 'Value') {
    if (value === null) return 'interface{}';
    if (value === undefined) return 'interface{}';

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]interface{}';
      const itemType = inferType(value[0], `${name}Item`);
      return `[]${itemType}`;
    }

    if (typeof value === 'object') {
      const structName = toGoName(name);

      if (!structs.has(structName)) {
        const fields = [];

        for (const [key, val] of Object.entries(value)) {
          const fieldName = toGoName(key);
          const fieldType = inferType(val, key);
          const jsonTag = `\`json:"${key}"\``;
          fields.push({ name: fieldName, type: fieldType, tag: jsonTag });
        }

        structs.set(structName, fields);
      }

      return structName;
    }

    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'float64';
    }
    if (typeof value === 'boolean') return 'bool';

    return 'interface{}';
  }

  inferType(data, rootName);

  const lines = [`package ${packageName}`, ''];

  for (const [name, fields] of structs) {
    lines.push(`type ${name} struct {`);

    for (const { name: fieldName, type, tag } of fields) {
      lines.push(`\t${fieldName} ${type} ${tag}`);
    }

    lines.push('}');
    lines.push('');
  }

  return lines.join('\n').trim();
}

// Generate Python dataclasses from JSON
function generatePython(data, options = {}) {
  const { rootName = 'Root' } = options;
  const classes = new Map();

  function toSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  function toPascalCase(str) {
    return str.split(/[-_\s]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  }

  function inferType(value, name = 'Value') {
    if (value === null) return 'None';
    if (value === undefined) return 'None';

    if (Array.isArray(value)) {
      if (value.length === 0) return 'List';
      const itemType = inferType(value[0], `${name}Item`);
      return `List[${itemType}]`;
    }

    if (typeof value === 'object') {
      const className = toPascalCase(name);

      if (!classes.has(className)) {
        const fields = [];

        for (const [key, val] of Object.entries(value)) {
          const fieldName = toSnakeCase(key);
          const fieldType = inferType(val, toPascalCase(key));
          const optional = val === null;
          fields.push({ name: fieldName, type: fieldType, optional, originalKey: key });
        }

        classes.set(className, fields);
      }

      return className;
    }

    if (typeof value === 'string') return 'str';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'float';
    }
    if (typeof value === 'boolean') return 'bool';

    return 'Any';
  }

  inferType(data, rootName);

  const lines = [
    'from dataclasses import dataclass',
    'from typing import List, Optional, Any',
    '',
  ];

  for (const [name, fields] of classes) {
    lines.push('@dataclass');
    lines.push(`class ${name}:`);

    if (fields.length === 0) {
      lines.push('    pass');
    } else {
      for (const { name: fieldName, type, optional } of fields) {
        const typeStr = optional ? `Optional[${type}]` : type;
        const default_ = optional ? ' = None' : '';
        lines.push(`    ${fieldName}: ${typeStr}${default_}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n').trim();
}

// Generate Rust structs from JSON
function generateRust(data, options = {}) {
  const { rootName = 'Root' } = options;
  const structs = new Map();

  function toSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  function toPascalCase(str) {
    return str.split(/[-_\s]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  }

  function inferType(value, name = 'Value') {
    if (value === null) return 'Option<serde_json::Value>';
    if (value === undefined) return 'Option<serde_json::Value>';

    if (Array.isArray(value)) {
      if (value.length === 0) return 'Vec<serde_json::Value>';
      const itemType = inferType(value[0], `${name}Item`);
      return `Vec<${itemType}>`;
    }

    if (typeof value === 'object') {
      const structName = toPascalCase(name);

      if (!structs.has(structName)) {
        const fields = [];

        for (const [key, val] of Object.entries(value)) {
          const fieldName = toSnakeCase(key);
          const fieldType = inferType(val, toPascalCase(key));
          fields.push({ name: fieldName, type: fieldType, originalKey: key });
        }

        structs.set(structName, fields);
      }

      return structName;
    }

    if (typeof value === 'string') return 'String';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'i64' : 'f64';
    }
    if (typeof value === 'boolean') return 'bool';

    return 'serde_json::Value';
  }

  inferType(data, rootName);

  const lines = [
    'use serde::{Deserialize, Serialize};',
    '',
  ];

  for (const [name, fields] of structs) {
    lines.push('#[derive(Debug, Serialize, Deserialize)]');
    lines.push(`pub struct ${name} {`);

    for (const { name: fieldName, type, originalKey } of fields) {
      if (fieldName !== originalKey) {
        lines.push(`    #[serde(rename = "${originalKey}")]`);
      }
      lines.push(`    pub ${fieldName}: ${type},`);
    }

    lines.push('}');
    lines.push('');
  }

  return lines.join('\n').trim();
}

module.exports = {
  generateTypeScript,
  generateGo,
  generatePython,
  generateRust,
};
