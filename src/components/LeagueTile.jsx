import React from "react";
import Team from "../components/Team";

const LeagueTile = ({ year, logo, teams }) => {
  const winner = teams[0]; // assuming first team is winner

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
            <h2 className="text-xl font-bold text-gray-800">{year}</h2>
          </div>

          {/* Winner Logo + Name */}
          <div className="flex flex-col items-center bg-green-50 p-2">
            <img
              src={winner.image}
              alt={winner.name}
              className="w-32 h-32 object-contain rounded-xl mb-2"
            />
            <p className="text-lg font-bold text-gray-800">{winner.name}</p>
          </div>
        </div>
      </div>

      {/* Grid of Teams */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {teams.map((team, idx) => (
          <Team key={idx} title={team.name} image={team.image} />
        ))}
      </div>
    </div>
  );
};

export default LeagueTile;
