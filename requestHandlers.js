/*
 * Copyright 2014 MTRamin
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var data = require("./data");
var updating = require("./updating");
var logger = require("./logger");
var nfldata = require("./nfldata");

function Response() {
	this.status = null;
	this.data = { };
}

function Token(token) {
	this.token = token;
}

/**
 * Sends a valid response and creates it from the data provided
 */
function responseValid(response, data) {
	message = new Response();
	message.status = "valid";
	message.data = data;

	response.writeHead(200, {"Content-Type": "text/plain"});
	response.write(JSON.stringify(message));
	response.end();
}

/**
 * Sends an error response and creates it from the data provided
 */
function responseError(response, message) {
	message = new Response();
	message.status = "error";

	response.writeHead(200, {"Content-Type": "text/plain"});
	response.write(JSON.stringify(message));
	response.end();
}

/**
 * Sends a fail response and creates it from the data provided
 */
function responseFail(response, key, info) {	
	message = new Response();
	message.status = "fail";
	message.data = {key : info};

	response.writeHead(200, {"Content-Type": "text/plain"});
	response.write(JSON.stringify(message));
	response.end();
}


/**
 * Contains all the API URLs the clients can call to obtain data
 * Each requestHandler authenticates the provided user token before 
 * returning data to the client
 */
