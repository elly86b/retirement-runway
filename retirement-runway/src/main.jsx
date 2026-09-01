import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// The calculator saves your inputs through a `window.storage` API that only
// exists inside Claude's own preview. This polyfill gives it the same shape,
// backed by the browser's normal localStorage, so saving/loading a profile
// works the same way on a real website. Each person's data stays on their
// own device — it never syncs between phones.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(key);
      if (raw == null) throw new Error("not found");
      return { key, value: raw };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(key);
      return { key, deleted: true };
    },
    async list(prefix) {
      const keys = Object.keys(localStorage).filter((k) => !prefix || k.startsWith(prefix));
      return { keys, prefix };
    },
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
