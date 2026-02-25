import { handlers } from "@/auth";
import {
  isStubAuthMisconfigured,
  STUB_AUTH_FORBIDDEN_CODE,
  STUB_AUTH_FORBIDDEN_MESSAGE,
} from "@/lib/env";

const AUTH_ENDPOINT = "/api/auth/[...nextauth]";

function createForbiddenResponse() {
  return Response.json(
    {
      error: {
        code: STUB_AUTH_FORBIDDEN_CODE,
        message: STUB_AUTH_FORBIDDEN_MESSAGE,
      },
    },
    { status: 403 }
  );
}

function warnStubAuthMisconfiguration(method: "GET" | "POST") {
  console.warn("[stub-auth-guard] blocked auth route due to misconfiguration", {
    environment: process.env.NODE_ENV,
    isStubAuthMisconfigured: true,
    endpoint: AUTH_ENDPOINT,
    method,
  });
}

type AuthRouteContext = { params: Promise<{ nextauth?: string[] }> };

export async function GET(
  request: Request,
  context: AuthRouteContext
): Promise<Response> {
  if (isStubAuthMisconfigured()) {
    warnStubAuthMisconfiguration("GET");
    return createForbiddenResponse();
  }
  return (handlers.GET as unknown as (req: Request, ctx: AuthRouteContext) => Promise<Response>)(
    request,
    context
  );
}

export async function POST(
  request: Request,
  context: AuthRouteContext
): Promise<Response> {
  if (isStubAuthMisconfigured()) {
    warnStubAuthMisconfiguration("POST");
    return createForbiddenResponse();
  }
  return (handlers.POST as unknown as (req: Request, ctx: AuthRouteContext) => Promise<Response>)(
    request,
    context
  );
}
