import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import { leagueEndpoints, teamEndpoints, tournamentEndpoints } from "../services/apis";
import IndividualLeague from "../components/LeagueTile";
import { useSearchParams } from "react-router-dom";
import Select from "react-select";

const { GET_TEAM_BY_SPORT_AND_TOURNAMENT } = teamEndpoints;
const { GET_LEAGUE, CREATE_LEAGUE, DELETE_LEAGUE } = leagueEndpoints;
const {GET_TOURNAMENT_BY_TOURNAMENT_ID} = tournamentEndpoints;

function League() {
  const [searchParams] = useSearchParams();
  const tournament = searchParams.get("tournament");
  const sport = searchParams.get("sport");

  const [data, setData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [tournamentData, setTournamentData] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // League form data
  const [leagueName, setLeagueName] = useState("");
  const [leagueYear, setLeagueYear] = useState(new Date().getFullYear());
  const [leagueLogo, setLeagueLogo] = useState(null);
  const [numTeams, setNumTeams] = useState(0);
  const [teams, setTeams] = useState([]);
  const [jointWinner, setJointWinner] = useState(false); // ✅ New state

  // Fetch teams
  const fetchTeamData = async () => {
    try {
      const response = await apiConnector("GET", GET_TEAM_BY_SPORT_AND_TOURNAMENT,null,null,{sport,tournament});
      setTeamData(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch teams");
      console.error("FETCH TEAMS ERROR:", error);
    }
  };

  const fetchTournamentData = async () => {
    try {
      const response = await apiConnector("GET", GET_TOURNAMENT_BY_TOURNAMENT_ID,null,null,{_id: tournament});
      setTournamentData(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch teams");
      console.error("FETCH TEAMS ERROR:", error);
    }
  };

  // Fetch leagues
  const fetchData = async () => {
    try {
      const response = await apiConnector("GET", GET_LEAGUE, null, null, { sport, tournament });
      setData(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch leagues");
      console.error("FETCH LEAGUE ERROR:", error);
    }
  };

  const handleNumTeamsChange = (e) => {
    const n = parseInt(e.target.value, 10);
    setNumTeams(n);
    setTeams(Array.from({ length: n }, () => ({ teamId: "", position: "" })));
  };

  const handleTeamChange = (index, value) => {
    const updatedTeams = [...teams];
    updatedTeams[index].teamId = value;
    setTeams(updatedTeams);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Creating league...");

    try {
      const formDataObj = new FormData();
      formDataObj.append("name", leagueName);
      formDataObj.append("year", leagueYear);
      formDataObj.append("sport", sport);
      formDataObj.append("tournament", tournament);
      formDataObj.append("image", leagueLogo);

      // ✅ Handle positions based on jointWinner
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

      const response = await apiConnector("POST", CREATE_LEAGUE, formDataObj, {
        "Content-Type": "multipart/form-data",
      });

      if (!response.data.success) throw new Error(response.data.message);

      toast.success("League created successfully");
      setShowForm(false);
      setLeagueName("");
      setLeagueLogo(null);
      setNumTeams(0);
      setTeams([]);
      setJointWinner(false);
      fetchData();
    } catch (error) {
      console.error("CREATE LEAGUE ERROR:", error);
      toast.error("League creation failed");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleDelete = async (name, _id) => {
    const toastId = toast.loading("Deleting league...");
    try {
      const response = await apiConnector("DELETE", DELETE_LEAGUE, { name, _id });
      if (!response.data.success) throw new Error(response.data.message);

      toast.success("League deleted successfully");
      fetchData();
    } catch (error) {
      console.error("DELETE League ERROR:", error);
      toast.error("League deletion failed");
    } finally {
      toast.dismiss(toastId);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTeamData();
    fetchTournamentData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          {tournamentData[0]?.name}
        </h1>

        {/* Grid of leagues */}
        <ul className="grid grid-cols-1 gap-6 mb-6">
          {data.map((league) => (
            <li key={league._id}>
              <IndividualLeague
                title={league.name}
                logo={league.leagueImageUrl}
                teams={league.teams}
                _id={league._id}
                onDelete={handleDelete}
              />
            </li>
          ))}
        </ul>

        {/* Add League button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-white shadow-md rounded-2xl p-6 flex items-center justify-center 
             text-2xl font-bold text-gray-700 hover:shadow-xl hover:scale-[1.02] 
             transition-all duration-300 cursor-pointer"
        >
          + Add League
        </button>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Create New League</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Two column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side */}
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={leagueName}
                      onChange={(e) => setLeagueName(e.target.value)}
                      placeholder="League Name"
                      required
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />

                    <input
                      type="number"
                      value={leagueYear}
                      onChange={(e) => setLeagueYear(e.target.value)}
                      placeholder="Year"
                      required
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />

                    <input
                      type="number"
                      min="1"
                      value={numTeams}
                      onChange={handleNumTeamsChange}
                      placeholder="Number of Teams"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      required
                    />

                    {/* ✅ Joint Winner Checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="jointWinner"
                        checked={jointWinner}
                        onChange={(e) => setJointWinner(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="jointWinner" className="text-gray-700">
                        Joint Winner (Top 2 teams share position 1)
                      </label>
                    </div>
                  </div>

                  {/* Right side (Image Upload + Preview) */}
                  <div className="flex flex-col items-center justify-center">
                    <label
                      htmlFor="leagueLogo"
                      className="w-40 h-40 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
                    >
                      {leagueLogo ? (
                        <img
                          src={URL.createObjectURL(leagueLogo)}
                          alt="League Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 text-sm">
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
                      className="border rounded-lg p-4 bg-gray-50 space-y-2"
                    >
                      <h3 className="font-semibold text-center">
                        Team {idx + 1}
                      </h3>
                      <Select
                        options={teamData.map((team) => ({
                          value: team._id,
                          label: team.name,
                        }))}
                        onChange={(selected) =>
                          handleTeamChange(idx, selected ? selected.value : "")
                        }
                        placeholder="Select a Team..."
                        isSearchable
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="border border-gray-500 bg-gray-400 px-4 py-2 rounded-lg 
                       hover:bg-gray-500 hover:border-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="border border-green-600 bg-green-500 px-4 py-2 rounded-lg 
                       hover:bg-green-600 hover:border-green-700 transition"
                  >
                    Save League
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