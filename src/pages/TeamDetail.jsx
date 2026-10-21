import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import Logo from "../components/Logo";
import { Trophy, Edit2, Plus } from "lucide-react";

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    teams,
    tournaments,
    leagues,
    isAdmin,
    openCreateTeamModal,
    openEditTeamModal,
  } = useSports();

  const team = teams.find((tm) => tm._id === id);

  if (!team) {
    return (
      <div className="empty-state">
        <h2>Team Not Found</h2>
        <p style={{ marginTop: "10px" }}>
          <Link to="/" style={{ color: "var(--football)" }}>
            ← Back to Dashboard
          </Link>
        </p>
      </div>
    );
  }

  // All eras/versions sharing the same common teamIdentifier
  const teamIdentifier = team.teamIdentifier || team._id;
  const rawTeamEras = teams.filter(
    (tm) => (tm.teamIdentifier || tm._id) === teamIdentifier
  );

  // Dynamically calculate active years from tournament editions
  const teamEras = rawTeamEras
    .map((era) => {
      const eraEditions = leagues.filter((l) =>
        l.teams?.some((t) => (t.team?._id || t.team) === era._id)
      );
      const years = eraEditions
        .map((l) => Number(l.year))
        .filter((y) => !isNaN(y) && y > 0)
        .sort((a, b) => a - b);

      const minYear = years.length > 0 ? years[0] : null;
      const maxYear = years.length > 0 ? years[years.length - 1] : null;

      let eraDisplay = "";
      if (years.length > 0) {
        if (era.isCurrent) {
          eraDisplay = `${minYear} – Present`;
        } else if (minYear === maxYear) {
          eraDisplay = `${minYear}`;
        } else {
          eraDisplay = `${minYear} – ${maxYear}`;
        }
      } else {
        eraDisplay = era.isCurrent ? "Current Version" : "Historical Version";
      }

      return {
        ...era,
        firstYear: minYear,
        lastYear: maxYear,
        editionsCount: years.length,
        eraDisplay,
      };
    })
    .sort((a, b) => {
      if (a.firstYear && b.firstYear) return a.firstYear - b.firstYear;
      if (a.firstYear) return -1;
      if (b.firstYear) return 1;
      return (a.isCurrent ? 1 : 0) - (b.isCurrent ? 1 : 0);
    });

  // Find current active version
  const currentVersion = teamEras.find((tm) => tm.isCurrent) || team;
  const eraIds = new Set(teamEras.map((tm) => tm._id));

  // All editions where any era of this team is Winner (position 1, or position 2 if shared)
  const titleWins = leagues.filter((l) =>
    l.teams?.some(
      (t) =>
        eraIds.has(t.team?._id || t.team) &&
        (t.position === 1 || (l.shared && t.position === 2))
    )
  );

  // All editions where any era of this team is Runner-up (position 2 and NOT shared)
  const runnerUpFinishes = leagues.filter((l) =>
    l.teams?.some(
      (t) =>
        eraIds.has(t.team?._id || t.team) &&
        t.position === 2 &&
        !l.shared
    )
  );

  // All editions where this team participated
  const allParticipations = leagues.filter((l) =>
    l.teams?.some((t) => eraIds.has(t.team?._id || t.team))
  );

  // Group participations by competition
  const compMap = {};
  allParticipations.forEach((l) => {
    const tourId = l.tournament?._id || l.tournament;
    if (!tourId) return;
    if (!compMap[tourId]) {
      const tourDoc = tournaments.find((t) => t._id === tourId);
      compMap[tourId] = {
        tournament: tourDoc || l.tournament,
        editions: [],
        wins: [],
        runnerUps: [],
      };
    }
    compMap[tourId].editions.push(l);
    const pos = l.teams?.find((t) => eraIds.has(t.team?._id || t.team))?.position;
    if (pos === 1 || (l.shared && pos === 2)) compMap[tourId].wins.push(l);
    else if (pos === 2) compMap[tourId].runnerUps.push(l);
  });

  const compList = Object.values(compMap).sort(
    (a, b) => b.wins.length - a.wins.length || b.editions.length - a.editions.length
  );

  const latestTitle = titleWins.sort((a, b) => (b.year || 0) - (a.year || 0))[0];

  return (
    <div>
      <button
        type="button"
        className="back"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      {/* Team Profile Header */}
      <section className="detail-head">
        <Logo
          url={currentVersion.imageUrl}
          label={currentVersion.name}
          size="xxl"
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <div className="eyebrow">
                Team Profile · {currentVersion.city || currentVersion.country || currentVersion.type || "Club"}
              </div>
              <h1 style={{ marginTop: "6px" }}>{currentVersion.name}</h1>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => openEditTeamModal(currentVersion)}
                title="Edit this team version"
                style={{ marginTop: "4px" }}
              >
                <Edit2 size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                Edit Team
              </button>
            )}
          </div>

          <div className="meta">
            <span className="pill football">
              {currentVersion.sport?.name || "Sport"}
            </span>
            <span className="pill">
              {currentVersion.type === "National" ? "National Team" : "Club / League"}
            </span>
            <span className="pill" style={{ letterSpacing: "0.5px" }}>
              ID: {teamIdentifier}
            </span>
          </div>

          <div className="kpis">
            <div className="kpi">
              <b style={{ color: "var(--gold)" }}>{titleWins.length}</b>
              <span>Titles</span>
            </div>
            <div className="kpi">
              <b style={{ color: "var(--silver)" }}>{runnerUpFinishes.length}</b>
              <span>Runner-up Finishes</span>
            </div>
            <div className="kpi">
              <b>{allParticipations.length}</b>
              <span>Editions Participated</span>
            </div>
            <div className="kpi">
              <b>{latestTitle?.season || latestTitle?.year || "—"}</b>
              <span>Latest Title</span>
            </div>
          </div>

          {/* Trophy Cabinet */}
          {titleWins.length > 0 && (
            <div className="trophy-cabinet">
              {compList
                .filter((item) => item.wins.length > 0)
                .map((item) => (
                  <Link
                    key={item.tournament?._id || item.tournament?.name}
                    className="t"
                    to={`/competition/${item.tournament?._id}`}
                  >
                    <Logo
                      url={item.tournament?.imageUrl}
                      label={item.tournament?.name}
                      size="xs"
                    />
                    <span>{item.tournament?.name}</span>
                    <b>×{item.wins.length}</b>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Timeline: Evolution of Name & Crest over time */}
      {teamEras.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div>
              <h2>
                <span className="bar" />
                Evolution of Crest &amp; Identity
              </h2>
              <p>
                {teamEras.length === 1
                  ? "Current official crest and identity"
                  : `${teamEras.length} distinct eras recorded in team history`}
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="btn ghost sm"
                onClick={() =>
                  openCreateTeamModal({
                    role: "general",
                    sportId: currentVersion.sport?._id || currentVersion.sport,
                    tournamentId: currentVersion.tournament?._id || currentVersion.tournament,
                  })
                }
                title="Add a new era version for this team"
              >
                <Plus size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                Add Era Version
              </button>
            )}
          </div>

          <div className="evo-timeline-wrap">
            <div className="evo-timeline">
              {teamEras.map((era) => {
                const eraEditions = leagues.filter((l) =>
                  l.teams?.some((t) => (t.team?._id || t.team) === era._id)
                );
                const eraWins = eraEditions.filter((l) =>
                  l.teams?.some(
                    (t) =>
                      (t.team?._id || t.team) === era._id &&
                      (t.position === 1 || (l.shared && t.position === 2))
                  )
                );

                return (
                  <div
                    key={era._id}
                    className={`evo-card ${era.isCurrent ? "now" : ""}`}
                  >
                    {/* Top Era Milestone Header & Connector */}
                    <div className="evo-card-milestone">
                      <div className="evo-node-dot" />
                      <div className="evo-year-pill">
                        {era.eraDisplay}
                      </div>
                    </div>

                    {/* Crest Display Container */}
                    <div className="evo-crest-wrap">
                      <Logo url={era.imageUrl} label={era.name} size="xl" />
                      {era.isCurrent && (
                        <span className="evo-current-badge">
                          ✓ Active Crest
                        </span>
                      )}
                    </div>

                    {/* Era Details */}
                    <div className="evo-meta">
                      <div className="evo-name" title={era.name}>
                        {era.name}
                      </div>
                      <div className="evo-sub">
                        {era.city || era.country || (era.type === "National" ? "National Team" : "Club Franchise")}
                      </div>

                      {eraWins.length > 0 && (
                        <div className="evo-honour">
                          🏆 {eraWins.length} {eraWins.length === 1 ? "Title" : "Titles"}
                        </div>
                      )}
                    </div>

                    {/* Admin Edit Era Action */}
                    {isAdmin && (
                      <div className="evo-actions">
                        <button
                          type="button"
                          className="btn-evo-edit"
                          onClick={() => openEditTeamModal(era)}
                          title={`Edit ${era.name} (${era.eraDisplay})`}
                        >
                          <Edit2 size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
                          Edit Era
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Participation & Honours Grid */}
      <div className="section">
        <div className="section-head">
          <div>
            <h2>
              <span className="bar" />
              Participation &amp; Honours
            </h2>
            <p>Every competition and season recorded across all eras</p>
          </div>
          <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "var(--muted)", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "var(--gold)" }} />
              Champions
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "var(--silver)" }} />
              Runner-up
            </span>
          </div>
        </div>

        {compList.length > 0 ? (
          <div className="honours">
            {compList.map((item) => {
              const tour = item.tournament;
              if (!tour) return null;

              const sortedEditions = item.editions.slice().sort(
                (a, b) => (a.year || 0) - (b.year || 0)
              );

              return (
                <div className="honour" key={tour._id}>
                  <Link className="honour-top" to={`/competition/${tour._id}`}>
                    <Logo
                      url={tour.imageUrl}
                      label={tour.name}
                      size="md"
                    />
                    <div>
                      <h3>{tour.name}</h3>
                      <small style={{ color: "var(--muted)" }}>
                        {sortedEditions[0]?.season || sortedEditions[0]?.year} –{" "}
                        {sortedEditions[sortedEditions.length - 1]?.season ||
                          sortedEditions[sortedEditions.length - 1]?.year}
                      </small>
                    </div>
                    <div className="count">
                      <b>{sortedEditions.length}</b>
                      <span>{tour.type === "League" ? "Seasons" : "Editions"}</span>
                    </div>
                  </Link>

                  <div className="part-stats">
                    <span className="gold">🏆 {item.wins.length}</span>
                    <span className="silver">🥈 {item.runnerUps.length}</span>
                  </div>

                  <div className="seasons">
                    {sortedEditions.map((ed) => {
                      const pos = ed.teams?.find(
                        (t) => eraIds.has(t.team?._id || t.team)
                      )?.position;
                      const isWin = pos === 1 || (ed.shared && pos === 2);
                      const isRu = !ed.shared && pos === 2;
                      const cls = isWin ? "win" : isRu ? "ru" : "";

                      return (
                        <span
                          key={ed._id}
                          className={cls}
                          title={`${ed.season || ed.year}${
                            isWin ? " · Champions" : isRu ? " · Runner-up" : ""
                          }`}
                        >
                          {ed.season || ed.year}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="roll">
            <div className="empty-state">
              <Trophy size={44} color="var(--dim)" style={{ marginBottom: "12px" }} />
              <h3>No participation records yet</h3>
              <p>Add this team to an edition to start tracking their honours cabinet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
