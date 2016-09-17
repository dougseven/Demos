/*
 * Copyright (c) 2016 Microsoft Corporation.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// This example uses the Seeed Studio Grove Starter Kit Plus - Intel IoT Edition
// This example incorporates examples from the Johnny-Five API examples at
// http://johnny-five.io/examples/grove-lcd-rgb-temperature-display-edison/

'use strict';
// Define the objects you will be working with
var five = require('johnny-five');
var Edison = require('edison-io');
var device = require('azure-iot-device');

// Define the client object that communicates with Azure IoT Hubs
var Client = require('azure-iot-device').Client;
// Define the message object that will define the message format going into Azure IoT Hubs
var Message = require('azure-iot-device').Message;

// Define the protocol that will be used to send messages to Azure IoT Hub
// For this lab we will use AMQP over Web Sockets.
// If you want to use a different protocol, comment out the protocol you want to replace, 
// and uncomment one of the other transports.
// var Protocol = require('azure-iot-device-amqp-ws').AmqpWs;
// var Protocol = require('azure-iot-device-amqp').Amqp;
// var Protocol = require('azure-iot-device-http').Http;
var Protocol = require('azure-iot-device-mqtt').Mqtt;

// The device-specific connection string to your Azure IoT Hub
var connectionString = process.env.IOTHUB_DEVICE_CONN || 'YOUR IOT HUB DEVICE-SPECIFIC CONNECTION STRING HERE';

// Create the client instanxe that will manage the connection to your IoT Hub
// The client is created in the context of an Azure IoT device.
var client = Client.fromConnectionString(connectionString, Protocol);

// Extract the Azure IoT Hub device ID from the connection string
var deviceId = device.ConnectionString.parse(connectionString).DeviceId;

// location contains the GPS lat/log/alt of the device
var location = {
    latitude:0,
    longitude:0,
    altitude:0
};

// temperature contains the internal and external temperature of the vehicle in celsius.
var temperature = {
    internal:20,
    external20
};

var humidity = {
    internal:20,
    external20
};

var fulelevel = 0.75;

var tirepressure = {
    frontleft = 34,
    frontright = 34,
    backleft = 38,
    backright = 38,
};

// Remote Actuators 
var doors = {
    FrontLeft,
    FrontRight,
    RearLeft,
    RearRight,
};

var isDoorLocked = {
    FrontLeft = true,
    FrontRight = true,
    RearLeft = true,
    RearRight = true,
};

var windows = {
    FrontLeft:0.0,
    FrontRight:0.0,
    RearLeft:0.0,
    RearRight:0.0,
};

var sunroof = {
    tiltopen:0,
    open:0.0
};

var areHeadlightsOn = false;

var horn;

// Define the sensors you will use
var th02,   // temperature and humidity sensor
    lcd,    // multi-color display
    led,    // LED to indicate lock state
    button; // button to act as ignition

// Define some variable for holding sensor values
var tempC, tempF, hum, r, g, b = 0;


// Send device meta data
var deviceMetaData = {
    'ObjectType': 'DeviceInfo',
    'IsSimulatedDevice': 0,
    'Version': '1.0',
    'DeviceProperties': {
        'DeviceID': deviceId,
        'HubEnabledState': 1,
        'DeviceState': 'normal',
        'Manufacturer': 'Audi',
        'Model': 'S5',
        'ModelYear': '2013',
        'VIN': '1234567890',
        'TcuFirmwareVersion': '1.10',
        'Platform': 'node.js',
        'Processor': 'ARM',
        'InstalledRAM': '64 MB'
    },
    'Commands': [
        {
            'Name': 'SetDoorLock', // SetDoorLock('front-left', 'unlock');
            'Parameters': [
                { 'Name': 'Door', 'Type': 'string' },
                { 'Name': 'Action', 'Type': 'string' }
            ]
        },
        {
            'Name': 'OpenWindow', // OpenWindow('frontleft', '10');
            'Parameters': [
                { 'Name': 'Window', 'Type': 'string' },
                { 'Name': 'OpenPercent', 'Type': 'double' } // amount open from 0-100.
            ]
        },
        {
            'Name': 'SetHeadlights', // SetHeadlights('off');
            'Parameters': [
                { 'Name': 'Action', 'Type': 'string' } // 'on' or 'off'
            ]
        },
        {
            'Name': 'SoundHornFlashLights', // SoundHornFlashLights(30, 2);
            'Parameters': [
                { 'Name': 'Duration', 'Type': 'double' },
                { 'Name': 'Pattern', 'Type': 'double' }
            ]
        }
    ]
};

// *********************************************
// Remote Actuator functions - Doors
// *********************************************
function setDoorLock(door, action){
    if(action == 'lock') {
        lockDoor(door);
    } else if(action == 'unlock') {
        unlockDoor(door);
    } else {
        sendMessage('InvalidArgument', 'setDoorLock.Action');
    }
}

function lockDoor(door){
    switch(door){
        case 'front-left':
            doors.FrontLeft.on()
            isDoorLocked.FrontLeft = true;
            sendMessage('doors.front-left', 'locked');
            break;
        case 'front-right':
            doors.FrontRight.on()
            isDoorLocked.FrontRight = true;
            sendMessage('doors.front-right', 'locked');
            break;
        case 'rear-left':
            doors.RearLeft.on()
            isDoorLocked.RearLeft = true;
            sendMessage('doors.rear-left', 'locked');
            break;
        case 'rear-right':
            doors.RearRight.on()
            isDoorLocked.RearRight = true;
            sendMessage('doors.rear-right', 'locked');
            break;
        default:
            doors.FrontLeft.on()
            isDoorLocked.FrontLeft = true;
            doors.FrontRight.on()
            isDoorLocked.FrontRight = false;
            doors.RearLeft.on()
            isDoorLocked.RearLeft = false;
            doors.RearRight.on()
            isDoorLocked.RearRight = false;
            sendMessage('doors.all', 'locked');
            break;
    }
}

function unlockDoor(door){
    switch(door){
        case 'front-left':
            doors.FrontLeft.off()
            isDoorLocked.FrontLeft.Locked = false;
            sendMessage('doors.front-left', 'unlocked');
            break;
        case 'front-right':
            doors.FrontRight.off();
            isDoorLocked.FrontRight.Locked = false;
            sendMessage('doors.front-right', 'unlocked');
            break;
        case 'rear-left':
            doors.RearLeft.off()
            isDoorLocked.RearLeft.Locked = false;
            sendMessage('doors.rear-left', 'unlocked');
            break;
        case 'rear-right':
            doors.RearRight.off();
            isDoorLocked.RearRight.Locked = false;
            sendMessage('doors.rear-right', 'unlocked');
            break;
        default:
            doors.FrontLeft.off()
            isDoorLocked.FrontLeft.Locked = false;
            doors.FrontRight.off();
            isDoorLocked.FrontRight.Locked = false;
            doors.RearLeft.off()
            isDoorLocked.RearLeft.Locked = false;
            doors.RearRight.off();
            isDoorLocked.RearRight.Locked = false;
            sendMessage('doors.all', 'unlocked');
            break;
    }
}

// *********************************************
// Remote Actuator functions - OpenWindow
// *********************************************
function openWindow(window, openPercent){
    if(openPercent < 0 || openPercent > 100)
    {
        sendMessage('InvalidArgument', 'OpenWindow.OpenPercent');
    }

    switch (window) {
        case 'front-left':
            windows.FrontLeft.to(openPercent);
            sendMessage('windows.front-left', openPercent);
            break;
        case 'front-right':
            windows.FrontRight.to(openPercent);
            sendMessage('windows.front-right', openPercent);
            break;
        case 'rear-left':
            windows.RearLeft.to(openPercent);
            sendMessage('windows.rear-left', openPercent);
            break;
        case 'rear-right':
            windows.RearRight.to(openPercent);
            sendMessage('windows.rear-right', openPercent);
            break;
        default:
            windows.FrontLeft.to(openPercent);
            windows.FrontRight.to(openPercent);
            windows.RearLeft.to(openPercent);
            windows.RearRight.to(openPercent);
            sendMessage('windows.all', openPercent);
            break;
    }
}

// *********************************************
// Remote Actuator functions - soundHornFlashLights
// *********************************************



function soundHornFlashLights(duration, pattern){
    sendMessage('SoundHornFlashLights', 'start;' + duration + ';' + pattern);

    var freq = 1000;

    switch(pattern){
        case 0:
            freq = 500;
            break;
        case 1:
            freq = 1000;
            break;
        case 2:
            freq = 2000;
            break;
        case 2:
            freq = 3000;
            break;
    }
    var start = new Date();
    var end = start;
    var now = start;

    end.setSeconds(end.getSeconds() + duration);

    areHeadlightsOn = false;

    var shflInterval = setInterval(function(){
        now = new Date();

        if(end <= now) {
            headlights.off();
            areHeadlightsOn = false;
            clearInterval(shflInterval);
            sendMessage('SoundHornFlashLights', 'complete');
            return;
        }

        if(areHeadlightsOn) {
            headlights.off();
            areHeadlightsOn = false;
        } else {
            headlights.on();
            areHeadlightsOn = true;
        }
    }, freq);
};

// Define the board, which is an abstraction of the Intel Edison
var board = new five.Board({
  io: new Edison()
});



// *********************************************
// Send a messae to Azure IoT Hub.
// Always send the same message format (to 
// ensure the StreamAnalytics job doesn't fail)
// includng deviceId, location and the sensor 
// type/value combination.
// *********************************************
function sendMessage(src, val){
    // Define the message body
    var payload = JSON.stringify({
        deviceId: deviceId,
        location: location,
        sensorType: src,
        sensorValue: val
    });
    
    // Create the message based on the payload JSON
    var message = new Message(payload);
    
    // For debugging purposes, write out the message payload to the console
    console.log('Sending message: ' + message.getData());
    
    // Send the message to Azure IoT Hub
    client.sendEvent(message, printResultFor('send'));
    
    console.log('- - - -');
}

// *********************************************
// Helper function to print results in the console
// *********************************************
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.constructor.name);
  };
}

// *********************************************
// Open the connection to Azure IoT Hub.
// When the connection respondes (either open or 
// error) the anonymous function is executed.
// *********************************************
var connectCallback = function (err) {
    console.log('Open Azure IoT connection...');
    
    // *********************************************
    // If there is a connection error, display it 
    // in the console.
    // *********************************************
    if(err) {
        console.error('...could not connect: ' + err);
        
    // *********************************************
    // If there is no error, send and receive
    // messages, and process completed messages.
    // *********************************************
    } else {
        console.log('...client connected');
        console.log('...sending device metadata:\n' + JSON.stringify(deviceMetaData));
        client.sendEvent(new Message(JSON.stringify(deviceMetaData)), printErrorFor('send metadata'));

        // *********************************************
        // Create a message and send it to the IoT Hub
        // every two-seconds
        // *********************************************
        var sendInterval = setInterval(function () {
            sendMessage('temperature', tempC);
        }, 10000);       
        
        // *********************************************
        // Listen for incoming messages
        // *********************************************
        client.on('message', function (msg) {
            console.log('*********************************************');
            console.log('**** Message Received - Id: ' + msg.messageId + ' Body: ' + msg.data);
            console.log('*********************************************');
            
            console.log('receive data: ' + msg.getData());

            try {
                var command = JSON.parse(msg.getData());
                switch (command.Name) {
                    case 'SetDoorLock':
                        setDoorLock(command.Parameters.Door, command.Parameters.Action);
                        break;
                    case 'OpenWindow':
                        openWindow(command.Parameters.Window, command.Parameters.OpenPercent);
                        break;
                    /*
                    case 'SetHeadlights':
                        temperature = command.Parameters.Temperature;
                        console.log('New temperature set to :' + temperature + 'F');
                        break;
                    */
                    case 'SoundHornFlashLights':
                        soundHornFlashLights(command.Parameters.Duration, command.Parameters.Pattern);
                        break;
                }
                
                client.complete(msg, printErrorFor('complete'));
            }
            catch (err) {
                printErrorFor('parse received message')(err);
                client.reject(msg, printErrorFor('reject'));
            }

            // *********************************************
            // Process completed messages and remove them 
            // from the message queue.
            // *********************************************
            client.complete(msg, printResultFor('completed'));
            // reject and abandon follow the same pattern.
            // /!\ reject and abandon are not available with MQTT
        });
            
            
            
        // *********************************************
        // If the client gets an error, dsiplay it in
        // the console.
        // *********************************************
        client.on('error', function (err) {
            console.error(err.message);
        });
            
            
            
        // *********************************************
        // If the client gets disconnected, cleanup and
        // reconnect.
        // *********************************************
        client.on('disconnect', function () {
            clearInterval(sendInterval);
            client.removeAllListeners();
            client.connect(connectCallback);
        });
    }
}

