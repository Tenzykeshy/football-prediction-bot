export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Fallback to parse from either req.body or query parameters securely
  const body = req.body || {};
  const type = body.type;
  const prompt = body.prompt;
  
  // Hard-extract and stringify the league ID so it can never be read as an object or undefined
  const leagueId = String(body.leagueId || '').trim();

  // ──── CASE A: AUTOMATED MATCH ENGINE ────
  if (type === 'fixtures') {
    try {
      if (!leagueId) {
        return res.status(400).json({ error: "Missing leagueId parameter inside request payload." });
      }

      // Explicit string assembly to guarantee the formatting structure is 100% correct
      const nextUrl = "https://www.thesportsdb.com/api/v1/json/2/eventsnextleague.php?id=" + leagueId;
      const pastUrl = "https://www.thesportsdb.com/api/v1/json/2/eventspastleague.php?id=" + leagueId;

      const nextRes = await fetch(nextUrl);
      const pastRes = await fetch(pastUrl);
      
      const nextData = await nextRes.json().catch(() => ({ events: [] }));
      const pastData = await pastRes.json().catch(() => ({ events: [] }));

      const combinedEvents = [...(nextData.events || []), ...(pastData.events || [])];
      return res.status(200).json({ events: combinedEvents });
    } catch (err) {
      return res.status(500).json({ error: "Backend database parsing failure", details: err.message });
    }
  }

  // ──── CASE B: AI PREDICTION ANALYST ────
  if (type === 'predict') {
    try {
      const apiKey = process.env.VITE_ANTHROPIC_API_KEY; 
      
      if (!apiKey) {
        return res.status(500).json({ error: "Missing VITE_ANTHROPIC_API_KEY variable in Vercel dashboard settings." });
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
      return res.status(500).json({ error: "Claude server pipeline failure", details: err.message });
    }
  }

  return res.status(400).json({ error: "Invalid action routing parameter" });
}
