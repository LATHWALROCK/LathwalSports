import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

const Sport = ({ title, onDelete }) => {
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

      {/* Tile with Link */}
      <Link to={`/tournament?sport=${title}`}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="bg-white shadow-md rounded-2xl p-6 flex items-center justify-center 
                     text-lg font-semibold text-gray-700 hover:shadow-xl 
                     hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          {title}
        </div>
      </Link>

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

export default Sport;