var Scene = window.Scene,
    Vector2 = window.Vector2,
    Scoreboard = window.Scoreboard;

function GameScene(canvas, context, choice) {
    Scene.call(this, canvas, context);
    this.choice = choice;
    this.score = { P1: 0, P2: 0 };

    if (window.gameConsole) {
        window.gameConsole.message("Game started.");
    }
}
GameScene.prototype.io = null;
GameScene.prototype.init = function() {
    this.paused = false;

    if(this.scoreboard){
        var oldorient = this.field.landscape;
        var oldpuckpos = this.puck.pos.clone();
        var oldpuck = this.puck;
        if(!oldorient /*if portrait*/){
            var x = oldpuckpos.x, y = oldpuckpos.y;
            oldpuckpos.x = (this.field.height-y) / this.field.height;
            oldpuckpos.y = x / this.field.width;
            var x = oldpuck.V.x, y = oldpuck.V.y;
            oldpuck.V.x =  -(y / this.field.height);
            oldpuck.V.y = x / this.field.width;
        } else {
            oldpuckpos.x /= this.field.width;
            oldpuckpos.y /= this.field.height;
            oldpuck.V.x /= this.field.width;
            oldpuck.V.y /= this.field.height;
        }
        var oldp2pos = (this.gravityWells.wells.ai)?this.gravityWells.wells.ai.pos.clone():null;
        if(oldp2pos) {
            if (!oldorient) {
                var x = oldp2pos.x, y = oldp2pos.y;
                oldp2pos.x = (this.field.height - y) / this.field.height;
                oldp2pos.y = x / this.field.width;
            } else {
                oldp2pos.x /= this.field.width;
                oldp2pos.y /= this.field.height
            }
        }
    }
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    var shortSide = Math.min(this.canvas.width, this.canvas.height);

    var goalPostR = shortSide * 0.030,
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
    if(this.choice !== 2) {
        this.gravityWells = new window.GravityWells(
            this.physics,
            this.canvas,
            this.ctx,
            this.field,
            false,
            gravityWellR);
        window.assets.redPlayer.reRender(gravityWellR * 2, gravityWellR * 2);
        window.assets.bluePlayer.reRender(gravityWellR * 2, gravityWellR * 2);
    } else {
        this.gravityWells = new window.GravityWells2(
            this.physics,
            this.canvas,
            this.ctx,
            this.field,
            false,
            gravityWellR,this.io);
        window.assets.redPlayer.reRender(gravityWellR * 2, gravityWellR * 2);
        window.assets.bluePlayer.reRender(gravityWellR * 2, gravityWellR * 2);
    }
    this.puck = new window.Puck(this.canvas, this.ctx, puckR);
    window.assets.puck.reRender(puckR * 2, puckR * 2);
    this.puck.center(this.canvas);

    var halfWidth = this.field.fieldCenterV.x;
    var halfHeight = this.field.fieldCenterV.y;
    defPos = this.field.landscape ?
        new Vector2(this.field.margin + (this.field.width - this.gravityWells.R), halfHeight) :
        new Vector2(halfWidth, this.field.margin + this.gravityWells.R);

    if (this.choice === 0) {
        this.ai = new window.AI(
                this.gravityWells,
                this.puck,
                this.field);
    } else if(this.choice === 2){

        this.gravityWells.wells.ai = new GravityWell(defPos.clone(), this.gravityWells.R, "P2");
        var wupdate = (x,y)=>{
            this.gravityWells.wells.ai.pos.x = x;
            this.gravityWells.wells.ai.pos.y = y;
        };
        var orient = this.field.landscape;
        this.io.on("blue", function(vector){
            if (!orient /* if portrait */) {
                var x = (2*halfWidth)-(vector.y*halfWidth*2);
                var y = vector.x * halfHeight;
            } else {
                var x = (2 * halfWidth) - (vector.x * halfWidth);
                var y = (2*halfHeight)-(vector.y * halfHeight * 2);
            }
            wupdate(x,y);
        });
        // this.gravityWells.wells.mouse.watch('pos', function(id,newval,oldval){
        //
        // });
    }
    if(this.scoreboard){
        if(!this.field.landscape){
            this.puck.pos.x = oldpuckpos.y * this.field.width;
            this.puck.pos.y = this.field.height- (oldpuckpos.x*this.field.height);
            this.puck.V.x = oldpuck.V.y * this.field.width;
            this.puck.V.y = -(oldpuck.V.x * this.field.height);
            if(oldp2pos){
                this.gravityWells.wells.ai.pos.x = oldp2pos.y * this.field.width;
                this.gravityWells.wells.ai.pos.y  = this.field.height- (oldp2pos.x*this.field.height);
            }

        } else {
            if(oldp2pos){
                this.gravityWells.wells.ai.pos.x  = oldp2pos.x * this.field.width;
                this.gravityWells.wells.ai.pos.y  = oldp2pos.y * this.field.height;
            }
            this.puck.pos.x = oldpuckpos.x * this.field.width;
            this.puck.pos.y = oldpuckpos.y * this.field.height;
            this.puck.V.x = oldpuck.V.x * this.field.width;
            this.puck.V.y = oldpuck.V.y * this.field.height;
        }
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
    if (this.paused) {
        return;
    }

    this.field.draw();
    this.puck.draw();
    this.gravityWells.draw();
};
