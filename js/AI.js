var Vector2 = window.Vector2,
    GravityWell = window.GravityWell;

function AI(gravityWells, puck, field) {
    this.gravityWells = gravityWells;
    this.puck = puck;
    this.field = field;

    var halfWidth = field.fieldCenterV.x;
    var halfHeight = field.fieldCenterV.y;

    this.fieldCenter = field.fieldCenterV;

    this.attackPos = field.landscape ?
        new Vector2(field.margin + (field.width * 0.80), halfHeight) :
        new Vector2(halfWidth, field.margin + (field.height * 0.20));

    this.defPos = field.landscape ?
        new Vector2(field.margin + (field.width - 45), halfHeight) :
        new Vector2(halfWidth, field.margin + 45);

    this.enemyGoal = field.landscape ?
        new Vector2(field.margin, halfHeight) :
        new Vector2(halfWidth, field.margin + field.height);

    this.myGravityWell = new GravityWell(this.defPos.clone(), 45, "P2");
    this.arriveRadius = 50; // pixel
    this.destination = new Vector2();

    this.enragePercent = 0;

    this.maxVCalm = 0.8; // pixel/ms
    this.maxVBonus = 0.6;
    this.maxV = this.maxVCalm;

    this.reactionTimeCalm = 350; // ms
    this.reactionTimeBonus = 200;
    this.reactionTime = this.reactionTimeCalm;

    this.lastPuckV = new Vector2();
    this.reactionTimeout = 0;

    this.state = AI.STATE.idle;
}

AI.STATE = {
    idle: 1,
    defending: 2,
    attacking: 3,
    aligning: 4
};

AI.prototype.enrage = function() {
    if (this.enragePercent + 0.33 <= 1) {
        this.enragePercent += 0.33;
    }
    else {
        this.enragePercent = 1;
    }
};

AI.prototype.think = function(elapsed) {
    if (!this.puck.V.isCloseTo(this.lastPuckV, 1)) {
        var twentyPercent = this.reactionTime * 0.2;
        var modifier = (Math.random() * twentyPercent) - twentyPercent;
        this.reactionTimeout = this.reactionTime + modifier;
    }

    this.puck.V.copyTo(this.lastPuckV);
    if (this.enragePercent > 0) {
        this.maxV = this.maxVCalm + (this.maxVBonus * this.enragePercent);
        this.reactionTime = this.reactionTimeCalm - (this.reactionTimeBonus * this.enragePercent);
        this.enragePercent -= elapsed / 30000; // decays in 30 seconds
    }
    else {
        this.enragePercent = 0;
    }

    if (this.reactionTimeout > 0) {
        this.reactionTimeout -= elapsed;
        return;
    }

    var goalAxisDist, goalAxisSpeed;

    if (this.field.landscape) {
        goalAxisDist = (this.field.margin + this.field.width) - this.puck.pos.x;
        goalAxisSpeed = this.puck.V.x;
    }
    else {
        goalAxisDist = this.field.margin - this.puck.pos.y;
        goalAxisSpeed = this.puck.V.y;
    }

    var timeToArrive = goalAxisDist / goalAxisSpeed;

    switch (this.state) {
        case AI.STATE.idle:
            if (!this.gravityWells.wells.ai) {
                this.gravityWells.wells.ai = this.myGravityWell;
            }

            if (!this.posUnreachable(this.puck.pos)) {
                var towardsGoalSpeed = this.field.landscape ? goalAxisSpeed : -goalAxisSpeed;
                if (towardsGoalSpeed >= this.maxV) {
                    this.state = AI.STATE.defending;
                    break;
                }
                else if ((this.field.landscape && this.puck.pos.x < this.myGravityWell.pos.x &&
                          this.puck.V.x > -(this.maxV / 2)) ||
                         (!this.field.landscape && this.puck.pos.y > this.myGravityWell.pos.y &&
                          this.puck.V.y < this.maxV / 2)) {
                    this.state = AI.STATE.aligning;
                    break;
                }
            }

            this.defPos.copyTo(this.destination);
            this.arrive(elapsed);
            break;
        case AI.STATE.defending:
            if ((this.field.landscape && this.puck.V.x < this.maxV) ||
                (!this.field.landscape && this.puck.V.y > -this.maxV)) {
                this.state = AI.STATE.idle;
                break;
            }

            var goalAxisTarget = this.field.landscape ?
                this.myGravityWell.pos.x :
                this.myGravityWell.pos.y;

            var projection = this.projectPuck(this.puck, this.field, goalAxisTarget);
            if (projection.x !== -1 && projection.y !== -1) {
                this.destination = projection;
            }
            else {
                this.defPos.copyTo(this.destination);
            }

            if (!this.gravityWells.wells.ai) {
                this.gravityWells.wells.ai = this.myGravityWell;
            }

            this.arrive(elapsed);
            break;
        case AI.STATE.attacking:
            if (this.posUnreachable(this.puck.pos) ||
                (this.field.landscape && this.puck.V.x < -this.maxV / 2) ||
                (!this.field.landscape && this.puck.V.y > this.maxV / 2) ||
                (this.field.landscape && this.puck.pos.x > this.myGravityWell.pos.x) ||
                (!this.field.landscape && this.puck.pos.y < this.myGravityWell.pos.y)) {
                this.state = AI.STATE.idle;
                break;
            }

            this.puck.pos.copyTo(this.destination);
            this.arrive(elapsed);
            break;
        case AI.STATE.aligning:
            var puckProj = this.puck.pos.plusNew(this.puck.V.multiplyNew(100));

            if (this.posUnreachable(puckProj)) {
                this.state = AI.STATE.idle;
                break;
            }
            else {
                var hitDirection = this.enemyGoal.minusNew(puckProj).normalise();
                this.destination = puckProj.plusNew(
                        hitDirection.reverse().multiplyEq(this.puck.R + this.myGravityWell.R)
                        );
                if (this.myGravityWell.pos.isCloseTo(this.destination, this.maxV * 100)) {
                    this.state = AI.STATE.attacking;
                    break;
                }
                this.arrive(elapsed);
            }
            break;
    }
};

