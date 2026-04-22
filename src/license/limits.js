// jsonyo — free forever from vøiddo. https://voiddo.com/tools/jsonyo/
// Limits module kept as a pass-through so every caller keeps compiling;
// all checks return allowed=true. File-size cap, merge cap, daily op cap
// — all unlimited. No upsells, no nag.

const { LIMITS } = require('./constants');

function getLimits() { return LIMITS.PRO; }
function checkFileSize(_filePath) { return { allowed: true, size: 0 }; }
function checkInputSize(input) {
  return { allowed: true, size: Buffer.byteLength(input || '', 'utf8') };
}
function checkDailyLimit() {
  return { allowed: true, remaining: Number.POSITIVE_INFINITY, used: 0 };
}
function consumeOperation() { return true; }
function requirePro(_feature) { return true; }
function checkMergeLimit(_fileCount) { return { allowed: true }; }

module.exports = {
  LIMITS,
  getLimits,
  checkFileSize,
  checkInputSize,
  checkDailyLimit,
  consumeOperation,
  requirePro,
  checkMergeLimit,
};
