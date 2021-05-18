const TvIoT = require('../nodejs_sdk/tv_iot_nodejs_sdk.js');
const path = require('path');
const TV_IOT_CONFIG = {
    'MqttHost': 'localhost',
    'MqttPort': 18884,
    'MqttProvisionPort': 18883,
    'CaFile': '/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt',
    'CertFolder': path.resolve(process.cwd(), 'cert')

};

function errorCallback(error) {
    console.log(error);
    clientConnector.disconnect_api();
}

/** SHOULD BE REPLACED WITH REAL VALUES*/
const clientId = "YOUR_CLIENT_ID";
const sensorId = "YOUR_SENSOR_ID";
/**MERICS SHOULD BE CREATED AS A STRING */
const metric1_id = 'YOUR_METRIC1_ID';
const metric2_id = 'YOUR_METRIC2_ID';

metricData = [{
    "value": `${Math.random()}`,
    "metricId": metric1_id
},
    {
        "value": `${Math.random()}`,
        "metricId": metric2_id
    }];

clientConnector = new TvIoT(TV_IOT_CONFIG);

clientConnector.on('connected', () => {

    /** PUSH METRIC VALUES - (sensorId, metricData, callback, errorCallback) */
    clientConnector.put_metric(sensorId, JSON.stringify({metrics: metricData}), (response) => {
            console.log('RESPONSE ---------', response);
            clientConnector.disconnect_api();
        },
        errorCallback);
});
clientConnector.connect_api(clientConnector.clientCertFile(clientId), clientConnector.clientKeyFile(clientId));
