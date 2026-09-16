"""
dataset_formatter.py
Script converting AyurGenixAI CSV to Alpaca JSONL format for fine-tuning.
"""
import csv
import json
import sys

def convert_csv_to_alpaca_jsonl(input_csv_path, output_jsonl_path):
    alpaca_data = []
    
    with open(input_csv_path, mode='r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            alpaca_entry = {
                "instruction": (
                    "You are an Ayurvedic Clinical AI Assistant. Extract structured clinical parameters "
                    "(Dashavidha Pariksha, chief complaint, triage red flags, NAMASTE codes) from the given patient dialogue."
                ),
                "input": row.get("patient_intake_text", ""),
                "output": row.get("extracted_clinical_json", "")
            }
            alpaca_data.append(alpaca_entry)
            
    with open(output_jsonl_path, mode='w', encoding='utf-8') as outfile:
        for entry in alpaca_data:
            outfile.write(json.dumps(entry, ensure_ascii=False) + '\n')
            
    print(f"Successfully converted {len(alpaca_data)} records to {output_jsonl_path}")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        convert_csv_to_alpaca_jsonl(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python dataset_formatter.py <input_csv_path> <output_jsonl_path>")