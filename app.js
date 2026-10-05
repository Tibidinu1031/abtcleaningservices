(()=>{'use strict';
const $=s=>document.querySelector(s),header=$('.site-header'),menu=$('.menu-toggle'),mobile=$('#mobile-nav');
const closeMenu=()=>{mobile.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Deschide meniul');};
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';mobile.hidden=!open;menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Închide meniul':'Deschide meniul');});
mobile.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobile.hidden){closeMenu();menu.focus();}});
matchMedia('(min-width:981px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
const updateHeader=()=>header.classList.toggle('scrolled',scrollY>10);addEventListener('scroll',updateHeader,{passive:true});updateHeader();
document.querySelectorAll('[data-year]').forEach(n=>n.textContent=new Date().getFullYear());
const inquiry=$('#inquiry-dialog'),privacy=$('#privacy-dialog'),media=$('#media-dialog');let lastFocus;
function openDialog(dialog){lastFocus=document.activeElement;dialog.showModal();document.body.classList.add('modal-open');}
document.querySelectorAll('[data-inquiry]').forEach(button=>button.addEventListener('click',()=>{const service=button.dataset.service;if(service){const select=$('#inquiry-service');select.value=[...select.options].some(o=>o.value===service)?service:'Altă solicitare';}$('#inquiry-status').textContent='';openDialog(inquiry);}));
document.querySelectorAll('[data-privacy]').forEach(button=>button.addEventListener('click',()=>openDialog(privacy)));
for(const dialog of [inquiry,privacy,media]){
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');lastFocus?.focus();});
}
$('#inquiry-form').addEventListener('submit',event=>{
 event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
 if(!form.dataset.whatsapp){$('#inquiry-status').textContent='Contactează-ne telefonic pentru a discuta detaliile.';return;}
 const data=new FormData(form);const lines=['Bună ziua! Aș dori o ofertă ABT Cleaning Services.','Serviciu: '+data.get('service'),'Localitate: '+data.get('location')];
 if(data.get('area'))lines.push('Suprafață aproximativă: '+data.get('area')+' m²');
 if(data.get('notes')?.trim())lines.push('Detalii: '+data.get('notes').trim());
 const url=new URL(form.dataset.whatsapp);url.searchParams.set('text',lines.join('\n'));
 const opened=window.open(url.href,'_blank','noopener,noreferrer');
 $('#inquiry-status').replaceChildren();const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Deschide mesajul în WhatsApp';link.className='text-link';$('#inquiry-status').append(link);
});
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){document.querySelectorAll('.desktop-nav a').forEach(link=>{if(link.hash==='#'+entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}}},{rootMargin:'-15% 0px -65% 0px',threshold:0});['servicii','galerie','despre','proces','contact'].forEach(id=>observer.observe(document.getElementById(id)));}

const reduceMotion=matchMedia('(prefers-reduced-motion:reduce)');
if(document.body.classList.contains('site-page')){
 // Decorative progress follows scroll without creating a continuous animation loop.
 let scrollFrame=0;
 const paintProgress=()=>{scrollFrame=0;const distance=document.documentElement.scrollHeight-innerHeight;header.style.setProperty('--reading-progress',String(distance>0?Math.min(1,Math.max(0,scrollY/distance)):0));};
 const scheduleProgress=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(paintProgress);};
 addEventListener('scroll',scheduleProgress,{passive:true});addEventListener('resize',scheduleProgress,{passive:true});paintProgress();
 document.querySelectorAll('.service-details,.faq-list details').forEach(details=>details.addEventListener('toggle',()=>{
  details.closest('.service-card')?.classList.toggle('is-expanded',details.open);
  if(details.open&&details.closest('.faq-list'))details.closest('.faq-list').querySelectorAll('details').forEach(other=>{if(other!==details)other.open=false;});
  scheduleProgress();
 }));
 const copy=$('[data-copy-phone]');
 copy?.addEventListener('click',async()=>{
  const status=$('#copy-phone-status');
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(copy.dataset.copyPhone);status.textContent='Numărul a fost copiat.';copy.classList.add('copied');}
  catch{status.textContent='Selectează numărul afișat pentru a-l copia.';}
 });
 const revealTargets=[...document.querySelectorAll('.gallery-card,.section-heading,.service-card,.about-picture,.about-copy,.process-heading,.process-list li,.faq-grid>div,.contact-heading,.contact-actions,.location-grid')];
 let revealObserver;
 function showAll(){document.body.classList.remove('has-motion');revealObserver?.disconnect();revealTargets.forEach(n=>n.classList.remove('reveal-pending'));}
 if(!reduceMotion.matches&&'IntersectionObserver' in window){
  document.body.classList.add('has-motion');
  revealObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');entry.target.classList.add('reveal-shown');revealObserver.unobserve(entry.target);}}},{rootMargin:'0px 0px 55px 0px',threshold:.06});
  revealTargets.forEach((target,index)=>{target.classList.add('reveal-target');if(target.getBoundingClientRect().top>innerHeight){target.classList.add('reveal-pending');target.style.setProperty('--reveal-delay',target.matches('.service-card')?Array.from(target.parentElement.children).indexOf(target)*75+'ms':'0ms');}else target.classList.add('reveal-shown');revealObserver.observe(target);});
 }
 reduceMotion.addEventListener('change',event=>{if(event.matches)showAll();});
 // Pointer reactions are limited to precise pointers and respect reduced motion.
 if(matchMedia('(hover:hover) and (pointer:fine)').matches){
  const photo=$('.hero-visual');
  photo?.addEventListener('pointermove',event=>{if(reduceMotion.matches)return;const r=photo.getBoundingClientRect();photo.style.setProperty('--photo-x',((event.clientX-r.left)/r.width-.5)*-10+'px');photo.style.setProperty('--photo-y',((event.clientY-r.top)/r.height-.5)*-10+'px');});
  photo?.addEventListener('pointerleave',()=>{photo.style.setProperty('--photo-x','0px');photo.style.setProperty('--photo-y','0px');});
  document.querySelectorAll('.service-card').forEach(card=>card.addEventListener('pointermove',event=>{if(reduceMotion.matches)return;const r=card.getBoundingClientRect();card.style.setProperty('--pointer-x',event.clientX-r.left+'px');card.style.setProperty('--pointer-y',event.clientY-r.top+'px');}));
 }
}


