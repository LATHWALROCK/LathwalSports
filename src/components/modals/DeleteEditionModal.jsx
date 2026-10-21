import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useSports } from "../../context/SportsContext";
import { apiConnector } from "../../services/apiConnector";
import { leagueEndpoints } from "../../services/apis";
import { X, AlertTriangle } from "lucide-react";

export default function DeleteEditionModal() {
  const { deleteModal, closeDeleteConfirmModal, fetchEverything } = useSports();
  const [submitting, setSubmitting] = useState(false);

  if (!deleteModal.isOpen || !deleteModal.edition) return null;

  const edition = deleteModal.edition;
  const tourName = edition.tournament?.name || edition.name || "Edition";
  const season = edition.season || edition.year;

  const handleDelete = async () => {
    setSubmitting(true);
    const toastId = toast.loading("Deleting edition...");

    try {
      const res = await apiConnector("DELETE", leagueEndpoints.DELETE_LEAGUE, {
        _id: edition._id,
        name: edition.name,
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to delete edition");
      }

      toast.success(`Deleted ${season} ${tourName}`, { id: toastId });
      await fetchEverything();
      closeDeleteConfirmModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Deletion failed", {
        id: toastId,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay sub-modal" onClick={closeDeleteConfirmModal}>
      <div className="modal-dialog sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ color: "var(--danger)" }}>
            <AlertTriangle size={22} /> Delete Edition
          </h3>
          <button className="modal-close" onClick={closeDeleteConfirmModal} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ margin: 0, color: "var(--text)" }}>
            Are you sure you want to permanently delete:
          </p>
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "10px",
            }}
          >
            <b style={{ display: "block", fontSize: "16px", color: "var(--text)" }}>
              {season} {tourName}
            </b>
            <small style={{ color: "var(--muted)" }}>
              This will remove this record from champions history and team trophies.
            </small>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn ghost"
            onClick={closeDeleteConfirmModal}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            style={{
              background: "var(--danger)",
              borderColor: "var(--danger)",
              color: "#fff",
              fontWeight: 700,
            }}
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
