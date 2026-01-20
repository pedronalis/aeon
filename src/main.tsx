import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/globals.css";

console.log("[main.tsx] Starting application...");

const rootElement = document.getElementById("root");
console.log("[main.tsx] Root element:", rootElement);

if (rootElement) {
  console.log("[main.tsx] Creating React root...");
  const root = ReactDOM.createRoot(rootElement);
  console.log("[main.tsx] Rendering App...");
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
  console.log("[main.tsx] Render called");
} else {
  console.error("[main.tsx] Root element not found!");
}
