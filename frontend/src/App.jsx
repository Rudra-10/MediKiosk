import React, { useState } from "react";
import AuthConsentScreen from "./components/AuthConsentScreen";
import DualModeInterview from "./components/DualModeInterview";
import CameraDocumentScan from "./components/CameraDocumentScan";
import DoctorDashboard from "./components/DoctorDashboard";

// Baseline Mock Data for Judge Presentation Quick-Jumps
const DEFAULT_DEMO_CLINICAL_DATA = {
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
    symptom_description: "पिछले ४ दिनों से लगातार बलगम वाली खांसी, गले में खराश और हल्का सीने में भारीपन।",
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

const STEPS = [
  { id: 1, name: "1. पहचान व सहमति (Auth)", icon: "🪪" },
  { id: 2, name: "2. आवाज/टच साक्षात्कार (Intake)", icon: "🎙️" },
  { id: 3, name: "3. दस्तावेज़ स्कैन (Vision OCR)", icon: "📷" },
  { id: 4, name: "4. डॉक्टर डैशबोर्ड (Doctor EMR)", icon: "🩺" }
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  // Global State across Kiosk Steps
  const [patientAuth, setPatientAuth] = useState({
    abhaId: "91-9482-1049-3829",
    language: "hi",
    consentGiven: true
  });

  const [intakeData, setIntakeData] = useState(DEFAULT_DEMO_CLINICAL_DATA);
  const [ocrData, setOcrData] = useState(null);

  // Step 1: Auth Completed
  const handleAuthComplete = (authPayload) => {
    setPatientAuth(authPayload);
    setCurrentStep(2);
  };

  // Step 2: Voice/Touch Interview Completed
  const handleIntakeComplete = (clinicalPayload) => {
    setIntakeData((prev) => ({
      ...prev,
      ...clinicalPayload,
      patient_metadata: {
        ...prev.patient_metadata,
        ...(clinicalPayload.patient_metadata || {}),
        abha_id: patientAuth.abhaId,
        language: patientAuth.language
      }
    }));
    setCurrentStep(3);
  };

  // Step 3: Document OCR Completed / Skipped
  const handleOcrComplete = (extractedDocs) => {
    setOcrData(extractedDocs);
    if (extractedDocs) {
      setIntakeData((prev) => ({
        ...prev,
        scanned_records_extracted: {
          past_diagnoses: [
            ...(prev.scanned_records_extracted?.past_diagnoses || []),
            ...(extractedDocs.past_diagnoses || [])
          ],
          active_medications: [
            ...(prev.scanned_records_extracted?.active_medications || []),
            ...(extractedDocs.active_medications || [])
          ],
          abnormal_lab_values: [
            ...(prev.scanned_records_extracted?.abnormal_lab_values || []),
            ...(extractedDocs.abnormal_lab_values || [])
          ]
        }
      }));
    }
    setCurrentStep(4);
  };

  const handleOcrSkip = () => {
    setCurrentStep(4);
  };

  // Step 4: Reset Kiosk for Next Patient
  const handleResetKiosk = () => {
    setPatientAuth({
      abhaId: "91-9482-1049-3829",
      language: "hi",
      consentGiven: true
    });
    setIntakeData(DEFAULT_DEMO_CLINICAL_DATA);
    setOcrData(null);
    setCurrentStep(1);
  };

  // Jump directly to a step (for SIH Hackathon Jury Demos)
  const handleJumpToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
    setShowDemoMenu(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Persistent Navigation & Progress Bar */}
      <nav className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Hackathon Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xl shadow-md shadow-emerald-500/20">
              🌿
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                MediKiosk <span className="text-xs text-emerald-400 font-extrabold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/40">SIH26047</span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Ministry of Ayush • Voice-First Dual-Mode Case-Taking Kiosk
              </p>
            </div>
          </div>

          {/* Stepper Progress Badges */}
          <div className="hidden lg:flex items-center gap-2">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => handleJumpToStep(step.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30"
                      : isPast
                      ? "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700"
                      : "bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300"
                  }`}
                >
                  <span>{step.icon}</span>
                  <span>{step.name}</span>
                  {isPast && <span className="text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Jury Demo Switcher & Step Indicator */}
          <div className="flex items-center gap-2 relative">
            <div className="text-right mr-1">
              <span className="text-xs font-bold text-slate-400 block sm:inline">
                Step {currentStep} of 4
              </span>
            </div>

            {/* Quick-Jump Dropdown Trigger */}
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 border border-emerald-400/40"
            >
              <span>⚡ डेमो स्विचर (Jury Demo)</span>
              <span>{showDemoMenu ? "▲" : "▼"}</span>
            </button>

            {/* Dropdown Modal */}
            {showDemoMenu && (
              <div className="absolute right-0 top-11 w-64 bg-slate-900 border-2 border-emerald-500/60 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
                <div className="p-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                    त्वरित स्क्रीन चयन (Quick Jump)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Directly test any of the 4 kiosk screens:
                  </p>
                </div>
                <div className="space-y-1">
                  {STEPS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleJumpToStep(s.id)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition ${
                        currentStep === s.id
                          ? "bg-emerald-500 text-slate-950"
                          : "text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-base">{s.icon}</span>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* Screen Router */}
      <div className="flex-1 w-full flex flex-col justify-center">
        {currentStep === 1 && (
          <AuthConsentScreen onComplete={handleAuthComplete} />
        )}

        {currentStep === 2 && (
          <DualModeInterview
            abhaId={patientAuth.abhaId}
            language={patientAuth.language}
            onComplete={handleIntakeComplete}
            onNext={handleIntakeComplete}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <CameraDocumentScan
            language={patientAuth.language}
            onComplete={handleOcrComplete}
            onSkip={handleOcrSkip}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <DoctorDashboard
            clinicalData={intakeData}
            patientAuth={patientAuth}
            ocrData={ocrData}
            onReset={handleResetKiosk}
            onBack={() => setCurrentStep(3)}
          />
        )}
      </div>

    </div>
  );
}
