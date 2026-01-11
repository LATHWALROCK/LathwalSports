import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Edit } from "lucide-react";

const Sport = ({ title, image, _id, onDelete, onEdit, sportData }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const navigate = useNavigate();

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowConfirm(true); // show confirm box on tile
  };

  const handleConfirm = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(_id);
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
    onEdit(_id, title, sportData);
  };

  const handleTileClick = () => {
    setShowTypeSelector(true);
  };

  const handleTypeSelect = (type) => {
    setShowTypeSelector(false);
    navigate(`/tournament?sport=${_id}&type=${type}`);
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
        onClick={handleTileClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="bg-gray-100 shadow-md rounded-2xl p-4 flex flex-col items-start
               justify-between text-lg font-semibold text-black hover:bg-gray-200
               transition-all duration-300 cursor-pointer aspect-[3/2]"
      >
        <div className="w-full flex-1 flex items-center justify-center p-2">
          <img
            src={image}
            alt={title}
            className="max-h-full max-w-full object-contain rounded-xl"
          />
        </div>

        <p className="text-left text-base px-2 break-words overflow-hidden w-full" style={{ maxHeight: '3rem', lineHeight: '1.5rem', marginTop: '0px' }} title={title}>{title}</p>
      </div>

      {showConfirm && (
        <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center ring-1 ring-black">
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

      {/* Tournament Type Selector Modal */}
      {showTypeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowTypeSelector(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold text-center mb-8">{title} Tournaments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* International Tournament Card */}
              <div
                onClick={() => handleTypeSelect("International")}
                className="bg-gray-100 shadow-md rounded-2xl p-8 flex flex-col items-center justify-center
                           text-center hover:bg-gray-200 hover:scale-105 transition-all duration-300
                           cursor-pointer min-h-[150px]"
              >
                <h3 className="text-2xl font-bold">International Tournaments</h3>
              </div>

              {/* League Card */}
              <div
                onClick={() => handleTypeSelect("League")}
                className="bg-gray-100 shadow-md rounded-2xl p-8 flex flex-col items-center justify-center
                           text-center hover:bg-gray-200 hover:scale-105 transition-all duration-300
                           cursor-pointer min-h-[150px]"
              >
                <h3 className="text-2xl font-bold">Leagues</h3>
              </div>
            </div>
            <button
              onClick={() => setShowTypeSelector(false)}
              className="mt-6 w-full bg-gray-100 text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sport;
