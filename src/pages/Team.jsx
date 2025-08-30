import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import IndividualTeam from "../components/TeamTile";
import {
  teamEndpoints,
  sportEndpoints,
  tournamentEndpoints,
} from "../services/apis";

const { GET_TEAM, CREATE_TEAM, DELETE_TEAM } = teamEndpoints;
const { GET_SPORT } = sportEndpoints;
const { GET_TOURNAMENT_BY_SPORT } = tournamentEndpoints;

function Team() {
  const [data, setData] = useState([]);
  const [sportData, setSportData] = useState([]);
  const [tournamentData, setTournamentData] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    sport: "",
    tournament: "",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // 👇 collapsed state (default collapsed)
  const [collapsedSports, setCollapsedSports] = useState({});
  const [collapsedTournaments, setCollapsedTournaments] = useState({});

  const { name, city, sport, tournament } = formData;

  // Fetch all teams
  const fetchData = () => {
    apiConnector("GET", GET_TEAM)
      .then((response) => {
        setData(response.data.data);

        // 🔹 Collapse all sports & tournaments by default
        const sportsCollapsed = {};
        const tournamentsCollapsed = {};
        response.data.data.forEach((team) => {
          if (team.sport?._id) {
            sportsCollapsed[team.sport._id] = true;
          }
          if (team.sport?._id && team.tournament?._id) {
            tournamentsCollapsed[`${team.sport._id}-${team.tournament._id}`] = true;
          }
        });
        setCollapsedSports(sportsCollapsed);
        setCollapsedTournaments(tournamentsCollapsed);
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
  const fetchTournamentData = (selectedSport) => {
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
        setTournamentData(response.data.data);
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
      fetchTournamentData(value);
    }
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
    const toastId = toast.loading("Creating team...");

    const formDataObj = new FormData();
    formDataObj.append("name", name);
    formDataObj.append("city", city);
    formDataObj.append("sport", sport);
    formDataObj.append("tournament", tournament);
    formDataObj.append("image", image);

    apiConnector("POST", CREATE_TEAM, formDataObj, {
      "Content-Type": "multipart/form-data",
    })
      .then((response) => {
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
        toast.success("Team created successfully");
        setFormData({ name: "", city: "", sport: "", tournament: "" });
        setImage(null);
        setPreview(null);
        setShowForm(false);
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

  useEffect(() => {
    fetchData();
    fetchSportData();
  }, []);

  // ---- Group teams by Sport -> Tournament ----
  const grouped = data.reduce((acc, team) => {
    const sportObj = team?.sport || {};
    const sportId = sportObj?._id || "unknown-sport";
    const sportName = sportObj?.name || "Unknown Sport";

    if (!acc[sportId]) {
      acc[sportId] = { sportName, tournaments: {} };
    }

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
    return acc;
  }, {});

  const sportsGroups = Object.entries(grouped).sort(([, a], [, b]) =>
    a.sportName.localeCompare(b.sportName)
  );

  // ---- Collapsible toggles ----
  const toggleSport = (sportId) => {
    setCollapsedSports((prev) => ({
      ...prev,
      [sportId]: !prev[sportId],
    }));
  };

  const toggleTournament = (sportId, tournamentId) => {
    setCollapsedTournaments((prev) => ({
      ...prev,
      [`${sportId}-${tournamentId}`]: !prev[`${sportId}-${tournamentId}`],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Teams
        </h1>

        {/* Grouped Teams */}
        {sportsGroups.length === 0 ? (
          <p className="text-center text-gray-600">No teams available</p>
        ) : (
          sportsGroups.map(([sportId, sportGroup]) => {
            const tournamentGroups = Object.entries(
              sportGroup.tournaments
            ).sort(([, a], [, b]) =>
              a.tournamentName.localeCompare(b.tournamentName)
            );

            const sportCollapsed = collapsedSports[sportId];

            return (
              <div key={sportId} className="mb-10 pb-4">
                {/* Sport Header */}
                <h2
                  onClick={() => toggleSport(sportId)}
                  className="text-2xl font-semibold mb-2 cursor-pointer flex justify-between items-center bg-gray-200 px-4 p-4 rounded-lg shadow"
                >
                  {sportGroup.sportName}
                  <span>{sportCollapsed ? "▼" : "▲"}</span>
                </h2>

                {!sportCollapsed &&
                  tournamentGroups.map(([tournamentId, tGroup]) => {
                    const tourCollapsed =
                      collapsedTournaments[`${sportId}-${tournamentId}`];

                    return (
                      <div key={tournamentId} className="mb-4 ml-6">
                        <h3
                          onClick={() =>
                            toggleTournament(sportId, tournamentId)
                          }
                          className="text-xl font-medium mb-2 cursor-pointer flex justify-between items-center bg-gray-100 px-3 py-2 rounded"
                        >
                          {tGroup.tournamentName}
                          <span>{tourCollapsed ? "▼" : "▲"}</span>
                        </h3>

                        {!tourCollapsed && (
                          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {tGroup.teams.map((team) => (
                              <li key={team._id}>
                                <IndividualTeam
                                  title={team.name}
                                  image={team.imageUrl}
                                  _id={team._id}
                                  onDelete={handleDelete}
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
              </div>
            );
          })
        )}

        {/* Add Team button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-white shadow-md rounded-2xl p-6 flex items-center justify-center 
          text-2xl font-bold text-gray-700 hover:shadow-xl hover:scale-[1.02] 
          transition-all duration-300 cursor-pointer"
        >
          + Add Team
        </button>

        {/* Add Team Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-[90%] max-w-lg p-8 relative">
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    name: "",
                    city: "",
                    sport: "",
                    tournament: "",
                  });
                  setImage(null);
                  setPreview(null);
                  setTournamentData([]);
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
              >
                ✖
              </button>

              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                Add New Team
              </h2>

              <form
                onSubmit={handleOnSubmit}
                className="flex flex-col gap-6 items-center"
              >
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={handleOnChange}
                  placeholder="Enter team name"
                  className="w-full border border-gray-300 rounded-lg p-3 
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  name="city"
                  value={city}
                  onChange={handleOnChange}
                  placeholder="Enter team city"
                  className="w-full border border-gray-300 rounded-lg p-3 
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  name="sport"
                  value={sport}
                  onChange={handleOnChange}
                  className="w-full border border-gray-300 rounded-lg p-3 
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
                <select
                  name="tournament"
                  value={tournament}
                  onChange={handleOnChange}
                  className="w-full border border-gray-300 rounded-lg p-3 
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
                <label
                  htmlFor="imageUpload"
                  className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center 
                  cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-gray-500">Upload Logo</span>
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
                    className="border border-green-600 bg-green-500 px-6 py-2 rounded-lg  
                    hover:bg-green-600 hover:border-green-700 transition"
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
                        tournament: "",
                      });
                      setImage(null);
                      setPreview(null);
                      setTournamentData([]);
                    }}
                    className="border border-gray-500 bg-gray-400 px-6 py-2 rounded-lg 
                    hover:bg-gray-500 hover:border-gray-600 transition"
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
