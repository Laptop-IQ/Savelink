import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Open the connection to the API server right away (DNS + TLS) so the first
// request doesn't pay for it.
try {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_URL;

  if (apiBase) {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = new URL(apiBase).origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }
} catch {
  /* invalid URL -> skip */
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
