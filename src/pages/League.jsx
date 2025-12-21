import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import { leagueEndpoints, teamEndpoints, tournamentEndpoints, sportEndpoints } from "../services/apis";
import IndividualLeague from "../components/LeagueTile";
import { useSearchParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import { ArrowLeft } from "lucide-react";

const { GET_TEAM_BY_SPORT_AND_TOURNAMENT } = teamEndpoints; // eslint-disable-line no-undef
const { GET_LEAGUE, CREATE_LEAGUE, UPDATE_LEAGUE, DELETE_LEAGUE } = leagueEndpoints;
const { GET_TOURNAMENT_BY_TOURNAMENT_ID } = tournamentEndpoints;
const { GET_SPORT } = sportEndpoints;

function League() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tournament = searchParams.get("tournament");
  const sport = searchParams.get("sport");
  const type = searchParams.get("type");

  const [data, setData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [tournamentData, setTournamentData] = useState([]);
  const [sportData, setSportData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // League form data
  const [leagueName, setLeagueName] = useState("");
  const [leagueYear, setLeagueYear] = useState(new Date().getFullYear());
  const [leagueLogo, setLeagueLogo] = useState(null);
  const [numTeams, setNumTeams] = useState(0);
  const [teams, setTeams] = useState([]);
  const [jointWinner, setJointWinner] = useState(false); // ✅ New state

  // Edit form data
  const [editLeagueName, setEditLeagueName] = useState("");
  const [editLeagueYear, setEditLeagueYear] = useState(new Date().getFullYear());
  const [editLeagueLogo, setEditLeagueLogo] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [editNumTeams, setEditNumTeams] = useState(0);
  const [editTeams, setEditTeams] = useState([]);
  const [editJointWinner, setEditJointWinner] = useState(false);
  const [editLeagueId, setEditLeagueId] = useState("");


  // Fetch teams
  const fetchTeamData = useCallback(async () => {
    try {
      // For international tournaments, get national teams by sport
      // For league tournaments, get league teams by sport and tournament
      const endpoint = tournamentData[0]?.type === "International"
        ? GET_TEAM_BY_SPORT // eslint-disable-line no-undef
        : GET_TEAM_BY_SPORT_AND_TOURNAMENT; // eslint-disable-line no-undef

      const queryParams = tournamentData[0]?.type === "International"
        ? { sport }
        : { sport, tournament };

      const response = await apiConnector("GET", endpoint, null, null, queryParams);
      setTeamData(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch teams");
      console.error("FETCH TEAMS ERROR:", error);
    }
  }, [sport, tournament, tournamentData]);

  const fetchSportData = useCallback(() => {
    apiConnector("GET", GET_SPORT)
      .then((response) => {
        setSportData(response.data.data);
      })
      .catch((error) => {
        console.error("FETCH SPORTS ERROR:", error);
      });
  }, []);

  const fetchTournamentData = useCallback(async () => {
    try {
      const response = await apiConnector("GET", GET_TOURNAMENT_BY_TOURNAMENT_ID,null,null,{_id: tournament});
      setTournamentData(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch tournament");
      console.error("FETCH TOURNAMENT ERROR:", error);
    }
  }, [tournament]);

  // Fetch leagues
  const fetchData = useCallback(async () => {
    try {
      const response = await apiConnector("GET", GET_LEAGUE, null, null, { sport, tournament });
      setData(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch editions");
      console.error("FETCH LEAGUE ERROR:", error);
    }
  }, [sport, tournament]);


  const handleNumTeamsChange = (e) => {
    const n = parseInt(e.target.value, 10) || 0;
    setNumTeams(n);
    if (n > 0) {
      setTeams(Array.from({ length: n }, () => ({ teamId: "", position: "" })));
    } else {
      setTeams([]);
    }
  };

  const handleTeamChange = (index, value) => {
    const updatedTeams = [...teams];
    updatedTeams[index].teamId = value;
    setTeams(updatedTeams);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const editionType = getEditionType();
    const toastId = toast.loading(`Creating ${editionType.toLowerCase()}...`);

    try {
      const formDataObj = new FormData();
      formDataObj.append("name", leagueName);
      formDataObj.append("year", leagueYear);
      formDataObj.append("sport", sport);
      formDataObj.append("tournament", tournament);
      formDataObj.append("image", leagueLogo);

      // ✅ Handle positions based on jointWinner (only if teams are selected)
      if (teams.length > 0) {
        if (jointWinner && teams.length >= 2) {
          // First two teams are joint winners
          formDataObj.append(`teams[0][team]`, teams[0].teamId);
          formDataObj.append(`teams[0][position]`, 1);
          formDataObj.append(`teams[1][team]`, teams[1].teamId);
          formDataObj.append(`teams[1][position]`, 1);

          // Rest start from position 3
          for (let i = 2; i < teams.length; i++) {
            formDataObj.append(`teams[${i}][team]`, teams[i].teamId);
            formDataObj.append(`teams[${i}][position]`, i + 1); // skipping 2
          }
        } else {
          // Normal case (no joint winners)
          teams.forEach((team, idx) => {
            formDataObj.append(`teams[${idx}][team]`, team.teamId);
            formDataObj.append(`teams[${idx}][position]`, idx + 1);
          });
        }
      }

      const response = await apiConnector("POST", CREATE_LEAGUE, formDataObj, {
        "Content-Type": "multipart/form-data",
      });

      if (!response.data.success) throw new Error(response.data.message);

      toast.success(`${editionType} created successfully`);
      setShowForm(false);
      setLeagueName("");
      setLeagueLogo(null);
      setNumTeams(0);
      setTeams([]);
      setJointWinner(false);
      fetchData();
    } catch (error) {
      console.error("CREATE LEAGUE ERROR:", error);
      toast.error(`${editionType} creation failed`);
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleDelete = async (name, _id) => {
    const editionType = getEditionType();
    const toastId = toast.loading(`Deleting ${editionType.toLowerCase()}...`);
    try {
      const response = await apiConnector("DELETE", DELETE_LEAGUE, { name, _id });
      if (!response.data.success) throw new Error(response.data.message);

      toast.success(`${editionType} deleted successfully`);
      fetchData();
    } catch (error) {
      console.error("DELETE League ERROR:", error);
      toast.error(`${editionType} deletion failed`);
    } finally {
      toast.dismiss(toastId);
    }
  };

  // Edit handlers
  const handleEdit = (_id, leagueData) => {
    setEditLeagueId(_id);
    setEditLeagueName(leagueData.name || "");
    setEditLeagueYear(leagueData.year || new Date().getFullYear());
    setEditPreview(leagueData.leagueImageUrl || null);
    setEditNumTeams(leagueData.teams?.length || 0);
    setEditJointWinner(leagueData.teams?.filter(t => t.position === 1).length > 1 || false);
    
    // Populate teams array with existing data
    const sortedTeams = [...(leagueData.teams || [])].sort((a, b) => a.position - b.position);
    setEditTeams(sortedTeams.map(t => ({
      teamId: t.team?._id || "",
      position: t.position || ""
    })));
    
    setShowEditForm(true);
  };

  const handleEditNumTeamsChange = (e) => {
    const n = parseInt(e.target.value, 10) || 0;
    setEditNumTeams(n);
    // If we have existing teams, preserve them; otherwise create new array
    if (n === 0) {
      setEditTeams([]);
    } else if (editTeams.length === 0) {
      setEditTeams(Array.from({ length: n }, () => ({ teamId: "", position: "" })));
    } else {
      // Adjust array length while preserving existing data
      const newTeams = [...editTeams];
      if (n > editTeams.length) {
        // Add empty entries
        for (let i = editTeams.length; i < n; i++) {
          newTeams.push({ teamId: "", position: "" });
        }
      } else if (n < editTeams.length) {
        // Remove extra entries
        newTeams.splice(n);
      }
      setEditTeams(newTeams);
    }
  };

  const handleEditTeamChange = (index, value) => {
    const updatedTeams = [...editTeams];
    updatedTeams[index].teamId = value;
    setEditTeams(updatedTeams);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditLeagueLogo(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const editionType = getEditionType();
    const toastId = toast.loading(`Updating ${editionType.toLowerCase()}...`);

    try {
      const formDataObj = new FormData();
      formDataObj.append("_id", editLeagueId);
      formDataObj.append("name", editLeagueName);
      formDataObj.append("year", editLeagueYear);
      formDataObj.append("sport", sport);
      formDataObj.append("tournament", tournament);
      if (editLeagueLogo) {
        formDataObj.append("image", editLeagueLogo);
      }

      // Handle positions based on jointWinner (only if teams are selected)
      if (editTeams.length > 0) {
        if (editJointWinner && editTeams.length >= 2) {
          formDataObj.append(`teams[0][team]`, editTeams[0].teamId);
          formDataObj.append(`teams[0][position]`, 1);
          formDataObj.append(`teams[1][team]`, editTeams[1].teamId);
          formDataObj.append(`teams[1][position]`, 1);

          for (let i = 2; i < editTeams.length; i++) {
            formDataObj.append(`teams[${i}][team]`, editTeams[i].teamId);
            formDataObj.append(`teams[${i}][position]`, i + 1);
          }
        } else {
          editTeams.forEach((team, idx) => {
            formDataObj.append(`teams[${idx}][team]`, team.teamId);
            formDataObj.append(`teams[${idx}][position]`, idx + 1);
          });
        }
      }

      const response = await apiConnector("PUT", UPDATE_LEAGUE, formDataObj, {
        "Content-Type": "multipart/form-data",
      });

      if (!response.data.success) throw new Error(response.data.message);

      toast.success(`${editionType} updated successfully`);
      setShowEditForm(false);
      setEditLeagueId("");
      setEditLeagueName("");
      setEditLeagueYear(new Date().getFullYear());
      setEditLeagueLogo(null);
      setEditPreview(null);
      setEditNumTeams(0);
      setEditTeams([]);
      setEditJointWinner(false);
      fetchData();
    } catch (error) {
      console.error("UPDATE LEAGUE ERROR:", error);
      toast.error(`${editionType} update failed`);
    } finally {
      toast.dismiss(toastId);
    }
  };

  const getEditionType = () => {
    return tournamentData[0]?.type === "International" ? "Tournament Edition" : "League Edition";
  };



  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchData(),
        fetchTournamentData(),
        fetchSportData()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchData, fetchTournamentData, fetchSportData]);

  // Separate useEffect for fetching teams when tournament data is available
  useEffect(() => {
    if (tournamentData.length > 0) {
      fetchTeamData();
    }
  }, [tournamentData, fetchTeamData]);

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 text-black py-10 px-4 relative">
      {/* Back Button - Top Left Corner */}
      <button
        onClick={() => navigate(`/tournament?sport=${sport}&type=${type}&tournament=${tournament}`)}
        className="fixed top-20 left-6 bg-gray-100 shadow-md rounded-lg p-3 text-black
                   hover:bg-gray-200 transition-colors duration-300 z-10"
        title="Back to Tournament"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          {tournamentData[0]?.name}
        </h1>

        {/* Grid of editions */}
        <ul className="grid grid-cols-1 gap-6 mb-6">
          {data.map((league) => (
            <li key={league._id}>
              <IndividualLeague
                title={league.name}
                logo={league.leagueImageUrl}
                teams={league.teams}
                _id={league._id}
                onDelete={handleDelete}
                onEdit={handleEdit}
                leagueData={league}
              />
            </li>
          ))}
          {/* Add League Tile */}
          <li>
            <div
              onClick={() => setShowForm(true)}
              className="bg-gray-100 shadow-md rounded-2xl p-6 flex items-center justify-center
                         text-6xl font-bold text-gray-400 hover:bg-gray-200 hover:text-gray-600
                         hover:scale-105 transition-all duration-300 cursor-pointer h-full min-h-[120px]"
              title="Add League Edition"
            >
              +
            </div>
          </li>
        </ul>

        {/* Modal Form */}
        {showForm && !loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black rounded-2xl shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto ring-1 ring-black">
              <h2 className="text-2xl font-bold mb-4">
                Create New {getEditionType()}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Display Sport and Tournament */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-3">
                    <label className="text-sm text-gray-600">Sport:</label>
                    <p className="font-semibold">{Array.isArray(sportData) ? sportData.find(s => s._id === sport)?.name || "" : ""}</p>
                  </div>
                  <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-3">
                    <label className="text-sm text-gray-600">Tournament:</label>
                    <p className="font-semibold">{tournamentData?.[0]?.name || ""}</p>
                  </div>
                </div>

                {/* Two column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side */}
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={leagueName}
                      onChange={(e) => setLeagueName(e.target.value)}
                      placeholder={`${getEditionType()} Name`}
                      required
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2"
                    />

                    <input
                      type="number"
                      value={leagueYear}
                      onChange={(e) => setLeagueYear(e.target.value)}
                      placeholder="Year"
                      required
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2"
                    />

                    <input
                      type="number"
                      min="0"
                      value={numTeams}
                      onChange={handleNumTeamsChange}
                      placeholder="Number of Teams (0 for no teams)"
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2"
                    />

                    {/* ✅ Joint Winner Checkbox - only show if numTeams > 0 */}
                    {numTeams > 0 && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="jointWinner"
                          checked={jointWinner}
                          onChange={(e) => setJointWinner(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="jointWinner" className="">
                          Joint Winner (Top 2 teams share position 1)
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Right side (Image Upload + Preview) */}
                  <div className="flex flex-col items-center justify-center">
                    <label
                      htmlFor="leagueLogo"
                      className="w-40 h-40 border-2 border-dashed border-black rounded-lg flex items-center justify-center cursor-pointer overflow-hidden text-gray-500"
                    >
                      {leagueLogo ? (
                        <img
                          src={URL.createObjectURL(leagueLogo)}
                          alt={`${getEditionType()} Logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">
                          Click to Upload Logo
                        </span>
                      )}
                      <input
                        type="file"
                        id="leagueLogo"
                        accept="image/*"
                        onChange={(e) => setLeagueLogo(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* ✅ Teams Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: numTeams }).map((_, idx) => (
                    <div
                      key={idx}
                      className="border border-black rounded-lg p-4 bg-gray-50 space-y-2"
                    >
                      <h3 className="font-semibold text-center">
                        Team {idx + 1}
                      </h3>
                      <Select
                        options={teamData
                          .filter((team) => !team.inactive)
                          .map((team) => ({
                            value: team._id,
                            label: team.name,
                          }))}
                        onChange={(selected) =>
                          handleTeamChange(idx, selected ? selected.value : "")
                        }
                        placeholder="Select a Team..."
                        isSearchable
                        className="text-sm"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: 'white',
                            borderColor: '#d1d5db',
                            color: 'black',
                            '&:hover': {
                              borderColor: '#9ca3af',
                            },
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: 'white',
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? '#f3f4f6' : 'white',
                            color: 'black',
                            '&:active': {
                              backgroundColor: '#e5e7eb',
                            },
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: 'black',
                          }),
                          input: (base) => ({
                            ...base,
                            color: 'black',
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: '#6b7280',
                          }),
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
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
                    Save {getEditionType()}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal Form */}
        {showEditForm && !loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white text-black rounded-2xl shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto ring-1 ring-black">
              <h2 className="text-2xl font-bold mb-4">
                Edit {getEditionType()}
              </h2>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                {/* Display Sport and Tournament */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-3">
                    <label className="text-sm text-gray-600">Sport:</label>
                    <p className="font-semibold">{Array.isArray(sportData) ? sportData.find(s => s._id === sport)?.name || "" : ""}</p>
                  </div>
                  <div className="w-full border border-black bg-gray-50 text-black rounded-lg p-3">
                    <label className="text-sm text-gray-600">Tournament:</label>
                    <p className="font-semibold">{tournamentData?.[0]?.name || ""}</p>
                  </div>
                </div>

                {/* Two column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side */}
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editLeagueName}
                      onChange={(e) => setEditLeagueName(e.target.value)}
                      placeholder={`${getEditionType()} Name`}
                      required
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2"
                    />

                    <input
                      type="number"
                      value={editLeagueYear}
                      onChange={(e) => setEditLeagueYear(e.target.value)}
                      placeholder="Year"
                      required
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2"
                    />

                    <input
                      type="number"
                      min="0"
                      value={editNumTeams}
                      onChange={handleEditNumTeamsChange}
                      placeholder="Number of Teams (0 for no teams)"
                      className="w-full border border-black bg-white text-black placeholder:text-gray-500 rounded-lg p-2"
                    />

                    {/* Joint Winner Checkbox - only show if editNumTeams > 0 */}
                    {editNumTeams > 0 && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="editJointWinner"
                          checked={editJointWinner}
                          onChange={(e) => setEditJointWinner(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="editJointWinner" className="">
                          Joint Winner (Top 2 teams share position 1)
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Right side (Image Upload + Preview) */}
                  <div className="flex flex-col items-center justify-center">
                    <label
                      htmlFor="editLeagueLogo"
                      className="w-40 h-40 border-2 border-dashed border-black rounded-lg flex items-center justify-center cursor-pointer overflow-hidden text-gray-500"
                    >
                      {editPreview ? (
                        <img
                          src={editPreview}
                          alt={`${getEditionType()} Logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">
                          Click to Upload Logo
                        </span>
                      )}
                      <input
                        type="file"
                        id="editLeagueLogo"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Teams Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: editNumTeams }).map((_, idx) => (
                    <div
                      key={idx}
                      className="border border-black rounded-lg p-4 bg-gray-50 space-y-2"
                    >
                      <h3 className="font-semibold text-center">
                        Team {idx + 1}
                      </h3>
                      <Select
                        options={teamData
                          .filter((team) => !team.inactive)
                          .map((team) => ({
                            value: team._id,
                            label: team.name,
                          }))}
                        value={editTeams[idx]?.teamId ? {
                          value: editTeams[idx].teamId,
                          label: teamData.find(t => t._id === editTeams[idx].teamId)?.name || ""
                        } : null}
                        onChange={(selected) =>
                          handleEditTeamChange(idx, selected ? selected.value : "")
                        }
                        placeholder="Select a Team..."
                        isSearchable
                        className="text-sm"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: 'white',
                            borderColor: '#d1d5db',
                            color: 'black',
                            '&:hover': {
                              borderColor: '#9ca3af',
                            },
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: 'white',
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? '#f3f4f6' : 'white',
                            color: 'black',
                            '&:active': {
                              backgroundColor: '#e5e7eb',
                            },
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: 'black',
                          }),
                          input: (base) => ({
                            ...base,
                            color: 'black',
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: '#6b7280',
                          }),
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditLeagueId("");
                      setEditLeagueName("");
                      setEditLeagueYear(new Date().getFullYear());
                      setEditLeagueLogo(null);
                      setEditPreview(null);
                      setEditNumTeams(0);
                      setEditTeams([]);
                      setEditJointWinner(false);
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
                    Update {getEditionType()}
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

export default League;
