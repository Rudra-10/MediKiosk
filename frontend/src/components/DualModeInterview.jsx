import React, { useState, useEffect, useRef, useCallback } from "react";
import { submitPatientIntake } from "../services/apiService";

// ─── Multilingual AI Question Banks ─────────────────────────────────────────
const QUESTIONS = {
  hi: [
    "नमस्ते! आज आप किस समस्या के लिए यहाँ आए हैं?",
    "यह समस्या कितने दिनों से है?",
    "क्या आपको बुखार भी है?",
    "खाना खाने के बाद तकलीफ बढ़ती है या घटती है?",
    "क्या आप कोई दवाई ले रहे हैं?",
  ],
  en: [
    "Hello! What health concern brings you here today?",
    "How many days have you had this problem?",
    "Do you also have a fever?",
    "Does your discomfort increase or decrease after eating?",
    "Are you currently taking any medication?",
  ],
  mr: [
    "नमस्कार! आज तुम्ही कोणत्या समस्येसाठी आलात?",
    "ही समस्या किती दिवसांपासून आहे?",
    "तुम्हाला ताप आहे का?",
    "जेवणानंतर त्रास वाढतो की कमी होतो?",
    "तुम्ही कोणतीही औषधे घेत आहात का?",
  ],
  gu: [
    "નમસ્તે! આજે તમે કઈ સમસ્યા માટે આવ્યા છો?",
    "આ સમસ્યા કેટલા દિવસોથી છે?",
    "શું તમને તાવ પણ છે?",
    "જમ્યા પછી તકલીફ વધે છે કે ઘટે છે?",
    "શું તમે કોઈ દવા લઈ રહ્યા છો?",
  ],
};

// ─── Symptom Touch Tiles ─────────────────────────────────────────────────────
const SYMPTOM_TILES = [
  {
    id: "head",
    emoji: "🤕",
    label: { hi: "सिर / गला", en: "Head / Throat", mr: "डोके / घसा", gu: "માથું / ગળું" },
    color: "from-violet-600 to-purple-700",
    glow: "shadow-purple-500/40",
    border: "border-purple-500",
  },
  {
    id: "chest",
    emoji: "🫁",
    label: { hi: "छाती / सांस", en: "Chest / Breath", mr: "छाती / श्वास", gu: "છાતી / શ્વાસ" },
    color: "from-sky-600 to-blue-700",
    glow: "shadow-sky-500/40",
    border: "border-sky-500",
  },
  {
    id: "upper_abdomen",
    emoji: "🔥",
    label: { hi: "पेट / एसिडिटी", en: "Upper Abdomen", mr: "पोट / आम्लपित्त", gu: "પેટ / એસિડિટી" },
    color: "from-orange-600 to-amber-700",
    glow: "shadow-orange-500/40",
    border: "border-orange-500",
  },
  {
    id: "joints",
    emoji: "🦴",
    label: { hi: "जोड़ / हड्डियाँ", en: "Joints / Bones", mr: "सांधे / हाडे", gu: "સાંધા / હાડકાં" },
    color: "from-teal-600 to-cyan-700",
    glow: "shadow-teal-500/40",
    border: "border-teal-500",
  },
  {
    id: "lower_abdomen",
    emoji: "🩺",
    label: { hi: "पेट के नीचे", en: "Lower Abdomen", mr: "खालचे पोट", gu: "નીચલું પેટ" },
    color: "from-rose-600 to-pink-700",
    glow: "shadow-rose-500/40",
    border: "border-rose-500",
  },
  {
    id: "fatigue",
    emoji: "😴",
    label: { hi: "थकान / कमज़ोरी", en: "Fatigue / Weakness", mr: "थकवा / अशक्तपणा", gu: "થાક / નબળાઈ" },
    color: "from-slate-600 to-gray-700",
    glow: "shadow-slate-500/40",
    border: "border-slate-500",
  },
];

