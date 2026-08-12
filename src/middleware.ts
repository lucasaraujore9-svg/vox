// Middleware raiz. Faz refresh da sessão e protege rotas autenticadas.
// Issue 020 (refresh) + Issue 021 (proteção).

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Rotas públicas que não exigem autenticação.
// /termos e /privacidade PRECISAM ser públicas: a LGPD exige que o titular
// possa lê-las antes de criar conta, e o rodapé da landing linka as duas.
const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/templates",
  "/termos",
  "/privacidade",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/bible")) return true; // proxy público (rate-limit no handler)
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sem Supabase configurado, segue sem proteção (modo dev sem credenciais)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  const { response, user, deactivated } = await updateSession(request);

  // Conta desativada com sessão em uso → manda pra login com aviso.
  if (deactivated && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("reason", "deactivated");
    return NextResponse.redirect(url);
  }

  // Já logado tentando acessar login/register → manda para dashboard
  if (user && (pathname === "/auth/login" || pathname === "/auth/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Não logado tentando acessar rota protegida → manda para login
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Tudo exceto arquivos estáticos, imagens e o _next
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
