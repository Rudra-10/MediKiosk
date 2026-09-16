#!/usr/bin/env python3
"""
dataset_formatter.py

Converts the AyurGenixAI_dataset.csv (disease-level Ayurvedic clinical
reference data) into an instruction-tuning dataset for MediKiosk's
"AI Brain" (Llama 3.1 8B, fine-tuned via Unsloth/QLoRA).

Framing (matches the MediKiosk pipeline):
    INPUT      -> a patient-style narrative built from the symptom /
                  lifestyle / history columns -- i.e. roughly what the
                  kiosk's voice interview + Bhashini STT would capture.
    OUTPUT     -> a strict, schema-conformant JSON clinical case summary
                  built from the dataset's Ayurvedic/clinical columns
                  (Doshas, Prakriti, herbs, recommendations, etc.)
    INSTRUCTION-> a fixed task prompt describing the job and the exact
                  JSON schema the model must fill in.

IMPORTANT / HONESTY NOTE:
    This dataset has NO official Ministry-of-AYUSH NAMASTE codes in it.
    The "namaste_code" field in the schema is left as null here on
    purpose -- do NOT invent codes. Map real NAMASTE codes in a
    separate step (e.g. a lookup/join against the official NAMASTE
    terminology CSV/API) before using this for the real NAMASTE-mapping
    claim in your pitch. Fine-tuning on this file alone teaches the
    model Ayurvedic reasoning style/structure, not the official coding.

Usage:
    python dataset_formatter.py \
        --csv AyurGenixAI_dataset.csv \
        --out_dir ./finetune_data \
        --val_ratio 0.1 \
        --seed 42 \
        --also_chat_text

Outputs:
    train.jsonl                -- instruction/input/output records for training
    val.jsonl                  -- held-out validation split
    full.jsonl                 -- the full converted set (no split), for inspection
    schema.json                -- the JSON schema every "output" conforms to
    ayurveda_alpaca_train.json -- standard Alpaca JSON format array

Each line of train.jsonl / val.jsonl / full.jsonl looks like:
    {
      "instruction": "...",
      "input": "...",
      "output": "{...json string...}"
    }

If --also_chat_text is passed, each record additionally gets a "text"
field with the instruction/input/output already packed into a Llama-3
chat template, ready to hand straight to a Hugging Face
SFTTrainer(dataset_text_field="text") / Unsloth run.
"""

import argparse
import csv
import json
import random
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Columns that hold comma-separated lists -> split into JSON arrays.
# Everything else is kept as a plain string (or left out of one side).
# ---------------------------------------------------------------------------
LIST_COLUMNS = {
    "Symptoms",
    "Diagnosis & Tests",
    "Risk Factors",
    "Ayurvedic Herbs",
    "Doshas",
    "Complications",
    "Herbal/Alternative Remedies",
    "Current Medications",
    "Allergies (Food/Env)",
    "Yoga & Physical Therapy",
    "Medical Intervention",
    "Patient Recommendations",
}

# Columns used to build the synthetic patient-facing INPUT narrative
# (i.e. what the kiosk's voice interview would plausibly gather).
INPUT_COLUMNS = [
    "Symptoms",
    "Symptom Severity",
    "Duration of Treatment",
    "Age Group",
    "Gender",
    "Medical History",
    "Current Medications",
    "Family History",
    "Allergies (Food/Env)",
    "Dietary Habits",
    "Sleep Patterns",
    "Stress Levels",
    "Physical Activity Levels",
    "Occupation and Lifestyle",
    "Seasonal Variation",
    "Environmental Factors",
    "Cultural Preferences",
]

# Columns mapped into the OUTPUT clinical JSON, and the JSON key each
# one becomes. Order here is the canonical schema order.
OUTPUT_FIELD_MAP = [
    ("Disease", "condition"),
    ("Hindi Name", "condition_hindi"),
    ("Marathi Name", "condition_marathi"),
    ("Symptoms", "symptoms"),
    ("Symptom Severity", "symptom_severity"),
    ("Diagnosis & Tests", "recommended_tests"),
    ("Risk Factors", "risk_factors"),
    ("Doshas", "doshas"),
    ("Constitution/Prakriti", "prakriti"),
    ("Ayurvedic Herbs", "ayurvedic_herbs"),
    ("Formulation", "formulation"),
    ("Diet and Lifestyle Recommendations", "diet_lifestyle_recommendations"),
    ("Yoga & Physical Therapy", "yoga_and_physical_therapy"),
    ("Medical Intervention", "medical_intervention"),
    ("Prevention", "prevention"),
    ("Prognosis", "prognosis"),
    ("Complications", "possible_complications"),
    ("Patient Recommendations", "patient_recommendations"),
]

