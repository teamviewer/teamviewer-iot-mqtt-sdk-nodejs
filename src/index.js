const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pem = require('pem');
const Emmiter = require('events');
const log4js = require('log4js');

class TVIoT extends Emmiter {
    // --- Connector

    constructor(config) {

        super();

        this.config = {
            'provisioningConnectionOptions': {
                'port': config.MqttProvisionPort,
                'protocol': 'tls',
                'host': config.MqttHost,
                'trustedCA': config.CaFile,
                'rejectUnauthorized': false
            },

            'connectionOptions': {
                'port': config.MqttPort,
                'protocol': 'mqtt',
                'host': config.MqttHost,
                'trustedCA': config.CaFile,
                'rejectUnauthorized': false
            },

            'loggerConfig': {
                logFilePath : config.logFilePath,
                logLevel : config.logLevel
             },

            'connectorsFilePath': '/var/lib/teamviewer-iot-agent/connectors.json',
            'certsDir': config.CertFolder,
            'keysDir': config.CertFolder,
            'certFileExtension': config.certFileExtension
        };
        this.APIversion = '/v1.0/';
        log4js.configure({
             appenders: {TV_IOT_SDK: { type: 'file', filename: this.config.loggerConfig.logFilePath ? this.config.loggerConfig.logFilePath : "/var/log/teamviewer-iot-agent/iot-nodejs-sdk.log"}},
             categories: {default :{ appenders: [ 'TV_IOT_SDK' ], level: this.config.loggerConfig.logLevel ? this.config.loggerConfig.logLevel : 'info' }}
        });

        this.logger = log4js.getLogger('TV_IOT_SDK');
        this.connectionOptions = this.config.connectionOptions;
        this.provisioningConnectionOptions = this.config.provisioningConnectionOptions;

    }

    connect_api(certFile, keyFile) {

        if (!certFile || !keyFile) {
            this.connectClient_(this.provisioningConnectionOptions);
        } else {
            this.connectionOptions.key = fs.readFileSync(path.join(keyFile));
            this.connectionOptions.cert = fs.readFileSync(path.join(certFile));

            pem.readCertificateInfo(this.connectionOptions.cert, this.getConnectorId_.bind(this));
        }
    }

    disconnect_api(callback) {
        this.logger.debug("disconnecting api")
        this.client.end(false, callback);
    }

    getConnectorId_(err, obj) {
        this.connectorId = obj.commonName;
        if(err) {
                this.logger.error(err);
                return;
        }
        this.logger.debug("connectorId - " + this.connectorId)
        this.connectClient_(this.connectionOptions);
    }

    connectClient_(connectionOptions) {
        try {
            this.client = mqtt.connect(connectionOptions);
            if (this.connectorId) {
                let allClientTopics = this.APIversion + this.connectorId + '/#';
                this.client.subscribe(allClientTopics);
            }

            this.client.on('connect', this.onConnect_.bind(this));
            this.client.on('message', this.onMessage_.bind(this));
            this.client.on('error', (msg) => {
                this.logger.error(msg);
                this.emit('error', msg);
            });
            this.client.on('offline', (msg) => {
                this.logger.debug("offline event " + msg);
                this.emit('offline', msg);
            });
            this.client.on('close', (msg) => {
                this.logger.debug("close event " + msg);
                this.emit('close', msg);
            });

            process.on('SIGINT', () => {
                if (this.client) {
                    this.logger.info('Closing MQTT Client Connections ...');
                    this.client.end(false, () => {
                        this.logger.info(`Client connection closed: ${this.connectorId}`);
                    });
                }
            });
        } catch (err) {
            this.logger.error("problem with connection client " + err);
            this.emit('problemConnectingClient', err);
        }

    }

    onConnect_() {
        this.logger.debug("connected");
        this.emit('connected', this.connectorId);
    }

    onMessage_(topic, message) {
        message = message.toString();
        this.logger.debug("recieved message " + message);
        this.emit(topic, message, topic);
    }

