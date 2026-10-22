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

  // All eras/versions sharing the same common teamIdentifier within the SAME sport
  const currentSportId = team.sport?._id || team.sport ? String(team.sport?._id || team.sport) : null;
  const teamIdentifier = String(team.teamIdentifier || team._id);
  const rawTeamEras = teams.filter((tm) => {
    const tmSportId = tm.sport?._id || tm.sport ? String(tm.sport?._id || tm.sport) : null;
    const sameSport = currentSportId ? tmSportId === currentSportId : true;
    const sameIdentifier =
      String(tm.teamIdentifier || tm._id).toLowerCase() === teamIdentifier.toLowerCase();
    return sameIdentifier && sameSport;
  });

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

  // Group / Franchise family
  const currentGroupId = currentVersion.groupIdentifier;
  const currentGroupName = currentVersion.groupName || currentGroupId;

  // All teams belonging to the same franchise group (including current team)
  const rawGroupTeams = currentGroupId
    ? teams.filter(
        (t) =>
          t.groupIdentifier &&
          t.groupIdentifier.toLowerCase() === currentGroupId.toLowerCase()
      )
    : [];

  const currentTeamKey = String(teamIdentifier);

  // Group by teamIdentifier and pick their active/current era
  const groupTeamsMap = new Map();
  rawGroupTeams.forEach((t) => {
    const sId = String(t.teamIdentifier || t._id);
    if (!groupTeamsMap.has(sId) || t.isCurrent) {
      groupTeamsMap.set(sId, t);
    }
  });

  // Ensure currentVersion is included in the map
  groupTeamsMap.set(currentTeamKey, currentVersion);

  // Sort so the currently open team is first, followed by sister teams alphabetically
  const groupTeams = Array.from(groupTeamsMap.values()).sort((a, b) => {
    const isACurrent = String(a.teamIdentifier || a._id) === currentTeamKey;
    const isBCurrent = String(b.teamIdentifier || b._id) === currentTeamKey;
    if (isACurrent) return -1;
    if (isBCurrent) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  // Associated competitions for this team
  const associatedTournaments = Array.isArray(currentVersion.tournaments) && currentVersion.tournaments.length > 0
    ? currentVersion.tournaments
    : currentVersion.tournament
    ? [currentVersion.tournament]
    : [];

  const latestTitle = titleWins.slice().sort((a, b) => (b.year || 0) - (a.year || 0))[0];

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
            {currentGroupId && (
              <span className="pill gold" title={`Belongs to ${currentGroupName} network`}>
                🌐 {currentGroupName}
              </span>
            )}
            <span className="pill" style={{ letterSpacing: "0.5px" }}>
              ID: {teamIdentifier}
            </span>
          </div>

          {/* Associated Competitions Pills */}
          {associatedTournaments.length > 0 && (
            <div className="team-associated-comps" style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", marginRight: "2px" }}>
                Associated Competitions:
              </span>
              {associatedTournaments.map((tObj) => {
                const tourData = tournaments.find((t) => t._id === (tObj._id || tObj)) || tObj;
                return (
                  <Link
                    key={tourData._id || tourData.name}
                    to={`/competition/${tourData._id}`}
                    className="comp-link-pill"
                  >
                    {tourData.imageUrl && (
                      <Logo url={tourData.imageUrl} label={tourData.name} size="xs" />
                    )}
                    <span>{tourData.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

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
                    teamIdentifier: currentVersion.teamIdentifier || teamIdentifier,
                    name: currentVersion.name,
                    type: currentVersion.type,
                    country: currentVersion.country,
                    city: currentVersion.city,
                    groupIdentifier: currentVersion.groupIdentifier,
                    groupName: currentVersion.groupName,
                    isCurrent: false,
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

      {/* Franchise Group & Sister Teams Section */}
      {currentGroupId && groupTeams.length > 1 && (
        <div className="section">
          <div className="section-head">
            <div>
              <h2>
                <span className="bar" />
                {currentGroupName} · Sister Teams
              </h2>
              <p>
                Affiliated clubs belonging to the <strong>{currentGroupName}</strong> global franchise network
              </p>
            </div>
            <span className="pill gold" style={{ fontSize: "12px", padding: "4px 12px" }}>
              🌐 {groupTeams.length} Clubs in Group
            </span>
          </div>

          <div className="sister-teams-grid">
            {groupTeams.map((member) => {
              const isOpenTeam = String(member.teamIdentifier || member._id) === currentTeamKey;

              // Calculate total title wins for this team across all sports
              const memberKey = String(member.teamIdentifier || member._id).toLowerCase();
              const mEras = teams.filter(
                (t) => String(t.teamIdentifier || t._id).toLowerCase() === memberKey
              );
              const mEraIds = new Set(mEras.map((t) => t._id));
              const mWins = leagues.filter((l) =>
                l.teams?.some(
                  (t) =>
                    mEraIds.has(t.team?._id || t.team) &&
                    (t.position === 1 || (l.shared && t.position === 2))
                )
              );

              // Competitions member belongs to
              const mTournaments = Array.isArray(member.tournaments) && member.tournaments.length > 0
                ? member.tournaments
                : member.tournament
                ? [member.tournament]
                : [];

              const cardContent = (
                <>
                  <div className="sister-crest-wrap">
                    <Logo url={member.imageUrl} label={member.name} size="xl" />
                  </div>

                  <div className="sister-info">
                    {isOpenTeam && (
                      <span className="sister-current-badge">
                        📍 Current Team
                      </span>
                    )}

                    <h3 className="sister-name">{member.name}</h3>

                    <div className="sister-meta-row">
                      <span className="sister-sport-pill">
                        {member.sport?.name || "Sport"}
                      </span>
                      {member.city || member.country ? (
                        <span className="sister-loc">
                          📍 {member.city ? `${member.city}${member.country ? `, ${member.country}` : ""}` : member.country}
                        </span>
                      ) : null}
                    </div>

                    {/* Associated Competitions */}
                    {mTournaments.length > 0 && (
                      <div className="sister-comps">
                        {mTournaments.map((tObj) => {
                          const tData = tournaments.find((t) => t._id === (tObj._id || tObj)) || tObj;
                          return (
                            <span key={tData._id || tData.name} className="sister-comp-badge">
                              {tData.imageUrl && (
                                <Logo url={tData.imageUrl} label={tData.name} size="xs" />
                              )}
                              <span>{tData.name}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {mWins.length > 0 ? (
                      <div className="sister-honour">
                        🏆 {mWins.length} {mWins.length === 1 ? "Title" : "Titles"}
                      </div>
                    ) : (
                      <div className="sister-honour empty">
                        No titles recorded
                      </div>
                    )}
                  </div>

                  <div className={`sister-arrow ${isOpenTeam ? "current" : ""}`}>
                    <span>{isOpenTeam ? "● Viewing Now" : "View Team →"}</span>
                  </div>
                </>
              );

              return isOpenTeam ? (
                <div
                  key={member._id}
                  className="sister-team-card current-open-team"
                  title={`${member.name} (Currently viewing this team)`}
                >
                  {cardContent}
                </div>
              ) : (
                <Link
                  key={member._id}
                  to={`/team/${member._id}`}
                  className="sister-team-card"
                  title={`View ${member.name}`}
                >
                  {cardContent}
                </Link>
              );
            })}
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
