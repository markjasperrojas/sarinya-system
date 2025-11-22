// src/index.js (top of file)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { setAuthToken } from "./api";
import "./index.css"; // tailwind

// Restore token from localStorage so axios keeps the header after refresh
const token = localStorage.getItem("sarinya_token");
if (token) {
  setAuthToken(token);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
