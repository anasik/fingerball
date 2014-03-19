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
    this.field = new window.Field(
            this.physics,
            this.canvas,
            this.ctx,
            10, 20, 0.9
            );
    this.field.addGoals();
    this.gravityWells = new window.GravityWells(
            this.physics,
            this.canvas,
            this.ctx,
            this.field,
            false, 45
            );
    this.puck = new window.Puck(this.canvas, this.ctx, 30);
    this.puck.center(this.canvas);

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
        if (well.pos.x - well.R < this.field.margin) {
            well.pos.x = this.field.margin + well.R;
        }
        else if (well.pos.x + well.R > this.field.margin + this.field.width) {
            well.pos.x = (this.field.margin + this.field.width) - well.R;
        }
        else if (this.field.landscape && well.player === "P1" &&
            well.pos.x + well.R > this.field.fieldCenterV.x) {
            well.pos.x = this.field.fieldCenterV.x - well.R;
        }
        else if (this.field.landscape && well.player === "P2" &&
            well.pos.x - well.R < this.field.fieldCenterV.x) {
            well.pos.x = this.field.fieldCenterV.x + well.R;
        }

        if (well.pos.y - well.R < this.field.margin) {
            well.pos.y = this.field.margin + well.R;
        }
        else if (well.pos.y + well.R > this.field.margin + this.field.height) {
            well.pos.y = (this.field.margin + this.field.height) - well.R;
        }
        else if (!this.field.landscape && well.player === "P1" &&
            well.pos.y - well.R < this.field.fieldCenterV.y) {
            well.pos.y = this.field.fieldCenterV.y + well.R;
        }
        else if (!this.field.landscape && well.player === "P2" &&
            well.pos.y + well.R > this.field.fieldCenterV.y) {
            well.pos.y = this.field.fieldCenterV.y - well.R;
        }

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
    }, this);

    this.puck.pos.plusEq(this.puck.V.multiplyNew(elapsed));

    this.puck.angle += this.puck.angularV * elapsed;
    if (this.puck.angle < 0 || this.puck.angle > Math.PI * 2) {
        this.puck.angle -= Math.floor(this.puck.angle / (Math.PI * 2)) *
            Math.PI * 2;
    }

    this.puck.applyDrag(elapsed);

    this.gravityWells.applyForces(this.puck, elapsed);

    this.field.collide(this.puck, elapsed);

    var leftPuckEdge = this.puck.pos.x - this.puck.R;
    var rightPuckEdge = this.puck.pos.x + this.puck.R;
    var bottomPuckEdge = this.puck.pos.y + this.puck.R;
    var topPuckEdge = this.puck.pos.y - this.puck.R;
    var fieldRightEdge = this.field.margin + this.field.width;
    var fieldBottomEdge = this.field.margin + this.field.height;

    if (rightPuckEdge < this.field.margin || leftPuckEdge > fieldRightEdge ||
        bottomPuckEdge < this.field.margin || topPuckEdge > fieldBottomEdge) {
        if (this.ai) {
            if (this.field.landscape && leftPuckEdge > fieldRightEdge) {
                this.ai.enrage();
            }
            if (!this.field.landscape && bottomPuckEdge < this.field.margin) {
                this.ai.enrage();
            }
        }

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
