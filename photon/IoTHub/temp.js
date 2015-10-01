// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.

'use strict';

var five = require ("johnny-five");
var Particle = require("particle-io");
var device = require('azure-iot-device');

// Set up the access credentials for Particle and Azure
var particleKey = process.env.PARTICLE_KEY || 'YOUR PARTICLE ACCESS TOKEN HERE';
var deviceName = process.env.PARTICLE_DEVICE || 'YOUR PARTICLE DEVICE ID/ALIAS HERE';
var connectionString = process.env.IOTHUB_CONN || 'YOUR IOT HUB DEVICE-SPECIFIC CONNECTION STRING HERE';

// Define the Johnny Five board as your Particle Photon
var board = new five.Board({
  io: new Particle({
    token: particleKey,
    deviceId: deviceName
  })
});

var client = new device.Client(connectionString, new device.Https());

// The board.on() executes the anonymous function when the 
// Partile Photon reports back that it is initialized and ready.
board.on("ready", function() {
    console.log("Board connected...");
    
    var temperature= new five.Temperature({
        controller: "TMP36",
        pin: "A0",
        freq: 5000 // Gather the temperature once per second
    });

    // The temperature.on function involes the ananymous callback
    // function at the frequency specified above. The anonymous function
    // is scoped to the data returned from the sensor (e.g. fahrenheit 
    // or celsius temperatures). 
    temperature.on("data", function() {
        // Create a JSON payload for the message that will be sent to Azure IoT Hub
        var payload = JSON.stringify({ deviceId: deviceName, temperature: this.C / 3 });
        // Create the message based on the payload JSON
        var message = new device.Message(payload);
        // Optionally you can add properties to the message
        message.properties.add('celsius', this.C);
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