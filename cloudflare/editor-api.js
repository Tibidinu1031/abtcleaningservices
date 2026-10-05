import {validateContent,imagePaths,ContentError} from '../content-schema.js';
import {renderHomepage} from '../content-renderer.js';
const API='https://api.github.com';
const enc=new TextEncoder();
const hex=bytes=>[...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
const hash=async value=>hex(await crypto.subtle.digest('SHA-256',value));
const utf8Base64=text=>{const bytes=enc.encode(text);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(binary);};
const decodeText=encoded=>new TextDecoder().decode(Uint8Array.from(atob(encoded.replace(/\s/g,'')),v=>v.charCodeAt(0)));
export async function editorApi(request,env,helpers) {
 const {requireAdmin,ApiError,json,readLimited}=helpers;
 const url=new URL(request.url),route=url.pathname.slice('/api/editor'.length);
 await requireAdmin(request,env);
 if(!['GET','HEAD'].includes(request.method) && request.headers.get('Origin')!==url.origin)throw new ApiError(403,'Cererea trebuie trimisă din panoul de administrare.');
 const repo=env.GITHUB_REPOSITORY || '';
 const branch=env.GITHUB_BRANCH || 'main';
 if(!repo)throw new ApiError(503,'Publicarea va fi activată după conectarea repository-ului clientului.');
 if(!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)||!/^[-a-zA-Z0-9_/.]+$/.test(branch))throw new ApiError(503,'Publicarea nu este configurată corect.');
 if(!env.GITHUB_TOKEN)throw new ApiError(503,'Publicarea nu este încă activată. Administratorul tehnic trebuie să conecteze contul de publicare.');
 async function github(path,method='GET',body) {
  const response=await fetch(API+'/repos/'+repo+path,{method,headers:{Authorization:'Bearer '+env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'ABT-Cleaning-Services-Editor','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) {const error=new ApiError(response.status===409||response.status===422?409:502,response.status===409||response.status===422?'Site-ul a fost modificat între timp. Apasă „Reîncarcă ultima salvare” înainte să publici din nou.':'Publicarea nu a reușit. Modificările tale sunt păstrate; reîncearcă sau verifică accesul contului de publicare.');error.githubStatus=response.status;throw error;}
  return data;
 }
 const readHead=()=>github('/git/ref/heads/'+branch.split('/').map(encodeURIComponent).join('/'));
 async function readContent(revision) {
  let data;
  try {const file=await github('/contents/assets/site-content.json?ref='+encodeURIComponent(revision));data=JSON.parse(decodeText(file.content));}
  catch(error) {if(error.githubStatus!==404)throw error;const response=await env.ASSETS.fetch(new Request(url.origin+'/assets/site-content.json'));if(!response.ok)throw new ApiError(503,'Conținutul inițial al paginii nu este disponibil.');data=await response.json();}
  return validateContent(data);
 }
 if(route==='/content' && request.method==='GET') {
  const head=await readHead();return json({content:await readContent(head.object.sha),revision:head.object.sha});
 }
 if(route==='/publish' && request.method==='POST') {
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new ApiError(415,'Datele trimise nu sunt valide.');
  let body;try {body=JSON.parse(new TextDecoder().decode(await readLimited(request,16*1024*1024)));}catch(error){if(error.status)throw error;throw new ApiError(400,'Datele trimise nu sunt valide.');}
  if(!/^[a-f0-9-]{36}$/.test(body.requestId||'')||!/^[a-f0-9]{40}$/.test(body.revision||''))throw new ApiError(400,'Reîncarcă pagina înainte să publici.');
  let content;try{content=validateContent(body.content);}catch(error){if(error instanceof ContentError)throw new ApiError(400,error.message);throw error;}
  content.publicationId=body.requestId;
  const serialized=JSON.stringify(content,null,2)+'\n';
  const contentHash=await hash(enc.encode(serialized));
  const previous=await env.EDITOR_DB.prepare('SELECT revision, content_hash FROM editor_publications WHERE request_id = ?').bind(body.requestId).first();
  if(previous) {if(previous.content_hash!==contentHash)throw new ApiError(409,'Reîncearcă publicarea cu modificările actuale.');return json({revision:previous.revision,publicationId:body.requestId,saved:true});}
  const head=await readHead();if(head.object.sha!==body.revision){const latest=await readContent(head.object.sha);if(latest.publicationId===body.requestId&&await hash(enc.encode(JSON.stringify(latest,null,2)+'\n'))===contentHash)return json({saved:true,revision:head.object.sha,publicationId:body.requestId});throw new ApiError(409,'Site-ul a fost modificat între timp. Apasă „Reîncarcă ultima salvare” înainte să publici din nou.');}
  const original=await readContent(body.revision);
  const allowedExisting=new Set(imagePaths(original));
  const referenced=new Set(imagePaths(content));
  if(!Array.isArray(body.images)||body.images.length>20)throw new ApiError(400,'Publică un număr mai mic de fișiere odată.');
  const supplied=new Map();let total=0;
  for(const upload of body.images) {
   if(!upload||typeof upload.base64!=='string'||upload.base64.length>11200000||!/^assets\/uploads\/[a-f0-9]{64}\.(jpg|png|webp|mp4|webm)$/.test(upload.path||'')||!referenced.has(upload.path)||supplied.has(upload.path))throw new ApiError(400,'Un fișier încărcat nu este valid.');
   let bytes;try{bytes=Uint8Array.from(atob(upload.base64),v=>v.charCodeAt(0));}catch{throw new ApiError(400,'Un fișier încărcat nu este valid.');}
   if(!bytes.length||bytes.length>(/\.(mp4|webm)$/.test(upload.path)?8:2)*1024*1024)throw new ApiError(413,'Un fișier depășește limita: 2 MB pentru fotografii, 8 MB pentru video.');total+=bytes.length;if(total>10*1024*1024)throw new ApiError(413,'Publică fișierele în două sau mai multe runde, maxim 10 MB odată.');
   const ascii=(a,b)=>String.fromCharCode(...bytes.slice(a,b));
   const extension=upload.path.split('.').at(-1);
   const valid=extension==='jpg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:extension==='png'?[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):extension==='webp'?ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP':extension==='mp4'?ascii(4,8)==='ftyp':extension==='webm'?[26,69,223,163].every((v,i)=>bytes[i]===v):false;
   if(!valid||await hash(bytes)!==upload.path.split('/').at(-1).split('.')[0])throw new ApiError(400,'Un fișier încărcat nu este valid.');
   supplied.set(upload.path,upload);
  }
  for(const path of referenced)if(!allowedExisting.has(path)&&!supplied.has(path))throw new ApiError(400,'Un fișier nou nu a fost încărcat. Alege-l din nou.');
  const parent=await github('/git/commits/'+body.revision);
  const treeEntries=[];
  for(const upload of supplied.values()) {
   const blob=await github('/git/blobs','POST',{content:upload.base64,encoding:'base64'});
   treeEntries.push({path:upload.path,mode:'100644',type:'blob',sha:blob.sha});
  }
  const blob=await github('/git/blobs','POST',{content:utf8Base64(serialized),encoding:'base64'});
  treeEntries.push({path:'assets/site-content.json',mode:'100644',type:'blob',sha:blob.sha});
  for(const path of allowedExisting)if(path.startsWith('assets/uploads/')&&!referenced.has(path))treeEntries.push({path,mode:'100644',type:'blob',sha:null});
  const pageBlob=await github('/git/blobs','POST',{content:utf8Base64(renderHomepage(content)),encoding:'base64'});
  treeEntries.push({path:'index.html',mode:'100644',type:'blob',sha:pageBlob.sha});
  const tree=await github('/git/trees','POST',{base_tree:parent.tree.sha,tree:treeEntries});
  const commit=await github('/git/commits','POST',{message:'Actualizare site din panoul ABT Cleaning Services',tree:tree.sha,parents:[body.revision]});
  // Never force: another publication or developer push must not be overwritten.
  await github('/git/refs/heads/'+branch.split('/').map(encodeURIComponent).join('/'),'PATCH',{sha:commit.sha,force:false});
  await env.EDITOR_DB.prepare('INSERT INTO editor_publications(request_id,revision,content_hash,created_at) VALUES(?,?,?,?)').bind(body.requestId,commit.sha,contentHash,Date.now()).run().catch(()=>{});
  return json({saved:true,revision:commit.sha,publicationId:body.requestId});
 }
 throw new ApiError(404,'Pagina cerută nu există.');
}
