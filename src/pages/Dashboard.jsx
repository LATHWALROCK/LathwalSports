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
    <div className="space-y-8 sm:space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-[#0f1a2b] via-[#0b1220] to-[#1a1408] border border-[#232c40]">
        <div className="relative z-10">
          <div className="text-xs font-bold uppercase tracking-widest text-[#8b96ad]">
            Champions · Crests · Trophies · Records
          </div>
          <h1 className="mt-2.5 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-wide leading-none text-white">
            Every champion.<br />
            <span className="bg-gradient-to-r from-[#00e39b] via-[#39c7ff] to-[#ffb21e] bg-clip-text text-transparent">
              Every crest.
            </span>
          </h1>
          <p className="text-[#8b96ad] text-sm sm:text-base max-w-lg mt-3.5 leading-relaxed">
            The comprehensive roll of honour and crest history across world championships, tournaments, and leagues.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-6 sm:mt-8 max-w-2xl relative z-10">
          <div className="bg-[#121826]/80 backdrop-blur border border-[#232c40] rounded-xl sm:rounded-2xl p-3.5 sm:p-4">
            <b className="block font-display text-2xl sm:text-3xl lg:text-4xl leading-none text-white">{sports.length}</b>
            <span className="text-[11px] sm:text-xs text-[#8b96ad] font-semibold uppercase tracking-wider mt-1 block">Sports</span>
          </div>
          <Link
            to="/tournaments"
            className="bg-[#121826]/80 backdrop-blur border border-[#232c40] hover:border-[#36425e] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 transition-all hover:-translate-y-0.5 group"
            title="Explore all competitions directory"
          >
            <b className="block font-display text-2xl sm:text-3xl lg:text-4xl leading-none text-white group-hover:text-[#00e39b] transition-colors">{tournaments.length}</b>
            <span className="text-[11px] sm:text-xs text-[#8b96ad] font-semibold uppercase tracking-wider mt-1 block">Competitions →</span>
          </Link>
          <div className="bg-[#121826]/80 backdrop-blur border border-[#232c40] rounded-xl sm:rounded-2xl p-3.5 sm:p-4">
            <b className="block font-display text-2xl sm:text-3xl lg:text-4xl leading-none text-white">{leagues.length}</b>
            <span className="text-[11px] sm:text-xs text-[#8b96ad] font-semibold uppercase tracking-wider mt-1 block">Editions</span>
          </div>
          <Link
            to="/teams"
            className="bg-[#121826]/80 backdrop-blur border border-[#232c40] hover:border-[#36425e] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 transition-all hover:-translate-y-0.5 group"
            title="Explore all teams directory"
          >
            <b className="block font-display text-2xl sm:text-3xl lg:text-4xl leading-none text-white group-hover:text-[#ffb21e] transition-colors">{teams.length}</b>
            <span className="text-[11px] sm:text-xs text-[#8b96ad] font-semibold uppercase tracking-wider mt-1 block">Teams →</span>
          </Link>
        </div>

        {heroCrests.length > 0 && (
          <div className="hidden xl:grid absolute -right-6 top-1/2 -translate-y-1/2 rotate-[-8deg] grid-cols-4 gap-3.5 opacity-80 pointer-events-none">
            {heroCrests}
          </div>
        )}
      </section>

      {/* Recently Crowned Ticker */}
      {tickerItems.length > 0 && (
        <div className="mt-8 sm:mt-12">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold uppercase tracking-wide flex items-center gap-2.5 text-white">
                <span className="w-1.5 h-6 rounded-full bg-[#00e39b]" />
                Recently Crowned
              </h2>
              <p className="text-xs sm:text-sm text-[#8b96ad] mt-1 ml-4">Latest champions across competitions</p>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {tickerItems.map((l) => {
              const tour = l.tournament;
              const winPos = l.teams?.find((t) => t.position === 1);
              const winTeam = winPos?.team;
              if (!tour) return null;

              return (
                <Link
                  key={l._id}
                  className="flex-shrink-0 w-60 sm:w-64 snap-start p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#121826] hover:bg-[#182032] border border-[#232c40] hover:border-[#36425e] transition-all hover:-translate-y-0.5 flex items-center gap-3 group"
                  to={`/competition/${tour._id}`}
                >
                  <Logo
                    url={winTeam?.imageUrl}
                    label={winTeam?.name || "Winner"}
                    short={winTeam?.short}
                    color={winTeam?.color || "#334155"}
                    size="md"
                  />
                  <div className="min-w-0">
                    <b className="block text-sm sm:text-base font-bold text-white truncate group-hover:text-[#00e39b] transition-colors">
                      {winTeam?.name || "Champion"}
                    </b>
                    <small className="text-xs text-[#8b96ad] flex items-center gap-1.5 mt-0.5 truncate">
                      <Logo url={tour.imageUrl} label={tour.name} size="xs" />
                      <span className="truncate">{tour.name} · {l.season || l.year}</span>
                    </small>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#0d111b] border border-[#232c40] mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5d6880] mr-1">Sport:</span>
          <button
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all border ${
              selectedSport === "all"
                ? "bg-white text-[#07090f] border-white font-bold"
                : "bg-[#121826] text-[#8b96ad] border-[#232c40] hover:text-white hover:border-[#36425e]"
            }`}
            onClick={() => setSelectedSport("all")}
          >
            All Sports
          </button>
          {sports.map((s) => (
            <button
              key={s._id}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all border ${
                selectedSport === s._id
                  ? "bg-[#00e39b] text-[#07090f] border-[#00e39b] font-bold"
                  : "bg-[#121826] text-[#8b96ad] border-[#232c40] hover:text-white hover:border-[#36425e]"
              }`}
              onClick={() => setSelectedSport(s._id)}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5d6880] mr-1">Type:</span>
          <button
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all border ${
              selectedKind === "all"
                ? "bg-white text-[#07090f] border-white font-bold"
                : "bg-[#121826] text-[#8b96ad] border-[#232c40] hover:text-white hover:border-[#36425e]"
            }`}
            onClick={() => setSelectedKind("all")}
          >
            All
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all border ${
              selectedKind === "tournament"
                ? "bg-[#00e39b] text-[#07090f] border-[#00e39b] font-bold"
                : "bg-[#121826] text-[#8b96ad] border-[#232c40] hover:text-white hover:border-[#36425e]"
            }`}
            onClick={() => setSelectedKind("tournament")}
          >
            Tournaments
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all border ${
              selectedKind === "league"
                ? "bg-[#ffb21e] text-[#07090f] border-[#ffb21e] font-bold"
                : "bg-[#121826] text-[#8b96ad] border-[#232c40] hover:text-white hover:border-[#36425e]"
            }`}
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
            <div className="mt-8 sm:mt-12" key={groupName}>
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold uppercase tracking-wide flex items-center gap-2.5 text-white">
                    <span className="w-1.5 h-6 rounded-full bg-[#00e39b]" />
                    {groupName}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8b96ad] mt-1 ml-4">
                    {groupTournaments.length} competition{groupTournaments.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                    <Link
                      key={c._id}
                      className="group relative rounded-2xl p-4 sm:p-5 bg-gradient-to-b from-[#121826] to-[#0d111b] border border-[#232c40] hover:border-[#36425e] hover:-translate-y-1 transition-all flex flex-col justify-between gap-4 overflow-hidden"
                      to={`/competition/${c._id}`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Logo
                          url={c.imageUrl}
                          label={c.name}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-display font-bold uppercase tracking-wide text-white truncate group-hover:text-[#00e39b] transition-colors">
                            {c.name}
                          </h3>
                          <small className="text-xs text-[#8b96ad] block truncate mt-0.5">
                            {c.sport?.name || "Sport"} · {c.type === "League" ? "Club / League" : "International"}
                          </small>
                        </div>
                      </div>

                      {latestEdition && winner ? (
                        <div
                          className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-[#232c40] bg-[#182032]/80 backdrop-blur"
                        >
                          <Logo
                            url={winner.imageUrl}
                            label={winner.name}
                            short={winner.short}
                            color={winner.color}
                            size="lg"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-[#f5c542] truncate">
                              🏆 Champions {latestEdition.season || latestEdition.year}
                            </div>
                            <b className="block text-base sm:text-lg font-display uppercase font-bold text-white truncate leading-tight mt-0.5">
                              {winner.name}
                            </b>
                            <small className="text-xs text-[#8b96ad] block truncate mt-0.5">
                              {tourEditions.length} edition{tourEditions.length === 1 ? "" : "s"} tracked
                            </small>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-[#232c40] bg-[#182032]/40 opacity-70">
                          <Trophy size={36} className="text-[#5d6880] flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8b96ad]">
                              Roll of Honour
                            </div>
                            <b className="block text-sm sm:text-base font-display uppercase font-bold text-white">
                              No editions yet
                            </b>
                            <small className="text-xs text-[#8b96ad] block">
                              Add an edition to crown a champion
                            </small>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-[#8b96ad] pt-2 border-t border-[#232c40]/60">
                        <div className="flex items-center gap-1.5 truncate">
                          {runnerUp && (
                            <>
                              <Logo
                                url={runnerUp.imageUrl}
                                label={runnerUp.name}
                                short={runnerUp.short}
                                color={runnerUp.color}
                                size="xs"
                              />
                              <span className="truncate">
                                {latestEdition?.shared ? "Winner: " : "Runner-up: "}
                                {runnerUp.name}
                              </span>
                            </>
                          )}
                          {!runnerUp && <span>{tourEditions.length} editions</span>}
                        </div>
                        <span className="flex items-center gap-1 text-[#00e39b] font-semibold whitespace-nowrap ml-2">
                          All winners <ChevronRight size={14} />
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
        <div className="text-center py-12 sm:py-16 px-4 bg-[#121826]/40 rounded-2xl border border-[#232c40]">
          <h3 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-wide text-white">No competitions found</h3>
          <p className="text-sm text-[#8b96ad] max-w-md mx-auto my-3">
            {sports.length === 0
              ? "Start by adding your first edition. The edition modal will guide you to create the sport, competition, and teams!"
              : "No competitions match the selected filter."}
          </p>
          {isAdmin ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#f5c542] to-[#ff9f1c] text-[#07090f] font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all cursor-pointer mt-2"
              onClick={() => openAddEditionModal()}
            >
              <Plus size={18} />
              Add First Edition
            </button>
          ) : (
            <p className="text-sm text-[#f5c542] font-semibold mt-2">
              💡 Switch to Admin View in the top bar to add sports, competitions, teams, and editions!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
