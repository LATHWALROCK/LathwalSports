import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import Logo from "../components/Logo";
import Picklist from "../components/Picklist";
import { Edit2, Trash2, Trophy, Medal, Users } from "lucide-react";

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

      {/* Results Grid */}
      {displayedEditions.length > 0 ? (
        <div className="tournaments-grid">
          {displayedEditions.map((edition) => {
            const tour = edition.tournament;
            const isLeague = tour?.type === "League";
            const winPos = edition.teams?.find((t) => t.position === 1);
            const ruPos = edition.shared
              ? (edition.teams?.filter((t) => t.position === 1)[1] || edition.teams?.find((t) => t.position === 2))
              : edition.teams?.find((t) => t.position === 2);
            const winTeam = winPos?.team && typeof winPos.team === "object" ? winPos.team : null;
            const ruTeam = ruPos?.team && typeof ruPos.team === "object" ? ruPos.team : null;
            const totalParticipants = (edition.teams || []).length;

            return (
              <div key={edition._id} className="tournament-directory-card">
                {/* Card Top: Edition Logo & Badges */}
                <div className="tournament-card-top">
                  <div className="tournament-card-crest-box">
                    <Logo
                      url={edition.leagueImageUrl || tour?.imageUrl}
                      label={edition.name}
                      size="xl"
                    />
                  </div>

                  <div className="tournament-card-badges">
                    {isAdmin && (
                      <div className="edition-admin-actions">
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit edition"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openEditEditionModal(edition);
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon del"
                          title="Delete edition"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openDeleteConfirmModal(edition);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                    <span className="tournament-editions-badge">
                      {edition.season || edition.year}
                    </span>
                    {tour && (
                      <span className={`tournament-type-badge ${isLeague ? "league" : "international"}`}>
                        {isLeague ? "Club League" : "International"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="tournament-card-body">
                  <Link
                    to={tour ? `/competition/${tour._id}` : "#"}
                    className="tournament-card-title-link"
                  >
                    <h3 className="tournament-card-name" title={edition.name}>
                      {edition.name}
                    </h3>
                  </Link>

                  <div className="tournament-card-meta">
                    <span className="tournament-sport-pill">
                      {tour?.sport?.name || "Sport"}
                    </span>
                    {tour?.name && tour.name !== edition.name && (
                      <span
                        className="tournament-comp-sub"
                        title={tour.name}
                        style={{
                          fontSize: "12px",
                          color: "var(--dim)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "180px",
                        }}
                      >
                        {tour.name}
                      </span>
                    )}
                  </div>

                  {/* Highlights Box: Winner, Runner-up & Total Participants */}
                  <div className="tournament-highlights">
                    {/* Winner */}
                    <div className="highlight-row">
                      <span className="highlight-label">
                        <Trophy
                          size={12}
                          style={{
                            display: "inline",
                            verticalAlign: "-1px",
                            marginRight: "3px",
                            color: "var(--gold)",
                          }}
                        />
                        Winner:
                      </span>
                      {winTeam ? (
                        <Link
                          to={`/team/${winTeam._id}`}
                          className="highlight-team"
                          title={winTeam.name}
                        >
                          <Logo
                            url={winTeam.imageUrl}
                            label={winTeam.name}
                            short={winTeam.short}
                            color={winTeam.color}
                            size="xs"
                          />
                          <span className="highlight-team-name">{winTeam.name}</span>
                        </Link>
                      ) : (
                        <span className="highlight-none">No winner recorded</span>
                      )}
                    </div>

                    {/* Runner-up */}
                    <div className="highlight-row">
                      <span className="highlight-label">
                        <Medal
                          size={12}
                          style={{
                            display: "inline",
                            verticalAlign: "-1px",
                            marginRight: "3px",
                            color: edition.shared ? "var(--gold)" : "var(--silver)",
                          }}
                        />
                        {edition.shared ? "Joint Winner:" : "Runner-up:"}
                      </span>
                      {ruTeam ? (
                        <Link
                          to={`/team/${ruTeam._id}`}
                          className="highlight-team"
                          title={ruTeam.name}
                        >
                          <Logo
                            url={ruTeam.imageUrl}
                            label={ruTeam.name}
                            short={ruTeam.short}
                            color={ruTeam.color}
                            size="xs"
                          />
                          <span className="highlight-team-name">{ruTeam.name}</span>
                        </Link>
                      ) : (
                        <span className="highlight-none">—</span>
                      )}
                    </div>

                    {/* Total Participants */}
                    <div className="highlight-row">
                      <span className="highlight-label">
                        <Users
                          size={12}
                          style={{
                            display: "inline",
                            verticalAlign: "-1px",
                            marginRight: "3px",
                            color: "#38bdf8",
                          }}
                        />
                        Participants:
                      </span>
                      <span className="highlight-participants-count">
                        {totalParticipants} {totalParticipants === 1 ? "Team" : "Teams"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                {tour && (
                  <Link to={`/competition/${tour._id}`} className="tournament-card-footer">
                    <span>View Competition Roll of Honour</span>
                    <span className="footer-arrow">↗</span>
                  </Link>
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
