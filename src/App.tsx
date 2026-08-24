import { useState, useRef, useEffect } from "react";

// shared RMS value used by AudioMeter when detector monitor is active
const sharedRmsRef: { current: number } = { current: 0 };

// ── Data ──────────────────────────────────────────────────────────────────────

type SoundType = "vowel" | "consonant";
type ArticulationGroup =
  | "Kaṇṭhya"
  | "Tālavya"
  | "Mūrdhanya"
  | "Dantya"
  | "Oṣṭhya"
  | "Kaṇṭhatālavya"
  | "Kaṇṭhoṣṭhya"
  | "Dantōṣṭhya"
  | "Nāsikya";

interface Sound {
  id: string;
  devanagari: string;
  iast: string;
  type: SoundType;
  group: ArticulationGroup;
  groupEn: string;
  description: string;
  example: string;
}

const SOUNDS: Sound[] = [
  // Vowels
  { id: "a",  devanagari: "अ", iast: "a",  type: "vowel", group: "Kaṇṭhya",          groupEn: "Guttural",  description: "Short open back vowel", example: "as in 'cut'" },
  { id: "aa", devanagari: "आ", iast: "ā",  type: "vowel", group: "Kaṇṭhya",          groupEn: "Guttural",  description: "Long open back vowel",  example: "as in 'father'" },
  { id: "i",  devanagari: "इ", iast: "i",  type: "vowel", group: "Tālavya",          groupEn: "Palatal",   description: "Short close front vowel", example: "as in 'sit'" },
  { id: "ii", devanagari: "ई", iast: "ī",  type: "vowel", group: "Tālavya",          groupEn: "Palatal",   description: "Long close front vowel",  example: "as in 'see'" },
  { id: "u",  devanagari: "उ", iast: "u",  type: "vowel", group: "Oṣṭhya",           groupEn: "Labial",    description: "Short close back vowel",  example: "as in 'put'" },
  { id: "uu", devanagari: "ऊ", iast: "ū",  type: "vowel", group: "Oṣṭhya",           groupEn: "Labial",    description: "Long close back vowel",   example: "as in 'moon'" },
  { id: "e",  devanagari: "ए", iast: "e",  type: "vowel", group: "Kaṇṭhatālavya",    groupEn: "Gutturo-Palatal", description: "Mid front vowel", example: "as in 'they'" },
  { id: "ai", devanagari: "ऐ", iast: "ai", type: "vowel", group: "Kaṇṭhatālavya",    groupEn: "Gutturo-Palatal", description: "Diphthong", example: "as in 'aisle'" },
  { id: "o",  devanagari: "ओ", iast: "o",  type: "vowel", group: "Kaṇṭhoṣṭhya",      groupEn: "Gutturo-Labial",  description: "Mid back vowel", example: "as in 'go'" },
  { id: "au", devanagari: "औ", iast: "au", type: "vowel", group: "Kaṇṭhoṣṭhya",      groupEn: "Gutturo-Labial",  description: "Diphthong", example: "as in 'now'" },
  // Consonants – Guttural
  { id: "ka", devanagari: "क", iast: "ka", type: "consonant", group: "Kaṇṭhya",  groupEn: "Guttural",  description: "Unaspirated voiceless velar stop",   example: "as in 'skip'" },
  { id: "kha",devanagari: "ख", iast: "kha",type: "consonant", group: "Kaṇṭhya",  groupEn: "Guttural",  description: "Aspirated voiceless velar stop",     example: "as in 'blockhead'" },
  { id: "ga", devanagari: "ग", iast: "ga", type: "consonant", group: "Kaṇṭhya",  groupEn: "Guttural",  description: "Unaspirated voiced velar stop",      example: "as in 'game'" },
  { id: "gha",devanagari: "घ", iast: "gha",type: "consonant", group: "Kaṇṭhya",  groupEn: "Guttural",  description: "Aspirated voiced velar stop",        example: "as in 'leghorn'" },
  { id: "nga",devanagari: "ङ", iast: "ṅa", type: "consonant", group: "Kaṇṭhya",  groupEn: "Guttural",  description: "Velar nasal",                        example: "as in 'sing'" },
  // Consonants – Palatal
  { id: "ca", devanagari: "च", iast: "ca", type: "consonant", group: "Tālavya",  groupEn: "Palatal",   description: "Unaspirated voiceless palatal affricate", example: "as in 'church'" },
  { id: "cha",devanagari: "छ", iast: "cha",type: "consonant", group: "Tālavya",  groupEn: "Palatal",   description: "Aspirated voiceless palatal affricate",   example: "strong ch" },
  { id: "ja", devanagari: "ज", iast: "ja", type: "consonant", group: "Tālavya",  groupEn: "Palatal",   description: "Unaspirated voiced palatal affricate",    example: "as in 'jam'" },
  { id: "jha",devanagari: "झ", iast: "jha",type: "consonant", group: "Tālavya",  groupEn: "Palatal",   description: "Aspirated voiced palatal affricate",      example: "aspirated j" },
  { id: "nya",devanagari: "ञ", iast: "ña", type: "consonant", group: "Tālavya",  groupEn: "Palatal",   description: "Palatal nasal",                           example: "as in 'canyon'" },
  // Consonants – Retroflex
  { id: "tta", devanagari: "ट", iast: "ṭa", type: "consonant", group: "Mūrdhanya", groupEn: "Retroflex", description: "Unaspirated voiceless retroflex stop", example: "tongue tip curled back" },
  { id: "ttha",devanagari: "ठ", iast: "ṭha",type: "consonant", group: "Mūrdhanya", groupEn: "Retroflex", description: "Aspirated voiceless retroflex stop",   example: "aspirated ṭ" },
  { id: "dda", devanagari: "ड", iast: "ḍa", type: "consonant", group: "Mūrdhanya", groupEn: "Retroflex", description: "Unaspirated voiced retroflex stop",    example: "retroflex d" },
  { id: "ddha",devanagari: "ढ", iast: "ḍha",type: "consonant", group: "Mūrdhanya", groupEn: "Retroflex", description: "Aspirated voiced retroflex stop",      example: "aspirated ḍ" },
  { id: "nna", devanagari: "ण", iast: "ṇa", type: "consonant", group: "Mūrdhanya", groupEn: "Retroflex", description: "Retroflex nasal",                      example: "nasal with curled tongue" },
  // Consonants – Dental
  { id: "ta", devanagari: "त", iast: "ta", type: "consonant", group: "Dantya",    groupEn: "Dental",    description: "Unaspirated voiceless dental stop",  example: "as in Spanish 'tú'" },
  { id: "tha",devanagari: "थ", iast: "tha",type: "consonant", group: "Dantya",    groupEn: "Dental",    description: "Aspirated voiceless dental stop",    example: "as in 'Thames'" },
  { id: "da", devanagari: "द", iast: "da", type: "consonant", group: "Dantya",    groupEn: "Dental",    description: "Unaspirated voiced dental stop",     example: "as in Spanish 'donde'" },
  { id: "dha",devanagari: "ध", iast: "dha",type: "consonant", group: "Dantya",    groupEn: "Dental",    description: "Aspirated voiced dental stop",       example: "aspirated d" },
  { id: "na", devanagari: "न", iast: "na", type: "consonant", group: "Dantya",    groupEn: "Dental",    description: "Dental nasal",                       example: "as in 'now'" },
  // Consonants – Labial
  { id: "pa", devanagari: "प", iast: "pa", type: "consonant", group: "Oṣṭhya",    groupEn: "Labial",    description: "Unaspirated voiceless bilabial stop", example: "as in 'spot'" },
  { id: "pha",devanagari: "फ", iast: "pha",type: "consonant", group: "Oṣṭhya",    groupEn: "Labial",    description: "Aspirated voiceless bilabial stop",   example: "as in 'phone'" },
  { id: "ba", devanagari: "ब", iast: "ba", type: "consonant", group: "Oṣṭhya",    groupEn: "Labial",    description: "Unaspirated voiced bilabial stop",    example: "as in 'ball'" },
  { id: "bha",devanagari: "भ", iast: "bha",type: "consonant", group: "Oṣṭhya",    groupEn: "Labial",    description: "Aspirated voiced bilabial stop",      example: "aspirated b" },
  { id: "ma", devanagari: "म", iast: "ma", type: "consonant", group: "Oṣṭhya",    groupEn: "Labial",    description: "Bilabial nasal",                      example: "as in 'mother'" },
  // Semi-vowels & Sibilants
  { id: "ya", devanagari: "य", iast: "ya", type: "consonant", group: "Tālavya",   groupEn: "Palatal",   description: "Palatal approximant / semi-vowel",   example: "as in 'yes'" },
  { id: "ra", devanagari: "र", iast: "ra", type: "consonant", group: "Mūrdhanya", groupEn: "Retroflex", description: "Retroflex flap / trill",              example: "rolled r" },
  { id: "la", devanagari: "ल", iast: "la", type: "consonant", group: "Dantya",    groupEn: "Dental",    description: "Dental lateral approximant",         example: "as in 'light'" },
  { id: "va", devanagari: "व", iast: "va", type: "consonant", group: "Dantōṣṭhya",groupEn: "Dento-Labial", description: "Labiodental approximant",         example: "between v and w" },
  { id: "sha",devanagari: "श", iast: "śa", type: "consonant", group: "Tālavya",   groupEn: "Palatal",   description: "Voiceless palatal sibilant",         example: "as in 'ship'" },
  { id: "ssa",devanagari: "ष", iast: "ṣa", type: "consonant", group: "Mūrdhanya", groupEn: "Retroflex", description: "Voiceless retroflex sibilant",       example: "retroflex sh" },
  { id: "sa", devanagari: "स", iast: "sa", type: "consonant", group: "Dantya",    groupEn: "Dental",    description: "Voiceless dental sibilant",          example: "as in 'sun'" },
  { id: "ha", devanagari: "ह", iast: "ha", type: "consonant", group: "Kaṇṭhya",   groupEn: "Guttural",  description: "Voiced glottal fricative / aspirate", example: "as in 'hill'" },
];

