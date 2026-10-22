import { runPasswordAuth, type OwnerPasswordConfig, type PasswordAuthPort, type PasswordResult } from './password-auth-core.ts';
import { parsePasswordInput } from './password-auth-policy.ts';

const MAX_BODY_BYTES = 4096;
function result(status: number, code: string, message: string): PasswordResult {
  return { ok: false, status, code, message };
}
function response(value: PasswordResult) {
  const { commitCookies = false, ...body } = value;
  const headers: Record<string, string> = {
    'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer',
  };
  if (value.status === 405) headers.Allow = 'POST';
  if (value.status === 429) headers['Retry-After'] = '60';
  return { response: Response.json(body, { status: value.status, headers }), commitCookies };
}
async function boundedBody(request: Request): Promise<string | null> {
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) return null;
  const reader = request.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let text = '';
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) return text + decoder.decode();
      size += chunk.value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); return null; }
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally { reader.releaseLock(); }
}
/** Validate transport before allocating an Auth client. Never return private config. */
export async function handlePasswordHttp(request: Request, config: OwnerPasswordConfig | null,
  makePort: () => Promise<PasswordAuthPort>) {
  if (request.method !== 'POST') return response(result(405, 'method_not_allowed', 'Gunakan formulir login.'));
  if (!config) return response(result(503, 'auth_unavailable', 'Layanan login belum tersedia.'));
  if (request.headers.get('origin') !== config.origin)
    return response(result(403, 'origin_rejected', 'Permintaan tidak dapat diproses. Muat ulang halaman.'));
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
    return response(result(415, 'unsupported_content', 'Format permintaan tidak sesuai.'));
  let input: unknown;
  try {
    const body = await boundedBody(request);
    if (body === null) return response(result(413, 'body_too_large', 'Isian formulir terlalu panjang.'));
    input = JSON.parse(body);
  } catch { return response(result(400, 'invalid_input', 'Periksa kembali isian formulir.')); }
  const parsed = parsePasswordInput(input);
  if (!parsed) return response(result(400, 'invalid_input', 'Periksa kembali isian formulir.'));
  try { return response(await runPasswordAuth(parsed, config, await makePort(), Math.floor(Date.now() / 1000))); }
  catch { return response(result(503, 'auth_unavailable', 'Layanan login belum tersedia. Silakan coba lagi nanti.')); }
}
