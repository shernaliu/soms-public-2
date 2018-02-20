import datetime
import gevent
import gevent.monkey
from gevent.pywsgi import WSGIServer
import pymongo

from gpiozero import Button, Buzzer
from picamera import PiCamera
import time
from time import sleep
from signal import pause

gevent.monkey.patch_all()

from flask import Flask, request, Response, render_template, jsonify
from flask_cors import CORS, cross_origin
from gpiozero import RGBLED

###### Pin Declarations ######
button = Button(26)
buzzer = Buzzer(18)
led = RGBLED(red=16, green=20, blue=21,pwm=False)

###### Connect to MongoDB ######
try:
    conn = pymongo.MongoClient('<insert your mlab endpoint>')
    db = conn.get_default_database()
    print("Successfully connected to MongoDB")
except pymongo.errors.ConnectionFailure, e:
    print("Could not connect to MongoDB: {}".format(e))

# MongoDB collections
lightsCollection = db['lights']

# Default led to 'off' state
led.color = (1, 1, 1)

# Function to sound buzzer to represent door bell ringing when visitor presses the arcade button
def buzzer_open_door():
    buzzer.on()
    sleep(0.25)
    buzzer.off()
    sleep(0.25)

    buzzer.on()
    sleep(0.50)
    buzzer.off()
    sleep(0.50)

# When button is pressed, sound the buzzer
button.when_pressed = buzzer_open_door

# Functions to store a toggled light colour
def addLight(colour):
    try:
        lightsCollection.insert_one({
            "Colour": colour,
            "Timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        print("Successfully added 1 light record to MongoDB")
    except pymongo.errors.OperationFailure, e:
        print("Error attempting to add 1 light record to MongoDB: {}".format(e))

# Functions to on different light colours
def onRed():
    led.color = (0, 1, 1)  # full red
    addLight("red")
    return "red"

def onGreen():
    led.color = (1, 0, 1)  # full green
    addLight("green")
    return "green"

def onBlue():
    led.color = (1, 1, 0)  # full blue
    addLight("blue")
    return "blue"

def onYellow():
    led.color = (0, 0, 1)  # yellow
    addLight("yellow")
    return "yellow"

def onMagenta():
    led.color = (0, 1, 0)  # magenta
    addLight("magenta")
    return "magenta"

def onCyan():
    led.color = (1, 0, 0)  # cyan
    addLight("cyan")
    return "cyan"

def onWhite():
    led.color = (0, 0, 0)  # white
    addLight("white")
    return "white"

def blink():
    currentColour = led.color
    led.blink(on_color = currentColour, off_color=(1, 1, 1)) # blink the led with currentColour && off colour
    return "blinking"

def offLed():
    led.color = (1, 1, 1)  # off
    return "off"

# define app
app = Flask(__name__)
CORS(app, support_credentials=True)

@app.route("/led/<colour>")
@cross_origin(supports_credentials=True)
def onLED(colour):
    # lowercase the string for comparison
    colour = colour.lower()

    if colour == "red":
        response = onRed()
    elif colour == "green":
        response = onGreen()
    elif colour == "blue":
        response = onBlue()
    elif colour == "yellow":
        response = onYellow()
    elif colour == "magenta":
        response = onMagenta()
    elif colour == "cyan":
        response = onCyan()
    elif colour == "white":
        response = onWhite()
    elif colour == "blink":
        response = blink()
    else:
        response = offLed()

    responseData = {
        'ledStatus': response
    }

    # Send the response back
    return jsonify(**responseData)

# Main method
def main():
    try:
        http_server = WSGIServer(('0.0.0.0', 8001), app)
        app.debug = True
        print("Server is running on port: 8001")
        http_server.serve_forever()
    except:
        print("Exception running server")

if __name__ == '__main__':
    main()
