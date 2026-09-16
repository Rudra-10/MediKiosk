import React, { useState } from "react";

/**
 * Multilingual Translations for Kiosk Onboarding & Consent
 */
const DICTIONARY = {
  hi: {
    kioskTitle: "मेडीकियोस्क (MediKiosk) • आयुष ओपीडी",
    kioskSubtitle: "डिजिटल भारत • आयुष्मान भारत डिजिटल मिशन (ABDM)",
    stepBadge: "चरण १ / Step 1: पहचान एवं सहमति",
    langSelectTitle: "कृपया अपनी भाषा चुनें (Select Language):",
    abhaTitle: "अपना १४-अंकीय आभा आईडी (ABHA ID) दर्ज करें",
    abhaSubtitle: "या अपना आभा क्यूआर कार्ड स्कैनर के सामने दिखाएं",
    abhaPlaceholder: "91-XXXX-XXXX-XXXX",
    scanQrBtn: "📷 आभा क्यूआर स्कैन करें",
    scanningText: "कैमरा क्यूआर कार्ड पहचान रहा है...",
    autoFillDemo: "त्वरित डेमो आईडी भरें (Demo Fill)",
    consentTitle: "डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम २०२३ सहमति",
    consentText: "मैं आयुष मंत्रालय के दिशानिर्देशों के तहत आयुर्वेदिक परामर्श, आपातकालीन ट्राइएज और डिजिटल स्वास्थ्य रिकॉर्ड (ABDM FHIR) हेतु डेटा साझा करने की सहमति देता/देती हूँ।",
    audioGuideText: "🔊 ऑडियो मार्गदर्शन: सहमति सुनने के लिए टैप करें",
    startBtn: "सहमति दें और स्वास्थ्य साक्षात्कार शुरू करें ➔",
    validationError: "कृपया वैध १४-अंकीय आभा संख्या दर्ज करें और सहमति चेकबॉक्स पर सही का निशान लगाएं।"
  },
  en: {
    kioskTitle: "MediKiosk • Ayush OPD Intake",
    kioskSubtitle: "Digital India • Ayushman Bharat Digital Mission (ABDM)",
    stepBadge: "Step 1: Patient Identity & DPDP Consent",
    langSelectTitle: "Select Your Preferred Language:",
    abhaTitle: "Enter Your 14-Digit ABHA Health ID",
    abhaSubtitle: "Or hold your ABHA QR Card in front of the kiosk camera",
    abhaPlaceholder: "91-XXXX-XXXX-XXXX",
    scanQrBtn: "📷 Scan ABHA QR Code",
    scanningText: "Camera scanning ABHA QR card...",
    autoFillDemo: "Auto-Fill Demo ABHA ID",
    consentTitle: "DPDP Act 2023 Digital Health Data Consent",
    consentText: "I explicitly consent to voice-assisted clinical history intake, automated Ayurvedic Dashavidha Pariksha processing, and ABDM FHIR clinical case generation under Ministry of Ayush guidelines.",
    audioGuideText: "🔊 Audio Voice-Over: Tap to hear audio explanation",
    startBtn: "Consent & Begin Health Interview ➔",
    validationError: "Please enter a valid 14-digit ABHA ID and accept the consent checkbox to continue."
  },
  mr: {
    kioskTitle: "मेडीकियोस्क (MediKiosk) • आयुष ओपीडी",
    kioskSubtitle: "डिजिटल भारत • आयुष्यमान भारत डिजिटल मिशन (ABDM)",
    stepBadge: "टप्पा १: रुग्ण ओळख व संमती",
    langSelectTitle: "कृपया आपली भाषा निवडा (Select Language):",
    abhaTitle: "तुमचा १४-अंकी आभा क्रमांक (ABHA ID) टाका",
    abhaSubtitle: "किंवा तुमचा आभा क्यूआर कोड कॅमेऱ्यासमोर धरा",
    abhaPlaceholder: "91-XXXX-XXXX-XXXX",
    scanQrBtn: "📷 आभा क्यूआर स्कॅन करा",
    scanningText: "कॅमेरा क्यूआर ओळखत आहे...",
    autoFillDemo: "डेमो आभा क्रमांक भरा",
    consentTitle: "डिजिटल वैयक्तिक डेटा संरक्षण (DPDP) २०२३ संमती",
    consentText: "मी आयुष मंत्रालयाच्या मार्गदर्शक तत्त्वांच्या अंतर्गत आयुर्वेदिक सल्लामसलत आणि ईएमआर निर्मितीसाठी डेटा संकलनास संमती देतो/देते.",
    audioGuideText: "🔊 ऑडिओ मार्गदर्शन: ऐकण्यासाठी स्पर्श करा",
    startBtn: "संमती द्या आणि तपासणी सुरू करा ➔",
    validationError: "कृपया वैध १४-अंकी आभा आयडी प्रविष्ट करा आणि संमती बॉक्स तपासा."
  }
};

