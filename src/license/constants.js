// jsonyo — free forever from vøiddo.
// All limits intentionally unbounded. This is the single complete release,
// not a trial tier. The LIMITS object stays exported for backwards-compat
// with any consumer that imports it.

const LIMITS = {
  FREE: {
    maxFileSize: Number.POSITIVE_INFINITY,
    maxOpsPerDay: Number.POSITIVE_INFINITY,
    maxMergeFiles: Number.POSITIVE_INFINITY,
    maxBatchFiles: Number.POSITIVE_INFINITY,
  },
  PRO: {
    maxFileSize: Number.POSITIVE_INFINITY,
    maxOpsPerDay: Number.POSITIVE_INFINITY,
    maxMergeFiles: Number.POSITIVE_INFINITY,
    maxBatchFiles: Number.POSITIVE_INFINITY,
  },
};

module.exports = { LIMITS };
