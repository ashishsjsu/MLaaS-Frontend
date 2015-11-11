var mongoose = require('mongoose');

var FileSchema = new mongoose.Schema({

	username: {type: String},
	filename: {type: String},
	columns: [],
	url: {type: String},
	date: {type: String}
});

module.exports = mongoose.model('Files', FileSchema, 'Files');