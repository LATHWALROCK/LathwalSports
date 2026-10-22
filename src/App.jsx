import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SportsProvider } from "./context/SportsContext";
import Topbar from "./components/Topbar";
import ScrollToTop from "./components/ScrollToTop";
import Dashboard from "./pages/Dashboard";
import CompetitionDetail from "./pages/CompetitionDetail";
import TeamDetail from "./pages/TeamDetail";
import Explore from "./pages/Explore";

// Modals
import AddEditionModal from "./components/modals/AddEditionModal";
import CreateSportModal from "./components/modals/CreateSportModal";
import CreateTournamentModal from "./components/modals/CreateTournamentModal";
import CreateTeamModal from "./components/modals/CreateTeamModal";
import DeleteEditionModal from "./components/modals/DeleteEditionModal";

import "./App.css";

function AppContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <ScrollToTop />
      <Topbar />

      <main style={{ flex: 1 }}>
        <div className="wrap">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/competition/:id" element={<CompetitionDetail />} />
            <Route path="/c/:id" element={<CompetitionDetail />} />
            <Route path="/team/:id" element={<TeamDetail />} />
            <Route path="/explore" element={<Explore />} />
            {/* Legacy route fallbacks */}
            <Route path="/tournament" element={<Navigate to="/" replace />} />
            <Route path="/leagues" element={<Navigate to="/explore" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <footer>
        <div className="wrap">
          <span>Champions Tracker · Comprehensive Sports Winners &amp; Roll of Honour</span>
          <span>Logos and trademarks belong to their respective owners.</span>
        </div>
      </footer>

      {/* Referenced Modals System */}
      <AddEditionModal />
      <CreateSportModal />
      <CreateTournamentModal />
      <CreateTeamModal />
      <DeleteEditionModal />
    </div>
  );
}

export default function App() {
  return (
    <SportsProvider>
      <AppContent />
    </SportsProvider>
  );
}
