// Mongo
const MongoClient = require('mongodb').MongoClient;
const db = require('./config/db');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var record = {};

// Mongo connect
MongoClient.connect(db.url, (err, database) => {
	if (err)
		return console.log(err)

	// Routing
	app.get('/', function(req, res) {
		res.sendFile(__dirname + '/index.html');
	});

	//Socket
	io.on('connection', function(socket) {
		// Load 20 recent messages for connected user
		var lastRecord = database.collection('messages').find().sort({$natural:-1}).limit(20);
		lastRecord.toArray().then(function(data){			
			socket.emit('load old message', data.reverse());
		});

		socket.on('chat message', function(msg) {
			if (!socket.user)
			{
				socket.emit('login need', {});
				console.log('user has no name');
				return false;
			}
			record = {
				text: msg,
				user: socket.user
			};
			database.collection('messages').insert(record, (err, result) => {
				if (err) {
					console.log('An error has occurred');
				} else {
					io.emit('chat message', result.ops[0]);
				}
			});
		});
		
		socket.emit('login need', {});

		socket.on('login', function(name) {
			socket.user = name.trim();
		});
	});

	// Http
	http.listen(port, function() {
		console.log('listening on *:' + port);
	});
});