import React from "react";

const Team = ({ image }) => {
  return (
    <div className="flex justify-center items-center">
      <img
        src={image}
        alt="team"
        className="bg-white rounded-xl  h-20 w-auto object-contain 
<<<<<<< HEAD
               hover:scale-125 transition-all duration-300 cursor-pointer"
=======
              hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
>>>>>>> 998bdd77afbc93ea00d39cc23d627932bc3d1084
      />
    </div>
  );
};

export default Team;