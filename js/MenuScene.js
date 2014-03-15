function MenuScene(canvas, context) {
    window.Scene.call(this, canvas, context);
}

MenuScene.prototype.createButton = function(text, point, action) {
    var button = document.createElement("div");

    button.innerHTML = text;
    button.style.textAlign = "center";
    button.style.backgroundColor = "rgb(33,33,33)";
    button.style.color = "white";
    button.style.borderRadius = "15px";

    var width = this.canvas.width / 3;
    var height = this.canvas.height / 7;

    button.style.width = width + "px";
    button.style.height = height + "px";

    button.style.lineHeight = button.style.height;
    button.style.fontSize = (height * 0.60) + "px";
    button.style.fontFamily = "sans-serif";

    button.style.position = "absolute";
    button.style.left = (point.x - (width / 2)) + "px";
    button.style.top = (point.y - (height / 2)) + "px";

    button.onclick = $.proxy(action, this);
    button.style.cursor = "pointer";

    return button;
};

MenuScene.prototype.init = function() {
    this.tearDown();

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    var gameTitle = document.createElement("p");
    gameTitle.innerHTML = "Play";
    gameTitle.style.color = "rgb(33,33,33)";
    gameTitle.style.width = "100%";
    var titleHeight = window.innerHeight / 7;
    gameTitle.style.fontSize = titleHeight + "px";
    gameTitle.style.fontFamily = "sans-serif";
    gameTitle.style.textAlign = "center";
    gameTitle.style.position = "absolute";
    gameTitle.style.top = ((window.innerHeight / 4) - titleHeight / 2) +
        "px";
    gameTitle.style.left = "0px";
    gameTitle.style.margin = "0px";
    gameTitle.style.cursor = "default";

    this.gameTitle = gameTitle;
    document.body.appendChild(this.gameTitle);

    this.vsAIButton = this.createButton(
            "vs AI",
            { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            function() {
                this.tearDown();
                window.scene = new window.GameScene(
                    this.canvas, this.ctx, true);
                window.scene.init();
            });

    this.pvpButton = this.createButton(
            "PvP",
            { x: window.innerWidth / 2, y: (window.innerHeight * 3) / 4 },
            function() {
                this.tearDown();
                window.scene = new window.GameScene(
                    this.canvas, this.ctx, false);
                window.scene.init();
            });

    document.body.appendChild(this.vsAIButton);
    document.body.appendChild(this.pvpButton);
};

MenuScene.prototype.tearDown = function() {
    if (this.vsAIButton) {
        document.body.removeChild(this.vsAIButton);
        this.vsAIButton = null;
    }
    if (this.pvpButton) {
        document.body.removeChild(this.pvpButton);
        this.pvpButton = null;
    }
    if (this.gameTitle) {
        document.body.removeChild(this.gameTitle);
        this.gameTitle = null;
    }
};

MenuScene.prototype.update = function() { };

MenuScene.prototype.draw = function() {
    this.ctx.fillStyle = "lightgray";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};
