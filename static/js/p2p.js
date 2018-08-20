function P2P(){
    this.io = io();
}
this.join(room){
    this.io.emit("join",room, function(resp){
        if(resp==="connected")
            showMessage(connMessage);
        else if (resp==='full')
            showMessage(fullMessage);
        else {
            showMessage(errorMessage);
        }
    });
}