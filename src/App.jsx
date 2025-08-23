import "./App.css"
import { Route, Routes } from "react-router-dom"
import Sport from "./pages/Sport"
import Tournament from "./pages/Tournament"
import League from "./pages/League"

function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<Sport />} />
        <Route path="/tournament" element={<Tournament />} />
        <Route path="/leagues" element={<League />} />
      </Routes>
    </div>
  )
}

export default App