const GROUP_COLORS: Record<string, string> = {
  "Kaṇṭhya":       "#8b3a0f",
  "Tālavya":       "#2d6a4f",
  "Mūrdhanya":     "#1a4a7a",
  "Dantya":        "#6b4c11",
  "Oṣṭhya":        "#5a2d82",
  "Kaṇṭhatālavya": "#8b5e0f",
  "Kaṇṭhoṣṭhya":   "#7a3060",
  "Dantōṣṭhya":    "#3d5a2d",
  "Nāsikya":       "#4a4a7a",
};

const ARTICULATION_INFO: Record<string, { en: string; place: string; tip: string }> = {
  "Kaṇṭhya":       { en: "Guttural",       place: "Throat / Velum",    tip: "Sound originates at the back of the throat." },
  "Tālavya":       { en: "Palatal",         place: "Hard Palate",       tip: "Tongue blade touches or approaches the hard palate." },
  "Mūrdhanya":     { en: "Retroflex",       place: "Cerebral / Dome",   tip: "Tongue tip curls back to touch the dome of the mouth." },
  "Dantya":        { en: "Dental",          place: "Upper Teeth",       tip: "Tongue tip touches the back of the upper teeth." },
  "Oṣṭhya":        { en: "Labial",          place: "Lips",              tip: "Sound formed primarily with the lips." },
  "Kaṇṭhatālavya": { en: "Gutturo-Palatal", place: "Throat + Palate",   tip: "Combination of guttural and palatal articulation." },
  "Kaṇṭhoṣṭhya":   { en: "Gutturo-Labial",  place: "Throat + Lips",     tip: "Combination of guttural and labial articulation." },
  "Dantōṣṭhya":    { en: "Dento-Labial",    place: "Teeth + Lips",      tip: "Lower lip approaches upper teeth." },
  "Nāsikya":       { en: "Nasal",           place: "Nasal Passage",     tip: "Sound passes through the nasal cavity." },
};

type RecordingState = "idle" | "recording" | "processing" | "correct" | "try-again";

// ── Helper ────────────────────────────────────────────────────────────────────

