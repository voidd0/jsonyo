// jsonyo — free forever from vøiddo. https://voiddo.com/tools/jsonyo/
// The legacy "isPro" gate is kept as a pass-through so every feature path
// is unlocked and no caller has to change. No keys, no plans, no tiers —
// this is the one complete release.

function isPro() { return true; }
function isValidKeyFormat() { return true; }
async function validateAndActivate() { return { valid: true }; }

module.exports = {
  isPro,
  isValidKeyFormat,
  validateAndActivate,
};
