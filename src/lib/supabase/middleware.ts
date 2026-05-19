// Helper de middleware: faz refresh da sessão Supabase em cada request.
// O middleware raiz (src/middleware.ts) chama essa função e decide redirects.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Importante: getUser revalida o token e atualiza os cookies via setAll acima.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se a conta foi desativada com sessão em uso, força logout aqui pra a request
  // chegar no middleware raiz já como não-autenticada (cai no redirect pra /login).
  let deactivated = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      deactivated = true;
    }
  }

  return { response, user: deactivated ? null : user, deactivated };
}
