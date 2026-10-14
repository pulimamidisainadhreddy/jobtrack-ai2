export const COOKIE_NAME = 'jobtrack_session';
const LIFE = 7 * 24 * 60 * 60 * 1000;

function toHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function signature(value: string): Promise<string> {
  const secret = process.env.AUTH_SECRET || process.env.TRACKER_PASSWORD || '';
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}
export async function makeSession() {
  const timestamp = Date.now().toString();
  return `${timestamp}.${await signature(timestamp)}`;
}
export async function validSession(token?: string) {
  if (!token) return false;
  const [timestamp, provided] = token.split('.');
  const created = Number(timestamp);
  if (!timestamp || !provided || !Number.isFinite(created) || created > Date.now() + 60_000 || Date.now() - created > LIFE) return false;
  const expected = await signature(timestamp);
  if (expected.length !== provided.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return difference === 0;
}
