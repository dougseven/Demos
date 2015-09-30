/* analogRead.js
 * In this demo I read data in from an analog pin
 * using analogRead. The voltage input is coming from 
 * a second Photon where I have written an app using
 * Particle Build. This tests the Johnny-Five Sensor
 * and the analogRead function, which by default suports
 * 10-bit ADC (0-1023), but the Photon supports 
 * 12-bit ADC (0-4095). 
 */
var five = require ("johnny-five");
var Particle = require("particle-io");
// Define the Johnny Five board as your Particle Photon
var board = new five.Board({
  io: new Particle({
    token: process.env.PARTICLE_KEY || 'YOUR API KEY HERE',
    deviceId: process.env.PARTICLE_DEVICE || 'YOUR DEVICE ID OR ALIAS HERE'
  })
});

board.on("ready", function() {
    
    console.log("Board connected...");
    
    var sensor = new five.Sensor({
        pin: 'A1',
        freq: 500
    });

    sensor.scale(0, 4095).on('data', function() {
        console.log('value: ' + this.value);
    });
});