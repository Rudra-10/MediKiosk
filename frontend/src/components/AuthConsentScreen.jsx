import React, { useState, useEffect, useRef } from "react";

// ─── Multilingual Dictionary ───────────────────────────────────────────────────
const DICT = {
  hi: {
    topBadge: "आयुष मंत्रालय • ABDM डिजिटल स्वास्थ्य",
    cameraTitle: "अपना ABHA QR कार्ड कैमरे के सामने रखें",
    cameraHint: "कार्ड को फ्रेम के भीतर रखें — स्वतः पहचान होगी",
    orDivider: "या नीचे मैन्युअल दर्ज करें",
    keypadLabel: "14-अंकीय ABHA संख्या",
    clearBtn: "मिटाएं",
    consentLine: "मैं DPDP अधिनियम 2023 के तहत आयुर्वेदिक परामर्श हेतु डेटा साझाकरण की सहमति देता/देती हूँ।",
    startBtn: "सहमति दें और साक्षात्कार शुरू करें",
    scanning: "QR पहचाना जा रहा है…",
    audioBtn: "🔊 ऑडियो गाइड सुनें",
    audioStop: "⏹ आवाज़ रोकें",
  },
  en: {
    topBadge: "Ministry of Ayush • ABDM Digital Health",
    cameraTitle: "Hold Your ABHA QR Card in Front of the Camera",
    cameraHint: "Keep card within the frame — auto-detection will trigger",
    orDivider: "OR enter manually below",
    keypadLabel: "14-Digit ABHA Number",
    clearBtn: "Clear",
    consentLine: "I consent to sharing my data for Ayurvedic consultation under the DPDP Act 2023.",
    startBtn: "Consent & Begin Interview",
    scanning: "Scanning QR Code…",
    audioBtn: "🔊 Audio Guide",
    audioStop: "⏹ Stop Audio",
  },
  gu: {
    topBadge: "આયુષ મંત્રાલય • ABDM ડિજિટલ આરોગ્ય",
    cameraTitle: "તમારું ABHA QR કાર્ડ કૅમેરા સામે રાખો",
    cameraHint: "કાર્ડ ફ્રેમની અંદર રાખો — આપોઆપ ઓળખ થશે",
    orDivider: "અથવા નીચે મેન્યુઅલ દાખલ કરો",
    keypadLabel: "14-અંકનો ABHA નંબર",
    clearBtn: "ભૂંસો",
    consentLine: "DPDP અધિનિયમ 2023 હેઠળ આયુર્વેદ પરામર્શ માટે ડેટા શેર કરવાની સંમતિ આપું છું.",
    startBtn: "સંમતિ આપો અને ઇન્ટરવ્યૂ શરૂ કરો",
    scanning: "QR ઓળખ ચાલી રહી છે…",
    audioBtn: "🔊 ઓડિયો ગાઇડ",
    audioStop: "⏹ ઓડિઓ બંધ",
  },
  mr: {
    topBadge: "आयुष मंत्रालय • ABDM डिजिटल आरोग्य",
    cameraTitle: "तुमचे ABHA QR कार्ड कॅमेऱ्यासमोर धरा",
    cameraHint: "कार्ड फ्रेममध्ये ठेवा — आपोआप ओळखले जाईल",
    orDivider: "किंवा खाली मॅन्युअली प्रविष्ट करा",
    keypadLabel: "14-अंकी ABHA क्रमांक",
    clearBtn: "मिटवा",
    consentLine: "DPDP कायदा 2023 अंतर्गत आयुर्वेदिक सल्ल्यासाठी डेटा सामायिक करण्यास मी संमती देतो/देते.",
    startBtn: "संमती द्या आणि मुलाखत सुरू करा",
    scanning: "QR ओळखत आहे…",
    audioBtn: "🔊 ऑडिओ मार्गदर्शन",
    audioStop: "⏹ आवाज थांबवा",
  },
};

const LANG_BTNS = [
  { id: "hi", label: "हिंदी",    script: "Devanagari" },
  { id: "en", label: "English",  script: "Latin"       },
  { id: "gu", label: "ગુજરાતી", script: "Gujarati"    },
  { id: "mr", label: "मराठी",    script: "Devanagari" },
];

// Virtual keypad layout
const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["⌫", "0", "✓"],
];

