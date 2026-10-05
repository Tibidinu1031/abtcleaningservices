import fs from 'node:fs/promises';
import path from 'node:path';
import {renderHomepage} from '../content-renderer.js';
import {validateContent,imagePaths} from '../content-schema.js';
const root=process.cwd(),dist=path.resolve(root,'dist');
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw new Error('Directorul de build nu este valid.');
try{if((await fs.lstat(dist)).isSymbolicLink())throw new Error('Directorul dist nu poate fi un link simbolic.');await fs.rm(dist,{recursive:true,force:true});}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.mkdir(path.join(dist,'assets'),{recursive:true});
const raw=await fs.readFile('assets/site-content.json','utf8'),content=validateContent(JSON.parse(raw.replace(/^\uFEFF/,'')));
const html=renderHomepage(content);
await fs.writeFile('index.html',html);await fs.writeFile(path.join(dist,'index.html'),html);
for(const file of ['styles.css','app.js','admin.html','admin.css','admin.js','content-schema.js','content-renderer.js','.nojekyll','_headers','_redirects'])await fs.copyFile(file,path.join(dist,file));
await fs.writeFile(path.join(dist,'assets/site-content.json'),JSON.stringify(content,null,2)+'\n');
for(const file of ['favicon.svg','manrope.woff2','manrope-ext.woff2','instrument-serif.woff2','instrument-serif-ext.woff2','instrument-serif-italic.woff2','instrument-serif-italic-ext.woff2','sources.json','manrope-LICENSE.txt','instrument-serif-LICENSE.txt'])await fs.copyFile('assets/'+file,path.join(dist,'assets',file));
for(const file of imagePaths(content)){await fs.mkdir(path.dirname(path.join(dist,file)),{recursive:true});await fs.copyFile(file,path.join(dist,file));}
if(!process.argv.includes('--static')){const {build}=await import('esbuild');await build({entryPoints:['cloudflare/worker.js'],outfile:path.join(dist,'_worker.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});await fs.writeFile(path.join(dist,'_routes.json'),JSON.stringify({version:1,include:['/api/*','/admin'],exclude:[]}));}
console.log('Build validat: '+(process.argv.includes('--static')?'GitHub Pages static':'Cloudflare Pages cu editor')+'.');
