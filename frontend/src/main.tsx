/**
 * Invoice³ - AI-Powered Invoice Processing System
 * 
 * Author: Subash Natarajan
 * LinkedIn: https://www.linkedin.com/in/subashn/
 * Email: suboss87@gmail.com
 * 
 * Built for LandingAI Financial Hackathon 2024
 */
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.title = "Invoice³ - AI-Powered Invoice Processing";

// Author information
console.log(
  "%cInvoice³ %c- AI-Powered Invoice Processing",
  "color: #3b82f6; font-size: 20px; font-weight: bold;",
  "color: #6b7280; font-size: 14px;"
);
console.log(
  "%cCreated by: %cSubash Natarajan",
  "color: #6b7280;",
  "color: #3b82f6; font-weight: bold;"
);
console.log(
  "%c💼 LinkedIn: %chttps://www.linkedin.com/in/subashn/",
  "color: #6b7280;",
  "color: #0077b5;"
);
console.log(
  "%c📧 Email: %csuboss87@gmail.com",
  "color: #6b7280;",
  "color: #3b82f6;"
);
console.log(
  "%c✨ Built for LandingAI Financial Hackathon 2024",
  "color: #10b981; font-style: italic;"
);

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.error("Root element not found");
}
