import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSports } from "../../context/SportsContext";
import { apiConnector } from "../../services/apiConnector";
import { teamEndpoints } from "../../services/apis";
import { fileToDataUrl } from "../../utils/helpers";
import Picklist from "../Picklist";
import Logo from "../Logo";
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
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [groupIdentifier, setGroupIdentifier] = useState("");
  const [groupName, setGroupName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!teamModal.editingTeam;

  // List of existing unique common identifiers for easy selection / linkage (scoped to selected sport)
  const existingIdentifiers = Array.from(
    new Set(
      teams
        .filter((t) => {
          if (!sport) return true;
          const tSportId = t.sport?._id || t.sport;
          return String(tSportId) === String(sport);
        })
        .map((t) => t.teamIdentifier)
        .filter(Boolean)
    )
  );

  // List of existing franchise / ownership groups for easy reuse
  const existingGroups = Array.from(
    new Map(
      teams
        .filter((t) => t.groupIdentifier || t.groupName)
        .map((t) => {
          const id =
            t.groupIdentifier ||
            (t.groupName
              ? t.groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
              : "");
          const gName = t.groupName || t.groupIdentifier;
          return [id, { id, name: gName }];
        })
    ).values()
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

        // Multi-tournament extraction
        const tourIds = [];
        if (Array.isArray(t.tournaments) && t.tournaments.length > 0) {
          t.tournaments.forEach((tour) => {
            const id = tour?._id || tour;
            if (id && !tourIds.includes(id)) tourIds.push(id);
          });
        }
        const singleId = t.tournament?._id || t.tournament;
        if (singleId && !tourIds.includes(singleId)) {
          tourIds.push(singleId);
        }
        setSelectedTournaments(tourIds);

        // Group / Franchise family
        setGroupIdentifier(t.groupIdentifier || "");
        setGroupName(t.groupName || "");

        setIsCurrent(t.isCurrent !== undefined ? !!t.isCurrent : true);
        setImageFile(null);
        setPreview(t.imageUrl || null);
      } else {
        setName(teamModal.name || "");
        setTeamIdentifier(teamModal.teamIdentifier || "");
        setSport(teamModal.sportId || "");

        const tour = tournaments.find((t) => t._id === teamModal.tournamentId);
        if (tour) {
          setSelectedTournaments([tour._id]);
          setType(teamModal.type || (tour.type === "League" ? "League" : "National"));
        } else {
          setSelectedTournaments([]);
          setType(teamModal.type || "");
        }

        setGroupIdentifier(teamModal.groupIdentifier || "");
        setGroupName(teamModal.groupName || "");
        setCountry(teamModal.country || "");
        setCity(teamModal.city || "");
        setImageFile(null);
        setPreview(null);
        setIsCurrent(teamModal.isCurrent !== undefined ? teamModal.isCurrent : true);
      }
    }
  }, [
    teamModal.isOpen,
    teamModal.editingTeam,
    teamModal.sportId,
    teamModal.tournamentId,
    teamModal.teamIdentifier,
    teamModal.name,
    teamModal.type,
    teamModal.country,
    teamModal.city,
    teamModal.groupIdentifier,
    teamModal.groupName,
    teamModal.isCurrent,
    tournaments,
  ]);

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

      // Multiple tournaments + primary backward compatibility
      formData.append("tournaments", JSON.stringify(selectedTournaments));
      if (selectedTournaments.length > 0) {
        formData.append("tournament", selectedTournaments[0]);
      } else {
        formData.append("tournament", "");
      }

      // Franchise / Ownership Group (cleared for National teams or when user clears group)
      if (type === "National") {
        formData.append("groupIdentifier", "");
        formData.append("groupName", "");
      } else {
        const cleanGroupId = groupIdentifier.trim()
          ? groupIdentifier.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
          : "";
        formData.append("groupIdentifier", cleanGroupId);
        formData.append("groupName", groupName.trim());
      }

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

  const filteredTournaments = tournaments.filter((t) => {
    // Must match sport if selected
    if (sport && (t.sport?._id || t.sport) !== sport) return false;

    // Filter by team type:
    // National teams only get International tournaments
    if (type === "National") {
      return t.type === "International" || t.type !== "League";
    }
    // Club / League teams only get League competitions
    if (type === "League") {
      return t.type === "League";
    }

    return true;
  });

  const availableTournamentsToAdd = filteredTournaments.filter(
    (t) => !selectedTournaments.includes(t._id)
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
              <Picklist
                id="team-sport"
                variant="modal"
                value={sport}
                onChange={(val) => {
                  setSport(val);
                  // Clear tournaments not matching new sport
                  setSelectedTournaments((prev) =>
                    prev.filter((tid) => {
                      const tour = tournaments.find((t) => t._id === tid);
                      return tour && (tour.sport?._id || tour.sport) === val;
                    })
                  );
                }}
                placeholder="Select Sport"
                options={sports.map((s) => ({
                  value: s._id,
                  label: s.name,
                  logo: s.imageUrl,
                }))}
              />
            </div>

            {/* Team Name & Common Identifier */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-group">
                <label htmlFor="team-name">Team Name *</label>
                <input
                  id="team-name"
                  className="form-control"
                  type="text"
                  placeholder="e.g. Delhi Capitals, Real Madrid, MI New York…"
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
                <label htmlFor="team-identifier">Common Identifier (Era Linking) *</label>
                <input
                  id="team-identifier"
                  className="form-control"
                  type="text"
                  placeholder="e.g. delhi-capitals, mi-new-york"
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
                <Picklist
                  variant="modal"
                  value={type}
                  onChange={(val) => {
                    setType(val);
                    if (val === "National") {
                      setGroupIdentifier("");
                      setGroupName("");
                      setSelectedTournaments((prev) =>
                        prev.filter((tid) => {
                          const tour = tournaments.find((t) => t._id === tid);
                          return tour && (tour.type === "International" || tour.type !== "League");
                        })
                      );
                    } else if (val === "League") {
                      setSelectedTournaments((prev) =>
                        prev.filter((tid) => {
                          const tour = tournaments.find((t) => t._id === tid);
                          return tour && tour.type === "League";
                        })
                      );
                    }
                  }}
                  placeholder="Select Team Type"
                  options={[
                    { value: "National", label: "National Team (Country)" },
                    { value: "League", label: "Club / League Franchise" },
                  ]}
                />
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

            {/* Associated Competitions (International for National Teams, League/Club for Club Teams) */}
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ margin: 0 }}>
                  {type === "National"
                    ? "Associated International Competitions (e.g. World Cups, Continental Championships)"
                    : type === "League"
                    ? "Associated Club Competitions (e.g. Domestic Leagues, Continental Cups)"
                    : "Associated Competitions (Multiple Allowed)"}
                </label>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {selectedTournaments.length} {selectedTournaments.length === 1 ? "competition" : "competitions"} selected
                </span>
              </div>

              <Picklist
                variant="modal"
                value=""
                onChange={(val) => {
                  if (val && !selectedTournaments.includes(val)) {
                    setSelectedTournaments((prev) => [...prev, val]);
                  }
                }}
                placeholder={
                  !sport
                    ? "Select a sport above first"
                    : !type
                    ? "Select a team type above first"
                    : filteredTournaments.length === 0
                    ? type === "National"
                      ? "No international tournaments created for this sport yet"
                      : "No club / league competitions created for this sport yet"
                    : availableTournamentsToAdd.length === 0
                    ? type === "National"
                      ? "All international competitions already added"
                      : "All club competitions already added"
                    : type === "National"
                    ? "+ Select & Add International Tournament..."
                    : "+ Select & Add Club Competition..."
                }
                options={availableTournamentsToAdd.map((t) => ({
                  value: t._id,
                  label: t.name,
                  logo: t.imageUrl,
                }))}
                disabled={!sport || availableTournamentsToAdd.length === 0}
              />

              {selectedTournaments.length > 0 && (
                <div className="comp-tags-container">
                  {selectedTournaments.map((tId) => {
                    const tDoc = tournaments.find((t) => t._id === tId);
                    return (
                      <span key={tId} className="comp-tag-pill">
                        {tDoc?.imageUrl && (
                          <Logo url={tDoc.imageUrl} label={tDoc.name} size="xs" />
                        )}
                        <span className="comp-tag-name">{tDoc?.name || "Competition"}</span>
                        <button
                          type="button"
                          className="btn-remove-tag"
                          onClick={() => setSelectedTournaments((prev) => prev.filter((id) => id !== tId))}
                          title="Remove competition association"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Franchise / Ownership Group Section (Only for Club / League Teams) */}
            {type !== "National" && (
              <div className="form-group-card">
                <div className="form-group-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="card-icon">🌐</span>
                    <div>
                      <label style={{ margin: 0, fontWeight: 600 }}>Franchise / Ownership Group (Optional)</label>
                      <small style={{ color: "var(--muted)", display: "block" }}>
                        Link sister teams under the same owner/network (e.g. MI Family, City Football Group, Red Bull)
                      </small>
                    </div>
                  </div>
                  {(groupName || groupIdentifier) && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{ fontSize: "11px", padding: "3px 8px", color: "var(--silver)", borderColor: "rgba(255, 255, 255, 0.15)" }}
                      onClick={() => {
                        setGroupName("");
                        setGroupIdentifier("");
                      }}
                      title="Clear franchise / ownership group association"
                    >
                      ✕ Clear Group
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="group-name" style={{ fontSize: "12px" }}>Group Display Name</label>
                    <input
                      id="group-name"
                      className="form-control"
                      type="text"
                      placeholder="e.g. MI Family, City Football Group"
                      value={groupName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGroupName(val);
                        if (!val.trim()) {
                          setGroupIdentifier("");
                          return;
                        }
                        const matched = existingGroups.find((g) => g.name.toLowerCase() === val.toLowerCase());
                        if (matched) {
                          setGroupIdentifier(matched.id);
                        } else if (!groupIdentifier || groupIdentifier === groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) {
                          setGroupIdentifier(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                        }
                      }}
                      list="existing-group-names"
                    />
                    <datalist id="existing-group-names">
                      {existingGroups.map((g) => (
                        <option key={g.id} value={g.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="group-identifier" style={{ fontSize: "12px" }}>Group Identifier (Slug)</label>
                    <input
                      id="group-identifier"
                      className="form-control"
                      type="text"
                      placeholder="e.g. mi-family, city-football-group"
                      value={groupIdentifier}
                      onChange={(e) => setGroupIdentifier(e.target.value)}
                      list="existing-group-identifiers"
                    />
                    <datalist id="existing-group-identifiers">
                      {existingGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
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
