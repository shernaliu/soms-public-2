var express = require('express');
var router = express.Router();
var User = require('../models/User')
var ObjectId = require('mongoose').Types.ObjectId;


// Get all users
router.route('/users').get(function (req, res) {
    User.find({}, (err, users) => {
        res.send(users)
    })
})

// Get all users count
router.route('/usersCount').get(function (req, res) {
    User.count({}, (err, count) => {
        var response = {
            count: count,
        };
        res.status(200).send(response);
    })
})

// Get a user by id
router.route('/users/:id').get(function (req, res) {
    User.find({ _id: new ObjectId(req.params.id) }, (err, users) => {
        res.send(users)
    })
})

// Get a user by nfcCard
router.route('/users/getUserByNfcCard/:id').get(function (req, res) {
    User.find({ nfcCard: (req.params.id) }, (err, users) => {
        if (users.length === 0) { // users is return as array
            // Return 404 resouce not found
            res.sendStatus(404)
        } else {
            res.status(200).send(users)
        }
    })
})

// Create a new user
router.route('/users').post(function (req, res) {
    var user = new User(req.body)
    user.save((err) => {
        if (err) {
            res.sendStatus(500)
        }
        res.sendStatus(200)
    })
})

// Update a user
router.route('/users/:id').put(function (req, res) {

    // Find the existing resource by ID
    User.findById(req.params.id, (err, currentUser) => {
        if (err) {
            res.status(500).send(err);
        } else {
            console.log(currentUser);
            var newUser = new User(req.body)

            // Update each attribute
            currentUser.fullName = newUser.fullName;
            currentUser.username = newUser.username;
            currentUser.email = newUser.email;
            currentUser.nric = newUser.nric;

            // Save the updated document back to the database
            currentUser.save((err, updatedUser) => {
                if (err) {
                    res.status(500).send(err);
                }
                res.status(200).send(updatedUser);
            })
        }
    })
})

// Update nfcCard for a user
router.route('/users/updateNfcCard/:id').put(function (req, res) {

    // Find the existing resource by ID
    User.findById(req.params.id, (err, currentUser) => {
        if (err) {
            res.status(500).send(err);
        } else {
            console.log(currentUser);

            // Update nfcCard attribute
            currentUser.nfcCard = req.body.nfcCard;

            // Save the updated document back to the database
            currentUser.save((err, updatedUser) => {
                if (err) {
                    res.status(500).send(err);
                }
                res.status(200).send(updatedUser);
            })
        }
    })
})

// Delete an existing user
router.route('/users/:id').delete(function (req, res) {
    User.findByIdAndRemove(req.params.id, (err, user) => {
        var response = {
            message: "User successfully  deleted",
            id: user._id
        };
        res.status(200).send(response);
    })
})

module.exports = router;