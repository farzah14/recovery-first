import { NextResponse } from 'next/server';

import { buildSignInPath, safeReturnPath } from '@/lib/auth/require-account';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const returnTo = safeReturnPath(requestUrl.searchParams.get('returnTo') ?? undefined);
  const code = requestUrl.searchParams.get('code');
  const authType = requestUrl.searchParams.get('type');

  if (!code) {
    return NextResponse.redirect(
      new URL(`${buildSignInPath(returnTo)}&error=callback_failed`, requestUrl.origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`${buildSignInPath(returnTo)}&error=callback_failed`, requestUrl.origin),
    );
  }

  if (authType === 'recovery') {
    return NextResponse.redirect(new URL('/auth/update-password', requestUrl.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL(`${buildSignInPath(returnTo)}&error=callback_failed`, requestUrl.origin),
    );
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });
  if (profileError) {
    return NextResponse.redirect(
      new URL(`${buildSignInPath(returnTo)}&error=profile_failed`, requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL(returnTo, requestUrl.origin));
}
