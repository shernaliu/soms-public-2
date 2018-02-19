from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
from time import sleep
import ast
#camera
from picam_s3_rekognition_2 import *

import telepot

import paho.mqtt.client as paho
import os
import socket
import ssl

BUCKET = '<insert your BUCKET>'
location = {'LocationConstraint': '<insert your location>'}
file_path = "/home/pi/Desktop/sfsphotos"

my_bot_token = '<insert your my_bot_token>'

bot = telepot.Bot(my_bot_token)

def on_connect(client, userdata, flags, rc):
    print("Connection returned result: " + str(rc) )
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("rooms/t2031/takephoto" , 1 )

def on_message(client, userdata, msg):
    print("topic: "+msg.topic)
    print("payload: "+str(msg.payload))
    result = ast.literal_eval(msg.payload)
    print(result)
    chat_id = result['chat_id']
    file_name = result['file_name']
    s3filepath = result['s3filepath']

    #s3 and stuff
    try:
        bot.sendMessage(chat_id, "Taking Photo...")
        takePhoto(file_path,file_name)
        print("take photo success")
        bot.sendMessage(chat_id, "Photo Taken, now uploading...")
        uploadToS3(file_path,file_name, BUCKET,location,s3filepath)
        print("uploaded to s3")
        bot.sendMessage(chat_id, "Uploaded Photo, now processing")
        bot.sendMessage(chat_id, "https://s3-us-west-2.amazonaws.com/"+BUCKET+"/"+s3filepath)

        replyMsg = ""
        for label in detect_labels(BUCKET, s3filepath):
            print("{Name} - {Confidence}%".format(**label))
            replyMsg += "\n{Name} - {Confidence}%".format(**label)
        if replyMsg == "":
            print("nth found")
            bot.sendMessage(chat_id, "Did not detect anything")
        else:
            print("Listing probabilities:\n" + replyMsg)
            bot.sendMessage(chat_id, "Listing probabilities:\n" + replyMsg)
    except:
        print("Error in takePhotoCommand")
        bot.sendMessage(chat_id, "Error! D:")

mqttc = paho.Client()
mqttc.on_connect = on_connect
mqttc.on_message = on_message
#mqttc.on_log = on_log

awshost = "<insert your awshost>"
awsport = 8883
clientId = "<insert your clientId>"
thingName = "<insert your thingName>"
caPath = "<insert your caPath>"
certPath = "<insert your certPath>"
keyPath = "<insert your keyPath>"

mqttc.tls_set(caPath, certfile=certPath, keyfile=keyPath, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)

mqttc.connect(awshost, awsport, keepalive=60)

mqttc.loop_forever()

while True:
    sleep(1)