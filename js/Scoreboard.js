function Scoreboard(game) {
    this.game = game;
    this.score = game.score;

    this.scoreDiv = document.createElement("div");
    this.scoreDiv.style.background = "rgba(0,0,0,0.6)";
    this.scoreDiv.style.position = "absolute";
    this.scoreDiv.style.top = "0px";
    this.scoreDiv.style.left = "0px";
    this.scoreDiv.style.width = "100%";
    this.scoreDiv.style.height = "100%";
    this.scoreDiv.style.textAlign = "center";
    this.scoreDiv.style.lineHeight = window.innerHeight + "px";
    this.scoreDiv.style.color = "white";

    if (window.innerWidth > window.innerHeight) {
        this.scoreDiv.style.font = window.innerHeight / 3 + "px sans-serif";
    }
    else {
        this.scoreDiv.style.font = window.innerWidth / 3 + "px sans-serif";
    }

    this.scoreDiv.ontouchstart = game.canvas.ontouchstart;
    this.scoreDiv.ontouchmove = game.canvas.ontouchmove;
    this.scoreDiv.ontouchend = game.canvas.ontouchend;
}

Scoreboard.prototype.show = function() {
    this.game.paused = true;
    this.scoreDiv.innerHTML = "<p>" + this.score.P1 + ":" + this.score.P2 + "</p>";
    document.body.appendChild(this.scoreDiv);
    window.setTimeout($.proxy(this.close, this), 2000);
};

Scoreboard.prototype.close = function() {
    document.body.removeChild(this.scoreDiv);
    this.game.paused = false;
};
