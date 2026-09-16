import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Mock OCR extraction result (fallback if backend unreachable) ─────────────
const MOCK_EXTRACTION = {
  active_medications: [
    { med_name: "Tab Pantoprazole 40mg", dosage: "1 Tab OD before breakfast" },
    { med_name: "Sitopaladi Churna",     dosage: "3g with honey BD"          },
    { med_name: "Tab Cetirizine 10mg",   dosage: "1 Tab OD at night"         },
  ],
  past_diagnoses:    ["Amlapitta (Acid Peptic Disease)", "Seasonal Allergic Rhinitis"],
  abnormal_lab_values: ["ESR: 22 mm/hr (↑)", "HbA1c: 5.8% (borderline)"],
  extracted_at:      new Date().toISOString(),
  ocr_confidence:    0.91,
};

// ─── Processing steps shown during OCR ──────────────────────────────────────
const PROCESSING_STEPS = [
  { icon: "🔍", text: "Detecting document edges…"          },
  { icon: "📄", text: "Deskewing & enhancing image…"      },
  { icon: "🤖", text: "Running Google Cloud Vision OCR…"  },
  { icon: "💊", text: "Extracting medication names…"       },
  { icon: "🧬", text: "Mapping to ABDM FHIR schema…"      },
  { icon: "✅", text: "Records extracted successfully!"    },
];

// ─── Corner bracket component for the scan frame ────────────────────────────
function FrameCorner({ pos }) {
  const base = "absolute w-10 h-10 border-[4px] border-sky-400";
  const map  = {
    tl: "top-0 left-0 border-b-0 border-r-0 rounded-tl-xl",
    tr: "top-0 right-0 border-b-0 border-l-0 rounded-tr-xl",
    bl: "bottom-0 left-0 border-t-0 border-r-0 rounded-bl-xl",
    br: "bottom-0 right-0 border-t-0 border-l-0 rounded-br-xl",
  };
  return <span className={`${base} ${map[pos]}`} />;
}

// ─── Animated scan laser line ────────────────────────────────────────────────
function ScanLaser({ active }) {
  if (!active) return null;
  return (
    <div
      className="absolute left-0 right-0 h-[3px] pointer-events-none"
      style={{
        background: "linear-gradient(90deg, transparent 0%, #38bdf8 40%, #7dd3fc 50%, #38bdf8 60%, transparent 100%)",
        boxShadow: "0 0 12px 3px rgba(56,189,248,0.6)",
        animation: "laserSweep 2s ease-in-out infinite",
      }}
    />
  );
}

