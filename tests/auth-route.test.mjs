import test from 'node:test';
import assert from 'node:assert/strict';
import {authAction} from '../netlify/lib/auth-route.mjs';

test('auth endpoints work when Netlify retains the original request URL', () => {
  for (const action of ['invite','recovery','confirmation','login','logout','session']) {
    assert.equal(authAction(`https://praya.example/api/auth/${action}`), action);
  }
});
test('direct function rewrite URLs and trailing slash remain supported', () => {
  assert.equal(authAction('https://praya.example/.netlify/functions/auth?action=invite'), 'invite');
  assert.equal(authAction('https://praya.example/api/auth/recovery/'), 'recovery');
});
test('public auth path determines the action and unrelated URLs cannot supply it', () => {
  assert.equal(authAction('https://praya.example/api/auth/invite?action=logout'), 'invite');
  for (const path of ['/login?action=invite','/api/auth/?action=invite','/api/auth/invite/extra']) {
    assert.equal(authAction('https://praya.example'+path), '');
  }
});
