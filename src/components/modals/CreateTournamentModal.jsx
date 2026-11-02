import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSports } from "../../context/SportsContext";
import { apiConnector } from "../../services/apiConnector";
import { tournamentEndpoints } from "../../services/apis";
import { fileToDataUrl } from "../../utils/helpers";
import Picklist from "../Picklist";
import { X, Upload } from "lucide-react";

export default function CreateTournamentModal() {
  const {
    tournamentModal,
    closeCreateTournamentModal,
    sports,
    fetchEverything,
  } = useSports();

  const isEditing = Boolean(tournamentModal.editingTournament);

  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [type, setType] = useState(""); // empty initially, no preselection
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tournamentModal.isOpen) {
      if (tournamentModal.editingTournament) {
        const tour = tournamentModal.editingTournament;
        setName(tour.name || "");
        setSport(tour.sport?._id || tour.sport || tournamentModal.sportId || "");
        setType(tour.type || "");
        setPreview(tour.imageUrl || null);
        setImageFile(null);
      } else {
        setName("");
        setSport(tournamentModal.sportId || "");
        setType("");
        setImageFile(null);
        setPreview(null);
      }
    }
  }, [tournamentModal.isOpen, tournamentModal.editingTournament, tournamentModal.sportId]);

  if (!tournamentModal.isOpen) return null;

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
      toast.error("Please enter competition name");
      return;
    }
    if (!sport) {
      toast.error("Please select a sport");
      return;
    }
    if (!type) {
      toast.error("Please select competition type");
      return;
    }
    if (!isEditing && !imageFile) {
      toast.error("Please upload competition logo/emblem");
      return;
    }
    if (isEditing && !imageFile && !preview) {
      toast.error("Please upload competition logo/emblem");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(isEditing ? "Updating competition..." : "Creating competition...");

    try {
      const formData = new FormData();
      if (isEditing) {
        formData.append("_id", tournamentModal.editingTournament._id);
      }
      formData.append("name", name.trim());
      formData.append("sport", sport);
      formData.append("type", type === "League" ? "League" : "International");
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const endpoint = isEditing
        ? tournamentEndpoints.UPDATE_TOURNAMENT
        : tournamentEndpoints.CREATE_TOURNAMENT;
      const method = isEditing ? "PUT" : "POST";

      const res = await apiConnector(method, endpoint, formData, {
        "Content-Type": "multipart/form-data",
      });

      if (!res.data.success) {
        throw new Error(res.data.message || `Failed to ${isEditing ? "update" : "create"} competition`);
      }

      toast.success(`Competition "${name.trim()}" ${isEditing ? "updated" : "created"}!`, { id: toastId });
      await fetchEverything();

      if (tournamentModal.onSuccessCallback && res.data.tournament) {
        tournamentModal.onSuccessCallback(res.data.tournament);
      }

      closeCreateTournamentModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || `Competition ${isEditing ? "update" : "creation"} failed`, {
        id: toastId,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay sub-modal" onClick={closeCreateTournamentModal}>
      <div className="modal-dialog sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <span>{isEditing ? "✏️" : "🏆"}</span> {isEditing ? "Edit Competition" : "Create New Competition"}
          </h3>
          <button className="modal-close" onClick={closeCreateTournamentModal} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Sport Selector */}
            <div className="form-group">
              <label htmlFor="comp-sport">Sport *</label>
              <Picklist
                id="comp-sport"
                variant="modal"
                value={sport}
                onChange={(val) => setSport(val)}
                placeholder="-- Select Sport --"
                options={sports.map((s) => ({
                  value: s._id,
                  label: s.name,
                  logo: s.imageUrl,
                }))}
              />
            </div>

            {/* Competition Name */}
            <div className="form-group">
              <label htmlFor="tour-name">Competition Name *</label>
              <input
                id="tour-name"
                className="form-control"
                type="text"
                placeholder="e.g. FIFA World Cup, Premier League, IPL…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Competition Type (International or Club/League) */}
            <div className="form-group">
              <label htmlFor="comp-type">Competition Type *</label>
              <Picklist
                id="comp-type"
                variant="modal"
                value={type}
                onChange={(val) => setType(val)}
                placeholder="-- Select Competition Type --"
                options={[
                  { value: "International", label: "International Tournament" },
                  { value: "League", label: "Club / League Tournament" },
                ]}
              />
            </div>

            {/* Competition Logo */}
            <div className="form-group">
              <label>Competition Logo / Emblem *</label>
              <label className="image-dropzone">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                {preview ? (
                  <div className="dropzone-preview">
                    <img src={preview} alt="Competition logo preview" />
                    <div className="preview-info">
                      <b>{imageFile?.name || (isEditing ? "Current Competition Logo" : "Logo Selected")}</b>
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
                      <b style={{ color: "var(--text)" }}>Click or drop competition logo</b>
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
              onClick={closeCreateTournamentModal}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting
                ? (isEditing ? "Saving Changes..." : "Creating...")
                : (isEditing ? "Save Changes" : "Save Competition")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
