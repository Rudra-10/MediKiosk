import React, { useState, useEffect, useRef } from "react";
import { submitPatientIntake } from "../services/apiService";

/**
 * Multilingual UI Prompts & Labels tailored for low-literacy / rural patients
 */
const DICTIONARY = {
  hi: {
    title: "कृपया अपनी समस्या बताएं या नीचे दिए गए चित्र को छुएं",
    subtitle: "आवाज से बोलें या नीचे दिए गए कार्ड को टैप करें",
    listening: "सुन रहे हैं... कृपया बोलिए...",
    tapToSpeak: "बोलने के लिए माइक दबाएं",
    stopSpeaking: "समाप्त करें / भेजें",
    processing: "आयुर्वेदिक एआई विश्लेषण कर रहा है...",
    abhaLabel: "आभा संख्या (ABHA ID):",
    abhaPlaceholder: "14-अंक आभा संख्या",
    transcriptPlaceholder: "आपकी बोली गई बातें यहां दिखाई देंगी...",
    submitBtn: "केस शीट बनाएं ➔",
    redFlagAlert: "🚨 आपातकालीन चेतावनी: कृपया तुरंत नजदीकी चिकित्सक से संपर्क करें!",
    symptoms: [
      { id: "cough", icon: "🫁", name: "खांसी / सांस की तकलीफ", term: "कास (Kasa / Respiratory)", text: "मुझे पिछले 4 दिनों से लगातार बलगम वाली खांसी, गले में खराश और सांस लेने में भारीपन है।" },
      { id: "chest", icon: "❤️‍🩹", name: "छाती में दर्द / भारीपन", term: "उरःशूल (Hridshoola / Chest Pain)", text: "मुझे छाती में तेज दर्द, बाएं हाथ में खिंचाव और घबराहट महसूस हो रही है।" },
      { id: "digest", icon: "🍲", name: "पेट दर्द / गैस / खट्टी डकार", term: "अम्लपित्त (Amlapitta / Digestion)", text: "मुझे खाने के बाद पेट में जलन, गैस, खट्टी डकारें और अपच की शिकायत है।" },
      { id: "joints", icon: "🦴", name: "जोड़ों / घुटनों में दर्द", term: "संधिवात (Sandhivata / Joint Pain)", text: "मेरे दोनों घुटनों और जोड़ों में दर्द, जकड़न और सुबह चलने में बहुत तकलीफ होती है।" },
      { id: "fever", icon: "🌡️", name: "तेज बुखार / बदन दर्द", term: "ज्वर (Jwara / High Fever)", text: "मुझे 3 दिन से तेज बुखार, कंपकंपी और पूरे शरीर में दर्द हो रहा है।" },
      { id: "fatigue", icon: "⚡", name: "कमजोरी / चक्कर / थकान", term: "क्लम (Klama / Severe Fatigue)", text: "मुझे अत्यधिक कमजोरी, भूख न लगना, अनिद्रा और लगातार सिर में भारीपन रहता है।" }
    ]
  },
  en: {
    title: "Please Describe Your Symptoms or Tap a Picture Below",
    subtitle: "Speak into the microphone or tap any category tile",
    listening: "Listening... Please speak clearly...",
    tapToSpeak: "Tap to Speak",
    stopSpeaking: "Stop & Submit",
    processing: "Ayurvedic Clinical AI Engine Processing...",
    abhaLabel: "ABHA Health ID:",
    abhaPlaceholder: "14-digit ABHA ID",
    transcriptPlaceholder: "Your speech transcript will appear here...",
    submitBtn: "Generate Case Sheet ➔",
    redFlagAlert: "🚨 EMERGENCY ALERT: Immediate medical attention required!",
    symptoms: [
      { id: "cough", icon: "🫁", name: "Cough / Breathlessness", term: "Kasa (Respiratory)", text: "I have had a persistent productive cough with chest congestion and shortness of breath for 4 days." },
      { id: "chest", icon: "❤️‍🩹", name: "Chest Pain / Pressure", term: "Hridshoola (Cardiovascular)", text: "I have severe crushing chest pain radiating to my left arm with cold sweats and dizziness." },
      { id: "digest", icon: "🍲", name: "Acidity / Indigestion", term: "Amlapitta (Gastrointestinal)", text: "I am experiencing acid reflux, heartburn after meals, abdominal bloating and poor digestion." },
      { id: "joints", icon: "🦴", name: "Joint / Knee Pain", term: "Sandhivata (Arthritis / Joints)", text: "I have severe bilateral knee pain, morning stiffness and swelling in my joints for the past 2 weeks." },
      { id: "fever", icon: "🌡️", name: "Fever / Body Aches", term: "Jwara (Fever / Infection)", text: "I have high-grade fever with chills, headache, and generalized body aches for 3 days." },
      { id: "fatigue", icon: "⚡", name: "Fatigue / Weakness", term: "Klama (General Debility)", text: "I am experiencing chronic fatigue, irregular sleep, loss of appetite, and dizziness." }
    ]
  },
  mr: {
    title: "कृपया आपली समस्या सांगा किंवा खालील चित्रावर स्पर्श करा",
    subtitle: "माईकमध्ये बोला किंवा खालील लक्षण निवडा",
    listening: "ऐकत आहे... कृपया बोला...",
    tapToSpeak: "बोलण्यासाठी स्पर्श करा",
    stopSpeaking: "थांबवा आणि पाठवा",
    processing: "आयुर्वेदिक एआय तपासणी सुरू आहे...",
    abhaLabel: "आभा क्रमांक (ABHA ID):",
    abhaPlaceholder: "14-अंकी आभा क्रमांक",
    transcriptPlaceholder: "आपले बोलणे येथे दिसेल...",
    submitBtn: "केस शीट तयार करा ➔",
    redFlagAlert: "🚨 तातडीची सूचना: कृपया त्वरित डॉक्टरांशी संपर्क साधा!",
    symptoms: [
      { id: "cough", icon: "🫁", name: "खोकला / दम लागणे", term: "कास (श्वसन विकार)", text: "मला मागील ४ दिवसांपासून खोकला, घशात खवखव आणि छातीत कफ जाणवत आहे." },
      { id: "chest", icon: "❤️‍🩹", name: "छातीत दुखणे / अस्वस्थता", term: "उरःशूल (हृदय विकार)", text: "मला छातीत तीव्र कळ येत असून डाव्या हातात वेदना आणि घाम येत आहे." },
      { id: "digest", icon: "🍲", name: "अपचन / गॅस / पित्त", term: "अम्लपित्त (पचन समस्या)", text: "मला जेवणानंतर छातीत जळजळ, आंबट ढेकर आणि पोट फुगण्याची समस्या आहे." },
      { id: "joints", icon: "🦴", name: "सांधेदुखी / गुडघेदुखी", term: "संधिवात (सांधे विकार)", text: "माझे दोन्ही गुडघे दुखत असून सकाळी चालताना सांधे कडक होतात." },
      { id: "fever", icon: "🌡️", name: "ताप / अंगदुखी", term: "ज्वर (ताप)", text: "मला ३ दिवसांपासून तीव्र ताप, थंडी आणि अंगदुखी होत आहे." },
      { id: "fatigue", icon: "⚡", name: "अशक्तपणा / चक्कर", term: "क्लम (थकवा)", text: "मला खूप थकवा, निद्रानाश आणि भूक न लागण्याची तक्रार आहे." }
    ]
  }
};

