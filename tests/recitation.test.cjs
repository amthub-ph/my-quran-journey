const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file,imports={},extras={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='server-only'?{}:imports[id]||require(id),URL,AbortSignal,Response,...extras});return module.exports;}
const quran=load('lib/quran.ts',{'@/data/chapters.json':require('../data/chapters.json')});
const reciters=load('lib/reciters.ts');
function server(fetch){return load('lib/recitation-server.ts',{'./quran':quran,'./reciters':reciters},{fetch});}
function body(key,id){const {surah,ayah}=quran.parseVerseKey(key);return {code:200,data:{surah:{number:surah},numberInSurah:ayah,number:quran.chapters.filter(c=>c.id<surah).reduce((n,c)=>n+c.verses_count,0)+ayah,edition:{identifier:id,format:'audio'},audio:'https://cdn.islamic.network/test-fixture.mp3'}};}
test('all 6236 ayahs and every curated reciter map through the adapter',async()=>{
  const adapter=server(async (url,options)=>{
    if(options.method==='HEAD'){
      const parsed=new URL(url);
      assert.equal(parsed.origin,'https://everyayah.com');
      assert.match(parsed.pathname,/^\/data\/Yasser_Ad-Dussary_128kbps\/\d{6}\.mp3$/);
      return {ok:true,headers:new Headers({'content-type':'audio/mpeg'})};
    }
    const parts=url.split('/');
    return {ok:true,json:async()=>body(parts.at(-2),parts.at(-1))};
  });
  for(const r of reciters.reciters)for(const c of quran.chapters)for(let a=1;a<=c.verses_count;a++){
    const key=`${c.id}:${a}`;
    const result=await adapter.loadRecitation(key,r.id);
    assert.equal(result.key,key);assert.equal(result.reciter,r.id);
    if(r.id==='Yasser_Ad-Dussary_128kbps')assert.equal(result.audio,`https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${String(c.id).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`);
  }
});
test('Yasser verifies the audio response and rejects missing or non-audio files',async()=>{
  for(const response of [{ok:false,headers:new Headers()},{ok:true,headers:new Headers({'content-type':'text/html'})},{ok:true,headers:new Headers()}]){
    await assert.rejects(server(async()=>response).loadRecitation('114:6','Yasser_Ad-Dussary_128kbps'),/unavailable/);
  }
  let calls=0;
  const adapter=server(async(url,options)=>{calls++;assert.equal(url,'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/003001.mp3');assert.equal(options.method,'HEAD');assert.equal(options.redirect,'error');return {ok:true,headers:new Headers({'content-type':'audio/mpeg'})};});
  assert.equal((await adapter.loadRecitation('3:1','Yasser_Ad-Dussary_128kbps')).reciter,'Yasser_Ad-Dussary_128kbps');
  assert.equal(calls,1);
  await assert.rejects(adapter.loadRecitation('3:0','Yasser_Ad-Dussary_128kbps'),/Invalid verse/);
  assert.equal(calls,1);
});
test('invalid keys and unsupported reciters never reach the provider',async()=>{const adapter=server(()=>{throw Error('Unexpected fetch');});await assert.rejects(adapter.loadRecitation('115:1','ar.alafasy'),/Invalid verse/);await assert.rejects(adapter.loadRecitation('1:1','unknown'),/Unsupported reciter/);});
test('wrong verse, wrong reciter, missing audio and unsafe URLs are rejected',async()=>{for(const change of [d=>d.surah.number=2,d=>d.numberInSurah=2,d=>d.number=2,d=>d.edition.identifier='other',d=>d.edition.format='text',d=>delete d.audio,d=>d.audio='http://cdn.islamic.network/x.mp3',d=>d.audio='https://evil.example/x.mp3',d=>d.audio='https://user:secret@cdn.islamic.network/x.mp3']){const fixture=body('1:1','ar.alafasy');change(fixture.data);await assert.rejects(server(async()=>({ok:true,json:async()=>fixture})).loadRecitation('1:1','ar.alafasy'));}});
test('provider outages reject rather than returning an empty playable source',async()=>{await assert.rejects(server(async()=>({ok:false})).loadRecitation('3:1','ar.alafasy'),/unavailable/);});
test('audio route permits guests and returns cacheable public recitation',async()=>{let user=null,calls=0;const route=load('app/api/recitation/[key]/route.ts',{'@/lib/quran':quran,'@/lib/reciters':reciters,'@/lib/recitation-server':{loadRecitation:async(key,reciter)=>{calls++;return {key,reciter,audio:'fixture'};}},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})}})}});const params={params:Promise.resolve({key:'114:6'})};assert.equal((await route.GET(new Request('https://test/api?reciter=unknown'),params)).status,400);assert.equal((await route.GET(new Request('https://test/api?reciter=ar.alafasy'),params)).status,200);assert.equal(calls,1);user={id:'fixture'};const response=await route.GET(new Request('https://test/api?reciter=ar.alafasy'),params);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'public, max-age=3600');assert.equal(calls,2);});
