// jsonyo — free forever from vøiddo. https://voiddo.com/tools/jsonyo/
// Upsell/nag infrastructure removed. Every exported function is a no-op so
// callers in commands/* keep compiling without edits. The legacy
// UPSELL_TYPES enum is kept exported so any downstream code that references
// it still resolves.

const UPSELL_TYPES = {
  PRO_TIP: 'pro_tip',
  FILE_SIZE: 'file_size',
  DAILY_LIMIT: 'daily_limit',
  PRO_FEATURE: 'pro_feature',
  MERGE_LIMIT: 'merge_limit',
  CROSS_PROMO: 'cross_promo',
};

function maybeShowProTip(_command) {}
function showCommandTip(_command) {}
function showUpsell(_type, _data) {}
function showUsageInHelp() {}
function maybeCrossPromo() {}

module.exports = {
  UPSELL_TYPES,
  maybeShowProTip,
  showCommandTip,
  showUpsell,
  showUsageInHelp,
  maybeCrossPromo,
};
