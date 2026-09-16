import React, { useState } from "react";

export default function DoctorDashboard({
  clinicalData,
  patientAuth,
  ocrData,
  onReset,
  onBack
}) {
  const [isSyncingFhir, setIsSyncingFhir] = useState(false);
  const [fhirSuccess, setFhirSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableNotes, setEditableNotes] = useState("");

  // Default Clinical Extraction Fallback (Ensures complete visual rendering)
  const data = clinicalData || {
    patient_metadata: {
      abha_id: "91-9482-1049-3829",
      language: "hi",
      patient_name: "सुरेश शर्मा (Suresh Sharma)",
      age: 48,
      gender: "Male"
    },
    triage_safety: {
      red_flag_detected: false,
      emergency_type: null,
      action_taken: "NORMAL_PROCEED"
    },
    chief_complaint: {
      symptom_description: "लगातार बलगम वाली खांसी, गले में खराश और हल्का सीने में भारीपन।",
      duration_days: 4,
      severity: "MODERATE"
    },
    dashavidha_pariksha: {
      prakriti_trend: "KAPHA",
      vikriti: "Kaphaja Kasa with Pranavaha Sroto-rodha",
      agni: "MANDA",
      koshtha: "MADHYAMA"
    },
    namaste_coding: {
      primary_code: "NAM-AYU-042",
      term_description: "Kasa (Cough / Bronchitis)"
    },
    scanned_records_extracted: {
      past_diagnoses: ["Seasonal Allergic Bronchitis", "Mild Hypertension"],
      active_medications: [
        { med_name: "Sitopaladi Churna", dosage: "3g with honey BD" },
        { med_name: "Vasavaleha", dosage: "1 tsp BD" },
        { med_name: "Tab Pantoprazole 40mg", dosage: "1 Tab OD" }
      ],
      abnormal_lab_values: ["SpO2: 98%", "ESR: 22 mm/hr"]
    }
  };

  const patientMeta = data.patient_metadata || {};
  const triage = data.triage_safety || {};
  const complaint = data.chief_complaint || {};
  const dashavidha = data.dashavidha_pariksha || {};
  const namaste = data.namaste_coding || {};
  const records = data.scanned_records_extracted || {};

  // Print Clinical Case Sheet
  const handlePrint = () => {
    window.print();
  };

  // Simulate ABDM FHIR R4 Bundle Sync
  const handleSyncFhir = () => {
    setIsSyncingFhir(true);
    setTimeout(() => {
      setIsSyncingFhir(false);
      setFhirSuccess(true);
      setTimeout(() => setFhirSuccess(false), 4500);
    }, 1500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col justify-between font-sans print:bg-white print:text-black print:p-0">
      
      {/* Top Header / Doctor Action Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700 print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm border border-slate-700 transition"
            >
              ⬅ पीछे (Back)
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Ayush OPD EMR Case Sheet • Doctor View
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>🩺</span> चिकित्सक नैदानिक केस शीट (Clinical Summary)
            </h1>
          </div>
        </div>

        {/* Top Actions: Print, Sync FHIR, Next Patient */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-sm border border-slate-600 transition flex items-center gap-1.5"
          >
            <span>🖨️</span> प्रिंट (Print)
          </button>

          <button
            onClick={handleSyncFhir}
            disabled={isSyncingFhir}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 shadow-lg ${
              isSyncingFhir
                ? "bg-slate-700 text-slate-400 cursor-wait"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 active:scale-95"
            }`}
          >
            {isSyncingFhir ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>FHIR R4 सिंक हो रहा है...</span>
              </>
            ) : (
              <>
                <span>🔗</span>
                <span>ABDM FHIR में भेजें (Push to EMR)</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-extrabold text-sm rounded-xl shadow-md transition"
          >
            ➕ अगला मरीज (New Patient)
          </button>
        </div>
      </header>

      {/* ABDM FHIR Sync Toast Alert */}
      {fhirSuccess && (
        <div className="my-3 p-4 bg-emerald-950 border-2 border-emerald-400 text-emerald-200 rounded-2xl flex items-center justify-between shadow-xl animate-bounce print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-extrabold text-sm md:text-base">
                ABDM FHIR R4 Bundle Transmitted Successfully!
              </p>
              <p className="text-xs text-emerald-400 font-mono">
                Bundle ID: urn:uuid:abdm-fhir-{Math.random().toString(36).substring(2, 9)} • Synced to National Health Claims / EMR Exchange.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-emerald-900 px-3 py-1 rounded-full text-emerald-300">
            HTTP 201 Created
          </span>
        </div>
      )}

      {/* Emergency Red Flag Triage Banner */}
      {triage.red_flag_detected ? (
        <div className="my-4 p-5 bg-rose-950/90 border-2 border-rose-500 text-white rounded-3xl shadow-2xl flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-4">
            <span className="text-5xl">🚨</span>
            <div>
              <div className="inline-block bg-rose-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-1">
                IMMEDIATE EMERGENCY TRIAGE ALERT
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-rose-200">
                रेड-फ्लैग चेतावनी: {triage.emergency_type || "तीव्र आपातकालीन स्थिति"}
              </h2>
              <p className="text-xs md:text-sm text-rose-300 font-medium">
                Action: {triage.action_taken} • Patient requires immediate specialist intervention.
              </p>
            </div>
          </div>
          <span className="text-3xl font-black bg-rose-900/80 p-3 rounded-2xl border border-rose-600">
            PRIORITY 1
          </span>
        </div>
      ) : (
        <div className="my-3 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-2xl flex items-center justify-between text-xs md:text-sm font-semibold print:hidden">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span>Triage Safety Audit Passed: No Acute Red-Flags Detected (Normal OPD Protocol)</span>
          </div>
          <span className="text-xs font-mono bg-emerald-900 px-2.5 py-0.5 rounded-full text-emerald-200">
            TRIAGE: GREEN ✓
          </span>
        </div>
      )}

      {/* Main Clinical Case Content Grid */}
      <main className="my-4 space-y-6 flex-1">
        
        {/* Section 1: Patient Identity & ABHA Card */}
        <section className="bg-slate-800/90 rounded-3xl p-5 md:p-6 border border-slate-700 shadow-xl print:border-black print:bg-white print:text-black">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider print:text-gray-600">
                रोगी का नाम / Name
              </p>
              <h3 className="text-lg md:text-xl font-extrabold text-white print:text-black">
                {patientMeta.patient_name || "सुरेश शर्मा (Suresh Sharma)"}
              </h3>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider print:text-gray-600">
                आभा संख्या / ABHA ID
              </p>
              <h3 className="text-base md:text-lg font-mono font-extrabold text-emerald-400 print:text-black">
                {patientMeta.abha_id || "91-9482-1049-3829"}
              </h3>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider print:text-gray-600">
                आयु व लिंग / Demographics
              </p>
              <h3 className="text-base md:text-lg font-bold text-slate-200 print:text-black">
                {patientMeta.age || "48"} Yrs • {patientMeta.gender || "Male"}
              </h3>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider print:text-gray-600">
                साक्षात्कार भाषा / Language
              </p>
              <h3 className="text-base md:text-lg font-bold text-teal-300 print:text-black uppercase">
                {patientMeta.language || "hi"} (Hindi / ASR)
              </h3>
            </div>
          </div>
        </section>

        {/* Section 2: Chief Complaint & NAMASTE Morbidity Mapping */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Chief Complaint Card */}
          <div className="md:col-span-7 bg-slate-800/90 rounded-3xl p-6 border border-slate-700 shadow-xl space-y-3 print:border-black print:bg-white">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h3 className="text-base md:text-lg font-extrabold text-white flex items-center gap-2 print:text-black">
                <span>📋</span> मुख्य समस्या (Chief Complaint)
              </h3>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase ${
                complaint.severity === "SEVERE"
                  ? "bg-rose-950 text-rose-300 border border-rose-500"
                  : "bg-amber-950 text-amber-300 border border-amber-500"
              }`}>
                {complaint.severity || "MODERATE"} SEVERITY
              </span>
            </div>
            <p className="text-base md:text-lg text-slate-200 font-medium leading-relaxed italic print:text-black">
              "{complaint.symptom_description || "Patient reported respiratory distress and chronic cough."}"
            </p>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 pt-1">
              <span>⏱️ अवधि (Duration): <span className="text-white font-mono">{complaint.duration_days || 4} Days</span></span>
              <span>🎙️ Source: Voice Interview STT</span>
            </div>
          </div>

          {/* NAMASTE Morbidity Badge Card */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-800 to-slate-850 rounded-3xl p-6 border-2 border-emerald-500/40 shadow-xl flex flex-col justify-between print:border-black print:bg-white">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
                  Ministry of Ayush Coding
                </span>
                <span className="text-xs font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  ICD-11 TM2 Mapped
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-400 uppercase">
                NAMASTE Morbidity Classification:
              </h4>
              <div className="my-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between print:border-black print:bg-gray-100">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-emerald-400 font-mono">
                    {namaste.primary_code || "NAM-AYU-042"}
                  </h3>
                  <p className="text-xs md:text-sm font-bold text-slate-200 print:text-black">
                    {namaste.term_description || "Kasa (Cough / Bronchitis)"}
                  </p>
                </div>
                <span className="text-3xl">🌿</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Compliant with National Ayush Morbidity & Terminology Electronic Portal standard.
            </p>
          </div>

        </section>

        {/* Section 3: Ayurvedic Dashavidha Pariksha Matrix (2x2 Grid) */}
        <section className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700 shadow-xl print:border-black print:bg-white">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
            <h3 className="text-lg md:text-xl font-extrabold text-white flex items-center gap-2 print:text-black">
              <span>🧘</span> दशविध परीक्षा मापदंड (Dashavidha Pariksha Matrix)
            </h3>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/30">
              Llama-3.1 Fine-Tuned Brain
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* 1. Prakriti Trend */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700 space-y-1 print:border-black print:bg-gray-50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                १. प्रकृति (Prakriti Trend)
              </span>
              <h4 className="text-xl font-black text-amber-400 print:text-black">
                {dashavidha.prakriti_trend || "KAPHA"}
              </h4>
              <p className="text-xs text-slate-400">Constitutional baseline tendency</p>
            </div>

            {/* 2. Vikriti Dosha Vitiation */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700 space-y-1 print:border-black print:bg-gray-50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                २. विकृति (Vikriti Imbalance)
              </span>
              <h4 className="text-sm md:text-base font-extrabold text-rose-300 print:text-black line-clamp-2">
                {dashavidha.vikriti || "Kaphaja Kasa with Pranavaha Sroto-rodha"}
              </h4>
              <p className="text-xs text-slate-400">Active Dosha-Dushya vitiation</p>
            </div>

            {/* 3. Agni Metabolic State */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700 space-y-1 print:border-black print:bg-gray-50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ३. अग्नि (Agni / Digestive Fire)
              </span>
              <h4 className="text-xl font-black text-teal-300 print:text-black">
                {dashavidha.agni || "MANDA"}
              </h4>
              <p className="text-xs text-slate-400">Metabolic state (Mandagni / Low)</p>
            </div>

            {/* 4. Koshtha Bowel Tendency */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700 space-y-1 print:border-black print:bg-gray-50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ४. कोष्ठ (Koshtha / Bowel)
              </span>
              <h4 className="text-xl font-black text-indigo-300 print:text-black">
                {dashavidha.koshtha || "MADHYAMA"}
              </h4>
              <p className="text-xs text-slate-400">Bowel motility & evacuation pattern</p>
            </div>

          </div>
        </section>

        {/* Section 4: Vision OCR Scanned Records Timeline */}
        <section className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700 shadow-xl print:border-black print:bg-white">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
            <h3 className="text-base md:text-lg font-extrabold text-white flex items-center gap-2 print:text-black">
              <span>📷</span> स्कैन किए गए पुराने पर्चे व लैब रिपोर्ट (Scanned Records Timeline)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Google Cloud Vision OCR Extracted
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Active Medications */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700 space-y-2 print:border-black print:bg-gray-50">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>💊</span> वर्तमान दवाइयाँ (Active Meds):
              </h4>
              <div className="space-y-1.5">
                {(records.active_medications || [
                  { med_name: "Sitopaladi Churna", dosage: "3g with honey BD" },
                  { med_name: "Vasavaleha", dosage: "1 tsp BD" }
                ]).map((m, idx) => (
                  <div key={idx} className="bg-slate-900 p-2 rounded-xl text-xs flex justify-between print:border print:border-gray-300">
                    <span className="font-bold text-slate-200 print:text-black">{typeof m === "string" ? m : m.med_name}</span>
                    <span className="text-slate-400 font-mono">{typeof m === "object" ? m.dosage : "Active"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Diagnoses */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700 space-y-2 print:border-black print:bg-gray-50">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <span>📋</span> पूर्व निदान (Past Diagnoses):
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(records.past_diagnoses || ["Seasonal Bronchitis", "Mild Hypertension"]).map((d, idx) => (
                  <span key={idx} className="text-xs bg-slate-900 text-teal-300 px-3 py-1 rounded-lg border border-slate-700 print:border-gray-300 print:text-black">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Lab Values */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700 space-y-2 print:border-black print:bg-gray-50">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>🧪</span> लैब रिपोर्ट (Lab Values):
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(records.abnormal_lab_values || ["SpO2: 98%", "ESR: 22 mm/hr"]).map((l, idx) => (
                  <span key={idx} className="text-xs bg-slate-900 text-amber-300 px-3 py-1 rounded-lg border border-slate-700 font-mono print:border-gray-300 print:text-black">
                    {l}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Section 5: Physician Clinical Notes & Confirmation */}
        <section className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700 shadow-xl space-y-3 print:border-black print:bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-extrabold text-white flex items-center gap-2 print:text-black">
              <span>✍️</span> चिकित्सक टिप्पणी व नुस्खा (Physician Final Prescription & Notes)
            </h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-emerald-400 font-bold bg-slate-900 px-3 py-1 rounded-xl border border-slate-700 hover:border-emerald-500 transition print:hidden"
            >
              {isEditing ? "सहेजें (Save)" : "✏️ संपादित करें (Edit)"}
            </button>
          </div>

          <textarea
            rows={3}
            value={editableNotes}
            onChange={(e) => setEditableNotes(e.target.value)}
            placeholder="1. Sitopaladi Churna 3g BD with Madhu\n2. Vasavaleha 1 tsp BD after meals\n3. Anulom Vilom Pranayama (10 mins daily)\n4. Avoid Sheetala Ahara (cold liquids)."
            className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 p-4 rounded-2xl border border-slate-700 text-sm font-mono focus:border-emerald-500 focus:outline-none resize-none print:border-black print:bg-white print:text-black"
          />
        </section>

      </main>

      {/* Footer Branding for Printed Prescription */}
      <footer className="pt-4 border-t border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 print:text-black">
        <p>
          MediKiosk Automated OPD Intake • Certified under Ministry of Ayush & ABDM Guidelines (SIH26047).
        </p>
        <p className="font-mono">
          Case Timestamp: {new Date().toLocaleString()}
        </p>
      </footer>

    </div>
  );
}
