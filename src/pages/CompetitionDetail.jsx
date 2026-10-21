import React from "react";
import { useParams, Link } from "react-router-dom";
import { useSports } from "../context/SportsContext";
import Logo from "../components/Logo";
import { Plus, Edit2, Trash2, Trophy } from "lucide-react";

export default function CompetitionDetail() {
  const { id } = useParams();
  const {
    tournaments,
    leagues,
    isAdmin,
    openAddEditionModal,
    openEditEditionModal,
    openDeleteConfirmModal,
  } = useSports();

  const tournament = tournaments.find((t) => t._id === id);

  // Filter editions for this tournament, newest first
  const compEditions = leagues
    .filter((l) => (l.tournament?._id || l.tournament) === id)
    .sort((a, b) => (b.year || 0) - (a.year || 0));

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
  const reigningWinner = reigningWinnerPos?.team;
  const reigningRunnerUp = reigningRuPos?.team;

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

      {/* Reigning Champion Banner */}
      {reigningEdition && reigningWinner && (
        <section
          className="reign"
          style={{
            "--c1": reigningWinner.color || "#121826",
            "--c2": reigningRunnerUp?.color || "#182032",
          }}
        >
          <div className="side">
            <Logo
              url={reigningWinner.imageUrl}
              label={reigningWinner.name}
              short={reigningWinner.short}
              color={reigningWinner.color}
              size="xl"
            />
            <div>
              <div className="eyebrow" style={{ color: "var(--gold)" }}>
                Reigning Champion
              </div>
              <b className="tm-name">
                <Link to={`/team/${reigningWinner._id}`}>
                  {reigningWinner.name}
                </Link>
              </b>
            </div>
          </div>

          <div className="mid">
            <div className="trophy">🏆</div>
            <div className="yr">{reigningEdition.season || reigningEdition.year}</div>
          </div>

          <div className="side r">
            <div>
              <div
                className="eyebrow"
                style={reigningEdition.shared ? { color: "var(--gold)" } : undefined}
              >
                {reigningEdition.shared ? "Reigning Champion" : "Runner-up"}
              </div>
              <b className="tm-name">
                {reigningRunnerUp ? (
                  <Link to={`/team/${reigningRunnerUp._id}`}>
                    {reigningRunnerUp.name}
                  </Link>
                ) : (
                  "—"
                )}
              </b>
            </div>
            {reigningRunnerUp && (
              <Logo
                url={reigningRunnerUp.imageUrl}
                label={reigningRunnerUp.name}
                short={reigningRunnerUp.short}
                color={reigningRunnerUp.color}
                size="xl"
              />
            )}
          </div>
        </section>
      )}

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
