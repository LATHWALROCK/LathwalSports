const BASE_URL = "http://localhost:4000/api/v1"

export const sportEndpoints = {
  CREATE_SPORT: BASE_URL + "/post/createSport",
  GET_SPORT: BASE_URL + "/post/getSport",
}

export const tournamentEndpoints = {
  CREATE_TOURNAMENT: BASE_URL + "/post/createTournament",
  GET_TOURNAMENT: BASE_URL + "/post/getTournament",
}

export const leagueEndpoints = {
  CREATE_LEAGUE: BASE_URL + "/post/createLeague",
  GET_LEAGUE: BASE_URL + "/post/getLeague",
}