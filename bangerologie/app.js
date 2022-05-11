// Include the cluster module
var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for terminating workers
    cluster.on('exit', function (worker) {

        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

    // Code to run if we're in a worker process
} else {
    var AWS = require('aws-sdk');
    var express = require('express');
    var bodyParser = require('body-parser');

    const config = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // hardcoding credentials is a bad practice
        accessSecretKey: process.env.AWS_SECRET_ACCESS_KEY, // please use env vars instead
        region: "us-east-1"
    }

    AWS.config.update(config);

    var ddb = new AWS.DynamoDB(config);

    var app = express();

    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    app.use(bodyParser.urlencoded({ extended: false }));

    app.get('/', function (req, res) {
        res.render('empty', {
            static_path: 'static',
            theme: process.env.THEME || 'flatly',
            flask_debug: process.env.FLASK_DEBUG || 'false'
        });
    });

    app.get('/colocathon', function (req, res) {

        var params = {
            TableName: process.env.COLOCATHON_DBNAME
        };

        ddb.scan(params, (err, data) => {
            if (err) {
                console.log(err);
            } else {
                var items = [];
                for (var i in data.Items)
                    items.push(data.Items[i]);

                res.render('colocathon', {
                    static_path: 'static',
                    theme: process.env.THEME || 'flatly',
                    flask_debug: process.env.FLASK_DEBUG || 'false',
                    teams: items,
                    img_url: process.env.IMG_PATH
                });
            }
        });


    });

    var port = process.env.PORT || 3000;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}