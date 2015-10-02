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

// Create a Johnny Five board board instance to represent your Particle Photon
var board = new five.Board({
  io: new Particle({
    token: particleKey,
    deviceId: deviceName
  })
});

// hF, hC, bF, bC are holder variables for the fahrenheit and celsius values from the
// hygrometer and barometer respectively.
var hF, hC, bF, bC, relativeHumidity, pressure;

// The board.on() executes the anonymous function when the 
// board reports back that it is initialized and ready.
board.on("ready", function() {
    console.log("Board connected...");
    // The SparkFun Weather Shield for the Particle Photon has two sensors on the I2C bus - 
    // a humidity sensor (HTU21D) which can provide both humidity and temperature, and a 
    // barometer (MPL3115A2) which can provide both barometric pressure and humidity.
    // WHen you create objects for the sensors you use the PHOTON_WEATHER_SHILED controller
    // which is a multi-class controller. Create objects for each data type you will 
    // use by specifying the controller which maps to the specific sensor.
    var weather = new five.Multi({
        controller: "PHOTON_WEATHER_SHIELD",
        freq: 5000 // Read the data once every 5 seconds
    });
    
    // The weather.on function invokes the ananymous callback function at the 
    // frequency specified (250ms by default). The anonymous function is scoped
    // to the object (e.g. this == temperature object). 
    weather.on("data", function() {
        hF = this.hygrometer.temperature.fahrenheit;
        hC = this.hygrometer.temperature.celsius;
        relativeHumidity = this.hygrometer.relativeHumidity;
        
        bF = this.barometer.temperature.fahrenheit;
        bC = this.barometer.temperature.celsius;
        pressure = this.barometer.pressure;
        
        // Create a JSON payload for the message that will be sent to Azure IoT Hub
        var payload = JSON.stringify({ 
            deviceId: deviceName, 
            location: location,
            fahrenheit: (hF + bF)/2,
            celsius: (hC + bC)/2,
            relativeHumidity: relativeHumidity,
            pressure: pressure
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