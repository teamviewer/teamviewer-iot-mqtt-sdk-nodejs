const TvIoT = require('../nodejs_sdk/tv_iot_nodejs_sdk.js');
const path = require('path');
const fs = require('fs');


let connId = null;
let sensorId = null;
let metricId = null;
const sensorName = 'my_sensor';
const metricName = 'Temperature';

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
    'logLevel' : 'debug'
};

const metricsList = [{
    'matchingId': '1',
    'valueType': 'integer',
    'name': metricName,
    'valueAnnotation': 'C'
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
    connId = connectorId;
    console.log(`Connected securely to the API: ${connId} `);
    /** SENSOR LIST- list_sensors(connId, callback, errorCallback)*/
    clientConnector.list_sensors(connId, (response) => {
            console.log('SENSOR LIST-----', response);
            let sensor_list = JSON.parse(response);
            getSensor(sensor_list);
        },
        errorCallback);
}

clientConnector.on('errorCreatingClient', function (err) {
        console.log('err: ' + err);
    },
    errorCallback);

/** get sensor by name from sensors list or
 *  create sensor if it does not exists to push metrics data for it */
function getSensor(sensor_list) {
    console.log(sensor_list);
    if (sensor_list.length == 0) {
        /** CREATE SENSOR - create_sensor(sensorName, callback, errorCallback)*/
        clientConnector.create_sensor(sensorName, (sensor_response) => {
                console.log('SENSOR -------- ', sensor_response);

                let sensor = JSON.parse(sensor_response);
                sensorId = sensor.sensorId;

                /** CREATE METRIC - create_metrics(sensorId, metricDefinition, callback, errorCallback) */
                clientConnector.create_metrics(sensorId, JSON.stringify({metrics: metricsList}), create_metrics_callback,
                    errorCallback);
            },
            errorCallback);
    } else {
        let sensor = sensor_list[0];
        if (sensor.name == sensorName) {
            sensorId = sensor.sensorId;
            let metric_list = [];
            sensor.metrics.forEach(function (metric) {
                metric_list.push(metric.metricId);
            });
            getMetric(metric_list);
        } else {
            sensor_list.splice(0, 1);
            getSensor(sensor_list);
        }
    }
}
/** get metric by name from metrics list
 *  or create metric if it does not exists to push data for it */
function getMetric(metric_list) {
    if (metric_list.length == 0) {
        /** CREATE METRIC - create_metrics(sensorId, metricDefinition, callback, errorCallback) */
        clientConnector.create_metrics(sensorId, JSON.stringify({metrics: metricsList}), create_metrics_callback,
            errorCallback);
    } else {
        let currentMetricId = metric_list[0];
        clientConnector.describe_metric(sensorId, currentMetricId, (metric_info) => {
            console.log('METRIC DESCRIPTION-----', metric_info);
            if (metricName == JSON.parse(metric_info).name) {
                push_metric(currentMetricId);
            } else {
                metricsList.splice(0, 1);
                getMetric(metric_list)
            }
        });
    }
}

function create_metrics_callback(metric_response) {
    console.log('METRICS ------- ', metric_response);

    let metric = JSON.parse(metric_response);
    metricId = metric[0].metricId;
    push_metric(metricId);
}

function push_metric(metricId) {
    let metricData = [{"value": Math.floor(Math.random() * 10 + 20), "metricId": `${metricId}`}];

    /** PUSH METRIC VALUES - (sensorId, metricData, callback, errorCallback) */
    clientConnector.put_metric(sensorId, JSON.stringify({metrics: metricData}), (push_response) => {
            console.log('RESPONSE ---------', push_response);
            clientConnector.disconnect_api();
        },
        errorCallback);
}

function errorCallback(error) {
    console.log(error);
    clientConnector.disconnect_api();
}
