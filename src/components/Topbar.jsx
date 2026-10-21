import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import Logo from "./Logo";
import { Search as SearchIcon, Plus, Shield, User } from "lucide-react";

export default function Topbar() {
  const {
    tournaments,
    teams,
    isAdmin,
    toggleAdmin,
    openAddEditionModal,
  } = useSports();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchRef = useRef(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build searchable index from real database entities
  const q = searchQuery.trim().toLowerCase();
  const matchedTournaments = q
    ? tournaments
        .filter((t) => t.name.toLowerCase().includes(q) || (t.sport?.name && t.sport.name.toLowerCase().includes(q)))
        .slice(0, 6)
        .map((t) => ({
          id: t._id,
          name: t.name,
          sub: `${t.sport?.name || "Sport"} · ${t.type === "League" ? "Club / League" : "International"}`,
          url: t.imageUrl,
          link: `/competition/${t._id}`,
          type: "competition",
        }))
    : [];

  const matchedTeams = q
    ? teams
        .filter(
          (tm) =>
            tm.name.toLowerCase().includes(q) ||
            (tm.short && tm.short.toLowerCase().includes(q)) ||
            (tm.country && tm.country.toLowerCase().includes(q)) ||
            (tm.city && tm.city.toLowerCase().includes(q))
        )
        .slice(0, 6)
        .map((tm) => ({
          id: tm._id,
          name: tm.name,
          sub: `Team · ${tm.city || tm.country || tm.type}`,
          url: tm.imageUrl,
          color: tm.color,
          short: tm.short,
          link: `/team/${tm._id}`,
          type: "team",
        }))
    : [];

  const searchHits = [...matchedTournaments, ...matchedTeams].slice(0, 8);

  const handleKeyDown = (e) => {
    if (!isOpen || !searchHits.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev + 1) % searchHits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev - 1 + searchHits.length) % searchHits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = searchHits[Math.max(highlightIdx, 0)];
      if (target) {
        navigate(target.link);
        setIsOpen(false);
        setSearchQuery("");
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

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
            to="/explore"
            className={location.pathname === "/explore" ? "active" : ""}
          >
            Explore
          </Link>
        </nav>

        {/* Global Search */}
        <div className="search" ref={searchRef}>
          <SearchIcon />
          <input
            type="search"
            placeholder="Search teams or competitions…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
              setHighlightIdx(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {isOpen && searchQuery.trim() && (
            <div className="search-results">
              {searchHits.length > 0 ? (
                searchHits.map((item, idx) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.link}
                    className={idx === highlightIdx ? "hl" : ""}
                    onClick={() => {
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <Logo
                      url={item.url}
                      label={item.name}
                      short={item.short}
                      color={item.color || "#2a3246"}
                      size="sm"
                    />
                    <span>
                      <b>{item.name}</b>
                      <small>{item.sub}</small>
                    </span>
                  </Link>
                ))
              ) : (
                <div className="empty">No matches found for “{searchQuery}”</div>
              )}
            </div>
          )}
        </div>

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
