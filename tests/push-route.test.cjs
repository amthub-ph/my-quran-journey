const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
function route() {
 const mod=new Module('sender');
 mod.require=(name)=>{
   if(name==='next/server') return {NextResponse:{json:(body,options)=>({body,status:options?.status??200})}};
   if(name==='@supabase/supabase-js') return {createClient:()=>{throw new Error('Must not access database before auth and configuration checks');}};
   if(name==='@/lib/push-server')return {pushConfigured:()=>true};
   if(name==='@/lib/push-schedule')return {};
   return require(name);
 };
 mod._compile(ts.transpileModule(fs.readFileSync('app/api/reminders/send/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,'sender.js');
 return mod.exports.POST;
}
test('sender rejects unauthenticated, incorrect, and unicode credentials safely',async()=>{
 process.env.CRON_SECRET='test-secret';
 const post=route();
 for(const token of ['', 'Bearer wrong', 'Bearer tést-secret']) {
  const response=await post(new Request('https://example.test',{headers:{authorization:token}}));
  assert.equal(response.status,401);
 }
});
test('sender fails clearly when server database credentials are missing',async()=>{
 process.env.CRON_SECRET='test-secret';
 delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 const response=await route()(new Request('https://example.test',{headers:{authorization:'Bearer test-secret'}}));
 assert.equal(response.status,503);
});