export default function DualModeInterview({
  onComplete,
  onNext,
  abhaId: initialAbhaId = "91-9482-1049-3829",
  language = "hi",
  onBack
}) {
  const [abhaId, setAbhaId] = useState(initialAbhaId);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTileId, setSelectedTileId] = useState(null);
  const [waveHeight, setWaveHeight] = useState([20, 35, 60, 45, 25, 55, 30]);
  const [speechError, setSpeechError] = useState(null);

  const recognitionRef = useRef(null);
  const waveIntervalRef = useRef(null);
  const currentLang = DICTIONARY[language] ? language : "hi";
  const t = DICTIONARY[currentLang];

  // Speech Recognition Initializer
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript((prev) => (finalTranscript || interimTranscript ? (prev ? prev + " " : "") + (finalTranscript || interimTranscript) : prev));
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition notice:", err.error);
        if (err.error === "not-allowed") {
          setSpeechError("Microphone access denied. Please allow microphone or tap symptom tiles.");
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (waveIntervalRef.current) {
        clearInterval(waveIntervalRef.current);
      }
    };
  }, [language]);

  // Handle Microphone Recording Toggle
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      clearInterval(waveIntervalRef.current);
      setIsRecording(false);
    } else {
      // Start recording
      setSpeechError(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Recognition already active or restart:", e);
        }
      }
      setIsRecording(true);

      // Animate Audio Waveform
      waveIntervalRef.current = setInterval(() => {
        setWaveHeight([
          Math.floor(Math.random() * 50) + 15,
          Math.floor(Math.random() * 70) + 20,
          Math.floor(Math.random() * 90) + 25,
          Math.floor(Math.random() * 80) + 20,
          Math.floor(Math.random() * 60) + 15,
          Math.floor(Math.random() * 75) + 20,
          Math.floor(Math.random() * 45) + 10,
        ]);
      }, 120);
    }
  };

  // Handle Touch Tile Selection
  const handleTileClick = (tile) => {
    setSelectedTileId(tile.id);
    setTranscript(tile.text);
  };

  // Execute Submission to Backend / Groq Engine
  const handleSubmit = async () => {
    const textToSend = transcript.trim() || t.symptoms[0].text;
    setIsLoading(true);

    try {
      const response = await submitPatientIntake({
        transcript: textToSend,
        abhaId: abhaId || "91-9482-1049-3829",
        language: currentLang
      });

      const clinicalPayload = response?.data || response;

      if (onComplete) onComplete(clinicalPayload);
      if (onNext) onNext(clinicalPayload);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col justify-between select-none touch-manipulation font-sans">
      
      {/* Top Bar: ABHA ID & Back Action */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-lg border border-slate-600 transition"
            >
              ⬅ वापस / Back
            </button>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-400 tracking-tight flex items-center gap-2">
              <span>🌿</span> MediKiosk • रोगी इतिहास संकलन (Intake)
            </h1>
            <p className="text-sm md:text-base text-slate-400 font-medium">
              आयुष मंत्रालय (Ministry of Ayush) • AI Clinical Triage
            </p>
          </div>
        </div>

        {/* ABHA ID Input with Touch Keypad Mode */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-emerald-500/40">
          <label className="text-xs md:text-sm font-bold text-emerald-300 whitespace-nowrap">
            {t.abhaLabel}
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9\-]*"
            value={abhaId}
            onChange={(e) => setAbhaId(e.target.value)}
            placeholder={t.abhaPlaceholder}
            className="w-44 md:w-52 bg-slate-950 text-emerald-300 font-mono text-base px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-400"
          />
        </div>
      </header>

      {/* Main Container: Split View (Top: Voice / Bottom: Touch Grid) */}
      <main className="flex-1 my-6 flex flex-col gap-6">
        
        {/* Section A: AI Voice Waveform & Central Touch Mic */}
        <section className="bg-slate-800/90 rounded-3xl p-6 md:p-8 border border-slate-700 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
              {t.title}
            </h2>
            <p className="text-sm md:text-base text-emerald-400 font-medium">
              {isRecording ? t.listening : t.subtitle}
            </p>
          </div>

          {/* Central Pulsating Voice Button (Min 96px for low-literacy ergonomics) */}
          <div className="relative flex items-center justify-center my-4">
            {isRecording && (
              <span className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
            )}
            <button
              onClick={toggleRecording}
              aria-label={isRecording ? t.stopSpeaking : t.tapToSpeak}
              className={`relative z-10 w-28 h-28 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 ${
                isRecording
                  ? "bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-600/50 ring-4 ring-rose-300"
                  : "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-600/40 hover:brightness-110 ring-4 ring-emerald-400/50"
              }`}
            >
              <span className="text-4xl md:text-5xl">{isRecording ? "⏹️" : "🎙️"}</span>
              <span className="text-xs md:text-sm font-extrabold mt-1 uppercase tracking-wider">
                {isRecording ? t.stopSpeaking : t.tapToSpeak}
              </span>
            </button>
          </div>

          {/* Dynamic Visual Audio Waveform */}
          {isRecording && (
            <div className="flex items-center gap-1.5 h-12 mt-2">
              {waveHeight.map((h, idx) => (
                <div
                  key={idx}
                  style={{ height: `${h}px` }}
                  className="w-2.5 bg-rose-400 rounded-full transition-all duration-100 ease-out"
                />
              ))}
            </div>
          )}

          {/* Speech Error / Fallback Notice */}
          {speechError && (
            <p className="mt-3 text-sm text-amber-300 font-medium bg-amber-950/60 px-4 py-1.5 rounded-xl border border-amber-500/30">
              {speechError}
            </p>
          )}

          {/* Transcript Text Area */}
          <div className="w-full max-w-2xl mt-4">
            <textarea
              rows={2}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={t.transcriptPlaceholder}
              className="w-full bg-slate-950/90 text-slate-100 placeholder-slate-500 text-base md:text-lg p-3 rounded-2xl border border-slate-700 focus:outline-none focus:border-emerald-500 resize-none font-medium text-center"
            />
          </div>
        </section>

        {/* Section B: 2x3 Large Touch Icon Grid */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-lg md:text-xl font-bold text-slate-200 flex items-center gap-2">
              <span>👇</span> अथवा इनमें से लक्षण चुनें (Or Select Symptom Tile):
            </h3>
            {selectedTileId && (
              <span className="text-xs md:text-sm text-emerald-400 font-semibold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                चयनित / Selected ✓
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {t.symptoms.map((tile) => {
              const isSelected = selectedTileId === tile.id;
              return (
                <button
                  key={tile.id}
                  onClick={() => handleTileClick(tile)}
                  className={`min-h-[96px] p-4 rounded-2xl flex items-center gap-4 text-left transition-all duration-200 border active:scale-98 ${
                    isSelected
                      ? "bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border-emerald-400 ring-2 ring-emerald-400 text-white shadow-lg shadow-emerald-900/40"
                      : "bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-200 hover:border-slate-500"
                  }`}
                >
                  <span className="text-4xl md:text-5xl flex-shrink-0 p-2 bg-slate-900/80 rounded-2xl border border-slate-700">
                    {tile.icon}
                  </span>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-base md:text-lg font-extrabold text-white leading-tight">
                      {tile.name}
                    </h4>
                    <p className="text-xs md:text-sm text-emerald-300/80 font-medium truncate mt-0.5">
                      {tile.term}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer Actions: Primary Action Button & Status */}
      <footer className="pt-4 border-t border-slate-700 flex items-center justify-end">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full md:w-auto px-8 py-4 rounded-2xl font-extrabold text-xl flex items-center justify-center gap-3 shadow-xl transition-all duration-200 ${
            isLoading
              ? "bg-emerald-800 text-emerald-200 cursor-wait"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 hover:shadow-emerald-500/25 active:scale-98"
          }`}
        >
          {isLoading ? (
            <>
              <span className="inline-block w-6 h-6 border-3 border-emerald-200 border-t-transparent rounded-full animate-spin" />
              <span>{t.processing}</span>
            </>
          ) : (
            <span>{t.submitBtn}</span>
          )}
        </button>
      </footer>

    </div>
  );
}
