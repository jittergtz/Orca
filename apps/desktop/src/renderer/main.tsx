import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource/instrument-serif/400-italic.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

