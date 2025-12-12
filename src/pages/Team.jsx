import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import IndividualTeam from "../components/TeamTile";
import {
  teamEndpoints,
  sportEndpoints,
  tournamentEndpoints,
} from "../services/apis";

const { GET_TEAM, CREATE_TEAM, UPDATE_TEAM, DELETE_TEAM } = teamEndpoints;
const { GET_SPORT } = sportEndpoints;
const { GET_TOURNAMENT_BY_SPORT } = tournamentEndpoints;

function Team() {
  const [data, setData] = useState([]);
  const [sportData, setSportData] = useState([]);
  const [tournamentData, setTournamentData] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    country: "",
    sport: "",
    type: "",
    tournament: "",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [teamType, setTeamType] = useState(""); // "National" or "League"
  const [editData, setEditData] = useState({
    _id: "",
    name: "",
    city: "",
    country: "",
    sport: "",
    type: "",
    tournament: "",
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editImage, setEditImage] = useState(null);
  const [editPreview, setEditPreview] = useState(null);


  const { name, city, country, sport, type, tournament } = formData;

  // Fetch all teams
  const fetchData = () => {
    apiConnector("GET", GET_TEAM)
      .then((response) => {
        setData(response.data.data);
      })
      .catch((error) => {
        toast.error("Failed to fetch team");
        console.error("FETCH TEAMS ERROR:", error);
      });
  };

  // Fetch all sports (for dropdown)
  const fetchSportData = () => {
    apiConnector("GET", GET_SPORT)
      .then((response) => {
        setSportData(response.data.data);
      })
      .catch((error) => {
        toast.error("Failed to fetch sports");
        console.error("FETCH SPORTS ERROR:", error);
      });
  };

  // Fetch tournaments based on selected sport (for dropdown)
  // Only fetch League tournaments when type is League
  const fetchTournamentData = (selectedSport, teamType) => {
    if (!selectedSport) {
      setTournamentData([]);
      return;
    }
    apiConnector(
      "GET",
      GET_TOURNAMENT_BY_SPORT,
      null,
      null,
      { sport: selectedSport }
    )
      .then((response) => {
        // Filter tournaments based on team type
        if (teamType === "League") {
          // League teams can only select League tournaments
          const leagueTournaments = response.data.data.filter(
            (t) => t.type === "League"
          );
          setTournamentData(leagueTournaments);
        } else if (teamType === "National") {
          // National teams can only select International tournaments
          const internationalTournaments = response.data.data.filter(
            (t) => t.type === "International"
          );
          setTournamentData(internationalTournaments);
        } else {
          setTournamentData([]);
        }
      })
      .catch((error) => {
        toast.error("Failed to fetch tournaments");
        console.error("FETCH TOURNAMENTS ERROR:", error);
      });
  };

  // Form field change handler
  const handleOnChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "sport") {
      setFormData((prev) => ({ ...prev, tournament: "" }));
      // Fetch tournaments only if type is League
      if (type === "League") {
        fetchTournamentData(value, type);
      }
    }
  };

  const handleOpenTypeSelection = () => {
    setShowTypeSelection(true);
  };

  const handleSelectType = (teamType) => {
    setTeamType(teamType);
    setFormData((prev) => ({ ...prev, type: teamType, tournament: "" }));

    // If sport is already selected, fetch filtered tournaments
    if (sport) {
      fetchTournamentData(sport, teamType);
    }

    setShowTypeSelection(false);
    setShowForm(true);
  };

  const getSportName = () => {
    const foundSport = sportData.find((s) => s._id === sport);
    return foundSport ? foundSport.name : "";
  };

  // Image handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Submit form
  const handleOnSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!name || !name.trim()) {
      toast.error("Team name is required");
      return;
    }

    if (!sport || !sport.trim()) {
      toast.error("Sport selection is required");
      return;
    }

    if (!type || !type.trim()) {
      toast.error("Team type is required");
      return;
    }

    if (type === "National" && (!country || !country.trim())) {
      toast.error("Country is required for National teams");
      return;
    }

    if (type === "League") {
      if (!city || !city.trim()) {
        toast.error("City is required for League teams");
        return;
      }
      if (!tournament || !tournament.trim()) {
        toast.error("Tournament selection is required for League teams");
        return;
      }
    }

    if (!image) {
      toast.error("Team logo/image is required");
      return;
    }

    const toastId = toast.loading("Creating team...");

    const formDataObj = new FormData();
    formDataObj.append("name", name.trim());
    if (type === "National") {
      formDataObj.append("country", country.trim());
    } else {
      formDataObj.append("city", city.trim());
    }
    formDataObj.append("sport", sport.trim());
    formDataObj.append("type", type.trim());
    if (type === "League") {
      formDataObj.append("tournament", tournament.trim());
    }
    formDataObj.append("image", image);

    apiConnector("POST", CREATE_TEAM, formDataObj, {
      "Content-Type": "multipart/form-data",
    })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Team created successfully");
        // Reset form
        setFormData({ name: "", city: "", country: "", sport: "", type: "", tournament: "" });
        setImage(null);
        setPreview(null);
        setTeamType("");
        setShowForm(false);
        setShowTypeSelection(false);
        setTournamentData([]);
        fetchData();
      })
      .catch((error) => {
        console.error("CREATE TEAM ERROR:", error);
        toast.error("Team creation failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  // Delete team
  const handleDelete = (name, _id) => {
    const toastId = toast.loading("Deleting Team...");
    apiConnector("DELETE", DELETE_TEAM, { name, _id })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Team deleted successfully");
        fetchData();
      })
      .catch((error) => {
        console.error("DELETE TEAM ERROR:", error);
        toast.error("Team deletion failed");
      })
      .finally(() => {
        toast.dismiss(toastId);
      });
  };

  // Edit team
  const handleEdit = (_id, teamData) => {
    setEditData({
      _id,
      name: teamData.name || "",
      city: teamData.city || "",
      country: teamData.country || "",
      sport: teamData.sport?._id || "",
      type: teamData.type || "",
      tournament: teamData.tournament?._id || "",
    });
    setEditPreview(teamData.imageUrl || null);
    setShowEditForm(true);

    // Fetch tournaments if it's a league team
    if (teamData.type === "League" && teamData.sport?._id) {
      fetchTournamentData(teamData.sport._id, "League");
    }
  };

  // Handle edit form field changes
  const handleEditOnChange = (e) => {
    const { name, value } = e.target;

    setEditData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "sport") {
      setEditData((prev) => ({ ...prev, tournament: "" }));
      // Fetch tournaments only if type is League
      if (editData.type === "League") {
        fetchTournamentData(value, editData.type);
      }
    }
  };

  // Handle edit image change
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImage(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  // Submit edit form
  const handleEditSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!editData.name || !editData.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    if (!editData.sport || !editData.sport.trim()) {
      toast.error("Sport selection is required");
      return;
    }

    if (!editData.type || !editData.type.trim()) {
      toast.error("Team type is required");
      return;
    }

    if (editData.type === "National" && (!editData.country || !editData.country.trim())) {
      toast.error("Country is required for National teams");
      return;
    }

    if (editData.type === "League") {
      if (!editData.city || !editData.city.trim()) {
        toast.error("City is required for League teams");
        return;
      }
      if (!editData.tournament || !editData.tournament.trim()) {
        toast.error("Tournament selection is required for League teams");
        return;
      }
    }

    const toastId = toast.loading("Updating team...");

    const formDataObj = new FormData();
    formDataObj.append("_id", editData._id);
    formDataObj.append("name", editData.name.trim());
    if (editData.type === "National") {
      formDataObj.append("country", editData.country.trim());
    } else {
      formDataObj.append("city", editData.city.trim());
    }
    formDataObj.append("sport", editData.sport.trim());
    formDataObj.append("type", editData.type.trim());
    if (editData.type === "League") {
      formDataObj.append("tournament", editData.tournament.trim());
    }
    if (editImage) {
      formDataObj.append("image", editImage);
    }

    apiConnector("PUT", UPDATE_TEAM, formDataObj, {
      "Content-Type": "multipart/form-data",
    })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Team updated successfully");
        // Reset edit form
        setEditData({
          _id: "",
          name: "",
          city: "",
          country: "",
          sport: "",
          type: "",
          tournament: "",
        });
        setEditImage(null);
        setEditPreview(null);
        setShowEditForm(false);
        setTournamentData([]);
        fetchData();
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
  }, []);

  // ---- Group teams by Sport -> National Teams + Tournament Groups ----
  const grouped = data.reduce((acc, team) => {
    const sportObj = team?.sport || {};
    const sportId = sportObj?._id || "unknown-sport";
    const sportName = sportObj?.name || "Unknown Sport";

    if (!acc[sportId]) {
      acc[sportId] = {
        sportName,
        nationalTeams: [],
        tournaments: {}
      };
    }

    // Separate national teams from league teams
    if (team.type === "National") {
      acc[sportId].nationalTeams.push(team);
    } else {
      // League teams grouped by tournament
      const tournamentObj = team?.tournament || {};
      const tournamentId = tournamentObj?._id || "no-tournament";
      const tournamentName = tournamentObj?.name || "Miscellaneous";

      if (!acc[sportId].tournaments[tournamentId]) {
        acc[sportId].tournaments[tournamentId] = {
          tournamentName,
          teams: [],
        };
      }

      acc[sportId].tournaments[tournamentId].teams.push(team);
    }

    return acc;
  }, {});

  const sportsGroups = Object.entries(grouped).sort(([, a], [, b]) =>
    a.sportName.localeCompare(b.sportName)
  );


  return (
    <div className="bg-gradient-to-b from-white to-gray-50 text-black py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Teams
        </h1>

        {/* Grouped Teams */}
        {sportsGroups.length > 0 &&
          sportsGroups.map(([sportId, sportGroup]) => {
            const tournamentGroups = Object.entries(
              sportGroup.tournaments
            ).sort(([, a], [, b]) =>
              a.tournamentName.localeCompare(b.tournamentName)
            );

            return (
              <div key={sportId} className="mb-10 pb-4">
                {/* Sport Header */}
                <h2 className="text-2xl font-semibold mb-4 bg-gray-100 px-4 py-4 rounded-lg">
                  {sportGroup.sportName}
                </h2>

                <div className="ml-4">
                    {/* National Teams Section */}
                    {sportGroup.nationalTeams.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xl font-medium mb-3 text-blue-800">
                          National Teams
                        </h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                          {sportGroup.nationalTeams.map((team) => (
                            <li key={team._id}>
                              <IndividualTeam
                                title={team.name}
                                image={team.imageUrl}
                                _id={team._id}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                teamData={team}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tournament Groups */}
                    {tournamentGroups.map(([tournamentId, tGroup]) => (
                      <div key={tournamentId} className="mb-6">
                        <h3 className="text-xl font-medium mb-3 bg-gray-50 px-3 py-3 rounded">
                          {tGroup.tournamentName}
                        </h3>

                        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {tGroup.teams.map((team) => (
                            <li key={team._id}>
                              <IndividualTeam
                                title={team.name}
                                image={team.imageUrl}
                                _id={team._id}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                teamData={team}
                              />
                            </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
              </div>
            );
          })}

        {/* Single Add Team Button */}
        <button
          onClick={handleOpenTypeSelection}
          className="w-full bg-gray-100 ring-1 ring-black rounded-2xl p-6 flex items-center justify-center
          text-xl font-bold text-black hover:bg-gray-200 hover:scale-[1.02]
          transition-all duration-300 cursor-pointer"
        >
          + Add Team
        </button>

        {/* Type Selection Modal */}
        {showTypeSelection && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black p-8 rounded-xl shadow-lg w-full max-w-md ring-1 ring-black">
              <h2 className="text-xl font-bold mb-6 text-center">Select Team Type</h2>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => handleSelectType("National")}
                  className="w-full bg-gray-100 ring-1 ring-black rounded-lg p-4 text-lg font-semibold text-black hover:bg-gray-200 transition"
                >
                  National Team
                </button>
                <button
                  onClick={() => handleSelectType("League")}
                  className="w-full bg-gray-100 ring-1 ring-black rounded-lg p-4 text-lg font-semibold text-black hover:bg-gray-200 transition"
                >
                  League Team
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

        {/* Add Team Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-black rounded-2xl shadow-lg w-[90%] max-w-lg p-8 relative ring-1 ring-black">
              <button
                    onClick={() => {
                      setShowForm(false);
                      setShowTypeSelection(false);
                      setFormData({
                        name: "",
                        city: "",
                        country: "",
                        sport: "",
                        type: "",
                        tournament: "",
                      });
                      setImage(null);
                      setPreview(null);
                      setTeamType("");
                      setTournamentData([]);
                    }}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
              >
                ✖
              </button>

              <h2 className="text-2xl font-bold mb-6 text-center">
                Add {teamType === "National" ? "National Team" : "League"}
              </h2>

              <form
                onSubmit={handleOnSubmit}
                className="flex flex-col gap-6 items-center"
              >
                {/* Display Type */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-3">
                  <label className="text-sm text-gray-600">Type:</label>
                  <p className="font-semibold">{type}</p>
                </div>

                {/* Display Sport if selected, otherwise show dropdown */}
                {sport ? (
                  <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-3">
                    <label className="text-sm text-gray-600">Sport:</label>
                    <p className="font-semibold">{getSportName()}</p>
                  </div>
                ) : (
                  <select
                    name="sport"
                    value={sport || ""}
                    onChange={handleOnChange}
                    className="w-full border border-black bg-white text-black rounded-lg p-3
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Sport</option>
                    {sportData.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  name="name"
                  value={name || ""}
                  onChange={handleOnChange}
                  placeholder="Enter team name"
                  className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-3
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {type === "National" ? (
                  <input
                    type="text"
                    name="country"
                    value={country || ""}
                    onChange={handleOnChange}
                    placeholder="Enter country"
                    className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-3
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                ) : (
                  <input
                    type="text"
                    name="city"
                    value={city || ""}
                    onChange={handleOnChange}
                    placeholder="Enter team city"
                    className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-3
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
                
                {/* Tournament selection - only for League teams */}
                {type === "League" && (
                  <select
                    name="tournament"
                    value={tournament || ""}
                    onChange={handleOnChange}
                    className="w-full border border-black bg-white text-black rounded-lg p-3
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!sport}
                  >
                    <option value="">Select Tournament</option>
                    {tournamentData.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}

                <input type="hidden" name="type" value={type} />
                <label
                  htmlFor="imageUpload"
                  className="w-40 h-40 border-2 border-dashed border-black rounded-xl flex items-center justify-center 
                  cursor-pointer text-gray-500 hover:border-black transition"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span>Upload Logo</span>
                  )}
                </label>
                <input
                  id="imageUpload"
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  required={!preview}
                />
                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    className="border border-black bg-gray-100 text-black px-6 py-2 rounded-lg  
                    hover:bg-gray-200 transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        name: "",
                        city: "",
                        sport: "",
                        type: "",
                        tournament: "",
                      });
                      setImage(null);
                      setPreview(null);
                      setTeamType("");
                      setTournamentData([]);
                    }}
                    className="border border-black bg-gray-100 text-black px-6 py-2 rounded-lg 
                    hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Team Modal */}
        {showEditForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-black rounded-2xl shadow-lg w-[90%] max-w-lg p-8 relative ring-1 ring-black">
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditData({
                    _id: "",
                    name: "",
                    city: "",
                    country: "",
                    sport: "",
                    type: "",
                    tournament: "",
                  });
                  setEditImage(null);
                  setEditPreview(null);
                  setTournamentData([]);
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
              >
                ✖
              </button>

              <h2 className="text-2xl font-bold mb-6 text-center">
                Edit {editData.type === "National" ? "National Team" : "League"}
              </h2>

              <form
                onSubmit={handleEditSubmit}
                className="flex flex-col gap-6 items-center"
              >
                {/* Display Type */}
                <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-3">
                  <label className="text-sm text-gray-600">Type:</label>
                  <p className="font-semibold">{editData.type}</p>
                </div>

                {/* Sport Selection */}
                <select
                  name="sport"
                  value={editData.sport || ""}
                  onChange={handleEditOnChange}
                  className="w-full border border-black bg-white text-black rounded-lg p-3
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Sport</option>
                  {sportData.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  name="name"
                  value={editData.name || ""}
                  onChange={handleEditOnChange}
                  placeholder="Enter team name"
                  className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-3
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                {editData.type === "National" ? (
                  <input
                    type="text"
                    name="country"
                    value={editData.country || ""}
                    onChange={handleEditOnChange}
                    placeholder="Enter country"
                    className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-3
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                ) : (
                  <input
                    type="text"
                    name="city"
                    value={editData.city || ""}
                    onChange={handleEditOnChange}
                    placeholder="Enter team city"
                    className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-3
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}

                {/* Tournament selection - only for League teams */}
                {editData.type === "League" && (
                  <select
                    name="tournament"
                    value={editData.tournament || ""}
                    onChange={handleEditOnChange}
                    className="w-full border border-black bg-white text-black rounded-lg p-3
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!editData.sport}
                  >
                    <option value="">Select Tournament</option>
                    {tournamentData.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}

                <input type="hidden" name="type" value={editData.type} />

                <label
                  htmlFor="editImageUpload"
                  className="w-40 h-40 border-2 border-dashed border-black rounded-xl flex items-center justify-center
                  cursor-pointer text-gray-500 hover:border-black transition"
                >
                  {editPreview ? (
                    <img
                      src={editPreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span>Upload Logo</span>
                  )}
                </label>
                <input
                  id="editImageUpload"
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="hidden"
                />

                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    className="border border-black bg-gray-100 text-black px-6 py-2 rounded-lg
                    hover:bg-gray-200 transition"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditData({
                        _id: "",
                        name: "",
                        city: "",
                        country: "",
                        sport: "",
                        type: "",
                        tournament: "",
                      });
                      setEditImage(null);
                      setEditPreview(null);
                      setTournamentData([]);
                    }}
                    className="border border-black bg-gray-100 text-black px-6 py-2 rounded-lg
                    hover:bg-gray-200 transition"
                  >
                    Cancel
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

export default Team;
