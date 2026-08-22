import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function notFound(path: string) {
  return NextResponse.json(
    {
      error: "Not Found",
      code: "not_found",
      brand: "Milypay",
      path: path.startsWith("/") ? path : `/${path}`,
      message: "No Milypay API route matches this path.",
      resolution:
        "List endpoints at https://milypay.xyz/openapi.json or https://milypay.xyz/.well-known/x402. Docs: https://milypay.xyz/agents.md",
      docs: "https://milypay.xyz/agents.md",
      openapi: "https://milypay.xyz/openapi.json",
      x402: "https://milypay.xyz/.well-known/x402",
      catalog: "https://milypay.xyz/.well-known/api-catalog",
    },
    {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
        Vary: "Accept",
      },
    },
  );
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return notFound(`/api/${(path || []).join("/")}`);
}

export async function POST(_req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return notFound(`/api/${(path || []).join("/")}`);
}

export async function PUT(_req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return notFound(`/api/${(path || []).join("/")}`);
}

export async function PATCH(_req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return notFound(`/api/${(path || []).join("/")}`);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return notFound(`/api/${(path || []).join("/")}`);
}
