var mongoose = require('mongoose');

var LightSchema = new mongoose.Schema({
    colour: {
        type: String
    },
    timestamp:{
        type: Date
    }
});

const Light = mongoose.model('Light', LightSchema);
module.exports = Light;