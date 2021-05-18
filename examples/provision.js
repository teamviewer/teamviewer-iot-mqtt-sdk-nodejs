const TvIoT = require('../nodejs_sdk/tv_iot_nodejs_sdk.js');
const path = require('path');

const TV_IOT_CONFIG = {
    'MqttHost': 'localhost',
    'MqttPort': 18884,
    'MqttProvisionPort': 18883,
    'CaFile': '/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt',
    'CertFolder': path.resolve(process.cwd(), 'cert'),
    'logFilePath' : '/tmp/tv_iot_sdk.log',  //replace with your log file path
    'logLevel' : "debug" 


};

clientConnector = new TvIoT(TV_IOT_CONFIG);

clientConnector.provision();

clientConnector.on('clientCreated', function (connId) {
    console.log('created client with id: ' + connId);
});

clientConnector.on('errorCreatingClient', function (err) {
    console.log('err: ' + err);
    clientConnector.disconnect_api();
});

