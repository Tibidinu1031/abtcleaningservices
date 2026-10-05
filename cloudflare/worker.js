import {editorApi} from './editor-api.js';
const encoder=new TextEncoder(),SESSION_SECONDS=12*60*60,COOKIE='lexyns_clean_admin';
export class ApiError extends Error{constructor(status,message){super(message);this.status=status;}}
const hex=bytes=>[...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
const digest=async value=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
export const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
function sessionCookie(request,value,maxAge=SESSION_SECONDS){return COOKIE+'='+value+'; Path=/api; HttpOnly; SameSite=Strict; Max-Age='+maxAge+(new URL(request.url).protocol==='https:'?'; Secure':'');}
export async function readLimited(request,limit){if(!request.body)throw new ApiError(400,'Cererea nu conține date.');const reader=request.body.getReader(),parts=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new ApiError(413,'Cererea depășește limita permisă.');}parts.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}return bytes;}
async function session(request,env){const token=request.headers.get('Cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const hash=await digest(token),row=await env.EDITOR_DB.prepare('SELECT expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?').bind(hash,Date.now()).first();return row?hash:null;}
async function requireAdmin(request,env){if(!env.EDITOR_DB)throw new ApiError(503,'Administrarea nu este încă activată.');if(!await session(request,env))throw new ApiError(401,'Autentifică-te pentru a modifica site-ul.');}
export async function verifyPassword(password,stored){if(typeof password!=='string'||password.length>256)return false;const [salt,expected]=stored.split(':');if(!/^[a-f0-9]{32}$/.test(salt||'')||!/^[a-f0-9]{64}$/.test(expected||''))throw new ApiError(503,'Autentificarea nu este configurată.');const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);const actual=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256));let difference=0;for(let i=0;i<actual.length;i++)difference|=actual.charCodeAt(i)^expected.charCodeAt(i);return difference===0;}
async function auth(request,env,route){
 if(!env.EDITOR_DB||!env.ADMIN_PASSWORD_HASH)throw new ApiError(503,'Administrarea online va fi activată după conectarea conturilor clientului.');
 if(!['GET','HEAD'].includes(request.method)&&request.headers.get('Origin')!==new URL(request.url).origin)throw new ApiError(403,'Cererea trebuie trimisă din panoul de administrare.');
 if(route==='/session'&&request.method==='GET')return json({admin:!!await session(request,env)});
 if(route==='/login'&&request.method==='POST'){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new ApiError(415,'Formatul cererii nu este valid.');
 let body;try{body=JSON.parse(new TextDecoder().decode(await readLimited(request,2000)));}catch(e){if(e.status)throw e;throw new ApiError(400,'Datele cererii nu sunt valide.');}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new ApiError(400,'Datele cererii nu sunt valide.');
 const now=Date.now(),ip=await digest(request.headers.get('CF-Connecting-IP')||'local');
 await env.EDITOR_DB.prepare('DELETE FROM login_attempts WHERE window_start < ?').bind(now-15*60*1000).run();
 await env.EDITOR_DB.prepare('INSERT INTO login_attempts(ip_hash, attempts, window_start) VALUES(?,1,?) ON CONFLICT(ip_hash) DO UPDATE SET attempts = attempts + 1').bind(ip,now).run();
 const attempt=await env.EDITOR_DB.prepare('SELECT attempts FROM login_attempts WHERE ip_hash = ?').bind(ip).first();if(attempt.attempts>10)throw new ApiError(429,'Prea multe încercări. Reîncearcă peste 15 minute.');
 const valid=await verifyPassword(body.password,env.ADMIN_PASSWORD_HASH);if(!valid||body.username!==(env.ADMIN_USERNAME||'admin'))throw new ApiError(401,'Utilizator sau parolă incorectă.');
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));
 await env.EDITOR_DB.batch([env.EDITOR_DB.prepare('DELETE FROM login_attempts WHERE ip_hash = ?').bind(ip),env.EDITOR_DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now),env.EDITOR_DB.prepare('INSERT INTO sessions(token_hash, expires_at) VALUES(?,?)').bind(await digest(token),now+SESSION_SECONDS*1000)]);
 return json({admin:true},200,{'Set-Cookie':sessionCookie(request,token)});
 }
 if(route==='/logout'&&request.method==='POST'){const token=await session(request,env);if(token)await env.EDITOR_DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(token).run();return json({admin:false},200,{'Set-Cookie':sessionCookie(request,'',0)});}
 throw new ApiError(404,'Pagina cerută nu există.');
}
export default{async fetch(request,env){
 const url=new URL(request.url);
 try{
 if(url.pathname.startsWith('/api/editor/')){
 const route=url.pathname.slice('/api/editor'.length);
 if(['/session','/login','/logout'].includes(route))return await auth(request,env,route);
 return await editorApi(request,env,{requireAdmin,ApiError,json,readLimited});
 }

 if(/\/(?:cloudflare|scripts|tests|node_modules)\//.test(url.pathname)||url.pathname.split('/').some(v=>v.startsWith('.')))return new Response('Not found',{status:404});
 return env.ASSETS.fetch(request);
 }catch(error){if(error.status)return json({error:error.message},error.status);return json({error:'Cererea nu a putut fi finalizată. Ciorna ta este păstrată. Reîncearcă.'},500);}
}};
