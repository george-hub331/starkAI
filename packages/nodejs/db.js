const mongoose = require('mongoose');

const dbScheme = new mongoose.Schema({
    contract: String,
    address: String,
    desc: String
});

const db = mongoose.model('storage', dbScheme);


module.exports = db;