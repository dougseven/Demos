// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.

'use strict';

var five = require ("johnny-five");
var device = require('azure-iot-device');

var connectionString = process.env.IOTHUB_CONN || 'CONNECTION STRING FROM DEVICE EXPLORER';

var client = new device.Client(connectionString, new device.Https());

// Define the Johnny Five board as your Particle Photon
var board = new five.Board();

// The board.on() executes the anonymous function when the 
// board reports back that it is initialized and ready.
board.on("ready", function() {
    console.log("Board connected...");
    
    var temperature= new five.Temperature({
        controller: "TMP36",
        pin: "A0",
        freq: 5000
    });

    temperature.on("data", function() {
        var payload = JSON.stringify({ deviceId: 'D7-Test-Temp', temperature: this.F });
        var message = new device.Message(payload);
        
        message.properties.add('celsius', this.C);
    
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