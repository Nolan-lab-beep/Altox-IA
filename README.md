# Altox-ia — le chat IA que tu joues toi-même

Une PWA (application web installable) : un visiteur crée un compte et discute avec
« l'IA », et toi (en coulisses, avec un code d'accès) tu réponds à sa place — en texte,
en dessin, ou en laissant une vraie IA rédiger une suggestion que tu peux modifier.

Tout est gratuit. Il y a deux étapes : (1) créer la base de données gratuite qui relie
le visiteur et toi en temps réel, (2) mettre les fichiers en ligne.

---

## Étape 1 — Créer la base de données (Firebase, gratuit, ~5 min)

Le stockage `window.storage` ne fonctionne que dans les artefacts Claude — une fois
l'app hébergée toute seule, il lui faut sa propre base de données. Firebase (Google)
offre un plan gratuit largement suffisant pour ce projet.

1. Va sur https://console.firebase.google.com et connecte-toi avec un compte Google.
2. Clique **Ajouter un projet**, donne-lui un nom (ex: `regisseur-app`), continue jusqu'au bout.
3. Dans le menu de gauche : **Créer une base de données** → choisis **Firestore Database**.
4. Choisis **Mode production**, puis une région proche de toi.
5. Une fois créée, va dans l'onglet **Règles** de Firestore et remplace le contenu par :
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /conversations/{doc} {
         allow read, write: if true;
       }
     }
   }
   ```
   Clique **Publier**. ⚠️ Ces règles sont ouvertes (pas d'authentification) — parfait
   pour un petit projet perso, mais n'importe qui connaissant l'URL pourrait
   techniquement lire ou modifier les conversations. Ne mets rien de confidentiel dedans.
6. Retourne dans **Paramètres du projet** (icône ⚙️ en haut à gauche) → onglet **Général**
   → section **Vos applications** → clique l'icône `</>` (Web) → donne un surnom → **Enregistrer**.
7. Firebase t'affiche un bloc `firebaseConfig = { apiKey: "...", ... }`. Copie-le.
8. Ouvre `index.html` dans ce dossier, trouve la section tout en haut du `<script>` :
   ```js
   const firebaseConfig = {
     apiKey: "COLLE_TA_CLE_ICI",
     ...
   };
   ```
   et remplace-la entièrement par celle que Firebase vient de te donner.

C'est fait — le chat en temps réel fonctionnera dès la mise en ligne.

---

## Étape 2 — Mettre l'app en ligne (Vercel, gratuit)

Vercel héberge le site **et** fait tourner la fonction qui permet le bouton
« ✨ suggérer avec l'IA » sans jamais exposer de clé API dans le navigateur.

1. Va sur https://vercel.com et crée un compte gratuit (avec GitHub, c'est le plus simple).
2. Mets ce dossier (`regisseur-pwa`) dans un nouveau dépôt GitHub :
   - Crée un nouveau repo sur https://github.com/new
   - Depuis ce dossier sur ton ordinateur : `git init`, `git add .`, `git commit -m "premier envoi"`,
     puis suis les instructions de GitHub pour le lier et faire `git push`.
   - *(Alternative sans ligne de commande : sur la page du repo GitHub, utilise
     "Add file → Upload files" et glisse tous les fichiers du dossier.)*
3. Sur Vercel : **Add New → Project**, choisis ton repo GitHub, clique **Import**, puis **Deploy**
   (aucune configuration à changer, Vercel détecte tout seul).
4. Une fois déployé, va dans **Settings → Environment Variables** de ton projet Vercel et ajoute :
   - Nom : `ANTHROPIC_API_KEY`
   - Valeur : ta clé API Anthropic, à créer sur https://console.anthropic.com/settings/keys
     (compte séparé de Claude.ai, facturé à l'usage — quelques suggestions de réponse
     coûtent une fraction de centime).
   - Redéploie ensuite (**Deployments → ⋯ → Redeploy**) pour que la variable soit prise en compte.
5. Vercel te donne un lien du type `regisseur-app.vercel.app` — c'est ton app, en ligne, gratuite.

Sans la clé API à l'étape 4, tout le reste marche normalement — seul le bouton
« suggérer avec l'IA » affichera une erreur (tu peux toujours répondre toi-même ou dessiner).

---

## Installer l'app sur un téléphone (PWA)

Ouvre le lien Vercel dans le navigateur du téléphone :
- **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil »
- **Android (Chrome)** : menu ⋮ → « Ajouter à l'écran d'accueil » / « Installer l'application »

L'icône apparaît comme une vraie appli, en plein écran.

---

## Fichiers du projet

| Fichier | Rôle |
|---|---|
| `index.html` | Toute l'application (interface + logique) |
| `manifest.json` | Nom, icônes et couleurs de l'app installée |
| `sw.js` | Service worker (installabilité + un peu de cache hors-ligne) |
| `icons/` | Icônes 192×192 et 512×512 |
| `api/suggest.js` | Fonction serverless Vercel pour la suggestion IA (clé API cachée) |

## Personnaliser

- Changer le code d'accès des coulisses : variable `OPERATOR_PASSCODE` en haut du `<script>` dans `index.html`.
- Changer les couleurs / le nom de l'app : variables CSS en haut de `index.html`, et `manifest.json`.