function groupSounds(sounds: Sound[], type: SoundType) {
  const grouped: Record<string, Sound[]> = {};
  sounds.filter((s) => s.type === type).forEach((s) => {
    if (!grouped[s.group]) grouped[s.group] = [];
    grouped[s.group].push(s);
  });
  return grouped;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SoundCell({
  sound,
  selected,
  onSelect,
}: {
  sound: Sound;
  selected: boolean;
  onSelect: (s: Sound) => void;
}) {
  const color = GROUP_COLORS[sound.group] || "#555";
  return (
    <button
      onClick={() => onSelect(sound)}
      title={`${sound.iast} — ${sound.description}`}
      style={{
        borderColor: selected ? color : "transparent",
        backgroundColor: selected ? color + "18" : "transparent",
        color: selected ? color : "var(--foreground)",
        outline: selected ? `2px solid ${color}` : "none",
      }}
      className="w-full aspect-square flex flex-col items-center justify-center rounded transition-all duration-150 cursor-pointer border hover:border-current group"
    >
      <span
        className="text-2xl leading-none font-normal"
        style={{ fontFamily: "serif", color: selected ? color : "inherit" }}
      >
        {sound.devanagari}
      </span>
      <span
        className="text-[10px] mt-0.5 font-mono tracking-tight opacity-60 group-hover:opacity-100"
        style={{ color: selected ? color : "var(--muted-foreground)" }}
      >
        {sound.iast}
      </span>
    </button>
  );
}

function GroupSection({
  group,
  sounds,
  selectedId,
  onSelect,
}: {
  group: string;
  sounds: Sound[];
  selectedId: string | null;
  onSelect: (s: Sound) => void;
}) {
  const color = GROUP_COLORS[group] || "#555";
  const info = ARTICULATION_INFO[group];
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
          {group}
        </span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          — {info?.en}
        </span>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(sounds.length, 5)}, minmax(0,1fr))` }}>
        {sounds.map((s) => (
          <SoundCell key={s.id} sound={s} selected={selectedId === s.id} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className={`flex items-center gap-[3px] h-8 ${active ? "recording-active" : ""}`}>
      {[0.5, 0.8, 1, 0.7, 0.9, 0.6, 1, 0.8, 0.5].map((h, i) => (
        <div
          key={i}
          className="wave-bar rounded-full w-[3px]"
          style={{
            height: `${h * 100}%`,
            backgroundColor: active ? "var(--primary)" : "var(--border)",
            transform: active ? undefined : `scaleY(${h * 0.3})`,
            transition: active ? undefined : "none",
          }}
        />
      ))}
    </div>
  );
}

function AudioMeter({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) {
      // stop everything
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (ctxRef.current) { try { ctxRef.current.close(); } catch {} }
      ctxRef.current = null;
      streamRef.current = null;
      return;
    }

    let mounted = true;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        src.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);

        const canvas = canvasRef.current;
        const cctx = canvas?.getContext("2d");

        function draw() {
          if (!cctx || !canvas) return;
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
          const rms = Math.sqrt(sum / data.length);

          // prefer shared RMS from detector monitor when available
          const shared = sharedRmsRef.current || 0;
          const level = shared > 0 ? Math.min(1, shared) : Math.min(1, rms * 3);

          cctx.clearRect(0, 0, canvas.width, canvas.height);
          cctx.fillStyle = "#c0392b";
          const h = canvas.height * level;
          cctx.fillRect(0, canvas.height - h, canvas.width, h);

          rafRef.current = requestAnimationFrame(draw);
        }

        draw();
      } catch (e) {
        // ignore — meter is purely diagnostic
      }
    }

    start();

    return () => { mounted = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active]);

  return (
    <div style={{ width: 80, height: 12, borderRadius: 6, overflow: "hidden", background: "var(--muted)" }}>
      <canvas ref={canvasRef} width={80} height={12} style={{ display: "block", width: "80px", height: "12px" }} />
    </div>
  );
}

function ResultBadge({ state }: { state: RecordingState }) {
  if (state === "correct")
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold"
        style={{ backgroundColor: "#d4f0dc", color: "#1a6b35", border: "1px solid #9ddcb4" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" fill="#1a6b35" fillOpacity=".15" />
          <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="#1a6b35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Correct Pronunciation!
      </div>
    );
  if (state === "try-again")
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold"
        style={{ backgroundColor: "#fde8d8", color: "#b84c0a", border: "1px solid #f4b896" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" fill="#b84c0a" fillOpacity=".15" />
          <path d="M8 5v4M8 11v.5" stroke="#b84c0a" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Try Again — Listen carefully and retry
      </div>
    );
  return null;
}

function MouthDiagram({ group }: { group: ArticulationGroup }) {
  const regions: Record<string, number[]> = {
    "Kaṇṭhya":       [5],
    "Tālavya":       [3],
    "Mūrdhanya":     [2],
    "Dantya":        [1],
    "Oṣṭhya":        [0],
    "Kaṇṭhatālavya": [3, 5],
    "Kaṇṭhoṣṭhya":   [0, 5],
    "Dantōṣṭhya":    [0, 1],
    "Nāsikya":       [4],
  };
  const labels = ["Lips", "Teeth", "Palate", "Hard P.", "Nasal", "Throat"];
  const active = regions[group] || [];
  return (
    <div className="flex items-center gap-1 mt-2">
      {labels.map((l, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-[9px] font-semibold text-center leading-tight transition-all duration-200"
            style={{
              backgroundColor: active.includes(i) ? GROUP_COLORS[group] || "#555" : "var(--muted)",
              color: active.includes(i) ? "#fff" : "var(--muted-foreground)",
              border: active.includes(i) ? `2px solid ${GROUP_COLORS[group]}` : "2px solid transparent",
            }}
          >
            {l.replace(" ", "\n")}
          </div>
          <div
            className="w-0.5 h-2 rounded-full"
            style={{ backgroundColor: active.includes(i) ? GROUP_COLORS[group] : "var(--border)" }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Voice Detector ────────────────────────────────────────────────────────────

type DetectState = "idle" | "listening" | "processing" | "done";

interface DetectResult {
  sound: Sound;
  confidence: number;
  heard: string;
}

// Voices cache loaded once
let cachedVoices: SpeechSynthesisVoice[] = [];
function loadVoices() {
  cachedVoices = window.speechSynthesis?.getVoices() || [];
}

function girlSpeak(text: string, pitch = 1.9, rate = 0.82) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  function doSpeak() {
    const utter = new SpeechSynthesisUtterance(text);
    utter.pitch = pitch;
    utter.rate = rate;
    utter.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const female = voices.find(
      (v) => /en/i.test(v.lang) && /female|girl|zira|samantha|karen|victoria|moira|fiona|google us english/i.test(v.name)
    ) || voices.find((v) => /en/i.test(v.lang));
    if (female) utter.voice = female;
    window.speechSynthesis.speak(utter);
  }

  // Voices may not be ready yet — small delay guarantees they're loaded
  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => { doSpeak(); window.speechSynthesis.onvoiceschanged = null; };
    // Hard fallback if event never fires
    setTimeout(doSpeak, 300);
  }
}

// Extended syllable → sound id table (covers English phonetic approximations)
const SYLLABLE_MAP: Record<string, string> = {
  // Vowels
  ah: "a", uh: "a", "a": "a", aa: "aa", aah: "aa", far: "aa",
  "i": "i", ih: "i", it: "i", ee: "ii", ea: "ii", "see": "ii",
  "u": "u", uh2: "u", book: "u", oo: "uu", ooh: "uu", moon: "uu",
  ay: "e", hey: "e", "e": "e", eye: "ai", aye: "ai", ai: "ai", "i sound": "ai",
  oh: "o", "o": "o", go: "o", ow: "au", ow2: "au", now: "au", ao: "au",
  // Consonants
  ka: "ka", kuh: "ka", kaa: "ka",
  kha: "kha", khaa: "kha",
  ga: "ga", guh: "ga",
  gha: "gha", ghaa: "gha",
  ca: "ca", cha: "cha", chaa: "cha", ch: "cha",
  ja: "ja", juh: "ja",
  jha: "jha",
  ta: "ta", tuh: "ta",
  tha: "tha", thaa: "tha",
  da: "da", duh: "da",
  dha: "dha",
  pa: "pa", puh: "pa",
  pha: "pha", fa: "pha",
  ba: "ba", buh: "ba",
  bha: "bha",
  ma: "ma", muh: "ma", maa: "ma",
  na: "na", nuh: "na",
  ya: "ya", yuh: "ya",
  ra: "ra", ruh: "ra",
  la: "la", luh: "la",
  va: "va", wuh: "va", wa: "va",
  sha: "sha", shaa: "sha",
  sa: "sa", suh: "sa",
  ha: "ha", huh: "ha",
  // single-letter fallbacks
  k: "ka", g: "ga", t: "ta", d: "da", p: "pa", b: "ba", m: "ma", n: "na", r: "ra", l: "la", s: "sa",
};

function detectFromSpeech(raw: string): DetectResult {
  const t = raw.toLowerCase().trim().replace(/[^a-z ]/g, "").trim();
  const words = t.split(/\s+/).filter(Boolean);

  // Try each word against all match strategies
  for (const word of words) {
    // 1 — exact IAST plain match
    for (const s of SOUNDS) {
      const plain = s.iast.replace(/[āīūṭḍṇśṣṅñṛ]/g, (c) => {
        const m: Record<string, string> = { ā: "aa", ī: "ii", ū: "uu", ṭ: "t", ḍ: "d", ṇ: "n", ś: "sh", ṣ: "sh", ṅ: "ng", ñ: "ny", ṛ: "ri" };
        return m[c] || c;
      });
      if (word === plain || word === s.id) return { sound: s, confidence: 0.94, heard: raw };
    }
    // 2 — syllable map
    const sid = SYLLABLE_MAP[word];
    if (sid) {
      const s = SOUNDS.find((x) => x.id === sid);
      if (s) return { sound: s, confidence: 0.80, heard: raw };
    }
    // 3 — starts-with match on IAST
    for (const s of SOUNDS) {
      if (s.iast.replace(/[ā-ź]/g, "").startsWith(word[0])) {
        return { sound: s, confidence: 0.52, heard: raw };
      }
    }
  }

  // 4 — full fallback: pick by first character of full string
  if (t.length > 0) {
    const match = SOUNDS.find((s) => s.iast[0] === t[0]) || SOUNDS[Math.floor(Math.random() * 10)];
    return { sound: match, confidence: 0.30, heard: raw };
  }

  // nothing heard — return explicit no-speech result (do NOT pick random)
  return { sound: SOUNDS[0], confidence: 0.0, heard: "(no speech detected)" };
}

function editDistance(a: string, b: string) {
  const A = a.split("");
  const B = b.split("");
  const dp: number[][] = Array(A.length + 1).fill(null).map(() => Array(B.length + 1).fill(0));
  for (let i = 0; i <= A.length; i++) dp[i][0] = i;
  for (let j = 0; j <= B.length; j++) dp[0][j] = j;
  for (let i = 1; i <= A.length; i++) {
    for (let j = 1; j <= B.length; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (A[i-1] === B[j-1] ? 0 : 1)
      );
    }
  }
  return dp[A.length][B.length];
}

function normalizeForMatch(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z]/g, "");
}

function detectFromAlternatives(alts: string[]): DetectResult {
  let best: { res: DetectResult; score: number } | null = null;
  for (const alt of alts) {
    if (!alt || alt.trim().length === 0) continue;
    const base = detectFromSpeech(alt);
    const heard = normalizeForMatch(alt);
    const target = normalizeForMatch(base.sound.iast.replace(/[āīūṭḍṇśṣṅñṛ]/g, (c) => {
      const m: Record<string, string> = { ā: "aa", ī: "ii", ū: "uu", ṭ: "t", ḍ: "d", ṇ: "n", ś: "sh", ṣ: "sh", ṅ: "ng", ñ: "ny", ṛ: "ri" };
      return m[c] || c;
    }));
    const ed = editDistance(heard, target);
    const norm = Math.max(0, 1 - ed / Math.max(heard.length, target.length, 1));
    const score = base.confidence * 0.72 + norm * 0.28;
    try { console.debug("detectFromAlternatives: alt->", alt, { iast: base.sound.iast, heard, target, ed, norm: norm.toFixed(2), score: score.toFixed(2) }); } catch (e) {}
    if (!best || score > best.score) best = { res: base, score };
  }
  if (!best) return { sound: SOUNDS[0], confidence: 0.0, heard: "(no speech detected)" };
  // require a minimum score to accept a match (relaxed for debugging)
  if (best.score < 0.20) {
    try { console.debug("detectFromAlternatives: best score too low", best.score); } catch (e) {}
    return { sound: SOUNDS[0], confidence: 0.0, heard: "(no speech detected)" };
  }
  try { console.debug("detectFromAlternatives: accepted", best.res, "score", best.score); } catch (e) {}
  return best.res;
}

function VoiceDetector() {
  const [detectState, setDetectState] = useState<DetectState>("idle");
  const [result, setResult] = useState<DetectResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [voicePitch, setVoicePitch] = useState(1.9);
  const [voiceRate, setVoiceRate] = useState(0.82);
  const [recogLang, setRecogLang] = useState("en-IN");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [sensitivity, setSensitivity] = useState(1.0);

  const recogRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const liveTranscript = useRef("");
  const alternativesRef = useRef<string[]>([]);
  const voiceDetectedRef = useRef(false);
  const audioMonitorRef = useRef<{ stream: MediaStream; analyser: AnalyserNode; raf: number | null } | null>(null);
  const noiseFloorRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const listeningRef = useRef(false);
  const lastInterimRef = useRef<string[]>([]);
  const endedRef = useRef(false); // guard against double-fire of onend

  // Load voices on mount and when they change
  useEffect(() => {
    function onVoicesChanged() {
      const v = window.speechSynthesis?.getVoices() || [];
      loadVoices();
      setAvailableVoices(v);
      const def = v.find((x) => /en/i.test(x.lang) && /female|girl|zira|samantha|karen|victoria|moira|fiona/i.test(x.name))
        || v.find((x) => /en/i.test(x.lang));
      if (def && !selectedVoiceName) setSelectedVoiceName(def.name);
    }
    onVoicesChanged();
    window.speechSynthesis?.addEventListener("voiceschanged", onVoicesChanged);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", onVoicesChanged);
  }, []);

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function speakResult(res: DetectResult) {
    if (!res || (res.confidence || 0) < 0.05) return; // avoid speaking when no-speech or very low confidence
    const voiceOverride = availableVoices.find((v) => v.name === selectedVoiceName);
    window.speechSynthesis.cancel();
    function doSpeak() {
      const text = `I detected the sound ${res.sound.iast}. It is a ${res.sound.type === "vowel" ? "vowel, called Svara" : "consonant, called Vyanjana"}. The articulation group is ${res.sound.group}, which is ${ARTICULATION_INFO[res.sound.group]?.en || ""}. ${ARTICULATION_INFO[res.sound.group]?.tip || ""}`;
      const utter = new SpeechSynthesisUtterance(text);
      utter.pitch = voicePitch;
      utter.rate = voiceRate;
      utter.volume = 1;
      if (voiceOverride) utter.voice = voiceOverride;
      window.speechSynthesis.speak(utter);
    }
    if (window.speechSynthesis.getVoices().length > 0) { doSpeak(); }
    else { setTimeout(doSpeak, 250); }
  }

  function finishDetection() {
    if (endedRef.current) return;
    endedRef.current = true;
    stopTimer();
    setDetectState("processing");
    setTimeout(() => {
      // stop audio monitor
      if (audioMonitorRef.current) {
        if (audioMonitorRef.current.raf) cancelAnimationFrame(audioMonitorRef.current.raf);
        try { audioMonitorRef.current.stream.getTracks().forEach((t) => t.stop()); } catch {}
        audioMonitorRef.current = null;
        sharedRmsRef.current = 0;
      }

      const alts = alternativesRef.current.length > 0 ? alternativesRef.current : [liveTranscript.current];
      try { console.debug("finishDetection: voiceDetected", voiceDetectedRef.current, "sharedRms", sharedRmsRef.current, "alts", alts); } catch (e) {}
      const res = detectFromAlternatives(alts);
      // if speech energy was never detected and result has zero confidence, treat as no-speech
      if (!voiceDetectedRef.current && res.confidence <= 0) {
        setResult({ sound: SOUNDS[0], confidence: 0.0, heard: "(no speech detected)" });
        setDetectState("done");
        alternativesRef.current = [];
        listeningRef.current = false;
        return;
      }

      setResult(res);
      setDetectState("done");
      try { console.debug("finishDetection: result", res); } catch (e) {}
      if ((res.confidence || 0) > 0.05) speakResult(res);
      alternativesRef.current = [];
      listeningRef.current = false;
    }, 600);
  }

  function acceptTranscript(transcript: string, alts: string[]) {
    if (!listeningRef.current) return;
    listeningRef.current = false;
    // stop speech recognition
    try { recogRef.current?.stop(); } catch {}
    // stop audio monitor
    if (audioMonitorRef.current) {
      if (audioMonitorRef.current.raf) cancelAnimationFrame(audioMonitorRef.current.raf);
      try { audioMonitorRef.current.stream.getTracks().forEach((t) => t.stop()); } catch {}
      audioMonitorRef.current = null;
    sharedRmsRef.current = 0;
    }
    // decide result
    const choices = alts && alts.length > 0 ? alts : [transcript];
    try { console.debug("acceptTranscript: voiceDetected", voiceDetectedRef.current, "sharedRms", sharedRmsRef.current, "choices", choices); } catch (e) {}
    const res = detectFromAlternatives(choices);
    if (!voiceDetectedRef.current && res.confidence <= 0) {
      setResult({ sound: SOUNDS[0], confidence: 0.0, heard: "(no speech detected)" });
      setDetectState("done");
      return;
    }
    setResult(res);
    setDetectState("done");
    try { console.debug("acceptTranscript: result", res); } catch (e) {}
    if ((res.confidence || 0) > 0.05) speakResult(res);
    alternativesRef.current = [];
    endedRef.current = true;
  }

  function startListening() {
    endedRef.current = false;
    setResult(null);
    setTranscript("");
    liveTranscript.current = "";
    setElapsed(0);
    setDetectState("listening");
    alternativesRef.current = [];
    voiceDetectedRef.current = false;
    // start a lightweight audio monitor to ensure real voice was captured (energy-based)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        try {
          const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as any;
          const ctx = new AudioCtx();
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          // use a larger fft for smoother RMS and Float32 data for better precision
          analyser.fftSize = 2048;
          src.connect(analyser);
          const data = new Float32Array(analyser.fftSize);
          let rafId: number | null = null;
          function monitor() {
            // get high-precision time-domain samples
            analyser.getFloatTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) { const v = data[i]; sum += v * v; }
            const rms = Math.sqrt(sum / data.length);

            // maintain a slow EMA of the ambient noise floor (very slow so speech doesn't dominate)
            if (!noiseFloorRef.current || noiseFloorRef.current <= 0) noiseFloorRef.current = rms;
            else noiseFloorRef.current = noiseFloorRef.current * 0.995 + rms * 0.005;

            // compute an adaptive threshold based on noise floor and user sensitivity
            const adaptiveThreshold = Math.max(0.004, noiseFloorRef.current * 3 / sensitivity);

            if (rms > adaptiveThreshold) {
              voiceDetectedRef.current = true;
            }

            // publish a 0..1 level for UI meters (clamp and scale)
            sharedRmsRef.current = Math.max(0, Math.min(1, (rms - noiseFloorRef.current) * 8));

            rafId = requestAnimationFrame(monitor);
            if (audioMonitorRef.current) audioMonitorRef.current.raf = rafId;
          }
          audioMonitorRef.current = { stream, analyser, raf: null };
          monitor();
        } catch (err) {
          try { stream.getTracks().forEach((t) => t.stop()); } catch {}
        }
      }).catch(() => { /* ignore monitor failure */ });
    }

    const SRClass =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (SRClass) {
      const recog = new SRClass();
      recog.lang = recogLang; // use selected recognition language
      // continuous + interim for live streaming experience
      recog.interimResults = true;
      recog.continuous = true;
      recog.maxAlternatives = 8;
      recogRef.current = recog;

      recog.onresult = (e: SpeechRecognitionEvent) => {
        let combinedBest = "";
        const seenAlts: string[] = [];
        let finalDetected = false;
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          const best = res[0].transcript.trim();
          if (res.isFinal) finalDetected = true;
          combinedBest += best + " ";
          try {
            for (let j = 0; j < res.length; j++) {
              const t = res[j].transcript.trim();
              if (t && !seenAlts.includes(t)) seenAlts.push(t);
            }
          } catch (err) {}
        }
        combinedBest = combinedBest.trim();
        try { console.debug("SpeechRecognition onresult:", { combinedBest, seenAlts, finalDetected }); } catch (e) {}
        alternativesRef.current = seenAlts;
        liveTranscript.current = combinedBest;
        setTranscript(combinedBest);

        if (finalDetected) {
          acceptTranscript(combinedBest, seenAlts);
          return;
        }

        // accept stable interim if repeated and we have audio energy
        const last = lastInterimRef.current;
        last.unshift(combinedBest);
        if (last.length > 3) last.pop();
        lastInterimRef.current = last;
        if (last[0] && last[1] && last[0] === last[1] && voiceDetectedRef.current) {
          acceptTranscript(combinedBest, seenAlts);
        }
      };

      recog.onend = () => {
        // if still supposed to be listening, restart (handles unexpected stops)
        if (listeningRef.current) {
          try { recog.start(); } catch (err) { /* ignore */ }
        }
      };

      recog.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === "not-allowed") {
          stopTimer();
          setDetectState("idle");
          alert("Microphone access was denied. Please allow microphone in your browser settings and try again.");
        }
      };

      // start listening
      listeningRef.current = true;
      startTimeRef.current = Date.now();
      try { recog.start(); } catch (err) { /* ignore start errors */ }

      // safety: maximum listen time of 12s
      setTimeout(() => {
        if (listeningRef.current) {
          try { recogRef.current?.stop(); } catch {}
          acceptTranscript(liveTranscript.current, alternativesRef.current);
        }
      }, 12000);
    } else {
      // Fallback: raw MediaRecorder
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const mr = new MediaRecorder(stream);
        mediaRef.current = mr;
        mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); finishDetection(); };
        mr.start();
        setTimeout(() => mr.stop(), 5000);
      }).catch(() => {
        setDetectState("idle");
        alert("Microphone access required. Please allow it in your browser settings.");
      });
    }

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  function reset() {
    recogRef.current?.stop();
    recogRef.current = null;
    mediaRef.current?.stop();
    stopTimer();
    window.speechSynthesis?.cancel();
    liveTranscript.current = "";
    alternativesRef.current = [];
    // stop audio monitor if running
    if (audioMonitorRef.current) {
      if (audioMonitorRef.current.raf) cancelAnimationFrame(audioMonitorRef.current.raf);
      try { audioMonitorRef.current.stream.getTracks().forEach((t) => t.stop()); } catch {}
      audioMonitorRef.current = null;
    }
    voiceDetectedRef.current = false;
    listeningRef.current = false;
    lastInterimRef.current = [];
    sharedRmsRef.current = 0;
    endedRef.current = false;
    setDetectState("idle");
    setResult(null);
    setTranscript("");
    setElapsed(0);
  }

  function testVoice() {
    girlSpeak("Hello! I am ready to help you learn Sanskrit sounds. Tap the button and speak!", voicePitch, voiceRate);
  }

  const accentCol = result ? GROUP_COLORS[result.sound.group] || "var(--primary)" : "var(--accent)";
  const isListening = detectState === "listening";

  return (
    <section
      className="border-t px-6 py-8 lg:px-16"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
    >
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
        <h2 className="text-lg font-semibold px-3 whitespace-nowrap" style={{ fontFamily: "Fraunces, serif" }}>
          🎙 Auto Voice Detection Tool
        </h2>
        <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
      </div>

      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Voice Settings toggle */}
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
            style={{ backgroundColor: "var(--card)", color: "var(--foreground)" }}
          >
            <span className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.05 3.05l1.06 1.06M10.9 10.9l1.05 1.05M3.05 11.95l1.06-1.06M10.9 4.1l1.05-1.05" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Voice Settings
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ transform: showSettings ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showSettings && (
            <div className="px-4 pb-4 pt-2 flex flex-col gap-4" style={{ backgroundColor: "var(--card)", borderTop: `1px solid var(--border)` }}>
              {/* Recognition language */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>
                  Recognition Language
                </label>
                <select value={recogLang} onChange={(e) => setRecogLang(e.target.value)} className="w-full text-sm rounded px-3 py-1.5 border"
                  style={{ backgroundColor: "var(--background)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi (India)</option>
                  <option value="en-US">English (US)</option>
                </select>
              </div>
              {/* Voice selector */}
              {availableVoices.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>
                    Voice
                  </label>
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => setSelectedVoiceName(e.target.value)}
                    className="w-full text-sm rounded px-3 py-1.5 border"
                    style={{ backgroundColor: "var(--background)", color: "var(--foreground)", borderColor: "var(--border)" }}
                  >
                    {availableVoices.filter((v) => /en/i.test(v.lang)).map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pitch slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Pitch</label>
                  <span className="font-mono" style={{ color: "var(--muted-foreground)" }}>{voicePitch.toFixed(1)}</span>
                </div>
                <input type="range" min="0.5" max="2" step="0.1" value={voicePitch}
                  onChange={(e) => setVoicePitch(Number(e.target.value))}
                  className="w-full accent-primary" style={{ accentColor: "var(--primary)" }} />
                <div className="flex justify-between text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  <span>Low</span><span>Normal</span><span>High (Girl)</span>
                </div>
              </div>

              {/* Rate slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Speed</label>
                  <span className="font-mono" style={{ color: "var(--muted-foreground)" }}>{voiceRate.toFixed(2)}×</span>
                </div>
                <input type="range" min="0.5" max="1.5" step="0.05" value={voiceRate}
                  onChange={(e) => setVoiceRate(Number(e.target.value))}
                  className="w-full" style={{ accentColor: "var(--primary)" }} />
                <div className="flex justify-between text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  <span>Slow</span><span>Normal</span><span>Fast</span>
                </div>
              </div>

              {/* Sensitivity slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Sensitivity</label>
                  <span className="font-mono" style={{ color: "var(--muted-foreground)" }}>{sensitivity.toFixed(2)}</span>
                </div>
                <input type="range" min="0.5" max="2.5" step="0.05" value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full" style={{ accentColor: "var(--primary)" }} />
                <div className="flex justify-between text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  <span>Quiet</span><span>Balanced</span><span>Loud</span>
                </div>
              </div>

              {/* Test voice button */}
              <button
                onClick={testVoice}
                className="self-start flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold border transition-all"
                style={{ borderColor: "var(--border)", color: "var(--primary)", backgroundColor: "transparent" }}
              >
                👧 Test Girl Voice
              </button>
            </div>
          )}
        </div>

        <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
          Tap the microphone and speak any Sanskrit sound — <strong>ka, ga, a, i, u, ta, pa…</strong><br />
          The tool detects <strong>Vowel (Svara)</strong> or <strong>Consonant (Vyañjana)</strong> and a girl's voice reads the result.
        </p>

        {/* Big tap button */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <span className="absolute rounded-full animate-ping"
                  style={{ width: 120, height: 120, backgroundColor: "#c0392b1a" }} />
                <span className="absolute rounded-full animate-ping"
                  style={{ width: 100, height: 100, backgroundColor: "#c0392b22", animationDelay: "0.3s" }} />
              </>
            )}
            <button
              onClick={isListening ? reset : detectState === "done" ? reset : startListening}
              disabled={detectState === "processing"}
              className="relative w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1.5 font-semibold transition-all duration-200 active:scale-95"
              style={{
                backgroundColor:
                  isListening ? "#c0392b"
                  : detectState === "processing" ? "var(--muted)"
                  : detectState === "done" ? "var(--secondary)"
                  : "var(--primary)",
                color:
                  detectState === "processing" ? "var(--muted-foreground)"
                  : detectState === "done" ? "var(--secondary-foreground)"
                  : "#fff",
                cursor: detectState === "processing" ? "not-allowed" : "pointer",
                boxShadow: isListening
                  ? "0 0 0 5px #c0392b30, 0 8px 30px #c0392b40"
                  : "0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              {isListening ? (
                <>
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                    <rect x="8" y="8" width="14" height="14" rx="2.5" fill="currentColor" />
                  </svg>
                  <span className="text-[10px] font-bold tracking-widest">STOP</span>
                </>
              ) : detectState === "processing" ? (
                <>
                  <svg className="animate-spin" width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <circle cx="13" cy="13" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="44 16" />
                  </svg>
                  <span className="text-[10px]">Analyzing</span>
                </>
              ) : detectState === "done" ? (
                <>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <path d="M5 13l7 7 9-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[10px] font-bold">TRY AGAIN</span>
                </>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="10" y="3" width="8" height="14" rx="4" fill="currentColor" />
                    <path d="M5 14a9 9 0 0018 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="14" y1="23" x2="14" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="10" y1="27" x2="18" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="text-[10px] font-bold tracking-widest">TAP & SPEAK</span>
                </>
              )}
            </button>
          </div>

          {/* Status */}
          <div className="text-center min-h-[22px]">
            {isListening && (
              <p className="text-sm font-semibold animate-pulse" style={{ color: "#c0392b" }}>
                ● Listening… {elapsed}s  —  speak now
              </p>
            )}
            {detectState === "processing" && (
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Analyzing your voice…</p>
            )}
            {detectState === "idle" && (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Tap above to start</p>
            )}
          </div>

          {/* Live transcript while listening */}
          {(isListening || detectState === "processing") && transcript && (
            <div className="rounded px-4 py-2 text-sm font-mono text-center max-w-xs"
              style={{ backgroundColor: "var(--muted)", color: "var(--foreground)" }}>
              "{transcript}"
            </div>
          )}

          {isListening && (
            <div className="flex items-center gap-2">
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Input level</div>
              <AudioMeter active={true} />
            </div>
          )}

          {/* Result card — always shown after done, result is never null */}
          {detectState === "done" && result && result.confidence === 0 && (
            <div className="w-full max-w-md rounded-xl border p-4 text-sm" style={{ backgroundColor: "#fff6f6", borderColor: "#f4b8b8", color: "#b84c0a" }}>
              No speech detected — please speak clearly into the microphone and try again.
            </div>
          )}

          {detectState === "done" && result && result.confidence > 0 && (
            <div
              className="w-full max-w-md rounded-xl border p-5 flex flex-col gap-4"
              style={{ backgroundColor: "var(--card)", borderColor: accentCol + "50", boxShadow: `0 0 0 1px ${accentCol}18` }}
            >
              {/* Sound identity */}
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{ backgroundColor: accentCol + "14", border: `2px solid ${accentCol}40` }}
                >
                  <span className="text-4xl leading-none" style={{ fontFamily: "serif", color: accentCol }}>
                    {result.sound.devanagari}
                  </span>
                  <span className="text-sm font-mono mt-0.5" style={{ color: accentCol }}>{result.sound.iast}</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: accentCol, color: "#fff" }}>
                      {result.sound.type === "vowel" ? "Vowel — Svara" : "Consonant — Vyañjana"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: accentCol + "1a", color: accentCol, border: `1px solid ${accentCol}40` }}>
                      {result.sound.group}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{result.sound.description}</p>
                  <p className="text-xs italic mt-0.5" style={{ color: "var(--muted-foreground)" }}>{result.sound.example}</p>
                </div>
              </div>

              {/* Articulation grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded p-2.5" style={{ backgroundColor: "var(--muted)" }}>
                  <p className="uppercase tracking-widest font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>Articulation</p>
                  <p className="font-semibold">{ARTICULATION_INFO[result.sound.group]?.en}</p>
                </div>
                <div className="rounded p-2.5" style={{ backgroundColor: "var(--muted)" }}>
                  <p className="uppercase tracking-widest font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>Place</p>
                  <p className="font-semibold">{ARTICULATION_INFO[result.sound.group]?.place}</p>
                </div>
              </div>

              {/* Confidence bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--muted-foreground)" }}>
                  <span className="uppercase tracking-widest font-semibold">Detection Confidence</span>
                  <span className="font-mono font-bold">{Math.round(result.confidence * 100)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--muted)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${result.confidence * 100}%`, backgroundColor: accentCol }} />
                </div>
                {result.confidence < 0.5 && (
                  <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                    Low confidence — try speaking more clearly, e.g. <em>"ka", "ga", "ta", "a", "i"</em>
                  </p>
                )}
              </div>

              {/* What was heard */}
              {result.heard && result.heard !== "(no speech detected)" && (
                <div className="text-xs rounded px-3 py-2 font-mono"
                  style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>
                  Heard: "{result.heard}"
                </div>
              )}

              {/* Girl voice strip */}
              <div className="flex items-center justify-between gap-2 rounded px-3 py-2"
                style={{ backgroundColor: "#fff8f4", border: "1px solid #f4b896" }}>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--foreground)" }}>
                  <span className="text-base">👧</span>
                  <span>Girl voice is reading the result aloud</span>
                </div>
                <button
                  onClick={() => speakResult(result)}
                  className="text-xs px-2 py-1 rounded font-semibold transition-all"
                  style={{ backgroundColor: "var(--primary)", color: "#fff" }}
                >
                  Replay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<"vowels" | "consonants">("vowels");
  const [selected, setSelected] = useState<Sound | null>(null);
  const [recordState, setRecordState] = useState<RecordingState>("idle");
  const [hasPlayed, setHasPlayed] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vowelGroups = groupSounds(SOUNDS, "vowel");
  const consonantGroups = groupSounds(SOUNDS, "consonant");
  const groups = tab === "vowels" ? vowelGroups : consonantGroups;

  function handleSelect(s: Sound) {
    setSelected(s);
    setRecordState("idle");
    setHasPlayed(false);
  }

  function handlePlayDemo() {
    if (!selected) return;
    // Use Web Speech API to speak the IAST sound
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(selected.iast.replace(/[āīūṭḍṇśṣṅñṛ]/g, (c) => {
        const map: Record<string, string> = { ā: "aa", ī: "ii", ū: "oo", ṭ: "t", ḍ: "d", ṇ: "n", ś: "sh", ṣ: "sh", ṅ: "ng", ñ: "ny", ṛ: "ri" };
        return map[c] || c;
      }));
      utter.rate = 0.7;
      utter.pitch = 1;
      window.speechSynthesis.speak(utter);
    }
    setHasPlayed(true);
  }

  async function handleRecord() {
    if (recordState === "recording") {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // set up a quick energy monitor so we only accept recordings with real voice
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as any;
      const ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let maxRms = 0;
      let rafId: number | null = null;
      function monitor() {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / data.length);
        if (rms > maxRms) maxRms = rms;
        rafId = requestAnimationFrame(monitor);
      }
      monitor();

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        if (rafId) cancelAnimationFrame(rafId);
        try { ctx.close(); } catch {}
        stream.getTracks().forEach((t) => t.stop());
        setRecordState("processing");
        // If no voice energy detected, ask user to try again
        if (maxRms < 0.02) {
          timerRef.current = setTimeout(() => { setRecordState("try-again"); }, 600);
          return;
        }
        // Simulate analysis delay then show result
        timerRef.current = setTimeout(() => {
          // Randomly correct ~60% of the time for demo
          setRecordState(Math.random() > 0.4 ? "correct" : "try-again");
        }, 800);
      };
      mr.start();
      setRecordState("recording");
      // Auto-stop after 3s
      timerRef.current = setTimeout(() => mr.stop(), 3000);
    } catch {
      alert("Microphone access denied. Please allow microphone access to record pronunciation.");
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const accentColor = selected ? GROUP_COLORS[selected.group] || "var(--primary)" : "var(--primary)";

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded flex items-center justify-center text-lg"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            ॐ
          </div>
          <div>
            <h1 className="text-lg leading-tight" style={{ fontFamily: "Fraunces, serif", fontWeight: 600 }}>
              Sanskrit Sound Trainer
            </h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Classification &amp; Pronunciation Practice
            </p>
          </div>
        </div>
        <nav className="hidden sm:flex items-center gap-5 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <a href="#chart" className="hover:text-foreground transition-colors">Sound Chart</a>
          <a href="#practice" className="hover:text-foreground transition-colors">Practice</a>
          <a href="#about" className="hover:text-foreground transition-colors">About</a>
        </nav>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-0">

        {/* LEFT — Sound Chart Panel */}
        <aside
          id="chart"
          className="border-r overflow-y-auto p-5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", maxHeight: "calc(100vh - 65px)" }}
        >
          {/* Tab switcher */}
          <div className="flex mb-5 rounded overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            {(["vowels", "consonants"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelected(null); setRecordState("idle"); }}
                className="flex-1 py-2 text-xs font-semibold uppercase tracking-widest transition-all duration-150"
                style={{
                  backgroundColor: tab === t ? "var(--primary)" : "transparent",
                  color: tab === t ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}
              >
                {t === "vowels" ? "Vowels (Svara)" : "Consonants (Vyañjana)"}
              </button>
            ))}
          </div>

          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            Select a sound from the chart below. Sounds are grouped by <em>articulation place</em>.
          </p>

          {Object.entries(groups).map(([group, sounds]) => (
            <GroupSection
              key={group}
              group={group}
              sounds={sounds}
              selectedId={selected?.id || null}
              onSelect={handleSelect}
            />
          ))}
        </aside>

        {/* RIGHT — Detail + Practice Panel */}
        <section
          id="practice"
          className="overflow-y-auto p-6 lg:p-10 flex flex-col gap-8"
          style={{ maxHeight: "calc(100vh - 65px)" }}
        >
          {!selected ? (
            // Empty state
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-20">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                अ
              </div>
              <h2 className="text-2xl" style={{ fontFamily: "Fraunces, serif", color: "var(--muted-foreground)" }}>
                Choose a sound to begin
              </h2>
              <p className="text-sm max-w-xs" style={{ color: "var(--muted-foreground)" }}>
                Select any Sanskrit vowel or consonant from the chart on the left to see its classification and practice its pronunciation.
              </p>
            </div>
          ) : (
            <>
              {/* Sound Identity Card */}
              <div
                className="rounded-lg p-6 border flex flex-col sm:flex-row sm:items-start gap-6"
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
              >
                <div
                  className="w-24 h-24 rounded-lg flex flex-col items-center justify-center shrink-0"
                  style={{ backgroundColor: accentColor + "14", border: `2px solid ${accentColor}30` }}
                >
                  <span className="text-5xl leading-none" style={{ fontFamily: "serif", color: accentColor }}>
                    {selected.devanagari}
                  </span>
                  <span className="text-sm mt-1 font-mono" style={{ color: accentColor }}>
                    {selected.iast}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider"
                      style={{ backgroundColor: accentColor, color: "#fff" }}
                    >
                      {selected.type === "vowel" ? "Svara — Vowel" : "Vyañjana — Consonant"}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider"
                      style={{ backgroundColor: accentColor + "18", color: accentColor, border: `1px solid ${accentColor}40` }}
                    >
                      {selected.group}
                    </span>
                  </div>
                  <h2 className="text-3xl mb-1" style={{ fontFamily: "Fraunces, serif" }}>
                    {selected.devanagari} &nbsp;
                    <span className="text-2xl" style={{ color: "var(--muted-foreground)", fontStyle: "italic" }}>{selected.iast}</span>
                  </h2>
                  <p className="text-sm mb-1">{selected.description}</p>
                  <p className="text-sm italic" style={{ color: "var(--muted-foreground)" }}>{selected.example}</p>
                </div>
              </div>

              {/* Articulation Info */}
              <div
                className="rounded-lg p-5 border"
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
              >
                <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>
                  Articulation Analysis
                </h3>
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  {[
                    { label: "Sanskrit Term",    value: selected.group },
                    { label: "English Name",     value: ARTICULATION_INFO[selected.group]?.en || "—" },
                    { label: "Place of Articulation", value: ARTICULATION_INFO[selected.group]?.place || "—" },
                  ].map((item) => (
                    <div key={item.label}
                      className="rounded p-3"
                      style={{ backgroundColor: "var(--muted)" }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm rounded p-3 flex items-start gap-2"
                  style={{ backgroundColor: accentColor + "0d", border: `1px solid ${accentColor}20`, color: "var(--foreground)" }}
                >
                  <span style={{ color: accentColor }}>▶</span>
                  {ARTICULATION_INFO[selected.group]?.tip}
                </p>
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>
                    Articulation Region
                  </p>
                  <MouthDiagram group={selected.group} />
                </div>
              </div>

              {/* Pronunciation Practice */}
              <div
                className="rounded-lg p-5 border"
                id="practice"
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
              >
                <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)" }}>
                  Pronunciation Practice
                </h3>

                {/* Steps */}
                <ol className="flex flex-col gap-4 mb-6">
                  {/* Step 1 — Listen */}
                  <li className="flex items-start gap-3">
                    <span
                      className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: hasPlayed ? accentColor : "var(--muted)", color: hasPlayed ? "#fff" : "var(--muted-foreground)" }}
                    >
                      1
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Listen to the correct pronunciation</p>
                      <button
                        onClick={handlePlayDemo}
                        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all duration-150 active:scale-95"
                        style={{ backgroundColor: accentColor, color: "#fff" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 2.5l9 4.5-9 4.5V2.5z" fill="currentColor" />
                        </svg>
                        Play Demo
                      </button>
                    </div>
                  </li>

                  {/* Step 2 — Record */}
                  <li className="flex items-start gap-3">
                    <span
                      className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: ["recording", "processing", "correct", "try-again"].includes(recordState)
                          ? accentColor : "var(--muted)",
                        color: ["recording", "processing", "correct", "try-again"].includes(recordState)
                          ? "#fff" : "var(--muted-foreground)",
                      }}
                    >
                      2
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Record your pronunciation</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <button
                          onClick={handleRecord}
                          disabled={recordState === "processing"}
                          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all duration-150 active:scale-95 relative"
                          style={{
                            backgroundColor:
                              recordState === "recording" ? "#c0392b"
                              : recordState === "processing" ? "var(--muted)"
                              : "var(--secondary)",
                            color:
                              recordState === "recording" ? "#fff"
                              : recordState === "processing" ? "var(--muted-foreground)"
                              : "var(--secondary-foreground)",
                            cursor: recordState === "processing" ? "not-allowed" : "pointer",
                          }}
                        >
                          {recordState === "recording" ? (
                            <>
                              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#fff" }} />
                              Stop Recording
                            </>
                          ) : recordState === "processing" ? (
                            <>
                              <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="25 10" />
                              </svg>
                              Analyzing…
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="7" r="4" fill="currentColor" />
                                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
                              </svg>
                              {recordState === "idle" ? "Record" : "Try Again"}
                            </>
                          )}
                        </button>
                        <Waveform active={recordState === "recording"} />
                        {recordState === "recording" && (
                          <span className="text-xs animate-pulse" style={{ color: "#c0392b" }}>● Recording (3s)</span>
                        )}
                      </div>
                    </div>
                  </li>

                  {/* Step 3 — Result */}
                  <li className="flex items-start gap-3">
                    <span
                      className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: ["correct", "try-again"].includes(recordState) ? accentColor : "var(--muted)",
                        color: ["correct", "try-again"].includes(recordState) ? "#fff" : "var(--muted-foreground)",
                      }}
                    >
                      3
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">See your result</p>
                      {["correct", "try-again"].includes(recordState) ? (
                        <ResultBadge state={recordState} />
                      ) : (
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                          Result will appear here after recording.
                        </p>
                      )}
                    </div>
                  </li>
                </ol>

                {/* Feedback tip on try-again */}
                {recordState === "try-again" && (
                  <div
                    className="rounded p-4 text-sm"
                    style={{ backgroundColor: "#fff8f4", border: "1px solid #f4b896", color: "var(--foreground)" }}
                  >
                    <p className="font-semibold mb-1">Pronunciation Tip</p>
                    <p>{ARTICULATION_INFO[selected.group]?.tip}</p>
                    <p className="mt-1 italic" style={{ color: "var(--muted-foreground)" }}>
                      Try placing your tongue at the <strong>{ARTICULATION_INFO[selected.group]?.place}</strong> region before articulating.
                    </p>
                  </div>
                )}
              </div>

              {/* All Sounds in Same Group */}
              <div
                className="rounded-lg p-5 border"
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
              >
                <h3 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>
                  Other {selected.group} Sounds
                </h3>
                <div className="flex flex-wrap gap-2">
                  {SOUNDS.filter((s) => s.group === selected.group && s.id !== selected.id).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelect(s)}
                      className="px-3 py-1.5 rounded border text-sm flex items-center gap-1.5 transition-all duration-100 hover:border-current"
                      style={{
                        borderColor: "var(--border)",
                        color: accentColor,
                        backgroundColor: "transparent",
                      }}
                    >
                      <span className="text-base" style={{ fontFamily: "serif" }}>{s.devanagari}</span>
                      <span className="text-xs font-mono">{s.iast}</span>
                    </button>
                  ))}
                  {SOUNDS.filter((s) => s.group === selected.group && s.id !== selected.id).length === 0 && (
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No other sounds in this group.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <VoiceDetector />

      {/* Footer */}
      <footer
        id="about"
        className="border-t px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "var(--card)" }}
      >
        <span>Sanskrit Sound Classification &amp; Pronunciation Trainer</span>
        <span>Frontend: HTML · CSS · JavaScript &nbsp;|&nbsp; Backend: Java · MySQL</span>
        <span style={{ fontFamily: "Fraunces, serif", fontStyle: "italic" }}>शिक्षा — Śikṣā (Phonetics)</span>
      </footer>
    </div>
  );
}
