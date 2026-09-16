import React, { useState, useEffect, useRef } from "react";

// ─── Severity badge color map ─────────────────────────────────────────────────
const SEVERITY_MAP = {
  MILD:     { bg: "bg-emerald-950", border: "border-emerald-500", text: "text-emerald-300", dot: "bg-emerald-400" },
  MODERATE: { bg: "bg-amber-950",   border: "border-amber-500",   text: "text-amber-300",   dot: "bg-amber-400"   },
  SEVERE:   { bg: "bg-rose-950",    border: "border-rose-500",    text: "text-rose-300",     dot: "bg-rose-400"    },
};

const AGNI_MAP = {
  MANDA:    { label: "Manda (Low)",    color: "text-sky-300",    bg: "bg-sky-950/60",    border: "border-sky-700"    },
  TIKSHNA:  { label: "Tikshna (High)", color: "text-rose-300",   bg: "bg-rose-950/60",   border: "border-rose-700"   },
  VISHAMA:  { label: "Vishama (Erratic)", color: "text-amber-300", bg: "bg-amber-950/60", border: "border-amber-700" },
  SAMA:     { label: "Sama (Balanced)", color: "text-emerald-300", bg: "bg-emerald-950/60", border: "border-emerald-700" },
};

// ─── Section card wrapper ─────────────────────────────────────────────────────
function Card({ title, icon, children, className = "", accent = "emerald", badge }) {
  const accentMap = {
    emerald: "border-emerald-700/60 from-emerald-900/20",
    sky:     "border-sky-700/60     from-sky-900/20",
    amber:   "border-amber-700/60   from-amber-900/20",
    violet:  "border-violet-700/60  from-violet-900/20",
    rose:    "border-rose-700/60    from-rose-900/20",
    teal:    "border-teal-700/60    from-teal-900/20",
  };
  const titleMap = {
    emerald: "text-emerald-300",
    sky:     "text-sky-300",
    amber:   "text-amber-300",
    violet:  "text-violet-300",
    rose:    "text-rose-300",
    teal:    "text-teal-300",
  };
  return (
    <div className={`bg-gradient-to-br ${accentMap[accent]} to-slate-900 border ${accentMap[accent].split(" ")[0]} rounded-2xl overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <h3 className={`font-extrabold text-[15px] uppercase tracking-wider ${titleMap[accent]}`}>{title}</h3>
        </div>
        {badge && <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">{badge}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Dashavidha row ───────────────────────────────────────────────────────────
function DashaRow({ label, value, sub, colorClass = "text-white" }) {
  return (
    <div className="flex flex-col bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700 gap-0.5">
      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className={`text-[18px] font-black leading-tight ${colorClass}`}>{value}</span>
      {sub && <span className="text-[12px] text-slate-400 font-medium">{sub}</span>}
    </div>
  );
}

// ─── Red-flag flashing banner ─────────────────────────────────────────────────
function RedFlagBanner({ data }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setVisible((v) => !v), 700);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`w-full transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-40"}`}>
      <div className="bg-rose-600 border-y-4 border-rose-300 px-6 py-4 flex items-center gap-4 shadow-2xl shadow-rose-500/40">
        <span className="text-4xl animate-bounce flex-shrink-0">🚨</span>
        <div className="flex-1">
          <p className="text-[20px] font-black text-white uppercase tracking-wide">
            RED FLAG ALERT — Immediate Clinical Attention Required
          </p>
          <p className="text-[15px] text-rose-100 font-semibold mt-0.5">
            {data?.emergency_type || "Emergency condition detected"} · Action: {data?.action_taken || "ESCALATE"}
          </p>
        </div>
        <span className="text-[13px] font-extrabold bg-rose-950/60 border border-rose-400 rounded-xl px-4 py-2 text-rose-200 uppercase tracking-wider flex-shrink-0">
          ⚠ DO NOT PROCEED WITHOUT PHYSICIAN
        </span>
      </div>
    </div>
  );
}

// ─── Print stylesheet injected once ──────────────────────────────────────────
const PRINT_STYLE = `
  @media print {
    body { background: #fff !important; color: #000 !important; font-size: 12px; }
    .no-print { display: none !important; }
    .print-page { background: #fff !important; color: #000 !important; }
    .card-print { border: 1px solid #ccc !important; background: #fff !important; color: #000 !important; break-inside: avoid; }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function DoctorDashboard({ clinicalData, patientAuth, ocrData, onReset, onBack }) {

  const [emrPushed,    setEmrPushed]    = useState(false);
  const [emrPushing,   setEmrPushing]   = useState(false);
  const [editMode,     setEditMode]     = useState(false);
  const [printTriggered, setPrint]      = useState(false);
  const printRef = useRef(null);

  // ── Derive display data from props ──────────────────────────────────────────
  const D = clinicalData || {};
  const meta       = D.patient_metadata    || {};
  const triage     = D.triage_safety       || {};
  const complaint  = D.chief_complaint     || {};
  const dasha      = D.dashavidha_pariksha || {};
  const namaste    = D.namaste_coding      || {};
  const scanned    = D.scanned_records_extracted || {};
  const recommended = D.recommended_tests  || [];
  const formulation = D.ayurvedic_formulations || [];

  const hasRedFlag  = triage.red_flag_detected === true;
  const severity    = SEVERITY_MAP[complaint.severity] || SEVERITY_MAP.MILD;
  const agni        = AGNI_MAP[(dasha.agni || "SAMA").toUpperCase()] || AGNI_MAP.SAMA;

  // ── Push to ABDM FHIR (mock) ────────────────────────────────────────────────
  const handlePushEMR = async () => {
    setEmrPushing(true);
    await new Promise((r) => setTimeout(r, 2200));
    setEmrPushing(false);
    setEmrPushed(true);
  };

  // ── Print ────────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    setPrint(true);
    setTimeout(() => { window.print(); setPrint(false); }, 200);
  };

  return (
    <div ref={printRef} className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col print-page">

      <style>{PRINT_STYLE}</style>

      {/* ══════════════════════════════════════════════════
          RED FLAG EMERGENCY BANNER (conditional + flashing)
      ══════════════════════════════════════════════════ */}
      {hasRedFlag && <RedFlagBanner data={triage} />}

      {/* ══════════════════════════════════════════════════
          PATIENT IDENTITY HEADER BAR
      ══════════════════════════════════════════════════ */}
      <div className="w-full bg-slate-900 border-b-2 border-slate-800 px-5 py-4 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition text-lg">
              ←
            </button>
          )}
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-700 flex items-center justify-center text-2xl font-black text-white shadow-lg">
            {(meta.patient_name || "P").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[22px] font-extrabold text-white leading-tight">{meta.patient_name || "Unknown Patient"}</p>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <span className="text-[13px] bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-0.5 text-slate-300 font-mono font-bold">
                🪪 {meta.abha_id || patientAuth?.abhaId || "—"}
              </span>
              {meta.age  && <span className="text-[13px] bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-0.5 text-slate-300 font-semibold">{meta.age}y</span>}
              {meta.gender && <span className="text-[13px] bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-0.5 text-slate-300 font-semibold">{meta.gender}</span>}
              <span className="text-[13px] bg-emerald-950 border border-emerald-700 rounded-lg px-2.5 py-0.5 text-emerald-300 font-bold uppercase">
                🌐 {(meta.language || patientAuth?.language || "hi").toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: timestamp + triage status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-[14px] ${hasRedFlag ? "bg-rose-950 border-rose-500 text-rose-300" : "bg-emerald-950 border-emerald-600 text-emerald-300"}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${hasRedFlag ? "bg-rose-400 animate-pulse" : "bg-emerald-400"}`} />
            {hasRedFlag ? "🚨 RED FLAG" : "✅ TRIAGE CLEAR"}
          </div>
          <div className="text-right text-[12px] text-slate-500 font-medium">
            <p>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
            <p>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MAIN CLINICAL GRID
      ══════════════════════════════════════════════════ */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 py-5 grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* 1 ── CHIEF COMPLAINT ──────────────────────────────────────────── */}
          <Card title="Chief Complaint" icon="🗣️" accent="sky" badge={`${complaint.duration_days ?? "?"}d duration`}>
            <div className="space-y-4">

              {/* Severity pill + duration */}
              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${severity.bg} ${severity.border}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${severity.dot}`} />
                  <span className={`text-[15px] font-extrabold ${severity.text} uppercase tracking-wide`}>
                    {complaint.severity || "MILD"} Severity
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700">
                  <span className="text-slate-400 text-[14px]">⏱ Duration:</span>
                  <span className="text-white font-extrabold text-[15px]">{complaint.duration_days ?? "?"} days</span>
                </div>
              </div>

              {/* Symptom description */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Transcript (Verbatim)</p>
                <p className="text-[17px] text-slate-100 font-medium leading-relaxed">
                  {complaint.symptom_description || "No complaint description recorded."}
                </p>
              </div>

              {/* Recommended tests strip */}
              {recommended.length > 0 && (
                <div>
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Recommended Investigations</p>
                  <div className="flex flex-wrap gap-2">
                    {recommended.map((t, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-sky-950/60 border border-sky-800 text-sky-300 text-[13px] font-bold">
                        🔬 {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* 2 ── AYURVEDIC DASHAVIDHA PARIKSHA ────────────────────────────── */}
          <Card title="Dashavidha Pariksha Matrix" icon="🕉️" accent="violet" badge="Ayurvedic Assessment">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <DashaRow
                label="Prakriti (Constitution)"
                value={dasha.prakriti_trend || "—"}
                colorClass={dasha.prakriti_trend === "KAPHA" ? "text-sky-300" : dasha.prakriti_trend === "PITTA" ? "text-amber-300" : "text-rose-300"}
              />
              <DashaRow
                label="Vikriti (Imbalance)"
                value={(dasha.vikriti || "—").split(" ")[0]}
                sub={dasha.vikriti?.includes(" ") ? dasha.vikriti.split(" ").slice(1).join(" ") : undefined}
                colorClass="text-rose-300"
              />
              <div className={`flex flex-col rounded-xl px-4 py-3 border gap-0.5 ${agni.bg} ${agni.border}`}>
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Agni (Digestive Fire)</span>
                <span className={`text-[18px] font-black leading-tight ${agni.color}`}>{dasha.agni || "SAMA"}</span>
                <span className="text-[12px] text-slate-400 font-medium">{agni.label}</span>
              </div>
              <DashaRow
                label="Koshtha (Bowel)"
                value={dasha.koshtha || "—"}
                colorClass="text-teal-300"
              />
            </div>

            {/* Dosha bar visualization */}
            <div className="mt-4 space-y-2">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Dosha Dominance Estimate</p>
              {[
                { name: "Vata", color: "bg-violet-500", pct: dasha.prakriti_trend === "VATA" ? 65 : 25 },
                { name: "Pitta", color: "bg-amber-500", pct: dasha.prakriti_trend === "PITTA" ? 65 : 20 },
                { name: "Kapha", color: "bg-sky-500",   pct: dasha.prakriti_trend === "KAPHA" ? 65 : 15 },
              ].map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-slate-400 w-12 flex-shrink-0">{d.name}</span>
                  <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.pct}%`, transition: "width 1s ease" }} />
                  </div>
                  <span className="text-[12px] font-bold text-slate-500 w-8 text-right">{d.pct}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 3 ── AYURVEDIC FORMULATIONS ────────────────────────────────────── */}
          {formulation.length > 0 && (
            <Card title="Suggested Ayurvedic Formulations" icon="🌿" accent="teal">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formulation.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 bg-teal-950/40 border border-teal-800/60 rounded-xl px-4 py-3">
                    <span className="text-teal-400 font-black text-[20px] leading-none mt-0.5">Rx</span>
                    <div>
                      <p className="text-[15px] font-bold text-white">{typeof f === "string" ? f : f.name}</p>
                      {f.dosage && <p className="text-[13px] text-slate-400 mt-0.5">{f.dosage}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* 4 ── NAMASTE MORBIDITY CODE ────────────────────────────────────── */}
          <Card title="NAMASTE Morbidity Code" icon="🏥" accent="amber" badge="Ministry of Ayush">
            <div className="flex flex-col items-center gap-4 py-2">

              {/* Primary code — prominently large */}
              <div className="w-full bg-amber-950/50 border-2 border-amber-600 rounded-2xl px-6 py-5 text-center shadow-lg shadow-amber-500/10">
                <p className="text-[12px] font-extrabold text-amber-500 uppercase tracking-[0.2em] mb-1">Primary Code</p>
                <p className="text-[36px] font-black text-amber-300 font-mono tracking-wide">
                  {namaste.primary_code || "—"}
                </p>
                <p className="text-[15px] text-amber-200/80 font-semibold mt-1">
                  {namaste.term_description || "—"}
                </p>
              </div>

              {/* Secondary badges */}
              <div className="w-full grid grid-cols-2 gap-2">
                {[
                  { label: "System",   val: "Kasa-Shwasa" },
                  { label: "ICD-11",   val: "CA23" },
                  { label: "SNOMED",   val: "49727002" },
                  { label: "Version",  val: "NAMASTE v2.1" },
                ].map((b) => (
                  <div key={b.label} className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{b.label}</p>
                    <p className="text-[13px] font-bold text-slate-200 font-mono">{b.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* 5 ── SCANNED RECORDS TIMELINE ──────────────────────────────────── */}
          <Card title="Scanned Prescription Records" icon="📄" accent="emerald" badge="Vision OCR">
            <div className="space-y-4">

              {/* Medications */}
              {(scanned.active_medications || []).length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[12px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Active Medications
                  </p>
                  {scanned.active_medications.map((med, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700">
                      <span className="text-emerald-400 font-black text-[15px] leading-none mt-0.5 flex-shrink-0">Rx</span>
                      <div>
                        <p className="text-[14px] font-bold text-white leading-tight">
                          {typeof med === "string" ? med : med.med_name}
                        </p>
                        {med.dosage && <p className="text-[12px] text-slate-400">{med.dosage}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-slate-500 italic">No medications extracted.</p>
              )}

              {/* Past diagnoses */}
              {(scanned.past_diagnoses || []).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[12px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Past Diagnoses
                  </p>
                  {scanned.past_diagnoses.map((d, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-amber-950/30 border border-amber-900/50 rounded-xl px-3 py-2">
                      <span className="text-amber-400 text-[13px]">◆</span>
                      <span className="text-[13px] text-slate-300 font-semibold">{d}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Abnormal lab values */}
              {(scanned.abnormal_lab_values || []).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[12px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block animate-pulse" /> Out-of-Range Labs
                  </p>
                  {scanned.abnormal_lab_values.map((v, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-rose-950/40 border border-rose-900 rounded-xl px-3 py-2">
                      <span className="text-rose-400 text-[13px] flex-shrink-0">⚠</span>
                      <span className="text-[13px] text-rose-200 font-bold font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 6 ── TRIAGE DETAILS CARD ───────────────────────────────────────── */}
          <Card title="Triage Safety Status" icon={hasRedFlag ? "🚨" : "✅"} accent={hasRedFlag ? "rose" : "emerald"}>
            <div className="space-y-2">
              {[
                { label: "Red Flag Detected", val: hasRedFlag ? "YES" : "NO", danger: hasRedFlag },
                { label: "Emergency Type",    val: triage.emergency_type  || "None" },
                { label: "Action Taken",      val: triage.action_taken    || "NORMAL_PROCEED" },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5">
                  <span className="text-[13px] font-bold text-slate-400">{r.label}</span>
                  <span className={`text-[13px] font-extrabold font-mono ${r.danger ? "text-rose-300" : "text-emerald-300"}`}>{r.val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════
          ACTION TOOLBAR — sticky bottom
      ══════════════════════════════════════════════════ */}
      <footer className="no-print sticky bottom-0 z-30 w-full bg-slate-900/95 backdrop-blur-md border-t-2 border-slate-800 px-5 py-4 shadow-2xl shadow-black/50">
        <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-3">

          {/* Left: reset kiosk */}
          <div className="flex items-center gap-3">
            {onReset && (
              <button
                onClick={onReset}
                className="px-5 py-3 rounded-xl border-2 border-slate-700 text-slate-400 font-bold text-[15px] hover:border-slate-500 hover:text-slate-200 transition flex items-center gap-2"
              >
                <span>🔄</span>
                <span className="hidden sm:inline">New Patient</span>
              </button>
            )}
          </div>

          {/* Center: main actions */}
          <div className="flex items-center gap-3 flex-wrap justify-center">

            {/* Edit Case Sheet */}
            <button
              onClick={() => setEditMode((e) => !e)}
              className={`
                px-6 py-3 rounded-xl border-2 font-bold text-[15px] transition flex items-center gap-2
                ${editMode
                  ? "bg-amber-500 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/30"
                  : "bg-slate-800 border-slate-600 text-slate-200 hover:border-amber-500/60 hover:text-amber-300"}
              `}
            >
              <span>✏️</span>
              <span>{editMode ? "Editing…" : "Edit Case Sheet"}</span>
            </button>

            {/* Confirm & Print */}
            <button
              onClick={handlePrint}
              className="px-6 py-3 rounded-xl border-2 border-sky-600 bg-sky-950/60 text-sky-300 font-bold text-[15px] hover:bg-sky-900/60 hover:border-sky-400 transition flex items-center gap-2 shadow-md shadow-sky-500/10"
            >
              <span>🖨️</span>
              <span>Confirm & Print</span>
            </button>

            {/* Push to ABDM FHIR EMR */}
            <button
              onClick={handlePushEMR}
              disabled={emrPushing || emrPushed}
              className={`
                px-7 py-3 rounded-xl border-2 font-black text-[15px] transition flex items-center gap-2 shadow-xl
                ${emrPushed
                  ? "bg-emerald-700 border-emerald-400 text-white shadow-emerald-500/20 cursor-default"
                  : emrPushing
                  ? "bg-emerald-800 border-emerald-600 text-emerald-300 animate-pulse cursor-wait"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20 active:scale-95"}
              `}
            >
              {emrPushing ? (
                <>
                  <span className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
                  <span>Pushing to FHIR…</span>
                </>
              ) : emrPushed ? (
                <>
                  <span>✅</span>
                  <span>Pushed to ABDM FHIR</span>
                </>
              ) : (
                <>
                  <span>🏥</span>
                  <span>Push to EMR (ABDM FHIR)</span>
                </>
              )}
            </button>
          </div>

          {/* Right: ABDM compliance badge */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2">
            <span className="text-emerald-400 text-lg">🔒</span>
            <div className="text-right">
              <p className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider">ABDM FHIR R4</p>
              <p className="text-[10px] text-slate-500 font-medium">DPDP Act 2023 Compliant</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
