var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var ip = require("ip")
var mongoose = require('mongoose')
var rc522 = require("rc522")
var rpio = require('rpio')
var awsIot = require('aws-iot-device-sdk');
var AWS = require('aws-sdk');
mongoose.Promise = Promise

//
// Register Node.js middleware
// -----------------------------------------------------------------------------
app.disable('etag'); // Resolve HTTP status of 304 Modified due to caching https://stackoverflow.com/questions/18811286/nodejs-express-cache-and-304-status-code
app.use(express.static('../front_end'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

var dbUrl = '<insert your mlab url endpoint>'

//
// Import routes
// -----------------------------------------------------------------------------
var user = require('./routes/user');
var light = require('./routes/light');
var attendance = require('./routes/attendance');
var mqtt = require('./routes/mqtt');

//
// Use routes
// -----------------------------------------------------------------------------
app.use('/api', user);
app.use('/api', light);
app.use('/api', attendance);
app.use('/api', mqtt);

// --- Database Connection to MongoDB ---
mongoose.connect(dbUrl, { useMongoClient: true }, (err) => {
    console.log('MongoDB connection err: ', err)
})

io.on('connection', (socket) => {
    console.log('a user connected')
    // emit ip address
    io.sockets.emit("ip", ip.address())
})

// -----------------------------------------------------------------------------
// AWS IOT MQTT CONNECTIONS - START --------------------------------------------
// Configuration
var device = awsIot.device({
    keyPath: '<insert your private key path>',
    certPath: '<insert your cert path>',
    caPath: '<insert your root ca path>',
    clientId: '<insert  your client id>',
    host: '<insert your aws host>'
});


// Device is an instance returned by mqtt.Client(), see mqtt.js for full
// documentation.

device
    .on('connect', function () {
        // Subscribe to both rooms
        device.subscribe('rooms/t2031', 1);
        device.subscribe('rooms/t2032', 1);
        console.log('MQTT: Subscribed to rooms/t2031!');
        console.log('MQTT: Subscribed to rooms/t2032!');
    });

device
    .on('message', function (topic, payload) {
        console.log("NEWM MESSAGE COMING IN!")
        console.log('message', topic, payload.toString());

        var payload = JSON.parse(payload.toString());

        // show the incoming message
        if (topic === 'rooms/t2031') {

            if (payload.isEnter === "true") {
                // get record from dynamodb & increment & update value
                getData("t2031", true);
                buzz_rfid();
                console.log("1 user has entered T2031!");
            } else {
                // get record from dynamodb & decrement & update value
                getData("t2031", false);
                buzzer_ring();
                console.log("1 user has exited T2031!");
            }
        }else if (topic === 'rooms/t2032'){ // T2032
            console.log("t2032")
            console.log(payload.isEnter)
            // get record from dynamodb & increment & update value
            getData("t2032", true);
            buzz_rfid();
            console.log("1 user has entered T2032!");


        }
    });
// AWS IOT MQTT CONNECTIONS - END  --------------------------------------------
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// AWS SDK TO COMMUNICATE WITH DYNAMODB - START --------------------------------
AWS.config.update({
    region: "<insert your region>",
    // The endpoint should point to the local or remote computer where DynamoDB (downloadable) is running.
    endpoint: "<insert your endpoint>",
    /*
    accessKeyId and secretAccessKey defaults can be used while using the downloadable version of DynamoDB.
    For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
    */
    accessKeyId: '<insert your access key>',
    secretAccessKey: '<insert your secret access key>'
});

var dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10', correctClockSkew: true });
var docClient = new AWS.DynamoDB.DocumentClient();
var tablename = "<insert your table name>";

// Function to retrieve the data from table in DynamoDB
function getData(room, isEnter) {
    console.log("Retrieving record from table in DynamoDB!")

    var params = {
        TableName: tablename,
        Key: {
            "room": {
                S: room
            }
        }
    };

    dynamodb.getItem(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            // Need to parse string to integer
            var currentNoOfPpl = parseInt(data.Item.entered.N);
            console.log("Old value of no. of ppl in room: " + currentNoOfPpl)

            // If isEnter, then increment. Else, decrement.
            if (isEnter){
                currentNoOfPpl += 1;
            }else{
                currentNoOfPpl -= 1;
            }

            console.log("New value of no. of ppl in room: " + currentNoOfPpl);

            // Update new value of no. of ppl in room in database
            var params = {
                TableName: tablename,
                Item: {
                    "room": room,
                    "entered": currentNoOfPpl,
                }
            };

            docClient.put(params, function (err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else console.log("Successfully updated new value!");           // successful response
            });

        }
    });
}

// AWS SDK TO COMMUNICATE WITH DYNAMODB - END --------------------------------
// -----------------------------------------------------------------------------

rc522(function (rfidSerialNumber) {
    io.sockets.emit("rfid", rfidSerialNumber); // Sends the RFID Serial Number through Socket.IO
    buzz_rfid();
    console.log(rfidSerialNumber);

    // Publisher #1 : Entry
    // Publish using AWS IOT
    device.publish('rooms/t2031', JSON.stringify({ 'isEnter': 'true' }));
    console.log('MQTT: Published entry to rooms/t2031!');
});

/*
 * Init device (Buzzer) on Pin 12 (GPIO18)
 * Init device (Green LED) on Pin 18 (GPIO24)
 * Set the initial state to low.  The state is set prior to the pin becoming
 * active, so is safe for devices which require a stable setup.
 */
var buzzer_pin = 12;
var led_pin = 18;
rpio.open(buzzer_pin, rpio.OUTPUT, rpio.LOW);
rpio.open(led_pin, rpio.OUTPUT, rpio.LOW);

// Function that beeps the buzzer & lit the green LED for 0.5 seconds
function buzzer_ring() {
    console.log("buzz")
    /* On buzzer for 50ms */
    rpio.write(buzzer_pin, rpio.HIGH);
    rpio.msleep(100);

    /* Off both devices for 50ms */
    rpio.write(buzzer_pin, rpio.LOW);
    rpio.msleep(100);

    rpio.msleep(250);

    rpio.write(buzzer_pin, rpio.HIGH);
    rpio.msleep(150);

    /* Off both devices for 500ms */
    rpio.write(buzzer_pin, rpio.LOW);
    rpio.msleep(150);


}

// Function that beeps the buzzer & lit the green LED in a cute pattern
function buzz_rfid() {
    for (x = 0; x <= 5; x++) {
        /* On both devices for half of a half of a second (50ms) */
        rpio.write(buzzer_pin, rpio.HIGH);
        rpio.write(led_pin, rpio.HIGH);
        rpio.msleep(50);

        /* Off both devices for half of a half of a second (50ms) */
        rpio.write(buzzer_pin, rpio.LOW);
        rpio.write(led_pin, rpio.LOW);
        rpio.msleep(50);
    }
}

var server = http.listen(3000, () => {
    console.log('NodeJS server is running on ' + ip.address() + ':' + server.address().port)
    console.log(io.sockets.name)
})