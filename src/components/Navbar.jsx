import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white text-black px-6 py-4 flex justify-center items-center shadow-md">
        <Link to="/" className="text-2xl font-bold tracking-wide">
          LATHWALSPORTS
        </Link>
      </nav>
    </>
  );
};

export default Navbar;
