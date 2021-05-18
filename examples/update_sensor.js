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

clientConnector = new TvIoT(TV_IOT_CONFIG);

clientConnector.on('connected', () => {

    clientConnector.update_sensor(sensorId, 'my_new_sensor', (response) => {
        console.log('RESPONSE ---------', response);
        clientConnector.disconnect_api();
    });
});

clientConnector.connect_api(clientConnector.clientCertFile(clientId), clientConnector.clientKeyFile(clientId));

