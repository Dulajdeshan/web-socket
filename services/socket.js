const uuid = require('node-uuid');
const {getConnectedUser, deleteUser, addUser, getAvailableUsers, updateCurrentUser, setEngaged, setRoomId, updateUserStatus} = require('./db');


module.exports = io => {

    const currentUsers = {};


    io.on('connection', (socket) => {
        console.log('User connected');


        addUser({socketId: socket.id}, (data, result) => {
            console.log(`User added - ${socket.id}`);
        });


        socket.on('connectWithUser', function (roomId) {
            getAvailableUsers({socketId: socket.id}, (status, values) => {
                const availableUsers = JSON.parse(JSON.stringify(values));
                if (availableUsers.length > 0) {
                    const engagedUserId = availableUsers[0]['id'];
                    const engagedRoomId = availableUsers[0]['roomId'];
                    updateCurrentUser({engagedRoomId, socketId: socket.id}, (status, values) => {
                        console.log(`Client - ${socket.id} has been updated`);
                    });
                    setEngaged({engagedUserId}, (status, values) => {
                        console.log(`Client - ${engagedUserId} has been engaged`);
                    });
                    socket.join(engagedRoomId);
                    socket.emit('joinedRoom', {
                        id: engagedRoomId,
                        userId: socket.id,
                        reqUser: engagedUserId,
                        accUser: socket.id,
                        type: 'acceptedUser'
                    });
                    socket.to(engagedRoomId).emit('userConnected', {
                        id: engagedRoomId,
                        userId: socket.id,
                        reqUser: engagedUserId,
                        accUser: socket.id,
                        type: 'acceptedUser'
                    })
                } else {
                    setRoomId({roomId, userId: socket.id}, (sql, values, cb) => {
                        socket.join(roomId);
                        socket.emit('joinedRoom', {
                            id: roomId,
                            userId: socket.id,
                            type: 'reqUser'
                        })
                    })
                }

            });


        });

        socket.on('onMessage', (data) => {
            const roomId = data['roomId'];
            const message = data['message'];
            const type = data['type'];
            const userId = data['userId'];
            socket.to(roomId).emit(`newMessage`, {message, type, userId, roomId});
        });


        socket.on('leaveRoom', function (data) {
            const {roomId} = data;

            getConnectedUser({roomId, userId: socket.id}, (status, values) => {
                const connectedUser = JSON.parse(JSON.stringify(values));
                if (connectedUser.length > 0) {
                    const connectedUserId = connectedUser[0]['id'];
                    console.log(`User has left from the room ${roomId}`);
                    socket.to(roomId).emit('userLeft', {id: connectedUserId});

                    updateUserStatus({userId: socket.id}, (status, values) => {
                        console.log(`Client ${socket.id} status has been updated`);
                    });

                    updateUserStatus({userId: connectedUserId}, (status, values) => {
                        console.log(`Client ${connectedUserId} status has been updated`);
                    });


                    io.of('/').in(roomId).clients((error, socketIds) => {
                        if (error) throw error;
                        socketIds.forEach(socketId => {
                            const currentSocket = io.sockets.sockets[socketId];
                            currentSocket.leave(roomId);
                        });
                        console.log(`Client - ${socketIds} removed from the room ${roomId}`);
                    });

                } else {
                    console.log(`B - Client - ${socket.id} removed from the room ${roomId}`);
                    socket.leave(roomId);
                }
            })
        });

        socket.on('disconnect', function (data) {
            deleteUser({userId: socket.id}, (sql, values, db) => {
                console.log(`Client ${socket.id} has been removed from the database`);
            })
        });


        // database.end();
    });


};