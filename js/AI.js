var Vector2 = window.Vector2,
    GravityWell = window.GravityWell;

function AI(gravityWells, puck, field) {
    this.gravityWells = gravityWells;
    this.puck = puck;
    this.field = field;

    var startPos = field.landscape ?
        new Vector2(field.margin + (field.width * 0.80),
                field.margin + (field.height / 2)) :
        new Vector2(field.margin + (field.width / 2),
                field.margin + (field.height * 0.20));

    this.myGravityWell = new GravityWell(startPos, 45);
    this.maxV = 0.8;
    this.arriveRadius = 50;
    this.destination = new Vector2(-1, -1);
}

AI.prototype.arrive = function(elapsed) {
    var distanceV = this.destination.minusNew(this.myGravityWell.pos);
    var distance = distanceV.magnitude();
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
    if (this.field.landscape) {
        if (this.puck.V.x > 0.1) {
            this.gravityWells.wells.ai = this.myGravityWell;
            this.destination.x = this.myGravityWell.pos.x;
            this.destination.y = this.puck.pos.y;
            this.arrive(elapsed);
        }
        else if (this.gravityWells.wells.ai) {
            delete this.gravityWells.wells.ai;
        }
    }
    else {
        if (this.puck.V.y < -0.1) {
            this.gravityWells.wells.ai = this.myGravityWell;
            this.destination.x = this.puck.pos.x;
            this.destination.y = this.myGravityWell.pos.y;
            this.arrive(elapsed);
        }
        else if (this.gravityWells.wells.ai) {
            delete this.gravityWells.wells.ai;
        }
    }
};
