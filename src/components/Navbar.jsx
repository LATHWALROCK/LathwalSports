import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sportEndpoints } from "../services/apis";
import { toast } from "react-hot-toast";

const { GET_SPORT } = sportEndpoints;

const Navbar = () => {
  const [showTournamentPopup, setShowTournamentPopup] = useState(false);
  const [sports, setSports] = useState([]);

  const fetchSports = () => {
    fetch(GET_SPORT)
      .then((response) => response.json())
      .then((result) => {
        setSports(result.data || []);
      })
      .catch((error) => {
        toast.error("Failed to fetch sports");
        console.error("FETCH SPORTS ERROR:", error);
      });
  };

  const handleTournamentClick = (e) => {
    e.preventDefault();
    setShowTournamentPopup(true);
    fetchSports();
  };

  const handleClosePopup = () => {
    setShowTournamentPopup(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white text-black px-6 py-4 flex justify-between items-center shadow-md">
        <Link to="/" className="text-2xl font-bold tracking-wide">
          LATHWALSPORTS
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link to="/" className="hover:text-blue-600">
            Sports
          </Link>
          <button
            onClick={handleTournamentClick}
            className="hover:text-blue-600 cursor-pointer"
          >
            Tournament
          </button>
          <Link to="/teams" className="hover:text-blue-600">
            Teams
          </Link>
        </div>
      </nav>

      {/* Tournament Popup */}
      {showTournamentPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]"
          onClick={handleClosePopup}
        >
          <div
            className="bg-white text-black rounded-2xl shadow-lg p-8 w-full max-w-4xl max-h-[80vh] overflow-y-auto ring-1 ring-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Select a Sport</h2>
              <button
                onClick={handleClosePopup}
                className="text-gray-500 hover:text-black text-2xl font-bold transition"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sports.map((sport) => (
                <Link
                  key={sport._id}
                  to={`/tournament?sport=${sport._id}`}
                  onClick={handleClosePopup}
                >
                  <div className="bg-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-center text-lg font-semibold text-black hover:bg-gray-200 hover:scale-105 transition-all duration-300 cursor-pointer">
                    {sport.name}
                  </div>
                </Link>
              ))}
            </div>
            {sports.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No sports available
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
