import { NextResponse, type NextRequest } from 'next/server';
import { handlePasswordHttp } from '@/lib/password-auth-http';
import { bufferedPasswordPort, passwordAuthConfig, type PasswordCookie } from '@/lib/password-auth-server';

export async function POST(request: NextRequest) {
  let cookies: () => PasswordCookie[] = () => [];
  const outcome = await handlePasswordHttp(request, passwordAuthConfig(), async () => {
    const buffered = bufferedPasswordPort(request);
    cookies = buffered.cookies;
    return buffered.port;
  });
  const response = new NextResponse(outcome.response.body, {
    status: outcome.response.status, headers: outcome.response.headers,
  });
  if (outcome.commitCookies) cookies().forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
