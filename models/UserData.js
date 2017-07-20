var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userDataSchema = new Schema({
  name: {type: String, required: true},
  org: String,
  content: String,
  date: String,
  user: String
}, {collection: 'request'});

module.exports = mongoose.model('UserData', userDataSchema);