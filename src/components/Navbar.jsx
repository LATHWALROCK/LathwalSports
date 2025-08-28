import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      {/* Logo / Brand */}
      <Link
        to="/"
        className="text-2xl font-bold text-gray-800 tracking-wide hover:text-blue-600 transition"
      >
        LATHWALSPORTS
      </Link>

      {/* Menu */}
      <div className="flex space-x-6 text-lg font-medium">
        <Link
          to="/"
          className="text-gray-700 hover:text-blue-600 transition"
        >
          Sports
        </Link>
        <Link
          to="/tournament"
          className="text-gray-700 hover:text-blue-600 transition"
        >
          Tournaments
        </Link>
        <Link
          to="/teams"
          className="text-gray-700 hover:text-blue-600 transition"
        >
          Teams
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;