const heroChoices=[...document.querySelectorAll('[data-hero-service]')];
const heroNotes=['Curățenie generală sau întreținere, în ritmul tău.','Un spațiu îngrijit pentru echipă și clienți.','Canapele și saltele curățate cu echipamente dedicate.'];
heroChoices.forEach((button,i)=>button.addEventListener('click',()=>{heroChoices.forEach(n=>n.setAttribute('aria-pressed',String(n===button)));$('#hero-selection').textContent=heroNotes[i];$('.hero-actions [data-inquiry]').dataset.service=button.dataset.heroService;swapPhoto($('.hero-visual>img'),button.dataset.heroImage,button.dataset.heroAlt);pulse($('.hero-selector')); }));
document.querySelectorAll('[data-service-filter]').forEach(button=>button.addEventListener('click',()=>{let count=0;document.querySelectorAll('[data-service-filter]').forEach(n=>n.setAttribute('aria-pressed',String(n===button)));document.querySelectorAll('.service-card').forEach(card=>{card.hidden=button.dataset.serviceFilter!=='all'&&card.dataset.serviceCategory!==button.dataset.serviceFilter;if(!card.hidden)count++;});$('#service-result').textContent=count+(count===1?' serviciu':' servicii');$('#services-empty').hidden=count>0;dispatchEvent(new Event('resize'));}));
document.querySelectorAll('.care-item').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open){document.querySelectorAll('.care-item').forEach(other=>{if(other!==detail)other.open=false;});swapPhoto($('.about-picture>img'),detail.dataset.aboutImage,detail.dataset.aboutAlt);}}));
document.querySelectorAll('[data-process-index]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-process-index]').forEach(n=>n.setAttribute('aria-pressed',String(n===button)));$('#process-number').textContent=String(Number(button.dataset.processIndex)+1).padStart(2,'0');$('#process-title').textContent=button.querySelector('strong').textContent;$('#process-body').textContent=button.querySelector('.process-step-description').textContent;pulse($('.process-focus'));}));
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
$('#faq-search')?.addEventListener('input',event=>{const query=normalize(event.target.value.trim());let count=0;document.querySelectorAll('.faq-list details').forEach(detail=>{detail.hidden=!normalize(detail.textContent).includes(query);if(!detail.hidden)count++;});$('#faq-result').textContent=query?count+(count===1?' întrebare găsită':' întrebări găsite'):'';$('#faq-empty').hidden=count>0;dispatchEvent(new Event('resize'));});
const mediaButtons=[...document.querySelectorAll('.gallery-open')];let galleryFilter='all',activeMedia=0,visibleMedia=mediaButtons;
function paintMedia(index){if(!visibleMedia.length)return;activeMedia=(index+visibleMedia.length)%visibleMedia.length;const button=visibleMedia[activeMedia],stage=$('#media-stage');stage.querySelector('video')?.pause();stage.replaceChildren();const item=document.createElement(button.dataset.mediaType==='video'?'video':'img');item.src=button.dataset.mediaSrc;if(item.tagName==='VIDEO'){item.controls=true;item.playsInline=true;item.preload='metadata';item.poster=button.querySelector('img').src;}else item.alt=button.dataset.mediaAlt;stage.append(item);$('#media-title').textContent=button.dataset.mediaTitle;$('#media-caption').textContent=button.dataset.mediaCaption;$('#media-position').textContent=(activeMedia+1)+' / '+visibleMedia.length;$('#media-source').href=button.dataset.mediaSource;$('#media-source').hidden=!button.dataset.mediaSource;$('#media-prev').disabled=$('#media-next').disabled=visibleMedia.length<2;}
mediaButtons.forEach(button=>button.addEventListener('click',()=>{visibleMedia=mediaButtons.filter(n=>!n.closest('.gallery-card').hidden);paintMedia(visibleMedia.indexOf(button));openDialog(media);}));
document.querySelectorAll('[data-gallery-filter]').forEach(button=>button.addEventListener('click',()=>{galleryFilter=button.dataset.galleryFilter;document.querySelectorAll('[data-gallery-filter]').forEach(n=>n.setAttribute('aria-pressed',String(n===button)));mediaButtons.forEach(n=>n.closest('.gallery-card').hidden=galleryFilter!=='all'&&n.dataset.mediaType!==galleryFilter);visibleMedia=mediaButtons.filter(n=>!n.closest('.gallery-card').hidden);$('#gallery-result').textContent=visibleMedia.length+(galleryFilter==='image'?' fotografii':galleryFilter==='video'?(visibleMedia.length===1?' clip':' clipuri'):' materiale');$('#gallery-empty').hidden=visibleMedia.length>0;dispatchEvent(new Event('resize'));}));
$('#media-prev')?.addEventListener('click',()=>paintMedia(activeMedia-1));$('#media-next')?.addEventListener('click',()=>paintMedia(activeMedia+1));
media?.addEventListener('close',()=>{$('#media-stage video')?.pause();$('#media-stage').replaceChildren();});
media?.addEventListener('keydown',event=>{if(event.target.tagName==='VIDEO')return;if(event.key==='ArrowLeft'){event.preventDefault();paintMedia(activeMedia-1);}if(event.key==='ArrowRight'){event.preventDefault();paintMedia(activeMedia+1);}});

