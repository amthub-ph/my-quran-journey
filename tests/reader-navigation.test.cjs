const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,imports={},globals={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:id=>imports[id],Request,Response,URL,...globals});return module.exports;}
test('position route saves through authenticated action without returning a reader refresh',async()=>{
 const saved=[];const {POST}=load('app/api/reading-position/route.ts',{'@/app/actions/journey':{savePosition:async key=>{saved.push(key);return {success:true}}}});
 for(const key of ['2:9','2:1']){const result=await POST(new Request('https://example.com/api/reading-position',{method:'POST',headers:{origin:'https://example.com'},body:JSON.stringify({key})}));assert.equal(result.status,200);assert.deepEqual(await result.json(),{success:true});assert.equal(result.headers.get('cache-control'),'no-store');}
 assert.deepEqual(saved,['2:9','2:1']);
 const denied=await POST(new Request('https://example.com/api/reading-position',{method:'POST',headers:{origin:'https://other.com'},body:'{"key":"2:5"}'}));assert.equal(denied.status,403);assert.equal(saved.length,2);
});
test('reader save keeps failure visible and submits only the requested position',async()=>{
 const requests=[];let fail=false;const {saveReaderPosition}=load('lib/save-reader-position.ts',{}, {fetch:async(url,options)=>{requests.push([url,JSON.parse(options.body)]);return Response.json(fail?{error:'offline'}:{success:true},{status:fail?400:200});}});
 assert.equal((await saveReaderPosition('2:9')).success,true);fail=true;assert.equal((await saveReaderPosition('2:1')).error,'offline');assert.deepEqual(requests,[['/api/reading-position',{key:'2:9'}],['/api/reading-position',{key:'2:1'}]]);
});
