var Vector2 = window.Vector2;

function GravityWell(pos, R) {
    this.pos = pos;
    this.startPos = null;
    this.V = new Vector2(0,0);
    this.R = R;
    this.timeout = 0;
}

function TouchGravityWell(pos, radius, identifier) {
    GravityWell.call(this, pos, radius);
    this.identifier = identifier;
}

function GravityWells(physics, canvas, ctx, gravityEnabled, R) {
    this.physics = physics;
    this.canvas = canvas;
    this.ctx = ctx;
    this.wells = [];
    this.gravity = gravityEnabled;
    this.R = R;
}

GravityWells.prototype.mouseDown = function(e) {
    var pos = new Vector2(e.clientX, e.clientY);
    this.wells[0] = new GravityWell(pos, this.R);
    this.canvas.onmousemove = $.proxy(this.mouseMove, this);
};

GravityWells.prototype.mouseMove = function(e) {
    this.wells[0].pos.x = e.clientX;
    this.wells[0].pos.y = e.clientY;
    return false;
};

GravityWells.prototype.mouseUp = function() {
    this.wells = [];
    this.canvas.onmousemove = null;
};

GravityWells.prototype.touchWells = function(e) {
    e.preventDefault();

    var newWells = [];
    for (var i = 0; i < e.touches.length; i++) {
        var touchV = new Vector2(e.touches[i].pageX, e.touches[i].pageY);

        var oldTouch = null;
        for (var j = 0; j < this.wells.length; j++) {
            if (this.wells[j].identifier === e.touches[i].identifier) {
                oldTouch = this.wells[j];
                break;
            }
        }

        if (oldTouch) {
            oldTouch.pos = touchV;
            newWells.push(oldTouch);
        }
        else {
            newWells.push(new TouchGravityWell(touchV, this.R, e.touches[i].identifier));
        }
    }

    this.wells = newWells;
};

GravityWells.prototype.applyForces = function(puck, elapsed) {
    if (!this.wells.length) {
        return;
    }

    this.wells.forEach(function(well) {
        var distanceV = puck.pos.minusNew(well.pos);
        var distance = distanceV.magnitude();
        var minimumDistance = puck.R + this.R;
        var collisionNormal = distanceV.clone().normalise();

        if (distance > minimumDistance) {
            if (this.gravity) {
                var scaledMagnitude = distance / 10;
                var force = 0.2 / (scaledMagnitude * scaledMagnitude);
                var accelV = collisionNormal.multiplyNew(-force);

                puck.V.plusEq(accelV.multiplyEq(elapsed));
            }
        }
        else {
            var deltaT = this.physics.circlesTimeToCollision(puck, well, elapsed);

            if (deltaT > -1 && well.timeout <= 0) {
                // Rewind time and re-calculate collision normal
                puck.pos.plusEq(puck.V.multiplyNew(elapsed * deltaT));
                well.pos.plusEq(well.V.multiplyNew(elapsed * deltaT));
                collisionNormal = puck.pos.minusNew(well.pos).normalise();

                // Calculate velocity
                puck.collideWithNormal(collisionNormal, well.V);

                // Fast-forward time
                puck.pos.plusEq(puck.V.multiplyNew(elapsed * -deltaT));
                well.pos.plusEq(well.V.multiplyNew(elapsed * -deltaT));

                well.timeout = 100;
            }
            else {
                // Collision more than 5 frames away; probably direct press on the puck
                var minDist = puck.R + well.R;
                var moveDist = collisionNormal.reverse().multiplyNew(minDist - distance);
                puck.pos.minusEq(moveDist);
            }
        }
    }, this);
};

GravityWells.prototype.draw = function() {
    this.ctx.fillStyle = "orange";
    this.wells.forEach(function(well) {
        this.ctx.circlePathV(well.pos, this.R);
        this.ctx.fill();
    }, this);
};
