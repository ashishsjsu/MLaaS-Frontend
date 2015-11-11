var mongoose = require('mongoose');

/*
var FileSchema = new mongoose.Schema({

	username: {type: String},
	filename: {type: String},
	columns: [],
	url: {type: String},
	date: {type: String}
});*/

var TaskSchema = new mongoose.Schema({

	taskname: {type: String},
	statusurl: {type: String},
	taskid: {type: String},
	dataset: {type:String},
	created: {type: String}
});

var PersonSchema = new mongoose.Schema({

	username: {type: String},
	password: {type: String},
	phone: {type: String},
	email: {type: String},
	//files: {type: [FileSchema]},
	tasks: {type: [TaskSchema]}
});

module.exports = mongoose.model('Person', PersonSchema, 'Person');