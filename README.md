# ABT Cleaning Services

Site static pentru ABT Cleaning Services SRL din Iași. Fișierul `index.html` este în rădăcină. Frontendul folosește HTML, CSS și JavaScript, cu resurse locale și căi relative compatibile cu GitHub Pages.

Repository: https://github.com/Tibidinu1031/abtcleaningservices

## Pornire locală

Cu Node.js 20 sau mai nou:

```sh
npm ci
npm run dev
```

Site: http://127.0.0.1:5173/ . Panou: http://127.0.0.1:5173/admin.html . „Deschide editorul local” permite editarea și previzualizarea înainte de conectarea conturilor. Ciorna se salvează în IndexedDB, în browserul folosit.

## GitHub Pages

În Settings > Pages alege Deploy from a branch, `main`, `/ (root)`. Nu este necesar un build pentru afișarea indexului deja generat. Workflow-ul opțional `pages.yml` permite și publicare manuală prin GitHub Actions.

Pentru modificări manuale în `assets/site-content.json`, rulează build și include indexul actualizat în același commit. Editorul și publicarea folosesc același generator HTML.

## Design și interacțiuni

Albastru profund și auriu, în acord cu logo-ul original. Fundal cu linii și puncte simetrice, repere circulare, rame fotografice și progres la derulare. Logo-ul apare în timpul încărcării, cu o limită de timp pentru a nu bloca pagina.

Prima secțiune selectează serviciul dorit. Serviciile au filtre și detalii extensibile. Galeria conține 8 fotografii și un video real, cu filtre, vizualizare mărită, navigare și controale video. Secțiunea despre echipă are detalii extensibile, procesul are pași selectabili, întrebările au căutare, iar contactul are copierea numărului, formular WhatsApp și pin Google Maps.

Controalele se folosesc și cu tastatura. Animațiile respectă `prefers-reduced-motion`. Formularul pregătește un mesaj WhatsApp; trimiterea și confirmarea programării se fac în conversația cu firma. Nu există cratime lungi în textele site-ului, iar editorul le respinge.

## Panoul clientului

Clientul poate modifica textele, serviciile și categoriile lor, fotografiile, galeria foto și video, ordinea elementelor, întrebările și datele de contact. Previzualizarea oferă mod Desktop și Telefon. Fotografiile JPG, PNG sau WebP sunt optimizate automat, la maxim 1800 px și 2 MB. Clipurile MP4/WebM au maxim 8 MB; sunt păstrate fără recomprimare și primesc o imagine de copertă generată dintr-un cadru al clipului.

Publicarea acceptă maxim 20 de fișiere și 10 MB de fișiere noi odată. Clipul și coperta sunt fișiere separate. O publicare creează un singur commit cu textele, indexul și media, fără a suprascrie modificări concurente. Panoul diferențiază salvarea în GitHub de confirmarea apariției pe site.

Instrucțiunile pentru client sunt în [GHID-ADMIN.md](GHID-ADMIN.md).

## Activarea administrării online

GitHub Pages servește pagina statică. API-ul de autentificare și publicare este pregătit pentru Cloudflare Pages, ca în proiectul Red Tattoo. Activarea necesită contul Cloudflare al clientului și accesul GitHub corespunzător.

1. Conectează repository-ul la Cloudflare Pages. Build: `npm run build`. Director public: `dist`.
2. Creează baza cu `npx wrangler d1 create abt-cleaning-editor`. Înlocuiește ID-ul de zerouri din `wrangler.jsonc` cu cel real.
3. Inițializează schema: `npx wrangler d1 execute EDITOR_DB --remote --file=cloudflare/schema.sql`.
4. Verifică `GITHUB_REPOSITORY`, `GITHUB_BRANCH` și `ADMIN_USERNAME` din configurație.
5. Creează un token GitHub cu acces numai la repository și Contents: Read and write. Adaugă-l ca secret Cloudflare `GITHUB_TOKEN`.
6. Rulează `npm run admin:password`. Adaugă hash-ul rezultat ca secret `ADMIN_PASSWORD_HASH`.
7. Verifică autentificarea, previzualizarea, publicarea și apariția modificărilor într-un alt browser.

Nu există parolă implicită sau token în frontend. Sesiunea folosește cookie HttpOnly, SameSite=Strict și Secure pe HTTPS. Parola folosește PBKDF2-SHA256 cu salt aleator, iar încercările de autentificare sunt limitate. Configurarea actuală nu activează administrarea online.

## Verificări

```sh
npm run check
npm test
npm run build
```

Build-ul Cloudflare include API-ul. `node scripts/build.mjs --static` produce numai varianta statică. Build-ul copiază resursele publice folosite și regenerează `index.html`. `.gitignore` exclude ciornele de test, dependențele, build-urile și fișierele de secrete.

## Conținut și surse

Datele verificate la 5 octombrie 2026: ABT Cleaning Services SRL, Iași și împrejurimi, 0748 532 297, abtcleaningsrl@gmail.com, Strada Bradului 17, bloc G4, scara B, Iași 700661. Program: luni până sâmbătă 08:00 - 21:00, duminică închis. Evaluare Google: 4,9 din 42 de recenzii. Evaluarea și numărul de recenzii se actualizează manual.

Pin Google: `ChIJ9QyWZU_7ykARNKqUqN97cq8`, CID `12642303304518642228`. Surse: [Google Business](https://share.google/p6ODOBc2FBwkKriMz), [Facebook ABT](https://www.facebook.com/p/ABT-Cleaning-Services-SRL-100063632917087/).

Logo-ul a fost furnizat de utilizator și păstrat intact. Fotografiile și clipul provin din pagina publică ABT. Clipul arată curățarea mochetei într-un spațiu de birouri și a fost publicat pe 16 decembrie 2025. Nu sunt imagini generate sau fotografii de stoc prezentate drept lucrări. Sursele individuale sunt în `assets/sources.json` și pot fi deschise și din galerie.

Nu au fost inventate recenzii, prețuri, ani de experiență sau certificări. Textele descriptive sunt redactate pe baza serviciilor publicate de ABT. Fonturile locale Manrope și Instrument Serif includ licențele lor.
