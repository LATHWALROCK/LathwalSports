import React from "react";

const Team = ({ image }) => {
  return (
    <div className="flex justify-center items-center">
      <img
        src={image}
        alt="team"
        className="bg-white rounded-xl  h-20 w-auto object-contain 
               hover:scale-125 transition-all duration-300 cursor-pointer"
      />
    </div>
  );
};

export default Team;