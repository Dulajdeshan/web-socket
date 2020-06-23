const mysql = require('mysql');
const mongoose = require('mongoose');
const uri = "mongodb+srv://Dulajdeshan:DulajDeshan@96@cluster0-bvoea.mongodb.net/omeglechat?retryWrites=true&w=majority";

mongoose.connect(uri,{ useNewUrlParser: true, useUnifiedTopology:true });
const mongooseDb = mongoose.connection;

//Schemas
const userSchema = new mongoose.Schema({
    id: String,
    userId: String,
    roomId: {type: String, default: null},
    gender: {type: String, default: null},
    isConnected: {type: Boolean, default: false},
    
  });



const pool = mysql.createPool({
    host     : 'remotemysql.com',
    user     : '2jIzJTTTnw',
    password : 'TQR0VkVmdg',
    database : '2jIzJTTTnw'
});

exports.database = pool;



exports.addMongoUser = function(data) {
    const {socketId, userId, gender} = data;

    const _user = mongoose.model('User',userSchema);
    mongooseDb.on('error', function(err){
        return;
    });
    mongooseDb.once('open', function() {
        _user.find({userId:userId}, function(err,findUser) {
            if(err) return;

            if(!(findUser.length > 0)) {
                const currentUser = new _user({
                    id: socketId,
                    userId: userId,
                    gender: gender
                });

                currentUser.save(function(err, savedUser) {
                    if(err) return;
                    console.log(`Mongoose: User added with userId: ${userId}`);
                })
                  
            }else {
                const currentUser = findUser[0];
                _user.updateOne({userId:userId},{$set:{id:socketId}})
                .then(res => {
                    console.log(`Mongoose: User updated with id: ${socketId} of userId: ${userId}`);
                })
            }
        })
       
    });

}

exports.updateMongoUser = function(data) {
    const {socketId, userId} = data;

    const _user = mongoose.model('User',userSchema);
    mongooseDb.on('error', function(err){
        return;
    });
    mongooseDb.once('open', function() {
        _user.find({userId:userId}, function(err,findUser) {
            if(err) return;

            if(findUser.length > 0) {
                _user.updateOne({userId:userId},{$set:{id:socketId}})
                .then(res => {
                    console.log(`Mongoose: User updated with id: ${socketId} of userId: ${userId}`);
                })
            }
        })
       
    });

}


exports.updateMongoUserGender = function(data) {
    const {userId,gender} = data;

    const _user = mongoose.model('User',userSchema);
    mongooseDb.on('error', function(err){
        return;
    });
    mongooseDb.once('open', function() {
        _user.find({userId:userId}, function(err,findUser) {
            if(err) return;
            return findUser.length > 0;
        })
       
    });

}

exports.checkUserExists = function(data) {
    const {userId} = data;

    const _user = mongoose.model('User',userSchema);
    mongooseDb.on('error', function(err){
       return;
    });
    mongooseDb.once('open', function() {
        _user.find({userId:userId}, function(err,findUser) {
            if(err) return;

            if(findUser.length > 0) {
                _user.updateOne({userId:userId},{$set:{id:socketId}})
                .then(res => {
                    console.log(`Mongoose: User updated with gender: ${gender} of userId: ${userId}`);
                })
            }
        })
       
    });

}





