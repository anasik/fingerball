var Physics = function() { };

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
