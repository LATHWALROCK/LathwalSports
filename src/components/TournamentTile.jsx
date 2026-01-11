import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Edit } from "lucide-react";

const Tournament = ({ title, image, sport, _id, type, onDelete, onEdit }) => {
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

  const handleEditClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit(_id, title);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowConfirm(false);
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

      <Link to={`/leagues?sport=${sport}&tournament=${_id}&type=${type}`}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="bg-gray-100 shadow-md rounded-2xl p-4 flex flex-col items-center
                 text-lg font-semibold text-black hover:bg-gray-200
                 transition-all duration-300 cursor-pointer aspect-[3/2]"
        >
          <div className="w-full h-32 flex items-center justify-center mb-2">
            <img
              src={image}
              alt={title}
              className="max-h-full max-w-full object-contain rounded-xl"
            />
          </div>

          <p className="text-center text-base px-2 break-words overflow-hidden w-full h-12 flex items-center justify-center" style={{ lineHeight: '1.5rem' }} title={title}>{title}</p>
        </div>
      </Link>

      {showConfirm && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center ring-1 ring-black">
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

export default Tournament;
