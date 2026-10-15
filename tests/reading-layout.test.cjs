const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file,imports={},extra={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id==='server-only'?{}:imports[id]||require(id),process:{env:{}},URL,AbortSignal,Response,Request,...extra});return module.exports;}
const quran=load('lib/quran.ts',{'@/data/chapters.json':require('../data/chapters.json')});
const layout=load('lib/reading-layout.ts');
const plain=value=>JSON.parse(JSON.stringify(value));
test('short surahs fit one page when space allows, and exact boundaries do not split',()=>{
  assert.deepEqual(plain(layout.paginateAyahs(Array(7).fill(40),364)),[{start:1,end:7}]);
  assert.deepEqual(plain(layout.paginateAyahs([50,50,50,50],114)),[{start:1,end:2},{start:3,end:4}]);
});
test('oversized ayahs remain complete; all 114 chapters retain every ayah exactly once at different sizes',()=>{
  assert.deepEqual(plain(layout.paginateAyahs([900,40,40],200)),[{start:1,end:1},{start:2,end:3}]);
  for(const chapter of quran.chapters)for(const capacity of [280,450,900])for(const scale of [.8,1,1.6]){
    const heights=Array.from({length:chapter.verses_count},(_,i)=>(40+(i*37)%360)*scale);
    const pages=layout.paginateAyahs(heights,capacity);
    let expected=1;
    for(const page of pages){assert.equal(page.start,expected);assert.ok(page.end>=page.start);const size=heights.slice(page.start-1,page.end).reduce((sum,n)=>sum+n,0)+14*(page.end-page.start);assert.ok(size<=capacity||page.start===page.end);expected=page.end+1;}
    assert.equal(expected,chapter.verses_count+1);
  }
});
test('invalid measurements reject and preference corruption falls back safely',()=>{
  for(const [heights,height] of [[[0],100],[[NaN],100],[[20],0]])assert.throws(()=>layout.paginateAyahs(heights,height));
  assert.deepEqual(plain(layout.readPreferences('{broken','english')),{language:'english',view:'ayah',scale:100});
  assert.deepEqual(plain(layout.readPreferences(JSON.stringify({language:'tagalog',view:'book',scale:140}),'arabic')),{language:'tagalog',view:'book',scale:140});
  assert.deepEqual(plain(layout.readPreferences(JSON.stringify({language:'mixed',view:'unknown',scale:999}),'arabic')),{language:'arabic',view:'ayah',scale:100});
});
function translationServer(fetch,env={},qf=()=>{throw Error('QF must not be called');}){return load('lib/chapter-translations.ts',{'./quran':quran,'./quran-server':{qf}},{fetch,process:{env}});}
function encFixture(surah,edition,change=()=>{}){return async url=>{let body;if(url.includes('/translations/list/'))body={translations:[{key:edition,version:'test-version',title:'TEST FIXTURE translation'}]};else{body={result:Array.from({length:quran.parseVerseKey(`${surah}:1`).chapter.verses_count},(_,i)=>({sura:String(surah),aya:String(i+1),translation:`TEST FIXTURE ${surah}:${i+1}`,footnotes:'TEST NOTE'}))};change(body.result);}return {ok:true,json:async()=>body};};}
test('English beyond pre-live coverage uses a complete attributed edition; Tagalog stays independent',async()=>{
  const english=await translationServer(encFixture(23,'english_rwwad')).loadChapterTranslation(23,'english');assert.equal(english.verses.length,118);assert.equal(english.fallback,true);assert.equal(english.source.provider,'QuranEnc');assert.equal(english.verses.at(-1).key,'23:118');
  const tagalog=await translationServer(encFixture(1,'tagalog_rwwad')).loadChapterTranslation(1,'tagalog');assert.equal(tagalog.fallback,false);assert.equal(tagalog.verses[0].footnotes,'TEST NOTE');assert.equal(tagalog.language,'tagalog');
});
test('partial, duplicate, reordered, wrong-surah and empty translation responses reject',async()=>{
  for(const change of [r=>r.pop(),r=>r[1]=r[0],r=>r.reverse(),r=>r[0].sura='2',r=>r[0].translation=''])await assert.rejects(translationServer(encFixture(1,'english_rwwad',change)).loadChapterTranslation(1,'english'),/Incomplete|mismatched/);
});
test('configured English resource keeps its attribution and loads all six pages of Baqarah',async()=>{
  const requests=[];
  const qf=async endpoint=>{requests.push(endpoint);if(endpoint.startsWith('resources/'))return {translations:[{id:85,language_name:'english',author_name:'TEST configured translator'}]};const page=Number(new URL('https://test/'+endpoint).searchParams.get('page'));const start=(page-1)*50;return {verses:Array.from({length:Math.min(50,286-start)},(_,i)=>({verse_key:`2:${start+i+1}`,translations:[{resource_id:85,text:'TEST FIXTURE'}]}))};};
  const result=await translationServer(()=>{throw Error('Fallback must not run');},{QF_CLIENT_ID:'fixture',QF_CLIENT_SECRET:'fixture',QF_ENV:'production'},qf).loadChapterTranslation(2,'english');
  assert.equal(result.verses.length,286);assert.equal(result.verses.at(-1).key,'2:286');assert.equal(result.source.name,'TEST configured translator');assert.equal(result.fallback,false);assert.equal(requests.length,7);
});
test('failed configured translation falls back as one complete chapter',async()=>{
  const result=await translationServer(encFixture(1,'english_rwwad'),{QF_CLIENT_ID:'fixture',QF_CLIENT_SECRET:'fixture'},async()=>{throw Error('Provider unavailable');}).loadChapterTranslation(1,'english');assert.equal(result.fallback,true);assert.equal(result.verses.length,7);
});
test('chapter API rejects invalid input and permits guest translations',async()=>{
  let user=null,calls=0;
  const route=load('app/api/quran/chapter/[surah]/route.ts',{'@/lib/quran':quran,'@/lib/chapter-translations':{loadChapterTranslation:async()=>{calls++;return {surah:1};}},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})}})}});
  const call=(surah,language)=>route.GET(new Request(`https://test/api?language=${language}`),{params:Promise.resolve({surah})});
  assert.equal((await call('01','english')).status,400);assert.equal((await call('115','english')).status,400);assert.equal((await call('1','arabic')).status,400);assert.equal((await call('1','english')).status,200);assert.equal(calls,1);
  user={id:'fixture'};const response=await call('1','tagalog');assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'public, max-age=3600');assert.equal(calls,2);
});
