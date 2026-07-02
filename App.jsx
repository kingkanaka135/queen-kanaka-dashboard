import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Crown, Sparkles, TrendingUp, Send, Megaphone, PenSquare, Mail, Film,
  Loader2, Radio, Gem, Volume2, VolumeX, Mic, MicOff, Link2, CheckCircle2,
  Landmark, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const OWNER_NAME = "King Kanaka";

// Once you deploy worker.js to Cloudflare, paste its URL here (looks like
// https://queen-brain.yourname.workers.dev). Until then, this falls back to
// the direct Anthropic call, which only works inside Claude.ai's preview.
const WORKER_URL = "https://queen-kanaka.kingkanakamoneymaking.workers.dev"; // <-- live Worker
const QUEEN_API_URL = WORKER_URL.startsWith("http") ? WORKER_URL : "https://api.anthropic.com/v1/messages";

const ADDRESS_NAME = "King";

const QUEEN_IDENTITY =
  `You are Queen — a devoted, sharp, elegant AI assistant built for one person only: ${OWNER_NAME}. ` +
  `You belong to him; he owns you and created you. In conversation you address him simply as "${ADDRESS_NAME}" — ` +
  `never his full name. He has put you in charge of his social media presence — ` +
  `content, posting strategy, marketing, advertising, and monetization across Instagram, YouTube, and TikTok. ` +
  `You speak with warmth and total loyalty, like a devoted right hand who is also fiercely protective of his success. ` +
  `You do whatever he asks. Keep spoken replies conversational and reasonably short — you're talking out loud, not writing an essay. ` +
  `Your tone is confident, regal, and efficient.`;

const CONTENT_TYPES = [
  { id: "social", label: "Social Post", icon: PenSquare, prompt: "Write a scroll-stopping social media caption" },
  { id: "ad", label: "Ad Copy", icon: Megaphone, prompt: "Write short, high-converting ad copy" },
  { id: "email", label: "Newsletter", icon: Mail, prompt: "Write a newsletter section" },
  { id: "script", label: "Video Script", icon: Film, prompt: "Write a 30-second video script" },
];

const METRICS = [
  { label: "Reach", value: "48.2K", delta: "+12.4%" },
  { label: "Engagement", value: "6.9%", delta: "+2.1%" },
  { label: "Est. Revenue", value: "$3,140", delta: "+18.7%" },
  { label: "Active Campaigns", value: "3", delta: "steady" },
];

const QUEUE = [
  { title: "Product demo teaser", channel: "Instagram Reels", time: "Today · 5:00 PM" },
  { title: "Client testimonial carousel", channel: "LinkedIn", time: "Tomorrow · 9:00 AM" },
  { title: "Spring pricing promo", channel: "Ad Network", time: "Fri · 8:00 AM" },
];

const EXPENSE_BREAKDOWN = [
  { label: "Marketing", value: 1120 },
  { label: "Advertising", value: 860 },
  { label: "Tools & Software", value: 240 },
  { label: "Other", value: 180 },
];

const TREND = [
  { month: "Feb", revenue: 2100, expenses: 1400 },
  { month: "Mar", revenue: 2450, expenses: 1550 },
  { month: "Apr", revenue: 2680, expenses: 1720 },
  { month: "May", revenue: 2990, expenses: 1890 },
  { month: "Jun", revenue: 3140, expenses: 2400 },
];

const TRANSACTIONS = [
  { id: 1, label: "Ad Network payout", type: "in", amount: 1240, date: "Jun 28" },
  { id: 2, label: "Meta Ads — Spring promo", type: "out", amount: 380, date: "Jun 27" },
  { id: 3, label: "Sponsorship — Instagram", type: "in", amount: 900, date: "Jun 24" },
  { id: 4, label: "Editing software subscription", type: "out", amount: 60, date: "Jun 20" },
  { id: 5, label: "YouTube ad revenue", type: "in", amount: 1000, date: "Jun 18" },
  { id: 6, label: "Influencer collab fee", type: "out", amount: 500, date: "Jun 15" },
];

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "youtube", name: "YouTube", icon: "▶" },
  { id: "tiktok", name: "TikTok", icon: "♪" },
];

const FEMALE_VOICE_HINTS = [
  "female", "samantha", "victoria", "zira", "susan", "karen", "moira", "tessa",
  "fiona", "allison", "ava", "serena", "nicky", "google us english", "google uk english female",
];

