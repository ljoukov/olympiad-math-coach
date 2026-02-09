import { proxyFirebaseAuth } from "@/lib/server/firebase-proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function handle(
  request: Request,
  params: Promise<{ path: string[] }>
): Promise<Response> {
  const { path } = await params
  const rest = Array.isArray(path) ? path.join("/") : ""
  return proxyFirebaseAuth(request, `/__/auth/${rest}`)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handle(request, params)
}

export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handle(request, params)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handle(request, params)
}
