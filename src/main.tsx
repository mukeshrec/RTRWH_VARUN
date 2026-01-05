import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// <StrictMode> has been removed to allow drawing 4+ points in Leaflet
createRoot(document.getElementById("root")!).render(
    <App />
);
