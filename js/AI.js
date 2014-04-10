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
        new Vector2(field.margin + (field.width * 0.85), halfHeight) :
        new Vector2(halfWidth, field.margin + (field.height * 0.15));

    this.defPos = field.landscape ?
        new Vector2(field.margin + (field.width - gravityWells.R), halfHeight) :
        new Vector2(halfWidth, field.margin + gravityWells.R);

    this.enemyGoal = field.landscape ?
        new Vector2(field.margin, halfHeight) :
        new Vector2(halfWidth, field.margin + field.height);

    this.myGravityWell = new GravityWell(this.defPos.clone(), gravityWells.R, "P2");
    this.gravityWells.wells.ai = this.myGravityWell;

    this.destination = this.defPos.clone();

    this.enrageLevel = 0;
    this.enrageStep = 0.16;

    this.maxVCalm = this.field.landscape ?
        this.field.height * 0.001288 :
        this.field.width * 0.001288;
    this.maxVBonus = this.maxVCalm / 3;
    this.maxV = this.maxVCalm;

    this.arriveRadius = this.maxV * 20; // pixel

    this.reactionTimeCalm = 250; // ms
    this.reactionTimeBonus = 150;
    this.reactionTime = this.reactionTimeCalm;

    this.lastPuckV = new Vector2();
    this.reactionTimeout = 0;

    this.state = AI.STATE.idle;
    this.react(1500);

    puck.collisionEvent = $.proxy(this.ballHit, this);
}

AI.STATE = {
    idle: 1,
    defending: 2,
    attacking: 3,
    aligning: 4,
    unsticking: 5,
    avoiding: 6,
    blocking: 7
};

AI.prototype.ballHit = function() {
    if (this.state === AI.STATE.unsticking) {
        this.gravityWells.wells.ai = null;
        this.state = AI.STATE.avoiding;
        if (window.gameConsole) {
            window.gameConsole.message("AI: ball hit: unsticking -> avoiding");
        }
    }
    else if (this.state === AI.STATE.attacking) {
        this.state = AI.STATE.idle;
        if (window.gameConsole) {
            window.gameConsole.message("AI: ball hit: attacking -> idle");
        }
        this.defPos.copyTo(this.destination);
        this.react();
    }
    else if (!this.puck.V.isCloseTo(this.lastPuckV, 0.5)) {
        this.react();
    }
};

AI.prototype.enrage = function() {
    if (this.enrageLevel + this.enrageStep <= 1) {
        this.enrageLevel += this.enrageStep;
    }
    else {
        this.enrageLevel = 1;
    }

    this.updateParameters();
};

AI.prototype.calmDown = function() {
    if (this.enrageLevel - this.enrageStep >= 0) {
        this.enrageLevel -= this.enrageStep;
    }
    else {
        this.enrageLevel = 0;
    }

    this.updateParameters();
};

AI.prototype.updateParameters = function() {
    this.maxV = this.maxVCalm + (this.maxVBonus * this.enrageLevel);
    this.reactionTime = this.reactionTimeCalm - (this.reactionTimeBonus * this.enrageLevel);
    this.arriveRadius = this.maxV * 20;
};

AI.prototype.react = function(reactionTime) {
    var rTime = reactionTime ? reactionTime : this.reactionTime,
        oneFifth = rTime * 0.2,
        modifier = (Math.random() * oneFifth * 2) - oneFifth;

    this.reactionTimeout = rTime + modifier;
};

