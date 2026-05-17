import { useState } from "react";
import { Target, Zap, RefreshCw, AlertCircle, Star, ChevronDown, Search, ArrowLeft, BarChart2, Shield, TrendingUp, Activity, Award } from "lucide-react";

export default function FootballBot() {
  const [step, setStep] = useState("predict");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [extra, setExtra] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [result, setResult] = useState(null);
  const [aiError, setAiError] = useState("");

  const runAI = async () => {
    if (!homeTeam.trim() || !awayTeam.trim()) {
      setAiError("Please input both a Home team and an Away team label first.");
      return;
    }
    setAiError(""); 
    setLoadingAI(true); 
    setResult(null);

    // Fixed prompt formatting parameters to map perfectly with your frontend input values
    const prompt = `You are the world's best football prediction analyst. Combine Poisson modelling, ELO ratings, xG analysis, and tactical intelligence.

MATCH: ${homeTeam} vs ${awayTeam}
COMPETITION: Custom Match Analysis
DATE: Live Analysis
VENUE: Standard Venue
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
      "team": "${homeTeam}",
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
    "selection": "${homeTeam} Win",
    "odds": "2.10",
    "confidence": 74,
    "reasoning": "Strong home advantage and attacking superiority make this the standout value play"
  },
  "accumulator": {
    "legs": [
      { "market": "Result", "pick": "${homeTeam} Win", "odds": "2.10" },
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
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "predict", prompt: prompt })
      });

      if (!res.ok) throw new Error("Cloud function payload validation failed.");

      const data = await res.json();
      const raw = data.content.map(i => i.text || "").join("");
      const cleanJsonString = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJsonString);
      
      setResult(parsed);
      setStep("result");
    } catch (err) {
      setAiError("Analysis compilation failed. Ensure Vercel system configuration credentials match.");
    } finally {
      setLoadingAI(false);
    }
  };

  const riskCol = r => r === "Low" ? "#00e676" : r === "Medium" ? "#ffb300" : "#ff5252";

  return (
    <div style={{ minHeight: "100vh", background: "#080f0b", color: "#fff", fontFamily: "'Syne', 'Space Grotesk', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ background: "#0d1f15", borderBottom: "1px solid rgba(0,230,118,0.18)", padding: "1rem 1.25rem", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          {step === "result" && (
            <button onClick={() => { setStep("predict"); setResult(null); }}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> Analyze New Match
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
              <div style={{ fontSize: 10, color: "#00c853", letterSpacing: "0.12em", textTransform: "uppercase" }}>SportyBet Edition · Premium Core</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.25rem" }}>
        {step === "predict" && (
          <div>
            <div style={{ background: "#0d2318", border: "1px solid rgba(0,230,118,0.25)", borderRadius: 18, padding: "1.5rem", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#00e676", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14, textAlign: "center" }}>
                Enter Matchup Details
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input value={homeTeam} onChange={e => setHomeTeam(e.target.value)} placeholder="Home Team Name (e.g. Real Madrid)"
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                <div style={{ textAlign: "center", fontWeight: 800, color: "#00e676" }}>VS</div>
                <input value={awayTeam} onChange={e => setAwayTeam(e.target.value)} placeholder="Away Team Name (e.g. Barcelona)"
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>
                Optional Match Context (Injuries, Head-to-Head form, weather...)
              </label>
              <input value={extra} onChange={e => setExtra(e.target.value)} placeholder="e.g. Home striker returns from injury, hot weather conditions..."
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            {aiError && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#ff5252", fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "rgba(255,82,82,0.1)", borderRadius: 8, border: "1px solid rgba(255,82,82,0.2)" }}>
                <AlertCircle size={15} /> {aiError}
              </div>
            )}

            <button onClick={runAI} disabled={loadingAI}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: loadingAI ? "rgba(0,230,118,0.3)" : "#00e676", color: loadingAI ? "rgba(0,0,0,0.4)" : "#000", fontWeight: 800, fontSize: 15, cursor: loadingAI ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loadingAI ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating AI Analytics Master Sheet...</> : <><Zap size={16} /> Generate Full Prediction</>}
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </button>
          </div>
        )}

        {step === "result" && result && (
          <div>
            <div style={{ background: "#0d2318", border: "1px solid rgba(0,230,118,0.25)", borderRadius: 18, padding: "1.25rem", marginBottom: 14, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#00e676", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
                AI Pro Analysis Report
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 20 }}>{homeTeam}</div>
                  <div style={{ fontSize: 10, color: "#00e676" }}>HOME</div>
                </div>
                <div style={{ padding: "6px 16px", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: 30, fontWeight: 800, color: "#00e676", fontSize: 14 }}>VS</div>
                <div>
                  <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 20 }}>{awayTeam}</div>
                  <div style={{ fontSize: 10, color: "#aaa" }}>AWAY</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#999", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 12px" }}>{result.matchOverview}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${riskCol(result.riskLevel)}22`, color: riskCol(result.riskLevel), border: `1px solid ${riskCol(result.riskLevel)}44` }}>Risk: {result.riskLevel}</span>
                <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(255,179,0,0.15)", color: "#ffb300", border: "1px solid rgba(255,179,0,0.3)" }}>⭐ Value: {result.valueRating}/10</span>
              </div>
            </div>

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
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 6, height: 7, width: 70, overflow: "hidden", marginTop: 5 }}>
                    <div style={{ width: `${result.topPick.confidence}%`, height: "100%", background: "#00e676" }} />
                  </div>
                </div>
              </div>
            )}

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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <MarketCard title="Match Result" icon={<Shield size={14} />} accent="#00e676">
                <PredBadge label={`${homeTeam} Win`} pct={result.predictions.result.homeWin.probability} odds={result.predictions.result.homeWin.odds} rec={result.predictions.result.homeWin.recommendation} />
                <PredBadge label="Draw" pct={result.predictions.result.draw.probability} odds={result.predictions.result.draw.odds} rec={result.predictions.result.draw.recommendation} />
                <PredBadge label={`${awayTeam} Win`} pct={result.predictions.result.awayWin.probability} odds={result.predictions.result.awayWin.odds} rec={result.predictions.result.awayWin.recommendation} />
              </MarketCard>

              <MarketCard title="Goals Market" icon={<TrendingUp size={14} />} accent="#ffb300">
                {result.predictions.goals.over15 && <PredBadge label="Over 1.5" pct={result.predictions.goals.over15.probability} odds={result.predictions.goals.over15.odds} rec={result.predictions.goals.over15.recommendation} />}
                <PredBadge label="Over 2.5" pct={result.predictions.goals.over25.probability} odds={result.predictions.goals.over25.odds} rec={result.predictions.goals.over25.recommendation} />
                <PredBadge label="Under 2.5" pct={result.predictions.goals.under25.probability} odds={result.predictions.goals.under25.odds} rec={result.predictions.goals.under25.recommendation} />
              </MarketCard>
            </div>

            {result.accumulator && (
              <div style={{ background: "rgba(255,179,0,0.07)", border: "1px solid rgba(255,179,0,0.25)", borderRadius: 14, padding: "1.25rem", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Award size={16} color="#ffb300" />
                    <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ffb300" }}>AI Accumulator</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Syne'", fontWeight: 800, fontSize: 20, color: "#ffb300" }}>@ {result.accumulator.totalOdds}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {result.accumulator.legs.map((leg, i) => (
                    <div key={i} style={{ padding: "7px 12px", background: "rgba(255,179,0,0.1)", border: "1px solid rgba(255,179,0,0.2)", borderRadius: 25 }}>
                      <div style={{ fontSize: 10, color: "#888" }}>{leg.market}</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{leg.pick} <span style={{ color: "#ffb300" }}>@ {leg.odds}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.analystNote && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,82,82,0.05)", border: "1px solid rgba(255,82,82,0.18)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <AlertCircle size={14} color="#ff5252" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
                  <b style={{ color: "#ff5252" }}>Analyst Note: </b>{result.analystNote}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
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

function PredBadge({ label, pct, odds, rec }) {
  const isGood = rec === "Recommended" || rec === "Value Bet" || rec === "Safe";
  const col = isGood ? "#00e676" : "rgba(255,255,255,0.3)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, marginBottom: 7, background: isGood ? "rgba(0,230,118,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${isGood ? "rgba(0,230,118,0.25)" : "rgba(255,255,255,0.06)"}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#666" }}>{pct}% · <span style={{ color: "#ffb300" }}>{odds}</span></div>
      </div>
      {rec && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${col}22`, color: col, border: `1px solid ${col}44` }}>{rec}</span>}
    </div>
  );
}