var self = this;


// *********************************************
// The board.on() executes the anonymous
// function when the 'board' reports back that
// it is initialized and ready.
// *********************************************
board.on('ready', function() {
    console.log('Board connected...');
    
    // Plug the Temperature sensor module
    // into the Grove Shield's I2C jack
    th02 = new five.Multi({
        controller: "TH02"
    });
    
    // Plug the LCD module into any of the
    // Grove Shield's I2C jacks.
    lcd = new five.LCD({
        controller: 'JHD1313M1'
    });
    
    // Red LEDs simulate the vehicle door locks.
    doors.FrontLeft = new five.Led(13);
    doors.FrontRight = new five.Led(12);
    doors.RearLeft = new five.Led(11);
    doors.RearRight = new five.Led(10);

    // White and Yellow LEDs simulate the vehicle headlights and flashers.
    headlights = new five.Led(9);
    flashers = new five.Led(8);
    
    // *********************************************
    // The thermometer object will invoke a callback
    // everytime it reads data as fast as every 25ms
    // or whatever the 'freq' argument is set to.
    // *********************************************
    th02.on('data', function() {
        // Set the state of the variables based on the 
        // value read from the thermometer
        // 'this' scope is the thermometer
        self.temperature.internal = this.temperature.celsius;
        self.humidity.internal = this.hygrometer.relativeHumidity;
        
        // Use a simple linear function to determine
        // the RGB color to paint the LCD screen.
        // The LCD's background will change color
        // according to the temperature.
        // Hot -> Moderate -> Cold
        // 122°F ->  77°F  -> 32°F
        // 50°C  ->  25°C  -> 0°C
        // Red ->  Violet  -> Blue
        r = linear(0x00, 0xFF, tempC, 50);
        g = linear(0x00, 0x00, tempC, 50);
        b = linear(0xFF, 0x00, tempC, 50);
        
        // Paint the LCD and print the temperture
        // (rounded up to the nearest whole integer)
        lcd.bgColor(r, g, b).cursor(0, 0).print('Fahrenheit: ' + Math.ceil(tempF) +'\nHumidity: ' + humidity);
    });
    
    
    
    // *********************************************
    // The button.on('press') invokes the anonymous 
    // callback when the button is pressed.
    // *********************************************
    button.on('press', function() {
        led.on();
        console.log('*********************************************');
        sendMessage('led', 'on');
        console.log('*********************************************');
    });
    
    
    
    // *********************************************
    // The button.on('release') invokes the
    // anonymous callback when the button is
    // released.
    // *********************************************
    button.on('release', function() {
        led.off();
        console.log('*********************************************');
        sendMessage('led', 'off');
        console.log('*********************************************');
    });
    
    
    
    // *********************************************
    // Open the connection to Azure IoT Hubs and
    // begin sending messages.
    // *********************************************
    client.open(connectCallback);
});



// *********************************************
// Helper method for painting the LCD.
// Linear Interpolation
// (https://en.wikipedia.org/wiki/Linear_interpolation)
// *********************************************
function linear(start, end, step, steps) {
  return (end - start) * step / steps + start;
}