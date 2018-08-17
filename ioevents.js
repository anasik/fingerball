exports = module.exports = function(io){

    io.on('connection', function (socket) {
        console.log("A user connected.");
        socket.on('join', function(id) {

        }
    });

}