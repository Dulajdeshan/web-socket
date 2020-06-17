const mysql = require('mysql');


const pool = mysql.createPool({
    host     : 'remotemysql.com',
    user     : '2jIzJTTTnw',
    password : 'TQR0VkVmdg',
    database : '2jIzJTTTnw'
});

exports.database = pool;


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
        const {socketId, userId, gender} = data;
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



