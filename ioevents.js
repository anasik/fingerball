exports = module.exports = function(io, mongoose, db){
    var roomSchema = new mongoose.Schema({
        _id: String,
        num: Number
    });
    var roomModel = mongoose.model('Room', roomSchema);
    io.on('connection', function (socket) {
        console.log("A user connected. Socket ID: "+socket.id);
        var gameroom;
        socket.on('join', function (id) {
            // Check db to see if the id already exists. If it doesn't create it with 1 person in there.
            // If it does exist already, check if there's room for one person. Else return a message.

            roomModel.findById(id, function(err,room){
                if(err)
                    console.log("find "+err);
                if(room){
                    if(room.num !== 2){
                        socket.join(room._id+"");
                        console.log("Joined room: "+id);
                        room.num++;
                        room.save(function(err,room){
                            if(err)
                                console.log("Couldn't increment room.num. Error: "+err);
                            else
                                console.log("Room count incremented.");
                        });
                        gameroom=room;
                    }
                    else
                        console.log("Room full. Can't connect.");
                }
                else {
                    room = new roomModel({_id:id, num:1});
                    room.save(function(err,room){
                        if(err)
                            console.log("Couldn't create room. Error: "+err);
                        else
                            console.log("Room "+id+" didn't exist. Created with one user. Joining.");
                    });
                    socket.join(room._id+"");
                    gameroom=room;
                }
            })
        });
        socket.on("disconnect", function(reason){
            gameroom.num--;
            if(gameroom.num==0)
                gameroom.remove();
            else
                gameroom.save();
        });
    });

};

