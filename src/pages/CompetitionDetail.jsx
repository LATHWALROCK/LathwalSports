import React, { useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import Logo from "../components/Logo";
import { Plus, Edit2, Trash2, Trophy, Calendar, Crown, ArrowUpDown } from "lucide-react";

export default function CompetitionDetail() {
  const { id } = useParams();
  const {
    tournaments,
    teams,
    leagues,
    isAdmin,
    openAddEditionModal,
    openEditEditionModal,
    openDeleteConfirmModal,
  } = useSports();

  const [historyView, setHistoryView] = useState("timeline"); // "timeline" | "summary"
  const [timelineSort, setTimelineSort] = useState("newest"); // "newest" | "oldest"

  const tournament = tournaments.find((t) => t._id === id);

  // Filter editions for this tournament, newest first
  const compEditions = useMemo(() => {
    return leagues
      .filter((l) => (l.tournament?._id || l.tournament) === id)
      .sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
  }, [leagues, id]);

  // Helper to ensure team object is resolved
  const resolveTeam = useCallback((tm) => {
    if (!tm) return null;
    const tmId = String(tm._id || tm);
    const found = teams.find((t) => String(t._id) === tmId);
    if (found) return found;
    if (typeof tm === "object" && tm.name) return tm;
    return null;
  }, [teams]);

  // Canonical team resolver to aggregate across all historical eras in the same sport
  const getCanonicalTeam = useCallback(
    (rawTeam) => {
      if (!rawTeam) return null;
      const tmId = String(rawTeam._id || rawTeam);
      const teamDoc =
        teams.find((t) => String(t._id) === tmId) ||
        (typeof rawTeam === "object" ? rawTeam : null);
      if (!teamDoc) return null;

      const sportId = String(
        teamDoc.sport?._id || teamDoc.sport || tournament?.sport?._id || tournament?.sport || ""
      );
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
    },
    [teams, tournament]
  );

  // Editions formatted for the timeline
  const timelineEditions = useMemo(() => {
    const list = compEditions.map((edition) => {
      const winPos = edition.teams?.find((t) => t.position === 1);
      const ruPos = edition.teams?.find((t) => t.position === 2);
      return {
        ...edition,
        winner: resolveTeam(winPos?.team),
        runnerUp: resolveTeam(ruPos?.team),
        yearNum: Number(edition.year) || 0,
      };
    });

    if (timelineSort === "oldest") {
      return [...list].sort((a, b) => a.yearNum - b.yearNum);
    }
    return list;
  }, [compEditions, resolveTeam, timelineSort]);

  // All-time winners and runners-up leaderboard summary across all eras
  const summaryLeaderboard = useMemo(() => {
    const tallyMap = new Map();

    compEditions.forEach((edition) => {
      const winPos = edition.teams?.find((t) => t.position === 1);
      const ruPos = edition.teams?.find((t) => t.position === 2);
      const yrLabel = edition.season || edition.year;

      if (winPos) {
        const winTeam = resolveTeam(winPos.team);
        if (winTeam) {
          const canonical = getCanonicalTeam(winTeam);
          const key = canonical?.canonicalKey || String(winTeam.teamIdentifier || winTeam._id);
          const repTeam = canonical?.primary || winTeam;
          if (!tallyMap.has(key)) {
            tallyMap.set(key, { team: repTeam, wins: [], runnerUps: [] });
          }
          const entry = tallyMap.get(key);
          if (!entry.team?.isCurrent && repTeam.isCurrent) {
            entry.team = repTeam;
          }
          entry.wins.push({ year: yrLabel, editionId: edition._id });
        }
      }

      if (ruPos) {
        const ruTeam = resolveTeam(ruPos.team);
        if (ruTeam) {
          const canonical = getCanonicalTeam(ruTeam);
          const key = canonical?.canonicalKey || String(ruTeam.teamIdentifier || ruTeam._id);
          const repTeam = canonical?.primary || ruTeam;
          if (!tallyMap.has(key)) {
            tallyMap.set(key, { team: repTeam, wins: [], runnerUps: [] });
          }
          const entry = tallyMap.get(key);
          if (!entry.team?.isCurrent && repTeam.isCurrent) {
            entry.team = repTeam;
          }
          if (edition.shared) {
            entry.wins.push({ year: yrLabel, editionId: edition._id });
          } else {
            entry.runnerUps.push({ year: yrLabel, editionId: edition._id });
          }
        }
      }
    });

    return Array.from(tallyMap.values()).sort((a, b) => {
      const diffWins = b.wins.length - a.wins.length;
      if (diffWins !== 0) return diffWins;
      const diffRu = b.runnerUps.length - a.runnerUps.length;
      if (diffRu !== 0) return diffRu;
      return (a.team.name || "").localeCompare(b.team.name || "");
    });
  }, [compEditions, resolveTeam, getCanonicalTeam]);

  const finalistCount = useMemo(() => {
    const finalistSet = new Set();
    compEditions.forEach((edition) => {
      (edition.teams || []).forEach((t) => {
        if (t.position === 1 || t.position === 2) {
          const tm = resolveTeam(t.team);
          if (tm) {
            const canonical = getCanonicalTeam(tm);
            finalistSet.add(canonical?.canonicalKey || String(tm.teamIdentifier || tm._id));
          }
        }
      });
    });
    return finalistSet.size;
  }, [compEditions, resolveTeam, getCanonicalTeam]);

  const mostSuccessfulTeam =
    summaryLeaderboard.length > 0 && summaryLeaderboard[0].wins.length > 0
      ? summaryLeaderboard[0]
      : null;

  if (!tournament) {
    return (
      <div className="empty-state">
        <h2>Competition Not Found</h2>
        <p style={{ marginTop: "10px" }}>
          <Link to="/" style={{ color: "var(--football)" }}>
            ← Back to Dashboard
          </Link>
        </p>
      </div>
    );
  }

  // Calculate stats
  const reigningEdition = compEditions[0];
  const reigningWinnerPos = reigningEdition?.teams?.find((t) => t.position === 1);
  const reigningRuPos = reigningEdition?.teams?.find((t) => t.position === 2);
  const reigningWinner = resolveTeam(reigningWinnerPos?.team);
  const reigningRunnerUp = resolveTeam(reigningRuPos?.team);

  const winnerNames = new Set(
    compEditions
      .flatMap((l) =>
        (l.teams || [])
          .filter((t) => t.position === 1 || (l.shared && t.position === 2))
          .map((t) => t.team?.name)
      )
      .filter(Boolean)
  );

  return (
    <div>
      <Link to="/" className="back">
        ← Dashboard
      </Link>

      {/* Detail Header */}
      <section className="detail-head">
        {tournament.imageUrl && (
          <img
            className="watermark"
            src={tournament.imageUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={(e) => (e.target.style.display = "none")}
          />
        )}

        <Logo
          url={tournament.imageUrl}
          label={tournament.name}
          size="xxl"
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">
            {tournament.sport?.name || "Sport"} · {tournament.type === "League" ? "Club / League" : "International"}
          </div>
          <h1 style={{ marginTop: "6px" }}>{tournament.name}</h1>

          <div className="meta">
            <span className="pill football">
              {tournament.sport?.name || "Sport"}
            </span>
            <span className="pill">
              {tournament.type === "League" ? "Club / League" : "International Tournament"}
            </span>
          </div>

          <div className="kpis">
            <div className="kpi">
              <b>{compEditions.length}</b>
              <span>Editions</span>
            </div>
            <div className="kpi">
              <b>{winnerNames.size}</b>
              <span>Different Winners</span>
            </div>
            <div className="kpi">
              <b>{reigningEdition?.season || reigningEdition?.year || "—"}</b>
              <span>Latest Edition</span>
            </div>
          </div>
        </div>
      </section>

      {/* Champions & Runners-up History (Timeline & All-Time Summary) */}
      <section className="comp-history-section">
        {/* Section Header with Controls */}
        <div className="comp-history-header">
          <div className="comp-history-title-area">
            <div className="comp-history-eyebrow">
              <Trophy size={14} style={{ color: "var(--gold)" }} />
              <span>Finals &amp; Honours Archive</span>
            </div>
            <h2 className="comp-history-title">Winners &amp; Runners-up</h2>
            <p className="comp-history-subtitle">
              {historyView === "timeline"
                ? "Chronological timeline of championship finals and runners-up"
                : "All-time leaderboard of tournament titles and final appearances"}
            </p>
          </div>

          <div className="comp-history-actions">
            {/* View Mode Switcher: Timeline vs Summary */}
            <div className="comp-view-switcher">
              <button
                type="button"
                className={`comp-switch-btn ${historyView === "timeline" ? "active" : ""}`}
                onClick={() => setHistoryView("timeline")}
                title="View edition-by-edition chronological timeline"
              >
                <Calendar size={15} />
                <span>Timeline</span>
              </button>
              <button
                type="button"
                className={`comp-switch-btn ${historyView === "summary" ? "active" : ""}`}
                onClick={() => setHistoryView("summary")}
                title="View all-time titles and runners-up tally leaderboard"
              >
                <Crown size={15} />
                <span>All-Time Summary</span>
              </button>
            </div>

            {/* Sort toggle for Timeline */}
            {historyView === "timeline" && compEditions.length > 1 && (
              <button
                type="button"
                className="comp-sort-btn"
                onClick={() =>
                  setTimelineSort((prev) => (prev === "newest" ? "oldest" : "newest"))
                }
                title={
                  timelineSort === "newest"
                    ? "Currently showing Newest first. Click for Oldest first."
                    : "Currently showing Oldest first. Click for Newest first."
                }
              >
                <ArrowUpDown size={14} />
                <span>{timelineSort === "newest" ? "Newest First" : "Oldest First"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Snapshot Highlight Strip */}
        <div className="comp-snapshot-strip">
          {/* Most Successful Club */}
          <div className="comp-snapshot-card gold-accent">
            <div className="comp-snapshot-icon gold">👑</div>
            <div className="comp-snapshot-info">
              <span className="comp-snapshot-label">Most Successful Club</span>
              {mostSuccessfulTeam ? (
                <div className="comp-snapshot-team">
                  <Logo
                    url={mostSuccessfulTeam.team?.imageUrl}
                    label={mostSuccessfulTeam.team?.name}
                    short={mostSuccessfulTeam.team?.short}
                    color={mostSuccessfulTeam.team?.color}
                    size="sm"
                  />
                  <div className="comp-snapshot-team-text">
                    <Link
                      to={`/team/${mostSuccessfulTeam.team?._id}`}
                      className="comp-snapshot-name"
                    >
                      {mostSuccessfulTeam.team?.name}
                    </Link>
                    <span className="comp-snapshot-metric">
                      <b>{mostSuccessfulTeam.wins.length}</b> {mostSuccessfulTeam.wins.length === 1 ? "Title" : "Titles"}
                      {mostSuccessfulTeam.runnerUps.length > 0 && (
                        <> · <b>{mostSuccessfulTeam.runnerUps.length}</b> {mostSuccessfulTeam.runnerUps.length === 1 ? "RU" : "RUs"}</>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="comp-snapshot-empty">No champions recorded</span>
              )}
            </div>
          </div>

          {/* Reigning / Latest Champion */}
          <div className="comp-snapshot-card green-accent">
            <div className="comp-snapshot-icon green">🏆</div>
            <div className="comp-snapshot-info">
              <span className="comp-snapshot-label">
                Reigning Champion ({reigningEdition?.season || reigningEdition?.year || "—"})
              </span>
              {reigningWinner ? (
                <div className="comp-snapshot-team">
                  <Logo
                    url={reigningWinner.imageUrl}
                    label={reigningWinner.name}
                    short={reigningWinner.short}
                    color={reigningWinner.color}
                    size="sm"
                  />
                  <div className="comp-snapshot-team-text">
                    <Link
                      to={`/team/${reigningWinner._id}`}
                      className="comp-snapshot-name"
                    >
                      {reigningWinner.name}
                    </Link>
                    <span className="comp-snapshot-metric sub">
                      {reigningEdition?.shared ? (
                        "Joint Champion"
                      ) : reigningRunnerUp ? (
                        <>
                          Defeated{" "}
                          <Link
                            to={`/team/${reigningRunnerUp._id}`}
                            style={{ color: "var(--silver)", textDecoration: "underline" }}
                          >
                            {reigningRunnerUp.name}
                          </Link>
                        </>
                      ) : (
                        "Champions"
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="comp-snapshot-empty">No champion data</span>
              )}
            </div>
          </div>

          {/* Editions & Finalists KPIs */}
          <div className="comp-snapshot-card kpi-card">
            <div className="comp-snapshot-stat">
              <span className="comp-snapshot-stat-val">{compEditions.length}</span>
              <span className="comp-snapshot-stat-lbl">Editions Played</span>
            </div>
            <div className="comp-snapshot-stat-div" />
            <div className="comp-snapshot-stat">
              <span className="comp-snapshot-stat-val">{finalistCount}</span>
              <span className="comp-snapshot-stat-lbl">Unique Finalists</span>
            </div>
          </div>
        </div>

        {/* Content Body: Timeline View */}
        {historyView === "timeline" && (
          <div className="comp-timeline-container">
            {timelineEditions.length === 0 ? (
              <div className="comp-empty-history">
                <Calendar size={32} style={{ opacity: 0.4, marginBottom: "8px" }} />
                <p>No tournament editions or finals recorded yet.</p>
              </div>
            ) : (
              <div className="comp-timeline-scroll">
                <div className="comp-timeline-track">
                  {timelineEditions.map((edition, idx) => {
                    const win = edition.winner;
                    const ru = edition.runnerUp;
                    const isShared = edition.shared;

                    return (
                      <div className="comp-timeline-node" key={edition._id || idx}>
                        {/* Node milestone line & indicator */}
                        <div className="comp-node-anchor">
                          <div className="comp-node-dot" />
                          <div className="comp-node-badge">
                            {edition.season || edition.year}
                          </div>
                        </div>

                        {/* Matchup Card */}
                        <div
                          className="comp-timeline-card"
                          style={{
                            "--w-color": win?.color || "#eab308",
                            "--ru-color": ru?.color || "#94a3b8",
                          }}
                        >
                          {/* Shared Trophy Tag if applicable */}
                          {isShared && (
                            <div className="comp-card-shared-banner">
                              🤝 Joint Champions
                            </div>
                          )}

                          {/* Winner Side */}
                          <div className="comp-node-team winner-team">
                            <div className="comp-node-role">
                              <span className="role-tag gold">🏆 Winner</span>
                            </div>
                            {win ? (
                              <Link
                                to={`/team/${win._id}`}
                                className="comp-node-team-content"
                                title={`View ${win.name}`}
                              >
                                <Logo
                                  url={win.imageUrl}
                                  label={win.name}
                                  short={win.short}
                                  color={win.color}
                                  size="md"
                                />
                                <div className="comp-node-team-info">
                                  <span className="comp-team-label-name">
                                    {win.name}
                                  </span>
                                  {win.short && (
                                    <span className="comp-team-short-badge">
                                      {win.short}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ) : (
                              <div className="comp-node-team-empty">
                                <span className="comp-empty-dash">—</span>
                                <span className="comp-empty-txt">Winner not set</span>
                              </div>
                            )}
                          </div>

                          {/* Match Divider */}
                          <div className="comp-node-divider">
                            <span className="comp-vs-pill">FINAL</span>
                          </div>

                          {/* Runner-up Side */}
                          <div className="comp-node-team runner-team">
                            <div className="comp-node-role">
                              <span
                                className={`role-tag ${
                                  isShared ? "gold" : "silver"
                                }`}
                              >
                                {isShared ? "🏆 Joint Winner" : "🥈 Runner-up"}
                              </span>
                            </div>
                            {ru ? (
                              <Link
                                to={`/team/${ru._id}`}
                                className="comp-node-team-content"
                                title={`View ${ru.name}`}
                              >
                                <Logo
                                  url={ru.imageUrl}
                                  label={ru.name}
                                  short={ru.short}
                                  color={ru.color}
                                  size="md"
                                />
                                <div className="comp-node-team-info">
                                  <span className="comp-team-label-name">
                                    {ru.name}
                                  </span>
                                  {ru.short && (
                                    <span className="comp-team-short-badge">
                                      {ru.short}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ) : (
                              <div className="comp-node-team-empty">
                                <span className="comp-empty-dash">—</span>
                                <span className="comp-empty-txt">
                                  Runner-up not set
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Body: All-Time Summary View */}
        {historyView === "summary" && (
          <div className="comp-summary-container">
            {summaryLeaderboard.length === 0 ? (
              <div className="comp-empty-history">
                <Crown size={32} style={{ opacity: 0.4, marginBottom: "8px" }} />
                <p>No tournament honours recorded yet.</p>
              </div>
            ) : (
              <div className="comp-summary-table-wrap">
                <table className="comp-summary-table">
                  <thead>
                    <tr>
                      <th style={{ width: "60px", textAlign: "center" }}>Rank</th>
                      <th>Club / National Team</th>
                      <th style={{ textAlign: "center", width: "110px" }}>
                        <span className="tbl-header-badge gold">🏆 Winners</span>
                      </th>
                      <th style={{ textAlign: "center", width: "120px" }}>
                        <span className="tbl-header-badge silver">🥈 Runners-up</span>
                      </th>
                      <th style={{ textAlign: "center", width: "100px" }}>Total Finals</th>
                      <th>Winning Seasons</th>
                      <th>Runner-up Seasons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryLeaderboard.map((item, idx) => {
                      const totalFinals = item.wins.length + item.runnerUps.length;
                      const isTop1 = idx === 0 && item.wins.length > 0;
                      const isTop2 = idx === 1 && item.wins.length > 0;
                      const isTop3 = idx === 2 && item.wins.length > 0;

                      return (
                        <tr
                          key={item.team._id || idx}
                          className={isTop1 ? "row-leader" : ""}
                        >
                          <td style={{ textAlign: "center" }}>
                            <div className="rank-badge">
                              {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `#${idx + 1}`}
                            </div>
                          </td>
                          <td>
                            <Link
                              to={`/team/${item.team._id}`}
                              className="comp-tbl-team-cell"
                            >
                              <Logo
                                url={item.team.imageUrl}
                                label={item.team.name}
                                short={item.team.short}
                                color={item.team.color}
                                size="sm"
                              />
                              <div className="comp-tbl-team-info">
                                <span className="comp-tbl-team-name">
                                  {item.team.name}
                                </span>
                                {item.team.city && (
                                  <span className="comp-tbl-team-sub">
                                    {item.team.city}
                                    {item.team.country ? `, ${item.team.country}` : ""}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span
                              className={`count-pill gold ${
                                item.wins.length > 0 ? "highlight" : "zero"
                              }`}
                            >
                              {item.wins.length}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span
                              className={`count-pill silver ${
                                item.runnerUps.length > 0 ? "highlight" : "zero"
                              }`}
                            >
                              {item.runnerUps.length}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="count-pill finals">
                              {totalFinals}
                            </span>
                          </td>
                          <td>
                            <div className="season-pills-list">
                              {item.wins.length > 0 ? (
                                item.wins.map((w, wIdx) => (
                                  <span key={wIdx} className="season-pill win">
                                    {w.year}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="season-pills-list">
                              {item.runnerUps.length > 0 ? (
                                item.runnerUps.map((ru, ruIdx) => (
                                  <span key={ruIdx} className="season-pill ru">
                                    {ru.year}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Roll of Honour */}
      <div className="section">
        <div className="section-head">
          <div>
            <h2>
              <span className="bar" />
              Roll of Honour
            </h2>
            <p>Every edition and season tracked, newest first</p>
          </div>
          {isAdmin && (
            <button
              type="button"
              className="btn gold"
              onClick={() =>
                openAddEditionModal({
                  tournamentId: tournament._id,
                  sportId: tournament.sport?._id || tournament.sport,
                })
              }
            >
              <Plus size={16} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />
              Add Edition
            </button>
          )}
        </div>

        {compEditions.length > 0 ? (
          <div className="editions-showcase">
            {compEditions.map((edition) => {
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
                  {/* Card Header: Year, Edition Emblem, Shared Tag, Actions */}
                  <div className="edition-card-top">
                    <div className="edition-title-cluster">
                      <Logo
                        url={edition.leagueImageUrl || tournament.imageUrl}
                        label={edition.name}
                        size="md"
                      />
                      <div className="edition-heading">
                        <span className="edition-year-badge">
                          {edition.season || edition.year}
                        </span>
                        <span className="edition-sub-title">Tournament Edition</span>
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
              <Trophy size={48} color="var(--dim)" style={{ marginBottom: "12px" }} />
              <h3>No editions recorded yet</h3>
              <p>
                {isAdmin
                  ? "Click the button above to add the first edition for this competition."
                  : "Check back once the admin publishes editions for this competition."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
