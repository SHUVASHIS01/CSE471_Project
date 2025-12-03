/**
 * App Component
 *
 * Main application component with routing
 * Sets up React Router for navigation between pages
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ApplyPage from "./pages/ApplyPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apply/:id" element={<ApplyPage />} />
      </Routes>
    </Router>
  );
}
