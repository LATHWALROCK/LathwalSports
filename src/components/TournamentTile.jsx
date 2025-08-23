import React from "react";
import { Link } from "react-router-dom";

const Tournament = ({ title, image, sport }) => {
  return (
    <Link to={`/leagues?sport=${sport}&tournament=${title}`}>
    <div
      className="bg-white shadow-md rounded-2xl p-6 flex flex-col items-center 
                 justify-between text-lg font-semibold text-gray-700 hover:shadow-xl 
                 hover:scale-105 transition-all duration-300 cursor-pointer h-64 w-full"
    >
      <div className="w-full h-40 flex items-center justify-center p-2 bg-gray-50 rounded-lg">
        <img
          src={image}
          alt={title}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <p className="text-center mt-2">{title}</p>
    </div>
    </Link>
  );
};

export default Tournament;
