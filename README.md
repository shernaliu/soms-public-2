# About Smart Office Management System (SOMS)

SOMS is built on the Mongo-ExpressJS-NodeJS (MEN) stack as well as supporting python codes.

![alt text](http://res.cloudinary.com/shernaliu/image/upload/v1519070763/github-never-delete/men.jpg)

Smart Office Management System (SOMS) is a Node.js web application that is used to manage certain processes required by people in an office environment. The web application interfaces with the Raspberry Pi 3 and various modules connected to it to carry out its functionalities.

SOMS is an application to manage and track employees’ daily attendance, monitor and control the lights and camera in the office.

![alt text](http://res.cloudinary.com/shernaliu/image/upload/v1519070527/github-never-delete/1-index.png)

For CA2, we will be extending from CA1 to include the functionality to allow users to track the number of people in a particular room. We will be utilising a lightweight communications protocol called Message Queuing Telemetry Transport (MQTT) to publish and subscribe messages to and from certain topics from the AWS IoT broker.

# System Architecture
![alt text](http://res.cloudinary.com/shernaliu/image/upload/v1519070363/github-never-delete/SYSTEM_ARCHITECTURE.png)

## Installing SOMS

Please read the documentation I have included!
There are two parts to this project: CA1 then CA2.

```
# clone this project into your raspberry pi
git clone

# install required dependencies in both back_end and front_end directories
npm install

# run node.js in back_end directory
sudo node server.js

```

For more information, please read the documentation included! Thank you.

Thanks to the following contributors:

Leong Kai Ling (@kailing231)
Ong Kai Xin Elaine (@elaine24)