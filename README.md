# Lexyns Clean
Site static pentru o firmă de curățenie din Sibiu. Indexul este în rădăcină, pregătit pentru GitHub Pages. Frontendul nu are framework și nu are nevoie de build pentru afișare.

## Deschidere locală
Cu Node.js 20 sau mai nou:
```sh
npm install
npm run dev
```
Deschide http://127.0.0.1:5173. Editorul este la http://127.0.0.1:5173/admin.html. Înainte de conectarea găzduirii, apasă „Deschide editorul local”. Ciorna este salvată în IndexedDB, numai în browserul folosit.

## GitHub Pages, varianta simplă
Încarcă proiectul într-un repository al clientului. Nu încărca node_modules, .qa, .wrangler, .dev.vars sau .env. Fișierul .gitignore exclude aceste directoare și fișiere.
În Settings, Pages, alege Deploy from a branch, apoi main și / (root). Indexul generat este deja la rădăcină; toate resursele folosesc căi relative.
Workflow-ul opțional pages.yml rulează manual. Pentru această variantă alege GitHub Actions în setările Pages și pornește workflow-ul din Actions.

## Ce poate modifica clientul
Editorul permite modificarea primei secțiuni, serviciilor și fotografiilor, informațiilor despre firmă, etapelor, întrebărilor, telefonului, Facebook, WhatsApp, adresei, programului, hărții și evaluării Google. Elementele pot fi adăugate, eliminate și reordonate. Previzualizarea folosește exact același generator HTML ca publicarea. Fotografiile sunt optimizate automat în WebP, maxim 1800 px și 2 MB.
Evaluarea Google și numărul de recenzii se actualizează manual, după verificarea sursei.

## Activarea administrării online
GitHub Pages servește site-ul public static. Autentificarea și publicarea necesită găzduire cu API, ca la Red Tattoo. Varianta pregătită este Cloudflare Pages, în contul clientului, conectat la repository-ul acestuia. Pentru aceeași experiență simplă de administrare, folosește Cloudflare Pages ca găzduire principală; GitHub Pages poate rămâne o copie statică.

După primirea conturilor:
1. Creează repository-ul GitHub al clientului și conectează-l la Cloudflare Pages. Build: npm run build. Director public: dist.
2. Creează D1 cu npx wrangler d1 create lexyns-clean-editor. Înlocuiește ID-ul format din zerouri din wrangler.jsonc cu ID-ul real al bazei din contul clientului. ID-ul actual este destinat exclusiv testelor locale.
3. Inițializează schema: npx wrangler d1 execute EDITOR_DB --remote --file=cloudflare/schema.sql.
4. Completează GITHUB_REPOSITORY cu proprietar/repository și GITHUB_BRANCH cu main.
5. Creează un fine-grained token GitHub cu acces numai la repository-ul clientului și Contents: Read and write. Adaugă tokenul doar ca secret Cloudflare GITHUB_TOKEN.
6. Generează hash-ul parolei cu npm run admin:password. Setează valoarea din fișierul privat generat ca secret ADMIN_PASSWORD_HASH. Setează ADMIN_USERNAME.
7. Publică și verifică autentificarea, modificarea unei ciorne, previzualizarea și publicarea într-un alt browser.

Nu copia secrete în JavaScriptul public. Panoul nu conține o parolă implicită. Sesiunea folosește cookie HttpOnly, SameSite=Strict și Secure pe HTTPS. Parolele sunt verificate cu PBKDF2-SHA256, cu salt aleator. Sunt limitate încercările de autentificare.
Publicarea creează un singur commit cu JSON, index.html și fotografiile noi. Nu suprascrie modificările altcuiva: dacă ramura s-a schimbat, editorul cere reîncărcarea. Cloudflare construiește versiunea nouă după commit; editorul distinge între salvarea în GitHub și confirmarea apariției pe site.

Documentație: [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/advanced-mode/), [D1 bindings](https://developers.cloudflare.com/pages/functions/bindings/), [GitHub REST](https://docs.github.com/en/rest/about-the-rest-api/api-versions).

## Verificări și build
```sh
npm run check
npm test
npm run build
```
Build Cloudflare include API-ul; node scripts/build.mjs --static creează o variantă statică pentru GitHub Pages. Build-ul copiază numai resursele publice necesare. El regenerează și index.html din assets/site-content.json.
Pentru modificări făcute manual în JSON, rulează build și include index.html actualizat în commit.

## Design și conținut
Verde profund, accente verzi luminoase, tipografie Instrument Serif și Manrope, fotografii ample. Fonturile și imaginile sunt locale. Nu există cratime lungi în textele site-ului. Editorul le respinge pentru a păstra această cerință.
Meniul mobil, detaliile serviciilor, întrebările și dialogurile se pot folosi cu tastatura. Site-ul respectă prefers-reduced-motion. Formularul de ofertă pregătește un mesaj WhatsApp și nu pretinde că a trimis o cerere sau a confirmat o rezervare.

Telefonul principal, pinul și evaluarea au fost verificate pe Google Maps la 5 octombrie 2026: 0754 679 238, Strada Andrei Șaguna, Sibiu, 5,0 din 2 recenzii. Pin: ChIJv4D-SHZnTEcRz1PqtJs3atI; CID: 15161992237390910415. Facebook afișează un alt număr, 0740 548 753; alegerea contactului trebuie confirmată cu clientul. Legătura WhatsApp este construită din numărul principal; apartenența acestui număr la un cont WhatsApp nu a fost confirmată.
Nu au fost inventate recenzii, citate de la clienți, prețuri, ani de experiență sau certificări. Categoriile de servicii și formulările descriptive sunt o propunere editorială care trebuie confirmată de firmă.
Cele trei fotografii sunt imagini ilustrative Pexels, de Max Vakhtbovych. Nu reprezintă lucrări realizate de Lexyns Clean. Sursele și licențele sunt în assets/sources.json și fișierele de licență.
Numele juridic, CUI-ul, emailul și numărul adresei nu au fost presupuse. Identitatea grafică este o propunere creată pentru această versiune, nu un logo original furnizat de firmă.


## Detalii vizuale și interacțiuni
Grilă geometrică cu noduri simetrice, repere circulare, rame fotografice și indicator de derulare. Fotografia principală urmărește discret cursorul; cardurile au un accent luminos la hover. Secțiunile apar gradual la derulare, iar preferința pentru reducerea mișcării dezactivează animațiile. FAQ-ul păstrează un singur răspuns deschis. Numărul de telefon poate fi copiat cu confirmare numai după succes.

Repository: https://github.com/Tibidinu1031/lexynsclean. Publicarea din panou necesită în continuare configurarea Cloudflare și a secretului GitHub, fără token în frontend.
