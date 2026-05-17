import { useState, useEffect } from "react";
import { Target, Zap, RefreshCw, AlertCircle, Star, ChevronDown, Search, Calendar, Wifi, WifiOff, ArrowLeft, BarChart2, Shield, TrendingUp, Activity, Award } from "lucide-react";

const LEAGUES = [
  { name: "Premier League",     id: "4328", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "La Liga",            id: "4335", flag: "🇪🇸" },
  { name: "Bundesliga",         id: "4331", flag: "🇩🇪" },
  { name: "Serie A",            id: "4332", flag: "🇮🇹" },
  { name: "Ligue 1",            id: "4334", flag: "🇫🇷" },
  { name: "Champions League",   id: "4480", flag: "🌟" },
  { name: "Europa League",      id: "4481", flag: "🏆" },
  { name: "MLS",                id: "4346", flag: "🇺🇸" },
  { name: "Eredivisie",         id: "4337", flag: "🇳🇱" },
  { name: "Primeira Liga",      id: "4344", flag: "🇵🇹" },
  { name: "Scottish Prem",      id: "4330", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { name: "Super Lig",          id: "4965", flag: "🇹🇷" },
  { name: "Saudi Pro League",   id: "4693", flag: "🇸🇦" },
  { name: "Argentine Primera",  id: "4406", flag: "🇦🇷" },
  { name: "Brazilian Série A",  id: "4351", flag: "🇧🇷" },
  { name: "A-League",           id: "4356", flag: "🇦🇺" },
  { name: "NPFL",               id: "4857", flag: "🇳🇬" },
];

function ConfBar({ v, color = "#00e676" }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 6, height: 7, overflow: "hidden", width: "100%" }}>
      <div style={{ width: `${v}%`, height: "100%", borderRadius: 6, background: v >= 70 ? "#00e676" : v >= 50 ? "#ffb300" : "#ff5252", transition: "width 1.2s ease" }} />
    </div>
  );
}

