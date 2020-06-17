const {checkUserExists,getConnectedUser, deleteUser, addUser, updateUser, getAvailableUsers, updateCurrentUser, setEngaged, setRoomId, updateUserStatus,getRoomId} = require('./db');


module.exports = io => {

    const currentUsers = {};


    io.on('connection', (socket) => {
        console.log('User connected');


        socket.emit('getUser',{userId: socket.id});

        
        socket.on('addUser', function(data) {

            const {socketId,userId,gender} = data;

            checkUserExists({userId},(status,values)=> {

                const userExists = JSON.parse(JSON.stringify(values));

                if(!(userExists.length > 0)){

                    addUser({socketId,userId,gender},(sql,values,cb) => {

                        console.log(`User added with socketId: ${socketId} & fbId: ${userId} & gender: ${gender} `)

                    } )
                }else {
                    updateUser({socketId,userId},(sql,values,cb) => {
                        console.log(`User updated with socketId: ${socketId} & userId: ${userId}`)
                    })
                }
            });
        
        })

        socket.on('updateUser', function(data) {

            const {socketId,userId,roomId} = data;

            checkUserExists({userId},(status,values)=> {
                const userExists = JSON.parse(JSON.stringify(values));
                if((userExists.length > 0)){
                    updateUser({socketId,userId},(sql,values,cb) => {
                        console.log(`User updated with socketId: ${socketId} & userId: ${userId}`)
                    })
                    socket.join(roomId);
                }
            });


        
        })
    

        var total=io.engine.clientsCount;
        socket.emit('setCount',total);


        socket.on('connectWithUser', function (data) {
            console.log(socket.id);
            const {roomId,userId,gender} = data;
            getAvailableUsers({socketId: socket.id,userId, gender}, (status, values) => {
                const availableUsers = JSON.parse(JSON.stringify(values));
                if (availableUsers.length > 0) {
                    const engagedUserId = availableUsers[0]['userId'];
                    const engagedUserSocketId = availableUsers[0]['id'];
                    const engagedRoomId = availableUsers[0]['roomId'];
                    updateCurrentUser({engagedRoomId, userId}, (status, values) => {
                        console.log(`Client - ${socket.id} has been updated`);
                    });
                    setEngaged({engagedUserId}, (status, values) => {
                        console.log(`Client - ${engagedUserId} has been engaged`);
                    });
                    socket.join(engagedRoomId);
                    socket.emit('joinedRoom', {
                        roomId: engagedRoomId,
                        socketId: socket.id,
                        userId: engagedUserId,
                        reqUser: engagedUserId,
                        accUser: socket.id,
                        type: 'accUser'
                    });
                    socket.to(engagedRoomId).emit('userConnected', {
                        roomId: engagedRoomId,
                        userId: userId,
                        socketId: engagedUserSocketId,
                        reqUser: engagedUserId,
                        accUser: userId,
                        type: 'reqUser'
                    })
                } else {
                    setRoomId({roomId, userId}, (sql, values, cb) => {
                        socket.join(roomId);
                        socket.emit('joinedRoom', {
                            id: roomId,
                            socketId: socket.id,
                            userId: userId,
                            reqUser: userId,
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
            console.log(`Message Sent to the Room - ${roomId} message: ${message}`);
            io.of('/').in(roomId).clients((error, socketIds) => {
                if (error) throw error;
                socketIds.forEach(socketId => {
                    console.log(`Message Sent to the - ${socketIds}in ${roomId}`);
                });
               
            });

        });


        socket.on('leaveRoom', function (data) {

            if(data && data.roomId) {
                const {userId,roomId} = data;
                getConnectedUser({roomId,userId}, (status, values) => {
                    const connectedUser = JSON.parse(JSON.stringify(values));
                    if (connectedUser.length > 0) {
                        const connectedUserId = connectedUser[0]['userId'];
                        const connectedUserSocketId = connectedUser[0]['id'];
                        console.log(`User has left from the room ${data.roomId}`);
                        socket.to(roomId).emit('userLeft', {userId: connectedUserId});

                        updateUserStatus({userId}, (status, values) => {
                            console.log(`Client ${userId} status has been updated`);
                        });

                        updateUserStatus({userId: connectedUserId}, (status, values) => {
                            console.log(`Client ${connectedUserId} status has been updated`);
                        });


                        io.of('/').in(data.roomId).clients((error, socketIds) => {
                            if (error) throw error;
                            socketIds.forEach(socketId => {
                                const currentSocket = io.sockets.sockets[socketId];
                                currentSocket.leave(roomId);
                            });
                            console.log(`Client - ${socketIds} removed from the room ${roomId}`);
                        });

                    } else {
                        console.log(`B - Client - ${userId} removed from the room ${data.roomId}`);
                        updateUserStatus({userId}, (status, values) => {
                            console.log(`Client ${userId} status has been updated`);
                            socket.leave(roomId);
                        });

                    }
                })

            }else {
                getRoomId({socketId:socket.id}, (sql,values,db)=> {
                    const connectedUsers = JSON.parse(JSON.stringify(values));
                    if(connectedUsers.length > 0) {
                        const roomId = connectedUsers[0]['roomId'];
                        updateUserStatus({userId:data.userId}, (status, values) => {
                            console.log(`Client ${data.userId} status has been updated`);
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

            getRoomId({socketId:socket.id}, (sql,values,db)=> {
                const connectedUsers = JSON.parse(JSON.stringify(values));
                if(connectedUsers.length > 0) {
                    const disconnectedUser = connectedUsers[0];
                    const roomId = disconnectedUser['roomId'];
                    const userId = disconnectedUser['userId'];

                    if(roomId) {
                        socket.to(roomId).emit('userLeft', {userId: disconnectedUser['userId']});

                        io.of('/').in(roomId).clients((error, socketIds) => {
                            if (error) throw error;
                            socketIds.forEach(socketId => {
                                const currentSocket = io.sockets.sockets[socketId];
                                if(socketId !== socket.id) {
                                    checkUserExists({socketId:socketId},(status,values)=> {
                                        const userExists = JSON.parse(JSON.stringify(values));
                                        if(userExists.length > 0){
                                            const userExistsUserId = userExists[0]['userId'];
                                        
                                            updateUserStatus({userId: userExistsUserId}, (status, values) => {
                                                console.log(`Client ${userExistsUserId} status has been updated`);
                                            });
                                        }
                                    });

                                }
                                currentSocket.leave(roomId);
                            });
                            console.log(`Client - ${socketIds} removed from the room ${roomId}`);
                        });
                    }


                    deleteUser({userId}, (sql, values, db) => {
                        console.log(`Client ${userId} has been removed from the database`);
                    })

                }

            });


        });

    });


};