SCHEMA_DICT = {
    "condition": "string | null",
    "condition_hindi": "string | null",
    "condition_marathi": "string | null",
    "namaste_code": "string | null",
    "symptoms": "string[]",
    "symptom_severity": "string | null",
    "recommended_tests": "string[]",
    "risk_factors": "string[]",
    "doshas": "string[]",
    "prakriti": "string | null",
    "ayurvedic_herbs": "string[]",
    "formulation": "string | null",
    "diet_lifestyle_recommendations": "string | null",
    "yoga_and_physical_therapy": "string[]",
    "medical_intervention": "string[]",
    "prevention": "string | null",
    "prognosis": "string | null",
    "possible_complications": "string[]",
    "patient_recommendations": "string[]",
}

INSTRUCTION_TEXT = (
    "You are MediKiosk's clinical case-taking assistant for an Ayurveda OPD. "
    "You will be given a patient's self-reported symptoms and background, "
    "gathered through a multilingual voice interview. "
    "Extract and structure this into a clinical case summary as a single, "
    "strict JSON object that exactly matches the schema below. "
    "Do not invent facts the patient did not state. If a field cannot be "
    "determined from the input, use null (or an empty list for list "
    "fields). Respond with ONLY the JSON object -- no extra text.\n\n"
    "SCHEMA:\n"
    "{\n"
    '  "condition": string | null,\n'
    '  "condition_hindi": string | null,\n'
    '  "condition_marathi": string | null,\n'
    '  "namaste_code": string | null,\n'
    '  "symptoms": string[],\n'
    '  "symptom_severity": string | null,\n'
    '  "recommended_tests": string[],\n'
    '  "risk_factors": string[],\n'
    '  "doshas": string[],\n'
    '  "prakriti": string | null,\n'
    '  "ayurvedic_herbs": string[],\n'
    '  "formulation": string | null,\n'
    '  "diet_lifestyle_recommendations": string | null,\n'
    '  "yoga_and_physical_therapy": string[],\n'
    '  "medical_intervention": string[],\n'
    '  "prevention": string | null,\n'
    '  "prognosis": string | null,\n'
    '  "possible_complications": string[],\n'
    '  "patient_recommendations": string[]\n'
    "}"
)

LLAMA3_TEMPLATE = (
    "<|start_header_id|>system<|end_header_id|>\n\n{instruction}<|eot_id|>"
    "<|start_header_id|>user<|end_header_id|>\n\n{input}<|eot_id|>"
    "<|start_header_id|>assistant<|end_header_id|>\n\n{output}<|eot_id|>"
)

NULL_PATTERNS = {
    "none",
    "none.",
    "none specific",
    "none known",
    "no family history",
    "n/a",
    "na",
    "null",
    "nil",
    "nan",
    "undefined",
    "not specified",
    "not applicable",
}


def clean(val):
    """Normalize a cell: empty/NaN/None-patterns -> None, else stripped string."""
    if val is None:
        return None
    s = str(val).strip()
    if not s or s.lower() in NULL_PATTERNS:
        return None
    return s


def to_list(val):
    """Split a comma-separated cell into a clean list of strings, filtering null terms."""
    if val is None:
        return []
    s = str(val).strip()
    if not s or s.lower() in NULL_PATTERNS:
        return []
    parts = re.split(r",\s*", s)
    result = []
    for p in parts:
        clean_p = p.strip()
        if clean_p and clean_p.lower() not in NULL_PATTERNS:
            result.append(clean_p)
    return result


def normalize_key(key: str) -> str:
    """Normalize string key for fuzzy/case-insensitive column matching."""
    return re.sub(r"[^a-z0-9]", "", str(key).lower().replace("\ufeff", ""))


def build_column_mapping(columns):
    """Map normalized column keys to actual CSV header names."""
    return {normalize_key(col): col for col in columns}


def get_field(row, key_name: str, col_map: dict):
    """Safely get column value from row using exact or fuzzy normalized match."""
    # 1. Exact match
    if key_name in row:
        return row[key_name]
    # 2. Normalized key match
    norm = normalize_key(key_name)
    if norm in col_map:
        return row.get(col_map[norm])
    # 3. Direct dictionary get
    return row.get(key_name)


