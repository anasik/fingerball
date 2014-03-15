var Scene = window.Scene,
    Vector2 = window.Vector2;

function GameScene(canvas, context, withAI) {
    Scene.call(this, canvas, context);
    this.withAI = withAI;
}

GameScene.prototype.init = function() {
    this.paused = false;

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.physics = new window.Physics();
    this.gravityWells = new window.GravityWells(
            this.physics,
            this.canvas,
            this.ctx,
            false, 45
            );
    this.puck = new window.Puck(this.canvas, this.ctx, 30);
    this.puck.center(this.canvas);
    this.field = new window.Field(
            this.physics,
            this.canvas,
            this.ctx,
            10, 20, 0.9
            );
    this.field.addGoals();

    if (this.withAI) {
        this.ai = new window.AI(
                this.gravityWells,
                this.puck,
                this.field
                );
    }

    this.canvas.onmousedown = $.proxy(
            this.gravityWells.mouseDown,
            this.gravityWells
            );
    this.canvas.onmouseup = $.proxy(
            this.gravityWells.mouseUp,
            this.gravityWells
            );
    var touchWellsProxy = $.proxy(
            this.gravityWells.touchWells,
            this.gravityWells
            );
    this.canvas.ontouchstart = touchWellsProxy;
    this.canvas.ontouchmove = touchWellsProxy;
    this.canvas.ontouchend = touchWellsProxy;
};

GameScene.prototype.update = function(elapsed) {
    if (this.paused) {
        return;
    }

    if (this.ai) {
        this.ai.think(elapsed);
    }

    this.gravityWells.allWellsArray().forEach(function (well) {
        if (well.startPos) {
            well.V = well.pos.minusNew(well.startPos).divideEq(elapsed);
        }
        else {
            well.startPos = new Vector2();
        }

        well.pos.copyTo(well.startPos);

        if (well.timeout > 0) {
            well.timeout -= elapsed;
        }
    });

    this.puck.pos.plusEq(this.puck.V.multiplyNew(elapsed));

    this.puck.angle += this.puck.angularV * elapsed;
    if (this.puck.angle < 0 || this.puck.angle > Math.PI * 2) {
        this.puck.angle -= Math.floor(this.puck.angle / (Math.PI * 2)) *
            Math.PI * 2;
    }

    this.puck.applyDrag(elapsed);

    this.gravityWells.applyForces(this.puck, elapsed);

    this.field.collide(this.puck, elapsed);

    if (this.puck.pos.x + this.puck.R < this.field.margin ||
        this.puck.pos.x - this.puck.R > this.field.width + this.field.margin ||
        this.puck.pos.y + this.puck.R < this.field.margin ||
        this.puck.pos.y - this.puck.R > this.field.height + this.field.margin)
    {
        this.puck.V = new Vector2(0, 0);
        this.puck.center(this.canvas);
    }
};

GameScene.prototype.draw = function() {
    // Clear screen
    this.ctx.fillStyle = "lightgray";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.field.draw("rgb(33,33,33)");
    this.puck.draw("rgb(33,33,33)", "red");
    this.gravityWells.draw("rgb(33,33,33)");
};
