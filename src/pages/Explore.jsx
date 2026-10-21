import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import Logo from "../components/Logo";
import Picklist from "../components/Picklist";
import { Edit2, Trash2 } from "lucide-react";

export default function Explore() {
  const {
    sports,
    tournaments,
    leagues,
    isAdmin,
    openEditEditionModal,
    openDeleteConfirmModal,
  } = useSports();

  const [teamQuery, setTeamQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedKind, setSelectedKind] = useState("all");
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [yearQuery, setYearQuery] = useState("");
  const [limit, setLimit] = useState(50);

  // Filter competitions matching sport
  const filteredTournaments = tournaments.filter(
    (t) => selectedSport === "all" || (t.sport?._id || t.sport) === selectedSport
  );

  const q = teamQuery.trim().toLowerCase();
  const yr = Number(yearQuery);

  const filteredEditions = leagues
    .filter((l) => {
      const tour = l.tournament;
      if (!tour) return false;

      const tourSportId = tour.sport?._id || tour.sport;
      if (selectedSport !== "all" && tourSportId !== selectedSport) return false;

      const isLeague = tour.type === "League";
      if (selectedKind === "tournament" && isLeague) return false;
      if (selectedKind === "league" && !isLeague) return false;

      if (selectedTournament !== "all" && tour._id !== selectedTournament) return false;

      if (yr && Number(l.year) !== yr) return false;

      if (q) {
        const winTeam = l.teams?.find((t) => t.position === 1)?.team;
        const ruTeam = l.teams?.find((t) => t.position === 2)?.team;
        const matchWin = winTeam?.name?.toLowerCase().includes(q) || winTeam?.short?.toLowerCase().includes(q);
        const matchRu = ruTeam?.name?.toLowerCase().includes(q) || ruTeam?.short?.toLowerCase().includes(q);
        if (!matchWin && !matchRu) return false;
      }

      return true;
    })
    .sort((a, b) => (b.year || 0) - (a.year || 0));

  const isFiltered =
    teamQuery || selectedSport !== "all" || selectedKind !== "all" || selectedTournament !== "all" || yearQuery;

  const resetFilters = () => {
    setTeamQuery("");
    setSelectedSport("all");
    setSelectedKind("all");
    setSelectedTournament("all");
    setYearQuery("");
    setLimit(50);
  };

  const displayedEditions = filteredEditions.slice(0, limit);

  return (
    <div>
      <div className="section-head" style={{ marginTop: "4px" }}>
        <div>
          <h2 style={{ fontSize: "38px" }}>
            <span className="bar" />
            Explore Winners
          </h2>
          <p>Filter every edition by sport, competition format, team, or year</p>
        </div>
      </div>

      {/* Filter Bar Grid */}
      <div className="explore-filters">
        <div className="field">
          <label htmlFor="f-team">Team Name</label>
          <input
            id="f-team"
            type="search"
            placeholder="e.g. Real Madrid, India…"
            value={teamQuery}
            onChange={(e) => setTeamQuery(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="f-sport">Sport</label>
          <Picklist
            id="f-sport"
            value={selectedSport}
            onChange={(val) => {
              setSelectedSport(val);
              setSelectedTournament("all");
            }}
            options={[
              { value: "all", label: "All Sports" },
              ...sports.map((s) => ({
                value: s._id,
                label: s.name,
                logo: s.imageUrl,
              })),
            ]}
          />
        </div>

        <div className="field">
          <label htmlFor="f-kind">Type</label>
          <Picklist
            id="f-kind"
            value={selectedKind}
            onChange={(val) => setSelectedKind(val)}
            options={[
              { value: "all", label: "Tournaments & Leagues" },
              { value: "tournament", label: "Tournaments" },
              { value: "league", label: "Leagues" },
            ]}
          />
        </div>

        <div className="field">
          <label htmlFor="f-comp">Competition</label>
          <Picklist
            id="f-comp"
            value={selectedTournament}
            onChange={(val) => setSelectedTournament(val)}
            options={[
              { value: "all", label: "All Competitions" },
              ...filteredTournaments.map((t) => ({
                value: t._id,
                label: t.name,
                sub: t.type === "League" ? "Club" : "International",
                logo: t.imageUrl,
              })),
            ]}
          />
        </div>

        <div className="field">
          <label htmlFor="f-year">Year</label>
          <input
            id="f-year"
            type="number"
            placeholder="e.g. 2024"
            value={yearQuery}
            onChange={(e) => setYearQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Results Header */}
      <div className="result-count">
        <span>
          <b style={{ color: "var(--text)" }}>{filteredEditions.length}</b> edition
          {filteredEditions.length === 1 ? "" : "s"} found
        </span>
        {isFiltered && (
          <button type="button" className="btn ghost" onClick={resetFilters}>
            Clear filters ✕
          </button>
        )}
      </div>

      {/* Results Table */}
      {filteredEditions.length > 0 ? (
        <div className="editions-showcase">
          {displayedEditions.map((edition) => {
            const tour = edition.tournament;
            const winPos = edition.teams?.find((t) => t.position === 1);
            const ruPos = edition.teams?.find((t) => t.position === 2);
            const winTeam = winPos?.team;
            const ruTeam = ruPos?.team;
            const otherParticipants = (edition.teams || []).filter(
              (t) =>
                t.position !== 1 &&
                t.position !== 2 &&
                (t.team?._id || t.team) !== (winTeam?._id || winTeam) &&
                (t.team?._id || t.team) !== (ruTeam?._id || ruTeam)
            );

            return (
              <div className="edition-card" key={edition._id}>
                {/* Card Header: Year, Competition Tag, Shared Tag, Actions */}
                <div className="edition-card-top">
                  <div className="edition-title-cluster">
                    <Logo
                      url={edition.leagueImageUrl || tour?.imageUrl}
                      label={edition.name}
                      size="md"
                    />
                    <div className="edition-heading">
                      <span className="edition-year-badge">
                        {edition.season || edition.year}
                      </span>
                      {tour && (
                        <Link to={`/competition/${tour._id}`} className="edition-tour-tag">
                          <Logo url={tour.imageUrl} label={tour.name} size="xs" />
                          <span>{tour.name}</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="edition-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        title="Edit edition"
                        onClick={() => openEditEditionModal(edition)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon del"
                        title="Delete edition"
                        onClick={() => openDeleteConfirmModal(edition)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Main Honours Showcase: Champions vs Finalist */}
                <div className="edition-honours-grid">
                  {/* Champion Podium Box */}
                  <div className="podium-card champion">
                    <div className="podium-header">
                      <span className="podium-tag gold">🏆 Champions</span>
                    </div>
                    {winTeam ? (
                      <Link to={`/team/${winTeam._id}`} className="podium-team">
                        <Logo
                          url={winTeam.imageUrl}
                          label={winTeam.name}
                          short={winTeam.short}
                          color={winTeam.color}
                          size="lg"
                        />
                        <div className="podium-team-details">
                          <span className="podium-team-name">{winTeam.name}</span>
                          <span className="podium-team-sub">Tournament Winner</span>
                        </div>
                      </Link>
                    ) : (
                      <div className="podium-team empty">
                        <span className="podium-none">— Not Awarded —</span>
                      </div>
                    )}
                  </div>

                  {/* Second Team Podium Box: Co-Champion if Shared, Runner-up if not */}
                  <div className={`podium-card ${edition.shared ? "champion" : "runner-up"}`}>
                    <div className="podium-header">
                      <span className={`podium-tag ${edition.shared ? "gold" : "silver"}`}>
                        {edition.shared ? "🏆 Champions" : "🥈 Runner-up"}
                      </span>
                    </div>
                    {ruTeam ? (
                      <Link to={`/team/${ruTeam._id}`} className="podium-team">
                        <Logo
                          url={ruTeam.imageUrl}
                          label={ruTeam.name}
                          short={ruTeam.short}
                          color={ruTeam.color}
                          size="lg"
                        />
                        <div className="podium-team-details">
                          <span className="podium-team-name">{ruTeam.name}</span>
                          <span className="podium-team-sub">
                            {edition.shared ? "Tournament Winner" : "Finalist"}
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <div className="podium-team empty">
                        <span className="podium-none">— None / Not Awarded —</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Other Participants Ribbon */}
                {otherParticipants.length > 0 && (
                  <div className="edition-participants-gallery">
                    <span className="participants-ribbon-title">
                      Other Participants ({otherParticipants.length}):
                    </span>
                    <div className="participants-ribbon-list">
                      {otherParticipants.map((p) => {
                        const pTeam = p.team;
                        if (!pTeam || typeof pTeam !== "object") return null;
                        return (
                          <Link
                            key={pTeam._id}
                            to={`/team/${pTeam._id}`}
                            className="participant-pill"
                            title={pTeam.name}
                          >
                            <Logo
                              url={pTeam.imageUrl}
                              label={pTeam.name}
                              short={pTeam.short}
                              color={pTeam.color}
                              size="sm"
                            />
                            <span className="participant-pill-name">{pTeam.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="roll">
          <div className="empty-state">
            <h3>No editions match your filters</h3>
            <p style={{ marginTop: "6px" }}>
              Try searching with a different team name, sport, or clearing filters.
            </p>
          </div>
        </div>
      )}

      {/* Load More Button */}
      {filteredEditions.length > displayedEditions.length && (
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            type="button"
            className="btn"
            onClick={() => setLimit((prev) => prev + 50)}
          >
            Show more ({filteredEditions.length - displayedEditions.length} left)
          </button>
        </div>
      )}
    </div>
  );
}
