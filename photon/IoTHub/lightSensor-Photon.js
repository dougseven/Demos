// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.

'use strict';

var five = require ("johnny-five");
var Particle = require("particle-io");
var device = require('azure-iot-device');

var particleKey = process.env.PARTICLE_KEY || 'YOUR API KEY HERE';
var deviceName = process.env.PARTICLE_DEVICE || 'YOUR DEVICE ID';
var connectionString = process.env.IOTHUB_CONN || 'YOUR IOT HUB DEVICE CONNECTION STRING';

var client = new device.Client(connectionString, new device.Https());

console.log('particleKey: ' + particleKey);
console.log('deviceName: ' + deviceName);
console.log('connectionString: ' + connectionString);

// Define the Johnny Five board as your Particle Photon
var board = new five.Board({
  io: new Particle({
    token: particleKey,
    deviceId: deviceName
  })
});

// The board.on() executes the anonymous function when the 
// board reports back that it is initialized and ready.
board.on("ready", function() {
    console.log("Board connected...");
    
    // Create a new `photoresistor` hardware instance.
    var photoresistor = new five.Sensor({
        pin: "A0",
        freq: 5000
    });

    photoresistor.on("data", function() {
        var payload = JSON.stringify({ deviceId: deviceName, ambientLight: this.value });
        var message = new device.Message(payload);
    
        console.log("Sending message: " + message.getData());
    
        client.sendEvent(message, printResultFor('send'));
    });
});

// Monitor notifications from IoT Hub and print them in the console.
setInterval(function(){
    client.receive(function (err, res, msg) {
        if (!err && res.statusCode !== 204) {
            console.log('Received data: ' + msg.getData());
            client.complete(msg, printResultFor('complete'));
        }
        else if (err)
        {
            printResultFor('receive')(err, res);
        }
    });
}, 1000);
    
// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res && (res.statusCode !== 204)) console.log(op + ' status: ' + res.statusCode + ' ' + res.statusMessage);
  };
}