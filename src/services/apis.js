const BASE_URL = "https://lathwalsports-backend.onrender.com"

export const sportEndpoints = {
  CREATE_SPORT: BASE_URL + "/post/createSport",
  GET_SPORT: BASE_URL + "/post/getSport",
  DELETE_SPORT: BASE_URL + "/post/deleteSport",
};

export const tournamentEndpoints = {
  CREATE_TOURNAMENT: BASE_URL + "/post/createTournament",
  GET_TOURNAMENT: BASE_URL + "/post/getTournament",
  DELETE_TOURNAMENT: BASE_URL + "/post/deleteTournament",
}

export const teamEndpoints = {
  CREATE_TEAM: BASE_URL + "/post/createTeam",
  GET_TEAM: BASE_URL + "/post/getTeam",
  DELETE_TEAM: BASE_URL + "/post/deleteTeam",
}

export const leagueEndpoints = {
  CREATE_LEAGUE: BASE_URL + "/post/createLeague",
  GET_LEAGUE: BASE_URL + "/post/getLeague",
  DELETE_LEAGUE: BASE_URL + "/post/deleteLeague",
}