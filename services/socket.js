const {checkUserExists,getConnectedUser, deleteUser, addUser, getAvailableUsers, updateCurrentUser, setEngaged, setRoomId, updateUserStatus,getRoomId} = require('./db');


module.exports = io => {

    const currentUsers = {};


    io.on('connection', (socket) => {
        console.log('User connected');


        socket.emit('getUser',{userId: socket.id});

        
        socket.on('addUser', function(data) {
            const {userId,gender} = data;
            checkUserExists({userId},(status,values)=> {
                const userExists = JSON.parse(JSON.stringify(values));
                if(!(userExists.length > 0)){
                    addUser({socketId:userId,gender},(sql,values,cb) => {
                        console.log(`User added with userId: ${userId} & gender: ${gender} `)
                    } )
                }
            });
        
        })
    

        var total=io.engine.clientsCount;
        socket.emit('setCount',total);


        socket.on('connectWithUser', function (data) {
            const {roomId,gender} = data;
            getAvailableUsers({socketId: socket.id, gender: gender}, (status, values) => {
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
                        type: 'accUser'
                    });
                    socket.to(engagedRoomId).emit('userConnected', {
                        id: engagedRoomId,
                        userId: engagedUserId,
                        reqUser: engagedUserId,
                        accUser: socket.id,
                        type: 'reqUser'
                    })
                } else {
                    setRoomId({roomId, userId: socket.id}, (sql, values, cb) => {
                        socket.join(roomId);
                        socket.emit('joinedRoom', {
                            id: roomId,
                            userId: socket.id,
                            reqUser: socket.id,
                            accUser: "None",
                            type: 'reqUser'
                        })
                    })
                }

            });


        });

        socket.on("onUserTyping", (data)=> {
            const {roomId,status,userId} = data;
            socket.to(roomId).emit("userTyping", {
                "roomId": roomId,
                "userId": userId,
                "status": status
            })
        });

        socket.on('onMessage', (data) => {
            const roomId = data['roomId'];
            const message = data['message'];
            const type = data['type'];
            const userId = data['userId'];
            const time = data['time'];
            socket.to(roomId).emit(`newMessage`, {message, time: time,type, userId, roomId});
        });


        socket.on('leaveRoom', function (data) {

            if(data && data.roomId) {
                getConnectedUser({roomId:data.roomId, userId: socket.id}, (status, values) => {
                    const connectedUser = JSON.parse(JSON.stringify(values));
                    if (connectedUser.length > 0) {
                        const connectedUserId = connectedUser[0]['id'];
                        console.log(`User has left from the room ${data.roomId}`);
                        socket.to(data.roomId).emit('userLeft', {id: connectedUserId});

                        updateUserStatus({userId: socket.id}, (status, values) => {
                            console.log(`Client ${socket.id} status has been updated`);
                        });

                        updateUserStatus({userId: connectedUserId}, (status, values) => {
                            console.log(`Client ${connectedUserId} status has been updated`);
                        });


                        io.of('/').in(data.roomId).clients((error, socketIds) => {
                            if (error) throw error;
                            socketIds.forEach(socketId => {
                                const currentSocket = io.sockets.sockets[socketId];
                                currentSocket.leave(data.roomId);
                            });
                            console.log(`Client - ${socketIds} removed from the room ${data.roomId}`);
                        });

                    } else {
                        console.log(`B - Client - ${socket.id} removed from the room ${data.roomId}`);
                        updateUserStatus({userId: socket.id}, (status, values) => {
                            console.log(`Client ${socket.id} status has been updated`);
                            socket.leave(data.roomId);
                        });

                    }
                })

            }else {
                getRoomId({userId:socket.id}, (sql,values,db)=> {
                    const connectedUsers = JSON.parse(JSON.stringify(values));
                    if(connectedUsers.length > 0) {
                        const roomId = connectedUsers[0]['roomId'];
                        updateUserStatus({userId: socket.id}, (status, values) => {
                            console.log(`Client ${socket.id} status has been updated`);
                            socket.leave(roomId);
                        });


                    }
                });
            }
        });

        socket.on('getCount', function(data) {
            var _total=io.engine.clientsCount;
            socket.emit('setCount',_total);
        })

        socket.on('disconnect', function (data) {

            socket.emit('setCount',total);

            getRoomId({userId:socket.id}, (sql,values,db)=> {
                const connectedUsers = JSON.parse(JSON.stringify(values));
                if(connectedUsers.length > 0) {
                    const disconnectedUser = connectedUsers[0];
                    const roomId = disconnectedUser['roomId'];

                    if(roomId) {
                        socket.to(roomId).emit('userLeft', {id: disconnectedUser['id']});

                        io.of('/').in(roomId).clients((error, socketIds) => {
                            if (error) throw error;
                            socketIds.forEach(socketId => {
                                const currentSocket = io.sockets.sockets[socketId];
                                if(socketId !== socket.id) {
                                    checkUserExists({userId:socketId},(status,values)=> {
                                        const userExists = JSON.parse(JSON.stringify(values));
                                        if(userExists.length > 0){
                                            updateUserStatus({userId: socketId}, (status, values) => {
                                                console.log(`Client ${socket.id} status has been updated`);
                                            });
                                        }
                                    });

                                }
                                currentSocket.leave(roomId);
                            });
                            console.log(`Client - ${socketIds} removed from the room ${roomId}`);
                        });
                    }


                    deleteUser({userId: socket.id}, (sql, values, db) => {
                        console.log(`Client ${socket.id} has been removed from the database`);
                    })

                }

            });


        });

    });


};
