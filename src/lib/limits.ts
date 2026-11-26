export const LIMITS = {
  maxFiles: 100,
  maxFileBytes: 200 * 1024,
  maxTotalBytes: 8 * 1024 * 1024,
  concurrency: 10,
  maxFindings: 60,
  maxRisks: 60,
  maxRiskEvidence: 60,
} as const;

export const LIMIT_LABELS = {
  maxFiles: LIMITS.maxFiles,
  maxFileSizeKb: Math.round(LIMITS.maxFileBytes / 1024),
  maxTotalSizeMb: Math.round(LIMITS.maxTotalBytes / (1024 * 1024)),
};