AI.prototype.posUnreachable = function(pos) {
    return this.field.landscape ? pos.x <= this.fieldCenter.x : pos.y >= this.fieldCenter.y;
};

AI.prototype.projectPuck = function(puck, field, goalAxisTarget) {
    var goalAxisDist, goalAxisWellPos, goalAxisPos, goalAxisSpeed, deltaT;
    var perpPos, perpSpeed, perpProj, perpMax, perpTarget;

    if (this.field.landscape) {
        goalAxisDist = goalAxisTarget - puck.pos.x;
        goalAxisPos = puck.pos.x;
        goalAxisSpeed = puck.V.x;

        deltaT = goalAxisDist / goalAxisSpeed;

        perpPos = puck.pos.y;
        perpSpeed = puck.V.y;
        perpProj = puck.pos.y + (puck.V.y * deltaT);
        perpMax = field.margin + field.height;
    }
    else {
        goalAxisDist = goalAxisTarget - puck.pos.y;
        goalAxisPos = puck.pos.y;
        goalAxisSpeed = puck.V.y;

        deltaT = goalAxisDist / goalAxisSpeed;

        perpPos = puck.pos.x;
        perpSpeed = puck.V.x;
        perpProj = puck.pos.x + (puck.V.x * deltaT);
        perpMax = field.margin + field.width;
    }

    var result = new Vector2();

    if (perpProj > field.margin && perpProj < perpMax) {
        if (field.landscape) {
            result.x = goalAxisTarget;
            result.y = perpProj;
        }
        else {
            result.x = perpProj;
            result.y = goalAxisTarget;
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
        var afterReflectDist = goalAxisTarget - goalAxisReflect;

        perpProj = perpTarget + (-perpSpeed * (afterReflectDist / goalAxisSpeed));

        if (perpProj < this.field.margin || perpProj > perpMax) {
            // Still unknown after one reflection
            result.x = -1;
            result.y = -1;
        }
        else {
            if (this.field.landscape) {
                result.x = goalAxisTarget;
                result.y = perpProj;
            }
            else {
                result.x = perpProj;
                result.y = goalAxisTarget;
            }
        }
    }

    return result;
};

AI.prototype.arrive = function(elapsed) {
    var distanceV = this.destination.minusNew(this.myGravityWell.pos);
    var distanceSq = distanceV.magnitudeSquared();

    // We have arrived if dist < 2; 2 ^ 2 = 4
    if (distanceSq < 4) {
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
