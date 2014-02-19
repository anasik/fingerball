var canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d"),
    Vector2 = window.Vector2, // library imported in index.html
    lastUpdate = 0,
    framesRendered,
    lastFPScheck = 0,
    fps,
    puckV,
    firstWellV = 0,
    paused = false,
    debug = false,
    gravity = false;

window.requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

window.onresize = function() {
    initGame();
    draw();
};

document.body.appendChild(canvas);

var crc2DProto = CanvasRenderingContext2D.prototype;
crc2DProto.lineToV = function(vec) {
    this.lineTo(vec.x, vec.y);
};
crc2DProto.moveToV = function(vec) {
    this.moveTo(vec.x, vec.y);
};
crc2DProto.circlePathV = function(pos, r) {
    this.beginPath();
    this.arc(pos.x, pos.y, r, 0, Math.PI * 2, true);
    this.closePath();
};

function debugAlert(msg) {
    if (debug) {
        window.draw();
        alert(msg);
    }
}

function debugLog(msg) {
    if (debug) {
        console.log(msg);
    }
}

function circlesTimeToCollisionPoint(c1, c2, elapsed) {
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
}

function GravityWell(pos) {
    this.pos = pos;
    this.startPos = null;
    this.V = new Vector2(0,0);
    this.R = 45;
    this.timeout = 0;
}

function TouchGravityWell(pos, identifier) {
    GravityWell.call(this, pos);
    this.identifier = identifier;
}

var gravityWells = {
    wells: [],

    mouseDown: function(e) {
        if (!paused) {
            var pos = new Vector2(e.clientX, e.clientY);
            gravityWells.wells[0] = new GravityWell(pos);
        }
        canvas.onmousemove = gravityWells.mouseMove;
    },

    mouseMove: function(e) {
        if (!paused) {
            gravityWells.wells[0].pos.x = e.clientX;
            gravityWells.wells[0].pos.y = e.clientY;
        }
        return false;
    },

    mouseUp: function() {
        if (!paused) {
            gravityWells.wells = [];
        }
        canvas.onmousemove = null;
    },

    touchWells: function(e) {
        e.preventDefault();

        if (paused) {
            return;
        }

        var newWells = [];
        for (var i = 0; i < e.touches.length; i++) {
            var touchV = new Vector2(e.touches[i].pageX, e.touches[i].pageY);

            var oldTouch = null;
            for (var j = 0; j < gravityWells.wells.length; j++) {
                if (gravityWells.wells[j].identifier === e.touches[i].identifier) {
                    oldTouch = gravityWells.wells[j];
                    break;
                }
            }

            if (oldTouch) {
                oldTouch.pos = touchV;
                newWells.push(oldTouch);
            }
            else {
                newWells.push(new TouchGravityWell(touchV, e.touches[i].identifier));
            }
        }

        gravityWells.wells = newWells;
    },

    applyForces: function(puck, elapsed) {
        if (!this.wells.length) {
            return;
        }

        this.wells.forEach(function(well) {
            var distanceV = well.pos.minusNew(puck.pos);
            var distance = distanceV.magnitude();
            var minimumDistance = puck.R * 2.5; // well is 1.5 * puck.R
            var collisionNormal = distanceV.clone().normalise();

            if (distance > minimumDistance) {
                if (gravity) {
                    var scaledMagnitude = distance / 10;
                    var force = 0.2 / (scaledMagnitude * scaledMagnitude); 
                    var accelV = collisionNormal.multiplyNew(force);

                    puck.V.plusEq(accelV.multiplyEq(elapsed));
                }
            }
            else {
                var deltaT = circlesTimeToCollisionPoint(puck, well, elapsed);
                debugLog('deltaT ' + deltaT + ' wellV ' + (well.V.magnitude() * elapsed) +
                    ' timeout ' + well.timeout);

                if (deltaT > -1 && well.timeout <= 0) {
                    // Rewind time and re-calculate collision normal
                    puck.pos.plusEq(puck.V.multiplyNew(elapsed * deltaT));
                    well.pos.plusEq(well.V.multiplyNew(elapsed * deltaT));
                    collisionNormal = well.pos.minusNew(puck.pos).normalise();

                    // Calculate velocity
                    puck.collideWithNormal(collisionNormal, well.V);

                    // Fast-forward time
                    puck.pos.plusEq(puck.V.multiplyNew(elapsed * -deltaT));
                    well.pos.plusEq(well.V.multiplyNew(elapsed * -deltaT));

                    well.timeout = 100;
                }
                else {
                    // Collision more than 5 frames away; probably direct press on the puck
                    var minDist = puck.R + well.R;
                    var moveDist = collisionNormal.multiplyNew(minDist - distance);
                    puck.pos.minusEq(moveDist);
                }
            }
        });
    },

    draw: function() {
        ctx.fillStyle = "orange";
        this.wells.forEach(function(well) {
            ctx.circlePathV(well.pos, puck.R * 1.5);
            ctx.fill();

            if (debug) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.circlePathV(well.pos.minusNew(well.V.multiplyNew(1000 / 60)), puck.R * 1.5);
                ctx.fill();
                ctx.restore();
            }
        });
    }
};

