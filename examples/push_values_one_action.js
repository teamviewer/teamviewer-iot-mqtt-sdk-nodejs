const TvIoT = require('../nodejs_sdk/tv_iot_nodejs_sdk.js');
const path = require('path');
const fs = require('fs');


let connId = null;
let sensorId = null;
const sensorName = 'my_sensor';

const dir = '../teamviewer-iot-sdk-nodejs/cert';
const certFile = dir.concat(`/cert.pem`);
const keyFile = dir.concat(`/key.pem`);

const TV_IOT_CONFIG = {
    'MqttHost': 'localhost',
    'MqttPort': 18884,
    'MqttProvisionPort': 18883,
    'CaFile': '/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt',
    'CertFolder': path.resolve(process.cwd(), 'cert'),
    'certFileExtension': true,
    'logFilePath' : '/tmp/tv_iot_sdk.log',  //replace with your log file path
    'logLevel' : "all" 

};

const metricsData = [
    {
        "value": `${Math.random()}`,
        "metricId": 'YOUR_METRIC_ID_1'
    },
    {
        "value": `${Math.random()}`,
        "metricId": 'YOUR_METRIC_ID_2'
    }];


if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
    clientConnector = new TvIoT(TV_IOT_CONFIG);
    clientConnector.provision();
    clientConnector.on('clientCreated', (connectorId) => {
        connId = connectorId;
        clientConnector.disconnect_api();
        console.log('CONNECTION ID', connId);
        clientConnector = new TvIoT(TV_IOT_CONFIG);
        clientConnector.connect_api(clientConnector.clientCertFile(connId), clientConnector.clientKeyFile(connId));
        clientConnector.on("connected", onConnected);
    });
} else {
    console.log('CONNECTION ID', connId);
    clientConnector = new TvIoT(TV_IOT_CONFIG);
    clientConnector.connect_api(certFile, keyFile);
    clientConnector.on("connected", onConnected);
}

function onConnected(connectorId) {
    console.log(`Connected securely to the API: ${connectorId} `);
    /** CREATE SENSOR - create_sensor(sensorName, callback, errorCallback) */
    clientConnector.create_sensor(sensorName, (sensor_response) => {
        console.log('CREATED SENSOR -------- ', sensor_response);
        let sensor = JSON.parse(sensor_response);
        sensorId = sensor.sensorId;
        push_values();
        clientConnector.disconnect_api();
    }, errorCallback);
}

clientConnector.on('errorCreatingClient', function (err) {
    console.log('err: ' + err);
}, errorCallback);

function push_values() {
    /** PUSH METRIC VALUES - put_metric(sensorId, metricData, callback, errorCallback) */
    clientConnector.put_metric(sensorId, JSON.stringify({metrics: metricsData}), (push_response) => {
        console.log('RESPONSE ---------', push_response);
    }, errorCallback);
}

function errorCallback(error) {
    console.log(error);
    clientConnector.disconnect_api();
}
