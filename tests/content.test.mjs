import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateContent} from '../content-schema.js';
import {renderHomepage} from '../content-renderer.js';
import worker,{verifyPassword,ApiError,json,readLimited} from '../cloudflare/worker.js';
import {editorApi} from '../cloudflare/editor-api.js';
import {pbkdf2Sync} from 'node:crypto';
const initial=JSON.parse((await fs.readFile(new URL('../assets/site-content.json',import.meta.url),'utf8')).replace(/^\uFEFF/,''));
test('conținutul inițial este valid, cu căi relative și fără cratime lungi',()=>{const html=renderHomepage(initial);assert.ok(html.includes('assets/living-room.webp'));assert.ok(!/[\u2013\u2014]/.test(html));assert.ok(html.includes('ChIJv4D-SHZnTEcRz1PqtJs3atI'));});
test('textul editat este escapate în HTML și nu produce markup executabil',()=>{const c=structuredClone(initial);c.hero.heading='<img src=x onerror=alert(1)>';const html=renderHomepage(c);assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));assert.ok(!html.includes('<img src=x'));});
test('editorul respinge traversarea directoarelor, URL-uri active și hărți străine',()=>{for(const change of [c=>c.hero.image.src='assets/../secret.png',c=>c.contact.facebookUrl='javascript:alert(1)',c=>c.contact.mapEmbedUrl='https://example.com/maps?output=embed',c=>c.hero.heading='Text'+String.fromCharCode(8212)+'text']){const c=structuredClone(initial);change(c);assert.throws(()=>validateContent(c));}});
test('parolele folosesc PBKDF2 și o parolă greșită nu validează',async()=>{const salt='0'.repeat(32),expected=pbkdf2Sync('parola-locală-de-test',salt,100000,32,'sha256').toString('hex');assert.equal(await verifyPassword('parola-locală-de-test',salt+':'+expected),true);assert.equal(await verifyPassword('gresit',salt+':'+expected),false);});
test('administrarea fără configurare și cererile de login cross origin sunt respinse',async()=>{assert.equal((await worker.fetch(new Request('https://site.test/api/editor/session'),{})).status,503);const env={EDITOR_DB:{},ADMIN_PASSWORD_HASH:'x'};assert.equal((await worker.fetch(new Request('https://site.test/api/editor/login',{method:'POST',headers:{Origin:'https://alt-site.test'},body:'{}'}),env)).status,403);});
test('publicarea scrie conținut și index în același commit, fără force',async()=>{
 const oldFetch=globalThis.fetch,revision='a'.repeat(40),nextRevision='b'.repeat(40),requestId='00000000-0000-4000-8000-000000000000';let tree,update;const blobs=[];
 globalThis.fetch=async(url,options)=>{const pathname=new URL(url).pathname;const body=options?.body?JSON.parse(options.body):null;
 if(pathname.endsWith('/git/ref/heads/main'))return Response.json({object:{sha:revision}});
 if(pathname.endsWith('/contents/assets/site-content.json'))return Response.json({content:Buffer.from(JSON.stringify(initial)).toString('base64')});
 if(pathname.endsWith('/git/commits/'+revision))return Response.json({tree:{sha:'c'.repeat(40)}});
 if(pathname.endsWith('/git/blobs')){blobs.push(Buffer.from(body.content,'base64').toString());return Response.json({sha:blobs.length.toString().repeat(40)});}
 if(pathname.endsWith('/git/trees')){tree=body;return Response.json({sha:'d'.repeat(40)});}
 if(pathname.endsWith('/git/commits'))return Response.json({sha:nextRevision});
 if(pathname.endsWith('/git/refs/heads/main')){update=body;return Response.json({});}
 throw new Error('Cerere neașteptată '+url);
 };
 const env={GITHUB_REPOSITORY:'client/clean',GITHUB_BRANCH:'main',GITHUB_TOKEN:'test-only',EDITOR_DB:{prepare:()=>({bind(){return this},async first(){return null},async run(){return{success:true}}})}};
 try{const response=await editorApi(new Request('https://site.test/api/editor/publish',{method:'POST',headers:{Origin:'https://site.test','Content-Type':'application/json'},body:JSON.stringify({content:initial,revision,requestId,images:[]})}),env,{requireAdmin:async()=>{},ApiError,json,readLimited});assert.equal(response.status,200);assert.equal(update.force,false);assert.deepEqual(tree.tree.map(v=>v.path),['assets/site-content.json','index.html']);assert.ok(blobs.some(v=>v.startsWith('<!doctype html>')));}
 finally{globalThis.fetch=oldFetch;}
});
test('publicarea stale este refuzată înainte de a crea un commit',async()=>{const oldFetch=globalThis.fetch;let requests=0;globalThis.fetch=async(url)=>{requests++;return String(url).includes('/contents/')?Response.json({content:Buffer.from(JSON.stringify(initial)).toString('base64')}):Response.json({object:{sha:'b'.repeat(40)}})};try{await assert.rejects(()=>editorApi(new Request('https://site.test/api/editor/publish',{method:'POST',headers:{Origin:'https://site.test','Content-Type':'application/json'},body:JSON.stringify({content:initial,revision:'a'.repeat(40),requestId:'00000000-0000-4000-8000-000000000000',images:[]})}),{GITHUB_REPOSITORY:'client/clean',GITHUB_TOKEN:'test-only',EDITOR_DB:{prepare:()=>({bind(){return this},async first(){return null}})}},{requireAdmin:async()=>{},ApiError,json,readLimited}),{status:409});assert.equal(requests,2);}finally{globalThis.fetch=oldFetch;}});

test('reîncercarea după un commit deja salvat nu creează un commit duplicat',async()=>{const oldFetch=globalThis.fetch,requestId='00000000-0000-4000-8000-000000000001',latest=structuredClone(initial);latest.publicationId=requestId;let requests=0;globalThis.fetch=async(url)=>{requests++;return String(url).includes('/contents/')?Response.json({content:Buffer.from(JSON.stringify(latest)).toString('base64')}):Response.json({object:{sha:'b'.repeat(40)}})};try{const response=await editorApi(new Request('https://site.test/api/editor/publish',{method:'POST',headers:{Origin:'https://site.test','Content-Type':'application/json'},body:JSON.stringify({content:initial,revision:'a'.repeat(40),requestId,images:[]})}),{GITHUB_REPOSITORY:'client/clean',GITHUB_TOKEN:'test-only',EDITOR_DB:{prepare:()=>({bind(){return this},async first(){return null}})}},{requireAdmin:async()=>{},ApiError,json,readLimited});assert.equal(response.status,200);assert.equal((await response.json()).revision,'b'.repeat(40));assert.equal(requests,2);}finally{globalThis.fetch=oldFetch;}});
