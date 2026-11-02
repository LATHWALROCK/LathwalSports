import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SportsProvider } from "./context/SportsContext";
import Topbar from "./components/Topbar";
import ScrollToTop from "./components/ScrollToTop";
import Dashboard from "./pages/Dashboard";
import CompetitionDetail from "./pages/CompetitionDetail";
import TeamDetail from "./pages/TeamDetail";
import Explore from "./pages/Explore";
import Teams from "./pages/Teams";
import Tournaments from "./pages/Tournaments";

// Modals
import AddEditionModal from "./components/modals/AddEditionModal";
import CreateSportModal from "./components/modals/CreateSportModal";
import CreateTournamentModal from "./components/modals/CreateTournamentModal";
import CreateTeamModal from "./components/modals/CreateTeamModal";
import DeleteEditionModal from "./components/modals/DeleteEditionModal";

import "./App.css";

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-[#07090f] text-[#eef2f8] selection:bg-[#00e39b]/30 selection:text-white">
      <ScrollToTop />
      <Topbar />

      <main className="flex-1 py-5 sm:py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/competitions" element={<Navigate to="/tournaments" replace />} />
            <Route path="/competition/:id" element={<CompetitionDetail />} />
            <Route path="/c/:id" element={<CompetitionDetail />} />
            <Route path="/team/:id" element={<TeamDetail />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/all-teams" element={<Navigate to="/teams" replace />} />
            <Route path="/explore" element={<Explore />} />
            {/* Legacy route fallbacks */}
            <Route path="/tournament" element={<Navigate to="/tournaments" replace />} />
            <Route path="/leagues" element={<Navigate to="/explore" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <footer className="border-t border-[#232c40] bg-[#07090f]/80 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8b96ad] gap-2 text-center sm:text-left">
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
