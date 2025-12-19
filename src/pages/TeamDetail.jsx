import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import {
  teamEndpoints,
  leagueEndpoints,
} from "../services/apis";

const {
  GET_TEAM_BY_ID,
  GET_TEAMS_BY_CITY_AND_SPORT,
  GET_TEAMS_BY_COUNTRY_AND_SPORT,
} = teamEndpoints;
const { GET_LEAGUE_BY_TEAM } = leagueEndpoints;

function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [relatedTeams, setRelatedTeams] = useState([]);
  const [wonEditions, setWonEditions] = useState([]);
  const [runnerUpEditions, setRunnerUpEditions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch team by ID
      const teamResponse = await apiConnector("GET", GET_TEAM_BY_ID, null, null, { _id: id });
      const teamData = teamResponse.data.data;
      setTeam(teamData);

      let relatedTeamsData = [];

      // Fetch related teams based on type (all teams from same city/country and sport)
      if (teamData.type === "League" && teamData.city && teamData.sport?._id) {
        const relatedResponse = await apiConnector(
          "GET",
          GET_TEAMS_BY_CITY_AND_SPORT,
          null,
          null,
          { city: teamData.city, sport: teamData.sport._id }
        );
        relatedTeamsData = relatedResponse.data.data;
        setRelatedTeams(relatedTeamsData);
      } else if (teamData.type === "National" && teamData.country && teamData.sport?._id) {
        const relatedResponse = await apiConnector(
          "GET",
          GET_TEAMS_BY_COUNTRY_AND_SPORT,
          null,
          null,
          { country: teamData.country, sport: teamData.sport._id }
        );
        relatedTeamsData = relatedResponse.data.data;
        setRelatedTeams(relatedTeamsData);
      }

      // Fetch leagues where ALL related teams participated
      if (relatedTeamsData.length > 0) {
        const allTeamIds = relatedTeamsData.map(t => t._id);
        const allLeaguesPromises = allTeamIds.map(teamId =>
          apiConnector("GET", GET_LEAGUE_BY_TEAM, null, null, { teamId })
        );

        const leaguesResponses = await Promise.all(allLeaguesPromises);
        const allLeagues = leaguesResponses.flatMap(response => response.data.data || []);

        // Remove duplicates based on league _id
        const uniqueLeagues = allLeagues.filter((league, index, self) =>
          index === self.findIndex(l => l._id === league._id)
        );

        // Filter leagues where any of the related teams won (position 1)
        const won = uniqueLeagues.filter(league => {
          return league.teams.some(teamEntry => {
            const teamId = teamEntry.team?._id || teamEntry.team;
            return allTeamIds.includes(teamId?.toString()) && teamEntry.position === 1;
          });
        });
        setWonEditions(won);

        // Filter leagues where any of the related teams was runner-up (position 2)
        const runnerUp = uniqueLeagues.filter(league => {
          return league.teams.some(teamEntry => {
            const teamId = teamEntry.team?._id || teamEntry.team;
            return allTeamIds.includes(teamId?.toString()) && teamEntry.position === 2;
          });
        });
        setRunnerUpEditions(runnerUp);
      }

    } catch (error) {
      console.error("FETCH TEAM DETAIL ERROR:", error);
      toast.error("Failed to fetch team details");
      navigate("/teams");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchTeamData();
    }
  }, [id, fetchTeamData]);

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-white to-gray-50 text-black py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="bg-gradient-to-b from-white to-gray-50 text-black py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p>Team not found</p>
          <button
            onClick={() => navigate("/teams")}
            className="mt-4 border border-black bg-gray-100 text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 text-black py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Get latest active team name */}
        {(() => {
          const activeTeams = relatedTeams.filter(t => !t.inactive);
          const latestActive = activeTeams.length > 0 ? activeTeams[0] : team; // fallback to current team
          return <h1 className="text-5xl font-bold text-center mb-8">{latestActive.name}</h1>;
        })()}

        {/* Section 1: All Team Logos (versions) side by side */}
        {relatedTeams.length > 0 && (
          <div className="mb-12">
            <div className="bg-gray-100 rounded-2xl p-8">
              <div className="flex flex-wrap gap-8 justify-center items-center">
              {relatedTeams.map((relatedTeam) => (
                <div
                  key={relatedTeam._id}
                  className={`flex-shrink-0 ${relatedTeam.inactive ? 'opacity-50 grayscale' : ''}`}
                >
                  <img
                    src={relatedTeam.imageUrl}
                    alt={relatedTeam.name}
                    className="h-44 w-44 object-contain"
                  />
                </div>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Tournament Editions Won */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Tournament Editions Won ({wonEditions.length})</h2>
          {wonEditions.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {wonEditions.map((league) => (
                <div
                  key={league._id}
                  className="bg-gray-100 shadow-md rounded-2xl p-4 flex flex-col items-center justify-between hover:bg-gray-200 hover:scale-105 transition-all duration-300"
                >
                  <div className="w-full h-32 flex items-center justify-center p-1 bg-white rounded-lg mb-2">
                    <img
                      src={league.leagueImageUrl}
                      alt={league.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-center text-sm font-semibold">{league.name}</p>
                  <p className="text-center text-xs text-gray-600">{league.year}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tournament editions won yet</p>
          )}
        </div>

        {/* Section 3: Tournament Editions Runner-Up */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Tournament Editions Runner-Up ({runnerUpEditions.length})</h2>
          {runnerUpEditions.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {runnerUpEditions.map((league) => (
                <div
                  key={league._id}
                  className="bg-gray-100 shadow-md rounded-2xl p-4 flex flex-col items-center justify-between hover:bg-gray-200 hover:scale-105 transition-all duration-300"
                >
                  <div className="w-full h-32 flex items-center justify-center p-1 bg-white rounded-lg mb-2">
                    <img
                      src={league.leagueImageUrl}
                      alt={league.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-center text-sm font-semibold">{league.name}</p>
                  <p className="text-center text-xs text-gray-600">{league.year}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tournament editions runner-up yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamDetail;

