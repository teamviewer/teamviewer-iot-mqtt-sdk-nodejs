const TvIoT = require('../nodejs_sdk/tv_iot_nodejs_sdk.js');
const path = require('path');

const TV_IOT_CONFIG = {
    'MqttHost': 'localhost',
    'MqttPort': 18884,
    'MqttProvisionPort': 18883,
    'CaFile': '/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt',
    'CertFolder': path.resolve(process.cwd(), 'cert'),
    'logFilePath' : '/tmp/tv_iot_sdk.log',  //replace with your log file path
    'logLevel' : "info" 

};

const metricsList = [
        {
            'matchingId': '1',
            'valueType': 'string',
            'name': 'metric1_name',
            'valueAnnotation': 'unit1'
        },
        {
            'matchingId': '2',
            'valueType': 'integer',
            'name': 'metric2_name',
            'valueAnnotation': 'unit2'
        }
    ];


function errorCallback(error) {
    console.log(error);
    clientConnector.disconnect_api();
}


clientConnector = new TvIoT(TV_IOT_CONFIG);

clientConnector.provision();

clientConnector.on('clientCreated', (connId) => {

    console.log('CONNECTION ID', connId);

    clientConnector.disconnect_api();
    clientConnector = new TvIoT(TV_IOT_CONFIG);
    clientConnector.connect_api(clientConnector.clientCertFile(connId), clientConnector.clientKeyFile(connId));

    clientConnector.on('connected', () => {
        console.log(`Connected securely to the API: ${connId}`);

        /** CREATE SENSOR - create_sensor(sensorName, callback, errorCallback)*/
        clientConnector.create_sensor('my_sensor', (response) => {
                console.log('SENSOR -------- ', response);

                let sensor = JSON.parse(response);

                /** CREATE METRIC - create_metrics(sensorId, metricDefinition, callback, errorCallback) */
                clientConnector.create_metrics(sensor.sensorId, JSON.stringify({metrics: metricsList}), (metric) => {
                        console.log('METRICS ------- ', metric);
                        clientConnector.disconnect_api();
                    },
                    errorCallback);
            },
            errorCallback);
    });

});

clientConnector.on('errorCreatingClient', function (err) {
    console.log('err: ' + err);
});


