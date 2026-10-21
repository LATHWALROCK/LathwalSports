import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import Logo from "../components/Logo";
import { Plus, Trophy, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const { sports, tournaments, teams, leagues, isAdmin, openAddEditionModal } = useSports();
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedKind, setSelectedKind] = useState("all");

  // Calculate latest edition for each tournament
  const tournamentLatestMap = {};
  leagues.forEach((l) => {
    const tourId = l.tournament?._id || l.tournament;
    if (!tourId) return;
    if (!tournamentLatestMap[tourId] || (l.year || 0) > (tournamentLatestMap[tourId].year || 0)) {
      tournamentLatestMap[tourId] = l;
    }
  });

  // Recently crowned ticker items (newest 10 editions with winners)
  const tickerItems = leagues
    .slice()
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .slice(0, 10);

  // Filter tournaments
  const visibleTournaments = tournaments.filter((t) => {
    const sportId = t.sport?._id || t.sport;
    const matchesSport = selectedSport === "all" || sportId === selectedSport;
    const isLeague = t.type === "League";
    const matchesKind =
      selectedKind === "all" ||
      (selectedKind === "league" && isLeague) ||
      (selectedKind === "tournament" && !isLeague);
    return matchesSport && matchesKind;
  });

  // Group tournaments into clean categories (International vs Club/League)
  const presentGroups = Array.from(
    new Set(
      visibleTournaments.map((t) =>
        t.type === "League" ? "Club & League Competitions" : "International Tournaments"
      )
    )
  ).sort((a, b) => (a.startsWith("International") ? -1 : 1));

  // Floating hero crests from latest editions
  const heroCrests = tickerItems.slice(0, 8).map((l, i) => {
    const winTeam = l.teams?.find((t) => t.position === 1)?.team;
    return winTeam ? (
      <Logo
        key={`${l._id}-${i}`}
        url={winTeam.imageUrl}
        label={winTeam.name}
        short={winTeam.short}
        color={winTeam.color}
        size="lg"
      />
    ) : null;
  }).filter(Boolean);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="eyebrow">Champions · Crests · Trophies · Records</div>
          <h1 style={{ marginTop: "10px" }}>
            Every champion.<br />
            <em>Every crest.</em>
          </h1>
          <p>
            The comprehensive roll of honour and crest history across world championships, tournaments, and leagues.
          </p>
        </div>

        <div className="stats">
          <div className="stat">
            <b>{sports.length}</b>
            <span>Sports</span>
          </div>
          <div className="stat">
            <b>{tournaments.length}</b>
            <span>Competitions</span>
          </div>
          <div className="stat">
            <b>{leagues.length}</b>
            <span>Editions</span>
          </div>
          <div className="stat">
            <b>{teams.length}</b>
            <span>Teams</span>
          </div>
        </div>

        {heroCrests.length > 0 && <div className="hero-crests">{heroCrests}</div>}
      </section>

      {/* Recently Crowned Ticker */}
      {tickerItems.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div>
              <h2>
                <span className="bar" />
                Recently Crowned
              </h2>
              <p>Latest champions across competitions</p>
            </div>
          </div>

          <div className="ticker">
            {tickerItems.map((l) => {
              const tour = l.tournament;
              const winPos = l.teams?.find((t) => t.position === 1);
              const winTeam = winPos?.team;
              if (!tour) return null;

              return (
                <Link key={l._id} className="tick" to={`/competition/${tour._id}`}>
                  <Logo
                    url={winTeam?.imageUrl}
                    label={winTeam?.name || "Winner"}
                    short={winTeam?.short}
                    color={winTeam?.color || "#334155"}
                    size="md"
                  />
                  <div>
                    <b>{winTeam?.name || "Champion"}</b>
                    <small>
                      <Logo
                        url={tour.imageUrl}
                        label={tour.name}
                        size="xs"
                      />
                      {tour.name} · {l.season || l.year}
                    </small>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filterbar">
        <div className="grp">
          <span className="lbl">Sport</span>
          <button
            className={`chip ${selectedSport === "all" ? "on" : ""}`}
            onClick={() => setSelectedSport("all")}
          >
            All Sports
          </button>
          {sports.map((s) => (
            <button
              key={s._id}
              className={`chip ${selectedSport === s._id ? "on" : ""}`}
              onClick={() => setSelectedSport(s._id)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="grp">
          <span className="lbl">Type</span>
          <button
            className={`chip ${selectedKind === "all" ? "on" : ""}`}
            onClick={() => setSelectedKind("all")}
          >
            All
          </button>
          <button
            className={`chip ${selectedKind === "tournament" ? "on" : ""}`}
            onClick={() => setSelectedKind("tournament")}
          >
            Tournaments
          </button>
          <button
            className={`chip ${selectedKind === "league" ? "on" : ""}`}
            onClick={() => setSelectedKind("league")}
          >
            Leagues
          </button>
        </div>
      </div>

      {/* Categorized Competition Grids */}
      {visibleTournaments.length > 0 ? (
        presentGroups.map((groupName) => {
          const groupTournaments = visibleTournaments.filter(
            (t) =>
              (t.type === "League"
                ? "Club & League Competitions"
                : "International Tournaments") === groupName
          );

          if (!groupTournaments.length) return null;

          return (
            <div className="section" key={groupName}>
              <div className="section-head">
                <div>
                  <h2>
                    <span className="bar" />
                    {groupName}
                  </h2>
                  <p>{groupTournaments.length} competition{groupTournaments.length === 1 ? "" : "s"}</p>
                </div>
              </div>

              <div className="grid">
                {groupTournaments.map((c) => {
                  const latestEdition = tournamentLatestMap[c._id];
                  const tourEditions = leagues.filter(
                    (l) => (l.tournament?._id || l.tournament) === c._id
                  );
                  const winPos = latestEdition?.teams?.find((t) => t.position === 1);
                  const ruPos = latestEdition?.teams?.find((t) => t.position === 2);
                  const winner = winPos?.team;
                  const runnerUp = ruPos?.team;

                  return (
                    <Link key={c._id} className="card" to={`/competition/${c._id}`}>
                      <div className="card-top">
                        <Logo
                          url={c.imageUrl}
                          label={c.name}
                          size="lg"
                        />
                        <div>
                          <h3>{c.name}</h3>
                          <small>
                            {c.sport?.name || "Sport"} · {c.type === "League" ? "Club / League" : "International"}
                          </small>
                        </div>
                      </div>

                      {latestEdition && winner ? (
                        <div
                          className="champ"
                          style={{ "--c": winner.color || "#121826" }}
                        >
                          <Logo
                            url={winner.imageUrl}
                            label={winner.name}
                            short={winner.short}
                            color={winner.color}
                            size="lg"
                          />
                          <div className="who">
                            <div className="eyebrow">
                              🏆 Champions {latestEdition.season || latestEdition.year}
                            </div>
                            <b>{winner.name}</b>
                            <small>
                              {tourEditions.length} edition{tourEditions.length === 1 ? "" : "s"} tracked
                            </small>
                          </div>
                        </div>
                      ) : (
                        <div className="champ" style={{ opacity: 0.7 }}>
                          <Trophy size={36} color="var(--dim)" />
                          <div className="who">
                            <div className="eyebrow">Roll of Honour</div>
                            <b>No editions yet</b>
                            <small>Add an edition to crown a champion</small>
                          </div>
                        </div>
                      )}

                      <div className="card-foot">
                        <div className="ru">
                          {runnerUp && (
                            <>
                              <Logo
                                url={runnerUp.imageUrl}
                                label={runnerUp.name}
                                short={runnerUp.short}
                                color={runnerUp.color}
                                size="xs"
                              />
                              <span>
                                {latestEdition?.shared ? "Winner: " : "Runner-up: "}
                                {runnerUp.name}
                              </span>
                            </>
                          )}
                          {!runnerUp && <span>{tourEditions.length} editions</span>}
                        </div>
                        <span className="more">
                          All winners <ChevronRight size={14} style={{ display: "inline", verticalAlign: "-2px" }} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className="empty-state">
          <h3>No competitions found</h3>
          <p style={{ maxWidth: "480px", margin: "10px auto 20px" }}>
            {sports.length === 0
              ? "Start by adding your first edition. The edition modal will guide you to create the sport, competition, and teams!"
              : "No competitions match the selected filter."}
          </p>
          {isAdmin ? (
            <button
              type="button"
              className="btn gold"
              onClick={() => openAddEditionModal()}
            >
              <Plus size={18} style={{ display: "inline", verticalAlign: "-3px", marginRight: "6px" }} />
              Add First Edition
            </button>
          ) : (
            <p style={{ color: "var(--gold)", fontWeight: 600 }}>
              💡 Switch to Admin View in the top bar to add sports, competitions, teams, and editions!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
