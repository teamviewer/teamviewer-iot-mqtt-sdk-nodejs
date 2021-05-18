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
const metricList = {
    "metrics": [
        {
            "metricId": "YOUR_METRIC1_ID"
        },
        {
            "metricId": "YOUR_METRIC2_ID"
        }
    ]
};
clientConnector = new TvIoT(TV_IOT_CONFIG);

function errorCallback(error) {
    console.log(error);
    clientConnector.disconnect_api();
}

clientConnector.on('connected', () => {
    console.log(`Connected securely to the API: ${clientId}`);
    /** DELETE METRICS - delete_metrics(sensorId, metrics, errorCallback)*/
    clientConnector.delete_metrics(sensorId, JSON.stringify(metricList), errorCallback);
    clientConnector.disconnect_api();
});
clientConnector.connect_api(clientConnector.clientCertFile(clientId), clientConnector.clientKeyFile(clientId));


