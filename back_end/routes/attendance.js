var express = require('express');
var router = express.Router();
var Attendance = require('../models/Attendance')
var ObjectId = require('mongoose').Types.ObjectId;
var moment = require('moment');

// Get all attendance
router.route('/attendance').get(function (req, res) {
    Attendance.find({}).populate('user').exec((err, attendances) => {
        res.send(attendances)
    })
})

// Get all attendance for a specific date
router.route('/attendance/searchByDate/:date').get(function (req, res) {
    console.log("searchByDate called")
    // Query by date: Get start of date & end of date
    // Example:
    // startDate: Sat Dec 23 2017 00:00:00 GMT+0800 (+08)
    // endDate: Sun Dec 24 2017 00:00:08 GMT+0800 (+08)
    var date = new Date(req.params.date);
    var startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 9999);

    console.log(date)
    console.log(startDate)
    console.log(endDate)

    Attendance
        .find(
        {
            clockInTimestamp: { $gte: startDate, $lt: endDate }
        })
        .populate('user')
        .exec((err, attendances) => {
            res.status(200).send(attendances);

        })
})

// Get all clock in count for today
router.route('/attendance/clockInCount').get(function (req, res) {
    // Query by today's date: Get start of today & end of today
    // Example:
    // startOfToday: Sat Dec 23 2017 00:00:00 GMT+0800 (+08)
    // endOfToday: Sun Dec 24 2017 00:00:08 GMT+0800 (+08)
    var now = new Date();
    var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 9999);

    Attendance.count(
        {
            clockInTimestamp: { $gte: startOfToday, $lt: endOfToday }
        }, (err, count) => {
            var response = {
                count: count,
            };
            res.status(200).send(response);
        })
})

// Get all clock out count for today
router.route('/attendance/clockOutCount').get(function (req, res) {
    // Query by today's date: Get start of today & end of today
    // Example:
    // startOfToday: Sat Dec 23 2017 00:00:00 GMT+0800 (+08)
    // endOfToday: Sun Dec 24 2017 00:00:08 GMT+0800 (+08)
    var now = new Date();
    var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 9999);

    Attendance.count(
        {
            clockOutTimestamp: { $gte: startOfToday, $lt: endOfToday }
        }, (err, count) => {
            var response = {
                count: count,
            };
            res.status(200).send(response);
        })
})

// Get an attendance record where user._id = 'xxxxx' & clockedInTimestamp == today
router.route('/attendance/checkIfClockedIn/:id').get(function (req, res) {
    // Query by today's date: Get start of today & end of today
    // Example:
    // startOfToday: Sat Dec 23 2017 00:00:00 GMT+0800 (+08)
    // endOfToday: Sun Dec 24 2017 00:00:08 GMT+0800 (+08)
    var now = new Date();
    var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 9999);

    Attendance
        .find(
        {
            clockInTimestamp: { $gte: startOfToday, $lt: endOfToday },
            "user": new ObjectId(req.params.id)
        })
        .populate('user')
        .exec((err, attendances) => {
            // There can be only 1 attendance record for a user per day
            res.send({ "count": attendances.length })

        })
})

// Get an attendance record where user._id = 'xxxxx' & clockedOutTimestamp == null
router.route('/attendance/checkIfClockedOut/:id').get(function (req, res) {
    Attendance
        .find(
        {
            clockOutTimestamp: null,
            "user": new ObjectId(req.params.id)
        })
        .populate('user')
        .exec((err, attendances) => {
            // There can be only 1 attendance record for a user per day
            res.send({ "count": attendances.length })

        })
})

// Clock in a user
router.route('/attendance/clockIn').post(function (req, res) {

    // TODO: Codes to turn back the time for testing purposes
    // You can uncomment them for testing purposes
    // var now = new Date();
    // var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 1);
    // req.body.clockInTimestamp = yesterday;

    var attendace = new Attendance(req.body)
    attendace.save((err, createdAttendance) => {
        if (err) {
            res.status(500).send(err);
        }
        res.status(200).send(createdAttendance);
    })
})

// Clock out a user
// Update clockOutTimestamp & totalClockedHours for an attendance
router.route('/attendance/clockOut/:id').put(function (req, res) {
    // Find the attendance document where user._id = 'xxxxx' & clockedOutTimestamp == null
    Attendance
        .find(
        {
            clockOutTimestamp: null,
            "user": new ObjectId(req.params.id)
        }, (err, attendances) => {
            if (err) {
                console.log(err)
            } else {
                console.log(attendances);

                // Update clockOutTimestamp attribute
                attendances[0].clockOutTimestamp = req.body.clockOutTimestamp;

                // Calculate number of clocked hours
                var clockInTime = moment(new Date(attendances[0].clockInTimestamp));
                var clockOutTime = moment(new Date(attendances[0].clockOutTimestamp));

                console.log("clockInTime: " + clockInTime);
                console.log("clockOutTime: " + clockOutTime);

                var duration = moment.duration(clockOutTime.diff(clockInTime));
                var hours = duration.asMilliseconds();
                console.log("hours: " + hours)

                // Update totalClockedHours attribute
                attendances[0].totalClockedHours = hours;

                // Save the updated document back to the database
                attendances[0].save((err, updatedAttendance) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    res.status(200).send(updatedAttendance);
                })
            }
        })
})

module.exports = router;