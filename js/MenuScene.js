function MenuScene(canvas, context) {
    window.Scene.call(this, canvas, context);
}

MenuScene.prototype.createButton = function(text, action) {
    var button = document.createElement("div");

    button.innerHTML = text;
    button.style.textAlign = "center";
    button.style.backgroundColor = "rgb(33,33,33)";
    button.style.color = "white";
    button.style.borderRadius = "15px";
    button.style.display = "inline-block";

    var height = this.canvas.height / 8;

    button.style.margin = (height / 3) + "px";
    button.style.padding = (height / 3) + "px";
    button.style.fontSize = (height * 0.60) + "px";
    button.style.fontFamily = "sans-serif";

    button.onclick = $.proxy(action, this);
    button.style.cursor = "pointer";

    return button;
};

MenuScene.prototype.init = function() {
    this.tearDown();

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.menuDiv = document.createElement("div");
    this.menuDiv.style.position = "absolute";
    this.menuDiv.style.top = this.menuDiv.style.left = "0px";
    this.menuDiv.style.width = "100%";
    this.menuDiv.style.height = "100%";
    this.menuDiv.style.textAlign = "center";
    document.body.appendChild(this.menuDiv);

    var gameTitle = document.createElement("p");
    gameTitle.innerHTML = "Play";
    gameTitle.style.color = "rgb(33,33,33)";
    var titleHeight = window.innerHeight / 8;
    gameTitle.style.fontSize = titleHeight + "px";
    gameTitle.style.fontFamily = "sans-serif";
    gameTitle.style.margin = (titleHeight / 3) + "px";
    gameTitle.style.marginTop = titleHeight + "px";
    gameTitle.style.cursor = "default";
    this.menuDiv.appendChild(gameTitle);

    var vsAIButton = this.createButton(
            "Single player",
            function() {
                this.tearDown();
                window.scene = new window.GameScene(
                    this.canvas, this.ctx, true);
                window.scene.init();
            });

    var pvpButton = this.createButton(
            "Versus mode",
            function() {
                this.tearDown();
                window.scene = new window.GameScene(
                    this.canvas, this.ctx, false);
                window.scene.init();
            });

    this.menuDiv.appendChild(vsAIButton);
    this.menuDiv.appendChild(pvpButton);
};

MenuScene.prototype.tearDown = function() {
    if (this.menuDiv) {
        document.body.removeChild(this.menuDiv);
        this.menuDiv = null;
    }
};

MenuScene.prototype.update = function() { };

MenuScene.prototype.draw = function() {
    this.ctx.fillStyle = "lightgray";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};