canvas.onmousedown = gravityWells.mouseDown;
canvas.onmouseup = gravityWells.mouseUp;
canvas.ontouchstart = gravityWells.touchWells;
canvas.ontouchmove = gravityWells.touchWells; 
canvas.ontouchend = gravityWells.touchWells;

var puck = {
    pos: new Vector2(0, 0),
    R: 30,
    V: new Vector2(0, 0),
    angle: 0,
    angularV: 0,
    applyDrag: function() {
        if (this.V.x !== 0 || this.V.y !== 0) {
            var drag = this.V.clone().normalise();
            drag.multiplyEq(this.V.magnitudeSquared() * 0.008);
            this.V.minusEq(drag);
        }
    },
    collideWithNormal: function(collisionNormal, otherV) {
        window.draw();
        var relativeV = otherV ? this.V.minusNew(otherV) : this.V;

        var normalVel = relativeV.dot(collisionNormal);

        var perpToNorm = new Vector2(-collisionNormal.y, collisionNormal.x);
        var surfaceV = (this.angularV * this.R) * (5 / 7);
        var perpVel = relativeV.dot(perpToNorm) - surfaceV;

        this.angularV = (-perpVel / puck.R) * (5 / 7);

        // The other object can't change our perpendicular velocity.
        perpVel = (this.V.dot(perpToNorm) - surfaceV) * (5 / 7);

        this.V = collisionNormal.multiplyNew(-normalVel * 0.8);
        this.V.plusEq(perpToNorm.multiplyNew(perpVel));
    },
    center: function() {
        this.pos = new Vector2(canvas.width / 2, canvas.height / 2);
        this.V = new Vector2(0, 0);
        this.angle = 0;
        this.angularV = 0;
    },
    draw: function() {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(0, 0, this.R, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 3;
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -this.R);
        ctx.stroke();

        ctx.restore();

        if (debug) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.circlePathV(this.pos.minusNew(this.V.multiplyNew(1000 / 60)), this.R);
            ctx.fill();
            ctx.restore();
        }
    }
};

