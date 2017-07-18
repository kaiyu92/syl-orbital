var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventSchema = new Schema({
	title: String,
	date:String,
	venue:String,
	category:String,
	username: String
});

module.exports = mongoose.model('Event', EventSchema);