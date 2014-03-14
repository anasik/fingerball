var Vector2 = window.Vector2,
    GravityWell = window.GravityWell;

function AI(gravityWells, puck, field) {
    this.gravityWells = gravityWells;
    this.puck = puck;
    this.field = field;

    var halfWidth = field.margin + (field.width / 2);
    var halfHeight = field.margin + (field.height / 2);

    this.fieldCenter = new Vector2(halfWidth, halfHeight);

    this.startPos = field.landscape ?
        new Vector2(field.margin + (field.width * 0.80), halfHeight) :
        new Vector2(halfWidth, field.margin + (field.height * 0.20));

    this.defPos = field.landscape ?
        new Vector2(field.margin + (field.width - 45), halfHeight) :
        new Vector2(halfWidth, field.margin + 45);

    this.myGravityWell = new GravityWell(this.startPos.clone(), 45);
    this.maxV = 0.6; // pixel/ms
    this.arriveRadius = 50; // pixel
    this.destination = new Vector2();
    this._zeroVector = new Vector2(0, 0); // const

    gravityWells.wells.ai = this.myGravityWell;
}

AI.prototype.arrive = function(elapsed) {
    var distanceV = this.destination.minusNew(this.myGravityWell.pos);
    var distanceSq = distanceV.magnitudeSquared();

    if (distanceSq < 4) {
        // We have arrived
        return this._zeroVector;
    }

    var distance = Math.sqrt(distanceSq);
    distanceV.normalise();

    var V;

    if (distance < this.arriveRadius) {
        V = distanceV.multiplyEq(this.maxV * elapsed * (distance / this.arriveRadius));
    }
    else {
        V = distanceV.multiplyEq(this.maxV * elapsed);
    }

    return V;
};

AI.prototype.think = function(elapsed) {
    var timeToArrive;
    if (this.field.landscape) {
        var xDist = this.myGravityWell.pos.x - this.puck.pos.x;
        timeToArrive = xDist / this.puck.V.x;
    }
    else {
        var yDist = this.myGravityWell.pos.y - this.puck.pos.y;
        timeToArrive = yDist / this.puck.V.y;
    }

    if (timeToArrive > 0 && timeToArrive < 1000 &&
        ((this.field.landscape && this.puck.pos.x < this.myGravityWell.pos.x) ||
         (!this.field.landscape && this.puck.pos.y > this.myGravityWell.pos.y))) {
        if (!this.gravityWells.wells.ai) {
            this.gravityWells.wells.ai = this.myGravityWell;
        }

        if (this.field.landscape) {
            var projY = this.puck.pos.y + (this.puck.V.y * timeToArrive);
            var maxY = (this.field.margin * 2) + this.field.height;
            if (projY < 0 || projY > maxY) {
                this.defPos.copyTo(this.destination);
            }
            else {
                this.destination.y = projY;
            }

            if (this.puck.V.x * elapsed > 30) {
                this.destination.x = this.defPos.x;
            }
        }
        else {
            var projX = this.puck.pos.x + (this.puck.V.x * timeToArrive);
            var maxX = (this.field.margin * 2) + this.field.width;
            if (projX < 0 || projX > maxX) {
                this.defPos.copyTo(this.destination);
            }
            else {
                this.destination.x = projX;
            }

            if (this.puck.V.y * elapsed < -30) {
                this.destination.y = this.defPos.y;
            }
        }
    }
    else {
        this.startPos.copyTo(this.destination);
    }

    this.myGravityWell.pos.plusEq(this.arrive(elapsed));
};
