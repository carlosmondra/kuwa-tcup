var fs = require('fs');
var https = require('https');
const mysql = require('mysql');
const express = require('express');
const port = process.env.PORT || 8081;

const app = express();

var pool = mysql.createPool({
    connectionLimit : 100,
    host     : 'localhost',
    user     : 'root',
    password : 'sqlpassword',
    database : 'alpha_kuwa_registrar_moe',
    timezone : 'local',
    dateStrings : true
});

var credentials = {
    key : fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}

app.get('/registration', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    pool.getConnection((error,connection) => {
        if (error) {
            return res.json({"code" : 100, "status" : "Error in connecting to database"});
            return;
        }
        console.log('UI backend has connected to Kuwa database!');
        connection.query("SELECT * FROM registration", (err,rows) => {
            if (!err) {
                connection.release();
                rows = JSON.parse(JSON.stringify(rows));
                return res.json(rows);
            }
            else {
                return res.json({"code" : 100, "status" : "Error in querying database"});
                return;
            }
        });
        connection.on('error', (err) => {
            return res.json({"code" : 100, "status" : "Error in connecting to database"});
            return;
        })
    });
});

https.createServer(credentials, app)
    .listen(port, function () {
        console.log('Server listening on port ' + port);
    });
