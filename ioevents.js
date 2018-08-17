exports = module.exports = function(io, mongoose, db){
    var roomSchema = new mongoose.Schema({
        _id: String,
        num: Number
    });
    var roomModel = mongoose.model('Room', roomSchema);
    io.on('connection', function (socket) {
        console.log("A user connected.");
        socket.on('join', function (id) {
            // Check db to see if the id already exists. If it doesn't create it with 1 person in there.
            // If it does exist already, check if there's room for one person. Else return a message.

            // asd.save(function(err,room){
            //     if(err)
            //         console.log("couldnt save "+err);
            //     });
            roomModel.findById(id, function(err,room){
                if(err)
                    console.log("find "+err);
                if(room)
                    console.log(room._id);
                else
                    console.log("Not found");
            })
        });
    });
};
