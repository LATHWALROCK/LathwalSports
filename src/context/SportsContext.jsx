import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import {
  sportEndpoints,
  tournamentEndpoints,
  teamEndpoints,
  leagueEndpoints,
} from "../services/apis";

const SportsContext = createContext(null);

export const useSports = () => {
  const context = useContext(SportsContext);
  if (!context) {
    throw new Error("useSports must be used within a SportsProvider");
  }
  return context;
};

export function SportsProvider({ children }) {
  // Database Entities
  const [sports, setSports] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin View State
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("lathwal_admin_mode") === "true";
  });

  const toggleAdmin = () => {
    setIsAdmin((prev) => {
      const next = !prev;
      localStorage.setItem("lathwal_admin_mode", String(next));
      toast.success(next ? "Switched to Admin View" : "Switched to Normal View");
      return next;
    });
  };

  // Modals State
  const [editionModal, setEditionModal] = useState({
    isOpen: false,
    editingEdition: null,
    defaultSportId: "",
    defaultTournamentId: "",
  });

  const [sportModal, setSportModal] = useState({
    isOpen: false,
    onSuccessCallback: null,
  });

  const [tournamentModal, setTournamentModal] = useState({
    isOpen: false,
    sportId: "",
    onSuccessCallback: null,
  });

  const [teamModal, setTeamModal] = useState({
    isOpen: false,
    editingTeam: null,
    role: "winner", // "winner" | "runnerUp" | "general" | "edit"
    sportId: "",
    tournamentId: "",
    onSuccessCallback: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    edition: null,
  });

  // Fetch all database records
  const fetchEverything = useCallback(async () => {
    setLoading(true);
    try {
      const [sportRes, tourRes, teamRes, leagueRes] = await Promise.all([
        apiConnector("GET", sportEndpoints.GET_SPORT).catch(() => ({ data: { data: [] } })),
        apiConnector("GET", tournamentEndpoints.GET_TOURNAMENT).catch(() => ({ data: { data: [] } })),
        apiConnector("GET", teamEndpoints.GET_TEAM).catch(() => ({ data: { data: [] } })),
        apiConnector("GET", leagueEndpoints.GET_LEAGUE).catch(() => ({ data: { data: [] } })),
      ]);

      setSports(sportRes.data?.data || []);
      setTournaments(tourRes.data?.data || []);
      setTeams(teamRes.data?.data || []);
      setLeagues(leagueRes.data?.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load records from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEverything();
  }, [fetchEverything]);

  // Modal Triggers
  const openAddEditionModal = ({ sportId = "", tournamentId = "" } = {}) => {
    setEditionModal({
      isOpen: true,
      editingEdition: null,
      defaultSportId: sportId,
      defaultTournamentId: tournamentId,
    });
  };

  const openEditEditionModal = (edition) => {
    setEditionModal({
      isOpen: true,
      editingEdition: edition,
      defaultSportId: edition.sport?._id || edition.sport || "",
      defaultTournamentId: edition.tournament?._id || edition.tournament || "",
    });
  };

  const closeEditionModal = () => {
    setEditionModal({
      isOpen: false,
      editingEdition: null,
      defaultSportId: "",
      defaultTournamentId: "",
    });
  };

  const openCreateSportModal = (callback) => {
    setSportModal({
      isOpen: true,
      onSuccessCallback: callback || null,
    });
  };

  const closeCreateSportModal = () => {
    setSportModal({
      isOpen: false,
      onSuccessCallback: null,
    });
  };

  const openCreateTournamentModal = ({ sportId = "", callback } = {}) => {
    setTournamentModal({
      isOpen: true,
      sportId: sportId || "",
      onSuccessCallback: callback || null,
    });
  };

  const closeCreateTournamentModal = () => {
    setTournamentModal({
      isOpen: false,
      sportId: "",
      onSuccessCallback: null,
    });
  };

  const openCreateTeamModal = ({
    role = "winner",
    sportId = "",
    tournamentId = "",
    teamIdentifier = "",
    name = "",
    type = "",
    country = "",
    city = "",
    groupIdentifier = "",
    groupName = "",
    isCurrent,
    callback,
  } = {}) => {
    setTeamModal({
      isOpen: true,
      editingTeam: null,
      role,
      sportId: sportId || "",
      tournamentId: tournamentId || "",
      teamIdentifier: teamIdentifier || "",
      name: name || "",
      type: type || "",
      country: country || "",
      city: city || "",
      groupIdentifier: groupIdentifier || "",
      groupName: groupName || "",
      isCurrent: isCurrent !== undefined ? isCurrent : true,
      onSuccessCallback: callback || null,
    });
  };

  const openEditTeamModal = (team, callback) => {
    setTeamModal({
      isOpen: true,
      editingTeam: team,
      role: "edit",
      sportId: team?.sport?._id || team?.sport || "",
      tournamentId: team?.tournament?._id || team?.tournament || "",
      onSuccessCallback: callback || null,
    });
  };

  const closeCreateTeamModal = () => {
    setTeamModal({
      isOpen: false,
      editingTeam: null,
      role: "winner",
      sportId: "",
      tournamentId: "",
      onSuccessCallback: null,
    });
  };

  const openDeleteConfirmModal = (edition) => {
    setDeleteModal({
      isOpen: true,
      edition,
    });
  };

  const closeDeleteConfirmModal = () => {
    setDeleteModal({
      isOpen: false,
      edition: null,
    });
  };

  return (
    <SportsContext.Provider
      value={{
        sports,
        tournaments,
        teams,
        leagues,
        loading,
        isAdmin,
        toggleAdmin,
        fetchEverything,
        // Modal State & Controls
        editionModal,
        openAddEditionModal,
        openEditEditionModal,
        closeEditionModal,
        sportModal,
        openCreateSportModal,
        closeCreateSportModal,
        tournamentModal,
        openCreateTournamentModal,
        closeCreateTournamentModal,
        teamModal,
        openCreateTeamModal,
        openEditTeamModal,
        closeCreateTeamModal,
        deleteModal,
        openDeleteConfirmModal,
        closeDeleteConfirmModal,
      }}
    >
      {children}
    </SportsContext.Provider>
  );
}
