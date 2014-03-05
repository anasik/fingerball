var Vector2 = window.Vector2,
    GravityWell = window.GravityWell;

function AI(gravityWells, puck, field) {
    this.gravityWells = gravityWells;
    this.puck = puck;
    this.field = field;

    this.startPos = field.landscape ?
        new Vector2(field.margin + (field.width * 0.80),
                field.margin + (field.height / 2)) :
        new Vector2(field.margin + (field.width / 2),
                field.margin + (field.height * 0.20));

    this.myGravityWell = new GravityWell(this.startPos.clone(), 45);
    this.fieldCenter = new Vector2(
            field.margin + (field.width / 2),
            field.margin + (field.height / 2)
            );
    this.maxV = 1; // pixel/ms
    this.arriveRadius = 50; // pixel
    this.destination = new Vector2();
}

AI.prototype.arrive = function(elapsed) {
    var distanceV = this.destination.minusNew(this.myGravityWell.pos);
    var distanceSq = distanceV.magnitudeSquared();

    if (distanceSq < 0.01) {
        // We have arrived
        return;
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

    this.myGravityWell.pos.plusEq(V);
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

    if (timeToArrive > 0 && timeToArrive < 2000) {
        if (!this.gravityWells.wells.ai) {
            this.gravityWells.wells.ai = this.myGravityWell;
        }

        if (this.field.landscape) {
            this.destination.x = this.myGravityWell.pos.x;
            this.destination.y = this.puck.pos.y +
                (this.puck.V.y * timeToArrive);
            var maxY = (this.field.margin * 2) + this.field.height;
            if (this.destination.y < 0 || this.destination.y > maxY) {
                this.destination.y = this.fieldCenter.y;
            }
        }
        else {
            this.destination.x = this.puck.pos.x +
                (this.puck.V.x * timeToArrive);
            this.destination.y = this.myGravityWell.pos.y;
            var maxX = (this.field.margin * 2) + this.field.width;
            if (this.destination.x < 0 || this.destination.x > maxX) {
                this.destination.x = this.fieldCenter.x;
            }
        }

        this.arrive(elapsed);
    }
    else if (this.gravityWells.wells.ai &&
            (this.puck.pos.x + this.puck.R < this.fieldCenter.x || this.puck.V.x < -0.5)) {
        this.gravityWells.wells.ai = null;
    }
    else {
        this.startPos.copyTo(this.destination);
        this.arrive(elapsed);
    }
};
