/**
 * main.jsx
 * 
 * MediKiosk - Smart India Hackathon (SIH26047)
 * Problem Statement: Patient Case-Taking Software (Ministry of Ayush)
 * 
 * Frontend Entry Point:
 * - Bootstraps React 18 application with createRoot
 * - StrictMode lifecycle auditing
 * - Top-level global error boundary / uncaught rejection logger for zero-crash live demos
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// ============================================================================
// TOP-LEVEL RESILIENCE & GLOBAL ERROR MONITORING
// ============================================================================
// Prevents kiosk white-screens during live network/AI service interruptions
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    console.warn("🛡️ [MediKiosk Kiosk Engine] Handled async rejection:", event.reason);
    // Prevent default browser crash dialogs
    event.preventDefault();
  });

  window.onerror = (message, source, lineno, colno, error) => {
    console.warn(`🛡️ [MediKiosk Kiosk Engine] Runtime warning: ${message} at ${source}:${lineno}`);
    // Keep kiosk UI active
    return true;
  };
}

// ============================================================================
// REACT 18 MOUNT TARGET
// ============================================================================
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element to mount the MediKiosk application.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
