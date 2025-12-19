import "./App.css"
import { Route, Routes } from "react-router-dom"
import Sport from "./pages/Sport"
import Tournament from "./pages/Tournament"
import League from "./pages/League"
import Navbar from "./components/Navbar"
import Team from "./pages/Team"
import TeamDetail from "./pages/TeamDetail"

function App() {

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar></Navbar>
      <div className="h-16"></div>
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Sport />} />
          <Route path="/tournament" element={<Tournament />} />
          <Route path="/leagues" element={<League />} />
          <Route path="/teams" element={<Team />} />
          <Route path="/team/:id" element={<TeamDetail />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