var field = {
    goalPosts: [],
    goalPostR: 10,
    landscape: false,
    width: 0,
    height: 0,
    margin: 20,
    wallBounceRatio: 0.9,

    addGoals: function() {
        this.width = canvas.width - (2 * this.margin);
        this.height = canvas.height - (2 * this.margin);

        if (canvas.width < canvas.height) {
            this.landscape = false;
            var oneQuarterW = (this.width / 4) + this.margin;
            var threeQuartersW = (this.width * 3 / 4) + this.margin;
            this.goalPosts[0] = new Vector2(oneQuarterW, this.margin);
            this.goalPosts[1] = new Vector2(threeQuartersW, this.margin);
            this.goalPosts[2] = new Vector2(oneQuarterW, this.height + this.margin);
            this.goalPosts[3] = new Vector2(threeQuartersW, this.height + this.margin);
        }
        else {
            this.landscape = true;
            var oneQuarterH = (this.height / 4) + this.margin;
            var threeQuartersH = (this.height * 3 / 4) + this.margin;
            this.goalPosts[0] = new Vector2(this.margin, oneQuarterH);
            this.goalPosts[1] = new Vector2(this.margin, threeQuartersH);
            this.goalPosts[2] = new Vector2(this.width + this.margin, oneQuarterH);
            this.goalPosts[3] = new Vector2(this.width + this.margin, threeQuartersH);
        }
    },

    draw: function() {
        ctx.beginPath();
        ctx.moveToV(this.goalPosts[0]);
        ctx.lineTo(this.margin, this.margin);

        if (this.landscape) {
            ctx.lineTo(this.width + this.margin, this.margin);
        }
        else {
            ctx.lineTo(this.margin, this.height + this.margin);
        }
        
        ctx.lineToV(this.goalPosts[2]);
        ctx.moveToV(this.goalPosts[3]);

        if (this.landscape) {
            ctx.lineTo(this.width + this.margin, this.height + this.margin);
            ctx.lineTo(this.margin, this.height + this.margin);
        }
        else {
            ctx.lineTo(this.width + this.margin, this.height + this.margin);
            ctx.lineTo(this.width + this.margin, this.margin);
        }
        
        ctx.lineToV(this.goalPosts[1]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "red";
        ctx.stroke();

        ctx.fillStyle = "red";
        for (var i = 0; i < 4; i++) {
            ctx.circlePathV(this.goalPosts[i], this.goalPostR);
            ctx.fill();
        }
    },

    collide: function(puck) {
        if (this.landscape) {
            if (puck.pos.y - puck.R > this.goalPosts[0].y + this.goalPostR &&
                    puck.pos.y + puck.R < this.goalPosts[1].y - this.goalPostR) {
                return;
            }
        }
        else {
            if (puck.pos.x - puck.R > this.goalPosts[0].x + this.goalPostR &&
                    puck.pos.x + puck.R < this.goalPosts[1].x - this.goalPostR) {
                return;
            }
        }

        for (var i = 0; i < 4; i++) {
            var directionV = puck.pos.minusNew(this.goalPosts[i]);
            var directionMagnitude = directionV.magnitude();

            if (directionMagnitude < puck.R + this.goalPostR) {
                directionV.normalise();
                puck.V.reflect(directionV);
                puck.pos.plusEq(directionV.multiplyEq((puck.R + this.goalPostR) - directionMagnitude));
                return;
            }
        }

        if (!this.landscape ||
                puck.pos.y < this.goalPosts[0].y - this.goalPostR ||
                puck.pos.y > this.goalPosts[1].y + this.goalPostR) {
            if (puck.pos.x + puck.R > this.width + this.margin) {
                puck.pos.x = (this.width + this.margin) - puck.R;
                puck.collideWithNormal(new Vector2(1, 0));
            }
            else if (puck.pos.x - puck.R < this.margin) {
                puck.pos.x = puck.R + this.margin;
                puck.collideWithNormal(new Vector2(1, 0));
            }
        }

        if (this.landscape ||
                puck.pos.x < this.goalPosts[0].x - this.goalPostR ||
                puck.pos.x > this.goalPosts[1].x + this.goalPostR) {
            if (puck.pos.y + puck.R > this.height + this.margin) {
                puck.pos.y = (this.height + this.margin) - puck.R;
                puck.collideWithNormal(new Vector2(0, 1));
            }
            else if (puck.pos.y - puck.R < this.margin) {
                puck.pos.y = puck.R + this.margin;
                puck.collideWithNormal(new Vector2(0, 1));
            }
        } 
    }
};

function update(elapsed) {
    if (paused) {
        return;
    }

    gravityWells.wells.forEach(function (well) {
        if (well.startPos) {
            well.V = well.pos.minusNew(well.startPos).divideEq(elapsed);
        }
        else {
            well.startPos = new Vector2();
        }

        well.pos.copyTo(well.startPos);

        if (well.timeout > 0) {
            well.timeout -= elapsed;
        }
    });

    puck.applyDrag();

    puck.pos.plusEq(puck.V.multiplyNew(elapsed));

    puck.angle += puck.angularV * elapsed;
    if (puck.angle < 0 || puck.angle > Math.PI * 2) {
        puck.angle -= Math.floor(puck.angle / (Math.PI * 2)) * Math.PI * 2;
    }

    gravityWells.applyForces(puck, elapsed);

    field.collide(puck);

    if (puck.pos.x + puck.R < field.margin || puck.pos.x - puck.R > field.width + field.margin ||
            puck.pos.y + puck.R < field.margin || puck.pos.y - puck.R > field.height + field.margin)
    {
        puck.V = new Vector2(0, 0);
        puck.center(canvas);
    }
}

function draw() {
    // Clear screen
    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    puck.draw();
    field.draw();
    gravityWells.draw();
}

function main(timestamp) {
    window.requestAnimationFrame(main);

    update(timestamp - lastUpdate);
    draw();
    lastUpdate = timestamp;

    framesRendered += 1;
    var timeSinceLastFPScheck = timestamp - lastFPScheck;

    if (timeSinceLastFPScheck > 200) {
        fps = Math.floor((framesRendered / timeSinceLastFPScheck) * 1000);
        lastFPScheck = timestamp;
        framesRendered = 0;

        puckV = Math.round(puck.V.magnitude() * 1000);
        if (gravityWells.wells[0]) {
            firstWellV = Math.round(gravityWells.wells[0].V.magnitude() * 1000);
        }
        else
        {
            firstWellV = 0;
        }
    }

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("FPS: " + fps + " puckV: " + puckV + " firstWellV: " + firstWellV, 80, 14);
}

function initGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    puck.center(canvas);
    field.addGoals(canvas);
}

initGame();
window.requestAnimationFrame(main);
