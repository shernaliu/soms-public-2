import telepot
from time import sleep
import random
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
from s3dynamodb import *
import paho.mqtt.client as paho
import os
import socket
import ssl

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

mqttc.loop_start()

# Connect and subscribe to AWS IoT
#my_rpi.connect()

#telegram bot
my_bot_token = '<insert your bot token>'

#s3
BUCKET = '<insert your s3 bucket name>'

def allCommandsMsg():
    return "thank me for the halp u peasant\nlist of available commands:\n\nTake Photo in T2031: take photo\nGet number of people in T2031: t2031\nGet number of people in T2032: t2032"
def noCommandMsg():
    num = random.randint(0, 15)
    if num < 5:
        return "no such command, try again"
    elif num < 10:
        return "**crying meep** no such command, dont bully me T_T"
    else:
        return "did u typo? dont be kailing no.2"

def respondToMsg(msg):
    chat_id = msg['chat']['id']
    command = msg['text']
    print('Got command: {}'.format(command))

    command = command.lower() #lower case it
    # filter commands
    if command == 'help':
        bot.sendMessage(chat_id, allCommandsMsg())
    elif command == 'thankyou' or command =='thx' or command =='thank you':
        bot.sendMessage(chat_id, "awww im touched blush blush")
    elif command == "t2031" or command == "t2032":
        noOfPpl = readDynamoDBItem(command)
        bot.sendMessage(chat_id, "No of people in room " + command + ": " + noOfPpl)
    elif command == "take photo":
        file_name = str(msg['date']) + ".jpg"
        s3filepath = str(chat_id) + "/" + file_name
        mValues = "\"file_name\":\"{0}\",\"chat_id\":\"{1}\",\"s3filepath\":\"{2}\"".format(str(file_name),str(chat_id),str(s3filepath))
        mqttc.publish("rooms/t2031/takephoto", "{"+mValues+"}", qos=1)
        bot.sendMessage(chat_id, "Please wait...")
    else:
        bot.sendMessage(chat_id, noCommandMsg())

bot = telepot.Bot(my_bot_token)
bot.message_loop(respondToMsg)
print('Listening for RPi commands...')
while True:
    sleep(1)
