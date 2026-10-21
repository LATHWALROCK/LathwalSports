import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSports } from "../../context/SportsContext";
import { apiConnector } from "../../services/apiConnector";
import { leagueEndpoints } from "../../services/apis";
import { fileToDataUrl, startYear, endYear } from "../../utils/helpers";
import Logo from "../Logo";
import { X, Upload, Plus } from "lucide-react";

export default function AddEditionModal() {
  const {
    editionModal,
    closeEditionModal,
    openCreateSportModal,
    openCreateTournamentModal,
    openCreateTeamModal,
    sports,
    tournaments,
    teams,
    fetchEverything,
  } = useSports();

  const isEditing = !!editionModal.editingEdition;

  const [sport, setSport] = useState("");
  const [tournament, setTournament] = useState("");
  const [season, setSeason] = useState("");
  const [winnerId, setWinnerId] = useState("");
  const [runnerUpId, setRunnerUpId] = useState("");
  const [participants, setParticipants] = useState([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [shared, setShared] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (editionModal.isOpen) {
      if (editionModal.editingEdition) {
        const e = editionModal.editingEdition;
        setSport(e.sport?._id || e.sport || "");
        setTournament(e.tournament?._id || e.tournament || "");
        setSeason(e.season || (e.year ? String(e.year) : ""));
        const winPos = e.teams?.find((t) => t.position === 1);
        const ruPos = e.teams?.find((t) => t.position === 2);
        const winTeamId = winPos?.team?._id || winPos?.team || "";
        const ruTeamId = ruPos?.team?._id || ruPos?.team || "";
        setWinnerId(winTeamId);
        setRunnerUpId(ruTeamId);

        // Extract other participants (teams other than winner and runner-up)
        const otherTeams = (e.teams || [])
          .filter((t) => {
            const tid = t.team?._id || t.team;
            return tid !== winTeamId && tid !== ruTeamId;
          })
          .map((t) => ({
            teamId: t.team?._id || t.team,
          }));
        setParticipants(otherTeams);
        setSelectedParticipantId("");
        setShared(!!e.shared);
        setPreview(e.leagueImageUrl || null);
        setImageFile(null);
      } else {
        // Start completely blank - no preselected items
        setSport(editionModal.defaultSportId || "");
        setTournament(editionModal.defaultTournamentId || "");
        setSeason("");
        setWinnerId("");
        setRunnerUpId("");
        setParticipants([]);
        setSelectedParticipantId("");
        setShared(false);
        setImageFile(null);
        setPreview(null);
      }
    }
  }, [editionModal.isOpen, editionModal.editingEdition, editionModal.defaultSportId, editionModal.defaultTournamentId]);

  // When sport changes, check if tournament belongs to it
  useEffect(() => {
    if (sport && tournament) {
      const tour = tournaments.find((t) => t._id === tournament);
      if (tour && (tour.sport?._id || tour.sport) !== sport) {
        setTournament("");
        setWinnerId("");
        setRunnerUpId("");
        setParticipants([]);
        setSelectedParticipantId("");
      }
    }
  }, [sport, tournament, tournaments]);

  if (!editionModal.isOpen) return null;

  // 1. Tournaments for ONLY the selected sport (empty if no sport selected)
  const filteredTournaments = sport
    ? tournaments.filter((t) => (t.sport?._id || t.sport) === sport)
    : [];

  // 2. Selected competition / tournament details
  const selectedTour = tournaments.find((t) => t._id === tournament);
  const isClubTournament = selectedTour?.type === "League";

  // 3. Teams filter:
  // - For club tournaments: show teams for selected tournament only
  // - For international tournaments: show all national teams for the selected sport
  // - Empty if no tournament is selected
  const filteredTeams = tournament
    ? teams.filter((tm) => {
        // Ensure team belongs to selected sport
        if (sport && (tm.sport?._id || tm.sport) !== sport) return false;

        if (isClubTournament) {
          // Club: show teams for selected tournament only
          return (tm.tournament?._id || tm.tournament) === tournament;
        } else {
          // International / National: show all national teams for the selected sport
          return tm.type === "National";
        }
      })
    : [];

  // Ensure any team already assigned in an existing edition being edited is preserved
  const allAvailableTeams = [...filteredTeams];
  if (editionModal.editingEdition) {
    [winnerId, runnerUpId, ...participants.map((p) => p.teamId)].forEach((tid) => {
      if (tid && !allAvailableTeams.some((t) => t._id === tid)) {
        const found = teams.find((t) => t._id === tid);
        if (found) allAvailableTeams.push(found);
      }
    });
  }

  const participantIds = new Set(participants.map((p) => p.teamId));
  const availableParticipantTeams = allAvailableTeams.filter(
    (tm) =>
      tm._id !== winnerId &&
      tm._id !== runnerUpId &&
      !participantIds.has(tm._id)
  );

  const handleWinnerChange = (id) => {
    setWinnerId(id);
    if (id) {
      setParticipants((prev) => prev.filter((p) => p.teamId !== id));
      if (runnerUpId === id) setRunnerUpId("");
    }
  };

  const handleRunnerUpChange = (id) => {
    setRunnerUpId(id);
    if (id) {
      setParticipants((prev) => prev.filter((p) => p.teamId !== id));
      if (winnerId === id) setWinnerId("");
    }
  };

  const handleAddParticipant = () => {
    if (!selectedParticipantId) return;
    setParticipants((prev) => [
      ...prev,
      { teamId: selectedParticipantId },
    ]);
    setSelectedParticipantId("");
  };

  const handleRemoveParticipant = (indexToRemove) => {
    setParticipants((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = await fileToDataUrl(file);
      setPreview(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sport) {
      toast.error("Please select or create a sport");
      return;
    }
    if (!tournament) {
      toast.error("Please select or create a competition");
      return;
    }
    if (!season.trim()) {
      toast.error("Please enter edition season/year");
      return;
    }
    if (!winnerId) {
      toast.error("Please select or create the Winner / Champion team");
      return;
    }

    const selectedTourObj = tournaments.find((t) => t._id === tournament);
    const tourName = selectedTourObj?.name || "Competition";
    const leagueName = `${season} ${tourName}`;
    const parsedYear = endYear(season) || startYear(season) || parseInt(season, 10) || new Date().getFullYear();

    setSubmitting(true);
    const toastId = toast.loading(isEditing ? "Updating edition..." : "Adding edition...");

    try {
      const formData = new FormData();
      if (isEditing) {
        formData.append("_id", editionModal.editingEdition._id);
      }
      formData.append("name", leagueName);
      formData.append("year", String(parsedYear));
      formData.append("season", season.trim());
      formData.append("sport", sport);
      formData.append("tournament", tournament);
      formData.append("shared", String(shared));

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (preview && isEditing) {
        formData.append("leagueImageUrl", preview);
      } else if (selectedTourObj?.imageUrl) {
        formData.append("leagueImageUrl", selectedTourObj.imageUrl);
      }

      let teamIndex = 0;

      // 1. Add winner at position 1
      formData.append(`teams[${teamIndex}][team]`, winnerId);
      formData.append(`teams[${teamIndex}][position]`, "1");
      teamIndex++;

      // 2. Add runner-up at position 2 if selected
      if (runnerUpId) {
        formData.append(`teams[${teamIndex}][team]`, runnerUpId);
        formData.append(`teams[${teamIndex}][position]`, "2");
        teamIndex++;
      }

      // 3. Add other participants (no position required)
      participants.forEach((p) => {
        if (p.teamId) {
          formData.append(`teams[${teamIndex}][team]`, p.teamId);
          teamIndex++;
        }
      });

      const endpoint = isEditing ? leagueEndpoints.UPDATE_LEAGUE : leagueEndpoints.CREATE_LEAGUE;
      const method = isEditing ? "PUT" : "POST";

      const res = await apiConnector(method, endpoint, formData, {
        "Content-Type": "multipart/form-data",
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to save edition");
      }

      toast.success(isEditing ? "Edition updated!" : `Edition "${season} ${tourName}" published!`, {
        id: toastId,
      });

      await fetchEverything();
      closeEditionModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to save edition", {
        id: toastId,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeEditionModal}>
      <div className="modal-dialog lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <span>🏆</span> {isEditing ? "Edit Edition" : "Add New Edition"}
          </h3>
          <button className="modal-close" onClick={closeEditionModal} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* 1. SPORT (Select Existing OR Create New via Modal) */}
            <div className="form-group">
              <label>Sport *</label>
              <div className="ref-select-row">
                <select
                  className="form-control"
                  value={sport}
                  onChange={(e) => {
                    setSport(e.target.value);
                    setTournament("");
                    setWinnerId("");
                    setRunnerUpId("");
                    setParticipants([]);
                  }}
                  required
                >
                  <option value="">
                    {sports.length === 0 ? "-- No sports yet (Click '+ Create Sport') --" : "-- Select Sport --"}
                  </option>
                  {sports.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-ref-create"
                  onClick={() =>
                    openCreateSportModal((newSport) => {
                      setSport(newSport._id);
                    })
                  }
                >
                  <Plus size={16} /> Create Sport
                </button>
              </div>
            </div>

            {/* 2. TOURNAMENT / COMPETITION (Select Existing OR Create New via Modal) */}
            <div className="form-group">
              <label>Competition / Tournament *</label>
              <div className="ref-select-row">
                <select
                  className="form-control"
                  value={tournament}
                  disabled={!sport}
                  onChange={(e) => {
                    const tid = e.target.value;
                    setTournament(tid);
                    setWinnerId("");
                    setRunnerUpId("");
                    setParticipants([]);
                    setSelectedParticipantId("");
                  }}
                  required
                >
                  <option value="">
                    {!sport
                      ? "-- Select Sport First --"
                      : filteredTournaments.length === 0
                      ? "-- No competitions for this sport yet --"
                      : "-- Select Competition --"}
                  </option>
                  {filteredTournaments.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.type === "League" ? "Club" : "International"})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-ref-create"
                  onClick={() =>
                    openCreateTournamentModal({
                      sportId: sport,
                      callback: (newTour) => {
                        setTournament(newTour._id);
                        if (!sport) setSport(newTour.sport?._id || newTour.sport);
                      },
                    })
                  }
                >
                  <Plus size={16} /> Create Competition
                </button>
              </div>
            </div>

            {/* 3. SEASON / EDITION YEAR */}
            <div className="form-group">
              <label htmlFor="edition-season">Season / Edition Year *</label>
              <input
                id="edition-season"
                className="form-control"
                type="text"
                placeholder="e.g. 2026 or 2025–26"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                required
              />
            </div>

            {/* 4. WINNER TEAM (Select Existing OR Create New via Modal) */}
            <div className="form-group">
              <label style={{ color: "var(--gold)" }}>🏆 Champions / Winner Team *</label>
              <div className="ref-select-row">
                <select
                  className="form-control"
                  value={winnerId}
                  disabled={!tournament}
                  onChange={(e) => handleWinnerChange(e.target.value)}
                  required
                >
                  <option value="">
                    {!tournament
                      ? "-- Select Competition First --"
                      : allAvailableTeams.length === 0
                      ? isClubTournament
                        ? "-- No club teams for this competition yet --"
                        : "-- No national teams for this sport yet --"
                      : "-- Select Winner Team --"}
                  </option>
                  {allAvailableTeams.map((tm) => (
                    <option key={tm._id} value={tm._id}>
                      {tm.name} {tm.isCurrent ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-ref-create"
                  onClick={() =>
                    openCreateTeamModal({
                      role: "winner",
                      sportId: sport,
                      tournamentId: tournament,
                      callback: (newTeam) => {
                        handleWinnerChange(newTeam._id);
                      },
                    })
                  }
                >
                  <Plus size={16} /> Create Team
                </button>
              </div>
            </div>

            {/* 5. RUNNER-UP TEAM (Select Existing OR Create New via Modal) */}
            <div className="form-group">
              <label style={{ color: "var(--silver)" }}>🥈 Runner-up Team (Optional)</label>
              <div className="ref-select-row">
                <select
                  className="form-control"
                  value={runnerUpId}
                  disabled={!tournament}
                  onChange={(e) => handleRunnerUpChange(e.target.value)}
                >
                  <option value="">
                    {!tournament
                      ? "-- Select Competition First --"
                      : "-- None / Not Awarded --"}
                  </option>
                  {allAvailableTeams.map((tm) => (
                    <option key={tm._id} value={tm._id}>
                      {tm.name} {tm.isCurrent ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-ref-create"
                  onClick={() =>
                    openCreateTeamModal({
                      role: "runnerUp",
                      sportId: sport,
                      tournamentId: tournament,
                      callback: (newTeam) => {
                        handleRunnerUpChange(newTeam._id);
                      },
                    })
                  }
                >
                  <Plus size={16} /> Create Team
                </button>
              </div>
            </div>

            {/* 6. OTHER PARTICIPATING TEAMS */}
            <div className="form-group">
              <label style={{ color: "var(--accent)" }}>
                👥 Other Participants ({participants.length})
              </label>
              <div className="ref-select-row">
                <select
                  className="form-control"
                  value={selectedParticipantId}
                  disabled={!tournament}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                >
                  <option value="">
                    {!tournament
                      ? "-- Select Competition First --"
                      : availableParticipantTeams.length === 0
                      ? "-- No more teams to add --"
                      : "-- Select Participant Team to Add --"}
                  </option>
                  {availableParticipantTeams.map((tm) => (
                    <option key={tm._id} value={tm._id}>
                      {tm.name} {tm.isCurrent ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn primary"
                  style={{ height: "44px", padding: "0 18px", whiteSpace: "nowrap" }}
                  onClick={handleAddParticipant}
                  disabled={!selectedParticipantId || !tournament}
                >
                  <Plus size={16} /> Add
                </button>
                <button
                  type="button"
                  className="btn-ref-create"
                  onClick={() =>
                    openCreateTeamModal({
                      role: "participant",
                      sportId: sport,
                      tournamentId: tournament,
                      callback: (newTeam) => {
                        setParticipants((prev) => [
                          ...prev,
                          { teamId: newTeam._id },
                        ]);
                      },
                    })
                  }
                >
                  <Plus size={16} /> Create Team
                </button>
              </div>

              {/* Added Participants List */}
              {participants.length > 0 && (
                <div className="participants-list">
                  {participants.map((p, idx) => {
                    const tmDoc = teams.find((t) => t._id === p.teamId);
                    return (
                      <div key={p.teamId || idx} className="participant-item">
                        <Logo
                          url={tmDoc?.imageUrl}
                          label={tmDoc?.name}
                          short={tmDoc?.short}
                          color={tmDoc?.color}
                          size="xs"
                        />
                        <span className="participant-name">
                          {tmDoc?.name || "Team"}
                        </span>
                        <button
                          type="button"
                          className="btn-remove-participant"
                          onClick={() => handleRemoveParticipant(idx)}
                          title="Remove participant"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6. EDITION LOGO / POSTER */}
            <div className="form-group">
              <label>Edition Specific Emblem / Poster</label>
              <label className="image-dropzone">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                {preview ? (
                  <div className="dropzone-preview">
                    <img src={preview} alt="Edition logo preview" />
                    <div className="preview-info">
                      <b>{imageFile?.name || "Poster / Emblem selected"}</b>
                      <small>Click to change file</small>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-img"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImageFile(null);
                        setPreview(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={28} color="var(--football)" />
                    <div>
                      <b style={{ color: "var(--text)" }}>Click or drop edition poster / logo</b>
                      <small style={{ display: "block", color: "var(--muted)", marginTop: "4px" }}>
                        PNG, SVG, JPG or WebP
                      </small>
                    </div>
                  </>
                )}
              </label>
            </div>

            {/* 7. SHARED OPTION */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={shared}
                  onChange={(e) => setShared(e.target.checked)}
                />
                <span>Shared Trophy</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn ghost"
              onClick={closeEditionModal}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn gold" disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Save Changes" : "Publish Edition"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
