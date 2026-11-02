import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import {
  Plus,
  Shield,
  User,
  Menu,
  X,
  LayoutDashboard,
  Trophy,
  Compass,
  Users,
} from "lucide-react";

export default function Topbar() {
  const {
    isAdmin,
    toggleAdmin,
    openAddEditionModal,
  } = useSports();

  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on location change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, active: location.pathname === "/" },
    {
      to: "/tournaments",
      label: "Tournaments",
      icon: Trophy,
      active: location.pathname === "/tournaments" || location.pathname === "/competitions",
    },
    { to: "/teams", label: "Teams", icon: Users, active: location.pathname === "/teams" },
    { to: "/explore", label: "Explore", icon: Compass, active: location.pathname === "/explore" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#07090f]/90 backdrop-blur-md border-b border-[#232c40]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display font-extrabold text-xl sm:text-2xl tracking-wider uppercase text-white whitespace-nowrap"
          >
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl grid place-items-center bg-gradient-to-br from-[#00e39b] via-[#00b3ff] to-[#ffb21e] text-[#07090f] text-base sm:text-lg shadow-[0_0_15px_rgba(0,227,155,0.35)] flex-shrink-0">
              🏆
            </span>
            <span>
              Champions<span className="text-[#00e39b]">Tracker</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-1.5 lg:px-4 lg:py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                  link.active
                    ? "bg-[#eef2f8] text-[#07090f] shadow-sm font-bold"
                    : "text-[#8b96ad] hover:text-[#eef2f8] hover:bg-[#121826]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Right: Admin Toggle & Add Edition Button */}
          <div className="hidden md:flex items-center gap-3">
            <div
              className="inline-flex items-center bg-[#121826] border border-[#232c40] rounded-full p-0.5"
              title="Switch between normal public view and admin view"
            >
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  !isAdmin
                    ? "bg-[#00e39b] text-[#07090f] shadow-[0_2px_8px_rgba(0,227,155,0.35)]"
                    : "text-[#8b96ad] hover:text-white"
                }`}
                onClick={() => isAdmin && toggleAdmin()}
              >
                <User size={13} />
                <span>Normal</span>
              </button>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isAdmin
                    ? "bg-[#f5c542] text-[#07090f] shadow-[0_2px_10px_rgba(245,197,66,0.4)]"
                    : "text-[#8b96ad] hover:text-white"
                }`}
                onClick={() => !isAdmin && toggleAdmin()}
              >
                <Shield size={13} />
                <span>Admin</span>
              </button>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#f5c542] to-[#ff9f1c] text-[#07090f] font-bold text-xs uppercase tracking-wider hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(245,197,66,0.35)] hover:shadow-[0_6px_20px_rgba(245,197,66,0.5)] cursor-pointer whitespace-nowrap"
                onClick={() => openAddEditionModal()}
                title="Add a new edition to any competition"
              >
                <Plus size={15} /> Add Edition
              </button>
            )}
          </div>

          {/* Mobile Right Controls: Admin Pill + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleAdmin}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                isAdmin
                  ? "bg-[#f5c542]/15 text-[#f5c542] border-[#f5c542]/40"
                  : "bg-[#121826] text-[#8b96ad] border-[#232c40]"
              }`}
              title="Toggle Admin Mode"
            >
              {isAdmin ? <Shield size={12} /> : <User size={12} />}
              <span>{isAdmin ? "Admin" : "Normal"}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#121826] border border-[#232c40] text-[#8b96ad] hover:text-white hover:border-[#36425e] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#232c40] bg-[#0d111b]/98 backdrop-blur-xl px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    link.active
                      ? "bg-[#eef2f8] text-[#07090f] shadow-md font-bold"
                      : "text-[#8b96ad] hover:text-white hover:bg-[#121826]"
                  }`}
                >
                  <Icon size={18} className={link.active ? "text-[#07090f]" : "text-[#8b96ad]"} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Admin Controls */}
          <div className="pt-3 border-t border-[#232c40] flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs uppercase font-bold tracking-wider text-[#8b96ad]">
                Mode:
              </span>
              <div className="inline-flex items-center bg-[#121826] border border-[#232c40] rounded-full p-0.5">
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    !isAdmin
                      ? "bg-[#00e39b] text-[#07090f]"
                      : "text-[#8b96ad]"
                  }`}
                  onClick={() => isAdmin && toggleAdmin()}
                >
                  <User size={12} /> Normal
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    isAdmin
                      ? "bg-[#f5c542] text-[#07090f]"
                      : "text-[#8b96ad]"
                  }`}
                  onClick={() => !isAdmin && toggleAdmin()}
                >
                  <Shield size={12} /> Admin
                </button>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c542] to-[#ff9f1c] text-[#07090f] font-bold text-xs uppercase tracking-wider shadow-lg active:scale-[0.99] transition-all cursor-pointer"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAddEditionModal();
                }}
              >
                <Plus size={16} /> Add Edition
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