// Format raw 14-digit string → "91-XXXX-XXXX-XXXX"
function formatAbha(raw) {
  if (raw.length <= 2) return raw;
  if (raw.length <= 6) return `${raw.slice(0, 2)}-${raw.slice(2)}`;
  if (raw.length <= 10) return `${raw.slice(0, 2)}-${raw.slice(2, 6)}-${raw.slice(6)}`;
  return `${raw.slice(0, 2)}-${raw.slice(2, 6)}-${raw.slice(6, 10)}-${raw.slice(10)}`;
}

// ─── Animated corner brackets for camera frame ────────────────────────────────
function CameraCorners() {
  const cornerClass = "absolute w-10 h-10 border-emerald-400";
  return (
    <>
      <span className={`${cornerClass} top-0 left-0 border-t-4 border-l-4 rounded-tl-lg`} />
      <span className={`${cornerClass} top-0 right-0 border-t-4 border-r-4 rounded-tr-lg`} />
      <span className={`${cornerClass} bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg`} />
      <span className={`${cornerClass} bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg`} />
    </>
  );
}

// ─── Scanning laser line animation ────────────────────────────────────────────
function ScanLine({ active }) {
  if (!active) return null;
  return (
    <div
      className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80 animate-scanLine"
      style={{ top: "50%", animation: "scanLine 2s ease-in-out infinite" }}
    />
  );
}

