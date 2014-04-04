var Scene = window.Scene,
    Vector2 = window.Vector2,
    Scoreboard = window.Scoreboard;

function GameScene(canvas, context, withAI) {
    Scene.call(this, canvas, context);
    this.withAI = withAI;
    this.score = { P1: 0, P2: 0 };
}

GameScene.prototype.init = function() {
    this.paused = false;

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    var shortSide = Math.min(this.canvas.width, this.canvas.height);

    var goalPostR = shortSide * 0.015,
        gravityWellR = shortSide * 0.0687,
        puckR = shortSide * 0.0458,
        margin = shortSide * 0.026;

    this.physics = new window.Physics();
    this.field = new window.Field(
            this.physics,
            this.canvas,
            this.ctx,
            goalPostR, margin, 0.9);
    this.field.addGoals();

    this.gravityWells = new window.GravityWells(
            this.physics,
            this.canvas,
            this.ctx,
            this.field,
            false,
            gravityWellR);
    window.assets.redPlayer.reRender(gravityWellR * 2, gravityWellR * 2);
    window.assets.bluePlayer.reRender(gravityWellR * 2, gravityWellR * 2);

    this.puck = new window.Puck(this.canvas, this.ctx, puckR);
    window.assets.puck.reRender(puckR * 2, puckR * 2);
    this.puck.center(this.canvas);

    if (this.withAI) {
        this.ai = new window.AI(
                this.gravityWells,
                this.puck,
                this.field);
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

    this.scoreboard = new Scoreboard(this);
};

GameScene.prototype.update = function(elapsed) {
    if (this.paused) {
        return;
    }

    if (this.ai) {
        this.ai.think(elapsed);
    }

    this.gravityWells.allWellsArray().forEach(function (well) {
        if (this.field.landscape) {
            if (well.pos.y + well.R > this.field.maxY) {
                well.pos.y = this.field.maxY - well.R;
            }
            else if (well.pos.y - well.R < this.field.margin) {
                well.pos.y = this.field.margin + well.R;
            }

            if (well.player === "P1") {
                if (well.pos.x - well.R < this.field.margin) {
                    well.pos.x = this.field.margin + well.R;
                }
                else if (well.pos.x + well.R > this.field.fieldCenterV.x) {
                    well.pos.x = this.field.fieldCenterV.x - well.R;
                }
            }
            else {
                if (well.pos.x - well.R < this.field.fieldCenterV.x) {
                    well.pos.x = this.field.fieldCenterV.x + well.R;
                }
                else if (well.pos.x + well.R > this.field.maxX) {
                    well.pos.x = this.field.maxX - well.R;
                }
            }
        }
        else {
            if (well.pos.x + well.R > this.field.maxX) {
                well.pos.x = this.field.maxX - well.R;
            }
            else if (well.pos.x - well.R < this.field.margin) {
                well.pos.x = this.field.margin + well.R;
            }

            if (well.player === "P1") {
                if (well.pos.y - well.R < this.field.fieldCenterV.y) {
                    well.pos.y = this.field.fieldCenterV.y + well.R;
                }
                else if (well.pos.y + well.R > this.field.maxY) {
                    well.pos.y = this.field.maxY - well.R;
                }
            }
            else {
                if (well.pos.y - well.R < this.field.margin) {
                    well.pos.y = this.field.margin + well.R;
                }
                else if (well.pos.y + well.R > this.field.fieldCenterV.y) {
                    well.pos.y = this.field.fieldCenterV.y - well.R;
                }
            }
        }

        if (well.startPos) {
            well.setV(well.pos.minusNew(well.startPos).divideEq(elapsed));
        }
        else {
            well.startPos = new Vector2();
        }

        well.pos.copyTo(well.startPos);
    }, this);

    this.puck.pos.plusEq(this.puck.V.multiplyNew(elapsed));

    this.puck.angle += this.puck.angularV * elapsed;
    if (this.puck.angle < 0 || this.puck.angle > Math.PI * 2) {
        this.puck.angle -= Math.floor(this.puck.angle / (Math.PI * 2)) *
            Math.PI * 2;
    }

    this.gravityWells.applyForces(this.puck, elapsed);

    this.field.collide(this.puck, elapsed);

    this.puck.applyDrag(elapsed);

    var leftPuckEdge = this.puck.pos.x - this.puck.R;
    var rightPuckEdge = this.puck.pos.x + this.puck.R;
    var bottomPuckEdge = this.puck.pos.y + this.puck.R;
    var topPuckEdge = this.puck.pos.y - this.puck.R;
    var fieldRightEdge = this.field.margin + this.field.width;
    var fieldBottomEdge = this.field.margin + this.field.height;

    if (this.field.landscape && leftPuckEdge > fieldRightEdge) {
        this.score.P1++;
        this.puck.giveToPlayer(2);

        if (this.ai) {
            this.ai.enrage();
        }
    }
    else if (this.field.landscape && rightPuckEdge < this.field.margin) {
        this.score.P2++;
        this.puck.giveToPlayer(1);

        if (this.ai) {
            this.ai.calmDown();
        }
    }
    else if (!this.field.landscape && bottomPuckEdge < this.field.margin) {
        this.score.P1++;
        this.puck.giveToPlayer(2);

        if (this.ai) {
            this.ai.enrage();
        }
    }
    else if (!this.field.landscape && topPuckEdge > fieldBottomEdge) {
        this.score.P2++;
        this.puck.giveToPlayer(1);

        if (this.ai) {
            this.ai.calmDown();
        }
    }
    else {
        return;
    }

    this.scoreboard.show();
};

GameScene.prototype.draw = function() {
    this.field.draw();
    this.puck.draw();
    this.gravityWells.draw();
};