def build_input_narrative(row, col_map: dict) -> str:
    """
    Turn patient-context columns into a first-person narrative,
    matching what a kiosk voice interview + Bhashini STT would capture.
    """
    lines = []

    symptoms = to_list(get_field(row, "Symptoms", col_map))
    if symptoms:
        lines.append(f"Patient reports: {', '.join(symptoms)}.")

    severity = clean(get_field(row, "Symptom Severity", col_map))
    duration = clean(get_field(row, "Duration of Treatment", col_map))
    if severity or duration:
        bit = []
        if severity:
            bit.append(f"severity appears {severity.lower()}")
        if duration:
            bit.append(f"expected/typical duration of care: {duration.lower()}")
        lines.append("Additional context: " + "; ".join(bit) + ".")

    age = clean(get_field(row, "Age Group", col_map))
    gender = clean(get_field(row, "Gender", col_map))
    if age or gender:
        demo = ", ".join(x for x in [age, gender] if x)
        lines.append(f"Patient profile: {demo}.")

    hist = clean(get_field(row, "Medical History", col_map))
    if hist:
        lines.append(f"Medical history: {hist}.")

    meds = to_list(get_field(row, "Current Medications", col_map))
    if meds:
        lines.append(f"Currently taking: {', '.join(meds)}.")

    fam = clean(get_field(row, "Family History", col_map))
    if fam:
        lines.append(f"Family history: {fam}.")

    allergies = to_list(get_field(row, "Allergies (Food/Env)", col_map))
    if allergies:
        lines.append(f"Known allergies: {', '.join(allergies)}.")

    diet = clean(get_field(row, "Dietary Habits", col_map))
    if diet:
        lines.append(f"Dietary habits: {diet}.")

    sleep = clean(get_field(row, "Sleep Patterns", col_map))
    stress = clean(get_field(row, "Stress Levels", col_map))
    activity = clean(get_field(row, "Physical Activity Levels", col_map))
    lifestyle_bits = []
    if sleep:
        lifestyle_bits.append(f"sleep: {sleep.lower()}")
    if stress:
        lifestyle_bits.append(f"stress: {stress.lower()}")
    if activity:
        lifestyle_bits.append(f"physical activity: {activity.lower()}")
    if lifestyle_bits:
        lines.append("Lifestyle factors: " + ", ".join(lifestyle_bits) + ".")

    occ = clean(get_field(row, "Occupation and Lifestyle", col_map))
    if occ:
        lines.append(f"Occupation / lifestyle: {occ}.")

    season = clean(get_field(row, "Seasonal Variation", col_map))
    env = clean(get_field(row, "Environmental Factors", col_map))
    if season or env:
        bit = ", ".join(x for x in [season, env] if x)
        lines.append(f"Seasonal / environmental factors: {bit}.")

    culture = clean(get_field(row, "Cultural Preferences", col_map))
    if culture:
        lines.append(f"Cultural / dietary preferences: {culture}.")

    return "\n".join(lines)


def build_output_json(row, col_map: dict) -> dict:
    """Build structured Ayurvedic clinical JSON matching the target schema."""
    out = {}
    for csv_col, json_key in OUTPUT_FIELD_MAP:
        if csv_col in LIST_COLUMNS:
            if csv_col == "Ayurvedic Herbs":
                # Combine primary Ayurvedic Herbs with Herbal/Alternative Remedies
                herbs = to_list(get_field(row, "Ayurvedic Herbs", col_map))
                alt_herbs = to_list(get_field(row, "Herbal/Alternative Remedies", col_map))
                combined = []
                for h in herbs + alt_herbs:
                    if h and h not in combined:
                        combined.append(h)
                out[json_key] = combined
            else:
                out[json_key] = to_list(get_field(row, csv_col, col_map))
        else:
            out[json_key] = clean(get_field(row, csv_col, col_map))

    # Official NAMASTE codes are populated via verified lookup tables, left null here.
    out["namaste_code"] = None

    ordered_keys = [
        "condition",
        "condition_hindi",
        "condition_marathi",
        "namaste_code",
        "symptoms",
        "symptom_severity",
        "recommended_tests",
        "risk_factors",
        "doshas",
        "prakriti",
        "ayurvedic_herbs",
        "formulation",
        "diet_lifestyle_recommendations",
        "yoga_and_physical_therapy",
        "medical_intervention",
        "prevention",
        "prognosis",
        "possible_complications",
        "patient_recommendations",
    ]
    return {k: out.get(k) for k in ordered_keys}


def resolve_csv_path(user_path_str: str) -> Path:
    """Find the CSV file across common relative paths and casing variations."""
    p = Path(user_path_str)
    if p.exists() and p.is_file():
        return p

    script_dir = Path(__file__).resolve().parent
    candidates = [
        script_dir / user_path_str,
        script_dir / "AyurGenixAI_Dataset.csv",
        script_dir / "AyurGenixAI_dataset.csv",
        Path("fine_tuning") / "AyurGenixAI_Dataset.csv",
        Path("fine_tuning") / "AyurGenixAI_dataset.csv",
        Path("AyurGenixAI_Dataset.csv"),
        Path("AyurGenixAI_dataset.csv"),
    ]
    for c in candidates:
        if c.exists() and c.is_file():
            return c
    return p


