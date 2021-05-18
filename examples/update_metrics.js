const TvIoT = require('../nodejs_sdk/tv_iot_nodejs_sdk.js');
const path = require('path');

const TV_IOT_CONFIG = {
    'MqttHost': 'localhost',
    'MqttPort': 18884,
    'MqttProvisionPort': 18883,
    'CaFile': '/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt',
    'CertFolder': path.resolve(process.cwd(), 'cert'),
    'logFilePath' : '/tmp/tv_iot_sdk.log',  //replace with your log file path
    'logLevel' : "error" 


};

/** SHOULD BE REPLACED WITH REAL VALUES*/
const clientId = "YOUR_CLIENT_ID";
const sensorId = "YOUR_SENSOR_ID";

const metricData = [
    {
        // SHOULD BE REPLACED WITH REAL VALUES
        "metricId": "YOUR_METRIC_ID",
        "name": "NEW_METRIC_NAME",
        "valueAnnotation": "NEW_ANNOTATION"
    }
];
clientConnector = new TvIoT(TV_IOT_CONFIG);

clientConnector.connect_api(clientConnector.clientCertFile(clientId), clientConnector.clientKeyFile(clientId));

clientConnector.on('connected', () => {

    clientConnector.update_metrics(sensorId, JSON.stringify({metrics: metricData}), (response) => {
        console.log('RESPONSE ---------', response);
        clientConnector.disconnect_api();
    }, (error) => {
        var errorResponse = JSON.parse(error);
        console.log('Error: ' + errorResponse.errorMessage);
    });
});