    publishAPI_(subscribeTopic, publishTopic, message, callback, errorTopic, errorCallback) {
        this.logger.debug(`\n\nSub: ${subscribeTopic}\nPub: ${publishTopic}\nMsg: ${message}\n\n`);
        this.client.publish(publishTopic, message);
        this.once(subscribeTopic, callback);
        if (errorTopic) {
            this.once(errorTopic, typeof errorCallback != 'undefined' ? errorCallback : callback);
        }
    }

    subscribeAPI_(subscribeTopic, callback) {

        this.logger.debug(`\n\nSub: ${subscribeTopic}\n\n`);

        this.client.subscribe(subscribeTopic);

        if (callback) {
            this.on(subscribeTopic, callback);
        }

    }

    unsubscribeAPI_(subscribeTopic, callback) {
        this.logger.debug(`\n\nUnsub: ${subscribeTopic}\n\n`);
        this.client.unsubscribe(subscribeTopic, callback);
    }

    normalizeCert(certFile) {
        let cert = certFile.toString();
        return cert.endsWith('\n') ? cert : cert = cert + '\n';
    }

    clientCertFile(clientId) {
        if (this.config.certFileExtension) {
            return `${this.config.certsDir}/cert.pem`;
        } else {
            return `${this.config.certsDir}/cert-${clientId}.pem`;
        }
    }

    clientKeyFile(clientId) {
        if (this.config.certFileExtension) {
            return `${this.config.keysDir}/key.pem`;
        } else {
            return `${this.config.keysDir}/key-${clientId}.pem`
        }
    }

    csrRequest_(err, obj) {
        var csrReq = this.normalizeCert(obj.csr);
        this.clientKey = obj.clientKey;
        var csrHash = crypto.createHash('sha256').update(csrReq, 'ascii').digest('hex');
        var subscribeTopic = '/certBack/' + csrHash;
        var errorTopic = '/certBack/' + csrHash + '/error';
        var publishTopic = '/createConnector';
        var message = csrReq.toString('ascii');
        this.subscribeAPI_(subscribeTopic);
        this.subscribeAPI_(subscribeTopic + '/+');
        this.publishAPI_(subscribeTopic, publishTopic, message, this.saveCert_.bind(this), errorTopic);
    }

    saveCert_(crt) {
        this.crt = crt;
        pem.readCertificateInfo(crt, this.writeFiles_.bind(this));
        this.logger.debug("save crt file " + crt);
    }

    writeFiles_(err, obj) {
        this.connectorId = obj.commonName;
        if (this.config.certFileExtension) {
            var certFile = `${this.config.certsDir}/cert.pem`;
            var keyFile = `${this.config.keysDir}/key.pem`;
        } else {
            var certFile = `${this.config.certsDir}/cert-${this.connectorId}.pem`;
            var keyFile = `${this.config.keysDir}/key-${this.connectorId}.pem`;
        }
        const dir = this.config.certsDir;
        try{
            !fs.existsSync(dir) && fs.mkdirSync(dir);

            fs.writeFileSync(certFile, this.crt);
            fs.writeFileSync(keyFile, this.clientKey);

            this.logger.debug(`Key / Certificate for connector( ${this.connectorId} ) has been saved as ${keyFile} / ${certFile}`);
            this.emit('clientCreated', this.connectorId);
            
        } catch (err) {
            this.logger.error("problem with writing key or/and cert files: " + err);
            this.emit('errorCreatingClient', err);
        }


    }

    // --- Public Methods
    // --- 2.Connector

    provision() { // Creates a certificate for a new connector
        /*
        2.1
        */

        this.connect_api(); // with no arguments, connects using 1883 port

        this.on('connected', function () {
            pem.createCSR({hash: 'sha256'}, this.csrRequest_.bind(this));
        }.bind(this));
    }

    list_sensors(clientId, callback, errorCallback) {

        /*
        2.2
        */
        var publishTopic = this.APIversion + clientId + '/inventory';
        var subscribeTopic = publishTopic + '/inbox';
        var errorTopic = publishTopic + '/error/inbox';
        var message = '{}';

        this.publishAPI_(subscribeTopic, publishTopic, message, callback, errorTopic, errorCallback);
    }

