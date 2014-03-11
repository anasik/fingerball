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
        new Vector2(field.margin + (field.width * 0.95), halfHeight) :
        new Vector2(halfWidth, field.margin + (field.height * 0.05));

    this.myGravityWell = new GravityWell(this.startPos.clone(), 45);
    this.maxV = 0.6; // pixel/ms
    this.arriveRadius = 50; // pixel
    this.destination = new Vector2();
    this._zeroVector = new Vector2(0, 0); // const
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
        var xDist = (this.myGravityWell.pos.x - this.myGravityWell.R) - (this.puck.pos.x + this.puck.R);
        timeToArrive = xDist / this.puck.V.x;
    }
    else {
        var yDist = (this.myGravityWell.pos.y + this.myGravityWell.R) - (this.puck.pos.y - this.puck.R);
        timeToArrive = yDist / this.puck.V.y;
    }

    if (timeToArrive > 0 && timeToArrive < 2000) {
        if (!this.gravityWells.wells.ai) {
            this.gravityWells.wells.ai = this.myGravityWell;
        }

        if (this.field.landscape) {
            var projY = this.puck.pos.y + (this.puck.V.y * timeToArrive);
            var maxY = (this.field.margin * 2) + this.field.height;
            if (projY < 0 || projY > maxY) {
                this.destination.x = this.defPos.x;
                this.destination.y = this.fieldCenter.y;
            }
            else {
                this.destination.y = projY;
            }
        }
        else {
            var projX = this.puck.pos.x + (this.puck.V.x * timeToArrive);
            var maxX = (this.field.margin * 2) + this.field.width;
            if (projX < 0 || projX > maxX) {
                this.destination.x = this.fieldCenter.x;
                this.destination.y = this.defPos.y;
            }
            else {
                this.destination.x = projX;
            }
        }

    }
    else {
        this.startPos.copyTo(this.destination);
    }

    this.myGravityWell.pos.plusEq(this.arrive(elapsed));
};
