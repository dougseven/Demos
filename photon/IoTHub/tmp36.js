// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.

'use strict';

var five = require ("johnny-five");
var device = require('azure-iot-device');
var Particle = require("particle-io");

var particleKey = process.env.PARTICLE_KEY || 'YOUR PARTICLE ACCESS TOKEN HERE';
var deviceName = process.env.DEVICE_NAME || 'YOUR PARTICLE PHOTON DEVICE ID/ALIAS HERE';
var location = process.env.DEVICE_LOCATION || 'THE LOCATION OF THE PARTICLE PHOTON DEVICE';
var connectionString = process.env.IOTHUB_CONN || 'YOUR IOT HUB DEVICE-SPECIFIC CONNECTION STRING HERE';

var client = new device.Client(connectionString, new device.Https());

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
    
    var temperature= new five.Temperature({
        controller: "TMP36",
        pin: "A1",
        freq: 10000 // Invoke the event handler for the temperature sensor once every 10-seconds
    });
    
    // The temperature.on() function invokes the ananymous callback function at the 
    // frequency specified (25ms by default). The anonymous function is scoped
    // to the object (e.g. this == the temperature object). 
    temperature.on("data", function() {
        
        // Create a JSON payload for the message that will be sent to Azure IoT Hub
        var payload = JSON.stringify({ 
            deviceType: 'temperature',
            deviceId: deviceName, 
            location: location, 
            temperature: this.F 
        });
        
        // Create the message based on the payload JSON
        var message = new device.Message(payload);
        // For debugging purposes, write out the message paylod to the console
        console.log("Sending message: " + message.getData());
        // Send the message to Azure IoT Hub
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