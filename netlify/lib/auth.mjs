export function isAdminUser(user) {
  return !!user?.id && Array.isArray(user.roles) && user.roles.includes('admin');
}
export function privateHeaders(type='text/html; charset=utf-8') {
  return {'Content-Type':type,'Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
}
