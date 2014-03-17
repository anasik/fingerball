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
    var goalAxisDist, goalAxisWellPos, goalAxisPos, goalAxisSpeed;

    if (this.field.landscape) {
        goalAxisDist = this.myGravityWell.pos.x - this.puck.pos.x;
        goalAxisWellPos = this.myGravityWell.pos.x;
        goalAxisPos = this.puck.pos.x;
        goalAxisSpeed = this.puck.V.x;
    }
    else {
        goalAxisDist = this.myGravityWell.pos.y - this.puck.pos.y;
        goalAxisWellPos = this.myGravityWell.pos.y;
        goalAxisPos = this.puck.pos.y;
        goalAxisSpeed = this.puck.V.y;
    }

    var timeToArrive = goalAxisDist / goalAxisSpeed;

    if (timeToArrive < 0 || timeToArrive > 1000) {
        this.startPos.copyTo(this.destination);
    }
    else if ((this.field.landscape && this.puck.pos.x < this.myGravityWell.pos.x) ||
         (!this.field.landscape && this.puck.pos.y > this.myGravityWell.pos.y)) {
        var perpPos, perpSpeed, perpProj, perpMax, perpTarget;
        if (this.field.landscape) {
            perpPos = this.puck.pos.y;
            perpSpeed = this.puck.V.y;
            perpProj = this.puck.pos.y + (this.puck.V.y * timeToArrive);
            perpMax = this.field.margin + this.field.height;
        }
        else {
            perpPos = this.puck.pos.x;
            perpSpeed = this.puck.V.x;
            perpProj = this.puck.pos.x + (this.puck.V.x * timeToArrive);
            perpMax = this.field.margin + this.field.width;
        }

        if (perpProj > this.field.margin && perpProj < perpMax) {
            if (this.field.landscape) {
                this.destination.y = perpProj;
            }
            else {
                this.destination.x = perpProj;
            }
        }
        else {
            if (perpProj < this.field.margin) {
                perpTarget = this.field.margin;
            }
            else {
                perpTarget = perpMax;
            }

            var borderArriveTime = (perpTarget - perpPos) / perpSpeed;
            var goalAxisReflect = goalAxisPos + goalAxisSpeed * borderArriveTime;
            var afterReflectDist = goalAxisWellPos - goalAxisReflect;

            perpProj = perpTarget + (-perpSpeed * (afterReflectDist / goalAxisSpeed));

            if (perpProj < this.field.margin || perpProj > perpMax) {
                this.defPos.copyTo(this.destination);
            }
            else {
                if (this.field.landscape) {
                    this.destination.x = this.defPos.x;
                    this.destination.y = perpProj;
                }
                else {
                    this.destination.x = perpProj;
                    this.destination.y = this.defPos.y;
                }
            }
        }

        if (!this.gravityWells.wells.ai) {
            this.gravityWells.wells.ai = this.myGravityWell;
        }
    }

    this.myGravityWell.pos.plusEq(this.arrive(elapsed));
};
