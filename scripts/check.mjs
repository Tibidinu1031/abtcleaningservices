import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {validateContent,imagePaths} from '../content-schema.js';
import {renderHomepage} from '../content-renderer.js';
const files=['app.js','admin.js','content-schema.js','content-renderer.js','cloudflare/worker.js','cloudflare/editor-api.js','scripts/build.mjs','scripts/serve.mjs','scripts/password.mjs'];
for(const file of files){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);}
const raw=await fs.readFile('assets/site-content.json','utf8'),content=validateContent(JSON.parse(raw.replace(/^\uFEFF/,'')));
for(const file of imagePaths(content))await fs.access(file);
const html=renderHomepage(content);if(/[\u2013\u2014]/.test(html))throw new Error('Pagina conține o cratimă lungă.');
for(const [,file] of html.matchAll(/(?:src|href)="((?:assets\/[^"#?]+|(?:styles|app)\.[a-z]+))"/g))await fs.access(file);
console.log('Sintaxă, conținut, fotografii și căi relative verificate.');
