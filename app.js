(()=>{'use strict';
const $=s=>document.querySelector(s),header=$('.site-header'),menu=$('.menu-toggle'),mobile=$('#mobile-nav');
const closeMenu=()=>{mobile.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Deschide meniul');};
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';mobile.hidden=!open;menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Închide meniul':'Deschide meniul');});
mobile.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobile.hidden){closeMenu();menu.focus();}});
matchMedia('(min-width:761px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
const updateHeader=()=>header.classList.toggle('scrolled',scrollY>10);addEventListener('scroll',updateHeader,{passive:true});updateHeader();
document.querySelectorAll('[data-year]').forEach(n=>n.textContent=new Date().getFullYear());
const inquiry=$('#inquiry-dialog'),privacy=$('#privacy-dialog');let lastFocus;
function openDialog(dialog){lastFocus=document.activeElement;dialog.showModal();document.body.classList.add('modal-open');}
document.querySelectorAll('[data-inquiry]').forEach(button=>button.addEventListener('click',()=>{const service=button.dataset.service;if(service)$('#inquiry-service').value=service;$('#inquiry-status').textContent='';openDialog(inquiry);}));
document.querySelectorAll('[data-privacy]').forEach(button=>button.addEventListener('click',()=>openDialog(privacy)));
for(const dialog of [inquiry,privacy]){
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');lastFocus?.focus();});
}
$('#inquiry-form').addEventListener('submit',event=>{
 event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
 if(!form.dataset.whatsapp){$('#inquiry-status').textContent='Contactează-ne telefonic pentru a discuta detaliile.';return;}
 const data=new FormData(form);const lines=['Bună ziua! Aș dori o ofertă Lexyns Clean.','Serviciu: '+data.get('service'),'Localitate: '+data.get('location')];
 if(data.get('area'))lines.push('Suprafață aproximativă: '+data.get('area')+' m²');
 if(data.get('notes')?.trim())lines.push('Detalii: '+data.get('notes').trim());
 const url=new URL(form.dataset.whatsapp);url.searchParams.set('text',lines.join('\n'));
 const opened=window.open(url.href,'_blank','noopener,noreferrer');
 $('#inquiry-status').replaceChildren();const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Deschide mesajul în WhatsApp';link.className='text-link';$('#inquiry-status').append(link);
});
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){document.querySelectorAll('.desktop-nav a').forEach(link=>{if(link.hash==='#'+entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}}},{rootMargin:'-15% 0px -65% 0px',threshold:0});['servicii','despre','proces','contact'].forEach(id=>observer.observe(document.getElementById(id)));}

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
 const revealTargets=[...document.querySelectorAll('.section-heading,.service-card,.about-picture,.about-copy,.process-heading,.process-list li,.faq-grid>div,.contact-heading,.contact-actions,.location-grid')];
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

})();