exports.addUser = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        const {socketId, userId, gender} = data;
        const sql = `INSERT INTO Users(id,userId,isEngaged,gender) VALUES('${socketId}', '${userId}',false, '${gender}')`;
        connection.query(sql, [], function(err, results) {

            if(err) {
                console.log(err);
                callback(true);
                return;
            }
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};

exports.updateUser = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        const {socketId, userId} = data;
        const sql = `UPDATE Users SET id = '${socketId}' WHERE userId = '${userId}'`;
        connection.query(sql, [], function(err, results) {

            if(err) {
                console.log(err);
                callback(true);
                return;
            }
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};

exports.updateGender = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        const {gender,userId} = data;
        const sql = `UPDATE Users SET gender = '${gender}' WHERE userId = '${userId}'`;
        connection.query(sql, [], function(err, results) {

            if(err) {
                console.log(err);
                callback(true);
                return;
            }
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};

exports.getAvailableUsers = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        const {userId,gender} = data;
        let sql = "";
        if(gender)  {
            sql = `SELECT * FROM Users WHERE userId != '${userId}' AND roomId IS NOT NULL AND isEngaged = false AND gender = '${gender}'`;
        }else {
            sql = `SELECT * FROM Users WHERE userId != '${userId}' AND roomId IS NOT NULL AND isEngaged = false`;
        }
      
        connection.query(sql, [], function(err, results) {

            if(err) {
                callback(true);
                return;
            }
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};

exports.checkUserExists = function(data,callback) {
  pool.getConnection(function (err,connection) {
      if(err) {
          console.log(err);
          callback(true);
          return;
      }
      const {userId} = data;
      const sql = `SELECT * FROM Users WHERE userId = '${userId}'`;
      connection.query(sql,[],function (err,results) {
          if(err) {
              callback(true);
              return;
          }
          callback(false,results);
          connection.destroy();
      })

  })
};

exports.updateCurrentUser = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        const {userId,engagedRoomId} = data;
        const sql = `UPDATE Users SET roomId = '${engagedRoomId}', isEngaged = true WHERE userId = '${userId}'`;
        connection.query(sql, [], function(err, results) {

            if(err) {
                callback(true);
                return;
            }
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};


exports.setRoomId = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        const {roomId,userId} = data;
        const sql = `UPDATE Users SET roomId = '${roomId}' WHERE userId = '${userId}'`;
        connection.query(sql, [], function(err, results) {

            if(err) {
                callback(true);
                return;
            }
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};

exports.setEngaged = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        const {engagedUserId} = data;
        const sql = `UPDATE Users SET isEngaged = true WHERE userId = '${engagedUserId}'`;
        connection.query(sql, [], function(err, results) {

            if(err) {
                callback(true);
                return;
            }
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};

exports.deleteUser = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        const  {userId} = data;
        const sql = `DELETE FROM Users WHERE userId = '${userId}'`;
        connection.query(sql, [], function(err, results) {
            if(err) {
                console.log(err);
                callback(true);
                return;
            }
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};

exports.getConnectedUser = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        const  {roomId,userId} = data;
        const sql = `SELECT * FROM Users WHERE roomId = '${roomId}' AND userId != '${userId}'`;
        connection.query(sql, [], function(err, results) {
            if(err) {
                console.log(err);
                callback(true);
                return;
            }
            console.log(results);
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};


exports.updateUserStatus = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        const  {userId} = data;
        const sql = `UPDATE Users SET roomId = NULL, isEngaged = false WHERE userId = '${userId}'`;
        connection.query(sql, [], function(err, results) {
            if(err) {
                console.log(err);
                callback(true);
                return;
            }
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};


exports.getRoomId = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        let sql = "";
        if(data.userId) {
            sql = `SELECT * FROM Users WHERE userId = '${data.userId}'`;
        }else {
            sql = `SELECT * FROM Users WHERE id = '${data.socketId}'`;
        }
     
        connection.query(sql, [], function(err, results) {
            if(err) {
                console.log(err);
                callback(true);
                return;
            }
            console.log(results);
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};


exports.updateUserStatus = function(data,callback) {
    pool.getConnection(function(err, connection) {
        if(err) {
            console.log(err);
            callback(true);
            return;
        }
        const  {userId} = data;
        const sql = `UPDATE Users SET roomId = NULL, isEngaged = false WHERE userId = '${userId}'`;
        connection.query(sql, [], function(err, results) {
            if(err) {
                console.log(err);
                callback(true);
                return;
            }
            callback(false, results);
            connection.destroy(); // always put connection back in pool after last query
        });

    });
};