def read_dataset_csv(csv_path: Path):
    """Read CSV into list of dict rows and list of columns."""
    try:
        import pandas as pd
        df = pd.read_csv(csv_path)
        # Strip whitespace from column names
        df.columns = [str(c).strip().replace("\ufeff", "") for c in df.columns]
        rows = df.to_dict(orient="records")
        return rows, list(df.columns)
    except ImportError:
        with open(csv_path, mode="r", encoding="utf-8-sig", errors="replace") as f:
            reader = csv.DictReader(f)
            headers = [c.strip() for c in reader.fieldnames if c]
            rows = []
            for row in reader:
                cleaned_row = {k.strip(): v for k, v in row.items() if k}
                rows.append(cleaned_row)
            return rows, headers


def main():
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    ap.add_argument(
        "--csv",
        default="AyurGenixAI_Dataset.csv",
        help="Path to AyurGenixAI_Dataset.csv",
    )
    ap.add_argument(
        "--out_dir",
        default="./finetune_data",
        help="Output directory for generated datasets",
    )
    ap.add_argument(
        "--val_ratio",
        type=float,
        default=0.1,
        help="Fraction held out for validation (default: 0.1)",
    )
    ap.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Shuffle random seed (default: 42)",
    )
    ap.add_argument(
        "--also_chat_text",
        action="store_true",
        default=True,
        help="Include a Llama-3 chat-template 'text' field per record",
    )
    args = ap.parse_args()

    csv_path = resolve_csv_path(args.csv)
    if not csv_path.exists():
        sys.exit(f"CSV file not found: {csv_path}")

    rows, columns = read_dataset_csv(csv_path)
    print(f"Loaded {len(rows)} rows, {len(columns)} columns from {csv_path}")

    col_map = build_column_mapping(columns)

    # Verify key columns
    required_cols = ["Disease", "Symptoms"]
    missing_required = [c for c in required_cols if normalize_key(c) not in col_map]
    if missing_required:
        sys.exit(f"CSV is missing critical required columns: {missing_required}")

    records = []
    skipped = 0
    for row in rows:
        input_text = build_input_narrative(row, col_map)
        output_obj = build_output_json(row, col_map)

        if not input_text.strip() or not output_obj.get("condition"):
            skipped += 1
            continue

        record = {
            "instruction": INSTRUCTION_TEXT,
            "input": input_text,
            "output": json.dumps(output_obj, ensure_ascii=False),
        }
        if args.also_chat_text:
            record["text"] = LLAMA3_TEMPLATE.format(
                instruction=INSTRUCTION_TEXT,
                input=input_text,
                output=json.dumps(output_obj, ensure_ascii=False),
            )
        records.append(record)

    print(f"Converted {len(records)} usable records ({skipped} skipped for missing data).")

    random.seed(args.seed)
    random.shuffle(records)
    n_val = max(1, int(len(records) * args.val_ratio))
    val_records = records[:n_val]
    train_records = records[n_val:]

    out_dir = Path(args.out_dir)
    if not out_dir.is_absolute():
        out_dir = (Path(__file__).resolve().parent / args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    def write_jsonl(path: Path, recs):
        with open(path, "w", encoding="utf-8") as f:
            for r in recs:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")

    def write_json(path: Path, recs):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(recs, f, indent=2, ensure_ascii=False)

    # Write in output directory
    write_jsonl(out_dir / "full.jsonl", records)
    write_jsonl(out_dir / "train.jsonl", train_records)
    write_jsonl(out_dir / "val.jsonl", val_records)
    write_json(out_dir / "ayurveda_alpaca_train.json", train_records)
    write_json(out_dir / "ayurveda_alpaca_val.json", val_records)

    with open(out_dir / "schema.json", "w", encoding="utf-8") as f:
        json.dump(SCHEMA_DICT, f, indent=2, ensure_ascii=False)

    # Also write to fine_tuning/ directory root for convenience
    fine_tuning_dir = Path(__file__).resolve().parent
    if fine_tuning_dir != out_dir:
        write_jsonl(fine_tuning_dir / "train.jsonl", train_records)
        write_jsonl(fine_tuning_dir / "val.jsonl", val_records)
        write_json(fine_tuning_dir / "ayurveda_alpaca_train.json", train_records)

    print(f"Wrote {len(train_records)} train / {len(val_records)} val records to {out_dir}/")
    print(f"  - {out_dir / 'train.jsonl'}")
    print(f"  - {out_dir / 'val.jsonl'}")
    print(f"  - {out_dir / 'full.jsonl'}")
    print(f"  - {out_dir / 'schema.json'}")
    print(f"  - {out_dir / 'ayurveda_alpaca_train.json'}")
    print(f"  - {fine_tuning_dir / 'ayurveda_alpaca_train.json'}")

    print("\nSample record:")
    print(json.dumps(records[0], indent=2, ensure_ascii=False)[:1500])


if __name__ == "__main__":
    main()