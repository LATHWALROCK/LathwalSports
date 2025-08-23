import React from "react";

const Team = ({ image }) => {
  return (
    <img
      src={image}
      alt="team"
      className="bg-white rounded-xl  h-20 w-auto object-contain 
                 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
    />
  );
};

export default Team;
