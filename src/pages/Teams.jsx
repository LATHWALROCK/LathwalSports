import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import Logo from "../components/Logo";
import Picklist from "../components/Picklist";
import {
  Search,
  X,
  Trophy,
  Shield,
  Globe,
  Plus,
  Edit2,
  ExternalLink,
  Layers,
  MapPin,
} from "lucide-react";

export default function Teams() {
  const {
    teams,
    sports,
    tournaments,
    leagues,
    isAdmin,
    openCreateTeamModal,
    openEditTeamModal,
  } = useSports();

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedHonours, setSelectedHonours] = useState("all");
  const [sortBy, setSortBy] = useState("titles"); // "titles" | "name-asc" | "name-desc" | "comps" | "eras" | "newest"
  const [viewMode, setViewMode] = useState("active"); // "active" (distinct teams) | "all" (every individual era)
  const [pageLimit, setPageLimit] = useState(48);

  // 1. Build a lookup of title wins and runner-ups for each team era
  const { titleWinsMap, ruFinishesMap, participationsMap } = useMemo(() => {
    const titles = new Map();
    const rus = new Map();
    const parts = new Map();

    leagues.forEach((l) => {
      l.teams?.forEach((item) => {
        const tId = String(item.team?._id || item.team || "");
        if (!tId) return;

        // Total participations
        parts.set(tId, (parts.get(tId) || 0) + 1);

        // Position 1 (or 2 if shared) = Title
        if (item.position === 1 || (l.shared && item.position === 2)) {
          titles.set(tId, (titles.get(tId) || 0) + 1);
        } else if (item.position === 2) {
          rus.set(tId, (rus.get(tId) || 0) + 1);
        }
      });
    });

    return { titleWinsMap: titles, ruFinishesMap: rus, participationsMap: parts };
  }, [leagues]);

  // 2. Pre-process distinct teams (Active Teams mode) vs All Era records
  const distinctTeams = useMemo(() => {
    // Group all team records by: sportId + "___" + teamIdentifier.toLowerCase()
    const groups = new Map();

    teams.forEach((t) => {
      const sportId = String(t.sport?._id || t.sport || "");
      const ident = String(t.teamIdentifier || t._id || "").toLowerCase();
      const key = `${sportId}___${ident}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          sportId,
          ident,
          eras: [],
          primary: t,
        });
      }

      const g = groups.get(key);
      g.eras.push(t);

      // Prefer the version marked isCurrent === true as the primary display representative
      if (t.isCurrent || (!g.primary.isCurrent && !t.isCurrent)) {
        g.primary = t;
      }
    });

    // Aggregate statistics across eras for each distinct team
    return Array.from(groups.values()).map((g) => {
      const primary = g.primary;
      const allEraIds = g.eras.map((era) => String(era._id));

      let totalTitles = 0;
      let totalRus = 0;
      let totalParts = 0;

      allEraIds.forEach((id) => {
        totalTitles += titleWinsMap.get(id) || 0;
        totalRus += ruFinishesMap.get(id) || 0;
        totalParts += participationsMap.get(id) || 0;
      });

      // Aggregate all tournaments the team has ever belonged to
      const allTournamentsMap = new Map();
      g.eras.forEach((era) => {
        const tourArr = Array.isArray(era.tournaments) && era.tournaments.length > 0
          ? era.tournaments
          : era.tournament
          ? [era.tournament]
          : [];

        tourArr.forEach((tItem) => {
          const tId = String(tItem?._id || tItem || "");
          if (tId && !allTournamentsMap.has(tId)) {
            const tourDoc = tournaments.find((tour) => tour._id === tId) || tItem;
            allTournamentsMap.set(tId, tourDoc);
          }
        });
      });

      return {
        ...primary,
        uniqueKey: g.key,
        erasCount: g.eras.length,
        allEras: g.eras,
        totalTitles,
        totalRus,
        totalParts,
        associatedTournaments: Array.from(allTournamentsMap.values()),
      };
    });
  }, [teams, titleWinsMap, ruFinishesMap, participationsMap, tournaments]);

  // 3. Pre-process flat list for "All Eras" mode
  const allEraRecords = useMemo(() => {
    return teams.map((t) => {
      const id = String(t._id);
      const totalTitles = titleWinsMap.get(id) || 0;
      const totalRus = ruFinishesMap.get(id) || 0;
      const totalParts = participationsMap.get(id) || 0;

      const tourArr = Array.isArray(t.tournaments) && t.tournaments.length > 0
        ? t.tournaments
        : t.tournament
        ? [t.tournament]
        : [];

      const associatedTournaments = tourArr.map((tItem) => {
        const tId = String(tItem?._id || tItem || "");
        return tournaments.find((tour) => tour._id === tId) || tItem;
      });

      return {
        ...t,
        uniqueKey: id,
        erasCount: 1,
        allEras: [t],
        totalTitles,
        totalRus,
        totalParts,
        associatedTournaments,
      };
    });
  }, [teams, titleWinsMap, ruFinishesMap, participationsMap, tournaments]);

  // 4. Extract franchise groups list for dropdown
  const franchiseGroupOptions = useMemo(() => {
    const groupMap = new Map();
    teams.forEach((t) => {
      if (t.groupIdentifier || t.groupName) {
        const gid = String(t.groupIdentifier || t.groupName).toLowerCase();
        const gname = t.groupName || t.groupIdentifier;
        if (!groupMap.has(gid)) {
          groupMap.set(gid, { id: gid, name: gname });
        }
      }
    });

    const list = Array.from(groupMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    return [
      { value: "all", label: "All Groups & Independent" },
      { value: "any-group", label: "★ Part of Any Franchise Group" },
      ...list.map((g) => ({
        value: g.id,
        label: `🌐 ${g.name}`,
      })),
    ];
  }, [teams]);

  // 5. Dynamic tournaments list (filtered by selected sport & type)
  const tournamentOptions = useMemo(() => {
    const filtered = tournaments.filter((t) => {
      const sportId = String(t.sport?._id || t.sport || "");
      if (selectedSport !== "all" && sportId !== selectedSport) return false;
      if (selectedType === "National" && t.type === "League") return false;
      if (selectedType === "League" && t.type !== "League") return false;
      return true;
    });

    return [
      { value: "all", label: "All Competitions" },
      ...filtered.map((t) => ({
        value: t._id,
        label: t.name,
        sub: `${t.sport?.name || "Sport"} · ${t.type === "League" ? "Club" : "National"}`,
        logo: t.imageUrl,
      })),
    ];
  }, [tournaments, selectedSport, selectedType]);

  // 6. Sport options with logos/labels
  const sportOptions = useMemo(() => {
    return [
      { value: "all", label: "All Sports" },
      ...sports.map((s) => ({
        value: s._id,
        label: s.name,
        logo: s.imageUrl,
      })),
    ];
  }, [sports]);

  // 7. Team type options
  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "National", label: "🌍 National Teams" },
    { value: "League", label: "🛡️ Club / Franchise Teams" },
  ];

  // 8. Honours / Trophies options
  const honoursOptions = [
    { value: "all", label: "All Teams" },
    { value: "champions", label: "🏆 Champions Only (1+ Titles)" },
    { value: "multi-champions", label: "👑 Multi-Champions (3+ Titles)" },
    { value: "no-titles", label: "⚪ No Titles Recorded Yet" },
  ];

  // 9. Sort By options
  const sortOptions = [
    { value: "titles", label: "🏆 Most Titles Won" },
    { value: "name-asc", label: "🔤 Name (A → Z)" },
    { value: "name-desc", label: "🔤 Name (Z → A)" },
    { value: "comps", label: "🏅 Most Competitions" },
    { value: "eras", label: "⚡ Most Historical Eras" },
    { value: "newest", label: "⏱️ Recently Added" },
  ];

  // Base list depending on view mode
  const baseList = viewMode === "active" ? distinctTeams : allEraRecords;

  // 10. Filter & Search
  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return baseList.filter((team) => {
      const sportId = String(team.sport?._id || team.sport || "");
      const teamGId = String(team.groupIdentifier || "").toLowerCase();

      // Search query (matches name, identifier, city, country)
      if (q) {
        const matchesName = team.name?.toLowerCase().includes(q);
        const matchesIdent = team.teamIdentifier?.toLowerCase().includes(q);
        const matchesCity = team.city?.toLowerCase().includes(q);
        const matchesCountry = team.country?.toLowerCase().includes(q);
        const matchesGroup = team.groupName?.toLowerCase().includes(q);
        if (!matchesName && !matchesIdent && !matchesCity && !matchesCountry && !matchesGroup) {
          return false;
        }
      }

      // Sport filter
      if (selectedSport !== "all" && sportId !== selectedSport) {
        return false;
      }

      // Type filter
      if (selectedType !== "all" && team.type !== selectedType) {
        return false;
      }

      // Competition filter
      if (selectedTournament !== "all") {
        const matchesTournament = team.associatedTournaments?.some((tour) => {
          const tId = String(tour?._id || tour || "");
          return tId === selectedTournament;
        });
        if (!matchesTournament) return false;
      }

      // Franchise Group filter
      if (selectedGroup !== "all") {
        if (selectedGroup === "any-group") {
          if (!team.groupIdentifier && !team.groupName) return false;
        } else {
          if (teamGId !== selectedGroup) return false;
        }
      }

      // Honours filter
      if (selectedHonours === "champions" && (team.totalTitles || 0) < 1) {
        return false;
      }
      if (selectedHonours === "multi-champions" && (team.totalTitles || 0) < 3) {
        return false;
      }
      if (selectedHonours === "no-titles" && (team.totalTitles || 0) > 0) {
        return false;
      }

      return true;
    });
  }, [baseList, searchQuery, selectedSport, selectedType, selectedTournament, selectedGroup, selectedHonours]);

  // 11. Sort filtered teams
  const sortedTeams = useMemo(() => {
    return [...filteredTeams].sort((a, b) => {
      if (sortBy === "titles") {
        const diff = (b.totalTitles || 0) - (a.totalTitles || 0);
        if (diff !== 0) return diff;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      if (sortBy === "comps") {
        const diff = (b.associatedTournaments?.length || 0) - (a.associatedTournaments?.length || 0);
        if (diff !== 0) return diff;
        return (b.totalTitles || 0) - (a.totalTitles || 0);
      }
      if (sortBy === "eras") {
        const diff = (b.erasCount || 1) - (a.erasCount || 1);
        if (diff !== 0) return diff;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });
  }, [filteredTeams, sortBy]);

  // Visible page slice
  const displayedTeams = sortedTeams.slice(0, pageLimit);

  // Check if any filter is active
  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedSport !== "all" ||
    selectedType !== "all" ||
    selectedTournament !== "all" ||
    selectedGroup !== "all" ||
    selectedHonours !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSport("all");
    setSelectedType("all");
    setSelectedTournament("all");
    setSelectedGroup("all");
    setSelectedHonours("all");
    setSortBy("titles");
  };

  // Aggregated overview stats
  const totalHonoursWon = useMemo(() => {
    return sortedTeams.reduce((acc, t) => acc + (t.totalTitles || 0), 0);
  }, [sortedTeams]);

  const nationalCount = useMemo(() => {
    return sortedTeams.filter((t) => t.type === "National").length;
  }, [sortedTeams]);

  const clubCount = useMemo(() => {
    return sortedTeams.filter((t) => t.type === "League").length;
  }, [sortedTeams]);

  const groupClubsCount = useMemo(() => {
    return sortedTeams.filter((t) => t.groupIdentifier || t.groupName).length;
  }, [sortedTeams]);

  return (
    <div className="teams-page">
      {/* Page Header */}
      <div className="teams-header">
        <div>
          <div className="eyebrow">Directory · Global Clubs &amp; National Teams</div>
          <h1 className="teams-title">
            <span className="bar" />
            All Teams
          </h1>
          <p className="teams-subtitle">
            Browse and filter clubs, national teams, franchise networks, and historical crests across every sport.
          </p>
        </div>

        <div className="teams-header-actions">
          {/* View Mode Toggle: Distinct Teams vs All Historical Eras */}
          <div className="teams-view-toggle">
            <button
              type="button"
              className={viewMode === "active" ? "active" : ""}
              onClick={() => setViewMode("active")}
              title="Group eras by team to view distinct clubs and national teams"
            >
              <Shield size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: "5px" }} />
              Active Teams ({distinctTeams.length})
            </button>
            <button
              type="button"
              className={viewMode === "all" ? "active" : ""}
              onClick={() => setViewMode("all")}
              title="View all individual historical era versions and past crests"
            >
              <Layers size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: "5px" }} />
              All Eras ({allEraRecords.length})
            </button>
          </div>

          {/* Admin Add Team Button */}
          {isAdmin && (
            <button
              type="button"
              className="btn primary"
              onClick={() => openCreateTeamModal({ role: "general" })}
              title="Add a new team to the directory"
            >
              <Plus size={16} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
              Add Team
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Counters Bar */}
      <div className="teams-metrics-bar">
        <div className="metric-item">
          <b>{sortedTeams.length}</b>
          <span>{viewMode === "active" ? "Clubs & Nations" : "Total Eras"}</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <b>{nationalCount}</b>
          <span>National Teams</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <b>{clubCount}</b>
          <span>Club Teams</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item gold">
          <b>🏆 {totalHonoursWon}</b>
          <span>Titles Aggregated</span>
        </div>
        {groupClubsCount > 0 && (
          <>
            <div className="metric-divider" />
            <div className="metric-item">
              <b>{groupClubsCount}</b>
              <span>In Franchise Groups</span>
            </div>
          </>
        )}
      </div>

      {/* Main Luxury Filter Bar */}
      <div className="teams-filters-panel">
        <div className="teams-filters-grid">
          {/* Search Field */}
          <div className="teams-field search-field">
            <label htmlFor="team-search">Search Teams</label>
            <div className="teams-search-wrap">
              <Search size={16} className="teams-search-icon" />
              <input
                id="team-search"
                type="search"
                placeholder="Search by name, city, country, or identifier…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="teams-search-clear"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Sport Filter */}
          <div className="teams-field">
            <label>Sport</label>
            <Picklist
              value={selectedSport}
              onChange={(val) => {
                setSelectedSport(val);
                // Reset tournament if not matching sport
                setSelectedTournament("all");
              }}
              options={sportOptions}
              placeholder="All Sports"
            />
          </div>

          {/* Type Filter */}
          <div className="teams-field">
            <label>Team Type</label>
            <Picklist
              value={selectedType}
              onChange={(val) => {
                setSelectedType(val);
                setSelectedTournament("all");
              }}
              options={typeOptions}
              placeholder="All Types"
            />
          </div>

          {/* Competition Filter */}
          <div className="teams-field">
            <label>Competition</label>
            <Picklist
              value={selectedTournament}
              onChange={(val) => setSelectedTournament(val)}
              options={tournamentOptions}
              placeholder="All Competitions"
              searchable
            />
          </div>

          {/* Franchise Group Filter */}
          <div className="teams-field">
            <label>Franchise Group</label>
            <Picklist
              value={selectedGroup}
              onChange={(val) => setSelectedGroup(val)}
              options={franchiseGroupOptions}
              placeholder="All Groups"
              searchable
            />
          </div>

          {/* Honours Filter */}
          <div className="teams-field">
            <label>Trophies &amp; Honours</label>
            <Picklist
              value={selectedHonours}
              onChange={(val) => setSelectedHonours(val)}
              options={honoursOptions}
              placeholder="All Teams"
            />
          </div>

          {/* Sort By */}
          <div className="teams-field">
            <label>Sort By</label>
            <Picklist
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={sortOptions}
              placeholder="Most Titles Won"
            />
          </div>
        </div>

        {/* Active Filter Chips & Reset Bar */}
        {isFiltered && (
          <div className="teams-active-bar">
            <div className="teams-active-chips">
              <span className="teams-chips-label">Active Filters:</span>

              {searchQuery && (
                <span className="teams-filter-pill">
                  Search: "{searchQuery}"
                  <button type="button" onClick={() => setSearchQuery("")}>
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedSport !== "all" && (
                <span className="teams-filter-pill">
                  Sport: {sports.find((s) => s._id === selectedSport)?.name || selectedSport}
                  <button type="button" onClick={() => setSelectedSport("all")}>
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedType !== "all" && (
                <span className="teams-filter-pill">
                  Type: {selectedType === "National" ? "National Teams" : "Club Teams"}
                  <button type="button" onClick={() => setSelectedType("all")}>
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedTournament !== "all" && (
                <span className="teams-filter-pill">
                  Competition: {tournaments.find((t) => t._id === selectedTournament)?.name || selectedTournament}
                  <button type="button" onClick={() => setSelectedTournament("all")}>
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedGroup !== "all" && (
                <span className="teams-filter-pill">
                  Group: {selectedGroup === "any-group" ? "Any Group" : selectedGroup}
                  <button type="button" onClick={() => setSelectedGroup("all")}>
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedHonours !== "all" && (
                <span className="teams-filter-pill">
                  Honours: {honoursOptions.find((h) => h.value === selectedHonours)?.label}
                  <button type="button" onClick={() => setSelectedHonours("all")}>
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              className="teams-reset-btn"
              onClick={handleResetFilters}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Teams Results Counter */}
      <div className="teams-results-header">
        <div>
          <span className="results-count">
            Showing <strong>{displayedTeams.length}</strong> of <strong>{sortedTeams.length}</strong> teams
          </span>
          {isFiltered && <span className="results-filter-badge">Filtered</span>}
        </div>
      </div>

      {/* Teams Cards Grid */}
      {displayedTeams.length > 0 ? (
        <div className="teams-grid">
          {displayedTeams.map((team) => {
            const hasMultipleEras = (team.erasCount || 1) > 1;
            const hasGroup = Boolean(team.groupIdentifier || team.groupName);
            const titles = team.totalTitles || 0;
            const rus = team.totalRus || 0;
            const comps = team.associatedTournaments || [];

            return (
              <div key={team.uniqueKey} className="team-directory-card">
                {/* Top Card Header */}
                <div className="team-card-top">
                  <div className="team-card-crest-box">
                    <Logo url={team.imageUrl} label={team.name} size="xl" />
                  </div>

                  <div className="team-card-badges">
                    <span className={`team-type-badge ${team.type === "National" ? "national" : "club"}`}>
                      {team.type === "National" ? "National" : "Club"}
                    </span>

                    {hasMultipleEras && viewMode === "active" && (
                      <span className="team-era-badge" title={`${team.erasCount} historical eras / crests recorded`}>
                        ⚡ {team.erasCount} Eras
                      </span>
                    )}

                    {viewMode === "all" && (
                      <span className={`team-version-badge ${team.isCurrent ? "current" : "historical"}`}>
                        {team.isCurrent ? "✓ Active Crest" : "Historical"}
                      </span>
                    )}
                  </div>

                  {/* Admin Edit Shortcut */}
                  {isAdmin && (
                    <button
                      type="button"
                      className="team-card-admin-edit"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditTeamModal(team);
                      }}
                      title={`Edit ${team.name}`}
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                {/* Team Info */}
                <div className="team-card-body">
                  <Link to={`/team/${team._id}`} className="team-card-title-link">
                    <h3 className="team-card-name" title={team.name}>
                      {team.name}
                    </h3>
                  </Link>

                  <div className="team-card-meta">
                    <span className="team-sport-pill">
                      {team.sport?.name || "Sport"}
                    </span>

                    {(team.city || team.country) && (
                      <span className="team-location" title={`${team.city || ""}, ${team.country || ""}`}>
                        <MapPin size={11} style={{ display: "inline", verticalAlign: "-1px", marginRight: "3px" }} />
                        {team.city ? `${team.city}${team.country ? `, ${team.country}` : ""}` : team.country}
                      </span>
                    )}
                  </div>

                  {/* Franchise Group Tag */}
                  {hasGroup && (
                    <div className="team-group-tag" title={`Belongs to ${team.groupName || team.groupIdentifier}`}>
                      <Globe size={12} />
                      <span>{team.groupName || team.groupIdentifier}</span>
                    </div>
                  )}

                  {/* Associated Competitions */}
                  {comps.length > 0 && (
                    <div className="team-comps-list">
                      {comps.slice(0, 3).map((tour) => {
                        const tourName = tour.name || "Competition";
                        return (
                          <span key={tour._id || tourName} className="team-comp-chip" title={tourName}>
                            {tour.imageUrl && <Logo url={tour.imageUrl} label={tourName} size="xs" />}
                            <span>{tourName}</span>
                          </span>
                        );
                      })}
                      {comps.length > 3 && (
                        <span className="team-comp-more">+{comps.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Honours / Titles Showcase */}
                  <div className="team-card-honours">
                    {titles > 0 ? (
                      <span className="honour-win">
                        <Trophy size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                        <strong>{titles}</strong> {titles === 1 ? "Title" : "Titles"}
                      </span>
                    ) : (
                      <span className="honour-none">No titles recorded yet</span>
                    )}

                    {rus > 0 && (
                      <span className="honour-ru" title={`${rus} Runner-up finishes`}>
                        🥈 {rus} RU
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Link to Profile */}
                <Link to={`/team/${team._id}`} className="team-card-footer">
                  <span>View Team Profile</span>
                  <ExternalLink size={13} className="footer-arrow" />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="teams-empty-state">
          <div className="empty-icon">🛡️</div>
          <h3>No Teams Found</h3>
          <p>
            {searchQuery
              ? `No teams matched your search for “${searchQuery}”.`
              : "No teams matched the selected filters."}
          </p>
          {isFiltered && (
            <button
              type="button"
              className="btn ghost"
              onClick={handleResetFilters}
              style={{ marginTop: "14px" }}
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* Pagination Load More */}
      {displayedTeams.length < sortedTeams.length && (
        <div className="teams-load-more">
          <button
            type="button"
            className="btn ghost"
            onClick={() => setPageLimit((prev) => prev + 48)}
          >
            Load More Teams ({sortedTeams.length - displayedTeams.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
