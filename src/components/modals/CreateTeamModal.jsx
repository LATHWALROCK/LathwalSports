import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSports } from "../../context/SportsContext";
import { apiConnector } from "../../services/apiConnector";
import { teamEndpoints } from "../../services/apis";
import { fileToDataUrl } from "../../utils/helpers";
import { X, Upload } from "lucide-react";

export default function CreateTeamModal() {
  const {
    teamModal,
    closeCreateTeamModal,
    sports,
    tournaments,
    teams,
    fetchEverything,
  } = useSports();

  const [name, setName] = useState("");
  const [teamIdentifier, setTeamIdentifier] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [sport, setSport] = useState("");
  const [type, setType] = useState(""); // empty initially, no preselection
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [tournament, setTournament] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!teamModal.editingTeam;

  // List of existing unique common identifiers for easy selection / linkage
  const existingIdentifiers = Array.from(
    new Set(teams.map((t) => t.teamIdentifier).filter(Boolean))
  );

  useEffect(() => {
    if (teamModal.isOpen) {
      if (teamModal.editingTeam) {
        const t = teamModal.editingTeam;
        setName(t.name || "");
        setTeamIdentifier(t.teamIdentifier || "");
        setSport(t.sport?._id || t.sport || "");
        setType(t.type || "National");
        setCountry(t.country || "");
        setCity(t.city || "");
        setTournament(t.tournament?._id || t.tournament || "");
        setIsCurrent(t.isCurrent !== undefined ? !!t.isCurrent : true);
        setImageFile(null);
        setPreview(t.imageUrl || null);
      } else {
        setName("");
        setTeamIdentifier("");
        setSport(teamModal.sportId || "");
        const tour = tournaments.find((t) => t._id === teamModal.tournamentId);
        if (tour) {
          setTournament(tour.type === "League" ? tour._id : "");
          setType(tour.type === "League" ? "League" : "National");
        } else {
          setTournament("");
          setType("");
        }
        setCountry("");
        setCity("");
        setImageFile(null);
        setPreview(null);
        setIsCurrent(true);
      }
    }
  }, [teamModal.isOpen, teamModal.editingTeam, teamModal.sportId, teamModal.tournamentId, tournaments]);

  if (!teamModal.isOpen) return null;

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
    if (!name.trim()) {
      toast.error("Please enter team name");
      return;
    }
    if (!sport) {
      toast.error("Please select a sport");
      return;
    }
    if (!type) {
      toast.error("Please select a team type");
      return;
    }
    if (!isEditing && !imageFile) {
      toast.error("Please upload team crest/logo");
      return;
    }
    if (isEditing && !imageFile && !preview) {
      toast.error("Please upload team crest/logo");
      return;
    }

    // Auto-generate identifier if not typed
    const cleanId = teamIdentifier.trim()
      ? teamIdentifier.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    setSubmitting(true);
    const toastId = toast.loading(isEditing ? "Updating team..." : "Saving team record...");

    try {
      const formData = new FormData();
      if (isEditing) {
        formData.append("_id", teamModal.editingTeam._id);
      }
      formData.append("name", name.trim());
      formData.append("teamIdentifier", cleanId);
      formData.append("isCurrent", String(isCurrent));
      formData.append("sport", sport);
      formData.append("type", type);
      if (country) formData.append("country", country.trim());
      if (city) formData.append("city", city.trim());
      if (tournament) formData.append("tournament", tournament);
      if (imageFile) formData.append("image", imageFile);

      const endpoint = isEditing ? teamEndpoints.UPDATE_TEAM : teamEndpoints.CREATE_TEAM;
      const method = isEditing ? "PUT" : "POST";

      const res = await apiConnector(method, endpoint, formData, {
        "Content-Type": "multipart/form-data",
      });

      if (!res.data.success) {
        throw new Error(res.data.message || (isEditing ? "Failed to update team" : "Failed to create team"));
      }

      toast.success(isEditing ? `Team "${name}" updated!` : `Team "${name}" saved!`, { id: toastId });
      await fetchEverything();

      if (teamModal.onSuccessCallback && res.data.team) {
        teamModal.onSuccessCallback(res.data.team, teamModal.role);
      }

      closeCreateTeamModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || (isEditing ? "Team update failed" : "Team creation failed"), {
        id: toastId,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTournaments = tournaments.filter(
    (t) => !sport || (t.sport?._id || t.sport) === sport
  );

  return (
    <div className="modal-overlay sub-modal" onClick={closeCreateTeamModal}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <span>{isEditing ? "✏️" : "🛡️"}</span>{" "}
            {isEditing
              ? `Edit Team (${teamModal.editingTeam?.name || "Era"})`
              : `Create Team Era / Version ${teamModal.role && teamModal.role !== "general" ? `(${teamModal.role === "winner" ? "Winner" : "Runner-up"})` : ""}`}
          </h3>
          <button className="modal-close" onClick={closeCreateTeamModal} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Sport Selector */}
            <div className="form-group">
              <label htmlFor="team-sport">Sport *</label>
              <select
                id="team-sport"
                className="form-control"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                required
              >
                <option value="">-- Select Sport --</option>
                {sports.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Name & Common Identifier */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-group">
                <label htmlFor="team-name">Team Name *</label>
                <input
                  id="team-name"
                  className="form-control"
                  type="text"
                  placeholder="e.g. Delhi Capitals, Real Madrid, RCB…"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!teamIdentifier) {
                      setTeamIdentifier(
                        e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                      );
                    }
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="team-identifier">Common Identifier *</label>
                <input
                  id="team-identifier"
                  className="form-control"
                  type="text"
                  placeholder="e.g. delhi-capitals, rcb, real-madrid"
                  value={teamIdentifier}
                  onChange={(e) => setTeamIdentifier(e.target.value)}
                  list="existing-team-identifiers"
                  required
                />
                <datalist id="existing-team-identifiers">
                  {existingIdentifiers.map((idVal) => (
                    <option key={idVal} value={idVal} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Current Active Version Indicator */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                />
                <span>Current Active Version</span>
              </label>
            </div>

            {/* Type & Location */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-group">
                <label>Team Type *</label>
                <select
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="">-- Select Team Type --</option>
                  <option value="National">National Team (Country)</option>
                  <option value="League">Club / League Franchise</option>
                </select>
              </div>

              <div className="form-group">
                <label>{type === "League" ? "City" : type === "National" ? "Country" : "Country / City"}</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder={type === "League" ? "e.g. Madrid, Mumbai, London" : type === "National" ? "e.g. Spain, India, Germany" : "e.g. Spain, India, London…"}
                  value={type === "League" ? city : country}
                  onChange={(e) =>
                    type === "League" ? setCity(e.target.value) : setCountry(e.target.value)
                  }
                />
              </div>
            </div>

            {type === "League" && filteredTournaments.length > 0 && (
              <div className="form-group">
                <label>Associated Competition</label>
                <select
                  className="form-control"
                  value={tournament}
                  onChange={(e) => setTournament(e.target.value)}
                >
                  <option value="">-- Optional Competition Association --</option>
                  {filteredTournaments.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Team Crest / Logo */}
            <div className="form-group">
              <label>Team Logo / Crest for this Era {isEditing ? "(Optional if keeping existing)" : "*"}</label>
              <label className="image-dropzone">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                {preview ? (
                  <div className="dropzone-preview">
                    <img src={preview} alt="Team logo preview" />
                    <div className="preview-info">
                      <b>{imageFile?.name || "Logo Selected"}</b>
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
                      <b style={{ color: "var(--text)" }}>Click or drop team crest</b>
                      <small style={{ display: "block", color: "var(--muted)", marginTop: "4px" }}>
                        PNG, SVG, JPG or WebP
                      </small>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn ghost"
              onClick={closeCreateTeamModal}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Team" : "Save Team")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
