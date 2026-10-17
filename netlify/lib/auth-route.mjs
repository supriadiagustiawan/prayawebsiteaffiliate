// Netlify may retain the original public URL in a rewritten function request.
// Read that path first, while supporting direct function URLs used by rewrites.
export function authAction(url) {
  const u = new URL(url);
  const path = u.pathname.match(/^\/api\/auth\/([a-z]+)\/?$/);
  if (path) return path[1];
  if (/^\/\.netlify\/functions\/auth\/?$/.test(u.pathname)) {
    return u.searchParams.get('action') || '';
  }
  return '';
}