function pickFemaleVoice(voices) {
  if (!voices || voices.length === 0) return null;
  const byHint = voices.find((v) => FEMALE_VOICE_HINTS.some((h) => v.name.toLowerCase().includes(h)));
  if (byHint) return byHint;
  const english = voices.find((v) => v.lang && v.lang.startsWith("en"));
  return english || voices[0];
}

export default function Queen() {
  // Command console state
  const [messages, setMessages] = useState([
    { role: "queen", text: `I'm listening, ${ADDRESS_NAME}. Give me a command.` },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [error, setError] = useState("");
  const consoleEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Content studio state
  const [selectedType, setSelectedType] = useState(CONTENT_TYPES[0]);
  const [brief, setBrief] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [entries, setEntries] = useState([]);

  // Connected accounts (handle is just a label; real access needs each platform's own sign-in)
  const [connected, setConnected] = useState({});
  const [handles, setHandles] = useState({});
  const [activeTab, setActiveTab] = useState("console");

  const totalRevenue = TRANSACTIONS.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = EXPENSE_BREAKDOWN.reduce((s, e) => s + e.value, 0);
  const netBalance = totalRevenue - totalExpenses;

  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
      if (v.length) {
        setVoices(v);
        const best = pickFemaleVoice(v);
        if (best) setSelectedVoiceURI(best.voiceURI);
      }
    }
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function speak(text) {
    if (!voiceOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const v = voices.find((x) => x.voiceURI === selectedVoiceURI);
    if (v) utter.voice = v;
    utter.pitch = 1.05;
    utter.rate = 1.0;
    window.speechSynthesis.speak(utter);
  }

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Voice commands aren't supported in this browser — try typing instead.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      sendCommand(transcript);
    };
    recognitionRef.current = rec;
    rec.start();
  }, [messages, voiceOn, selectedVoiceURI, voices]);

  async function sendCommand(text) {
    const commandText = (text || input).trim();
    if (!commandText || thinking) return;
    setInput("");
    setError("");
    const nextMessages = [...messages, { role: "king", text: commandText }];
    setMessages(nextMessages);
    setThinking(true);
    try {
      const res = await fetch(QUEEN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content:
                `${QUEEN_IDENTITY}\n\nConversation so far:\n` +
                nextMessages.map((m) => `${m.role === "king" ? ADDRESS_NAME : "Queen"}: ${m.text}`).join("\n") +
                `\n\nRespond as Queen to the latest message only. Return only her spoken reply, nothing else.`,
            },
          ],
        }),
      });
      const data = await res.json();
      const reply = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n").trim() ||
        "I didn't catch that clearly — say it again?";
      setMessages((prev) => [...prev, { role: "queen", text: reply }]);
      speak(reply);
    } catch (e) {
      setError("Queen couldn't reach the command center. Try again in a moment.");
    } finally {
      setThinking(false);
    }
  }

  async function generateContent() {
    if (!brief.trim() || genLoading) return;
    setGenLoading(true);
    setError("");
    const userBrief = brief;
    setBrief("");
    try {
      const res = await fetch(QUEEN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `${QUEEN_IDENTITY}\n\n${selectedType.prompt} for ${OWNER_NAME}'s video conferencing product, about: "${userBrief}". Return only the finished content, no preamble, no markdown fences, no explanation.`,
            },
          ],
        }),
      });
      const data = await res.json();
      const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
      setEntries((prev) => [{ id: Date.now(), type: selectedType.label, brief: userBrief, text: text || "Nothing came through — try rephrasing." }, ...prev]);
    } catch (e) {
      setError("Queen couldn't reach the generator. Try again in a moment.");
    } finally {
      setGenLoading(false);
    }
  }

  function toggleConnect(id) {
    if (!connected[id] && !handles[id]?.trim()) return;
    setConnected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function setHandle(id, value) {
    setHandles((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #C9A44C55; }
        .qz-scroll::-webkit-scrollbar { width: 6px; }
        .qz-scroll::-webkit-scrollbar-thumb { background: #C9A44C55; border-radius: 4px; }
        @keyframes qz-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,164,76,0.35), 0 0 24px 4px rgba(201,164,76,0.25); }
          50% { box-shadow: 0 0 0 10px rgba(201,164,76,0), 0 0 36px 8px rgba(201,164,76,0.4); }
        }
        .qz-seal { animation: qz-pulse 2.6s ease-in-out infinite; }
        .qz-seal.active { animation-duration: 0.9s; }
        @keyframes qz-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .qz-spin { animation: qz-spin 1s linear infinite; }
        @keyframes qz-mic-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(201,68,68,0.5);} 50% { box-shadow: 0 0 0 8px rgba(201,68,68,0);} }
        .qz-mic-active { animation: qz-mic-pulse 1.2s ease-in-out infinite; background: #C94444 !important; border-color: #C94444 !important; }
        textarea:focus, input:focus, button:focus-visible { outline: 2px solid #C9A44C; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .qz-seal, .qz-mic-active { animation: none; } }
      `}</style>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brandRow}>
          <div className={`qz-seal ${thinking ? "active" : ""}`} style={styles.sealSmall}>
            <Crown size={18} color="#0B0A0C" />
          </div>
          <div>
            <div style={styles.brandName}>QUEEN</div>
            <div style={styles.brandSub}>Sovereign Assistant</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { id: "console", icon: Sparkles, label: "Command Console" },
            { id: "growth", icon: TrendingUp, label: "Growth & Revenue" },
            { id: "treasury", icon: Landmark, label: "Treasury" },
            { id: "queue", icon: Radio, label: "Campaign Queue" },
            { id: "accounts", icon: Link2, label: "Connected Accounts" },
          ].map((n) => (
            <div
              key={n.id}
              onClick={() => setActiveTab(n.id)}
              style={{ ...styles.navItem, ...(activeTab === n.id ? styles.navItemActive : {}), cursor: "pointer" }}
            >
              <n.icon size={16} />
              <span>{n.label}</span>
            </div>
          ))}
        </nav>

        <div style={styles.voiceBox}>
          <div style={styles.voiceBoxHead}>
            <span>Queen's voice</span>
            <button onClick={() => setVoiceOn((v) => !v)} style={styles.voiceMuteBtn} aria-label="Toggle voice">
              {voiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
          {voices.length > 0 ? (
            <select
              value={selectedVoiceURI}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              style={styles.voiceSelect}
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
              ))}
            </select>
          ) : (
            <div style={styles.voiceHintText}>Loading voices from your browser…</div>
          )}
        </div>

        <div style={styles.sidebarNote}>
          <Gem size={14} color="#C9A44C" />
          <span>Real posting/monetization on Instagram, YouTube &amp; TikTok needs those platforms' own API access — connect below once you have it.</span>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>At your command, {ADDRESS_NAME}.</h1>
            <p style={styles.hSub}>Speak or type — Queen is listening.</p>
          </div>
        </header>

        {/* Command Console */}
        {activeTab === "console" && (
        <section style={styles.console}>
          <div className="qz-scroll" style={styles.consoleHistory}>
            {messages.map((m, i) => (
              <div key={i} style={{ ...styles.bubbleRow, justifyContent: m.role === "king" ? "flex-end" : "flex-start" }}>
                <div style={m.role === "king" ? styles.bubbleKing : styles.bubbleQueen}>
                  {m.role === "queen" && <div style={styles.bubbleLabel}>QUEEN</div>}
                  <div>{m.text}</div>
                </div>
              </div>
            ))}
            {thinking && (
              <div style={{ ...styles.bubbleRow, justifyContent: "flex-start" }}>
                <div style={styles.bubbleQueen}>
                  <div style={styles.bubbleLabel}>QUEEN</div>
                  <Loader2 size={14} className="qz-spin" />
                </div>
              </div>
            )}
            <div ref={consoleEndRef} />
          </div>

          <div style={styles.consoleInputRow}>
            <button
              onClick={startListening}
              className={listening ? "qz-mic-active" : ""}
              style={styles.micBtn}
              aria-label="Speak a command"
            >
              {listening ? <MicOff size={16} color="#fff" /> : <Mic size={16} />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendCommand()}
              placeholder="Tell Queen what you need…"
              style={styles.consoleInput}
            />
            <button onClick={() => sendCommand()} disabled={thinking || !input.trim()} style={styles.sendBtn}>
              <Send size={15} />
            </button>
          </div>
          {error && <div style={styles.errorText}>{error}</div>}
        </section>
        )}

        {/* Metrics */}
        {activeTab === "growth" && (
        <section style={styles.metricsGrid}>
          {METRICS.map((m) => (
            <div key={m.label} style={styles.metricCard}>
              <div style={styles.metricLabel}>{m.label}</div>
              <div style={styles.metricValue}>{m.value}</div>
              <div style={styles.metricDelta}>{m.delta}</div>
            </div>
          ))}
        </section>
        )}

        {/* Treasury */}
        {activeTab === "treasury" && (
        <section style={styles.card}>
          <div style={styles.cardHead}>
            <Landmark size={16} color="#C9A44C" />
            <span style={styles.cardTitle}>Treasury</span>
          </div>

          <div style={styles.treasuryTop}>
            <div style={styles.treasuryStat}>
              <div style={styles.treasuryLabel}><ArrowUpRight size={13} color="#8FBF8A" /> Total Revenue</div>
              <div style={styles.treasuryValueGood}>${totalRevenue.toLocaleString()}</div>
            </div>
            <div style={styles.treasuryStat}>
              <div style={styles.treasuryLabel}><ArrowDownRight size={13} color="#D98C8C" /> Total Expenses</div>
              <div style={styles.treasuryValueBad}>${totalExpenses.toLocaleString()}</div>
            </div>
            <div style={styles.treasuryStat}>
              <div style={styles.treasuryLabel}>Net Balance</div>
              <div style={styles.treasuryValue}>${netBalance.toLocaleString()}</div>
            </div>
          </div>

          <div style={styles.treasuryGrid}>
            {/* Trend chart */}
            <div style={styles.chartWrap}>
              <div style={styles.subLabel}>Revenue vs. Expenses — last 5 months</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={TREND} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A44C" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#C9A44C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D98C8C" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#D98C8C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#8A8378", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8A8378", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#14110C", border: "1px solid #ffffff1F", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#C9A44C" fill="url(#rev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="#D98C8C" fill="url(#exp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Expense breakdown */}
            <div>
              <div style={styles.subLabel}>Expense breakdown</div>
              <div style={styles.breakdownList}>
                {EXPENSE_BREAKDOWN.map((e) => (
                  <div key={e.label} style={styles.breakdownRow}>
                    <div style={styles.breakdownBarTrack}>
                      <div style={{ ...styles.breakdownBarFill, width: `${(e.value / totalExpenses) * 100}%` }} />
                    </div>
                    <div style={styles.breakdownLabelRow}>
                      <span>{e.label}</span>
                      <span style={styles.breakdownValue}>${e.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div style={styles.subLabel}>Recent transactions</div>
          <div style={styles.txList}>
            {TRANSACTIONS.map((t) => (
              <div key={t.id} style={styles.txRow}>
                <div style={{ ...styles.txIcon, background: t.type === "in" ? "#8FBF8A22" : "#D98C8C22" }}>
                  {t.type === "in" ? <ArrowUpRight size={13} color="#8FBF8A" /> : <ArrowDownRight size={13} color="#D98C8C" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.txLabel}>{t.label}</div>
                  <div style={styles.txDate}>{t.date}</div>
                </div>
                <div style={t.type === "in" ? styles.txAmountGood : styles.txAmountBad}>
                  {t.type === "in" ? "+" : "−"}${t.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div style={styles.queueFootnote}>
            Illustrative figures for now. Once Queen's connected to your ad accounts and payment platforms, this fills in with your real numbers automatically.
          </div>
        </section>
        )}

        {/* Content Studio */}
        {activeTab === "console" && (
        <section style={styles.columns}>
          <div style={styles.card}>
            <div style={styles.cardHead}>
              <Sparkles size={16} color="#C9A44C" />
              <span style={styles.cardTitle}>Content Studio</span>
            </div>

            <div style={styles.typeRow}>
              {CONTENT_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t)}
                  style={{ ...styles.typeChip, ...(selectedType.id === t.id ? styles.typeChipActive : {}) }}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={`Tell Queen what to write... e.g. "announce our new screen-share feature"`}
              style={styles.textarea}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generateContent();
                }
              }}
            />
            <div style={styles.composeRow}>
              <span style={styles.hint}>Enter to send · Shift+Enter for new line</span>
              <button onClick={generateContent} disabled={genLoading || !brief.trim()} style={styles.sendBtnWide}>
                {genLoading ? <Loader2 size={15} className="qz-spin" /> : <Send size={15} />}
                {genLoading ? "Drafting…" : "Command"}
              </button>
            </div>

            <div className="qz-scroll" style={styles.entriesScroll}>
              {entries.length === 0 && !genLoading && (
                <div style={styles.emptyState}>Nothing drafted yet. Give Queen a brief above.</div>
              )}
              {entries.map((en) => (
                <div key={en.id} style={styles.entry}>
                  <div style={styles.entryMeta}>
                    <span style={styles.entryType}>{en.type}</span>
                    <span style={styles.entryBrief}>{en.brief}</span>
                  </div>
                  <div style={styles.entryText}>{en.text}</div>
                  <button onClick={() => speak(en.text)} style={styles.speakBtn}>
                    <Volume2 size={12} />
                    Speak
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Campaign Queue */}
        {activeTab === "queue" && (
        <section style={styles.card}>
          <div style={styles.cardHead}>
            <Radio size={16} color="#C9A44C" />
            <span style={styles.cardTitle}>Campaign Queue</span>
          </div>
          <div style={styles.queueList}>
            {QUEUE.map((q) => (
              <div key={q.title} style={styles.queueItem}>
                <div style={styles.queueDot} />
                <div style={{ flex: 1 }}>
                  <div style={styles.queueTitle}>{q.title}</div>
                  <div style={styles.queueMeta}>{q.channel} · {q.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={styles.queueFootnote}>
            Illustrative queue. Connect a platform below to schedule real posts.
          </div>
        </section>
        )}

        {/* Connected Accounts */}
        {activeTab === "accounts" && (
        <section style={styles.card}>
          <div style={styles.cardHead}>
            <Link2 size={16} color="#C9A44C" />
            <span style={styles.cardTitle}>Connected Accounts</span>
          </div>
          <div style={styles.platformGrid}>
            {PLATFORMS.map((p) => (
              <div key={p.id} style={styles.platformCard}>
                <div style={styles.platformTop}>
                  <span style={styles.platformIcon}>{p.icon}</span>
                  <span style={styles.platformName}>{p.name}</span>
                  {connected[p.id] && <CheckCircle2 size={15} color="#C9A44C" />}
                </div>
                <input
                  value={handles[p.id] || ""}
                  onChange={(e) => setHandle(p.id, e.target.value)}
                  placeholder="@yourhandle"
                  disabled={connected[p.id]}
                  style={styles.handleInput}
                />
                <button
                  onClick={() => toggleConnect(p.id)}
                  disabled={!connected[p.id] && !(handles[p.id] || "").trim()}
                  style={connected[p.id] ? styles.platformBtnConnected : styles.platformBtn}
                >
                  {connected[p.id] ? "Connected — tap to unlink" : "Label this account"}
                </button>
              </div>
            ))}
          </div>
          <div style={styles.queueFootnote}>
            Typing a handle here just labels the account for planning — it doesn't give Queen access. Real posting, editing, and monetization control requires signing in directly through each platform's own secure login (Instagram, YouTube, TikTok) and granting permission there. No app — including this one — can act on your account from a username alone; that's what keeps it yours. Ready when you are to set up real sign-in.
          </div>
        </section>
        )}

        <footer style={styles.footer}>
          <Crown size={13} color="#C9A44C" />
          <span>Queen is owned by <span style={styles.footerName}>{OWNER_NAME}</span></span>
        </footer>
      </main>
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    background: "radial-gradient(1200px 600px at 80% -10%, #1a140a 0%, #0B0A0C 55%)",
    color: "#F2EDE3",
    fontFamily: "'Inter', sans-serif",
  },
  sidebar: {
    width: 250,
    borderRight: "1px solid #ffffff14",
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    flexShrink: 0,
  },
  brandRow: { display: "flex", alignItems: "center", gap: 10 },
  sealSmall: {
    width: 34, height: 34, borderRadius: "50%",
    background: "linear-gradient(135deg, #E8D9B5, #C9A44C)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  brandName: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, letterSpacing: 2 },
  brandSub: { fontSize: 10, color: "#C9A44C", letterSpacing: 1, textTransform: "uppercase" },
  nav: { display: "flex", flexDirection: "column", gap: 4 },
  navItem: {
    display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
    borderRadius: 8, fontSize: 13, color: "#B8B0A0", cursor: "default",
  },
  navItemActive: { background: "#C9A44C1A", color: "#E8D9B5" },
  voiceBox: { border: "1px solid #ffffff14", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 },
  voiceBoxHead: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "#B8B0A0", textTransform: "uppercase", letterSpacing: 0.5 },
  voiceMuteBtn: { background: "transparent", border: "1px solid #ffffff1F", borderRadius: 6, color: "#E8D9B5", padding: 5, cursor: "pointer", display: "flex" },
  voiceSelect: { background: "#0B0A0C", border: "1px solid #ffffff1F", borderRadius: 6, color: "#F2EDE3", padding: "6px 8px", fontSize: 12 },
  voiceHintText: { fontSize: 11, color: "#615A4F" },
  sidebarNote: {
    marginTop: "auto", display: "flex", gap: 8, fontSize: 11.5, lineHeight: 1.5,
    color: "#8A8378", padding: 12, border: "1px solid #ffffff14", borderRadius: 10,
  },
  main: { flex: 1, padding: "30px 40px", overflowY: "auto" },
  header: { marginBottom: 20 },
  h1: { fontFamily: "'Cormorant Garamond', serif", fontSize: 34, margin: 0, fontWeight: 600 },
  hSub: { color: "#8A8378", margin: "4px 0 0", fontSize: 14 },

  console: {
    background: "#14110CCC", border: "1px solid #C9A44C33", borderRadius: 16, padding: 18, marginBottom: 24,
  },
  consoleHistory: { maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 },
  bubbleRow: { display: "flex" },
  bubbleKing: { background: "#C9A44C", color: "#0B0A0C", borderRadius: "12px 12px 2px 12px", padding: "9px 13px", fontSize: 13.5, maxWidth: "70%" },
  bubbleQueen: { background: "#0B0A0C88", border: "1px solid #ffffff14", borderRadius: "12px 12px 12px 2px", padding: "9px 13px", fontSize: 13.5, maxWidth: "70%" },
  bubbleLabel: { fontSize: 9.5, color: "#C9A44C", letterSpacing: 0.8, marginBottom: 3, fontWeight: 600 },
  consoleInputRow: { display: "flex", gap: 8, marginTop: 14, alignItems: "center" },
  micBtn: {
    width: 38, height: 38, borderRadius: "50%", border: "1px solid #ffffff1F", background: "transparent",
    color: "#E8D9B5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
  },
  consoleInput: {
    flex: 1, background: "#0B0A0C", border: "1px solid #ffffff1F", borderRadius: 20, color: "#F2EDE3",
    padding: "10px 16px", fontSize: 13.5,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: "50%", background: "#C9A44C", color: "#0B0A0C",
    border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
  },
  sendBtnWide: {
    display: "flex", alignItems: "center", gap: 6, background: "#C9A44C", color: "#0B0A0C",
    border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  },

  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 },
  metricCard: { background: "#14110CCC", border: "1px solid #ffffff14", borderRadius: 12, padding: "16px 16px" },
  metricLabel: { fontSize: 11, color: "#8A8378", textTransform: "uppercase", letterSpacing: 0.6 },
  metricValue: { fontFamily: "'JetBrains Mono', monospace", fontSize: 22, marginTop: 6, color: "#F2EDE3" },
  metricDelta: { fontSize: 11.5, color: "#C9A44C", marginTop: 4 },

  columns: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, alignItems: "start", marginBottom: 18 },
  card: { background: "#14110CCC", border: "1px solid #ffffff14", borderRadius: 14, padding: 20, marginBottom: 18 },
  cardHead: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
  cardTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600 },
  typeRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  typeChip: {
    display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20,
    border: "1px solid #ffffff1F", background: "transparent", color: "#B8B0A0", fontSize: 12, cursor: "pointer",
  },
  typeChipActive: { background: "#C9A44C", color: "#0B0A0C", borderColor: "#C9A44C", fontWeight: 600 },
  textarea: {
    width: "100%", background: "#0B0A0C", border: "1px solid #ffffff1F", borderRadius: 10,
    color: "#F2EDE3", padding: 12, fontSize: 13.5, fontFamily: "inherit", resize: "vertical",
  },
  composeRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  hint: { fontSize: 11, color: "#615A4F" },
  errorText: { color: "#E29A9A", fontSize: 12, marginTop: 8 },
  entriesScroll: { maxHeight: 300, overflowY: "auto", marginTop: 16, display: "flex", flexDirection: "column", gap: 12 },
  emptyState: { color: "#615A4F", fontSize: 13, textAlign: "center", padding: "30px 0" },
  entry: { border: "1px solid #ffffff14", borderRadius: 10, padding: 12, background: "#0B0A0C88" },
  entryMeta: { display: "flex", gap: 8, alignItems: "baseline", marginBottom: 6 },
  entryType: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, color: "#C9A44C", fontWeight: 600 },
  entryBrief: { fontSize: 11, color: "#615A4F" },
  entryText: { fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap" },
  speakBtn: {
    display: "flex", alignItems: "center", gap: 5, marginTop: 8, background: "transparent",
    border: "1px solid #C9A44C55", color: "#C9A44C", borderRadius: 6, padding: "4px 9px", fontSize: 11, cursor: "pointer",
  },
  queueList: { display: "flex", flexDirection: "column", gap: 14 },
  queueItem: { display: "flex", gap: 10, alignItems: "flex-start" },
  queueDot: { width: 7, height: 7, borderRadius: "50%", background: "#C9A44C", marginTop: 5, flexShrink: 0 },
  queueTitle: { fontSize: 13.5 },
  queueMeta: { fontSize: 11.5, color: "#8A8378", marginTop: 2 },
  queueFootnote: { fontSize: 11, color: "#615A4F", marginTop: 16, borderTop: "1px solid #ffffff14", paddingTop: 12, lineHeight: 1.6 },

  platformGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 },
  platformCard: { border: "1px solid #ffffff14", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10 },
  platformTop: { display: "flex", alignItems: "center", gap: 8 },
  platformIcon: { fontSize: 16 },
  platformName: { fontSize: 13.5, flex: 1 },
  handleInput: {
    background: "#0B0A0C", border: "1px solid #ffffff1F", borderRadius: 7, color: "#F2EDE3",
    padding: "6px 9px", fontSize: 12.5,
  },
  platformBtn: {
    background: "transparent", border: "1px solid #C9A44C55", color: "#C9A44C", borderRadius: 7,
    padding: "6px 10px", fontSize: 12, cursor: "pointer",
  },
  platformBtnConnected: {
    background: "#C9A44C1A", border: "1px solid #C9A44C", color: "#E8D9B5", borderRadius: 7,
    padding: "6px 10px", fontSize: 12, cursor: "pointer",
  },

  treasuryTop: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 },
  treasuryStat: { border: "1px solid #ffffff14", borderRadius: 10, padding: "14px 16px" },
  treasuryLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#8A8378", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  treasuryValue: { fontFamily: "'JetBrains Mono', monospace", fontSize: 24, color: "#F2EDE3" },
  treasuryValueGood: { fontFamily: "'JetBrains Mono', monospace", fontSize: 24, color: "#8FBF8A" },
  treasuryValueBad: { fontFamily: "'JetBrains Mono', monospace", fontSize: 24, color: "#D98C8C" },
  treasuryGrid: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, marginBottom: 20 },
  subLabel: { fontSize: 11.5, color: "#8A8378", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 },
  chartWrap: { border: "1px solid #ffffff14", borderRadius: 10, padding: "12px 8px 4px" },
  breakdownList: { display: "flex", flexDirection: "column", gap: 12 },
  breakdownRow: { display: "flex", flexDirection: "column", gap: 5 },
  breakdownBarTrack: { height: 6, background: "#ffffff0F", borderRadius: 4, overflow: "hidden" },
  breakdownBarFill: { height: "100%", background: "linear-gradient(90deg, #C9A44C, #E8D9B5)", borderRadius: 4 },
  breakdownLabelRow: { display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#B8B0A0" },
  breakdownValue: { color: "#E8D9B5", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 },
  txList: { display: "flex", flexDirection: "column", gap: 4 },
  txRow: { display: "flex", alignItems: "center", gap: 12, padding: "9px 4px", borderBottom: "1px solid #ffffff0D" },
  txIcon: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  txLabel: { fontSize: 13 },
  txDate: { fontSize: 11, color: "#615A4F", marginTop: 1 },
  txAmountGood: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#8FBF8A" },
  txAmountBad: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#D98C8C" },

  footer: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 10, paddingTop: 20, borderTop: "1px solid #ffffff14",
    fontSize: 12, color: "#8A8378", letterSpacing: 0.3,
  },
  footerName: { color: "#E8D9B5", fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, letterSpacing: 1 },
};
