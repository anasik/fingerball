function GameConsole(gameCanvas) {
    this.gameCanvas = gameCanvas;

    this.consoleDiv = document.createElement("div");
    this.consoleDiv.style = "background: rgba(0,0,0,0.6); position: absolute; bottom: 0px; left: 0px; margin: 20px; padding: 0 20px; color: white; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -o-user-select: none; user-select: none;";

    this.consoleDiv.onmousedown = this.forwardEvent("onmousedown");
    this.consoleDiv.onmousemove = this.forwardEvent("onmousemove");
    this.consoleDiv.onmouseup = this.forwardEvent("onmouseup");
    this.consoleDiv.ontouchstart = this.forwardEvent("ontouchstart");
    this.consoleDiv.ontouchmove = this.forwardEvent("ontouchmove");
    this.consoleDiv.ontouchup = this.forwardEvent("ontouchup");

    document.body.appendChild(this.consoleDiv);

    this.messages = [];
    this.paragraphs = [];

    for (var i = 0; i < 5; i++) {
        var newP = document.createElement("p");
        this.paragraphs.push(newP);
        this.consoleDiv.appendChild(newP);
    }
}

GameConsole.prototype.forwardEvent = function(eventName) {
    var thisObj = this;

    return function(eventArgs) {
        if ($.isFunction(thisObj.gameCanvas[eventName])) {
            thisObj.gameCanvas[eventName](eventArgs);
        }
    };
};

GameConsole.prototype.message = function(message) {
    this.messages.push(message);

    if (this.messages.length > 5) {
        this.messages.shift();
    }

    for (var i = 0, len = this.messages.length; i < len; i++) {
        this.paragraphs[i].textContent = this.messages[i];
    }
};
