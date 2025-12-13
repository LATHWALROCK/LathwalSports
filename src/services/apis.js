const BASE_URL = "https://lathwalsports-backend.onrender.com/api/v1"
//const BASE_URL = "http://localhost:4000/api/v1"

export const sportEndpoints = {
  CREATE_SPORT: BASE_URL + "/post/createSport",
  GET_SPORT: BASE_URL + "/post/getSport",
  UPDATE_SPORT: BASE_URL + "/post/updateSport",
  DELETE_SPORT: BASE_URL + "/post/deleteSport",
};

export const tournamentEndpoints = {
  CREATE_TOURNAMENT: BASE_URL + "/post/createTournament",
  GET_TOURNAMENT: BASE_URL + "/post/getTournament",
  GET_TOURNAMENT_BY_SPORT: BASE_URL + "/post/getTournamentBySport",
  GET_TOURNAMENT_BY_TOURNAMENT_ID: BASE_URL + "/post/getTournamentByTournamentId",
  UPDATE_TOURNAMENT: BASE_URL + "/post/updateTournament",
  DELETE_TOURNAMENT: BASE_URL + "/post/deleteTournament",
}

export const teamEndpoints = {
  CREATE_TEAM: BASE_URL + "/post/createTeam",
  GET_TEAM: BASE_URL + "/post/getTeam",
  GET_TEAM_BY_SPORT: BASE_URL + "/post/getTeamBySport",
  GET_TEAM_BY_SPORT_AND_TOURNAMENT: BASE_URL + "/post/getTeamBySportAndTournament",
  UPDATE_TEAM: BASE_URL + "/post/updateTeam",
  DELETE_TEAM: BASE_URL + "/post/deleteTeam",
}

export const leagueEndpoints = {
  CREATE_LEAGUE: BASE_URL + "/post/createLeague",
  GET_LEAGUE: BASE_URL + "/post/getLeague",
  UPDATE_LEAGUE: BASE_URL + "/post/updateLeague",
  DELETE_LEAGUE: BASE_URL + "/post/deleteLeague",
}