function PredBadge({ label, pct, odds, rec }) {
  const isGood = rec === "Recommended" || rec === "Value Bet" || rec === "Safe";
  const isOk = rec === "Value";
  const col = isGood ? "#00e676" : isOk ? "#ffb300" : "rgba(255,255,255,0.3)";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 12px", borderRadius: 10, marginBottom: 7,
      background: isGood ? "rgba(0,230,118,0.07)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${isGood ? "rgba(0,230,118,0.25)" : "rgba(255,255,255,0.06)"}`
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 1 }}>
          {pct}% · <span style={{ color: "#ffb300" }}>{odds}</span>
        </div>
      </div>
      {rec && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${col}22`, color: col, border: `1px solid ${col}44`, whiteSpace: "nowrap" }}>{rec}</span>}
    </div>
  );
}

function MarketCard({ title, icon, children, accent = "#00e676" }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.09)`, borderTop: `3px solid ${accent}`, borderRadius: 14, padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <span style={{ color: accent }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function FootballBot() {
  const [step, setStep] = useState("league"); // league | matches | predict | result
  const [league, setLeague] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [loadingFix, setLoadingFix] = useState(false);
  const [fixError, setFixError] = useState("");
  const [selected, setSelected] = useState(null);
  const [extra, setExtra] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [result, setResult] = useState(null);
  const [aiError, setAiError] = useState("");
  const [search, setSearch] = useState("");
  const [apiKey, setApiKey] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const fetchFixtures = async (lg) => {
    setLoadingFix(true); 
    setFixError(""); 
    setFixtures([]);

    const urls = [
      `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${lg.id}`,
      `https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${lg.id}`,
    ];

    let found = [];
    
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        
        const data = await res.json();
        if (data && data.events && data.events.length > 0) {
          const mapped = data.events.map(e => ({
            id: e.idEvent,
            home: e.strHomeTeam,
            away: e.strAwayTeam,
            date: e.dateEvent,
            time: e.strTime ? e.strTime.substring(0, 5) : "TBD",
            homeScore: e.intHomeScore,
            awayScore: e.intAwayScore,
            status: e.strStatus || "Not Started",
            venue: e.strVenue || "",
            thumb: e.strThumb || "",
          }));
          found = [...found, ...mapped];
        }
      } catch (err) {
        console.error("API error for endpoint:", url, err);
      }
    }

    if (found.length > 0) {
      // Clean duplicates by event ID
      const uniqueFixtures = Object.values(
        found.reduce((acc, current) => ({ ...acc, [current.id]: current }), {})
      );
      setFixtures(uniqueFixtures.slice(0, 20));
    } else {
      setFixError("No live fixtures returned from the API tier right now. Use manual entry below to bypass!");
    }
    setLoadingFix(false);
  };

  const pickLeague = async (lg) => {
    setLeague(lg); setStep("matches"); setSelected(null); setResult(null);
    await fetchFixtures(lg);
  };

  const pickMatch = (fix) => {
    setSelected(fix); setStep("predict"); setResult(null); setAiError("");
  };

  const runAI = async () => {
    if (!selected?.home || !selected?.away) return;
    setAiError(""); 
    setLoadingAI(true); 
    setResult(null);

    if (!apiKey.trim()) {
      setAiError("Please type or paste your Anthropic API Key in the configurations bar first.");
      setLoadingAI(false);
      return;
    }

    const prompt = `You are the world's best football prediction analyst. Combine Poisson modelling, ELO ratings, xG analysis, and tactical intelligence.

MATCH: ${selected.home} vs ${selected.away}
COMPETITION: ${league?.name || "Unknown"}
DATE: ${selected.date}
VENUE: ${selected.venue || "Unknown"}
${extra ? `CONTEXT: ${extra}` : ""}

Return ONLY a raw JSON object, no markdown, no backticks, no prose:
{
  "matchOverview": "2-3 sentence expert overview of tactics and dynamics",
  "keyFactors": ["factor 1", "factor 2", "factor 3", "factor 4"],
  "predictions": {
    "result": {
      "homeWin": { "probability": 48, "odds": "2.10", "recommendation": "Value Bet" },
      "draw": { "probability": 26, "odds": "3.50", "recommendation": "Skip" },
      "awayWin": { "probability": 26, "odds": "3.60", "recommendation": "Skip" },
      "confidence": 74
    },
    "goals": {
      "over15": { "probability": 82, "odds": "1.35", "recommendation": "Safe" },
      "over25": { "probability": 61, "odds": "1.80", "recommendation": "Recommended" },
      "under25": { "probability": 39, "odds": "2.10", "recommendation": "Skip" },
      "over35": { "probability": 36, "odds": "2.50", "recommendation": "Value" },
      "confidence": 70
    },
    "btts": {
      "yes": { "probability": 57, "odds": "1.90", "recommendation": "Recommended" },
      "no": { "probability": 43, "odds": "2.00", "recommendation": "Skip" },
      "confidence": 63
    },
    "correctScore": [
      { "score": "2-1", "probability": 13, "odds": "7.50" },
      { "score": "1-1", "probability": 11, "odds": "7.00" },
      { "score": "2-0", "probability": 10, "odds": "8.50" },
      { "score": "1-0", "probability": 9, "odds": "6.00" },
      { "score": "2-2", "probability": 7, "odds": "11.00" }
    ],
    "asianHandicap": {
      "line": "-0.5",
      "team": "${selected.home}",
      "probability": 54,
      "odds": "1.90",
      "recommendation": "Value Bet",
      "confidence": 66
    },
    "htft": { "selection": "Home/Home", "probability": 36, "odds": "2.90", "confidence": 58 },
    "corners": { "over85": { "probability": 60, "odds": "1.85", "recommendation": "Recommended" }, "confidence": 60 }
  },
  "topPick": {
    "market": "Match Result",
    "selection": "${selected.home} Win",
    "odds": "2.10",
    "confidence": 74,
    "reasoning": "Strong home advantage and attacking superiority make this the standout value play"
  },
  "accumulator": {
    "legs": [
      { "market": "Result", "pick": "${selected.home} Win", "odds": "2.10" },
      { "market": "Goals", "pick": "Over 2.5", "odds": "1.80" },
      { "market": "BTTS", "pick": "Yes", "odds": "1.90" }
    ],
    "totalOdds": "7.18",
    "confidence": 48
  },
  "riskLevel": "Medium",
  "valueRating": 8,
  "analystNote": "One key caution or insight for the bettor"
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerously-allow-browser": "true"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const raw = data.content.map(i => i.text || "").join("");
      const cleanJsonString = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJsonString);
      
      setResult(parsed);
      setStep("result");
    } catch (err) {
      console.error("Analysis Exception Details:", err);
      setAiError(`Analysis Failed: ${err.message || "Ensure your API key is correct and CORS restrictions are managed."}`);
    } finally {
      setLoadingAI(false);
    }
  };

  const riskCol = r => r === "Low" ? "#00e676" : r === "Medium" ? "#ffb300" : "#ff5252";
  const filteredLeagues = LEAGUES.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  const fmtDate = d => {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }
    catch { return d; }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080f0b", color: "#fff", fontFamily: "'Syne', 'Space Grotesk', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#0d1f15", borderBottom: "1px solid rgba(0,230,118,0.18)", padding: "1rem 1.25rem", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          {step !== "league" && (
            <button onClick={() => { setStep(step === "result" || step === "predict" ? "matches" : "league"); setResult(null); }}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#00e676", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Target size={19} color="#000" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>
                PredictPro <span style={{ color: "#00e676" }}>AI</span>
              </div>
              <div style={{ fontSize: 10, color: "#00c853", letterSpacing: "0.12em", textTransform: "uppercase" }}>SportyBet Edition · Live Fixtures</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#00e676", background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)", borderRadius: 20, padding: "4px 10px" }}>
            <Wifi size={12} /> TheSportsDB Live
          </div>
        </div>
        
        {/* Breadcrumb */}
        <div style={{ maxWidth: 860, margin: "8px auto 0", display: "flex", gap: 6, alignItems: "center" }}>
          {["Select League", "Pick Match", "Analyse", "Results"].map((s, i) => {
            const steps = ["league","matches","predict","result"];
            const cur = steps.indexOf(step);
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", fontSize: 10, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: i <= cur ? "#00e676" : "rgba(255,255,255,0.08)",
                    color: i <= cur ? "#000" : "#555"
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 11, color: i === cur ? "#00e676" : i < cur ? "#666" : "#444", fontWeight: i === cur ? 700 : 400 }}>{s}</span>
                </div>
                {i < 3 && <span style={{ color: "#333", fontSize: 11 }}>›</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Secret Configs Panel Bar */}
      <div style={{ maxWidth: 860, margin: "10px auto 0", padding: "0 1.25rem" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#666", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Anthropic Key:</span>
          <input 
            type="password" 
            value={apiKey} 
            onChange={e => setApiKey(e.target.value)} 
            placeholder="Paste your secret sk-ant-... key here" 
            style={{ flex: 1, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 12, outline: "none", fontFamily: "monospace" }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.25rem" }}>

        {/* ── STEP 1: LEAGUE SELECTION ── */}
        {step === "league" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 22, marginBottom: 6 }}>Choose a League</div>
              <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Live fixtures load automatically from TheSportsDB — like a market feed.</p>
            </div>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search size={15} color="#555" style={{ position: "absolute", left: 12, top: 11 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leagues..."
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px 10px 34px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {filteredLeagues.map(lg => (
                <button key={lg.id + lg.name} onClick={() => pickLeague(lg)}
                  style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s", color: "#fff", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 10
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,230,118,0.4)"; e.currentTarget.style.background = "rgba(0,230,118,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                  <span style={{ fontSize: 22 }}>{lg.flag}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{lg.name}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>Tap to load fixtures →</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: FIXTURE SELECTION ── */}
        {step === "matches" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 20 }}>
                  {league?.flag} {league?.name}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>Upcoming fixtures from TheSportsDB — tap a match to analyse</div>
              </div>
              <button onClick={() => fetchFixtures(league)}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px", color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontFamily: "inherit" }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {loadingFix && (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <RefreshCw size={28} color="#00e676" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
                <div style={{ color: "#666", fontSize: 13 }}>Fetching live fixtures from TheSportsDB...</div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {fixError && (
              <div style={{ background: "rgba(255,82,82,0.08)", border: "1px solid rgba(255,82,82,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#ff5252", marginBottom: 12 }}>
                  <WifiOff size={16} /> <strong>No fixtures found</strong>
                </div>
                <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 12px" }}>{fixError}</p>
                <div style={{ fontSize: 12, color: "#666" }}>Use manual entry below instead:</div>
                <ManualEntry onSubmit={(home, away) => { setSelected({ home, away, date: today, time: "", status: "Manual", venue: "" }); setStep("predict"); }} />
              </div>
            )}

            {!loadingFix && fixtures.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {fixtures.map((fix, i) => (
                  <button key={fix.id || i} onClick={() => pickMatch(fix)}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14, padding: "14px 18px", cursor: "pointer", textAlign: "left",
                      color: "#fff", fontFamily: "inherit", transition: "all 0.15s", boxSizing: "border-box"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,230,118,0.4)"; e.currentTarget.style.background = "rgba(0,230,118,0.05)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                        <div style={{ textAlign: "center", minWidth: 80 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{fix.home}</div>
                          <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>HOME</div>
                        </div>
                        <div style={{ textAlign: "center", flex: 1 }}>
                          {fix.homeScore != null && fix.awayScore != null ? (
                            <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 18, color: "#00e676" }}>
                              {fix.homeScore} – {fix.awayScore}
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: "#ffb300", fontWeight: 600 }}>VS</div>
                          )}
                          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{fmtDate(fix.date)} {fix.time}</div>
                        </div>
                        <div style={{ textAlign: "center", minWidth: 80 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{fix.away}</div>
                          <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>AWAY</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginLeft: 16 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(0,230,118,0.1)", color: "#00e676", border: "1px solid rgba(0,230,118,0.2)", fontWeight: 600 }}>
                          {fix.status === "Not Started" || !fix.status ? "Upcoming" : fix.status}
                        </span>
                        <span style={{ fontSize: 10, color: "#555" }}>Tap to predict →</span>
                      </div>
                    </div>
                    {fix.venue ? <div style={{ fontSize: 10, color: "#444", marginTop: 8 }}>📍 {fix.venue}</div> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: PREDICT ── */}
        {step === "predict" && selected && (
          <div>
            <div style={{ background: "#0d2318", border: "1px solid rgba(0,230,118,0.25)", borderRadius: 18, padding: "1.5rem", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#00e676", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>
                {league?.name || "Manual Entry"} · {fmtDate(selected.date)}
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 22 }}>{selected.home}</div>
                  <div style={{ fontSize: 11, color: "#00e676", marginTop: 2 }}>HOME</div>
                </div>
                <div style={{ padding: "8px 18px", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: 30, fontWeight: 800, fontSize: 15, color: "#00e676" }}>VS</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 22 }}>{selected.away}</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>AWAY</div>
                </div>
              </div>
              {selected.venue && <div style={{ fontSize: 12, color: "#444", marginTop: 12 }}>📍 {selected.venue}</div>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>
                Optional context (injuries, H2H, weather, recent form...)
              </label>
              <input value={extra} onChange={e => setExtra(e.target.value)} placeholder="e.g. Home striker injured, 4 of last 5 H2H went Over 2.5..."
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>

            {aiError && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#ff5252", fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(255,82,82,0.1)", borderRadius: 8, border: "1px solid rgba(255,82,82,0.2)" }}>
                <AlertCircle size={15} /> {aiError}
              </div>
            )}

            <button onClick={runAI} disabled={loadingAI}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: loadingAI ? "rgba(0,230,118,0.3)" : "#00e676", color: loadingAI ? "rgba(0,0,0,0.4)" : "#000", fontWeight: 800, fontSize: 15, cursor: loadingAI ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loadingAI ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Running AI Analysis...</> : <><Zap size={16} /> Generate Full Prediction</>}
            </button>
          </div>
        )}

        {/* ── STEP 4: RESULTS ── */}
        {step === "result" && result && selected && (
          <div>
            {/* Match banner */}
            <div style={{ background: "#0d2318", border: "1px solid rgba(0,230,118,0.25)", borderRadius: 18, padding: "1.25rem", marginBottom: 14, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#00e676", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
                {league?.flag} {league?.name || "Custom Analysis"} · AI Match Report
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 20 }}>{selected.home}</div>
                  <div style={{ fontSize: 10, color: "#00e676" }}>HOME</div>
                </div>
                <div style={{ padding: "6px 16px", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: 30, fontWeight: 800, color: "#00e676", fontSize: 14 }}>VS</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 20 }}>{selected.away}</div>
                  <div style={{ fontSize: 10, color: "#aaa" }}>AWAY</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#999", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 12px" }}>{result.matchOverview}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${riskCol(result.riskLevel)}22`, color: riskCol(result.riskLevel), border: `1px solid ${riskCol(result.riskLevel)}44` }}>Risk: {result.riskLevel}</span>
                <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(255,179,0,0.15)", color: "#ffb300", border: "1px solid rgba(255,179,0,0.3)" }}>⭐ Value: {result.valueRating}/10</span>
              </div>
            </div>

            {/* Top pick */}
            {result.topPick && (
              <div style={{ background: "rgba(0,230,118,0.08)", border: "2px solid rgba(0,230,118,0.35)", borderRadius: 14, padding: "1.25rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "#00e676", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Star size={22} color="#000" fill="#000" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#00e676", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>🎯 Top Pick</div>
                  <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 17 }}>
                    {result.topPick.selection}
                    <span style={{ color: "#ffb300", marginLeft: 8 }}>@ {result.topPick.odds}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{result.topPick.market} · {result.topPick.reasoning}</div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 26, color: "#00e676" }}>{result.topPick.confidence}%</div>
                  <div style={{ fontSize: 10, color: "#00e676", textTransform: "uppercase", letterSpacing: "0.1em" }}>Confidence</div>
                  <div style={{ marginTop: 5, width: 70 }}><ConfBar v={result.topPick.confidence} /></div>
                </div>
              </div>
            )}

            {/* Key factors */}
            {result.keyFactors?.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1rem", marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>📊 Key Factors</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                  {result.keyFactors.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 7, padding: "7px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                      <span style={{ color: "#00e676", fontSize: 13, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markets grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <MarketCard title="Match Result" icon={<Shield size={14} />} accent="#00e676">
                <PredBadge label={`${selected.home} Win`} pct={result.predictions.result.homeWin.probability} odds={result.predictions.result.homeWin.odds} rec={result.predictions.result.homeWin.recommendation} />
                <PredBadge label="Draw" pct={result.predictions.result.draw.probability} odds={result.predictions.result.draw.odds} rec={result.predictions.result.draw.recommendation} />
                <PredBadge label={`${selected.away} Win`} pct={result.predictions.result.awayWin.probability} odds={result.predictions.result.awayWin.odds} rec={result.predictions.result.awayWin.recommendation} />
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>Confidence</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#00e676" }}>{result.predictions.result.confidence}%</span>
                  </div>
                  <ConfBar v={result.predictions.result.confidence} />
                </div>
              </MarketCard>

              <MarketCard title="Goals Market" icon={<TrendingUp size={14} />} accent="#ffb300">
                {result.predictions.goals.over15 && <PredBadge label="Over 1.5" pct={result.predictions.goals.over15.probability} odds={result.predictions.goals.over15.odds} rec={result.predictions.goals.over15.recommendation} />}
                <PredBadge label="Over 2.5" pct={result.predictions.goals.over25.probability} odds={result.predictions.goals.over25.odds} rec={result.predictions.goals.over25.recommendation} />
                <PredBadge label="Under 2.5" pct={result.predictions.goals.under25.probability} odds={result.predictions.goals.under25.odds} rec={result.predictions.goals.under25.recommendation} />
                <PredBadge label="Over 3.5" pct={result.predictions.goals.over35.probability} odds={result.predictions.goals.over35.odds} rec={result.predictions.goals.over35.recommendation} />
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>Confidence</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#ffb300" }}>{result.predictions.goals.confidence}%</span>
                  </div>
                  <ConfBar v={result.predictions.goals.confidence} />
                </div>
              </MarketCard>

              <MarketCard title="Both Teams To Score" icon={<Activity size={14} />} accent="#7c4dff">
                <PredBadge label="BTTS — Yes" pct={result.predictions.btts.yes.probability} odds={result.predictions.btts.yes.odds} rec={result.predictions.btts.yes.recommendation} />
                <PredBadge label="BTTS — No" pct={result.predictions.btts.no.probability} odds={result.predictions.btts.no.odds} rec={result.predictions.btts.no.recommendation} />
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>Confidence</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#7c4dff" }}>{result.predictions.btts.confidence}%</span>
                  </div>
                  <ConfBar v={result.predictions.btts.confidence} />
                </div>
              </MarketCard>

              <MarketCard title="Asian Handicap" icon={<BarChart2 size={14} />} accent="#ff6b35">
                <div style={{ padding: "12px", background: "rgba(255,107,53,0.07)", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Best Line</div>
                  <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 18, color: "#ff6b35" }}>
                    {result.predictions.asianHandicap.team} {result.predictions.asianHandicap.line}
                  </div>
                  <div style={{ fontSize: 12, color: "#ffb300", fontWeight: 700, marginTop: 3 }}>@ {result.predictions.asianHandicap.odds}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{result.predictions.asianHandicap.probability}% · {result.predictions.asianHandicap.recommendation}</div>
                </div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 5 }}>Confidence: {result.predictions.asianHandicap.confidence}%</div>
                <ConfBar v={result.predictions.asianHandicap.confidence} />
              </MarketCard>
            </div>

            {/* Correct Score */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderTop: "3px solid #2979ff", borderRadius: 14, padding: "1rem", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <span style={{ color: "#2979ff" }}><Target size={14} /></span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888" }}>Correct Score</span>
              </div>
              {result.predictions.correctScore.map((cs, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, minWidth: 38 }}>{cs.score}</span>
                  <div style={{ flex: 1 }}><ConfBar v={cs.probability * 5} /></div>
                  <span style={{ fontSize: 11, color: "#666", minWidth: 28 }}>{cs.probability}%</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ffb300", minWidth: 40, textAlign: "right" }}>{cs.odds}</span>
                </div>
              ))}
            </div>

            {/* HT/FT + Corners */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderTop: "3px solid #e91e63", borderRadius: 14, padding: "1rem" }}>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>HT / FT</div>
                <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 19, color: "#e91e63", marginBottom: 8 }}>{result.predictions.htft?.selection}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 10 }}>
                  {result.predictions.htft?.probability}% · <span style={{ color: "#ffb300" }}>{result.predictions.htft?.odds}</span>
                </div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 5 }}>Confidence: {result.predictions.htft?.confidence}%</div>
                <ConfBar v={result.predictions.htft?.confidence || 0} />
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderTop: "3px solid #00bcd4", borderRadius: 14, padding: "1rem" }}>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Corners</div>
                {result.predictions.corners && (
                  <>
                    <PredBadge label="Over 8.5 Corners" pct={result.predictions.corners.over85.probability} odds={result.predictions.corners.over85.odds} rec={result.predictions.corners.over85.recommendation} />
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 5 }}>Confidence: {result.predictions.corners.confidence}%</div>
                    <ConfBar v={result.predictions.corners.confidence} />
                  </>
                )}
              </div>
            </div>

            {/* Accumulator */}
            {result.accumulator && (
              <div style={{ background: "rgba(255,179,0,0.07)", border: "1px solid rgba(255,179,0,0.25)", borderRadius: 14, padding: "1.25rem", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Award size={16} color="#ffb300" />
                    <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ffb300" }}>AI Accumulator</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 20, color: "#ffb300" }}>@ {result.accumulator.totalOdds}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>Combined odds</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                  {result.accumulator.legs.map((leg, i) => (
                    <div key={i} style={{ padding: "7px 12px", background: "rgba(255,179,0,0.1)", border: "1px solid rgba(255,179,0,0.2)", borderRadius: 25 }}>
                      <div style={{ fontSize: 10, color: "#888" }}>{leg.market}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{leg.pick} <span style={{ color: "#ffb300" }}>@ {leg.odds}</span></div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Acca confidence: {result.accumulator.confidence}%</div>
                <ConfBar v={result.accumulator.confidence} />
              </div>
            )}

            {/* Analyst note */}
            {result.analystNote && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,82,82,0.05)", border: "1px solid rgba(255,82,82,0.18)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <AlertCircle size={14} color="#ff5252" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
                  <b style={{ color: "#ff5252" }}>Analyst Note: </b>{result.analystNote}
                </div>
              </div>
            )}

            <div style={{ fontSize: 10, color: "#333", textAlign: "center", lineHeight: 1.6, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              ⚠️ AI statistical predictions only — not guaranteed. Gamble responsibly. 18+
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ManualEntry({ onSubmit }) {
  const [h, setH] = useState(""); 
  const [a, setA] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      <input value={h} onChange={e => setH(e.target.value)} placeholder="Home team"
        style={{ flex: 1, minWidth: 120, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
      <input value={a} onChange={e => setA(e.target.value)} placeholder="Away team"
        style={{ flex: 1, minWidth: 120, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
      <button onClick={() => { if (h && a) onSubmit(h, a); }}
        style={{ padding: "8px 16px", background: "#00e676", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
        Use →
      </button>
    </div>
  );
}