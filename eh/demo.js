// Define the Jonny Five and Spark-IO variables
var five = require ("johnny-five"),
    board, temperature;
var https = require('https');
var crypto = require('crypto');

var namespace = 'dseven-photon-ns';
var hubName = 'iotdemo';
var deviceName = 'D7-Temp-Sensor';
var keyValue = 'XvsIG1s7B51AxyuVhZ3AlYE/ZI1kN7usQZ9PmlLTmzg=';
var keyName = 'Listen';

var publisherUri = 	'https://' + namespace +
 					'.servicebus.windows.net' + '/' + hubName + 
 					'/publishers/' + deviceName + '/messages';

// Define the Johnny Five board
var board = new five.Board();

// The board.on() executes the anonymous function when the 
// board reports back that it is initialized and ready.
board.on("ready", function(){
  console.log("Board connected...");
  
  // Create the SAS token used for Event Hubs
  var sasToken = createSasToken(publisherUri, keyName, keyValue);
  
  temperature = new five.Temperature({
            controller: "TMP36",
            pin: "A1",
            freq: 500
  });

  // Define the callback function for the temperature reading
  // The freq value used when the temperature was defined
  // determines how often this is invoked, thus controlling
  // the frequency of messages.
  temperature.on("data", function(err, data) {
    var f = Math.floor(data.F);
    
    var payload = '{\"temperature\": ' + f + '}';
    
    console.log(payload);
    
    // Define the metadata associated with the message 
    // being sent to Event Hubs
    var options = {
      hostname: namespace + '.servicebus.windows.net',
      port: 443,
      path: '/' + hubName + '/publishers/' + deviceName + '/messages',
      method: 'POST',
      headers: {
        'Authorization': sasToken,
        'Content-Length': payload.length,
        'Content-Type': 'application/atom+xml;type=entry;charset=utf-8'
      }
    };
    
    console.log(options);
    
    // Create an HTTP request and a callback for error conditions
    var req = https.request(options);
    req.on('error', function(e) {
      console.error(e);
    });
    
    // Write the message paylod to the request stream
    req.write(payload);
    // End/close the request
    req.end();
  });
});

// Helper function to create the SAS token needed to send messages to Azure Event Hubs
function createSasToken(uri, keyName, keyV)
{
    // Token expires in 24 hours
    var expiry = Math.floor(new Date().getTime()/1000+3600*24);

    var string_to_sign = encodeURIComponent(uri) + '\n' + expiry;
    var hmac = crypto.createHmac('sha256', keyValue);
    hmac.update(string_to_sign);
    var signature = hmac.digest('base64');
    var token = 'SharedAccessSignature sr=' + encodeURIComponent(uri) + '&sig=' + encodeURIComponent(signature) + '&se=' + expiry + '&skn=' + keyName;

    return token;
}
