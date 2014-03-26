var Vector2 = window.Vector2;

function Puck(canvas, ctx, R) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.pos = new Vector2(0, 0);
    this.R = R;
    this.V = new Vector2(0, 0);
    this.accelV = new Vector2(0, 0);
    this.angle = 0;
    this.angularV = 0;
    this.highRe = false;
}

Puck.prototype.applyDrag = function(elapsed) {
    var epsilon = 0.1e-5;
    var VmagSq = this.V.magnitudeSquared();
    var Vmag = Math.sqrt(VmagSq);

    this.highRe = Vmag > 0.7;

    if (Math.abs(this.V.x) > epsilon || Math.abs(this.V.y) > epsilon) {
        var drag = this.V.clone().normalise();
        var cd = this.highRe ? 0.1e-3 : 0.3e-3;
        drag.multiplyEq(VmagSq * cd * elapsed);
        this.V.minusEq(drag);
    }
    else {
        this.V.x = 0;
        this.V.y = 0;
    }

    if (Math.abs(this.angularV) > epsilon) {
        var ACd = this.highRe ? 0.05 : 0.10;

        var angularDragDir = -this.angularV / Math.abs(this.angularV);
        var angularDrag = (this.angularV * this.angularV) * ACd;
        this.angularV += angularDragDir * angularDrag * elapsed;
    }
    else {
        this.angularV = 0;
    }

    if (this.angularV !== 0 && (this.V.x !== 0 || this.V.y !== 0)) {
        var magnusDir = this.V.clone().rotate(Math.PI * 0.5, true);
        magnusDir.normalise();

        var magnus = Vmag * this.angularV * 0.08;
        this.V.plusEq(magnusDir.multiplyEq(magnus * elapsed));
    }
};

Puck.prototype.collideWithNormal = function(collisionNormal, otherV) {
    var bouncyness = 0.9;
    var relativeV = otherV ? this.V.minusNew(otherV) : this.V;

    var normalVel = relativeV.dot(collisionNormal);

    var perpToNorm = new Vector2(-collisionNormal.y, collisionNormal.x);
    var surfaceVel = this.angularV * this.R;
    var perpVel = relativeV.dot(perpToNorm);

    var collisionDuration = 300; // microsec
    var normalForce = ((-normalVel * bouncyness) - normalVel) / collisionDuration;

    var kineticFriction = Math.abs(normalForce * 0.3);

    for (var i = 0; i < collisionDuration; i++) {
        if (Math.abs(surfaceVel - perpVel) < kineticFriction) {
            break;
        }

        if (surfaceVel > perpVel) {
            surfaceVel -= kineticFriction;
            perpVel += kineticFriction / 2;
        }
        else {
            surfaceVel += kineticFriction / 2;
            perpVel -= kineticFriction;
        }
    }

    this.angularV = surfaceVel / this.R;

    if (otherV) {
        // Above was in other object's frame of reference
        perpVel += otherV.dot(perpToNorm);
    }

    this.V = collisionNormal.multiplyNew(normalVel + (2 * -normalVel * bouncyness));
    this.V.plusEq(perpToNorm.multiplyNew(perpVel));
};

Puck.prototype.center = function() {
    this.pos = new Vector2(this.canvas.width / 2, this.canvas.height / 2);
    this.V = new Vector2(0, 0);
    this.angle = 0;
    this.angularV = 0;
};

Puck.prototype.giveToPlayer = function(player) {
    this.center();
    if (this.canvas.width > this.canvas.height) {
        this.pos.x = this.canvas.width * (player === 1 ? 0.33 : 0.66);
    }
    else {
        this.pos.y = this.canvas.height * (player === 1 ? 0.66 : 0.33);
    }
};

Puck.prototype.draw = function() {
    this.ctx.save();
    this.ctx.translate(this.pos.x, this.pos.y);

    if (this.highRe) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.25;
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(-this.V.x * 16, -this.V.y * 16, this.R, 0, Math.PI * 2, true);
        this.ctx.fill();
        this.ctx.restore();
    }

    /*this.ctx.beginPath();
    this.ctx.arc(0, 0, this.R, 0, Math.PI * 2, true);
    this.ctx.closePath();
    this.ctx.fill();*/

    this.ctx.rotate(this.angle);
    this.ctx.drawImage(
            window.assets.puck.canvas,
            -this.R, -this.R,
            this.R * 2, this.R * 2);

    /*this.ctx.beginPath();
    this.ctx.strokeStyle = markColor;
    this.ctx.lineWidth = 3;
    this.ctx.moveTo(0, -this.R);
    this.ctx.lineTo(0, this.R);
    this.ctx.stroke();*/

    this.ctx.restore();
};
