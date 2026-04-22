// jsonyo - JSON Schema validation
// https://voiddo.com/tools/jsonyo/

const { parse } = require('./parser');

// Simple type inference for schema generation
function inferType(value) {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) return { type: 'array' };
  return { type: typeof value };
}

// Generate JSON Schema from sample data
function generateSchema(data, options = {}) {
  const { title = 'Generated Schema' } = options;

  function infer(value, depth = 0) {
    if (value === null) {
      return { type: 'null' };
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return { type: 'array', items: {} };
      }

      // Infer items schema from first element (or merge all)
      const itemSchemas = value.slice(0, 5).map(item => infer(item, depth + 1));
      const mergedItems = mergeSchemas(itemSchemas);

      return {
        type: 'array',
        items: mergedItems,
      };
    }

    if (typeof value === 'object') {
      const properties = {};
      const required = [];

      for (const [key, val] of Object.entries(value)) {
        properties[key] = infer(val, depth + 1);
        if (val !== null && val !== undefined) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    if (typeof value === 'string') {
      // Try to detect formats
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { type: 'string', format: 'date' };
      }
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return { type: 'string', format: 'date-time' };
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { type: 'string', format: 'email' };
      }
      if (/^https?:\/\//.test(value)) {
        return { type: 'string', format: 'uri' };
      }
      return { type: 'string' };
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
    }

    if (typeof value === 'boolean') {
      return { type: 'boolean' };
    }

    return {};
  }

  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title,
    ...infer(data),
  };

  return schema;
}

// Merge multiple schemas (for array items inference)
function mergeSchemas(schemas) {
  if (schemas.length === 0) return {};
  if (schemas.length === 1) return schemas[0];

  // If all same type, merge properties
  const types = [...new Set(schemas.map(s => s.type))];

  if (types.length === 1 && types[0] === 'object') {
    const allProps = new Set();
    schemas.forEach(s => {
      if (s.properties) {
        Object.keys(s.properties).forEach(k => allProps.add(k));
      }
    });

    const mergedProps = {};
    for (const prop of allProps) {
      const propSchemas = schemas
        .filter(s => s.properties?.[prop])
        .map(s => s.properties[prop]);
      mergedProps[prop] = propSchemas.length > 0 ? mergeSchemas(propSchemas) : {};
    }

    return { type: 'object', properties: mergedProps };
  }

  // Different types - use anyOf
  if (types.length > 1) {
    return { anyOf: schemas };
  }

  return schemas[0];
}

// Validate data against schema (simple implementation)
function validateAgainstSchema(data, schema, path = '$') {
  const errors = [];

  function validate(value, schemaNode, currentPath) {
    if (!schemaNode || Object.keys(schemaNode).length === 0) return;

    // Type validation
    if (schemaNode.type) {
      const actualType = getActualType(value);
      const expectedTypes = Array.isArray(schemaNode.type) ? schemaNode.type : [schemaNode.type];

      if (!expectedTypes.includes(actualType)) {
        errors.push({
          path: currentPath,
          message: `expected ${expectedTypes.join(' or ')}, got ${actualType}`,
        });
        return;
      }
    }

    // Object validation
    if (schemaNode.type === 'object' && typeof value === 'object' && value !== null) {
      // Required properties
      if (schemaNode.required) {
        for (const req of schemaNode.required) {
          if (!(req in value)) {
            errors.push({
              path: `${currentPath}.${req}`,
              message: 'required property is missing',
            });
          }
        }
      }

      // Property validation
      if (schemaNode.properties) {
        for (const [key, propSchema] of Object.entries(schemaNode.properties)) {
          if (key in value) {
            validate(value[key], propSchema, `${currentPath}.${key}`);
          }
        }
      }
    }

    // Array validation
    if (schemaNode.type === 'array' && Array.isArray(value)) {
      if (schemaNode.items) {
        value.forEach((item, i) => {
          validate(item, schemaNode.items, `${currentPath}[${i}]`);
        });
      }

      if (schemaNode.minItems !== undefined && value.length < schemaNode.minItems) {
        errors.push({
          path: currentPath,
          message: `array must have at least ${schemaNode.minItems} items`,
        });
      }

      if (schemaNode.maxItems !== undefined && value.length > schemaNode.maxItems) {
        errors.push({
          path: currentPath,
          message: `array must have at most ${schemaNode.maxItems} items`,
        });
      }
    }

    // String validation
    if (schemaNode.type === 'string' && typeof value === 'string') {
      if (schemaNode.minLength !== undefined && value.length < schemaNode.minLength) {
        errors.push({
          path: currentPath,
          message: `string must be at least ${schemaNode.minLength} characters`,
        });
      }

      if (schemaNode.maxLength !== undefined && value.length > schemaNode.maxLength) {
        errors.push({
          path: currentPath,
          message: `string must be at most ${schemaNode.maxLength} characters`,
        });
      }

      if (schemaNode.pattern) {
        const regex = new RegExp(schemaNode.pattern);
        if (!regex.test(value)) {
          errors.push({
            path: currentPath,
            message: `string must match pattern: ${schemaNode.pattern}`,
          });
        }
      }

      if (schemaNode.format) {
        if (!validateFormat(value, schemaNode.format)) {
          errors.push({
            path: currentPath,
            message: `string must be valid ${schemaNode.format} format`,
          });
        }
      }
    }

    // Number validation
    if ((schemaNode.type === 'number' || schemaNode.type === 'integer') && typeof value === 'number') {
      if (schemaNode.minimum !== undefined && value < schemaNode.minimum) {
        errors.push({
          path: currentPath,
          message: `must be >= ${schemaNode.minimum}`,
        });
      }

      if (schemaNode.maximum !== undefined && value > schemaNode.maximum) {
        errors.push({
          path: currentPath,
          message: `must be <= ${schemaNode.maximum}`,
        });
      }
    }

    // Enum validation
    if (schemaNode.enum && !schemaNode.enum.includes(value)) {
      errors.push({
        path: currentPath,
        message: `must be one of: ${schemaNode.enum.join(', ')}`,
      });
    }
  }

  validate(data, schema, path);
  return errors;
}

function getActualType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

function validateFormat(value, format) {
  switch (format) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'uri':
    case 'url':
      return /^https?:\/\//.test(value);
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(value);
    case 'date-time':
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
    case 'uuid':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    default:
      return true;
  }
}

module.exports = {
  generateSchema,
  validateAgainstSchema,
  inferType,
  mergeSchemas,
};
