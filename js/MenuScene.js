function MenuScene(canvas, context) {
    window.Scene.call(this, canvas, context);
}

MenuScene.prototype.createButton = function(text, action) {
    var button = document.createElement("div");

    button.innerHTML = text;
    button.style.textAlign = "center";
    button.style.backgroundColor = "white";
    button.style.color = "rgb(33,33,33)";
    button.style.borderRadius = "15px";
    button.style.border = "1px solid rgb(33,33,33)";
    button.style.display = "inline-block";

    var height = this.canvas.height / 8;

    button.style.margin = (height / 3) + "px";
    button.style.padding = (height / 3) + "px";
    button.style.fontSize = (height * 0.60) + "px";
    button.style.fontFamily = "sans-serif";

    button.onclick = $.proxy(function() {
        window.sounds.wallHit.play(1);
        action.call(this);
    }, this);
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
    this.menuDiv.style.background = "rgba(0,0,0,0.6)";
    this.menuDiv.ontouchmove = function(e) { e.preventDefault(); };
    document.body.appendChild(this.menuDiv);

    var gameTitle = document.createElement("p");
    gameTitle.innerHTML = "Finger Ball";
    gameTitle.style.color = "white";
    gameTitle.style.textShadow = "-1px -1px 0 #333, 1px -1px 0 #333, -1px 1px 0 #333, 1px 1px 0 #333";
    var titleHeight = window.innerHeight / 7;
    gameTitle.style.fontSize = titleHeight + "px";
    gameTitle.style.fontFamily = "sans-serif";
    gameTitle.style.fontWeight = "bold";
    gameTitle.style.margin = (titleHeight / 3) + "px";
    //gameTitle.style.marginTop = titleHeight + "px";
    gameTitle.style.cursor = "default";
    this.menuDiv.appendChild(gameTitle);

    var vsAIButton = this.createButton(
            "Single player",
            function() {
                this.tearDown();
                window.scene = new window.GameScene(
                    this.canvas, this.ctx, 0);
                window.scene.init();
            });

    var pvpButton = this.createButton(
            "Versus mode",
            function() {
                this.tearDown();
                window.scene = new window.GameScene(
                    this.canvas, this.ctx, 1);
                window.scene.init();
            });
    var p2pButton = this.createButton(
        "Versus mode (Online)",
        function() {
            this.menuDiv.removeChild(vsAIButton);
            this.menuDiv.removeChild(pvpButton);
            this.menuDiv.removeChild(p2pButton);
            this.menuDiv.appendChild(createButton);
            this.menuDiv.appendChild(joinButton);
        });
    var createButton = this.createButton(
        "Create Game",
        function() {
            this.menuDiv.removeChild(joinButton);
            this.menuDiv.removeChild(createButton);
            var ginput = document.createElement("input");
            ginput.style.textAlign = "center";
            ginput.style.backgroundColor = "white";
            ginput.style.color = "rgb(33,33,33)";
            ginput.style.borderRadius = "15px";
            ginput.style.border = "1px solid rgb(33,33,33)";
            ginput.style.display = "inline-block";

            var height = this.canvas.height / 8;

            ginput.style.margin = (height / 3) + "px";
            ginput.style.padding = (height / 3) + "px";
            ginput.style.fontSize = (height * 0.60) + "px";
            ginput.style.fontFamily = "sans-serif";
            ginput.value = Math.random().toString(36).substr(2, 5);
            this.menuDiv.appendChild(ginput);
            this.menuDiv.appendChild(createButton);

        });

    var joinButton = this.createButton(
        "Join Game",
        function() {
            this.menuDiv.removeChild(joinButton);
            this.menuDiv.removeChild(createButton);
            var ginput = document.createElement("input");
            ginput.style.textAlign = "center";
            ginput.style.backgroundColor = "white";
            ginput.style.color = "rgb(33,33,33)";
            ginput.style.borderRadius = "15px";
            ginput.style.border = "1px solid rgb(33,33,33)";
            ginput.style.display = "inline-block";

            var height = this.canvas.height / 8;

            ginput.style.margin = (height / 3) + "px";
            ginput.style.padding = (height / 3) + "px";
            ginput.style.fontSize = (height * 0.60) + "px";
            ginput.style.fontFamily = "sans-serif";
            // ginput.value = Math.random().toString(36).substr(2, 5);
            this.menuDiv.appendChild(ginput);
            this.menuDiv.appendChild(joinButton);
        });


    this.menuDiv.appendChild(vsAIButton);
    this.menuDiv.appendChild(pvpButton);
    this.menuDiv.appendChild(p2pButton);

    this.loFiBackgroundDrawn = false;
    this.hiFiBackgroundDrawn = false;
};

MenuScene.prototype.tearDown = function() {
    if (this.menuDiv) {
        document.body.removeChild(this.menuDiv);
        this.menuDiv = null;
    }
};

MenuScene.prototype.update = function() { };

MenuScene.prototype.draw = function() {
    if (!window.assets.field.loaded && !this.loFiBackgroundDrawn) {
        this.ctx.fillStyle = "rgb(68,170,0)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.loFiBackgroundDrawn = true;
    }
    else if (window.assets.field.loaded && !this.hiFiBackgroundDrawn) {
        this.ctx.drawImage(window.assets.field.canvas, 0, 0);
        this.hiFiBackgroundDrawn = true;
    }
};
