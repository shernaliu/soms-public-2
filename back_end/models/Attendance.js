var mongoose = require('mongoose');

var AttendanceSchema = new mongoose.Schema({
    clockInTimestamp: {
        type: Date,
        required: true
    },
    clockOutTimestamp: {
        type: Date
    },
    totalClockedHours: {
        type: Number
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', AttendanceSchema);
module.exports = Attendance;
