// api/predict.js (Serverless Backend Route running on Vercel)

export default async function handler(req, res) {
  // 1. Handle CORS headers so your frontend can talk to your backend safely
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, leagueId, home, away, date, venue, extra, prompt } = req.body;

  // ──── CASE A: HANDLES THE FIXTURES ENGINE ────
  if (type === 'fixtures') {
    try {
      const nextRes = await fetch(`https://www.thesportsdb.com/api/v1/json/2/eventsnextleague.php?id=${leagueId}`);
      const pastRes = await fetch(`https://www.thesportsdb.com/api/v1/json/2/eventspastleague.php?id=${leagueId}`);
      
      const nextData = await nextRes.json().catch(() => ({ events: [] }));
      const pastData = await pastRes.json().catch(() => ({ events: [] }));

      const combinedEvents = [...(nextData.events || []), ...(pastData.events || [])];
      return res.status(200).json({ events: combinedEvents });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch fixtures backend side", details: err.message });
    }
  }

  // ──── CASE B: HANDLES THE AI ANALYST ENGINE ────
  if (type === 'predict') {
    try {
      // Securely pulls your key from Vercel system dashboard safely away from public eyes
      const apiKey = process.env.VITE_ANTHROPIC_API_KEY; 
      
      if (!apiKey) {
        return res.status(500).json({ error: "Backend missing VITE_ANTHROPIC_API_KEY config variable." });
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: "Anthropic server handshake failed", details: err.message });
    }
  }

  return res.status(400).json({ error: "Invalid request type" });
}
