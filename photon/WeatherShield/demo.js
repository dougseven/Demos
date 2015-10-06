var five = require("../../../johnny-five");
var Photon = require("particle-io");

var board = new five.Board({
  io: new Photon({
    token: process.env.PARTICLE_KEY,
    deviceId: process.env.PARTICLE_DEVICE
  })
});


board.on("ready", function() {

  var hygrometer = new five.Multi({
    controller: "HTU21D",
    freq: 1000
  });

  hygrometer.on("data", function() {
    console.log("Thermometer");
    console.log("  celsius           : ", this.temperature.celsius);
    console.log("  fahrenheit        : ", this.temperature.fahrenheit);
    console.log("  kelvin            : ", this.temperature.kelvin);
    console.log("--------------------------------------");

    console.log("Hygrometer");
    console.log("  relative humidity : ", this.hygrometer.relativeHumidity);
    console.log("--------------------------------------");
  });
  
  
  var barometer = new five.Multi({
    controller: "MPL3115A2",
    freq: 1000
  });
  
  barometer.on("data", function() {
    console.log("temperature");
    console.log("  celsius      : ", this.temperature.celsius);
    console.log("  fahrenheit   : ", this.temperature.fahrenheit);
    console.log("  kelvin       : ", this.temperature.kelvin);
    console.log("--------------------------------------");

    console.log("barometer");
    console.log("  pressure     : ", this.barometer.pressure);
    console.log("--------------------------------------");

    console.log("altimeter");
    console.log("  feet         : ", this.altimeter.feet);
    console.log("  meters       : ", this.altimeter.meters);
    console.log("--------------------------------------");
  });


});