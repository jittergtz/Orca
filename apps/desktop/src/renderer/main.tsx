import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource/instrument-serif/400-italic.css";
import "./index.css";
import { ErrorBoundary } from "./ErrorBoundary";

console.log("[RENDERER] ════ main.tsx executing ════");
console.log("[RENDERER] document.getElementById('root'):", document.getElementById("root"));

try {
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    console.error("[RENDERER] FATAL: #root element not found!");
    document.body.innerHTML = '<pre style="color:red;background:white;padding:20px;font-size:16px;">FATAL: #root element not found!</pre>';
  } else {
    console.log("[RENDERER] Creating React root...");
    const root = createRoot(rootEl);
    console.log("[RENDERER] Rendering App...");
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("[RENDERER] Render complete — if you see this, React mounted successfully");
  }
} catch (e: any) {
  console.error("[RENDERER] FATAL ERROR during render:", e);
  document.body.innerHTML = `<pre style="color:red;background:white;padding:20px;font-size:14px;white-space:pre-wrap;">FATAL RENDER ERROR:\n${e.message}\n\n${e.stack}</pre>`;
}
