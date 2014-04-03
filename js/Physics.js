var Physics = function() {
    this.epsilon = 0.1e-5;
};

Physics.prototype.collidePuckCircle = function(puck, circle, elapsed) {
    var distanceV = puck.pos.minusNew(circle.pos); // cicrle to puck
    var distanceSq = distanceV.magnitudeSquared();
    var minDist = puck.R + circle.R;

    if (distanceSq < minDist * minDist) {
        var deltaT = this.circlesTimeToCollision(puck, circle, elapsed);

        if (deltaT > -2) {
            puck.pos.plusEq(puck.V.multiplyNew(elapsed * deltaT));
            circle.pos.plusEq(circle.V.multiplyNew(elapsed * deltaT));

            distanceV = puck.pos.minusNew(circle.pos);
            distanceV.normalise();

            puck.collideWithNormal(distanceV, circle);

            puck.pos.plusEq(puck.V.multiplyNew(elapsed * -deltaT));
            circle.pos.plusEq(circle.V.multiplyNew(elapsed * -deltaT));

            return true;
        }
        else {
            distanceV.normalise();
            distanceV.multiplyEq(minDist - Math.sqrt(distanceSq));
            puck.pos.plusEq(distanceV);
        }
    }

    return false;
};

Physics.prototype.circlesTimeToCollision = function(c1, c2, elapsed) {
    if (!c1.hasOwnProperty('V') || !c2.hasOwnProperty('V')) {
        throw new Error("Circles don't have velocities.");
    }
    if (!c1.hasOwnProperty('pos') || !c2.hasOwnProperty('pos')) {
        throw new Error("Circles don't have center positions.");
    }
    if (!c1.hasOwnProperty('R') || !c2.hasOwnProperty('R')) {
        throw new Error("Circles don't have radii.");
    }

    var minimumDistance = c1.R + c2.R;
    var distanceV = c2.pos.minusNew(c1.pos);
    var relativeV = c1.V.minusNew(c2.V).multiplyEq(elapsed);
    var distanceDotRelV = distanceV.clone().dot(relativeV);
    var relVSquared = relativeV.clone().dot(relativeV);
    var distanceVSquared = distanceV.clone().dot(distanceV);
    var discriminant = (distanceDotRelV * distanceDotRelV) -
        (relVSquared * (distanceVSquared - (minimumDistance * minimumDistance)));
    discriminant = Math.sqrt(discriminant);
    var t1 = (distanceDotRelV + discriminant) / relVSquared;
    var t2 = (distanceDotRelV - discriminant) / relVSquared;

    return t1 < 0 ? t1 : t2;
};
