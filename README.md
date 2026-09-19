#  MediKiosk: AI-Powered Ayurvedic Diagnostic Kiosk
## [Problem Statement ID: 26047]

![SIH 2026](https://img.shields.io/badge/Smart_India_Hackathon-2026-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Prototype_Live-success?style=for-the-badge)

**Live Demo:** [https://medi-kiosk-silk.vercel.app/](https://medi-kiosk-silk.vercel.app/)


##  The Problem: Why Does This Project Exist?
Imagine a rural Primary Health Centre (PHC) where an Ayurvedic doctor is seeing 100 patients a day. 
* **The Language Barrier:** Patients describe symptoms in local dialects, but doctors must record them in standard Ayurvedic terms.
* **The Time Sink:** Doctors spend 15 minutes per patient just asking basic background questions and writing notes on paper.
* **Low Digital Literacy:** We cannot just give patients a mobile app to fill out forms, because many elderly or rural patients do not know how to type or use complex digital interfaces.

**The Result:** Massive waiting lines, exhausted doctors, and unorganized paper records that get lost.

##  Our Solution: MediKiosk
**MediKiosk is an AI-powered, voice-first hardware kiosk meant to sit in the hospital waiting room.** 

Instead of waiting in line to give basic details to a receptionist or doctor, the patient walks up to the kiosk:
1. **Zero Typing:** The patient taps a giant microphone button and simply speaks their symptoms in their native language (e.g., Hindi, Gujarati, Marathi).
2. **AI Translation:** Our custom AI listens, understands the regional dialect, and translates the raw audio into a highly structured Ayurvedic medical format (*Dashavidha Pariksha*).
3. **Instant EMR:** The AI automatically maps the symptoms to standard **Ministry of Ayush NAMASTE codes** and sends a formatted dashboard directly to the doctor's computer.

**The Impact:** By the time the patient walks into the cabin, the doctor already has a complete, standard-compliant digital health record. Case-taking time is reduced from 15 minutes to 2 minutes.

---

##  Key Features (Currently Active in Prototype)
* **Custom Ayurvedic AI Brain:** Powered by Meta Llama 3.1 8B (via Groq LPU) to provide sub-second clinical parameter extraction.
* **Strict JSON Clinical Formatting:** Forces the AI to output exact data keys (Dashavidha Pariksha, Chief Complaint) without hallucinations.
* **Automated Safety Triage:** Asynchronously scans patient input for emergency red flags (e.g., "chest pain") and flashes a priority alert to the physician.
* **Zero-Literacy UI/UX:** A massive 2x3 touch grid and intuitive voice waveforms built in React, requiring zero typing skills.
* **Live Doctor Dashboard:** A clean, actionable OPD view for the physician, complete with instant NAMASTE morbidity codes.

##  Roadmap & Phase 2 Pipeline (Mocked for SIH Prototype)
*To focus on perfecting our custom AI reasoning engine during this 24-hour hackathon, the following hardware/third-party integrations are mocked in the current UI and planned for Phase 2:*
* **Live ABHA Authentication:** Connecting the Auth UI to the ABDM Sandbox for live QR patient verification.
* **Bhashini API Integration:** Replacing standard browser speech APIs with Bhashini for true native Hindi/Gujarati/Marathi ASR & TTS.
* **Google Cloud Vision OCR:** Activating the camera pipeline to parse and extract data from old, handwritten paper prescriptions.
* **Edge-LPU Deployment:** Moving from cloud inference to local hospital servers using 4-bit quantized LoRA models, ensuring the kiosk works even without internet.

---

##  Project File Structure
Our architecture cleanly decouples the frontend client from the AI backend server.

```text
MediKiosk/
├── frontend/                  # React (Vite) Application (Hosted on Vercel)
│   ├── src/
│   │   ├── components/        
│   │   │   ├── AuthConsentScreen.jsx    # DPDP-compliant ABHA login UI
│   │   │   ├── CameraDocumentScan.jsx   # OCR Prescription scanner UI
│   │   │   ├── DoctorDashboard.jsx      # Final clinical EMR matrix
│   │   │   └── DualModeInterview.jsx    # Voice & Touch intake screen
│   │   ├── App.jsx            # Main Router
│   │   └── main.jsx           # React Entry Point
│   ├── package.json           # Frontend dependencies
│   └── tailwind.config.js     # UI Styling rules
│
├── backend/                   # Node.js API (Hosted on Render)
│   ├── src/
│   │   └── server.js          # Express server & Groq LLM integration logic
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables (Groq API keys, etc.)
│
└── README.md                  # Project documentation
```

## Tech Stack
Frontend UI: React.js, Vite, Tailwind CSS, Web Audio API

Backend API: Node.js, Express.js

AI & Inference: Meta Llama 3.1 8B (Custom QLoRA fine-tuned), Groq API

Deployment: Vercel (Frontend CDN), Render (Backend Server)

## Local Setup Instructions
Note: We highly recommend using the Live Vercel link for demos. If you must run it locally, follow these steps.

1. Clone the repository

```text
git clone [https://github.com/Rudra-10/MediKiosk.git](https://github.com/Rudra-10/MediKiosk.git)
cd MediKiosk
```
2. Setup the Backend API

```text
cd backend
npm install
```
Create a .env file in the backend folder and add: GROQ_API_KEY=your_key_here

Start the server: node src/server.js (Runs on port 5000)

3. Setup the Frontend UI
Open a new terminal window:

```text
cd frontend
npm install
npm run dev
```
The app will be accessible at http://localhost:5173
    