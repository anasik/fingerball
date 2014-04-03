var Vector2 = window.Vector2;

function GravityWell(pos, R, player) {
    if (!pos || !R || !player) {
        throw new Error('Missing arguments for GravityWell constructor');
    }
    this.pos = pos;
    this.startPos = null;
    this.V = new Vector2(0,0);
    this.R = R;
    this.timeout = 0;
    this.player = player;
    this.mass = true;
}

function TouchGravityWell(pos, R, player, identifier) {
    GravityWell.call(this, pos, R, player);
    this.identifier = identifier;
}

function GravityWells(physics, canvas, ctx, field, gravityEnabled, R) {
    this.physics = physics;
    this.canvas = canvas;
    this.ctx = ctx;
    this.field = field;
    this.wells = {};
    this.wells.touches = [];
    this.gravity = gravityEnabled;
    this.R = R;
}

GravityWells.prototype.mouseDown = function(e) {
    var pos = new Vector2(e.clientX, e.clientY);
    this.wells.mouse = new GravityWell(pos, this.R, 'P1');
    this.canvas.onmousemove = $.proxy(this.mouseMove, this);
};

GravityWells.prototype.mouseMove = function(e) {
    this.wells.mouse.pos.x = e.clientX;
    this.wells.mouse.pos.y = e.clientY;
    return false;
};

GravityWells.prototype.mouseUp = function() {
    this.wells.mouse = null;
    this.canvas.onmousemove = null;
};

GravityWells.prototype.touchWells = function(e) {
    e.preventDefault();

    var newWells = [];
    for (var i = 0; i < e.touches.length; i++) {
        var touchV = new Vector2(e.touches[i].pageX, e.touches[i].pageY);

        var oldTouch = null;
        for (var j = 0; j < this.wells.touches.length; j++) {
            if (this.wells.touches[j].identifier === e.touches[i].identifier) {
                oldTouch = this.wells.touches[j];
                break;
            }
        }

        if (oldTouch) {
            oldTouch.pos = touchV;
            newWells.push(oldTouch);
        }
        else {
            var player;
            if (this.field.landscape) {
                player = touchV.x < this.field.fieldCenterV.x ? "P1" : "P2";
            }
            else {
                player = touchV.y > this.field.fieldCenterV.y ? "P1" : "P2";
            }

            newWells.push(new TouchGravityWell(touchV, this.R, player, e.touches[i].identifier));
        }
    }

    this.wells.touches = newWells;
};

GravityWells.prototype.applyForces = function(puck, elapsed) {
    this.allWellsArray().forEach(function(well) {
        this.physics.collidePuckCircle(puck, well, elapsed);
    }, this);
};

GravityWells.prototype.allWellsArray = function() {
    var activeWells = [];

    if (this.wells.mouse) {
        activeWells.push(this.wells.mouse);
    }
    if (this.wells.ai) {
        activeWells.push(this.wells.ai);
    }
    if (this.wells.touches) {
        var touchesLength = this.wells.touches.length;
        if (touchesLength) {
            for (var i = 0; i < touchesLength; i++) {
                activeWells.push(this.wells.touches[i]);
            }
        }
    }

    return activeWells;
};

GravityWells.prototype.draw = function() {
    this.allWellsArray().forEach(function(well) {
        var imageStartX = well.pos.x - this.R,
            imageStartY = well.pos.y - this.R;
        if (well.player === "P1") {
            this.ctx.drawImage(
                window.assets.redPlayer.canvas,
                imageStartX, imageStartY);
        }
        else {
            this.ctx.drawImage(
                window.assets.bluePlayer.canvas,
                imageStartX, imageStartY);
        }
    }, this);
};
