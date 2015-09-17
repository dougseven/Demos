/* Sensor.js
 * In this demo I create an ambient light sensor that sends
 * telemetry to the service once per second. This device is a read-only 
 * device and doesn't accept any command. 
 */
 var five = require ("johnny-five"),
    board, photoresistor, temperature;
    
var Store = require("nitrogen-file-store"),
    nitrogen = require("nitrogen"),
    service, lightSensor;

var config = {
    host: process.env.HOST_NAME || '192.168.0.197',
    http_port: process.env.PORT || 3030,
    protocol: process.env.PROTOCOL || 'http',
    api_key: process.env.NITROGEN_KEY || '95f9a680147f863d3ba60e7e32509fe2'
};

board = new five.Board({ port: "/dev/cu.usbmodem14111" });
config.store = new Store(config);
service = new nitrogen.Service(config);

// Create a new Nitrogen device
lightSensor = new nitrogen.Device({
    nickname: 'Environment-Sensor',
    name: 'Environment Sensor',
    tags: ['sends:_ambientLight, temperature']
});

// Connect the lightSensor device defined above
// to the Nitrogen service instance.
service.connect(lightSensor, function(err, session, lightSensor) {
    if (err) { return console.log('Failed to connect lightSensor: ' + err); }
    
    board.on("ready", function() {
        console.log("Board connected...");
    
        // Create a new `photoresistor` hardware instance.
        photoresistor = new five.Sensor({
            pin: 'A0',  // Analog pin 0
            freq: 500  // Collect data once per half-second
        });

        temperature = new five.Temperature({
            controller: "TMP36",
            pin: "A1", // Analog pin A1
            freq: 2000 // Collect date once per 2-seconds
        });
        
        // Define the event handler for the photo resistor reading
        // The freq value used when the photoresistor was defined
        // determines how often this is invoked, thus controlling
        // the frequency of Nitrogen messages.
        photoresistor.on('data', function() {
            // Capture the ambient light level from the photo resistor
            var lightLevel = this.value;
            
            // Create a Nitrogen Message to send the _lightLevel
            var ambientLightMessage = new nitrogen.Message({
                type: '_ambientLight',
                // Specify a command tag that you can scope to
                // This will enable you to filter out non-relevant messages
                tags: nitrogen.CommandManager.commandTag('n2demo_light'),
                body: {
                    command: {
                        ambientLight: lightLevel
                    }
                }
            });
            
            // Send the message
            ambientLightMessage.send(session);
            // Show the message in the console
            console.log("Message sent: " + JSON.stringify(ambientLightMessage));
        });
		
		// When temperature data is read based on the freq,
        // send a messge to Nitrogen
        temperature.on("data", function(err, data) {

            var f = Math.floor(data.F);
      
            // Create a Nitrogen message
            var message = new nitrogen.Message({
                type: 'temperature',
                tags: nitrogen.CommandManager.commandTag('n2demo_temp'),
                body: {
                    temperature: f
                }
            });
            
            console.log("Message sent: " + JSON.stringify(message));

            // Send the message
            message.send(session);
        });
    });
});