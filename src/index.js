// jsonyo - JSON swiss army knife
// https://voiddo.com/tools/jsonyo/

const { parse, parseWithLocation, stringify, minify } = require('./core/parser');
const { querySimple, queryAdvanced } = require('./core/query');
const {
  flatten,
  unflatten,
  merge,
  sortKeys,
  sortArray,
  getNestedValue,
  filterArray,
  computeDiff,
  diffToPatch,
  computeStats,
  getAllKeys,
} = require('./core/transformer');
const { generateSchema, validateAgainstSchema } = require('./core/validator');
const { toYAML, fromYAML, toTOML, fromTOML, toCSV, fromCSV, toXML, fromXML } = require('./core/converter');
const { generateTypeScript, generateGo, generatePython, generateRust } = require('./core/generator');
const { isPro } = require('./license/checker');

module.exports = {
  // Parser
  parse,
  parseWithLocation,
  stringify,
  minify,

  // Query
  query: querySimple,
  queryAdvanced,

  // Transformer
  flatten,
  unflatten,
  merge,
  sortKeys,
  sortArray,
  getNestedValue,
  filterArray,
  computeDiff,
  diffToPatch,
  computeStats,
  getAllKeys,

  // Validator
  generateSchema,
  validateAgainstSchema,

  // Converter
  toYAML,
  fromYAML,
  toTOML,
  fromTOML,
  toCSV,
  fromCSV,
  toXML,
  fromXML,

  // Generator
  generateTypeScript,
  generateGo,
  generatePython,
  generateRust,

  // License
  isPro,
};
