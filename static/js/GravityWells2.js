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
    this.smoothingBuffer = [
        new Vector2(),
        new Vector2(),
        new Vector2(),
        new Vector2(),
        new Vector2()
    ];
    this.smoothingIndex = 0;
}

GravityWell.prototype.setV = function(newV) {
    this.smoothingBuffer[this.smoothingIndex].x = newV.x;
    this.smoothingBuffer[this.smoothingIndex].y = newV.y;

    var sum = new Vector2();
    var weight = 1;
    var divideBy = 0;

    for (var i = 0; i < 5; i++) {
        var index = this.smoothingIndex - i;
        if (index < 0) {
            index = 5 + index;
        }

        sum.x += this.smoothingBuffer[index].x * weight;
        sum.y += this.smoothingBuffer[index].y * weight;

        divideBy += weight;
        weight = weight * 0.5;
    }

    this.V = sum.divideEq(divideBy);

    this.smoothingIndex++;
    if (this.smoothingIndex % 5 === 0) {
        this.smoothingIndex = 0;
    }
};

function TouchGravityWell(pos, R, player, identifier) {
    GravityWell.call(this, pos, R, player);
    this.identifier = identifier;
}

TouchGravityWell.prototype = GravityWell.prototype;

function GravityWells2(physics, canvas, ctx, field, gravityEnabled, R, io) {
    this.physics = physics;
    this.canvas = canvas;
    this.ctx = ctx;
    this.field = field;
    this.wells = {};
    this.wells.touches = [];
    this.gravity = gravityEnabled;
    this.R = R;
    this.io=io;
}

GravityWells2.prototype.mouseDown = function(e) {
    var pos = new Vector2(e.clientX, e.clientY);
    this.wells.mouse = new GravityWell(pos, this.R, 'P1');
    this.canvas.onmousemove = $.proxy(this.mouseMove, this);
    var posp = pos.clone();
    if(!this.field.landscape /*if portrait*/){
        var x = posp.x, y = posp.y;
        posp.x = ((2*this.field.fieldCenterV.y)-y) / this.field.fieldCenterV.y;
        posp.y = x / (2*this.field.fieldCenterV.x);
    } else {
        var x = posp.x, y = posp.y;

        posp.x /= this.field.fieldCenterV.x;
        posp.y /= this.field.fieldCenterV.y*2;
    }
    this.io.emit('red',posp);
};

GravityWells2.prototype.mouseMove = function(e) {
    this.wells.mouse.pos.x = e.clientX;
    this.wells.mouse.pos.y = e.clientY;
    var posp = this.wells.mouse.pos.clone();
    if(!this.field.landscape /*if portrait*/){
        var x = posp.x, y = posp.y;
        posp.x = ((2*this.field.fieldCenterV.y)-y) / this.field.fieldCenterV.y;
        posp.y = x / (2*this.field.fieldCenterV.x);
    } else {
        posp.x /= this.field.fieldCenterV.x;
        posp.y /= this.field.fieldCenterV.y*2;
    }
    this.io.emit('red',posp);
    return false;
};

GravityWells2.prototype.mouseUp = function() {
    // this.wells.mouse = null;
    // this.canvas.onmousemove = null;
};

GravityWells2.prototype.touchWells = function(e) {
    e.preventDefault();
    if(e.type==="touchend")
        return;

    var newWells = [];
    var touchV = new Vector2(e.touches[e.touches.length-1].pageX, e.touches[e.touches.length-1].pageY);

        var oldTouch = this.wells.touches[0];

        if (oldTouch) {
            oldTouch.pos = touchV;
            newWells[0]=(oldTouch);
        }
        else {
            newWells[0] = new TouchGravityWell(touchV, this.R, "P1", e.touches[e.touches.length-1].identifier);
        }


    this.wells.touches = newWells;
    var posp = this.wells.touches[0].pos.clone();
    if(!this.field.landscape /*if portrait*/){
        var x = posp.x, y = posp.y;
        posp.x = ((2*this.field.fieldCenterV.y)-y) / this.field.fieldCenterV.y;
        posp.y = x / (2*this.field.fieldCenterV.x);
    } else {
        var x = posp.x, y = posp.y;

        posp.x /= this.field.fieldCenterV.x;
        posp.y /= this.field.fieldCenterV.y*2;
    }
    this.io.emit('red',posp);

};

GravityWells2.prototype.applyForces = function(puck, elapsed) {
    this.allWellsArray().forEach(function(well) {
        this.physics.collidePuckCircle(puck, well, elapsed);
    }, this);
};

GravityWells2.prototype.allWellsArray = function() {
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

GravityWells2.prototype.draw = function() {
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
