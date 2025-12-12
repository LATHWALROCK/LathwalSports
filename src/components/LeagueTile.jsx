import React, { useState } from "react";
import { Trash2, Edit } from "lucide-react";
import Team from "../components/Team";

const LeagueTile = ({ title, logo, teams, _id, onDelete, onEdit, leagueData }) => {
  // Find all winners (teams with position = 1)
  const winners = teams.filter((t) => t.position === 1);

  const [showConfirm, setShowConfirm] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirm = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(title, _id);
    setShowConfirm(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowConfirm(false);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit(_id, leagueData);
  };

  return (
    <div className="relative">
      {!showConfirm && hovered && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <button
            onClick={handleEditClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="border border-black bg-gray-100 text-black rounded-full p-1 hover:bg-gray-200 transition"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={handleDeleteClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="border border-black bg-gray-100 text-black rounded-full p-1 hover:bg-gray-200 transition"
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}

      <div
        className="bg-gray-100 ring-1 ring-black rounded-2xl p-6 mb-6 text-black"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <h2 className="text-2xl font-bold text-center mb-3">
          {title}
        </h2>

        <div className="flex flex-col items-center mb-4">
          <div className="flex items-center gap-16 flex-wrap justify-center">
            <div className="flex flex-col items-center">
              <img
                src={logo}
                alt="League Logo"
                className="w-32 h-32 object-contain rounded-xl bg-white"
              />
            </div>

            {winners.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="flex flex-wrap gap-6 justify-center">
                  {winners.map((winner, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center bg-white p-2 rounded-lg"
                    >
                      <img
                        src={winner.team.imageUrl}
                        alt={winner.team.name}
                        className="w-32 h-32 object-contain rounded-xl bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {teams.map((team, idx) => (
            <Team
              key={idx}
              title={team.team.name}
              image={team.team.imageUrl}
            />
          ))}
        </div>
      </div>

      {showConfirm && (
        <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center shadow-lg ring-1 ring-black">
          <p className="font-medium text-black">Delete "{title}"?</p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleConfirm}
              className="border border-black bg-gray-100 text-black px-3 py-1 rounded-lg hover:bg-gray-200 transition"
            >
              Yes
            </button>
            <button
              onClick={handleCancel}
              className="border border-black bg-gray-100 text-black px-3 py-1 rounded-lg hover:bg-gray-200 transition"
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
