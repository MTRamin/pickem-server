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

// passport.js
var database = require("./database");
var logger = require("./logger");

var bcrypt = require('bcrypt-nodejs');
var jwt = require('jwt-simple');
var LocalStrategy = require('passport-local').Strategy;
var LocalAPIKeyStrategy = require('passport-localapikey').Strategy;

var jwt_secret = "temp";

function User (email, password, token) {
	this.email = email;
	this.password = password;
	this.token = token;
}

module.exports = function (passport) {
	passport.use('local-signup', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	},
	/**
	 * Register user with the service.
	 * User signs up with his name and a password, hash password and store user data,
	 * Including access-token in the database
	 */
	function (email, password, done) {
		logger.info("User " + email + " signing up");
		database.contains({'email' : email}, database.users, function (err, exists) {
			if (err) {
				logger.err(err);
				return done(err);
			}

			if (exists) {
				return done(null, false);
			} else {
				hash(password, function(err, hash) {
					if (err) {
						console.dir(err);
						return done(err);
					}

					var accessToken = generateToken(email);

					var newUser = new User(email, hash, accessToken);

					database.insert(newUser, database.users, function (err, result) {
						if (err) {
							logger.err(err);
							return done(err);
						}
						return done(null, accessToken);
					});
				});
			}
		});
	}));

	/**
	 * Return the access-token of a user.
	 * Search the database for the user, validate his password and return the token if login info is correct
	 */
	passport.use('request-token', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	},
	function (email, password, done) {
		logger.info("User " + email + " is logging inn");

		database.contains({'email' : email}, database.users, function (err, exists) {
			if (err) {
				logger.err(err);
				return done(err);
			}

			if (!exists) {
				return done(null, false);
			}

			database.find({'email' : email}, database.users, function (err, data) {
				if (err) {
					logger.err(err);
					return done(err);
				}

				var hash = data[0].password;
				var token = data[0].token;

				validate(password, hash, function (err, valid) {
					if (err) {
						logger.err(err);
						return done(err);
					}

					if (valid) {
						return done(null, token);
					} else {
						return done(null, false);
					}
				});
			});
		});
	}));

	/**
	 * Authenticate a user for use with the API.
	 * Users send their token with every request. Search for the token
	 * in the database and return his username if the token is valid
	 */
	passport.use('authenticate', new LocalAPIKeyStrategy({
		apiKeyField: 'token'
	},
	function(apikey, done) {
		database.contains({'token' : apikey}, database.users, function (err, exists) {
			if (err) {
				logger.err(err);
				return done(err);
			}

			if (exists) {
				database.find({'token' : apikey}, database.users, function (err, data) {
					if (err) {
						logger.err(err);
						return done(err);
					}
					return done(null, data[0].email);
				});
			} else {
				logger.err("Unknown user trying to access the API!");
				return done(err, false);
			}
		});
	}));
	

	// passport.use('facebook')

	// passport.use('twitter')
	
	// passport.use('google')
}

/**
 * Generate an access-token for a user
 */ 
function generateToken(data) {
	return jwt.encode(data, jwt_secret);
}

/**
 * Hash and salt a users password with a newly generated salt
 */
function hash(data, callback) {
	bcrypt.genSalt(10, function (err, salt) {
		if (err) {
			return callback(err);
		}

		bcrypt.hash(data, salt, null, function (err, hash) {
			return callback(err, hash);
		});
	});
}

/**
 * Validate a users password
 */
function validate(data, hash, callback) {
	bcrypt.compare(data, hash, function (err, result) {
		if (err) {
			return callback(err);
		}

		return callback(null, result);
	});
}