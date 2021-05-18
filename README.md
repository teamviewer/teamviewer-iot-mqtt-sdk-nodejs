TeamViewer IoT SDK for Node.js
==============================

This documentation describes the use of TeamViewer IoT SDK for connecting and publishing data to TeamViewer Iot Agent using Node.js.


-   [Getting started](#getting-started)
-   [Installation](#installation)
-   [Client](#client)
    -   [Constructor](#constructor)
    -   [Provisioning / Deprovisioning](#provisioning-\-deprovisioning)
    -   [Connecting / Disconnecting](#connecting-\-disconnecting)
    -   [Preparing data for publishing](#preparing-data-for-publishing)
        -  [Sensor](#sensor)
        -  [Metric](#metric)
    -   [Pushing data to TeamViewer IoT Agent](#pushing-data-to-teamviewer-iot-agent)
-   [License](#license)
-   [Support](#support)

<br/>

## Getting started

### Minimum requirements

-   Node version \>= 6.14.0, suggesting version \>= 8.3.0

To check your Node version please run the following command:

``` {.sourceCode .sh}
node --version
```

-   [TeamViewer IoT Agent](https://community.teamviewer.com/t5/TeamViewer-IoT-Knowledge-Base/Install-TeamViewer-IoT-Agent/ta-p/17084)
-   Some of these libs can be asked to install/update:

``` {.sourceCode .sh}
sudo apt-get update
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Alternatively, for Node.js 10:

``` {.sourceCode .sh}
sudo apt-get update
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs  
```

<br/>

## Installation

Download and install Node.js SDK

``` {.sourceCode .sh}
npm install @teamviewer/teamviewer-iot-mqtt-sdk
```

<br/>

## Examples

You can download examples from [here](../master/examples).

<br/>

## Use the SDK

### Client

The client is the main class used to establish an asynchronous connection with TeamViewer IoT Agent, as well as to put data in the agent.

<br/>

### Constructor

#### TVCMI\_client()

``` {.sourceCode .javascript}
new TvIoT(TV_IOT_CONFIG)
```

The constructor takes the following arguments:

``` {.sourceCode .javascript}
// connection parameters
const TV_IOT_CONFIG = {
    'MqttHost': 'localhost',
    'MqttPort': 18884,
    'MqttProvisionPort': 18883,
    'CaFile': '/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt',
    'CertFolder': path.resolve(process.cwd(), 'cert'),
    'logFile' : 'your log file path.log', 
    'logLevel' : 'info' 
};


// Creating a new client to connect to TeamViewer IoT Agent
clientConnector = new TvIoT(TV_IOT_CONFIG);
```

The constructor takes the following arguments:

**parameters**

For both of the options the following fields must be initialized.

-   *MqttHost* - the host name.
-   *MqttPort* - Port for certificate exchange.
-   *MqttProvisionPort* - Secure port for establishing a TLS connection.
-   *CaFile* - CA provided by TeamViewer Iot Agent. Default location: /var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt.
-   *CertFolder* - Folder where the certificate signing request, private key and authorized certificates will be stored.
-   *logFile* - Optional. Log file location for SDK. Default location: /var/log/teamviewer-iot-agent/iot-nodejs-sdk.log.
-   *logLevel* - Optional. Level for logging. Possible values: error, debug, info(default), warn, all, fatal, off( disable logging )

#### on('connected', callback)

``` {.sourceCode .javascript}
on('connected', callback);
```

``` {.sourceCode .javascript}
clientConnector.on('connected', () => {
    console.log('Secure connection is established.');
});
```

#### on('error', callback)

``` {.sourceCode .javascript}
on('error', callback);
```

``` {.sourceCode .javascript}
clientConnector.on('error', (msg) => {
    console.log(msg);
});
```

Called instead of initialized callback when TeamViewer IoT Agent replies with an error.

<br/>

### Provisioning / Deprovisioning

#### provision()

``` {.sourceCode .javascript}
clientConnector.provision();
```

``` {.sourceCode .javascript}
const TV_IOT_CONFIG = {
    'MqttHost': 'localhost',
    'MqttPort': 18884,
    'MqttProvisionPort': 18883,
    'CaFile': '/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt',
    'CertFolder': path.resolve(process.cwd(), 'cert')
};

clientConnector = new TvIoT(TV_IOT_CONFIG);

clientConnector.provision();
```

Checks for a private key and an authorized certificate in the CertFolder location passed to the constructor. If not found, creates a private key, certificate signing request and insecurely connects to TeamViewer IoT Agent to obtain an authorized certificate.

#### on('clientCreated', callback) - on success provision

``` {.sourceCode .javascript}
clientConnector.on('clientCreated', function(connectorId) {
    console.log('created client with id: ' + connectorId);
});
```

#### on('errorCreatingClient', callback) - on fail provision

``` {.sourceCode .javascript}
clientConnector.on('clientCreated', function(connectorId) {
    console.log('created client with id: ' + connectorId);
});
```

#### deprovision()

``` {.sourceCode .javascript}
clientConnector.provision(clientId, callback, errorCallback);
```

Deprovisions the client and deletes all the data associated with it. After this step any updates cannot be made to the client.

<br/>

### Connecting / Disconnecting

#### connect\_api()

``` {.sourceCode .javascript}
clientConnector.connect_api( clientConnector.clientCertFile(connectorId), clientConnector.clientKeyFile(connectorId) );
```

#### connect\_api()

``` {.sourceCode .javascript}
clientConnector.disconnect_api();
```

#### Preparing data for publishing

Before the data can be published to TeamViewer IoT Agent, it needs to be formated according to the data model used by TeamViewer IoT Agent . A sensor and a metric must be created to respectively group and describe the data pushed to TeamViewer IoT Agent.

<br/>

### Sensor

Sensor is a logical unit that allows to group one or more metrics for putting data to TeamViewer IoT. It is recommended to update all metrics that belong to the same sensor simultaneously to ensure that the data arrives with the same timestamp, so that it is better processed by rule engines.

#### create\_sensor()

``` {.sourceCode .javascript}
clientConnector.create_sensor(sensor_name, callback);
```

sensor\_name | the name of the sensor callback | the callback function which takes response as function parameter (response Message: {"name": "SensorName", "sensorId”:"d4170d999b9240a5863df622aad9fc4a"})

``` {.sourceCode .javascript}
function errorCallback(error) {
    console.log(error);
    clientConnector.disconnect_api();
}       

clientConnector.create_sensor('my_sensor', (response) =>{
        console .log('SENSOR -------- ', response);
    },
    errorCallback);
```

#### update\_sensor()

``` {.sourceCode .javascript}
clientConnector.update_sensor(sensorId, sensorName, callback);      
```

Updates the description of the sensor. The function parameters are: sensorId | The sensor ID obtained when creating the sensor. sensorName | The name of the sensor. callback | the callback function which takes response as function parameter

#### list\_sensors()

``` {.sourceCode .javascript}
clientConnector.list_sensors(connecterId, callback);        
```

Through the message field of the callback returns a JSON object listing the metadata of all registered sensors and their metric IDs of the specific client.

``` {.sourceCode .javascript}
// Callback response
[
   {
     "metrics" :
     [
        {
          "link" : "/v1.0/f695c80fc5f74f6c9ee08229c2b3bd3a/sensor/ba3a8a1807c141d9b4f224cc0cd8da66/metric/021b47f4268b4cc3982ce2d9cb2b8693/inventory",
          "metricId" : "021b47f4268b4cc3982ce2d9cb2b8693"
        },
        { 
          "link" : "/v1.0/f695c80fc5f74f6c9ee08229c2b3bd3a/sensor/ba3a8a1807c141d9b4f224cc0cd8da66/metric/5f27b1c2487a4c759af81b05397945f2/inventory",
          "metricId" : "5f27b1c2487a4c759af81b05397945f2"
        }
     ],
     "name" : "my_sensor",
     "sensorId" : "ba3a8a1807c141d9b4f224cc0cd8da66",
     "store" : true
   }
]
```

#### delete\_sensor()

``` {.sourceCode .javascript}
clientConnector.delete_sensors(connecterId, callback);
```

sensorId | The sensor ID obtained when creating the sensor.

<br/>

### Metric

Metric is the container for the actual value which is pushed to TeamViewer IoT. Metrics must belong to a sensor and can’t exist independently.

#### create\_metric()

``` {.sourceCode .javascript}
clientConnector.create_metrics(sensorId, metricDefinition, callback, errorCallback);
```

``` {.sourceCode .javascript}
const metricsList = [{
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
                }];

function errorCallback(error) {
    console.log(error);
    clientConnector.disconnect_api();
}


clientConnector.create_metrics(sensorId, JSON.stringify({metrics: metricsList}), (metric) => {
    console.log('METRICS ------- ', metric);
    clientConnector.disconnect_api();
},
errorCallback);
```

Creates a metric describing the data to be published to TeamViewer IoT Agent. You must wait for the callback to obtain and save the metric ID. The metric ID will be used to later identify the metric. One or more metrics can be created simultaneously. The parameters for the function are:

**metricDefinition**

The message definition must contain the necessary metadata for the metrics in JSON format, the following fields must be present in the JSON message: matchingId, valueType, name and valueAnnotation. This way of defining a metric gives a complete flexibility in what kind of data you want to push to TeamViewer IoT.

*metrics:* Array - Lists the definitions of all metric objects to be registered. *matchingId:* String - Used to match the ID-s with metrics.

*name:* String - Name of the metric.

*valueAnnotation:* String - Optional field to define a custom unit for metric values.

valueType: String - Defines the type of the custom defined unit. Valid entries are: | bool | string | double | integer

``` {.sourceCode .javascript}
// Callback response
[
   {
     "matchingId" : "1",
     "metricId" : "5f27b1c2487a4c759af81b05397945f2"
   },
   {
     "matchingId" : "2",
     "metricId" : "021b47f4268b4cc3982ce2d9cb2b8693"
   }
]
```

#### describe\_metric()

``` {.sourceCode .javascript}
clientConnector.describe_metric(sensorId, metricId, callback)
```

#### delete\_metric()

``` {.sourceCode .javascript}
clientConnector.delete_metrics(sensorId, metrics, callback) 
```

#### Pushing data to TeamViewer IoT Agent

#### put\_metric()

``` {.sourceCode .javascript}
clientConnector.put_metric(sensorId, metricData, callback, errorCallback);
```

Puts metric data in TeamViewer IoT Agent.

sensorId: the sensor ID obtained when creating the sensor. metricData: JSON containing metric values.

<br/>

## License

This SDK is distributed under the MIT License - see the [LICENSE](LICENSE) file for details.

<br/>

## Support

Bugs and issues can be reported through issues section at <https://github.com/teamviewer/teamviewer-iot-mqtt-sdk-nodejs/issues>.
