const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,imports={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>imports[id]??require(id),Intl,Date,console});return module.exports;}
const quran=load('lib/quran.ts',{'@/data/chapters.json':require('../data/chapters.json')});
const activity=load('lib/reading-activity.ts',{'./quran':quran});
test('daily dates follow user timezone across midnight and daylight saving',()=>{const now=new Date('2026-10-15T16:30:00Z');assert.equal(activity.readingDay('Asia/Manila',now),'2026-10-16');assert.equal(activity.readingDay('America/Los_Angeles',now),'2026-10-15');assert.equal(activity.readingDay('America/New_York',new Date('2026-03-08T07:01:00Z')),'2026-03-08');assert.throws(()=>activity.readingDay('invalid/zone'));});
test('reading ranges validate canonical ayahs and goal input',()=>{assert.deepEqual(Array.from(activity.completedKeys(1,1,7)),['1:1','1:2','1:3','1:4','1:5','1:6','1:7']);for(const args of [[1,1,8],[2,0,2],[2,4,3],[115,1,1],[2,1.5,3]])assert.throws(()=>activity.completedKeys(...args));for(const goal of [0,-1,2.5,NaN,6237])assert.equal(activity.validDailyGoal(goal),false);assert.equal(activity.validDailyGoal(10),true);});
test('near the end remains in progress until the actual last ayah',()=>{assert.equal(quran.positionPercent('2:285'),99);assert.equal(quran.positionPercent('2:286'),100);});
function setup({user={id:'user-1'},fail=false}={}) {
 const rows=new Map(),events=[];
 const db={
  auth:{getUser:async()=>({data:{user}})},
  from(table){return {
   async upsert(records,options){
    events.push({table,options});
    if(fail)return {error:{message:'offline'}};
    for(const row of records)rows.set(`${row.user_id}|${row.reading_date}|${row.verse_key}`,row);
    return {error:null};
   },
   update(value){return {eq(field,id){
    events.push({table,value,field,id});
    return {select:async()=>({data:fail?[]:[{id}],error:fail?{}:null})};
   }};},
   select(){const filters={};return {
    eq(field,value){filters[field]=value;return this;},
    then(resolve){resolve({count:Array.from(rows.values()).filter(row=>Object.entries(filters).every(([key,value])=>row[key]===value)).length,error:fail?{}:null});}
   };}
  };}
 };
 const actions=load('app/actions/reading-activity.ts',{'@/lib/supabase/server':{createClient:async()=>db},'next/cache':{revalidatePath:path=>events.push(path)},'@/lib/reading-activity':activity});
 return {actions,rows,events};
}
test('audio and Next on the same group count each ayah only once for that day',async()=>{const {actions,rows,events}=setup();await actions.recordCompletedAyahs(1,1,3,'Asia/Manila');await actions.recordCompletedAyahs(1,1,7,'Asia/Manila');assert.equal(rows.size,7);assert.ok(!events.includes('/protected'),'recording audio must not refresh and remount the reader');assert.equal((await actions.getDailyReading('Asia/Manila')).count,7);assert.ok([...rows.values()].every(row=>row.user_id==='user-1'));});
test('goals save only to the authenticated profile and invalid input never writes',async()=>{const {actions,events}=setup();assert.equal((await actions.updateDailyGoal(15)).success,true);assert.equal(events[0].id,'user-1');assert.equal(events[0].value.daily_goal,15);const before=events.length;assert.ok((await actions.updateDailyGoal(0)).error);assert.equal(events.length,before);});
test('unauthenticated and failed activity writes do not pretend to succeed',async()=>{for(const options of [{user:null},{fail:true}]){const {actions,rows}=setup(options);assert.ok((await actions.recordCompletedAyahs(1,1,7,'UTC')).error);assert.ok((await actions.getDailyReading('UTC')).error);assert.equal(rows.size,0);assert.ok((await actions.updateDailyGoal(10)).error);}});
test('dashboard handles multiple saved surahs and resumes the most recent record',async()=>{
 const positions=[{verse_key:'2:7',updated_at:'2026-10-15T10:00:00Z'},{verse_key:'1:7',updated_at:'2026-10-14T10:00:00Z'}];
 const ordered=[];
 const db={auth:{getUser:async()=>({data:{user:{id:'user-1'}}})},from(table){return {select(){return {eq(field,id){assert.equal(id,'user-1');if(table==='profiles')return {maybeSingle:async()=>({data:{full_name:'Reader',daily_goal:10},error:null})};if(table==='journey_reflections')return Promise.resolve({count:1,error:null});return {order:async(column,options)=>{ordered.push({column,options});return {data:positions,error:null}}};}};}};}};
 const page=load('app/protected/page.tsx',{'@/lib/i18n/server':{getI18n:async()=>({t:text=>text,language:'en'})},'next/navigation':{redirect:()=>{throw Error('Unexpected redirect')}},'@/lib/supabase/server':{createClient:async()=>db},'next/link':'link','@/components/journey-shell':{JourneyShell:'shell'},'@/components/saved-position':{SavedPosition:'saved'},'@/components/surah-progress':{SurahProgress:'surahs'},'@/components/daily-goal':{DailyGoal:'goal'},'@/components/logout-button':{LogoutButton:'logout'}});
 const tree=await page.default();const nodes=[];function walk(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return;}nodes.push(node);walk(node.props?.children);}walk(tree);
 assert.equal(nodes.find(node=>node.type==='saved').props.verseKey,'2:7');assert.equal(nodes.find(node=>node.type==='surahs').props.records.length,2);assert.equal(ordered[0].column,'updated_at');assert.equal(ordered[0].options.ascending,false);
});