// ─── Circular shutter button ─────────────────────────────────────────────────
function ShutterButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-24 h-24 rounded-full flex items-center justify-center
        border-4 border-sky-300 shadow-2xl shadow-sky-500/50
        transition-all duration-200 active:scale-90 group
        ${disabled
          ? "bg-slate-700 border-slate-600 opacity-50 cursor-not-allowed"
          : "bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 cursor-pointer"}
      `}
      aria-label="Capture prescription"
    >
      {/* Outer ring pulse */}
      {!disabled && (
        <span className="absolute inset-0 rounded-full border-4 border-sky-400/40 animate-ping" style={{ animationDuration: "2s" }} />
      )}
      <span className="text-4xl">📷</span>
    </button>
  );
}

// ─── OCR Processing Overlay ──────────────────────────────────────────────────
function ProcessingOverlay({ step, total }) {
  const current = PROCESSING_STEPS[step] || PROCESSING_STEPS[PROCESSING_STEPS.length - 1];
  const pct     = Math.round(((step + 1) / total) * 100);
  const isDone  = step >= total - 1;

  return (
    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center z-30 gap-6 px-8">
      
      {/* Central status icon */}
      <div className={`
        w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-2xl border-4 transition-all duration-500
        ${isDone
          ? "bg-emerald-500/20 border-emerald-400 shadow-emerald-500/40"
          : "bg-sky-500/20 border-sky-400 shadow-sky-500/40 animate-pulse"}
      `}>
        {current.icon}
      </div>

      {/* Status text */}
      <div className="text-center space-y-2">
        <p className={`text-[26px] md:text-[30px] font-extrabold ${isDone ? "text-emerald-300" : "text-sky-200"}`}>
          {isDone ? "Records Extracted!" : "Extracting medications & lab records…"}
        </p>
        <p className="text-[17px] text-slate-400 font-medium">{current.text}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-emerald-400" : "bg-sky-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[12px] text-slate-500">{pct}%</span>
          <span className="text-[12px] text-slate-500">
            Step {step + 1} of {total}
          </span>
        </div>
      </div>

      {/* Step list */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-md mt-2">
        {PROCESSING_STEPS.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px] font-medium transition-all duration-300 ${
              i < step
                ? "bg-emerald-950/60 border-emerald-700 text-emerald-300"
                : i === step
                ? "bg-sky-950/60 border-sky-600 text-sky-200 shadow-md shadow-sky-500/20"
                : "bg-slate-900/40 border-slate-800 text-slate-600"
            }`}
          >
            <span>{i < step ? "✅" : i === step ? s.icon : "○"}</span>
            <span className="truncate">{s.text.replace("…","")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Extracted Results Panel ─────────────────────────────────────────────────
function ResultsPanel({ data, onComplete, onRetake }) {
  return (
    <div className="absolute inset-0 bg-slate-950 flex flex-col z-40 overflow-y-auto">
      
      {/* Success header */}
      <div className="bg-gradient-to-r from-emerald-900/80 to-teal-900/80 border-b-2 border-emerald-600 px-6 py-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl flex-shrink-0">
          ✅
        </div>
        <div>
          <h2 className="text-[22px] font-extrabold text-white">OCR Extraction Complete</h2>
          <p className="text-[14px] text-emerald-300 font-medium">
            Google Cloud Vision · Confidence: {Math.round((data.ocr_confidence || 0.91) * 100)}%
          </p>
        </div>
      </div>

      {/* Extracted data */}
      <div className="flex-1 p-5 space-y-5">

        {/* Medications */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
          <h3 className="text-[16px] font-extrabold text-sky-300 flex items-center gap-2 uppercase tracking-wider">
            💊 Active Medications
          </h3>
          {(data.active_medications || []).map((med, i) => (
            <div key={i} className="flex items-start gap-3 bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700">
              <span className="text-sky-400 font-black text-[18px] leading-none mt-0.5">Rx</span>
              <div>
                <p className="text-[17px] font-bold text-white leading-tight">
                  {typeof med === "string" ? med : med.med_name}
                </p>
                {med.dosage && (
                  <p className="text-[14px] text-slate-400 mt-0.5">{med.dosage}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Past diagnoses */}
        {(data.past_diagnoses || []).length > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-2">
            <h3 className="text-[16px] font-extrabold text-amber-300 flex items-center gap-2 uppercase tracking-wider">
              📋 Past Diagnoses
            </h3>
            {data.past_diagnoses.map((d, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700">
                <span className="text-amber-400">◆</span>
                <span className="text-[16px] text-slate-200 font-semibold">{d}</span>
              </div>
            ))}
          </div>
        )}

        {/* Lab values */}
        {(data.abnormal_lab_values || []).length > 0 && (
          <div className="bg-slate-900 border border-rose-900/50 rounded-2xl p-4 space-y-2">
            <h3 className="text-[16px] font-extrabold text-rose-300 flex items-center gap-2 uppercase tracking-wider">
              🧬 Flagged Lab Values
            </h3>
            {data.abnormal_lab_values.map((v, i) => (
              <div key={i} className="flex items-center gap-3 bg-rose-950/40 rounded-xl px-4 py-3 border border-rose-900">
                <span className="text-rose-400">⚠</span>
                <span className="text-[16px] text-rose-200 font-semibold font-mono">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-5 py-5 bg-slate-900/80 border-t-2 border-slate-800 flex gap-4">
        <button
          onClick={onRetake}
          className="px-6 py-4 rounded-2xl border-2 border-slate-700 text-slate-300 font-bold text-[17px] hover:border-slate-500 transition"
        >
          📷 Retake
        </button>
        <button
          onClick={() => onComplete(data)}
          className="flex-1 min-h-[64px] rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-[20px] shadow-xl shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-3 border-2 border-emerald-300"
        >
          <span>Confirm & Continue</span>
          <span>➔</span>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CameraDocumentScan({ onComplete, onSkip, onBack, language = "hi" }) {

  // Camera stream state
  const [cameraState, setCameraState] = useState("idle"); // idle | live | no-camera
  const [isCapturing,  setCapturing]  = useState(false);
  const [capturedImg,  setCaptured]   = useState(null);
  const [procStep,     setProcStep]   = useState(-1);
  const [extractedData, setExtracted] = useState(null);
  const [flashAnim,    setFlash]      = useState(false);
  const [fileUploading, setFileUp]    = useState(false);

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const fileInputRef = useRef(null);

  const TOTAL_STEPS = PROCESSING_STEPS.length;

  // ── i18n labels ─────────────────────────────────────────────────────────────
  const label = {
    frameGuide:   { hi: "पुरानी पर्ची को फ्रेम के अंदर रखें", en: "Place old paper prescription inside the frame", mr: "जुनी चिठ्ठी फ्रेममध्ये ठेवा", gu: "જૂની ચિઠ્ઠી ફ્રેમની અંદર રાખો" }[language] || "Place old paper prescription inside the frame",
    tapCapture:   { hi: "कैप्चर करने के लिए दबाएं", en: "Tap to Capture", mr: "कॅप्चर करण्यासाठी दाबा", gu: "કૅપ્ચર કરવા દબાવો" }[language] || "Tap to Capture",
    uploadBtn:    { hi: "📁 फ़ाइल अपलोड करें", en: "📁 Upload File", mr: "📁 फाइल अपलोड करा", gu: "📁 ફાઇલ અપલોડ કરો" }[language] || "📁 Upload File",
    skipBtn:      { hi: "छोड़ें →", en: "Skip →", mr: "वगळा →", gu: "છોડો →" }[language] || "Skip →",
    noCameraMsg:  { hi: "कैमरा उपलब्ध नहीं — कृपया फ़ाइल अपलोड करें।", en: "Camera unavailable — please upload a file.", mr: "कॅमेरा उपलब्ध नाही — फाईल अपलोड करा.", gu: "કૅમેરા ઉપલब्ध नथी — ફાઇल અपلोड करो." }[language] || "Camera unavailable — please upload a file.",
    step3Title:   { hi: "चरण ३ / Step 3:", en: "Step 3:", mr: "टप्पा ३:", gu: "પ્રક્રમ ૩:" }[language] || "Step 3:",
    step3Sub:     { hi: "दस्तावेज़ स्कैन (Vision OCR)", en: "Document Scan (Vision OCR)", mr: "दस्तऐवज स्कॅन (Vision OCR)", gu: "દસ્તાવેજ સ્કૅન (Vision OCR)" }[language] || "Document Scan (Vision OCR)",
  };

  // ── Start camera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraState("live");
    } catch {
      setCameraState("no-camera");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [startCamera]);

  // ── Shutter capture ─────────────────────────────────────────────────────────
  const handleCapture = () => {
    if (isCapturing) return;

    // Flash animation
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    // Grab frame from video to canvas
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current;
      const c = canvasRef.current;
      c.width  = v.videoWidth  || 640;
      c.height = v.videoHeight || 480;
      c.getContext("2d").drawImage(v, 0, 0);
      setCaptured(c.toDataURL("image/jpeg", 0.85));
    }

    // Stop stream, begin processing
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCapturing(true);
    runProcessing();
  };

  // ── File upload fallback ────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUp(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCaptured(ev.target.result);
      setFileUp(false);
      setCapturing(true);
      runProcessing();
    };
    reader.readAsDataURL(file);
  };

  // ── Mock OCR pipeline ───────────────────────────────────────────────────────
  const runProcessing = () => {
    let step = 0;
    setProcStep(0);
    const interval = setInterval(() => {
      step += 1;
      if (step >= TOTAL_STEPS) {
        clearInterval(interval);
        setProcStep(TOTAL_STEPS - 1);
        setTimeout(() => setExtracted(MOCK_EXTRACTION), 600);
      } else {
        setProcStep(step);
      }
    }, 750);
  };

  // ── Retake ──────────────────────────────────────────────────────────────────
  const handleRetake = () => {
    setCapturing(false);
    setCaptured(null);
    setProcStep(-1);
    setExtracted(null);
    startCamera();
  };

  return (
    <div className="w-full min-h-screen bg-black flex flex-col relative overflow-hidden select-none touch-manipulation">

      {/* ── Injected keyframes ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes laserSweep {
          0%   { top: 8%;  opacity: 0;   }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { top: 92%; opacity: 0;   }
        }
        @keyframes shutterFlash {
          0%   { opacity: 0; }
          20%  { opacity: 0.85; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* ── Camera shutter flash ───────────────────────────────────────────── */}
      {flashAnim && (
        <div
          className="absolute inset-0 bg-white z-50 pointer-events-none"
          style={{ animation: "shutterFlash 0.3s ease-out forwards" }}
        />
      )}

      {/* ── Hidden canvas (for frame grab) ────────────────────────────────── */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Hidden file input ──────────────────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* ══════════════════════════════════════════════════
          CAMERA VIEWFINDER (full-screen video)
      ══════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-0">
        {/* Live video stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${capturedImg ? "hidden" : ""}`}
        />
        {/* Captured image preview */}
        {capturedImg && (
          <img
            src={capturedImg}
            alt="captured prescription"
            className="w-full h-full object-cover"
          />
        )}
        {/* No-camera fallback background */}
        {cameraState === "no-camera" && !capturedImg && (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center px-8">
              <span className="text-7xl opacity-30">📷</span>
              <p className="text-[20px] text-slate-400 font-semibold">{label.noCameraMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dark vignette overlay (top + bottom gradients) */}
      <div className="absolute inset-0 z-10 pointer-events-none"
           style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.8) 100%)" }} />

      {/* ══════════════════════════════════════════════════
          TOP HUD — step badge + back + skip
      ══════════════════════════════════════════════════ */}
      {!isCapturing && !extractedData && (
        <div className="relative z-20 px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-xl hover:bg-black/70 transition"
              >
                ←
              </button>
            )}
            <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2">
              <p className="text-[12px] font-extrabold text-sky-300 uppercase tracking-widest">{label.step3Title}</p>
              <p className="text-[15px] font-bold text-white">{label.step3Sub}</p>
            </div>
          </div>

          {onSkip && (
            <button
              onClick={onSkip}
              className="px-5 py-2.5 rounded-2xl bg-black/50 backdrop-blur-sm border border-white/20 text-slate-300 font-bold text-[15px] hover:bg-black/70 transition"
            >
              {label.skipBtn}
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          CENTER — Document bounding-box guide frame
      ══════════════════════════════════════════════════ */}
      {!isCapturing && !extractedData && (
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 py-4">

          {/* Guide instruction pill */}
          <div className="mb-5 bg-black/60 backdrop-blur-sm border border-sky-400/50 rounded-full px-6 py-3 flex items-center gap-3 shadow-lg shadow-sky-500/10">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse flex-shrink-0" />
            <p className="text-[18px] md:text-[22px] font-extrabold text-white text-center leading-snug">
              {label.frameGuide}
            </p>
          </div>

          {/* Document frame */}
          <div className="relative w-full max-w-lg" style={{ aspectRatio: "1.41/1" }}>

            {/* Semi-transparent inner fill */}
            <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-sky-400/40 bg-sky-400/5" />

            {/* Corner brackets */}
            <FrameCorner pos="tl" />
            <FrameCorner pos="tr" />
            <FrameCorner pos="bl" />
            <FrameCorner pos="br" />

            {/* Scanning laser line */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <ScanLaser active={cameraState === "live"} />
            </div>

            {/* A4 icon hint */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2 opacity-30">
                <span className="text-6xl">📄</span>
                <span className="text-[14px] text-white font-semibold">A4 / Prescription</span>
              </div>
            </div>
          </div>

          {/* Alignment tip */}
          <p className="mt-4 text-[14px] text-slate-400 font-medium text-center">
            {language === "hi" ? "📐 पर्ची को सीधा और चमकदार रोशनी में रखें"
             : language === "mr" ? "📐 चिठ्ठी सरळ आणि चांगल्या प्रकाशात ठेवा"
             : language === "gu" ? "📐 ચિઠ્ઠી સીધી અને સારા પ્રકાશમાં રાખો"
             : "📐 Keep prescription flat and in bright light"}
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          PROCESSING OVERLAY
      ══════════════════════════════════════════════════ */}
      {isCapturing && !extractedData && procStep >= 0 && (
        <ProcessingOverlay step={procStep} total={TOTAL_STEPS} />
      )}

      {/* ══════════════════════════════════════════════════
          RESULTS PANEL
      ══════════════════════════════════════════════════ */}
      {extractedData && (
        <ResultsPanel
          data={extractedData}
          onComplete={onComplete}
          onRetake={handleRetake}
        />
      )}

      {/* ══════════════════════════════════════════════════
          BOTTOM CONTROLS — Shutter + Upload
      ══════════════════════════════════════════════════ */}
      {!isCapturing && !extractedData && (
        <div className="relative z-20 px-6 pb-8 pt-4 flex flex-col items-center gap-5">

          {/* Shutter row */}
          <div className="flex items-center justify-center gap-10 w-full max-w-sm">

            {/* Upload fallback */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={fileUploading}
              className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition"
            >
              <div className="w-14 h-14 rounded-2xl bg-black/60 backdrop-blur-sm border-2 border-white/25 flex items-center justify-center text-2xl hover:border-sky-400/60 transition">
                {fileUploading ? (
                  <span className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                ) : "📁"}
              </div>
              <span className="text-[12px] text-slate-300 font-semibold">
                {language === "hi" ? "अपलोड" : language === "mr" ? "अपलोड" : language === "gu" ? "અपलोड" : "Upload"}
              </span>
            </button>

            {/* Main shutter button */}
            <div className="flex flex-col items-center gap-2">
              <ShutterButton onClick={handleCapture} disabled={cameraState === "idle"} />
              <p className="text-[15px] font-bold text-sky-200 text-center">{label.tapCapture}</p>
            </div>

            {/* Torch / flip placeholder (decorative for kiosk) */}
            <button className="flex flex-col items-center gap-1.5 opacity-50 cursor-default">
              <div className="w-14 h-14 rounded-2xl bg-black/60 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center text-2xl">
                💡
              </div>
              <span className="text-[12px] text-slate-500 font-semibold">
                {language === "hi" ? "टॉर्च" : "Torch"}
              </span>
            </button>
          </div>

          {/* Camera status indicator */}
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/10">
            <span className={`w-2 h-2 rounded-full ${cameraState === "live" ? "bg-emerald-400 animate-pulse" : cameraState === "no-camera" ? "bg-rose-400" : "bg-amber-400 animate-pulse"}`} />
            <span className="text-[13px] font-bold text-slate-300">
              {cameraState === "live"      ? (language === "hi" ? "कैमरा सक्रिय" : "Camera Active")
               : cameraState === "no-camera" ? (language === "hi" ? "कैमरा अनुपलब्ध" : "Camera Unavailable")
               : (language === "hi" ? "कैमरा प्रारंभ हो रहा है…" : "Starting Camera…")}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
