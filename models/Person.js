var mongoose = require('mongoose');

var FileSchema = new mongoose.Schema({

	username: {type: String},
	filename: {type: String},
	url: {type: String},
	date: {type: String}
});

var PersonSchema = new mongoose.Schema({

	username: {type: String},
	password: {type: String},
	phone: {type: String},
	email: {type: String},
	files: {type: [FileSchema]}
});

module.exports = mongoose.model('Person', PersonSchema, 'Person');