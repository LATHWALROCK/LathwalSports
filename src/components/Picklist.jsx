import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check, Search, X, Minus } from "lucide-react";
import Logo from "./Logo";

/**
 * Luxury dark-themed Picklist (Custom Select) component
 * Replaces native OS <select> popups with modern glassmorphism options UI.
 */
export default function Picklist({
  id,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
  searchable = false,
  className = "",
  variant = "default", // "default" | "modal" | "gold" | "silver"
  ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const autoId = useId();
  const selectId = id || autoId;

  // Normalize options to { value, label, sub, logo, icon, disabled, isNone }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      const val = opt.value !== undefined ? opt.value : opt._id || "";
      return {
        value: val,
        label: opt.label || opt.name || String(opt.value || ""),
        sub: opt.sub || "",
        logo: opt.logo || opt.imageUrl || null,
        icon: opt.icon || null,
        disabled: !!opt.disabled,
        isNone: val === "",
      };
    }
    return {
      value: opt,
      label: String(opt),
      sub: "",
      logo: null,
      icon: null,
      disabled: false,
      isNone: opt === "",
    };
  });

  // Current selected option
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Determine if searchable: if explicit prop or more than 6 options
  const isSearchable = searchable || normalizedOptions.length > 6;

  // Filter options by search query
  const filteredOptions = searchQuery.trim()
    ? normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.sub && opt.sub.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : normalizedOptions;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setHighlightedIndex(-1);
      if (isSearchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, isSearchable]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightedIndex];
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (optVal, optDisabled) => {
    if (optDisabled) return;
    onChange(optVal);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const opt = filteredOptions[highlightedIndex];
          handleSelect(opt.value, opt.disabled);
        }
        break;
      case "Tab":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Helper to extract clean 2-char initials
  const getInitials = (text) => {
    const clean = (text || "?").replace(/^[^a-zA-Z0-9]+/, "").trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <div
      ref={containerRef}
      className={`picklist-wrap ${variant} ${className} ${disabled ? "disabled" : ""}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        className={`picklist-trigger ${isOpen ? "open" : ""} ${variant}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <div className="picklist-trigger-content">
          {selectedOption ? (
            <>
              {selectedOption.isNone && !selectedOption.logo ? (
                <span className="picklist-none-crest trigger-mini">
                  <Minus size={11} strokeWidth={2.5} />
                </span>
              ) : selectedOption.logo ? (
                <Logo url={selectedOption.logo} label={selectedOption.label} size="xs" />
              ) : (
                <span className="picklist-initials-badge trigger-mini">
                  {getInitials(selectedOption.label)}
                </span>
              )}
              <span className="picklist-label">{selectedOption.label}</span>
              {selectedOption.sub && (
                <span className="picklist-sub">{selectedOption.sub}</span>
              )}
            </>
          ) : (
            <span className="picklist-placeholder">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className={`picklist-chevron ${isOpen ? "open" : ""}`} />
      </button>

      {/* Floating Options Menu Popover */}
      {isOpen && (
        <div className="picklist-popover" role="listbox">
          {/* Optional Search Filter */}
          {isSearchable && normalizedOptions.length > 5 && (
            <div className="picklist-search-box">
              <Search size={14} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                placeholder="Search teams / options..."
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              ) : (
                <span className="picklist-count-pill">{filteredOptions.length}</span>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="picklist-options-list" ref={listRef}>
            {filteredOptions.length === 0 ? (
              <div className="picklist-empty">No matching options</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;
                const isNone = opt.isNone;

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`picklist-option ${isNone ? "picklist-option-none" : ""} ${
                      isSelected ? "selected" : ""
                    } ${isHighlighted ? "highlighted" : ""} ${
                      opt.disabled ? "disabled" : ""
                    }`}
                    onClick={() => handleSelect(opt.value, opt.disabled)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <div className="picklist-option-left">
                      {isNone && !opt.logo ? (
                        <div className="picklist-none-crest">
                          <Minus size={13} strokeWidth={2.5} />
                        </div>
                      ) : opt.logo ? (
                        <Logo url={opt.logo} label={opt.label} size="xs" />
                      ) : (
                        <div className="picklist-initials-badge">
                          {getInitials(opt.label)}
                        </div>
                      )}
                      <span className="opt-label">{opt.label}</span>
                    </div>

                    <div className="picklist-option-right">
                      {opt.sub && <span className="opt-sub">{opt.sub}</span>}
                      {isSelected && (
                        <div className="picklist-check-badge">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
