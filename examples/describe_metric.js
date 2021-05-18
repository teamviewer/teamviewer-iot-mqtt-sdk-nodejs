const TvIoT = require('../nodejs_sdk/tv_iot_nodejs_sdk.js');
const path = require('path');

const TV_IOT_CONFIG = {
    'MqttHost': 'localhost',
    'MqttPort': 18884,
    'MqttProvisionPort': 18883,
    'CaFile': '/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt',
    'CertFolder': path.resolve(process.cwd(), 'cert')
};
/** SHOULD BE REPLACED WITH REAL VALUES*/
const clientId = "YOUR_CLIENT_ID";
const sensorId = "YOUR_SENSOR_ID";
const metricId = "YOUR_METRIC_ID";
clientConnector = new TvIoT(TV_IOT_CONFIG);
clientConnector.on('connected', () => {
    console.log(`Connected securely to the API: ${clientId}`);
    /** DESCRIBE METRIC - describeMetric(sensorId, metrics, errorCallback)*/
    clientConnector.describe_metric(sensorId, metricId, (response) => {
        console.log('METRIC DESCRIPTION-----', response);
        clientConnector.disconnect_api();
    });
});
clientConnector.connect_api(clientConnector.clientCertFile(clientId), clientConnector.clientKeyFile(clientId));


