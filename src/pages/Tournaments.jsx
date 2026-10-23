import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import Logo from "../components/Logo";
import Picklist from "../components/Picklist";
import {
  Search,
  X,
  Trophy,
  Plus,
  ExternalLink,
  Crown,
} from "lucide-react";

export default function Tournaments() {
  const {
    tournaments,
    sports,
    teams,
    leagues,
    isAdmin,
    openCreateTournamentModal,
    openAddEditionModal,
  } = useSports();

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("editions"); // "editions" | "recent" | "name-asc" | "name-desc" | "sport"
  const [pageLimit, setPageLimit] = useState(48);

  // Pre-calculate editions, reigning champions, and most successful teams for each tournament
  const tournamentStatsMap = useMemo(() => {
    // Helper to find the canonical representative team across all eras in the same sport
    const getCanonical = (tm, sportFallback = "") => {
      if (!tm) return null;
      const tmId = String(tm._id || tm);
      const teamDoc = teams.find((x) => String(x._id) === tmId) || (typeof tm === "object" ? tm : null);
      if (!teamDoc) return null;

      const sportId = String(teamDoc.sport?._id || teamDoc.sport || sportFallback || "");
      const ident = String(teamDoc.teamIdentifier || "").trim().toLowerCase();
      const nameNorm = String(teamDoc.name || "").trim().toLowerCase();

      // Find all eras for this team within the same sport
      const eras = teams.filter((candidate) => {
        const cSportId = String(candidate.sport?._id || candidate.sport || "");
        if (sportId && cSportId && sportId !== cSportId) return false;
        const cIdent = String(candidate.teamIdentifier || "").trim().toLowerCase();
        const cName = String(candidate.name || "").trim().toLowerCase();

        if (ident && cIdent && ident === cIdent) return true;
        if (nameNorm && cName && nameNorm === cName) return true;
        return String(candidate._id) === String(teamDoc._id);
      });

      // Prefer the era marked as isCurrent === true, otherwise the first matching era
      const primary = eras.find((era) => era.isCurrent) || eras[0] || teamDoc;
      const canonicalKey = `${sportId}___${String(primary.teamIdentifier || primary.name || primary._id).trim().toLowerCase()}`;

      return {
        primary,
        canonicalKey,
        allEras: eras,
      };
    };

    const map = new Map();

    tournaments.forEach((tour) => {
      const tourId = String(tour._id);
      const tourSportId = String(tour.sport?._id || tour.sport || "");

      // All editions for this tournament
      const tourEditions = leagues
        .filter((l) => String(l.tournament?._id || l.tournament) === tourId)
        .sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));

      // Latest / Reigning Champion
      let reigningChampion = null;
      let latestEdition = null;
      if (tourEditions.length > 0) {
        latestEdition = tourEditions[0];
        const winItem = latestEdition.teams?.find((t) => t.position === 1);
        if (winItem) {
          const canonical = getCanonical(winItem.team, tourSportId);
          const winTeamDoc =
            canonical?.primary ||
            teams.find((tm) => tm._id === (winItem.team?._id || winItem.team)) ||
            winItem.team;
          reigningChampion = {
            team: winTeamDoc,
            year: latestEdition.season || latestEdition.year,
          };
        }
      }

      // Most successful team (most title wins across all historical eras of a team)
      const winnerTally = new Map();
      tourEditions.forEach((l) => {
        l.teams?.forEach((t) => {
          if (t.position === 1 || (l.shared && t.position === 2)) {
            const canonical = getCanonical(t.team, tourSportId);
            if (canonical && canonical.canonicalKey) {
              const currentWins = winnerTally.get(canonical.canonicalKey) || {
                count: 0,
                team: canonical.primary,
              };
              winnerTally.set(canonical.canonicalKey, {
                count: currentWins.count + 1,
                team: currentWins.team?.isCurrent ? currentWins.team : canonical.primary,
              });
            }
          }
        });
      });

      let mostSuccessful = null;
      if (winnerTally.size > 0) {
        const sortedWinners = Array.from(winnerTally.values()).sort((a, b) => {
          const diff = b.count - a.count;
          if (diff !== 0) return diff;
          return (a.team.name || "").localeCompare(b.team.name || "");
        });
        mostSuccessful = sortedWinners[0];
      }

      map.set(tourId, {
        editionsCount: tourEditions.length,
        latestYear: latestEdition ? Number(latestEdition.year) || 0 : 0,
        reigningChampion,
        mostSuccessful,
      });
    });

    return map;
  }, [tournaments, leagues, teams]);

  // Sport options for Picklist
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

  // Format / Type options
  const typeOptions = [
    { value: "all", label: "All Formats" },
    { value: "International", label: "🌍 International Tournaments" },
    { value: "League", label: "🛡️ Club & Franchise Leagues" },
  ];

  // Status / Activity options
  const statusOptions = [
    { value: "all", label: "All Tournaments" },
    { value: "active", label: "🏅 With Recorded Editions" },
    { value: "empty", label: "⚪ No Editions Recorded Yet" },
  ];

  // Sort By options
  const sortOptions = [
    { value: "editions", label: "🏅 Most Recorded Editions" },
    { value: "recent", label: "⏱️ Most Recent Edition" },
    { value: "name-asc", label: "🔤 Name (A → Z)" },
    { value: "name-desc", label: "🔤 Name (Z → A)" },
    { value: "sport", label: "⚽ By Sport" },
  ];

  // Filtered tournaments
  const filteredTournaments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return tournaments.filter((tour) => {
      const sportId = String(tour.sport?._id || tour.sport || "");
      const stats = tournamentStatsMap.get(String(tour._id)) || { editionsCount: 0 };

      // Search query (matches tournament name or sport name)
      if (q) {
        const matchName = tour.name?.toLowerCase().includes(q);
        const matchSport = tour.sport?.name?.toLowerCase().includes(q);
        if (!matchName && !matchSport) return false;
      }

      // Sport filter
      if (selectedSport !== "all" && sportId !== selectedSport) {
        return false;
      }

      // Format / Type filter
      if (selectedType !== "all") {
        const isLeague = tour.type === "League";
        if (selectedType === "International" && isLeague) return false;
        if (selectedType === "League" && !isLeague) return false;
      }

      // Status filter
      if (selectedStatus === "active" && stats.editionsCount < 1) {
        return false;
      }
      if (selectedStatus === "empty" && stats.editionsCount > 0) {
        return false;
      }

      return true;
    });
  }, [tournaments, searchQuery, selectedSport, selectedType, selectedStatus, tournamentStatsMap]);

  // Sorted tournaments
  const sortedTournaments = useMemo(() => {
    return [...filteredTournaments].sort((a, b) => {
      const statsA = tournamentStatsMap.get(String(a._id)) || { editionsCount: 0, latestYear: 0 };
      const statsB = tournamentStatsMap.get(String(b._id)) || { editionsCount: 0, latestYear: 0 };

      if (sortBy === "editions") {
        const diff = statsB.editionsCount - statsA.editionsCount;
        if (diff !== 0) return diff;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "recent") {
        const diff = statsB.latestYear - statsA.latestYear;
        if (diff !== 0) return diff;
        return statsB.editionsCount - statsA.editionsCount;
      }
      if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      if (sortBy === "sport") {
        const sA = a.sport?.name || "";
        const sB = b.sport?.name || "";
        const diff = sA.localeCompare(sB);
        if (diff !== 0) return diff;
        return (a.name || "").localeCompare(b.name || "");
      }
      return 0;
    });
  }, [filteredTournaments, sortBy, tournamentStatsMap]);

  // Paginated slice
  const displayedTournaments = sortedTournaments.slice(0, pageLimit);

  // Check if any filter is active
  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedSport !== "all" ||
    selectedType !== "all" ||
    selectedStatus !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSport("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setSortBy("editions");
  };

  // Overview metric stats
  const totalEditionsRecorded = useMemo(() => {
    return sortedTournaments.reduce((acc, t) => {
      const stats = tournamentStatsMap.get(String(t._id));
      return acc + (stats?.editionsCount || 0);
    }, 0);
  }, [sortedTournaments, tournamentStatsMap]);

  const internationalCount = useMemo(() => {
    return sortedTournaments.filter((t) => t.type !== "League").length;
  }, [sortedTournaments]);

  const leagueCount = useMemo(() => {
    return sortedTournaments.filter((t) => t.type === "League").length;
  }, [sortedTournaments]);

  const sportsRepresented = useMemo(() => {
    return new Set(
      sortedTournaments
        .map((t) => String(t.sport?._id || t.sport || ""))
        .filter(Boolean)
    ).size;
  }, [sortedTournaments]);

  return (
    <div className="tournaments-page">
      {/* Header */}
      <div className="tournaments-header">
        <div>
          <div className="eyebrow">Directory · Global Competitions &amp; Leagues</div>
          <h1 className="tournaments-title">
            <span className="bar" />
            Tournaments &amp; Competitions
          </h1>
          <p className="tournaments-subtitle">
            Explore world championships, continental cups, and domestic franchise leagues across every sport.
          </p>
        </div>

        {/* Admin Create Tournament Action */}
        {isAdmin && (
          <div className="tournaments-header-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => openCreateTournamentModal()}
              title="Add a new tournament or league"
            >
              <Plus size={16} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
              Add Tournament
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => openAddEditionModal()}
              title="Add an edition to a competition"
            >
              <Plus size={16} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
              Add Edition
            </button>
          </div>
        )}
      </div>

      {/* Overview Stat Counters Bar */}
      <div className="tournaments-metrics-bar">
        <div className="metric-item">
          <b>{sortedTournaments.length}</b>
          <span>Competitions</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <b>{internationalCount}</b>
          <span>International</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <b>{leagueCount}</b>
          <span>Club Leagues</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <b>{sportsRepresented}</b>
          <span>Sports Represented</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item gold">
          <b>🏅 {totalEditionsRecorded}</b>
          <span>Editions Recorded</span>
        </div>
      </div>

      {/* Main Filter Bar (Spacious 3-4 columns layout) */}
      <div className="tournaments-filters-panel">
        <div className="tournaments-filters-grid">
          {/* Row 1: Search (span 2) | Sport (span 1) | Format (span 1) */}
          <div className="tournaments-field search-field">
            <label htmlFor="tournament-search">Search Competitions</label>
            <div className="tournaments-search-wrap">
              <Search size={16} className="tournaments-search-icon" />
              <input
                id="tournament-search"
                type="search"
                placeholder="Search by competition or league name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="tournaments-search-clear"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="tournaments-field">
            <label>Sport</label>
            <Picklist
              value={selectedSport}
              onChange={(val) => setSelectedSport(val)}
              options={sportOptions}
              placeholder="All Sports"
            />
          </div>

          <div className="tournaments-field">
            <label>Format / Type</label>
            <Picklist
              value={selectedType}
              onChange={(val) => setSelectedType(val)}
              options={typeOptions}
              placeholder="All Formats"
            />
          </div>

          {/* Row 2: Status (span 2) | Sort By (span 2) */}
          <div className="tournaments-field half-field">
            <label>Editions Recorded</label>
            <Picklist
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              options={statusOptions}
              placeholder="All Competitions"
            />
          </div>

          <div className="tournaments-field half-field">
            <label>Sort By</label>
            <Picklist
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={sortOptions}
              placeholder="Most Recorded Editions"
            />
          </div>
        </div>

        {/* Active Filter Chips & Reset Bar */}
        {isFiltered && (
          <div className="tournaments-active-bar">
            <div className="tournaments-active-chips">
              <span className="tournaments-chips-label">Active Filters:</span>

              {searchQuery && (
                <span className="tournaments-filter-pill">
                  Search: "{searchQuery}"
                  <button type="button" onClick={() => setSearchQuery("")}>
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedSport !== "all" && (
                <span className="tournaments-filter-pill">
                  Sport: {sports.find((s) => s._id === selectedSport)?.name || selectedSport}
                  <button type="button" onClick={() => setSelectedSport("all")}>
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedType !== "all" && (
                <span className="tournaments-filter-pill">
                  Format: {selectedType === "League" ? "Club / Franchise Leagues" : "International Tournaments"}
                  <button type="button" onClick={() => setSelectedType("all")}>
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedStatus !== "all" && (
                <span className="tournaments-filter-pill">
                  Status: {statusOptions.find((s) => s.value === selectedStatus)?.label}
                  <button type="button" onClick={() => setSelectedStatus("all")}>
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              className="tournaments-reset-btn"
              onClick={handleResetFilters}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="tournaments-results-header">
        <div>
          <span className="results-count">
            Showing <strong>{displayedTournaments.length}</strong> of <strong>{sortedTournaments.length}</strong> competitions
          </span>
          {isFiltered && <span className="results-filter-badge">Filtered</span>}
        </div>
      </div>

      {/* Tournaments Grid */}
      {displayedTournaments.length > 0 ? (
        <div className="tournaments-grid">
          {displayedTournaments.map((tour) => {
            const isLeague = tour.type === "League";
            const stats = tournamentStatsMap.get(String(tour._id)) || {
              editionsCount: 0,
              reigningChampion: null,
              mostSuccessful: null,
            };
            const reigning = stats.reigningChampion;
            const mostSuccessful = stats.mostSuccessful;

            return (
              <div key={tour._id} className="tournament-directory-card">
                {/* Card Top */}
                <div className="tournament-card-top">
                  <div className="tournament-card-crest-box">
                    <Logo url={tour.imageUrl} label={tour.name} size="xl" />
                  </div>

                  <div className="tournament-card-badges">
                    <span className={`tournament-type-badge ${isLeague ? "league" : "international"}`}>
                      {isLeague ? "Club League" : "International"}
                    </span>
                    <span className="tournament-editions-badge">
                      {stats.editionsCount} {stats.editionsCount === 1 ? "Edition" : "Editions"}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="tournament-card-body">
                  <Link to={`/competition/${tour._id}`} className="tournament-card-title-link">
                    <h3 className="tournament-card-name" title={tour.name}>
                      {tour.name}
                    </h3>
                  </Link>

                  <div className="tournament-card-meta">
                    <span className="tournament-sport-pill">
                      {tour.sport?.name || "Sport"}
                    </span>
                  </div>

                  {/* Highlights Box: Reigning Champion & All-Time Record */}
                  <div className="tournament-highlights">
                    {reigning ? (
                      <div className="highlight-row">
                        <span className="highlight-label">
                          <Crown size={12} style={{ display: "inline", verticalAlign: "-1px", marginRight: "3px" }} />
                          Reigning:
                        </span>
                        <div className="highlight-team">
                          <Logo
                            url={reigning.team?.imageUrl}
                            label={reigning.team?.name || "Champion"}
                            size="xs"
                          />
                          <span className="highlight-team-name">{reigning.team?.name || "Champion"}</span>
                          <span className="highlight-year">({reigning.year})</span>
                        </div>
                      </div>
                    ) : (
                      <div className="highlight-row empty">
                        <span className="highlight-label">Reigning:</span>
                        <span className="highlight-none">No champions recorded</span>
                      </div>
                    )}

                    {mostSuccessful && (
                      <div className="highlight-row">
                        <span className="highlight-label">
                          <Trophy size={12} style={{ display: "inline", verticalAlign: "-1px", marginRight: "3px" }} />
                          Most Titles:
                        </span>
                        <div className="highlight-team">
                          <Logo
                            url={mostSuccessful.team?.imageUrl}
                            label={mostSuccessful.team?.name || "Record"}
                            size="xs"
                          />
                          <span className="highlight-team-name">{mostSuccessful.team?.name || "Record"}</span>
                          <span className="highlight-count">({mostSuccessful.count} {mostSuccessful.count === 1 ? "Title" : "Titles"})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <Link to={`/competition/${tour._id}`} className="tournament-card-footer">
                  <span>View Competition Roll of Honour</span>
                  <ExternalLink size={13} className="footer-arrow" />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="tournaments-empty-state">
          <div className="empty-icon">🏆</div>
          <h3>No Competitions Found</h3>
          <p>
            {searchQuery
              ? `No competitions matched your search for “${searchQuery}”.`
              : "No competitions matched the selected filters."}
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
      {displayedTournaments.length < sortedTournaments.length && (
        <div className="tournaments-load-more">
          <button
            type="button"
            className="btn ghost"
            onClick={() => setPageLimit((prev) => prev + 48)}
          >
            Load More Competitions ({sortedTournaments.length - displayedTournaments.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
