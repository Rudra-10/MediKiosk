const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Allows frontend to communicate with backend
app.use(express.json()); // Parses incoming JSON requests

// Initialize Groq Client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. Root Route (Crucial for Render Health Check)
app.get('/', (req, res) => {
    res.status(200).json({ status: 'MediKiosk API is live!' });
});

// 2. Main AI Processing Route
app.post('/api/analyze', async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Patient transcript is required.' });
        }

        const prompt = `You are an expert Ayurvedic clinical AI. Analyze the following patient transcript and extract the clinical parameters. 
        You MUST respond in STRICT JSON format with the following exact keys:
        - "red_flags": (boolean) true if there is an acute emergency, false otherwise.
        - "chief_complaint": (string) brief summary of symptoms.
        - "dashavidha_pariksha": (object) containing keys "prakriti", "vikriti", "agni", and "koshtha" with brief string values.
        - "namaste_code": (string) a mock Ayush NAMASTE morbidity code (e.g., NAM-AYU-042).
        
        Patient Transcript: "${transcript}"`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        // Send the structured JSON back to your React frontend
        const result = JSON.parse(completion.choices[0].message.content);
        res.json(result);

    } catch (error) {
        console.error('Groq API Error:', error);
        res.status(500).json({ error: 'Failed to process AI request', details: error.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});