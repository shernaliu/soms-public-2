var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Cannot be blank"]
    },
    username: {
        type: String,
        lowercase: true,
        required: [true, "Cannot be blank"],
        match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
        index: true
    },
    email: {
        type: String,
        lowercase: true,
        required: [true, "Cannot be blank"],
        match: [/\S+@\S+\.\S+/, 'is invalid'],
        index: true
    },
    nric: {
        type: String,
        required: [true, "Cannot be blank"],
        match: [/^[STFG]\d{7}[A-Z]$/, 'is invalid']
    },
    nfcCard:{
        type: String
    }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
module.exports = User;