AI.prototype.think = function(elapsed) {
    if (this.reactionTimeout > 0) {
        this.reactionTimeout -= elapsed;
        this.arrive(elapsed);
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
    var towardsGoalSpeed = this.field.landscape ? goalAxisSpeed : -goalAxisSpeed;

    switch (this.state) {
        case AI.STATE.idle:
            if (!this.gravityWells.wells.ai) {
                this.gravityWells.wells.ai = this.myGravityWell;
            }

            var behindPuckPos = this.puck.pos.clone();
            if (this.field.landscape) {
                behindPuckPos.x += this.myGravityWell.R + this.puck.R;
            }
            else {
                behindPuckPos.y -= this.myGravityWell.R + this.puck.R;
            }

            if (!this.posUnreachable(behindPuckPos, this.puck.R / 2)) {
                if (towardsGoalSpeed >= this.maxV) {
                    this.state = AI.STATE.defending;
                    if (window.gameConsole) {
                        window.gameConsole.message('AI: idle -> defending');
                    }
                    break;
                }
                else if ((this.field.landscape && this.puck.V.x > -(this.maxV / 3)) ||
                         (!this.field.landscape && this.puck.V.y < this.maxV / 3)) {
                    this.state = AI.STATE.aligning;
                    if (window.gameConsole) {
                        window.gameConsole.message('AI: idle -> aligning');
                    }
                    break;
                }
            }
            else if (this.posUnreachable(this.puck.pos, 0)) {
                if (towardsGoalSpeed >= this.maxV / 2) {
                    // the puck is in the other half of the field
                    this.state = AI.STATE.defending;
                    if (window.gameConsole) {
                        window.gameConsole.message('AI: idle -> defending');
                    }
                    break;
                }
                else {
                    this.state = AI.STATE.blocking;
                    if (window.gameConsole) {
                        window.gameConsole.message('AI: idle -> blocking');
                    }
                    break;
                }
            }
            else if (!this.posUnreachable(this.puck.pos, this.puck.R * 0.9) &&
                    this.puck.V.isMagLessThan(this.maxV / 5)) {
                this.state = AI.STATE.unsticking;
                if (window.gameConsole) {
                    window.gameConsole.message("AI: idle -> unsticking");
                }
                break;
            }

            this.defPos.copyTo(this.destination);
            this.arrive(elapsed);
            break;
        case AI.STATE.defending:
            if ((this.field.landscape && this.puck.V.x < this.maxV / 2) ||
                (!this.field.landscape && this.puck.V.y > -this.maxV / 2)) {
                this.state = AI.STATE.idle;
                if (window.gameConsole) {
                    window.gameConsole.message('AI: defending -> idle');
                }
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
        case AI.STATE.blocking:
            if (goalAxisSpeed >= this.maxV / 2 || !this.posUnreachable(this.puck.pos, 0)) {
                this.state = AI.STATE.idle;
                if (window.gameConsole) {
                    window.gameConsole.message('AI: blocking -> idle');
                }
                break;
            }
            else {
                var slope, goalAxisToGoal, perpAxisToGoal, goalAxisToMe;
                if (this.field.landscape) {
                    goalAxisToGoal = this.field.maxX - this.puck.pos.x;
                    perpAxisToGoal = this.field.fieldCenterV.y - this.puck.pos.y;
                    slope = perpAxisToGoal / goalAxisToGoal;
                    goalAxisToMe = this.attackPos.x - this.puck.pos.x;
                    this.destination.x = this.attackPos.x;
                    this.destination.y = this.puck.pos.y + goalAxisToMe * slope;
                }
                else {
                    goalAxisToGoal = this.puck.pos.y - this.field.margin;
                    perpAxisToGoal = this.field.fieldCenterV.x - this.puck.pos.x;
                    slope = perpAxisToGoal / goalAxisToGoal;
                    goalAxisToMe = this.puck.pos.y - this.attackPos.y;
                    this.destination.x = this.puck.pos.x + goalAxisToMe * slope;
                    this.destination.y = this.attackPos.y;
                }
                this.arrive(elapsed);
            }
            break;
        case AI.STATE.attacking:
            var targetPos = this.puck.pos.clone(),
                radiiSum = (this.puck.R + this.myGravityWell.R) * 0.8;

            if (this.field.landscape) {
                targetPos.x += radiiSum;
            }
            else {
                targetPos.y -= radiiSum;
            }

            if (!this.gravityWells.wells.ai || this.posUnreachable(targetPos, this.puck.R) ||
                (this.field.landscape && this.puck.pos.x > this.myGravityWell.pos.x) ||
                (!this.field.landscape && this.puck.pos.y < this.myGravityWell.pos.y)) {
                this.state = AI.STATE.idle;
                if (window.gameConsole) {
                    window.gameConsole.message('AI: attacking -> idle');
                }
                break;
            }

            targetPos.copyTo(this.destination);
            this.arrive(elapsed);
            break;
        case AI.STATE.aligning:
            if (!this.gravityWells.wells.ai) {
                this.gravityWells.wells.ai = this.myGravityWell;
            }

            var puckProj = this.puck.pos.plusNew(this.puck.V.multiplyNew(100));

            if (this.posUnreachable(this.puck.pos, 0)) {
                this.state = AI.STATE.idle;
                if (window.gameConsole) {
                    window.gameConsole.message('AI: aligning -> idle');
                }
                break;
            }
            else {
                var hitDirection = this.enemyGoal.minusNew(puckProj).normalise();
                var candidateDestination = puckProj.plusNew(
                        hitDirection.clone().reverse().multiplyEq(this.puck.R + this.myGravityWell.R));

                if (this.posUnreachable(candidateDestination, this.myGravityWell.R)) {
                    if (this.field.landscape) {
                        hitDirection.reflect(new Vector2(0, 1));
                    }
                    else {
                        hitDirection.reflect(new Vector2(1, 0));
                    }

                    candidateDestination = puckProj.plusNew(
                            hitDirection.reverse().multiplyEq(this.puck.R + this.myGravityWell.R));
                }

                if (!this.posUnreachable(candidateDestination, this.myGravityWell.R)) {
                    candidateDestination.copyTo(this.destination);
                    this.arrive(elapsed);
                }
                else {
                    this.state = AI.STATE.idle;
                    if (window.gameConsole) {
                        window.gameConsole.message('AI: candidate unreachable: aligning -> idle');
                    }
                    this.react();
                    break;
                }

                if (this.myGravityWell.pos.isCloseTo(candidateDestination, this.maxV * 100)) {
                    this.state = AI.STATE.attacking;
                    if (window.gameConsole) {
                        window.gameConsole.message('AI: aligning -> attacking');
                    }
                    break;
                }
            }
            break;
        case AI.STATE.unsticking:
            if (!this.puck.V.isMagLessThan(this.maxV / 5)) {
                this.state = AI.STATE.idle;
                if (window.gameConsole) {
                    window.gameConsole.message('AI: unsticking -> idle');
                }
                break;
            }

            this.puck.pos.copyTo(this.destination);
            this.arrive(elapsed);
            break;
        case AI.STATE.avoiding:
            var dist = this.myGravityWell.pos.minusNew(this.puck.pos);

            if (!dist.isMagLessThan((this.puck.R + this.myGravityWell.R) * 3)) {
                this.state = AI.STATE.idle;
                if (window.gameConsole) {
                    window.gameConsole.message('AI: avoiding -> idle');
                }
                break;
            }

            dist.normalise();
            dist.multiplyEq(this.maxV * 100)
                .plusEq(this.myGravityWell.pos)
                .copyTo(this.destination);
            this.arrive(elapsed);
            break;
    }
};

AI.prototype.posUnreachable = function(pos, R) {
    var leftFieldBorder = this.field.landscape ? this.fieldCenter.x : this.field.margin;
    var bottomFieldBorder = this.field.landscape ?
        this.field.margin + this.field.height : this.fieldCenter.y;

    if (pos.x - R < leftFieldBorder ||
        pos.x + R > this.field.margin + this.field.width ||
        pos.y + R > bottomFieldBorder ||
        pos.y - R < this.field.margin) {
        return true;
    }
    else {
        return false;
    }
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