    deprovision(clientId, callback, errorCallback) {

        /*
        2.3
        */

        var publishTopic = this.APIversion + clientId + '/delete';
        var subscribeTopic = publishTopic + '/info/inbox';
        var errorTopic = publishTopic + '/error/inbox';
        var message = '{}';

        this.publishAPI_(subscribeTopic, publishTopic, message, callback, errorTopic, errorCallback);
    }

    check_connection(callback) {

        /*
        2.4
        /:version/:connectorId/ping

        */

        var publishTopic = this.APIversion + this.connectorId + '/ping';
        var subscribeTopic = publishTopic + '/info/inbox';
        var message = '{"request":"This is a ping!"}';

        this.publishAPI_(subscribeTopic, publishTopic, message, callback);
    }

    // ---  3.Sensor

    create_sensor(sensorName, callback, errorCallback) {

        /*
        3.1
        /:version/:connectorId/sensor/create
        */

        var publishTopic = this.APIversion + this.connectorId + '/sensor/create';
        var subscribeTopic = this.APIversion + this.connectorId + '/sensor/inbox';
        var errorTopic = this.APIversion + this.connectorId + '/sensor/error/inbox';

        var message = `{ "name" : "${sensorName}" }`;

        this.publishAPI_(subscribeTopic, publishTopic, message, callback, errorTopic, errorCallback);

    }

    put_metric(sensorId, metricData, callback, errorCallback) {

        /*
        3.2
        This method should be renamed to putMetrics (plural)
        return topic is not documented

        /:version/:connectorId/sensor/:sensorId
        /:version/:connectorId/sensor/:sensorId/info/inbox
        */

        var reqBase = this.APIversion + this.connectorId + '/sensor/' + sensorId;

        var publishTopic = reqBase + '';
        var subscribeTopic = reqBase + '/info/inbox';
        var errorTopic = reqBase + '/error/inbox';

        var message = metricData;

        this.publishAPI_(subscribeTopic, publishTopic, message, callback, errorTopic, errorCallback);
    }

    update_sensor(sensorId, sensorName, callback) {
        /*
        3.3
        /:version/:connectorId/sensor/:sensorId/update
        /:version/:connectorId/sensor/:sensorId/error/inbox
        */

        var reqBase = this.APIversion + this.connectorId + '/sensor/' + sensorId + '/update';

        var publishTopic = reqBase + '';
        var subscribeTopic = reqBase + '/info/inbox';
        var errorTopic = reqBase + '/error/inbox';

        var message = `{ "name" : "${sensorName}" }`;

        this.publishAPI_(subscribeTopic, publishTopic, message, callback, errorTopic);
    }

    describe_metric(sensorId, metricId, callback) {

        /*
        3.4
        /:version/:connectorId/sensor/:sensorId/metric/:metricId/inventory
        /:version/:connectorId/sensor/:sensorId/metric/:metricId/inventory/inbox

        /:version/:connectorId/sensor/:sensorId/inventory/error/inbox
        -m {} No mention in documentation about empty JSON
        */

        var reqBase = this.APIversion + this.connectorId + '/sensor/' + sensorId + '/metric/' + metricId + '/inventory';

        var publishTopic = reqBase + '';
        var subscribeTopic = reqBase + '/inbox';
        var errorTopic = this.APIversion + this.connectorId + '/sensor/' + sensorId + '/inventory/error/inbox';

        var message = '{}';

        this.publishAPI_(subscribeTopic, publishTopic, message, callback, errorTopic);
    }

    delete_sensor(sensorId, callback, errorCallback) {
        /*
        3.5
        /:version/:connectorId/sensor/:sensorId/delete
        /:version/:connectorId/sensor/:sensorId/delete/info/inbox
        /:version/:connectorId/sensor/:sensorId/delete/error/inbox
        */

        var reqBase = this.APIversion + this.connectorId + '/sensor/' + sensorId + '/delete';

        var publishTopic = reqBase + '';
        var subscribeTopic = reqBase + '/info/inbox';
        var errorTopic = reqBase + '/error/inbox';

        var message = '{}';

        this.publishAPI_(subscribeTopic, publishTopic, message, callback, errorTopic, errorCallback);
    }

