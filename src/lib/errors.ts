import type { AnalyzeErrorCode } from "./types";

export class AnalyzeError extends Error {
  readonly code: AnalyzeErrorCode;
  readonly status: number;
  readonly hint?: string;

  constructor(options: {
    code: AnalyzeErrorCode;
    message: string;
    status?: number;
    hint?: string;
  }) {
    super(options.message);
    this.name = "AnalyzeError";
    this.code = options.code;
    this.status = options.status ?? 400;
    this.hint = options.hint;
  }
}

const DEFAULT_STATUS: Record<AnalyzeErrorCode, number> = {
  INVALID_URL: 400,
  UNSUPPORTED_HOST: 400,
  NOT_FOUND: 404,
  PRIVATE_REPO: 422,
  EMPTY_REPO: 422,
  RATE_LIMIT: 429,
  NETWORK: 502,
  UPSTREAM: 502,
  UNKNOWN: 500,
};

export function toErrorResponse(error: unknown): {
  status: number;
  body: { error: { code: AnalyzeErrorCode; message: string; hint?: string } };
} {
  if (error instanceof AnalyzeError) {
    return {
      status: error.status || DEFAULT_STATUS[error.code],
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...(error.hint ? { hint: error.hint } : {}),
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "UNKNOWN",
        message: "分析过程中出现意外错误，请稍后重试。",
        hint: "如果问题持续出现，可以换一个仓库链接再试一次。",
      },
    },
  };
}
