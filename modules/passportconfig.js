var crypto = require('crypto');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var PersonSchema = mongoose.model("Person");
		
function validatePassword(userpassword, password){
	//compare password from database to current password
	var md5 = crypto.createHash('md5');
    md5 = md5.update(password).digest('hex');
    return userpassword == md5;
}

function generateHash(password){

	var md5 = crypto.createHash('md5');
    md5 = md5.update(password).digest('hex');
	return hash;
}


var configurePassportAuthentication = function(passport){

	console.log("Configure the passport");

	//serialize the user to support session
	passport.serializeUser(function(user, done){
		console.log("Serializing the user");
		if(user.username !== undefined || user.username !== null){
			//here only username is beng stored in session to keep the session data small
			done(null, user);
		}
	});


	//deserialize the user to authenticate on subsequent requests after first login
	passport.deserializeUser(function(user, done){

		console.log("Deserializing the user");
		//find the user in database and return success if found
		PersonSchema.findOne({ "username": user.username }, function(err, user){
			if(err){
				done(err, false);
			}
			done(err, user);
		})
	});


	// configure the passport authentication strategy
	passport.use('local-login', new LocalStrategy({
		//allows to pass back the entire request to the callback
		passReqToCallback: true
	},
		function(req, username, password, done){
			PersonSchema.findOne({"username":username}, function(err, doc){
				if (err) {
					console.log(err);
					done(err)
				}
				if(!doc){
					console.log("Not user");
					done(null, false, { message: "User not registered" });
				}
				
				if(!validatePassword(doc.password, password)){
					console.log("Invalid password " + password + " " + doc.password);
					done(null, false, { message: "Invalid passwprd!" });
				}
				done(null, doc);
			});
		})//function
	);
};

exports.configurePassportAuthentication = configurePassportAuthentication;