import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handlePasswordHttp } from '../src/lib/password-auth-http.ts';

const ownerId='11111111-1111-4111-8111-111111111111';
const config={username:'daddyjj',email:'private@example.test',ownerId,origin:'http://127.0.0.1:3058',issuer:'http://127.0.0.1:3061/auth/v1',recoveryEnabled:true};
const user={id:ownerId,email:config.email,email_confirmed_at:'2026-01-01T00:00:00Z',is_anonymous:false};
function fixture(){
  const calls=[];
  const port={
    signIn:async(email,password)=>{calls.push(['signin',email,password]);return {user,error:null};},
    ownerMembership:async()=>({role:'owner',enabled:true}),
    currentUser:async()=>({user,error:null}),verifiedClaims:async()=>null,
    updatePassword:async()=>({user,error:null}),recover:async()=>({error:null}),signOut:async()=>({error:null}),
  };
  return {calls,port};
}
function request(body={intent:'login',username:'daddyjj',password:'  valid password  '},headers={}){
  return new Request(config.origin+'/auth/password',{method:'POST',headers:{origin:config.origin,'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
}

test('HTTP login preserves credentials, buffers cookies, returns no private mapping or internal flags',async()=>{
  const {port,calls}=fixture();const result=await handlePasswordHttp(request(),config,async()=>port);
  assert.equal(result.response.status,200);assert.equal(result.commitCookies,true);
  const data=await result.response.json();assert.equal(data.ok,true);assert.equal(data.redirect,'/scanner');
  assert.equal(data.commitCookies,undefined);assert.equal(JSON.stringify(data).includes(config.email),false);
  assert.deepEqual(calls,[['signin',config.email,'  valid password  ']]);
  assert.match(result.response.headers.get('cache-control'),/no-store/);
  assert.equal(result.response.headers.get('referrer-policy'),'no-referrer');
});
test('CSRF origin mismatch and missing origin are rejected before client/auth allocation',async()=>{
  let allocated=0;const make=async()=>{allocated++;return fixture().port;};
  for(const origin of ['https://attacker.example','null','http://127.0.0.1:3058.attacker.example']){
    const r=await handlePasswordHttp(request(undefined,{origin}),config,make);
    assert.equal(r.response.status,403);assert.equal(r.commitCookies,false);
  }
  const req=request();req.headers.delete('origin');
  assert.equal((await handlePasswordHttp(req,config,make)).response.status,403);
  assert.equal(allocated,0);
});
test('unconfigured, non-POST, unsupported content and malformed inputs never contact Auth',async()=>{
  let allocated=0;const make=async()=>{allocated++;return fixture().port;};
  assert.equal((await handlePasswordHttp(request(),null,make)).response.status,503);
  const get=new Request(config.origin+'/auth/password');
  const denied=await handlePasswordHttp(get,config,make);assert.equal(denied.response.status,405);assert.equal(denied.response.headers.get('allow'),'POST');
  assert.equal((await handlePasswordHttp(request('{}',{'content-type':'text/plain'}),config,make)).response.status,415);
  for(const payload of ['{bad','null','[]','{"intent":"create-owner"}','{"intent":"login","username":"daddyjj","password":"ok","admin":true}']){
    assert.equal((await handlePasswordHttp(request(payload),config,make)).response.status,400);
  }
  assert.equal(allocated,0);
});
test('body bounds apply with and without declared content length',async()=>{
  let allocated=0;const make=async()=>{allocated++;return fixture().port;};
  for(const req of [request('x'.repeat(5000)),request('{}',{'content-length':'5000'})]){
    assert.equal((await handlePasswordHttp(req,config,make)).response.status,413);
  }
  assert.equal(allocated,0);
});
test('upstream failure yields safe unavailable response and never commits cookies',async()=>{
  const r=await handlePasswordHttp(request(),config,async()=>{throw new Error('SECRET_SENTINEL');});
  assert.equal(r.response.status,503);assert.equal(r.commitCookies,false);
  assert.equal((await r.response.text()).includes('SECRET_SENTINEL'),false);
});
test('streamed bodies enforce actual byte bounds and invalid UTF8 fails safely',async()=>{
  let allocated=0;const make=async()=>{allocated++;return fixture().port;};
  for(const [chunks,status] of [[['x'.repeat(2500),'x'.repeat(2500)],413],[[new Uint8Array([0xc3,0x28])],400]]){
    const stream=new ReadableStream({start(controller){for(const chunk of chunks)controller.enqueue(typeof chunk==='string'?new TextEncoder().encode(chunk):chunk);controller.close();}});
    const req=new Request(config.origin+'/auth/password',{method:'POST',headers:{origin:config.origin,'content-type':'application/json'},body:stream,duplex:'half'});
    assert.equal((await handlePasswordHttp(req,config,make)).response.status,status);
  }
  assert.equal(allocated,0);
});
test('HTTP throttling declares retry and empty body remains invalid',async()=>{
  const {port}=fixture();port.signIn=async()=>({user:null,error:{status:429}});
  const r=await handlePasswordHttp(request(),config,async()=>port);
  assert.equal(r.response.status,429);assert.equal(r.response.headers.get('retry-after'),'60');
  const empty=new Request(config.origin+'/auth/password',{method:'POST',headers:{origin:config.origin,'content-type':'application/json'}});
  assert.equal((await handlePasswordHttp(empty,config,async()=>fixture().port)).response.status,400);
});
