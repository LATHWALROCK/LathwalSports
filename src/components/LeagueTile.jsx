import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import Team from "../components/Team";

const LeagueTile = ({ title, logo, teams, onDelete }) => {
  const winner = teams[0]; // assuming first team is winner

  const [showConfirm, setShowConfirm] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowConfirm(true); // show confirm box on tile
  };

  const handleConfirm = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(title);
    setShowConfirm(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowConfirm(false);
  };

  return (

    <div className="relative">
      {/* Delete Button */}
      {!showConfirm && hovered && (<button
        onClick={handleDeleteClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="absolute top-2 right-2 z-10 bg-red-500 text-black rounded-full p-1 hover:bg-red-600"
      >
        <Trash2 size={20} />
      </button>)}

      <div className="bg-white shadow-md rounded-2xl p-6 mb-6"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}>
        {/* First Row: League Logo + Year & Winner */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-16">
            {/* League Logo + Year */}
            <div className="flex flex-col items-center">
              <img
                src={logo}
                alt="League Logo"
                className="w-32 h-32 object-contain rounded-xl mb-2"
              />
            </div>

            {/* Winner Logo + Name */}
            <div className="flex flex-col items-center bg-green-50 p-2">
              <img
                src={winner.image}
                alt={winner.name}
                className="w-32 h-32 object-contain rounded-xl mb-2"
              />
            </div>
=======
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 mb-6">
      {/* First Row: League Logo + Year & Winner */}
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center gap-16">
          {/* League Logo + Year */}
          <div className="flex flex-col items-center">
            <img
              src={logo}
              alt="League Logo"
              className="w-32 h-32 object-contain rounded-xl mb-2"
            />
          </div>

          {/* Winner Logo + Name */}
          <div className="flex flex-col items-center bg-green-50 p-2">
            <img
              src={winner.image}
              alt={winner.name}
              className="w-32 h-32 object-contain rounded-xl mb-2"
            />
>>>>>>> 998bdd77afbc93ea00d39cc23d627932bc3d1084
          </div>
        </div>

        {/* Grid of Teams */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {teams.map((team, idx) => (
            <Team key={idx} title={team.name} image={team.image} />
          ))}
        </div>
      </div>

      {/* Confirmation Box */}
      {showConfirm && (
        <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center shadow-lg">
          <p className="text-gray-800 font-medium">Delete "{title}"?</p>
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="px-3 py-1 bg-red-500 text-gray-700e rounded-lg hover:bg-red-600"
            >
              Yes
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueTile;