module.exports = function(app, passport) {

	//	===============
	//	Games
	//	===============
	app.post('/api/games/get', function (request, response, next) {
		passport.authenticate('authenticate', function (err, user, info) {
			logger.info(user + " called /api/games/get");

			if (err) {
				logger.err(err);
				responseError(response, err);
				return next(err);
			}

			if (!user) {
				responseFail(response, "token", "User can't be autenticated");
				return;
			}

			var season = request.body.season;
			var week = request.body.week;
			var type = request.body.type;

			data.requestGames(season, week, type, function(err, games) {
				if (err) {
					logger.err(err);
					return next(err);
				}
				
				responseValid(response, games);
				
			});
		})(request, response, next);
	});

	app.post('/api/games/seasoninfo', function (request, response, next) {
		passport.authenticate('authenticate', function (err, user, info) {
			logger.info(user + " called /api/games/seasoninfo");

			if (err) {
				logger.err(err);
				responseError(response, err);
				return next(err);
			}

			if (!user) {
				responseFail(response, "token", "User can't be autenticated");
				return;
			}

			responseValid(response, nfldata.getSeasonInfo());

		})(request, response, next);
	});

	app.post('/api/games/perweek', function (request, response, next) {

		passport.authenticate('authenticate', function (err, user, info) {
			logger.info(user + " called /api/games/perweek");

			if (err) {
				logger.err(err);
				responseError(response, err);
				return next(err);
			}

			if (!user) {
				responseFail(response, "token", "User can't be autenticated");
				return;
			}

			data.getGamesPerWeek(function(err, gamesPerWeek) {
				if (err) {
					logger.err(err);
					return next(err);
				}
				
				responseValid(response, gamesPerWeek);
				
			});
		})(request, response, next);
	});

	//	===============
	// 	Highscores
	//	===============
	app.post('/api/scores/user', function (request, response, next) {
		passport.authenticate('authenticate', function (err, user, info) {
			logger.info(user + " called /api/scores/user");

			if (err) {
				logger.err(err);
				responseError(response, err);
				return next(err);
			}

			if (!user) {
				responseFail(response, "token", "User can't be autenticated");
				return;
			}
			
			var user = request.body.user;
			var season = request.body.season;
			var type = request.body.type;

			data.findScoreForUser(user, season, type, function (err, message) {
				if (err) {
					logger.err(err);
					return next(err);
				}

				responseValid(response, message);
			});

		})(request, response, next);
	});

	app.post('/api/scores/highscores', function (request, response, next) {
		passport.authenticate('authenticate', function (err, user, info) {
			logger.info(user + " called /api/scores/highscores");

			if (err) {
				logger.err(err);
				responseError(response, err);
				return next(err);
			}

			if (!user) {
				responseFail(response, "token", "User can't be autenticated");
				return;
			}

			data.getHighscores(function (err, highscores) {
				if (err) {
					logger.err(err);
					return next(err);
				}

				responseValid(response, highscores);
			});
			
		})(request, response, next);
	});

	app.post('/api/scores/week', function (request, response, next) {
		passport.authenticate('authenticate', function (err, user, info) {
			logger.info(user + " called /api/scores/highscores");

			if (err) {
				logger.err(err);
				responseError(response, err);
				return next(err);
			}

			if (!user) {
				responseFail(response, "token", "User can't be autenticated");
				return;
			}

			var season = request.body.season;
			var type = request.body.type;
			var week = request.body.week;

			data.getScoresForWeek(season, type, week, function (err, highscores) {
				if (err) {
					logger.err(err);
					return next(err);
				}

				responseValid(response, highscores);
			});
			
		})(request, response, next);
	});

	app.post('/api/scores/teams', function (request, response, next) {
		passport.authenticate('authenticate', function (err, user, info) {
			logger.info(user + " called /api/scores/teams");

			if (err) {
				logger.err(err);
				responseError(response, err);
				return next(err);
			}

			if (!user) {
				responseFail(response, "token", "User can't be autenticated");
				return;
			}

			data.getTeamScores(function (err, scores) {
				if (err) {
					logger.err(err);
					return next(err);
				}

				responseValid(response, scores);
			});
			
		})(request, response, next);
	});

	//	===============
	// 	Picks
	//	===============
	app.post('/api/picks/pick', function (request, response, next) {
		passport.authenticate('authenticate', function (err, user, info) {
			logger.info(user + " called /api/picks/pick");

			if (err) {
				logger.err(err);
				responseError(response, err);
				return next(err);
			}

			if (!user) {
				responseFail(response, "token", "User can't be autenticated");
				return;
			}

			var game = request.body.game;
			var pick = request.body.pick;
			var user = user;

			data.insertPick(game, user, pick, function (err, message) {
				if (err) {
					logger.err(err);
					return next(err);
				}	

				responseValid(response, message[0]);
			});
		})(request, response, next);
	});

	app.post('/api/picks/get', function (request, response, next) {

		passport.authenticate('authenticate', function (err, user, info) {
			logger.info(user + " called /api/picks/get");

			if (err) {
				logger.err(err);
				responseError(response, err);
				return next(err);
			}

			if (!user) {
				responseFail(response, "token", "User can't be autenticated");
				return;
			}

			var season = request.body.season;
			var week = request.body.week;
			var type = request.body.type;
			var user = request.body.user;

			var result = [];

			data.requestGames(season, week, type, function(err, games) {
				if (err) {
					logger.err(err);
					responseError(response, err);
					return next(err);
				}

				data.getPicks(user, games.games, function(error, picks) {
					if (err) {
						logger.err(err);
						responseError(response, err);
						return next(err);
					}
					responseValid(response, picks);
				});		
			});

		})(request, response, next);
	});

	//	===============
	//	User Management
	//	===============
	app.post('/api/user/register', function (request, response, next) {
		passport.authenticate('local-signup', {session: false}, function(err, token, info) {
			if (err) {
				logger.err(err);
				responseError(response, err);
				return next(err);
			}

			if (!token) {
				responseFail(response, "email", "User already exists");
				return;
			}

			responseValid(response, new Token(token));
		})(request, response, next);
	});

	app.post('/api/user/login', function (request, response, next) {
		passport.authenticate('request-token', {session: false}, function(err, token, info) {
			if (err) {
				logger.err(err);
				responseError(response, err);
				return next(err);
			}

			if (!token) {
				responseFail(response, "email", "User already exists");
				return;
			}

			responseValid(response, new Token(token));
		})(request, response, next);
	});
};