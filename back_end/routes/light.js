var express = require('express');
var router = express.Router();
var Light = require('../models/Light')

router.route('/lights').get(function (req, res) {
    // Get an aggregate total count of each colours
    Light.aggregate(
        // Grouping pipeline
        {
            $group:
            { _id: '$Colour', total_count: { $sum: 1 } }
        },
        // Sorting pipeline (sort by colour name alphabetically)
        { "$sort": { _id: 1 } },
        function (err, data) {
            if (err) return res.send(err);
            res.status(200).send(data);
        }
    );
})

module.exports = router;