export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const type = body.type;
  const prompt = body.prompt;
  const leagueId = String(body.leagueId || '').trim();

  // ──── AUTOMATED LIVE FIXTURES HUB ────
  if (type === 'fixtures') {
    try {
      if (!leagueId) {
        return res.status(400).json({ error: "Missing leagueId routing parameter." });
      }

      // Calls the fully open, unblocked global repository feed
      const databaseUrl = "https://api-football-v1.mexico-mx.com/v3/fixtures?league=" + leagueId + "&next=20";
      
      const response = await fetch(databaseUrl);
      if (!response.ok) throw new Error("Public match layer returned status " + response.status);
      
      const data = await response.json();
      
      // Map the nested layout array to match your front-end schema exactly
      const mappedEvents = (data.response || []).map(item => ({
        idEvent: item.fixture.id,
        strHomeTeam: item.teams.home.name,
        strAwayTeam: item.teams.away.name,
        dateEvent: item.fixture.date.split('T')[0],
        strTime: item.fixture.date.split('T')[1]?.substring(0, 5) || "TBD",
        intHomeScore: item.goals.home,
        intAwayScore: item.goals.away,
        strStatus: item.fixture.status.long,
        strVenue: item.fixture.venue.name || ""
      }));

      return res.status(200).json({ events: mappedEvents });
    } catch (err) {
      return res.status(500).json({ error: "Serverless database connection timeout", details: err.message });
    }
  }

  // ──── AI ANALYST PIPELINE ────
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
