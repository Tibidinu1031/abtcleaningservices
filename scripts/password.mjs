import {randomBytes,pbkdf2Sync} from 'node:crypto';
import fs from 'node:fs/promises';
import readline from 'node:readline/promises';
const r=readline.createInterface({input:process.stdin,output:process.stdout});
try{
 const password=await r.question('Parola nouă (minim 12 caractere; introducerea este vizibilă doar local): ');
 if(password.length<12)throw new Error('Folosește o parolă de cel puțin 12 caractere.');
 const salt=randomBytes(16).toString('hex'),hash=pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex');
 await fs.mkdir('.qa',{recursive:true});await fs.writeFile('.qa/admin-password-hash.txt',salt+':'+hash+'\n');
 console.log('Hash-ul este în .qa/admin-password-hash.txt. Setează-l ca secret ADMIN_PASSWORD_HASH în Cloudflare. Fișierul nu este inclus în Git sau build.');
}finally{r.close();}
