var express = require('express');
var mongoose = require('mongoose');
var crypto = require("crypto");
var PersonSchema = mongoose.model('Person');
var passport = require('passport');
var ensureAuthenticated = require('../modules/ensureAuthenticated');

var router = express.Router();

/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
 	res.render('index', { title: 'File Uploader' });
});

//get the basic info of currently logged in user
router.get('/user/sessionInfo', ensureAuthenticated, function(req, res){
	console.log("(************************");
	var info = {
		"username": req.session.passport.user.username,
		"email": req.session.passport.user.email
	}
	console.log({"user": info});
	res.json({"user": info});
});

//route to render login page 
router.get('/login', function(req, res){
  res.render('login');
});

//route for logout
router.get('/logout', function(req, res){

  req.logout();
  res.redirect('/login');
});


//using custom callback for login post request
router.post('/login', passport.authenticate('local-login', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true
}));

//register a user
router.post('/register', function(req, res){

	var user = req.body;
	//create an md5 hash before storing the password
	var md5 = crypto.createHash('md5');
    md5 = md5.update(user.password).digest('hex');

	var User = {
		"email" : user.email,
		"username": user.username,
		"phone": user.phone,
		"password": md5
	}
		
	var person = new PersonSchema(User);

	person.save(person, function(err, doc){
		if(err){
			console.log(err);
			res.json(err);
		}
		console.log("Saved: " + doc);
		res.json(doc);
	});

});

module.exports = router;
