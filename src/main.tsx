import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import App from "./app/App.tsx";
import BrochureDigital from "./app/pages/BrochureDigital.tsx";
import BrochureDigitalMobile from "./app/pages/BrochureDigitalMobile.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/politica-de-tratamiento-de-datos" replace />} />
      <Route path="/politica-de-tratamiento-de-datos" element={<App />} />
      <Route path="/brochure-digital" element={<BrochureDigital />} />
      <Route path="/brochure-digital-mobile" element={<BrochureDigitalMobile />} />
    </Routes>
  </BrowserRouter>
);
