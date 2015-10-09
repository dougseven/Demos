var five = require("johnny-five");
var Photon = require("particle-io");

var particleKey = process.env.PARTICLE_KEY || 'YOUR PARTICLE ACCESS TOKEN HERE';
var device1Name = process.env.DEVICE_1_NAME || 'YOUR PARTICLE PHOTON DEVICE ID/ALIAS HERE';
var device2Name = process.env.DEVICE_2_NAME || 'YOUR PARTICLE PHOTON DEVICE ID/ALIAS HERE';

console.log("particleKey: " + particleKey);

var b1 = new five.Board({
  io: new Photon({
    token: particleKey,
    deviceId: device1Name
  })
});

var b2 = new five.Board({
  io: new Photon({
    token: particleKey,
    deviceId: device2Name
  })
});

var boards = new five.Boards([b1, b2])

boards.on("ready", function() {
  // |this| is an array-like object containing references
  // to each initialized board.
  this.each(function(board) {
    
    var hygrometer = new five.Multi({
      controller: "HTU21D",
      freq: 1000,
      board: board,
      threshold: 5 // Fire a change event if the value changes by 0.5 or more
    });
    
    hygrometer.on("change", function() {
      console.log("Board " + board.id + " - Thermometer");
      console.log("  celsius           : ", this.temperature.celsius);
      console.log("  fahrenheit        : ", this.temperature.fahrenheit);
      console.log("  kelvin            : ", this.temperature.kelvin);
      console.log("--------------------------------------");

      console.log("Hygrometer");
      console.log("  relative humidity : ", this.hygrometer.relativeHumidity);
      console.log("======================================");
    });
  })
});