import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import { leagueEndpoints } from "../services/apis";
import IndividualLeague from "../components/LeagueTile";
import { useSearchParams } from "react-router-dom";

const { GET_LEAGUE, CREATE_LEAGUE } = leagueEndpoints;

function League() {
    const [searchParams] = useSearchParams();
    const tournament = searchParams.get("tournament");
    const sport = searchParams.get("sport");
    console.log(tournament,sport);

    const [data, setData] = useState([]);
    const [showForm, setShowForm] = useState(false);

    // League form data
    const [leagueName, setLeagueName] = useState("");
    const [leagueYear, setLeagueYear] = useState(new Date().getFullYear());
    const [leagueLogo, setLeagueLogo] = useState(null);
    const [numTeams, setNumTeams] = useState(0);
    const [teams, setTeams] = useState([]);

    const fetchData = async () => {
        try {
            const response = await apiConnector("GET", GET_LEAGUE, null, null, {
                sport, tournament,
            });
            console.log(response.data.data)
            setData(response.data.data);
        } catch (error) {
            toast.error("Failed to fetch leagues");
            console.error("FETCH LEAGUE ERROR:", error);
        }
    };

    const handleNumTeamsChange = (e) => {
        const n = parseInt(e.target.value, 10);
        setNumTeams(n);
        // Reset teams array with n empty slots
        setTeams(
            Array.from({ length: n }, () => ({
                name: "",
                city: "",
                logo: null,
            }))
        );
    };

    const handleTeamChange = (index, field, value) => {
        const updatedTeams = [...teams];
        updatedTeams[index][field] = value;
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

            teams.forEach((team, idx) => {
                formDataObj.append(`teams[${idx}][name]`, team.name);
                formDataObj.append(`teams[${idx}][city]`, team.city);
                formDataObj.append(`teams[${idx}][position]`, idx + 1);
                if (team.logo) {
                    formDataObj.append(`teams[${idx}][image]`, team.logo);
                }
            });

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
            fetchData();
        } catch (error) {
            console.error("CREATE LEAGUE ERROR:", error);
            toast.error("League creation failed");
        } finally {
            toast.dismiss(toastId);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    {tournament}
                </h1>

                {/* Grid of leagues */}
                <ul className="grid grid-cols-1 gap-6 mb-6">
                    {data.map((league) => (
                        <li key={league._id}>
                            <IndividualLeague year={league.year} logo={league.leagueImageUrl} teams={league.teams} />
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
                        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4">Create New League</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    value={leagueName}
                                    onChange={(e) => setLeagueName(e.target.value)}
                                    placeholder="League Name"
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2"
                                />
                                <select
                                    value={leagueYear}
                                    onChange={(e) => setLeagueYear(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2"
                                    required
                                >
                                    {Array.from({ length: 200 }, (_, i) => new Date().getFullYear() - i).map(
                                        (year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        )
                                    )}
                                </select>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setLeagueLogo(e.target.files[0])}
                                    className="w-full border border-gray-300 rounded-lg p-2"
                                    required
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

                                {/* Teams section */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {teams.map((team, idx) => (
                                        <div
                                            key={idx}
                                            className="border rounded-lg p-4 bg-gray-50 space-y-2"
                                        >
                                            <h3 className="font-semibold text-center">Team {idx + 1}</h3>
                                            <input
                                                type="text"
                                                value={team.name}
                                                onChange={(e) => handleTeamChange(idx, "name", e.target.value)}
                                                placeholder="Team Name"
                                                className="w-full border border-gray-300 rounded-lg p-2"
                                                required
                                            />
                                            <input
                                                type="text"
                                                value={team.city}
                                                onChange={(e) => handleTeamChange(idx, "city", e.target.value)}
                                                placeholder="City"
                                                className="w-full border border-gray-300 rounded-lg p-2"
                                                required
                                            />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleTeamChange(idx, "logo", e.target.files[0])}
                                                className="w-full border border-gray-300 rounded-lg p-2"
                                                required
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
