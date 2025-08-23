import React from "react";
import { Link } from "react-router-dom";

const Sport = ({ title }) => {
  return (
    <Link to={`/tournament?sport=${title}`}>
      <div
        className="bg-white shadow-md rounded-2xl p-6 flex items-center justify-center 
                   text-lg font-semibold text-gray-700 hover:shadow-xl 
                   hover:scale-105 transition-all duration-300 cursor-pointer"
      >
        {title}
      </div>
    </Link>
  );
};

export default Sport;
