import { analyzeRepository } from "@/lib/analyze";
import { AnalyzeError, toErrorResponse } from "@/lib/errors";

export const maxDuration = 60;

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > 10_000) {
    return Response.json(
      {
        error: {
          code: "INVALID_URL",
          message: "请求内容过大。",
        },
      },
      { status: 413 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      {
        error: {
          code: "INVALID_URL",
          message: "请求格式不正确，请提交 JSON 格式的仓库链接。",
        },
      },
      { status: 400 },
    );
  }

  const url =
    payload && typeof payload === "object" && "url" in payload
      ? (payload as { url?: unknown }).url
      : undefined;

  if (typeof url !== "string" || url.trim().length === 0) {
    return Response.json(
      {
        error: {
          code: "INVALID_URL",
          message: "请提供要分析的仓库链接。",
          hint: "例如 https://github.com/psf/requests",
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await analyzeRepository(url);
    return Response.json(result);
  } catch (error) {
    if (!(error instanceof AnalyzeError)) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(`[analyze] unexpected error: ${message}`);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
