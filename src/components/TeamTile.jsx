import React, { useState } from "react";
import { Trash2, Edit } from "lucide-react";

const Team = ({ title, image, _id, onDelete, onEdit, teamData }) => {
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
    onEdit(_id, teamData);
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
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="bg-gray-100 ring-1 ring-black rounded-2xl p-4 flex flex-col items-center
                 justify-between text-lg font-semibold text-black hover:bg-gray-200
                 hover:scale-105 transition-all duration-300 cursor-pointer h-56 w-full"
        >
          <div className="w-full h-36 flex items-center justify-center p-1 bg-white rounded-lg">
            <img
              src={image}
              alt={title}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <p className="text-center mt-1">{title}</p>
        </div>

      {showConfirm && (
        <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center shadow-lg ring-1 ring-black">
          <p className="font-medium text-black">Delete "{title}"?</p>
          <div className="flex gap-3">
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

export default Team;