// ─── Audio Waveform Bars (animated) ─────────────────────────────────────────
function WaveformBars({ active, color = "#34d399" }) {
  const BAR_COUNT = 28;
  return (
    <div className="flex items-center justify-center gap-[3px] h-16 w-full px-4">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const seed = Math.sin(i * 1.7) * 0.5 + 0.5;
        const delay = `${(i * 45) % 700}ms`;
        const baseH = active ? Math.max(8, Math.round(seed * 52)) : 4;
        return (
          <div
            key={i}
            className="rounded-full flex-shrink-0 transition-all"
            style={{
              width: "5px",
              height: `${baseH}px`,
              background: active ? color : "#334155",
              opacity: active ? 0.85 + seed * 0.15 : 0.3,
              animation: active ? `waveBar 0.7s ease-in-out ${delay} infinite alternate` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Pulsing Mic Button ──────────────────────────────────────────────────────
function MicButton({ isRecording, onClick, lang }) {
  const labels = {
    hi: { idle: "बोलने के लिए दबाएं", rec: "सुन रहे हैं… रोकने के लिए दबाएं" },
    en: { idle: "Tap to Speak",        rec: "Listening… Tap to Stop"          },
    mr: { idle: "बोलण्यासाठी दाबा",   rec: "ऐकत आहे… थांबण्यासाठी दाबा"    },
    gu: { idle: "બોલવા માટે દબાવો",   rec: "સાંભળી રહ્યા છે… રોકવા દબાવો" },
  };
  const l = labels[lang] || labels.en;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Outer pulse rings */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <>
            <span className="absolute inline-flex w-44 h-44 rounded-full bg-rose-500/20 animate-ping" style={{ animationDuration: "1.2s" }} />
            <span className="absolute inline-flex w-36 h-36 rounded-full bg-rose-500/25 animate-ping" style={{ animationDuration: "1.6s", animationDelay: "0.3s" }} />
          </>
        )}
        <button
          onClick={onClick}
          className={`
            relative w-32 h-32 rounded-full flex items-center justify-center
            border-4 text-6xl shadow-2xl transition-all duration-200 active:scale-90
            ${isRecording
              ? "bg-rose-600 border-rose-300 shadow-rose-500/60 animate-pulse"
              : "bg-emerald-600 border-emerald-300 shadow-emerald-500/40 hover:bg-emerald-500"}
          `}
          aria-label={isRecording ? l.rec : l.idle}
        >
          {isRecording ? "⏹" : "🎙️"}
        </button>
      </div>

      {/* Label */}
      <p className={`text-[18px] font-extrabold tracking-wide transition-colors ${isRecording ? "text-rose-300" : "text-emerald-300"}`}>
        {isRecording ? l.rec : l.idle}
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DualModeInterview({ abhaId, language = "hi", onComplete, onBack }) {
  const lang = ["hi", "en", "mr", "gu"].includes(language) ? language : "hi";

  const questions       = QUESTIONS[lang] || QUESTIONS.hi;
  const [qIndex, setQIndex]         = useState(0);
  const [isRecording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [selectedTiles, setTiles]   = useState([]);
  const [answers, setAnswers]       = useState([]);
  const [isSubmitting, setSubmit]   = useState(false);
  const [activeInput, setActiveInput] = useState(null); // "voice" | "touch"

  const mediaRef    = useRef(null);
  const chunksRef   = useRef([]);
  const recognRef   = useRef(null);

  const currentQ = questions[qIndex];

  // ── TTS: speak the current question ────────────────────────────────────────
  const speakQuestion = useCallback((text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : lang === "gu" ? "gu-IN" : "en-IN";
    utt.rate = 0.85;
    utt.pitch = 1.05;
    window.speechSynthesis.speak(utt);
  }, [lang]);

  useEffect(() => {
    speakQuestion(currentQ);
    return () => window.speechSynthesis?.cancel();
  }, [qIndex, speakQuestion, currentQ]);

  // ── Voice recording (MediaRecorder + Web Speech API) ───────────────────────
  const startRecording = async () => {
    setActiveInput("voice");
    setTiles([]);
    setRecording(true);

    // Web Speech API for live transcript
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : lang === "gu" ? "gu-IN" : "en-IN";
      recog.interimResults = true;
      recog.maxAlternatives = 1;
      recog.onresult = (e) => {
        const t = Array.from(e.results).map((r) => r[0].transcript).join(" ");
        setTranscript(t);
      };
      recog.onend = () => setRecording(false);
      recog.onerror = () => setRecording(false);
      recognRef.current = recog;
      recog.start();
    }

    // MediaRecorder for audio blob
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.start();
      mediaRef.current = mr;
    } catch {
      // Mic not available — still show UI
    }
  };

  const stopRecording = () => {
    recognRef.current?.stop();
    mediaRef.current?.stop();
    mediaRef.current?.stream?.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };

  const toggleRecording = () => (isRecording ? stopRecording() : startRecording());

  // ── Touch tile selection ────────────────────────────────────────────────────
  const toggleTile = (id) => {
    setActiveInput("touch");
    setTranscript("");
    setTiles((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // ── Build answer and advance ────────────────────────────────────────────────
  const handleNext = () => {
    const answer =
      activeInput === "voice"
        ? transcript || "[No voice response]"
        : selectedTiles.map((id) => {
            const tile = SYMPTOM_TILES.find((t) => t.id === id);
            return tile?.label[lang] || id;
          }).join(", ") || "[No selection]";

    const updated = [...answers, { question: currentQ, answer }];
    setAnswers(updated);

    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
      setTranscript("");
      setTiles([]);
      setActiveInput(null);
    } else {
      // Submit
      handleSubmit(updated);
    }
  };

  const handleSubmit = async (finalAnswers) => {
    setSubmit(true);
    const payload = {
      transcript: finalAnswers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n"),
      abhaId,
      language: lang,
    };
    const result = await submitPatientIntake(payload);
    if (onComplete) onComplete(result?.data || { transcript: payload.transcript, abha_id: abhaId });
  };

  const isAnswered = (activeInput === "voice" && transcript.length > 0) ||
                     (activeInput === "touch" && selectedTiles.length > 0);

  const progressPct = Math.round(((qIndex) / questions.length) * 100);

  const nextLabel = {
    hi: qIndex < questions.length - 1 ? "अगला प्रश्न ➔" : "सबमिट करें ✓",
    en: qIndex < questions.length - 1 ? "Next Question ➔" : "Submit ✓",
    mr: qIndex < questions.length - 1 ? "पुढील प्रश्न ➔" : "सबमिट करा ✓",
    gu: qIndex < questions.length - 1 ? "આગળ ➔" : "સબમિટ ✓",
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white flex flex-col select-none touch-manipulation overflow-hidden">

      {/* Injected animations */}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1);   }
        }
        @keyframes questionFade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .q-fade { animation: questionFade 0.4s ease-out; }
      `}</style>

      {/* ══════════════════════════════════════════════════
          PROGRESS BAR + STEP COUNTER
      ══════════════════════════════════════════════════ */}
      <div className="w-full bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="text-slate-400 hover:text-white text-2xl transition px-1">
            ←
          </button>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === "hi" ? "प्रश्न" : lang === "mr" ? "प्रश्न" : lang === "gu" ? "પ્રશ્ન" : "Question"}
          </span>
          <span className="text-[17px] font-black text-emerald-400">{qIndex + 1}</span>
          <span className="text-slate-600 text-[15px]">/ {questions.length}</span>
        </div>
        <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct + (100 / questions.length)}%` }}
          />
        </div>
        <button
          onClick={() => speakQuestion(currentQ)}
          className="text-[22px] text-slate-400 hover:text-emerald-400 transition"
          title="Repeat question"
        >
          🔊
        </button>
      </div>

      {/* ══════════════════════════════════════════════════
          TOP HALF — AI Question + Waveform
      ══════════════════════════════════════════════════ */}
      <div className="flex-[2] min-h-0 w-full flex flex-col items-center justify-center px-6 py-4 bg-gradient-to-b from-slate-900 to-slate-950 border-b-2 border-slate-800">

        {/* AI badge */}
        <div className="flex items-center gap-2 mb-4 bg-emerald-950/60 border border-emerald-500/30 rounded-full px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[13px] font-bold text-emerald-300 uppercase tracking-widest">
            {lang === "hi" ? "AI वैद्य पूछ रही है" : lang === "mr" ? "AI वैद्य विचारत आहे" : lang === "gu" ? "AI વૈદ્ય પૂછી રહ્યા છે" : "AyurGenix AI is asking"}
          </span>
        </div>

        {/* Question text — massive font */}
        <p
          key={qIndex}
          className="q-fade text-center text-[28px] md:text-[36px] lg:text-[42px] font-extrabold text-white leading-tight max-w-4xl"
        >
          {currentQ}
        </p>

        {/* Live transcript preview */}
        {transcript && (
          <div className="mt-4 bg-slate-800/80 border border-emerald-500/30 rounded-2xl px-5 py-3 max-w-2xl w-full">
            <p className="text-[16px] text-emerald-300 font-medium text-center leading-relaxed">
              🎙 &ldquo;{transcript}&rdquo;
            </p>
          </div>
        )}

        {/* Selected tiles preview */}
        {selectedTiles.length > 0 && !transcript && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {selectedTiles.map((id) => {
              const tile = SYMPTOM_TILES.find((t) => t.id === id);
              return (
                <span key={id} className="px-4 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 text-[16px] font-bold">
                  {tile?.emoji} {tile?.label[lang]}
                </span>
              );
            })}
          </div>
        )}

        {/* Waveform */}
        <div className="mt-4 w-full max-w-lg">
          <WaveformBars active={isRecording} color={isRecording ? "#f87171" : "#34d399"} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          BOTTOM HALF — Dual Input Interface
      ══════════════════════════════════════════════════ */}
      <div className="flex-[3] min-h-0 w-full flex flex-col lg:flex-row">

        {/* ── INPUT A: Voice Microphone ──────────────────────────────────── */}
        <div className={`
          flex-1 flex flex-col items-center justify-center p-6 border-b-2 lg:border-b-0 lg:border-r-2 transition-colors duration-300
          ${activeInput === "voice"
            ? "bg-rose-950/20 border-rose-800"
            : activeInput === "touch"
            ? "bg-slate-950 border-slate-800 opacity-60"
            : "bg-slate-950 border-slate-800"}
        `}>
          {/* Mode label */}
          <div className="mb-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${activeInput === "voice" ? "bg-rose-400 animate-pulse" : "bg-slate-600"}`} />
            <span className="text-[14px] font-extrabold text-slate-400 uppercase tracking-widest">
              {lang === "hi" ? "विकल्प A — आवाज़"
               : lang === "mr" ? "पर्याय A — आवाज"
               : lang === "gu" ? "વિકલ્પ A — અવાજ"
               : "Option A — Voice"}
            </span>
          </div>

          <MicButton isRecording={isRecording} onClick={toggleRecording} lang={lang} />
        </div>

        {/* ── OR divider ────────────────────────────────────────────────── */}
        <div className="flex lg:flex-col items-center justify-center px-4 py-2 lg:px-2 lg:py-6 bg-slate-900/50 z-10">
          <div className="flex-1 h-px lg:h-auto lg:w-px bg-slate-700 lg:flex-1" />
          <span className="px-3 py-2 text-[16px] font-black text-slate-500 uppercase">
            {lang === "hi" ? "या" : lang === "mr" ? "किंवा" : lang === "gu" ? "અથવા" : "OR"}
          </span>
          <div className="flex-1 h-px lg:h-auto lg:w-px bg-slate-700 lg:flex-1" />
        </div>

        {/* ── INPUT B: Symptom Touch Grid ────────────────────────────────── */}
        <div className={`
          flex-[2] flex flex-col p-4 transition-colors duration-300
          ${activeInput === "touch"
            ? "bg-slate-900/40"
            : activeInput === "voice"
            ? "bg-slate-950 opacity-60"
            : "bg-slate-950"}
        `}>
          {/* Mode label */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${activeInput === "touch" ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            <span className="text-[14px] font-extrabold text-slate-400 uppercase tracking-widest">
              {lang === "hi" ? "विकल्प B — लक्षण टच करें"
               : lang === "mr" ? "पर्याय B — लक्षण स्पर्श करा"
               : lang === "gu" ? "વિકલ્પ B — લક્ષણ સ્પર્શ કરો"
               : "Option B — Tap Your Symptom"}
            </span>
          </div>

          {/* 2×3 Symptom Grid */}
          <div className="grid grid-cols-3 gap-3 flex-1">
            {SYMPTOM_TILES.map((tile) => {
              const isSelected = selectedTiles.includes(tile.id);
              return (
                <button
                  key={tile.id}
                  onClick={() => toggleTile(tile.id)}
                  className={`
                    relative flex flex-col items-center justify-center rounded-2xl
                    border-2 p-3 min-h-[96px] transition-all duration-150 active:scale-90 gap-2
                    ${isSelected
                      ? `bg-gradient-to-br ${tile.color} ${tile.border} shadow-xl ${tile.glow} ring-4 ring-white/20`
                      : `bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800`}
                  `}
                >
                  {/* Selected checkmark */}
                  {isSelected && (
                    <span className="absolute top-2 right-2 text-[13px] bg-white/30 rounded-full w-5 h-5 flex items-center justify-center font-black">
                      ✓
                    </span>
                  )}
                  <span className="text-[36px] leading-none">{tile.emoji}</span>
                  <span className={`text-[13px] md:text-[15px] font-extrabold leading-tight text-center ${isSelected ? "text-white" : "text-slate-300"}`}>
                    {tile.label[lang]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          BOTTOM ACTION BAR
      ══════════════════════════════════════════════════ */}
      <div className="w-full bg-slate-900 border-t-2 border-slate-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          {/* Skip */}
          <button
            onClick={() => { setTranscript(""); setTiles([]); setActiveInput(null); handleNext(); }}
            className="px-5 py-3 rounded-2xl border-2 border-slate-700 text-slate-400 font-bold text-[16px] hover:border-slate-500 hover:text-slate-200 transition"
          >
            {lang === "hi" ? "छोड़ें" : lang === "mr" ? "वगळा" : lang === "gu" ? "છોડો" : "Skip"}
          </button>

          {/* Next / Submit */}
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className={`
              flex-1 min-h-[64px] rounded-2xl font-black text-[20px] md:text-[24px]
              flex items-center justify-center gap-3 transition-all duration-200
              border-2 shadow-xl active:scale-[0.98]
              ${isAnswered
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-300 text-slate-950 shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-400"
                : "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"}
              ${isSubmitting ? "animate-pulse" : ""}
            `}
          >
            {isSubmitting ? (
              <>
                <span className="w-6 h-6 border-3 border-emerald-300 border-t-transparent rounded-full animate-spin" />
                <span>{lang === "hi" ? "विश्लेषण हो रहा है…" : lang === "mr" ? "विश्लेषण होत आहे…" : lang === "gu" ? "વિश्लेषण ચાલી રહ્યું છે…" : "Analysing…"}</span>
              </>
            ) : (
              <span>{nextLabel[lang]}</span>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
