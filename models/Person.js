var mongoose = require('mongoose');

var PersonSchema = new mongoose.Schema({

	username: {type: String},
	password: {type: String},
	phone: {type: String},
	email: {type: String},
	files: {type: [String]}
});

module.exports = mongoose.model('Person', PersonSchema, 'Person');