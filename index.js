// const app = require('express')();
// const http = require('http').createServer(app);
//
//
// app.get('/', (req, res) => {
//     res.send("Node Server is running. Yay!!")
// });
//
// console.log("adfsadads");
//
// //Socket Logic
// const socketio = require('services.io')(http);
// console.log("adfsadads");
//
// socketio.on("connection", (userSocket) => {
//     console.log("asaa");
//     userSocket.on("send_message", (data) => {
//         console.log(data);
//         userSocket.broadcast.emit("receive_message", data)
//     })
// });
//
// http.listen(3000);

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);


let users = [];

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});
require('./services/socket')(io);





http.listen(process.env.PORT || 5000, function(){
    console.log('listening on *:5000');
});


