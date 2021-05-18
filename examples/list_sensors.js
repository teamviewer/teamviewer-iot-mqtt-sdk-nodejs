const TvIoT = require('../nodejs_sdk/tv_iot_nodejs_sdk.js');
const path = require('path');

const TV_IOT_CONFIG = {
    'MqttHost': 'localhost',
    'MqttPort': 18884,
    'MqttProvisionPort': 18883,
    'CaFile': '/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt',
    'CertFolder': path.resolve(process.cwd(), 'cert'),
    'logFilePath' : '/tmp/tv_iot_sdk.log',  //replace with your log file path
    'logLevel' : "off" 

};

/** SHOULD BE REPLACED WITH REAL VALUES*/
const clientId = "YOUR_CLIENT_ID";


clientConnector = new TvIoT(TV_IOT_CONFIG);

function errorCallback(error) {
    console.log(error);
    clientConnector.disconnect_api();
}

clientConnector.on('connected', () => {
    console.log(`Connected securely to the API: ${clientId}`);
    /** SENSOR LIST- describeMetric(sensorId, metrics, errorCallback)*/
    clientConnector.list_sensors(clientId, (response) => {
        console.log('SENSOR LIST-----', response);
        clientConnector.disconnect_api();
    }, errorCallback);
});
clientConnector.connect_api(clientConnector.clientCertFile(clientId), clientConnector.clientKeyFile(clientId));


