import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Endpoint de estado básico para monitorización. No expone datos internos. */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "iplibre",
      time: new Date().toISOString(),
      region: process.env.VERCEL_REGION ?? "local",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
