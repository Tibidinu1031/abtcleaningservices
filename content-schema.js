export class ContentError extends Error {}
const fail=message=>{throw new ContentError(message)};
function obj(value){if(!value||typeof value!=='object'||Array.isArray(value))fail('Datele paginii nu sunt valide.');return value;}
function text(value,limit=2000){if(typeof value!=='string'||value.length>limit)fail('Un text nu este valid sau este prea lung.');if(/[\u2013\u2014]/.test(value))fail('Folosește punct, virgulă sau cratimă simplă în locul cratimei lungi.');return value;}
function list(value,limit=20){if(!Array.isArray(value)||value.length>limit)fail('Sunt prea multe elemente.');return value;}
function link(value){text(value,4000);if(!value)return '';let url;try{url=new URL(value);}catch{fail('Folosește un link HTTPS valid.');}if(url.protocol!=='https:'||url.username||url.password)fail('Folosește un link HTTPS valid.');return url.href;}
function localMedia(value,video=false){const src=text(value,200);const regex=video?/^assets\/(?:gallery\/[a-zA-Z0-9_-]+|uploads\/[a-f0-9]{64})\.(?:mp4|webm)$/:/^assets\/(?:[a-zA-Z0-9_-]+|gallery\/[a-zA-Z0-9_-]+|uploads\/[a-f0-9]{64})\.(?:webp|jpg|jpeg|png)$/;if(!regex.test(src))fail('Încarcă fișierul prin editor.');return src;}
function dimensions(value){if(!Number.isInteger(value.width)||!Number.isInteger(value.height)||value.width<1||value.height<1||value.width>10000||value.height>10000)fail('Dimensiunile fișierului nu sunt valide.');return{width:value.width,height:value.height};}
function image(value){obj(value);return{src:localMedia(value.src),alt:text(value.alt,300),...dimensions(value)};}
function headings(value){obj(value);return{eyebrow:text(value.eyebrow,120),title:text(value.title,160),accent:text(value.accent,160)};}
export function validateContent(value){
 obj(value);if(value.version!==1)fail('Versiunea datelor nu este acceptată.');
 const h=obj(value.hero),s=obj(value.services),a=obj(value.about),p=obj(value.process),f=obj(value.faq),c=obj(value.contact),g=obj(value.gallery||{eyebrow:'02 / GALERIE',title:'Din lucrările ABT.',accent:'Fotografii și video.',intro:'',items:[]});
 const phone=text(c.phone,80);if(!/^\+?[0-9 ()-]{6,30}$/.test(phone)||phone.replace(/\D/g,'').length<6)fail('Telefonul nu este valid.');
 const email=text(c.email,254);if(email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))fail('Adresa de email nu este validă.');
 const map=link(c.mapEmbedUrl);if(map){const u=new URL(map);if(!/^(www\.)?google\.(com|ro)$/.test(u.hostname)||!/^\/maps(?:\/|$)/.test(u.pathname)||(!u.pathname.startsWith('/maps/embed')&&u.searchParams.get('output')!=='embed'))fail('Folosește linkul de încorporare Google Maps.');}
 const content={version:1,publicationId:text(value.publicationId||'',80),
 hero:{eyebrow:text(h.eyebrow,120),heading:text(h.heading,160),accent:text(h.accent,160),intro:text(h.intro),cta:text(h.cta,80),image:image(h.image),imageLabel:text(h.imageLabel,100),imageCaption:text(h.imageCaption,160)},
 services:{...headings(s),intro:text(s.intro),items:list(s.items,12).map(item=>{obj(item);if(!/^[a-zA-Z0-9_-]{1,80}$/.test(item.id))fail('Un serviciu nu are un identificator valid.');const category=item.category||'acasa';if(!['acasa','business','special'].includes(category))fail('Categoria serviciului nu este validă.');return{id:item.id,category,title:text(item.title,120),subtitle:text(item.subtitle,160),body:text(item.body),image:image(item.image),details:list(item.details,12).map(v=>text(v,300))};})},
 gallery:{...headings(g),intro:text(g.intro),items:list(g.items,60).map(v=>{obj(v);if(!/^[a-zA-Z0-9_-]{1,80}$/.test(v.id)||!['image','video'].includes(v.type))fail('Un element din galerie nu este valid.');return{id:v.id,type:v.type,src:localMedia(v.src,v.type==='video'),alt:text(v.alt,300),...dimensions(v),title:text(v.title,160),caption:text(v.caption,1000),source:link(v.source),poster:v.poster?localMedia(v.poster):''};})},
 about:{...headings(a),intro:text(a.intro),body:text(a.body,5000),points:list(a.points,8).map(v=>({title:text(v.title,160),body:text(v.body,1000)}))},
 process:{...headings(p),intro:text(p.intro),steps:list(p.steps,8).map(v=>({title:text(v.title,160),body:text(v.body,2000)}))},
 faq:{...headings(f),items:list(f.items,20).map(v=>({question:text(v.question,200),answer:text(v.answer,3000)}))},
 contact:{...headings(c),intro:text(c.intro),phone,email,address:text(c.address,1000),hours:text(c.hours,1000),facebookUrl:link(c.facebookUrl),whatsappUrl:link(c.whatsappUrl),mapsUrl:link(c.mapsUrl),directionsUrl:link(c.directionsUrl),mapEmbedUrl:map,rating:text(c.rating,10),reviewCount:text(c.reviewCount,10)}
 };
 if(!content.services.items.length)fail('Adaugă cel puțin un serviciu.');
 for(const values of [content.services.items,content.gallery.items])if(new Set(values.map(v=>v.id)).size!==values.length)fail('Două elemente au același identificator.');
 if(content.contact.rating&&!/^[0-5](?:[.,][0-9])?$/.test(content.contact.rating))fail('Evaluarea nu este validă.');
 if(content.contact.reviewCount&&!/^\d{1,8}$/.test(content.contact.reviewCount))fail('Numărul de recenzii nu este valid.');
 return content;
}
export function imagePaths(content){return [...new Set([content.hero.image.src,...content.services.items.map(v=>v.image.src),...content.gallery.items.flatMap(v=>[v.src,...(v.poster?[v.poster]:[])])])];}