const LANGUAGES = [
  { id: "hi", label: "हिंदी", sub: "Hindi", flag: "🇮🇳" },
  { id: "en", label: "English", sub: "English", flag: "🌐" },
  { id: "mr", label: "मराठी", sub: "Marathi", flag: "🇮🇳" }
];

export default function AuthConsentScreen({ onComplete }) {
  const [language, setLanguage] = useState("hi");
  const [abhaId, setAbhaId] = useState("91-9482-1049-3829");
  const [consentGiven, setConsentGiven] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const t = DICTIONARY[language] || DICTIONARY.hi;

  // Format ABHA number as 91-XXXX-XXXX-XXXX
  const handleAbhaChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 14);
    let formatted = raw;
    if (raw.length > 2) {
      formatted = `${raw.slice(0, 2)}-${raw.slice(2)}`;
    }
    if (raw.length > 6) {
      formatted = `${formatted.slice(0, 7)}-${raw.slice(6)}`;
    }
    if (raw.length > 10) {
      formatted = `${formatted.slice(0, 12)}-${raw.slice(10)}`;
    }
    setAbhaId(formatted);
    if (errorMessage) setErrorMessage("");
  };

  // Simulate ABHA QR Scanner Camera
  const handleScanQr = () => {
    setIsScanning(true);
    setTimeout(() => {
      setAbhaId("91-8834-2910-4921");
      setIsScanning(false);
    }, 1800);
  };

  // Simulate Audio Voice-Over Guide
  const handleToggleAudioGuide = () => {
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(t.consentText);
      utterance.lang = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
      utterance.onend = () => setIsPlayingAudio(false);
    } else if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Submit and Advance
  const handleStart = () => {
    const cleanDigits = abhaId.replace(/[^0-9]/g, "");
    if (cleanDigits.length < 10) {
      setErrorMessage(t.validationError);
      return;
    }
    if (!consentGiven) {
      setErrorMessage(t.validationError);
      return;
    }

    if (onComplete) {
      onComplete({
        abhaId: abhaId.trim(),
        language,
        consentGiven: true,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col justify-between select-none touch-manipulation font-sans">
      
      {/* Top Header & ABDM Branding */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/10">
            🌿
          </div>
          <div>
            <div className="inline-block bg-emerald-950 text-emerald-400 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wide mb-1">
              {t.stepBadge}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {t.kioskTitle}
            </h1>
            <p className="text-sm md:text-base text-slate-400 font-medium">
              {t.kioskSubtitle}
            </p>
          </div>
        </div>

        {/* National Emblem / Ayush Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
          <span className="text-2xl">🏛️</span>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-300">आयुष मंत्रालय</p>
            <p className="text-[11px] text-emerald-400">Govt. of India</p>
          </div>
        </div>
      </header>

      {/* Main Kiosk Onboarding Form */}
      <main className="my-6 space-y-6 flex-1">
        
        {/* Section 1: Multilingual Language Selector */}
        <section className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700 shadow-xl">
          <h2 className="text-lg md:text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span>🗣️</span> {t.langSelectTitle}
          </h2>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`min-h-[72px] p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 active:scale-95 border ${
                    isSelected
                      ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 font-extrabold border-emerald-300 shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-400/40"
                      : "bg-slate-900/80 hover:bg-slate-750 text-slate-200 border-slate-700 font-semibold hover:border-slate-500"
                  }`}
                >
                  <span className="text-2xl mb-1">{lang.flag}</span>
                  <span className="text-lg md:text-xl leading-none">{lang.label}</span>
                  <span className="text-xs opacity-80 mt-0.5">{lang.sub}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: ABHA ID Entry & Camera QR Mock */}
        <section className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <span>🪪</span> {t.abhaTitle}
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                {t.abhaSubtitle}
              </p>
            </div>
            <button
              onClick={() => setAbhaId("91-9482-1049-3829")}
              className="text-xs text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40 hover:bg-emerald-900 transition"
            >
              {t.autoFillDemo}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* ABHA Numeric Input */}
            <div className="md:col-span-7">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9\-]*"
                value={abhaId}
                onChange={handleAbhaChange}
                placeholder={t.abhaPlaceholder}
                className="w-full bg-slate-950 text-emerald-400 font-mono text-2xl md:text-3xl p-4 rounded-2xl border-2 border-slate-700 focus:border-emerald-400 focus:outline-none tracking-widest text-center shadow-inner"
              />
            </div>

            {/* Scan ABHA QR Action */}
            <div className="md:col-span-5">
              <button
                onClick={handleScanQr}
                disabled={isScanning}
                className={`w-full min-h-[64px] rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all border ${
                  isScanning
                    ? "bg-slate-700 text-amber-300 border-amber-400 animate-pulse"
                    : "bg-slate-700/80 hover:bg-slate-650 text-slate-100 border-slate-600 hover:border-emerald-400 active:scale-98"
                }`}
              >
                {isScanning ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                    <span>{t.scanningText}</span>
                  </>
                ) : (
                  <span>{t.scanQrBtn}</span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: DPDP Act 2023 Digital Consent & Audio Guide */}
        <section className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg md:text-xl font-bold text-slate-200 flex items-center gap-2">
              <span>📜</span> {t.consentTitle}
            </h2>
            <button
              onClick={handleToggleAudioGuide}
              className={`text-xs md:text-sm font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-2 ${
                isPlayingAudio
                  ? "bg-rose-950 text-rose-300 border-rose-500 animate-pulse"
                  : "bg-slate-900 text-emerald-300 border-emerald-500/40 hover:bg-slate-750"
              }`}
            >
              <span>{isPlayingAudio ? "⏹️ आवाज रोकें" : t.audioGuideText}</span>
            </button>
          </div>

          {/* Interactive Consent Checkbox with Large Touch Hitbox */}
          <label className="flex items-start gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-700 hover:border-emerald-500/50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="w-7 h-7 mt-1 accent-emerald-500 rounded-lg cursor-pointer flex-shrink-0"
            />
            <span className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
              {t.consentText}
            </span>
          </label>
        </section>

        {/* Error Validation Notice */}
        {errorMessage && (
          <div className="bg-rose-950/90 border-2 border-rose-500 text-rose-200 p-4 rounded-2xl text-center font-bold text-base shadow-lg animate-shake">
            {errorMessage}
          </div>
        )}

      </main>

      {/* Footer / Primary Navigation CTA */}
      <footer className="pt-4 border-t border-slate-700 flex justify-end">
        <button
          onClick={handleStart}
          className="w-full md:w-auto min-h-[64px] px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl font-black text-xl md:text-2xl shadow-xl shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-3"
        >
          <span>{t.startBtn}</span>
        </button>
      </footer>

    </div>
  );
}
