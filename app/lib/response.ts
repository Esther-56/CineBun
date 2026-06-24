import { NextResponse } from "next/server";

// ── Standard responses ────────────────────────────────────────────────────────
export const ok = (data: unknown, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

export const created = (data: unknown) =>
  NextResponse.json({ success: true, data }, { status: 201 });

export const fail = (message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

export const serverError = (err: unknown, context = "") => {
  console.log(`[${context}]`, err);
  return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
};

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationOptions {
  page: number;
  limit: number;
}

export function getPagination(searchParams: URLSearchParams, defaultLimit = 20): PaginationOptions {
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? String(defaultLimit)));
  return { page, limit };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationOptions
) {
  return ok({
    items: data,
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  });
}