const photoVersions=new WeakMap();
function pulse(node){if(!node||reduceMotion.matches)return;node.classList.remove('interaction-change');void node.offsetWidth;node.classList.add('interaction-change');}
async function swapPhoto(target,src,alt){if(!target||!src)return;const version=(photoVersions.get(target)||0)+1;photoVersions.set(target,version);const next=new Image();next.src=src;try{await next.decode();if(photoVersions.get(target)!==version)return;target.src=src;target.alt=alt||'';pulse(target);}catch{}}
document.querySelectorAll('[data-toggle-service]').forEach(button=>{const detail=document.getElementById(button.getAttribute('aria-controls'));button.addEventListener('click',()=>{detail.open=!detail.open;});detail.addEventListener('toggle',()=>{button.setAttribute('aria-expanded',String(detail.open));button.firstChild.textContent=detail.open?'Închide detaliile ':'Vezi detaliile ';});});
document.querySelectorAll('[data-faq-query]').forEach(button=>button.addEventListener('click',()=>{const input=$('#faq-search');input.value=button.dataset.faqQuery;input.dispatchEvent(new Event('input'));document.querySelectorAll('[data-faq-query]').forEach(n=>n.setAttribute('aria-pressed',String(n===button)));pulse($('.faq-list'));}));
const stage=$('.hero-stage');
if(stage&&matchMedia('(hover:hover) and (pointer:fine)').matches){let frame=0,point;stage.addEventListener('pointermove',event=>{if(reduceMotion.matches)return;point={x:event.clientX,y:event.clientY};if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const r=stage.getBoundingClientRect(),x=point.x-r.left,y=point.y-r.top;stage.style.setProperty('--draft-cursor-x',x+'px');stage.style.setProperty('--draft-cursor-y',y+'px');stage.style.setProperty('--draft-shift-x',(x/r.width-.5)*12+'px');stage.style.setProperty('--draft-shift-y',(y/r.height-.5)*12+'px');stage.classList.add('draft-active');});});stage.addEventListener('pointerleave',()=>stage.classList.remove('draft-active'));}
for(const selector of ['.gallery-open','.about-picture','.process-focus','.location-grid'])document.querySelectorAll(selector).forEach(node=>{node.classList.add('reactive-surface');node.addEventListener('pointermove',event=>{if(reduceMotion.matches||!matchMedia('(hover:hover)').matches)return;const r=node.getBoundingClientRect();node.style.setProperty('--surface-x',event.clientX-r.left+'px');node.style.setProperty('--surface-y',event.clientY-r.top+'px');});});

})();