    // --- 4.Metric

    create_metrics(sensorId, metricDefinition, callback, errorCallback) {

        /*
        4.1

        */

        var reqBase = this.APIversion + this.connectorId + '/sensor/' + sensorId + '/metric';

        var publishTopic = reqBase + '';
        var subscribeTopic = reqBase + '/inbox';
        var errorTopic = reqBase + '/error/inbox';

        var message = metricDefinition;

        this.publishAPI_(subscribeTopic, publishTopic, message, callback, errorTopic, errorCallback);
    }

    delete_metrics(sensorId, metrics, callback) {
        /*
        4.2
        /:version/:connectorId/sensor/:sensorId/metric/delete
        /:version/:connectorId/sensor/:sensorId/delete/error/inbox
        /:version/:connectorId/sensor/:sensorId/delete/info/inbox
        */
        var reqBase = this.APIversion + this.connectorId + '/sensor/' + sensorId;

        var publishTopic = reqBase + '/metric/delete';
        var subscribeTopic = reqBase + '/metric/delete/inbox';
        var errorTopic = reqBase + '/metric/delete/error/inbox';

        var message = metrics;

        this.publishAPI_(subscribeTopic, publishTopic, message, callback, errorTopic);
    }

    update_metrics(sensorId, metrics, callback, errorCallback) {
        /*
        * 4.3
        *
        * /:version/:clientId/sensor/:sensorId/metric/update
        * /:version/:clientId/sensor/:sensorId/metric/update/info/inbox
        * /:version/:clientId/sensor/:sensorId/metric/update/error/inbox
        *
        */

        var reqBase = this.APIversion + this.connectorId + '/sensor/' + sensorId;

        var publishTopic = reqBase + '/metric/update';
        var subscribeTopic = reqBase + '/metric/update/info/inbox';
        var errorTopic = reqBase + '/metric/update/error/inbox';
        var message = metrics;

        this.publishAPI_(subscribeTopic, publishTopic, message, callback, errorTopic, errorCallback);
    }

    // --- 5.Error - When there is an error in your connector application, you can announce this error to the api with this function.

    report_connector_error(error, callback) {
        /*
        5.1
        /:version/:connectorId/error
        /:version/:connectorId/error/inbox
        */

        var reqBase = this.APIversion + this.connectorId + '/error';

        var publishTopic = reqBase + '';
        var errorTopic = reqBase + '/inbox';

        var message = error;
        this.logger.error("connector error " + error);
        this.publishAPI_(errorTopic, publishTopic, message, callback);
    }

    report_sensor_error(sensorId, error, callback) {
        /*
        5.2
        /:version/:connectorId/sensor/:sensorId/error
        /:version/:connectorId/sensor/:sensorId/error/inbox
        */

        var reqBase = this.APIversion + this.connectorId + '/sensor' + sensorId + '/error';

        var publishTopic = reqBase + '';
        var errorTopic = reqBase + '/inbox';

        var message = error;
        this.logger.error("sensor error " + error);

        this.publishAPI_(errorTopic, publishTopic, message, callback);
    }

    report_metric_error(sensorId, metricId, error, callback) {
        /*
        5.3
        /:version/:connectorId/sensor/:sensorId/metric/:metricId/error
         /:version/:connectorId/sensor/:sensorId/metric/:metricId/error/inbox
        */

        var reqBase = this.APIversion + this.connectorId + '/sensor' + sensorId + '/metric' + metricId + '/error';

        var publishTopic = reqBase + '';
        var errorTopic = reqBase + '/inbox';

        var message = error;
        this.logger.error("metric error " + error);


        this.publishAPI_(errorTopic, publishTopic, message, callback);
    }
}

module.exports = TVIoT;
