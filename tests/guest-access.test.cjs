const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function layout(user, guestCookie) {
  const module = {exports:{}};
  const imports = {
    'next/headers': {cookies: async () => ({get: () => guestCookie === undefined ? undefined : {value: guestCookie}})},
    'next/navigation': {redirect: destination => {throw new Error(`redirect:${destination}`)}},
    '@/lib/supabase/server': {createClient: async () => ({auth:{getUser:async () => ({data:{user}})}})},
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/quran/layout.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,require:id=>imports[id]});
  return module.exports.default({children:'reader'});
}
test('reader allows explicit guests and signed-in users, and redirects other visitors to start', async () => {
  await assert.rejects(layout(null, undefined), /redirect:\/start/);
  await assert.rejects(layout(null, 'false'), /redirect:\/start/);
  assert.equal(await layout(null, 'true'), 'reader');
  assert.equal(await layout({id:'reader'}, undefined), 'reader');
});
