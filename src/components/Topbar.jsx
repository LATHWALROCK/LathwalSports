import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import { Plus, Shield, User } from "lucide-react";

export default function Topbar() {
  const {
    isAdmin,
    toggleAdmin,
    openAddEditionModal,
  } = useSports();

  const location = useLocation();

  return (
    <header className="topbar">
      <div className="wrap">
        <Link to="/" className="brand">
          <span className="brand-mark">🏆</span>
          Champions<span>Tracker</span>
        </Link>

        <nav className="nav">
          <Link
            to="/"
            className={location.pathname === "/" ? "active" : ""}
          >
            Dashboard
          </Link>
          <Link
            to="/tournaments"
            className={location.pathname === "/tournaments" || location.pathname === "/competitions" ? "active" : ""}
          >
            Tournaments
          </Link>
          <Link
            to="/teams"
            className={location.pathname === "/teams" ? "active" : ""}
          >
            Teams
          </Link>
          <Link
            to="/explore"
            className={location.pathname === "/explore" ? "active" : ""}
          >
            Explore
          </Link>
        </nav>

        {/* Topbar Right: Admin Toggle & Add Edition Button */}
        <div className="topbar-right">
          <div className="admin-toggle" title="Switch between normal public view and admin view">
            <button
              type="button"
              className={!isAdmin ? "active" : ""}
              onClick={() => isAdmin && toggleAdmin()}
            >
              <User size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
              Normal
            </button>
            <button
              type="button"
              className={isAdmin ? "active admin-mode" : ""}
              onClick={() => !isAdmin && toggleAdmin()}
            >
              <Shield size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
              Admin
            </button>
          </div>

          {isAdmin && (
            <button
              type="button"
              className="btn-add-edition"
              onClick={() => openAddEditionModal()}
              title="Add a new edition to any competition"
            >
              <Plus size={16} /> Add Edition
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
