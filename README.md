# Régisseur — le chat IA que tu joues toi-même

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
9. Toujours dans la console Firebase, va dans **Authentication** (menu de gauche) → **Get started** →
   onglet **Sign-in method** → clique **E-mail/Mot de passe** → active le premier interrupteur → **Enregistrer**.
   C'est ce qui permet aux visiteurs de créer un compte avec e-mail + mot de passe.

C'est fait — le chat en temps réel et les comptes fonctionneront dès la mise en ligne.

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
   - Nom : `GEMINI_API_KEY`
   - Valeur : ta clé API Gemini, **gratuite** — va sur https://aistudio.google.com/apikey,
     connecte-toi avec un compte Google, clique "Create API key". Pas de carte bancaire
     à enregistrer, le plan gratuit de Gemini suffit largement pour ce bouton de suggestion.
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

## Ce qui a changé par rapport à l'ancienne version

- **Comptes réels** : à l'ouverture, l'app demande de créer un compte (pseudo, e-mail,
  téléphone optionnel, mot de passe) ou de se connecter — plus besoin de rejouer la
  création à chaque visite, la session reste ouverte.
- **Centre d'aide** : petit lien en bas de l'écran de connexion et du chat. Il regroupe
  plusieurs options (FAQ, signaler un bug — fonctionnel, contacter le support, conditions,
  confidentialité, déconnexion) et, discrètement, **« Accès équipe »** qui redemande le
  code opérateur pour retrouver la régie.
- **Notifications** : un petit bandeau propose d'activer les notifications, côté visiteur
  et côté régie. Depuis l'étape ci-dessous, ce sont de **vraies notifications push** —
  reçues même si l'app est complètement fermée, comme une vraie appli.

---

## Étape 3 — Activer les vraies notifications push (optionnel)

Sans cette étape, l'app fonctionne quand même : le bouton "Activer" demandera juste la
permission du navigateur, mais aucune alerte ne sera réellement envoyée. Cette étape
ajoute la pièce qui manque : un petit serveur qui envoie le push au bon moment.

### 3.1 — Récupérer une clé VAPID (identifie ton app auprès des navigateurs)

1. Dans la console Firebase, va dans **Paramètres du projet** (⚙️) → onglet **Cloud Messaging**.
2. Descends jusqu'à **"Web Push certificates"** (Certificats Web Push). Clique **"Générer une paire de clés"**.
3. Copie la longue chaîne affichée (elle commence souvent par `B...`).
4. Dans `index.html`, trouve la ligne :
   ```js
   const VAPID_KEY = "COLLE_TA_CLE_VAPID_ICI";
   ```
   et remplace `"COLLE_TA_CLE_VAPID_ICI"` par la clé copiée.

### 3.2 — Copier la config Firebase dans le service worker aussi

Le fichier `sw.js` a besoin de la **même** config que `index.html` (il tourne en
arrière-plan, séparément de la page). Ouvre `sw.js`, trouve le bloc `FIREBASE_CONFIG`
tout en haut, et remplace-le par la même config Firebase que celle collée dans
`index.html` à l'étape 1.

### 3.3 — Créer une clé de compte de service (pour envoyer les push depuis le serveur)

1. Console Firebase → **Paramètres du projet** (⚙️) → onglet **Comptes de service**.
2. Clique **"Générer une nouvelle clé privée"** → confirme. Un fichier `.json` se télécharge
   (garde-le précieusement, il donne un accès complet à ton projet — ne le partage jamais,
   ne le mets jamais sur GitHub).
3. Il faut le transformer en une seule ligne de texte (base64) pour Vercel :
   - **Mac/Linux (Terminal)** :
     ```
     base64 -i chemin/vers/le-fichier.json | tr -d '\n'
     ```
   - **Windows (PowerShell)** :
     ```
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("chemin\vers\le-fichier.json"))
     ```
   Ça affiche un long texte — copie-le en entier.

### 3.4 — Ajouter la variable sur Vercel

1. Sur vercel.com, ouvre ton projet → **Settings** → **Environment Variables**.
2. Nom : `FIREBASE_SERVICE_ACCOUNT_BASE64`, Valeur : le long texte copié à l'étape 3.3.
3. **Save**, puis **Deployments** → ⋯ → **Redeploy**.

### 3.5 — Autoriser la nouvelle collection dans les règles Firestore

Retourne dans Firestore → **Règles**, et remplace tout le bloc par celui-ci (il ajoute
l'autorisation pour la collection qui stocke les appareils de la régie) :
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{doc} {
      allow read, write: if true;
    }
    match /operatorTokens/{doc} {
      allow read, write: if true;
    }
    match /bugreports/{doc} {
      allow read, write: if true;
    }
  }
}
```
Clique **Publier**.

C'est fait : renvoie tes fichiers modifiés sur GitHub (`index.html`, `sw.js`, `package.json`,
`api/notify.js`), Vercel redéploie tout seul, et les notifications deviennent réelles.

## Fichiers du projet

| Fichier | Rôle |
|---|---|
| `index.html` | Toute l'application (interface + logique) |
| `manifest.json` | Nom, icônes et couleurs de l'app installée |
| `sw.js` | Service worker (installabilité, cache hors-ligne, réception des notifications push) |
| `icons/` | Icônes 192×192 et 512×512 |
| `api/suggest.js` | Fonction serverless Vercel pour la suggestion IA (clé API cachée) |
| `api/notify.js` | Fonction serverless Vercel qui envoie les vraies notifications push |
| `package.json` | Liste les dépendances (firebase-admin) pour Vercel |

## Personnaliser

- Changer le code d'accès des coulisses : variable `OPERATOR_PASSCODE` en haut du `<script>` dans `index.html`.
- Changer les couleurs / le nom de l'app : variables CSS en haut de `index.html`, et `manifest.json`.