export default function AuthConsentScreen({ onComplete }) {
  const [lang, setLang]             = useState("hi");
  const [abhaRaw, setAbhaRaw]       = useState("");
  const [consent, setConsent]       = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned]       = useState(false);
  const [audioPlaying, setAudio]    = useState(false);
  const [error, setError]           = useState("");
  const [keyPressAnim, setAnim]     = useState(null); // key currently animating

  const t = DICT[lang];

  // ── Simulate QR scan on camera-frame tap ──────────────────────────────────
  const handleCameraPress = () => {
    if (isScanning || scanned) return;
    setIsScanning(true);
    setError("");
    setTimeout(() => {
      const mockId = "91884329104921";
      setAbhaRaw(mockId);
      setScanned(true);
      setIsScanning(false);
    }, 2200);
  };

  // ── Virtual keypad handler ────────────────────────────────────────────────
  const handleKey = (key) => {
    setError("");
    setAnim(key);
    setTimeout(() => setAnim(null), 150);

    if (key === "⌫") {
      setAbhaRaw((p) => p.slice(0, -1));
      setScanned(false);
    } else if (key === "✓") {
      handleSubmit();
    } else if (abhaRaw.length < 14) {
      setAbhaRaw((p) => p + key);
      setScanned(false);
    }
  };

  // ── Bhashini TTS simulation ───────────────────────────────────────────────
  const handleAudio = () => {
    if (audioPlaying) {
      window.speechSynthesis?.cancel();
      setAudio(false);
      return;
    }
    setAudio(true);
    if ("speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(t.consentLine);
      utt.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : lang === "gu" ? "gu-IN" : "en-IN";
      utt.rate = 0.85;
      utt.onend = () => setAudio(false);
      window.speechSynthesis.speak(utt);
    } else {
      setTimeout(() => setAudio(false), 4000);
    }
  };

  // ── Submit / Proceed ──────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (abhaRaw.length < 10) {
      setError(
        lang === "hi" ? "कृपया कम से कम 10 अंक दर्ज करें।" :
        lang === "mr" ? "कृपया किमान 10 अंक प्रविष्ट करा." :
        lang === "gu" ? "કૃપા કરી ઓછામાં ઓછા 10 અંક દાખલ કરો." :
        "Please enter at least 10 digits."
      );
      return;
    }
    if (!consent) {
      setError(
        lang === "hi" ? "कृपया सहमति चेकबॉक्स पर टिक करें।" :
        lang === "mr" ? "कृपया संमती बॉक्स तपासा." :
        lang === "gu" ? "કૃપા કરી સંમતિ ચેકબૉક્સ ટિક કરો." :
        "Please accept the consent checkbox."
      );
      return;
    }
    window.speechSynthesis?.cancel();
    if (onComplete) {
      onComplete({ abhaId: formatAbha(abhaRaw), language: lang, consentGiven: true });
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white flex flex-col select-none touch-manipulation overflow-y-auto">

      {/* ── Injected scan-line keyframe ──────────────────────────────────── */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 10%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0;   }
        }
        .scan-ring::before {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 1rem;
          border: 2px solid #34d399;
          animation: pulse-ring 1.4s ease-out infinite;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════
          TOP BAR — Language selector + ABDM badge
      ══════════════════════════════════════════════════ */}
      <header className="w-full bg-slate-900 border-b-2 border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">

        {/* Ayush badge */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-2xl">
            🌿
          </div>
          <div>
            <p className="text-[13px] font-extrabold text-emerald-400 uppercase tracking-widest leading-none">MediKiosk</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t.topBadge}</p>
          </div>
        </div>

        {/* Language toggle buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {LANG_BTNS.map((lb) => (
            <button
              key={lb.id}
              onClick={() => setLang(lb.id)}
              className={`
                px-4 py-2 rounded-xl text-[17px] font-bold border-2 transition-all duration-150 active:scale-95
                ${lang === lb.id
                  ? "bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/30"
                  : "bg-slate-800 text-slate-200 border-slate-600 hover:border-slate-400"}
              `}
            >
              {lb.label}
            </button>
          ))}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT — Camera + Keypad side-by-side
      ══════════════════════════════════════════════════ */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: Camera QR Frame ─────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Section title */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">📷</span>
            <div>
              <h2 className="text-[22px] md:text-[26px] font-extrabold text-white leading-tight">
                {t.cameraTitle}
              </h2>
              <p className="text-[15px] text-slate-400 mt-0.5">{t.cameraHint}</p>
            </div>
          </div>

          {/* Camera viewfinder frame */}
          <button
            onClick={handleCameraPress}
            disabled={isScanning || scanned}
            className={`
              relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all duration-200
              flex flex-col items-center justify-center cursor-pointer active:scale-[0.98]
              ${scanned
                ? "border-emerald-400 bg-emerald-950/30 shadow-lg shadow-emerald-500/20"
                : isScanning
                ? "border-amber-400 bg-amber-950/20 scan-ring"
                : "border-slate-600 bg-slate-900 hover:border-emerald-500/50"}
            `}
          >
            {/* Corner brackets */}
            <CameraCorners />

            {/* Scanning laser line */}
            {isScanning && (
              <div
                className="absolute left-6 right-6 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                style={{ animation: "scanLine 2s ease-in-out infinite" }}
              />
            )}

            {/* State: idle */}
            {!isScanning && !scanned && (
              <div className="flex flex-col items-center gap-4 p-6 text-center pointer-events-none">
                <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                  <span className="text-5xl opacity-60">🪪</span>
                </div>
                <p className="text-[18px] text-slate-400 font-semibold">
                  {lang === "hi" ? "यहाँ टैप करें — QR स्कैन शुरू होगा"
                   : lang === "mr" ? "येथे टॅप करा — QR स्कॅन सुरू होईल"
                   : lang === "gu" ? "અહીં ટૅપ કરો — QR સ્કૅન શરૂ થશે"
                   : "Tap here to start QR scan"}
                </p>
              </div>
            )}

            {/* State: scanning */}
            {isScanning && (
              <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-[20px] font-bold text-amber-300">{t.scanning}</p>
              </div>
            )}

            {/* State: scanned success */}
            {scanned && (
              <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                  <span className="text-5xl">✅</span>
                </div>
                <p className="text-[22px] font-extrabold text-emerald-300">
                  ABHA {lang === "hi" ? "पहचाना गया" : lang === "mr" ? "ओळखले" : lang === "gu" ? "ઓળખાઈ ગઈ" : "Detected"}
                </p>
                <p className="text-[17px] font-mono text-emerald-400 tracking-widest">
                  {formatAbha(abhaRaw)}
                </p>
              </div>
            )}
          </button>

          {/* OR divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-[16px] font-bold text-slate-400 px-2">{t.orDivider}</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>
        </div>

        {/* ── RIGHT: ABHA Display + Virtual Keypad ─────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* ABHA number display */}
          <div>
            <p className="text-[15px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t.keypadLabel}
            </p>
            <div className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 flex items-center justify-center min-h-[72px]">
              <span className={`font-mono text-[28px] md:text-[34px] font-bold tracking-[0.18em] ${abhaRaw.length > 0 ? "text-emerald-400" : "text-slate-600"}`}>
                {abhaRaw.length > 0 ? formatAbha(abhaRaw) : "__ - ____ - ____ - ____"}
              </span>
            </div>
            {/* digit count bar */}
            <div className="mt-2 flex gap-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-all duration-150 ${i < abhaRaw.length ? "bg-emerald-400" : "bg-slate-700"}`}
                />
              ))}
            </div>
            <p className="text-[13px] text-slate-500 mt-1 text-right">
              {abhaRaw.length} / 14 {lang === "hi" ? "अंक" : lang === "mr" ? "अंक" : lang === "gu" ? "અંક" : "digits"}
            </p>
          </div>

          {/* Virtual keypad */}
          <div className="grid grid-cols-3 gap-3">
            {KEYPAD_ROWS.flat().map((key) => {
              const isBackspace = key === "⌫";
              const isEnter     = key === "✓";
              const isActive    = keyPressAnim === key;
              return (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className={`
                    relative h-[68px] md:h-[76px] rounded-2xl font-black text-[26px] md:text-[30px]
                    flex items-center justify-center border-2 transition-all duration-100
                    active:scale-90
                    ${isActive ? "scale-90" : "scale-100"}
                    ${isEnter
                      ? "bg-emerald-500 border-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/30"
                      : isBackspace
                      ? "bg-rose-950/70 border-rose-700 text-rose-300 hover:bg-rose-900"
                      : "bg-slate-800 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500"}
                  `}
                >
                  {key}
                </button>
              );
            })}
          </div>

          {/* Clear all link */}
          <button
            onClick={() => { setAbhaRaw(""); setScanned(false); setError(""); }}
            className="text-[15px] text-slate-500 hover:text-rose-400 transition underline underline-offset-2 text-center"
          >
            {t.clearBtn}
          </button>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════
          BOTTOM BAR — Consent + Submit CTA
      ══════════════════════════════════════════════════ */}
      <footer className="w-full bg-slate-900/95 backdrop-blur-md border-t-2 border-slate-700 px-4 pt-4 pb-6 flex flex-col gap-4">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-4">

          {/* Consent row */}
          <div className="flex items-start gap-4 bg-slate-800/80 border border-slate-700 rounded-2xl px-5 py-4">
            <button
              onClick={() => { setConsent((c) => !c); setError(""); }}
              className={`
                flex-shrink-0 w-9 h-9 rounded-xl border-2 flex items-center justify-center text-xl transition-all
                ${consent ? "bg-emerald-500 border-emerald-300 shadow-md shadow-emerald-500/30" : "bg-slate-900 border-slate-600"}
              `}
            >
              {consent && <span className="text-slate-950 font-black text-base">✓</span>}
            </button>
            <p className="text-[16px] md:text-[18px] text-slate-300 font-medium leading-relaxed flex-1">
              {t.consentLine}
            </p>
            <button
              onClick={handleAudio}
              className={`
                flex-shrink-0 px-3 py-2 rounded-xl border text-[14px] font-bold transition
                ${audioPlaying
                  ? "bg-rose-950 border-rose-500 text-rose-300 animate-pulse"
                  : "bg-slate-900 border-emerald-500/40 text-emerald-300 hover:bg-slate-800"}
              `}
            >
              {audioPlaying ? t.audioStop : t.audioBtn}
            </button>
          </div>

          {/* Validation error */}
          {error && (
            <div className="bg-rose-950/80 border-2 border-rose-500 text-rose-200 px-5 py-3 rounded-2xl text-[17px] font-bold text-center">
              {error}
            </div>
          )}

          {/* PRIMARY CTA */}
          <button
            onClick={handleSubmit}
            className={`
              w-full min-h-[80px] rounded-2xl font-black text-[22px] md:text-[26px]
              flex items-center justify-center gap-4 transition-all duration-200
              shadow-2xl active:scale-[0.98] border-2
              ${consent && abhaRaw.length >= 10
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 border-emerald-300 shadow-emerald-500/30"
                : "bg-slate-800 text-slate-500 border-slate-600 cursor-not-allowed opacity-60"}
            `}
          >
            <span className="text-3xl">🏥</span>
            <span>{t.startBtn}</span>
            <span className="text-2xl">➔</span>
          </button>

          {/* Footer note */}
          <p className="text-center text-[12px] text-slate-500 font-medium">
            SIH26047 • Ministry of Ayush • ABDM FHIR Compliant • Bhashini Multilingual AI
          </p>
        </div>
      </footer>

    </div>
  );
}
