import RPi.GPIO as GPIO
import MFRC522
import signal
import paho.mqtt.client as paho
import os
import socket
import ssl
from time import sleep

connflag = False

def on_connect(client, userdata, flags, rc):
    global connflag
    connflag = True
    print("Connection returned result: " + str(rc) )

def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))

mqttc = paho.Client()
mqttc.on_connect = on_connect
mqttc.on_message = on_message

# aws credentials
awshost = "<insert your awshost>"
awsport = 8883
clientId = "<insert your clientId>"
thingName = "<insert your thingName>"
caPath = "<insert your caPath>"
certPath = "<insert your certPath>"
keyPath = "<insert your keyPath>"

mqttc.tls_set(caPath, certfile=certPath, keyfile=keyPath, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)

mqttc.connect(awshost, awsport, keepalive=60)

mqttc.loop_start()

uid = None
prev_uid = None
continue_reading = True


# Capture SIGINT for cleanup when the script is aborted
def end_read(signal, frame):
    global continue_reading
    print "Ctrl+C captured, ending read."
    continue_reading = False
    GPIO.cleanup()


# Hook the SIGINT
signal.signal(signal.SIGINT, end_read)

# Create an object of the class MFRC522
mfrc522 = MFRC522.MFRC522()

# Welcome message
print "Welcome to the MFRC522 data read example"
print "Pres Ctrl+C to stop."

# This loop keeps checking for chips.
# If one is near it will get th UID

while continue_reading:
    # Scan for cards
    (status, TagType) = mfrc522.MFRC522_Request(mfrc522.PICC_REQIDL)

    # If a card is found
    if status == mfrc522.MI_OK:
        # Get the UID of the card
        (status, uid) = mfrc522.MFRC522_Anticoll()
        if connflag == True:
            json = "{ \"isEnter\":" + "false" + "}"
            mqttc.publish("rooms/t2031", json, qos=1)
            print("MQTT Published:  " + json)
        # if uid != prev_uid:
        #     prev_uid = uid
        #     print("New card detected! UID of card is {}".format(uid))
        sleep(5)
