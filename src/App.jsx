import "./App.css"
import { Route, Routes } from "react-router-dom"
import Sport from "./pages/Sport"
import Tournament from "./pages/Tournament"
import League from "./pages/League"
import Navbar from "./components/Navbar"
import Team from "./pages/Team"

function App() {

  return (
    <div>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<Sport />} />
        <Route path="/tournament" element={<Tournament />} />
        <Route path="/leagues" element={<League />} />
        <Route path="/teams" element={<Team />} />
      </Routes>
    </div>
  )
}

export default App
