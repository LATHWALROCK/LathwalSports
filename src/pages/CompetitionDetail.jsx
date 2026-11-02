import React, { useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import Logo from "../components/Logo";
import { Plus, Edit2, Trash2, Trophy, Calendar, Crown } from "lucide-react";
import { formatLocation } from "../utils/helpers";

export default function CompetitionDetail() {
  const { id } = useParams();
  const {
    tournaments,
    teams,
    leagues,
    isAdmin,
    openAddEditionModal,
    openEditEditionModal,
    openEditTournamentModal,
    openDeleteConfirmModal,
  } = useSports();

  const [historyView, setHistoryView] = useState("timeline"); // "timeline" | "summary"

  const tournament = tournaments.find((t) => t._id === id);

  // Helper to extract the 4-digit calendar year or latest season year from an edition
  const extractEditionYear = useCallback((edition) => {
    if (!edition) return 0;
    const num = Number(edition.year);
    if (!isNaN(num) && num > 0) return num;
    const str = String(edition.season || "");
    const m4 = str.match(/\d{4}/g);
    if (m4 && m4.length > 0) {
      let maxY = Math.max(...m4.map((y) => parseInt(y, 10)));
      const m2 = str.match(/\d{4}[-/](\d{2})\b/);
      if (m2 && m2[1]) {
        const century = Math.floor(maxY / 100) * 100;
        const endY = century + parseInt(m2[1], 10);
        if (endY > maxY) maxY = endY;
      }
      return maxY;
    }
    return 0;
  }, []);

  // Precompute latest edition year for every era across all tournaments/leagues
  const eraMaxYearMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(leagues)) return map;

    leagues.forEach((l) => {
      if (!l || !Array.isArray(l.teams)) return;
      const yr = extractEditionYear(l);
      if (yr <= 0) return;

      l.teams.forEach((t) => {
        const tmId = String(t.team?._id || t.team || "");
        if (tmId) {
          const currentMax = map.get(tmId) || 0;
          if (yr > currentMax) {
            map.set(tmId, yr);
          }
        }
      });
    });

    return map;
  }, [leagues, extractEditionYear]);

  // Recency score calculator for an era (participation year + creation timestamp)
  const getEraRecency = useCallback(
    (era) => {
      if (!era) return { maxYear: 0, createdTime: 0 };
      const eraId = String(era._id || "");
      const maxYear = eraMaxYearMap.get(eraId) || 0;

      let createdTime = 0;
      if (era.createdAt) {
        createdTime = new Date(era.createdAt).getTime();
      } else if (eraId && eraId.length >= 8) {
        try {
          createdTime = parseInt(eraId.substring(0, 8), 16) * 1000;
        } catch {
          createdTime = 0;
        }
      }

      return { maxYear, createdTime };
    },
    [eraMaxYearMap]
  );

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

      // Sort eras to pick the representative:
      // 1. Era marked isCurrent === true takes top priority
      // 2. If all eras are inactive (or multiple are current), pick the latest era:
      //    a) Most recent tournament edition participated in (maxYear)
      //    b) Creation timestamp / ObjectId
      //    c) Fallback to last era in the array
      const sortedEras = [...eras].sort((a, b) => {
        const aCurrent = Boolean(a.isCurrent);
        const bCurrent = Boolean(b.isCurrent);
        if (aCurrent && !bCurrent) return -1;
        if (!aCurrent && bCurrent) return 1;

        const scoreA = getEraRecency(a);
        const scoreB = getEraRecency(b);

        if (scoreA.maxYear !== scoreB.maxYear) {
          return scoreB.maxYear - scoreA.maxYear; // Highest year first
        }

        if (scoreA.createdTime !== scoreB.createdTime) {
          return scoreB.createdTime - scoreA.createdTime; // Later created first
        }

        return eras.indexOf(b) - eras.indexOf(a);
      });

      const primary = sortedEras[0] || teamDoc;
      const canonicalKey = `${sportId}___${String(primary.teamIdentifier || primary.name || primary._id).trim().toLowerCase()}`;

      return {
        primary,
        canonicalKey,
        allEras: eras,
        sortedEras,
      };
    },
    [teams, tournament, getEraRecency]
  );

  // Editions formatted for the timeline (always newest first)
  const timelineEditions = useMemo(() => {
    return compEditions.map((edition) => {
      const winPos = edition.teams?.find((t) => t.position === 1);
      const ruPos = edition.teams?.find((t) => t.position === 2);
      return {
        ...edition,
        winner: resolveTeam(winPos?.team),
        runnerUp: resolveTeam(ruPos?.team),
        yearNum: Number(edition.year) || 0,
      };
    });
  }, [compEditions, resolveTeam]);

  // All-time winners and runners-up leaderboard summary across all eras
  const summaryLeaderboard = useMemo(() => {
    const tallyMap = new Map();

    const updateLeaderboardTeam = (entry, repTeam) => {
      if (!entry.team) {
        entry.team = repTeam;
        return;
      }
      if (entry.team._id === repTeam._id) return;

      const scoreEntry = getEraRecency(entry.team);
      const scoreRep = getEraRecency(repTeam);
      const repIsBetter =
        (!entry.team.isCurrent && repTeam.isCurrent) ||
        (Boolean(entry.team.isCurrent) === Boolean(repTeam.isCurrent) &&
          (scoreRep.maxYear > scoreEntry.maxYear ||
            (scoreRep.maxYear === scoreEntry.maxYear && scoreRep.createdTime >= scoreEntry.createdTime)));
      if (repIsBetter) {
        entry.team = repTeam;
      }
    };

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
          updateLeaderboardTeam(entry, repTeam);
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
          updateLeaderboardTeam(entry, repTeam);
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
  }, [compEditions, resolveTeam, getCanonicalTeam, getEraRecency]);

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
  const reigningWinner = resolveTeam(reigningWinnerPos?.team);

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

      {/* Detail Hero Section */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-8 bg-gradient-to-br from-[#0e1626] via-[#090f1b] to-[#121827] border border-[#232c40] shadow-xl">
        {/* Subtle Ambient Light Glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#00e39b]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-[#38bdf8]/5 rounded-full blur-3xl pointer-events-none" />

        {tournament.imageUrl && (
          <img
            className="absolute -right-8 -bottom-8 w-60 h-60 sm:w-80 sm:h-80 opacity-5 pointer-events-none object-contain blur-[1px]"
            src={tournament.imageUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={(e) => (e.target.style.display = "none")}
          />
        )}

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7">
          <div className="flex-shrink-0">
            <Logo
              url={tournament.imageUrl}
              label={tournament.name}
              size="xl"
            />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#00e39b]">
              <Trophy size={13} />
              <span>
                {tournament.sport?.name || "Sport"} · {tournament.type === "League" ? "Club / Franchise League" : "International Championship"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black uppercase tracking-wide text-white mt-1 leading-tight">
              {tournament.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#00e39b]/15 text-[#00e39b] border border-[#00e39b]/30">
                {tournament.sport?.name || "Sport"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#121826] text-[#8b96ad] border border-[#232c40]">
                {tournament.type === "League" ? "Club League" : "International Tournament"}
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => openEditTournamentModal(tournament)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/35 hover:bg-sky-500/25 transition-all cursor-pointer shadow-xs"
                  title="Edit competition details"
                >
                  <Edit2 size={12} /> Edit Competition
                </button>
              )}
            </div>

            {/* Horizontal Stats Strip */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 mt-5 pt-4 border-t border-[#232c40]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-display font-extrabold text-xl shadow-xs">
                  {compEditions.length}
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-xs font-extrabold text-white uppercase tracking-wider">Editions</span>
                  <span className="text-[10px] text-[#8b96ad] font-medium">Seasons Played</span>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-[#232c40]" />

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-display font-extrabold text-xl shadow-xs">
                  {winnerNames.size}
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-xs font-extrabold text-white uppercase tracking-wider">Winners</span>
                  <span className="text-[10px] text-[#8b96ad] font-medium">Unique Champions</span>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-[#232c40]" />

              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-display font-extrabold text-base shadow-xs">
                  {reigningEdition?.season || reigningEdition?.year || "—"}
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-xs font-extrabold text-[#f5c542] uppercase tracking-wider">Latest Season</span>
                  <span className="text-[10px] text-[#8b96ad] font-medium">Active Champion Era</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Champions & Runners-up History (Timeline & All-Time Summary) */}
      <section className="comp-history-section">
        {/* Section Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 sm:mt-8 mb-4">
          <div className="comp-history-title-area">
            <div className="comp-history-eyebrow">
              <Trophy size={14} style={{ color: "var(--gold)" }} />
              <span>Finals &amp; Honours Archive</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold uppercase tracking-wide text-white">Winners &amp; Runners-up</h2>
            <p className="text-xs sm:text-sm text-[#8b96ad] mt-1">
              {historyView === "timeline"
                ? "Chronological timeline of championship finals and runners-up"
                : "All-time leaderboard of tournament titles and final appearances"}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
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
          </div>
        </div>

        {/* Quick Snapshot Highlight Strip (Clean & Redesigned) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-3 mb-5">
          {/* Card 1: Most Successful Club */}
          <div className="bg-[#101726]/85 backdrop-blur border border-[#232c40] rounded-2xl p-4 flex items-center gap-3.5 hover:border-amber-500/40 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg flex-shrink-0">
              👑
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-extrabold text-[#8b96ad] uppercase tracking-wider">
                Most Successful Club
              </span>
              {mostSuccessfulTeam ? (
                <div className="flex items-center gap-2.5 mt-1 min-w-0">
                  <Logo
                    url={mostSuccessfulTeam.team?.imageUrl}
                    label={mostSuccessfulTeam.team?.name}
                    short={mostSuccessfulTeam.team?.short}
                    color={mostSuccessfulTeam.team?.color}
                    size="xs"
                  />
                  <div className="min-w-0">
                    <Link
                      to={`/team/${mostSuccessfulTeam.team?._id}`}
                      className="block text-sm font-extrabold text-white hover:text-[#00e39b] truncate transition-colors"
                    >
                      {mostSuccessfulTeam.team?.name}
                    </Link>
                    <span className="block text-xs font-semibold text-[#f5c542] mt-0.5">
                      {mostSuccessfulTeam.wins.length} {mostSuccessfulTeam.wins.length === 1 ? "Title" : "Titles"}
                      {mostSuccessfulTeam.runnerUps.length > 0 && (
                        <span className="text-[#8b96ad]"> · {mostSuccessfulTeam.runnerUps.length} RU</span>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[#8b96ad] italic mt-1 block">No champions recorded</span>
              )}
            </div>
          </div>

          {/* Card 2: Reigning Champion (Without runner-up of last season) */}
          <div className="bg-[#101726]/85 backdrop-blur border border-[#232c40] rounded-2xl p-4 flex items-center gap-3.5 hover:border-emerald-500/40 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg flex-shrink-0">
              🏆
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-extrabold text-[#8b96ad] uppercase tracking-wider">
                Reigning Champion ({reigningEdition?.season || reigningEdition?.year || "—"})
              </span>
              {reigningWinner ? (
                <div className="flex items-center gap-2.5 mt-1 min-w-0">
                  <Logo
                    url={reigningWinner.imageUrl}
                    label={reigningWinner.name}
                    short={reigningWinner.short}
                    color={reigningWinner.color}
                    size="xs"
                  />
                  <div className="min-w-0">
                    <Link
                      to={`/team/${reigningWinner._id}`}
                      className="block text-sm font-extrabold text-white hover:text-[#00e39b] truncate transition-colors"
                    >
                      {reigningWinner.name}
                    </Link>
                    <span className="block text-xs font-semibold text-[#00e39b] mt-0.5">
                      {reigningEdition?.shared ? "Joint Champions" : "Defending Champions"}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[#8b96ad] italic mt-1 block">No champion data</span>
              )}
            </div>
          </div>

          {/* Card 3: Editions & Finalists KPIs */}
          <div className="bg-[#101726]/85 backdrop-blur border border-[#232c40] rounded-2xl p-4 flex items-center justify-around shadow-md hover:border-[#33415e] transition-all">
            <div className="text-center">
              <span className="block font-display font-extrabold text-2xl text-white leading-none">
                {compEditions.length}
              </span>
              <span className="text-[10px] font-bold text-[#8b96ad] uppercase tracking-wider mt-1 block">
                Editions Played
              </span>
            </div>
            <div className="w-px h-8 bg-[#232c40]" />
            <div className="text-center">
              <span className="block font-display font-extrabold text-2xl text-white leading-none">
                {finalistCount}
              </span>
              <span className="text-[10px] font-bold text-[#8b96ad] uppercase tracking-wider mt-1 block">
                Unique Finalists
              </span>
            </div>
          </div>
        </div>

        {/* Content Body: Timeline View */}
        {historyView === "timeline" && (
          <div className="comp-timeline-container">
            {timelineEditions.length === 0 ? (
              <div className="comp-empty-history">
                <Calendar size={28} style={{ opacity: 0.4, marginBottom: "6px" }} />
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
                          <span className="comp-node-badge">
                            {edition.season || edition.year}
                          </span>
                        </div>

                        {/* Matchup Card - Compact */}
                        <div className="comp-timeline-card">
                          {isShared && (
                            <div className="comp-card-shared-banner">
                              🤝 Joint Champions
                            </div>
                          )}

                          {/* Winner Row */}
                          {win ? (
                            <Link
                              to={`/team/${win._id}`}
                              className="comp-timeline-row winner"
                              title={`Winner: ${win.name}`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="comp-row-medal">🏆</span>
                                <Logo
                                  url={win.imageUrl}
                                  label={win.name}
                                  short={win.short}
                                  color={win.color}
                                  size="xs"
                                />
                                <span className="comp-team-label-name">
                                  {win.name}
                                </span>
                              </div>
                              <span className="comp-row-role-tag gold">W</span>
                            </Link>
                          ) : (
                            <div className="comp-timeline-row empty">
                              <span className="comp-row-medal">🏆</span>
                              <span className="comp-empty-txt">Winner not set</span>
                            </div>
                          )}

                          <div className="comp-timeline-divider" />

                          {/* Runner-up Row */}
                          {ru ? (
                            <Link
                              to={`/team/${ru._id}`}
                              className={`comp-timeline-row ${isShared ? "winner shared" : "runner"}`}
                              title={isShared ? `Joint Champion: ${ru.name}` : `Runner-up: ${ru.name}`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="comp-row-medal">
                                  {isShared ? "🏆" : "🥈"}
                                </span>
                                <Logo
                                  url={ru.imageUrl}
                                  label={ru.name}
                                  short={ru.short}
                                  color={ru.color}
                                  size="xs"
                                />
                                <span className="comp-team-label-name sub">
                                  {ru.name}
                                </span>
                              </div>
                              <span className={`comp-row-role-tag ${isShared ? "gold" : "silver"}`}>
                                {isShared ? "W" : "RU"}
                              </span>
                            </Link>
                          ) : (
                            <div className="comp-timeline-row empty">
                              <span className="comp-row-medal">🥈</span>
                              <span className="comp-empty-txt">Runner-up not set</span>
                            </div>
                          )}
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
                <Crown size={28} style={{ opacity: 0.4, marginBottom: "6px" }} />
                <p>No tournament honours recorded yet.</p>
              </div>
            ) : (
              <div className="comp-summary-table-wrap">
                <table className="comp-summary-table">
                  <thead>
                    <tr>
                      <th style={{ width: "54px", textAlign: "center", padding: "12px 14px" }}>#</th>
                      <th style={{ minWidth: "220px", padding: "12px 16px" }}>Club / National Team</th>
                      <th style={{ textAlign: "center", width: "95px", padding: "12px 14px" }}>
                        <span className="tbl-header-badge gold">🏆 Titles</span>
                      </th>
                      <th style={{ textAlign: "center", width: "95px", padding: "12px 14px" }}>
                        <span className="tbl-header-badge silver">🥈 RU</span>
                      </th>
                      <th style={{ textAlign: "center", width: "75px", padding: "12px 14px" }}>Finals</th>
                      <th style={{ minWidth: "260px", padding: "12px 18px" }}>Winning Seasons</th>
                      <th style={{ minWidth: "220px", padding: "12px 18px" }} className="hidden sm:table-cell">Runner-up Seasons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryLeaderboard.map((item, idx) => {
                      const totalFinals = item.wins.length + item.runnerUps.length;
                      const isTop1 = idx === 0 && item.wins.length > 0;
                      const isTop2 = idx === 1 && item.wins.length > 0;
                      const isTop3 = idx === 2 && item.wins.length > 0;
                      const location = formatLocation(item.team.city, item.team.country);

                      return (
                        <tr
                          key={item.team._id || idx}
                          className={isTop1 ? "row-leader" : ""}
                        >
                          <td style={{ textAlign: "center", padding: "14px 12px" }}>
                            <span className="rank-badge">
                              {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `#${idx + 1}`}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
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
                                {location && (
                                  <span className="comp-tbl-team-sub">
                                    {location}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </td>
                          <td style={{ textAlign: "center", padding: "14px 12px" }}>
                            {item.wins.length > 0 ? (
                              <span className="count-pill gold highlight">
                                {item.wins.length}
                              </span>
                            ) : (
                              <span className="count-pill zero">—</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center", padding: "14px 12px" }}>
                            {item.runnerUps.length > 0 ? (
                              <span className="count-pill silver highlight">
                                {item.runnerUps.length}
                              </span>
                            ) : (
                              <span className="count-pill zero">—</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center", padding: "14px 12px" }}>
                            <span className="count-pill finals">
                              {totalFinals}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            {item.wins.length > 0 ? (
                              <div className="season-pills-list">
                                {item.wins.map((w, wIdx) => (
                                  <span key={wIdx} className="season-pill win">
                                    {w.year}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#64748b] text-xs font-mono">—</span>
                            )}
                          </td>
                          <td style={{ padding: "14px 18px" }} className="hidden sm:table-cell">
                            {item.runnerUps.length > 0 ? (
                              <div className="season-pills-list">
                                {item.runnerUps.map((ru, ruIdx) => (
                                  <span key={ruIdx} className="season-pill ru">
                                    {ru.year}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#64748b] text-xs font-mono">—</span>
                            )}
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
                          className="btn-icon edit"
                          title="Edit edition"
                          onClick={() => openEditEditionModal(edition)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon del"
                          title="Delete edition"
                          onClick={() => openDeleteConfirmModal(edition)}
                        >
                          <Trash2 size={15} />
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
