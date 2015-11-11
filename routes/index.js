var express = require('express');
var mongoose = require('mongoose');
var crypto = require("crypto");

var PersonSchema = mongoose.model('Person');
var FileSchema = mongoose.model('Files');

var passport = require('passport');
var unirest = require('unirest');

var ensureAuthenticated = require('../modules/ensureAuthenticated');

var router = express.Router();

router.get('/home', function(req, res, next){
	res.render('index');
});

/* ===============================  Login/Registration =================================== */

router.get('/login', function(req, res){
  res.render('login');
});

/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res, next) {
 	res.render('index', { title: '' });
});

//get the basic info of currently logged in user
router.get('/user/sessionInfo', ensureAuthenticated, function(req, res){
	var info = {
		"username": req.session.passport.user.username,
		"email": req.session.passport.user.email
	}
	console.log({"user": info});
	res.json({"user": info});
});


//route for logout
router.get('/logout', function(req, res){

  req.logout();
  if (!req.user) 
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
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

/* ===============================  Files I/O =================================== */


router.post('/files', function(req, res, next){

	console.log("Request received");
	var file = req.body;
	console.log(req.body);

	var columns = JSON.parse(req.body.columns);

	var update = {'$pushAll': { 'columns': columns }};
	var query = {'username': req.body.username, 'filename': req.body.filename}

	/*PersonSchema.update({'username': req.body.username}, update, function(err, numAffected){
		if(err){
			console.log(err);
			res.json({'msg': "Update failed!"});
		}
		console.log(numAffected);
		res.json({'msg': numAffected + " records updated"});

		if(numAffected > 0){

		}
	});*/
	
	var file = {
		'username': req.body.username,
		'filename': req.body.filename,
		'date': req.body.date
	}
	var files = new FileSchema(file);

	files.save(files, function(err, doc){
		
		if(err){
			console.log(err);
			res.json(err);
		}
		console.log("Saved: " + doc);
		
		if(doc !== null || doc !== undefined){

			FileSchema.update(query, update, function(err, numAffected){
				if(err){
					console.log(err);
					res.json({'msg': "Update failed!"});
				}
				console.log(numAffected);
				res.json({'msg': numAffected + " records updated"});

			});
		}
		//res.json(doc);
	});

});


router.get('/files/:username', function(req, res, next){

	/*PersonSchema.find({'username': req.params.username}, function(err, data){

		console.log("****************************"+req.params.username);
		if(err){
			res.json({'message': err});
		}

		if(data !== null){
			res.json({'message': data});
		}
	});*/

	FileSchema.find({'username': req.params.username}, function(err, data){

		console.log("****************************"+req.params.username);
		if(err){
			res.json({'message': err});
		}

		if(data !== null){
			console.log(data);
			res.json({'message': data});
		}
	});	
});

/* ================================ Tasks list for a user ================================ */

router.get('/tasks/:username', function(req, res, next){

	PersonSchema.find({'username': req.params.username}, function(err, data) { 
		if(err) {
			console.log("Error in db");
			res.json({'message': err});
		}

		if(data !== null){
			//console.log(data[0].tasks);
			res.json({'message': data[0].tasks});
		}
	});
});


/* ================================ Get statistics form raw file =========================*/

// this API creates a data statistics job and updates the task metadata in user's profile, the task metadata is received from the Python flask server
//ensure user is authenticated to use this API
router.get('/files/:filename/statistics', ensureAuthenticated, function(req, res, next){

	unirest.post('http://localhost:5000/statistics/'+req.params.filename)
	.header('Accept', 'application/json')
	//.send({'msg': 'hello there!'})
	.end(function(response){
		// return a json response with task status url, task id, task name
		var responsedata = {
			'taskname': 'Raw Data Statistics',
			'statusurl': response.headers['location'], // tracking url for task status
			'taskid': response.body.task_id,
			'dataset': req.params.filename,
			'created': getToday()
		}

		//update task details in user profile
		var update = {'$push': { tasks: responsedata } };
		// get username from currently logged in user
		PersonSchema.update({'username': req.user.username}, update, function(err, numAffected){
			if(err){
				console.log('Error updating task metadata : ' + err);
			}
			console.log(numAffected + " tasks updated!");
		});

		console.log(responsedata);
		//send task details to UI
		res.json(responsedata);
	})
});


/* =============== UTILITY ============ */
function getToday(){

	var today = new Date();
	var date = today.getMonth() + "/" + today.getDate() + "/" + today.getYear() + " " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

	return date;
}

module.exports = router;