import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";
import { initializeLocalData } from "./services/localDataService.js";

function syncAuthHeaders() {
  try {
    const user = JSON.parse(localStorage.getItem("eventai_user") || "null");
    const role = user?.role || "guest";
    const email = user?.email || "";

    axios.defaults.headers.common["x-user-role"] = role;
    axios.defaults.headers.common["x-user-email"] = email;
  } catch (error) {
    axios.defaults.headers.common["x-user-role"] = "guest";
    axios.defaults.headers.common["x-user-email"] = "";
  }
}

syncAuthHeaders();
initializeLocalData();

window.addEventListener("storage", syncAuthHeaders);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(15,15,26,0.9)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "#f1f5f9",
            fontFamily: "Inter, sans-serif",
          },
          success: { iconTheme: { primary: "#06b6d4", secondary: "#0f0f1a" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#0f0f1a" } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
