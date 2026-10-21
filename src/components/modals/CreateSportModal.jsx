import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSports } from "../../context/SportsContext";
import { apiConnector } from "../../services/apiConnector";
import { sportEndpoints } from "../../services/apis";
import { X, Trash2 } from "lucide-react";

export default function CreateSportModal() {
  const { sportModal, closeCreateSportModal, sports, fetchEverything } = useSports();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sportModal.isOpen) {
      setName("");
    }
  }, [sportModal.isOpen]);

  if (!sportModal.isOpen) return null;

  const handleDeleteSport = async (sportItem) => {
    if (!window.confirm(`Delete sport "${sportItem.name}"?`)) return;
    try {
      const res = await apiConnector("DELETE", sportEndpoints.DELETE_SPORT, {
        _id: sportItem._id,
        name: sportItem.name,
      });
      if (res.data.success) {
        toast.success(`Sport "${sportItem.name}" deleted`);
        await fetchEverything();
      } else {
        toast.error(res.data.message || "Failed to delete sport");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to delete sport");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a sport name");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Creating new sport...");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());

      const res = await apiConnector("POST", sportEndpoints.CREATE_SPORT, formData, {
        "Content-Type": "multipart/form-data",
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to create sport");
      }

      toast.success(`Sport "${name}" created!`, { id: toastId });
      await fetchEverything();

      if (sportModal.onSuccessCallback && res.data.sport) {
        sportModal.onSuccessCallback(res.data.sport);
      }

      setName("");
      closeCreateSportModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Sport creation failed", {
        id: toastId,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay sub-modal" onClick={closeCreateSportModal}>
      <div className="modal-dialog sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <span>🏅</span> Manage Sports
          </h3>
          <button className="modal-close" onClick={closeCreateSportModal} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="sport-name">Add New Sport *</label>
              <input
                id="sport-name"
                className="form-control"
                type="text"
                placeholder="e.g. Football, Cricket, Basketball, Tennis…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* List of existing sports in the database with delete button */}
            {sports.length > 0 && (
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                <label style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "block" }}>
                  Existing Sports in Database ({sports.length})
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {sports.map((s) => (
                    <div
                      key={s._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "var(--panel-2)",
                        border: "1px solid var(--line)",
                        borderRadius: "20px",
                        padding: "5px 10px 5px 12px",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSport(s)}
                        title={`Delete ${s.name}`}
                        style={{
                          color: "var(--dim)",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                          padding: "2px",
                          borderRadius: "4px",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--dim)")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn ghost"
              onClick={closeCreateSportModal}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? "Creating..." : "Save Sport"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
