// Fonction serverless Vercel : /api/notify
// Envoie une vraie notification push (reçue même app fermée) via Firebase Cloud Messaging.
// Nécessite la variable d'environnement FIREBASE_SERVICE_ACCOUNT_BASE64 sur Vercel.
const admin = require('firebase-admin');

function getAdmin() {
  if (!admin.apps.length) {
    const json = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
    );
    admin.initializeApp({ credential: admin.credential.cert(json) });
  }
  return admin;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return res.status(500).json({ error: "Variable d'environnement FIREBASE_SERVICE_ACCOUNT_BASE64 manquante sur Vercel." });
  }
  try {
    const { tokens, title, body } = req.body;
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return res.status(200).json({ sent: 0 });
    }
    const a = getAdmin();
    const response = await a.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
    });
    res.status(200).json({ sent: response.successCount, failed: response.failureCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
