// Fonction serverless Vercel : /api/suggest
// Utilise l'API gratuite de Google Gemini (aistudio.google.com) au lieu d'une API payante.
// Garde la clé secrète côté serveur (variable d'environnement), jamais visible du visiteur.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Variable d'environnement GEMINI_API_KEY manquante sur Vercel." });
  }
  try {
    const { system, messages } = req.body;

    // Gemini attend un format un peu différent : role "model" au lieu de "assistant",
    // et le texte dans un tableau "parts".
    const contents = (messages || []).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { role: 'system', parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 500 },
      }),
    });
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || 'Erreur Gemini' });
    }

    // On reformate la réponse au même format que celui attendu côté navigateur
    // (data.content = tableau de blocs {text: ...}), pour ne rien changer dans index.html.
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
