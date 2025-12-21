import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import IndividualTournament from "../components/TournamentTile";
import IndividualTeam from "../components/TeamTile";
import { tournamentEndpoints, sportEndpoints, teamEndpoints } from "../services/apis";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const {
  GET_TOURNAMENT,
  CREATE_TOURNAMENT,
  UPDATE_TOURNAMENT,
  DELETE_TOURNAMENT,
  GET_TOURNAMENT_BY_SPORT,
} = tournamentEndpoints;

const { GET_SPORT } = sportEndpoints;

const {
  GET_TEAM_BY_SPORT,
  CREATE_TEAM,
  UPDATE_TEAM,
  DELETE_TEAM,
} = teamEndpoints;

function Tournament() {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({ name: "", sport: "", type: "" });
  const [editData, setEditData] = useState({ _id: "", name: "", sport: "", type: "" });
  const [sportData, setSportData] = useState([]);
  const [teamsData, setTeamsData] = useState([]);
  const [image, setImage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showTeamEditForm, setShowTeamEditForm] = useState(false);
  const [tournamentType, setTournamentType] = useState(""); // "International" or "League"
  const [editImage, setEditImage] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    sport: "",
    type: "National", // Default to National for international tournaments
    country: "",
    tournament: "",
    city: "",
    inactive: false,
  });
  const [editTeamData, setEditTeamData] = useState({ _id: "", name: "", sport: "", type: "", country: "", inactive: false });
  const [teamImage, setTeamImage] = useState(null);
  const [editTeamImage, setEditTeamImage] = useState(null);
  const [editTeamPreview, setEditTeamPreview] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sportParam = searchParams.get("sport");
  const typeParam = searchParams.get("type");

  const { name, sport, type } = formData;

  const fetchData = useCallback(() => {
    const endpoint = sportParam ? GET_TOURNAMENT_BY_SPORT : GET_TOURNAMENT;
    const params = sportParam ? { sport: sportParam } : null;
    apiConnector("GET", endpoint, null, null, params)
      .then((response) => {
        setData(response.data.data);
      })
      .catch((error) => {
        toast.error("Failed to fetch tournaments");
        console.error("FETCH TOURNAMENTS ERROR:", error);
      });
  }, [sportParam]);

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const fetchSportData = useCallback(() => {
    apiConnector("GET", GET_SPORT)
      .then((response) => {
        setSportData(response.data.data);
      })
      .catch((error) => {
        console.error("FETCH SPORTS ERROR:", error);
      });
  }, []);

  const fetchTeamsData = useCallback(() => {
    if (sportParam) {
      console.log("Fetching teams for sport:", sportParam, "type:", typeParam);
      if (typeParam === "League") {
        // For leagues, fetch all league teams for this sport
        // We'll group them by tournament later
        apiConnector("GET", GET_TEAM_BY_SPORT, null, null, { sport: sportParam })
          .then((response) => {
            console.log("All teams response:", response.data.data);
            console.log("Team types found:", response.data.data.map(team => ({ name: team.name, type: team.type })));
            // Filter to only league teams
            const leagueTeams = response.data.data.filter(team => team.type === "League");
            console.log("Filtered league teams:", leagueTeams);
            console.log("League teams count:", leagueTeams.length);
            setTeamsData(leagueTeams);
          })
          .catch((error) => {
            console.error("FETCH LEAGUE TEAMS ERROR:", error);
          });
      } else {
        // For international tournaments, fetch national teams
        apiConnector("GET", GET_TEAM_BY_SPORT, null, null, { sport: sportParam })
          .then((response) => {
            console.log("All teams response:", response.data.data);
            // Filter to only national teams
            const nationalTeams = response.data.data.filter(team => team.type === "National");
            console.log("Filtered national teams:", nationalTeams);
            setTeamsData(nationalTeams);
          })
          .catch((error) => {
            console.error("FETCH NATIONAL TEAMS ERROR:", error);
          });
      }
    }
  }, [sportParam, typeParam]);


  const handleSelectType = (type) => {
    setTournamentType(type);
    setFormData((prev) => ({ ...prev, type, sport: sportParam || "" }));
    setShowTypeSelection(false);
    setShowForm(true);
  };

  const handleOnSubmit = (e) => {
    e.preventDefault();
    const toastId = toast.loading("Creating tournament...");

    const formDataObj = new FormData();
    formDataObj.append("name", name);
    formDataObj.append("sport", sport);
    formDataObj.append("type", type);
    formDataObj.append("image", image);

    apiConnector("POST", CREATE_TOURNAMENT, formDataObj, {
      "Content-Type": "multipart/form-data",
    })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }

        toast.success("Tournament created successfully");
        setFormData({ name: "", type: "", sport: "" });
        setImage(null);
        setTournamentType("");
        setShowForm(false);
        setShowTypeSelection(false);
        fetchData();
      })
      .catch((error) => {
        console.error("CREATE TOURNAMENT ERROR:", error);
        toast.error("Tournament creation failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  const handleDelete = (name, _id) => {
    const toastId = toast.loading("Deleting tournament...");

    apiConnector("DELETE", DELETE_TOURNAMENT, { name, _id })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Tournament deleted successfully");
        fetchData();
      })
      .catch((error) => {
        console.error("DELETE TOURNAMENT ERROR:", error);
        toast.error("Tournament deletion failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  // Edit handlers
  const handleEdit = (_id, currentName) => {
    const tournament = data.find(t => t._id === _id);
    setEditData({
      _id,
      name: currentName,
      sport: tournament?.sport?._id || "",
      type: tournament?.type || ""
    });
    setEditPreview(tournament?.imageUrl || null);
    setShowEditForm(true);
  };

  const handleEditOnChange = (e) => {
    setEditData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImage(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const toastId = toast.loading("Updating tournament...");

    const formDataObj = new FormData();
    formDataObj.append("_id", editData._id);
    formDataObj.append("name", editData.name);
    formDataObj.append("sport", editData.sport);
    formDataObj.append("type", editData.type);
    if (editImage) {
      formDataObj.append("image", editImage);
    }

    apiConnector("PUT", UPDATE_TOURNAMENT, formDataObj, {
      "Content-Type": "multipart/form-data",
    })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Tournament updated successfully");
        setEditData({ _id: "", name: "", sport: "", type: "" });
        setEditImage(null);
        setEditPreview(null);
        setShowEditForm(false);
        fetchData();
      })
      .catch((error) => {
        console.error("UPDATE TOURNAMENT ERROR:", error);
        toast.error("Tournament update failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  // Team management functions
  const handleTeamDelete = (name, _id) => {
    const toastId = toast.loading("Deleting team...");

    apiConnector("DELETE", DELETE_TEAM, { name, _id })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Team deleted successfully");
        fetchTeamsData();
      })
      .catch((error) => {
        console.error("DELETE TEAM ERROR:", error);
        toast.error("Team deletion failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  const handleTeamEdit = (_id, teamData) => {
    setEditTeamData({
      _id,
      name: teamData.name,
      sport: teamData.sport?._id || teamData.sport || "",
      type: teamData.type,
      country: teamData.country || "",
      tournament: teamData.tournament?._id || teamData.tournament || "",
      city: teamData.city || "",
      inactive: teamData.inactive || false
    });
    setEditTeamPreview(teamData.imageUrl || null);
    setShowTeamEditForm(true);
  };

  // Team form handlers
  const handleTeamFormChange = (e) => {
    setTeamFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleTeamSubmit = (e) => {
    e.preventDefault();
    const toastId = toast.loading("Creating team...");

    const formDataObj = new FormData();
    formDataObj.append("name", teamFormData.name);
    formDataObj.append("sport", teamFormData.sport);
    formDataObj.append("type", teamFormData.type);

    if (typeParam === "League") {
      formDataObj.append("tournament", teamFormData.tournament);
      formDataObj.append("city", teamFormData.city);
    } else {
      formDataObj.append("country", teamFormData.country);
    }
    formDataObj.append("inactive", teamFormData.inactive);
    if (teamImage) {
      formDataObj.append("image", teamImage);
    }

    console.log("Creating team with data:", {
      name: teamFormData.name,
      sport: teamFormData.sport,
      type: teamFormData.type,
      country: typeParam !== "League" ? teamFormData.country : "N/A",
      tournament: typeParam === "League" ? teamFormData.tournament : "N/A",
      city: typeParam === "League" ? teamFormData.city : "N/A",
      inactive: teamFormData.inactive
    });

    apiConnector("POST", CREATE_TEAM, formDataObj, {
      "Content-Type": "multipart/form-data",
    })
      .then((response) => {
        console.log("Team creation response:", response);
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Team created successfully");
        setTeamFormData(prev => ({
          ...prev,
          name: "",
          country: "",
          tournament: "",
          city: "",
          inactive: false
        }));
        setTeamImage(null);
        setShowTeamForm(false);
        fetchTeamsData();
      })
      .catch((error) => {
        console.error("CREATE TEAM ERROR:", error);
        toast.error("Team creation failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  const handleTeamEditSubmit = (e) => {
    e.preventDefault();
    const toastId = toast.loading("Updating team...");

    const formDataObj = new FormData();
    formDataObj.append("_id", editTeamData._id);
    formDataObj.append("name", editTeamData.name);
    formDataObj.append("sport", editTeamData.sport);
    formDataObj.append("type", editTeamData.type);

    if (editTeamData.type === "League") {
      formDataObj.append("tournament", editTeamData.tournament);
      formDataObj.append("city", editTeamData.city);
    } else {
      formDataObj.append("country", editTeamData.country);
    }

    formDataObj.append("inactive", editTeamData.inactive);
    if (editTeamImage) {
      formDataObj.append("image", editTeamImage);
    }

    apiConnector("PUT", UPDATE_TEAM, formDataObj, {
      "Content-Type": "multipart/form-data",
    })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Team updated successfully");
        setEditTeamData({
          _id: "",
          name: "",
          sport: "",
          type: "",
          country: "",
          tournament: "",
          city: "",
          inactive: false
        });
        setEditTeamImage(null);
        setEditTeamPreview(null);
        setShowTeamEditForm(false);
        fetchTeamsData();
      })
      .catch((error) => {
        console.error("UPDATE TEAM ERROR:", error);
        toast.error("Team update failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  useEffect(() => {
    fetchData();
    fetchSportData();
    fetchTeamsData();
    setFormData((prev) => ({ ...prev, sport: sportParam || "" }));
    setTeamFormData(prev => ({
      ...prev,
      sport: sportParam || "",
      type: typeParam === "League" ? "League" : "National",
      name: "",
      country: "",
      tournament: "",
      city: "",
      inactive: false
    }));
  }, [sportParam, typeParam, fetchData, fetchSportData, fetchTeamsData]);

  const getSportName = () => {
    const foundSport = sportData.find((s) => s._id === sport);
    return foundSport ? foundSport.name : "";
  };

  const getEditSportName = () => {
    const foundSport = sportData.find((s) => s._id === editData.sport);
    return foundSport ? foundSport.name : "";
  };

  // Filter tournaments by type
  const internationalTournaments = data.filter((t) => t.type === "International");
  const leagueTournaments = data.filter((t) => t.type === "League");

  // If type parameter is provided, only show tournaments of that type
  const displayInternational = !typeParam || typeParam === "International";
  const displayLeague = !typeParam || typeParam === "League";

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 text-black py-10 px-4 relative">
      {/* Back Button - Top Left Corner */}
      <button
        onClick={() => navigate(`/tournament-selector?sport=${sportParam}`)}
        className="fixed top-20 left-6 bg-gray-100 shadow-md rounded-lg p-3 text-black
                   hover:bg-gray-200 transition-colors duration-300 z-10"
        title="Back to Type Selection"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          {typeParam ? `${typeParam} Tournaments` : "Tournaments"}
        </h1>

        {/* International Tournament Section */}
        {displayInternational && (
          <div className="mb-12">
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              {internationalTournaments.map((tournament) => (
                <li key={tournament._id}>
                  <IndividualTournament
                    title={tournament.name}
                    image={tournament.imageUrl}
                    sport={tournament.sport._id}
                    _id={tournament._id}
                    type={tournament.type}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                </li>
              ))}

              {/* Add International Tournament Tile - Part of grid */}
              {sportParam && (!typeParam || typeParam === "International") && (
                <li>
                  <div
                    onClick={() => handleSelectType("International")}
                    className="bg-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-center
                               text-6xl font-bold text-gray-400 hover:bg-gray-200 hover:text-gray-600
                               hover:scale-105 transition-all duration-300 cursor-pointer h-full min-h-[120px]"
                    title="Add International Tournament"
                  >
                    +
                  </div>
                </li>
              )}
            </ul>

            {internationalTournaments.length === 0 && (
              <p className="text-gray-500 mb-6 text-center">
                {typeParam ? `No ${typeParam.toLowerCase()} tournaments yet` : "No international tournaments yet"}
              </p>
            )}
          </div>
        )}

        {/* National Teams Section - only show for international tournaments */}
        {displayInternational && sportParam && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">National Teams</h2>

            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-6">
              {teamsData.map((team) => (
                <li key={team._id}>
                  <IndividualTeam
                    title={team.name}
                    image={team.imageUrl}
                    _id={team._id}
                    onDelete={handleTeamDelete}
                    onEdit={handleTeamEdit}
                    teamData={team}
                  />
                </li>
              ))}

              {/* Add National Team Tile - Part of the grid */}
              <li>
                <div
                  onClick={() => setShowTeamForm(true)}
                  className="bg-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-center
                             text-6xl font-bold text-gray-400 hover:bg-gray-200 hover:text-gray-600
                             hover:scale-105 transition-all duration-300 cursor-pointer h-full min-h-[120px]"
                  title="Add National Team"
                >
                  +
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* Leagues Section - Integrated Tournament + Teams Layout */}
        {displayLeague && (
          <div className="space-y-12">
            {leagueTournaments.length > 0 ? (
              leagueTournaments.map((tournament) => {
                // Find teams for this specific tournament
                const tournamentTeams = teamsData.filter(team =>
                  team.tournament && team.tournament._id === tournament._id
                );

                return (
                  <div key={tournament._id} className="space-y-6">
                    {/* Tournament Tile */}
                    <div className="flex justify-center">
                      <div className="max-w-sm w-full">
                        <IndividualTournament
                          title={tournament.name}
                          image={tournament.imageUrl}
                          sport={tournament.sport._id}
                          _id={tournament._id}
                          type={tournament.type}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                        />
                      </div>
                    </div>

                    {/* Teams for this Tournament */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-4 text-center">
                        {tournament.name} Teams
                      </h3>

                      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
                        {tournamentTeams.map((team) => (
                          <li key={team._id}>
                            <IndividualTeam
                              title={team.name}
                              image={team.imageUrl}
                              _id={team._id}
                              onDelete={handleTeamDelete}
                              onEdit={handleTeamEdit}
                              teamData={team}
                            />
                          </li>
                        ))}

                        {/* Add Team Tile for this Tournament - Part of the grid */}
                        <li>
                          <div
                            onClick={() => {
                              setTeamFormData(prev => ({
                                ...prev,
                                tournament: tournament._id,
                                sport: sportParam || "",
                                type: "League",
                                country: "",
                                city: "",
                                inactive: false
                              }));
                              setShowTeamForm(true);
                            }}
                            className="bg-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-center
                                       text-6xl font-bold text-gray-400 hover:bg-gray-200 hover:text-gray-600
                                       hover:scale-105 transition-all duration-300 cursor-pointer h-full min-h-[120px]"
                            title={`Add Team to ${tournament.name}`}
                          >
                            +
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center">
                No league tournaments yet
              </p>
            )}

            {/* Add New League Tournament Tile */}
            {sportParam && (!typeParam || typeParam === "League") && (
              <div className="flex justify-center">
                <div className="max-w-sm w-full">
                  <div
                    onClick={() => handleSelectType("League")}
                    className="bg-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-center
                               text-6xl font-bold text-gray-400 hover:bg-gray-200 hover:text-gray-600
                               hover:scale-105 transition-all duration-300 cursor-pointer h-full min-h-[120px]"
                    title="Add League Tournament"
                  >
                    +
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Type Selection Modal */}
        {showTypeSelection && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black p-8 rounded-xl shadow-lg w-full max-w-md ring-1 ring-black">
              <h2 className="text-xl font-bold mb-6 text-center">Select Tournament Type</h2>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => handleSelectType("International")}
                  className="w-full bg-gray-100 ring-1 ring-black rounded-lg p-4 text-lg font-semibold text-black hover:bg-gray-200 transition"
                >
                  International Tournament
                </button>
                <button
                  onClick={() => handleSelectType("League")}
                  className="w-full bg-gray-100 ring-1 ring-black rounded-lg p-4 text-lg font-semibold text-black hover:bg-gray-200 transition"
                >
                  League
                </button>
                <button
                  onClick={() => setShowTypeSelection(false)}
                  className="w-full border border-black bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition mt-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tournament Modal Form */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black p-8 rounded-xl shadow-lg w-full max-w-md ring-1 ring-black">
              <h2 className="text-xl font-bold mb-4">
                Add {tournamentType === "International" ? "International Tournament" : "League"}
              </h2>
              <form onSubmit={handleOnSubmit} className="flex flex-col gap-4">
                {/* Display Sport */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Sport:</label>
                  <p className="font-semibold">{getSportName()}</p>
                </div>

                {/* Display Type */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Type:</label>
                  <p className="font-semibold">{type}</p>
                </div>

                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={handleOnChange}
                  placeholder="Enter tournament name"
                  className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2 
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <input type="hidden" name="sport" value={sport} />
                <input type="hidden" name="type" value={type} />

                {/* 🔹 Styled Tournament Logo Input */}
                <div className="w-full flex flex-col items-center">
                  <label
                    htmlFor="tournamentImageInput"
                    className="w-32 h-32 border-2 border-dashed border-black rounded-lg 
               flex items-center justify-center text-gray-500 cursor-pointer 
               hover:border-black transition"
                  >
                    {image ? (
                      <img
                        src={URL.createObjectURL(image)}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      "Upload Logo"
                    )}
                  </label>
                  <input
                    type="file"
                    id="tournamentImageInput"
                    name="image"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                <div className="flex justify-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setShowTypeSelection(false);
                      setFormData({ name: "", type: "", sport: "" });
                      setImage(null);
                      setTournamentType("");
                    }}
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg 
                    hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg 
                    hover:bg-gray-200 transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Tournament Modal */}
        {showEditForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black p-8 rounded-xl shadow-lg w-full max-w-md ring-1 ring-black">
              <h2 className="text-xl font-bold mb-4 text-center">
                Edit Tournament
              </h2>
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                {/* Display Sport */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Sport:</label>
                  <p className="font-semibold">{getEditSportName()}</p>
                </div>

                {/* Display Type */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Type:</label>
                  <p className="font-semibold">{editData.type}</p>
                </div>

                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleEditOnChange}
                  placeholder="Enter tournament name"
                  className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <input type="hidden" name="sport" value={editData.sport} />
                <input type="hidden" name="type" value={editData.type} />

                {/* 🔹 Styled Tournament Logo Input */}
                <div className="w-full flex flex-col items-center">
                  <label
                    htmlFor="editTournamentImageInput"
                    className="w-32 h-32 border-2 border-dashed border-black rounded-lg
               flex items-center justify-center text-gray-500 cursor-pointer
               hover:border-black transition"
                  >
                    {editPreview ? (
                      <img
                        src={editPreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      "Upload Logo"
                    )}
                  </label>
                  <input
                    type="file"
                    id="editTournamentImageInput"
                    name="image"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="hidden"
                  />
                </div>

                <div className="flex justify-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditData({ _id: "", name: "", sport: "", type: "" });
                      setEditImage(null);
                      setEditPreview(null);
                    }}
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                    hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                    hover:bg-gray-200 transition"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Team Form Modal */}
        {showTeamForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black p-8 rounded-xl shadow-lg w-full max-w-md ring-1 ring-black">
              <h2 className="text-xl font-bold mb-4 text-center">
                Add {typeParam === "League" ? "League" : "National"} Team
              </h2>
              <form onSubmit={handleTeamSubmit} className="flex flex-col gap-4">
                {/* Display Sport */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Sport:</label>
                  <p className="font-semibold">{getSportName()}</p>
                </div>

                {/* Display Type */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Type:</label>
                  <p className="font-semibold">{typeParam === "League" ? "League" : "National"}</p>
                </div>

                {typeParam === "League" && (
                  <>
                    <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                      <label className="text-sm text-gray-600">Tournament:</label>
                      <p className="font-semibold">
                        {leagueTournaments.find(t => t._id === teamFormData.tournament)?.name || "Select a tournament"}
                      </p>
                    </div>

                    <input
                      type="text"
                      name="name"
                      value={teamFormData.name}
                      onChange={handleTeamFormChange}
                      placeholder="Enter team name"
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />

                    <input
                      type="text"
                      name="city"
                      value={teamFormData.city}
                      onChange={handleTeamFormChange}
                      placeholder="Enter city"
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </>
                )}

                {typeParam !== "League" && (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={teamFormData.name}
                      onChange={handleTeamFormChange}
                      placeholder="Enter team name"
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />

                    <input
                      type="text"
                      name="country"
                      value={teamFormData.country}
                      onChange={handleTeamFormChange}
                      placeholder="Enter country"
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="inactive"
                    name="inactive"
                    checked={teamFormData.inactive}
                    onChange={(e) => setTeamFormData(prev => ({ ...prev, inactive: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <label htmlFor="inactive" className="text-sm text-gray-700">
                    Mark as inactive
                  </label>
                </div>

                <input type="hidden" name="sport" value={teamFormData.sport} />
                <input type="hidden" name="type" value={teamFormData.type} />

                {/* Team Logo Input */}
                <div className="w-full flex flex-col items-center">
                  <label
                    htmlFor="teamImageInput"
                    className="w-32 h-32 border-2 border-dashed border-black rounded-lg
                   flex items-center justify-center text-gray-500 cursor-pointer
                   hover:border-black transition"
                  >
                    {teamImage ? (
                      <img
                        src={URL.createObjectURL(teamImage)}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      "Upload Logo"
                    )}
                  </label>
                  <input
                    type="file"
                    id="teamImageInput"
                    name="image"
                    accept="image/*"
                    onChange={(e) => setTeamImage(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                <div className="flex justify-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeamForm(false);
                      setTeamFormData(prev => ({
                        ...prev,
                        name: "",
                        country: "",
                        tournament: "",
                        city: "",
                        inactive: false
                      }));
                      setTeamImage(null);
                    }}
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                    hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                    hover:bg-gray-200 transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Team Modal */}
        {showTeamEditForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black p-8 rounded-xl shadow-lg w-full max-w-md ring-1 ring-black">
              <h2 className="text-xl font-bold mb-4 text-center">
                Edit Team
              </h2>
              <form onSubmit={handleTeamEditSubmit} className="flex flex-col gap-4">
                {/* Display Sport */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Sport:</label>
                  <p className="font-semibold">{getSportName()}</p>
                </div>

                {/* Display Type */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                  <label className="text-sm text-gray-600">Type:</label>
                  <p className="font-semibold">{editTeamData.type}</p>
                </div>

                {editTeamData.type === "League" ? (
                  <>
                    {/* Tournament display for league teams */}
                    <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-2">
                      <label className="text-sm text-gray-600">Tournament:</label>
                      <p className="font-semibold">
                        {leagueTournaments.find(t => t._id === editTeamData.tournament)?.name || "No tournament"}
                      </p>
                    </div>

                    <input
                      type="text"
                      name="name"
                      value={editTeamData.name}
                      onChange={(e) => setEditTeamData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter team name"
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />

                    <input
                      type="text"
                      name="city"
                      value={editTeamData.city}
                      onChange={(e) => setEditTeamData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </>
                ) : (
                  <input
                    type="text"
                    name="country"
                    value={editTeamData.country}
                    onChange={(e) => setEditTeamData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Enter country"
                    className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editInactive"
                    checked={editTeamData.inactive}
                    onChange={(e) => setEditTeamData(prev => ({ ...prev, inactive: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <label htmlFor="editInactive" className="text-sm text-gray-700">
                    Mark as inactive
                  </label>
                </div>

                {/* Team Logo Input */}
                <div className="w-full flex flex-col items-center">
                  <label
                    htmlFor="editTeamImageInput"
                    className="w-32 h-32 border-2 border-dashed border-black rounded-lg
                   flex items-center justify-center text-gray-500 cursor-pointer
                   hover:border-black transition"
                  >
                    {editTeamPreview ? (
                      <img
                        src={editTeamPreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      "Upload Logo"
                    )}
                  </label>
                  <input
                    type="file"
                    id="editTeamImageInput"
                    name="image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditTeamImage(file);
                        setEditTeamPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </div>

                <div className="flex justify-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeamEditForm(false);
                      setEditTeamData({
                        _id: "",
                        name: "",
                        sport: "",
                        type: "",
                        country: "",
                        tournament: "",
                        city: "",
                        inactive: false
                      });
                      setEditTeamImage(null);
                      setEditTeamPreview(null);
                    }}
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                    hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="border border-black bg-gray-100 text-black px-4 py-2 rounded-lg
                    hover:bg-gray-200 transition"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Tournament;
