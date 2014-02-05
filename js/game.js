var canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d"),
    Vector2 = window.Vector2, // library imported in index.html
    lastUpdate = 0,
    framesRendered,
    lastFPScheck = 0,
    fps,
    puckV,
    firstWellV = 0,
    lastWellVCheck = 0,
    paused = false;

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

function GravityWell(pos) {
    this.pos = pos;
    this.startPos = pos.clone();
    this.V = new Vector2(0,0);
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

        for (var i = 0, length = this.wells.length; i < length; i++) {
            var directionV = this.wells[i].pos.minusNew(puck.pos);

            var directionMagnitude = directionV.magnitude();
            directionV.normalise();

            if (directionMagnitude > puck.R * 2.5) {
                var scaledMagnitude = directionMagnitude / 10;
                var force = 0.2 / (scaledMagnitude * scaledMagnitude); 
                var accelV = directionV.multiplyNew(force);

                puck.V.plusEq(accelV.multiplyEq(elapsed));
            }
            else {
                // DEBUG
                paused = true;
                return;

                puck.V.minusEq(this.wells[i].V);
                // Bounce and remove puck from collision.
                directionV.reverse();
                puck.V.reflect(directionV);
                puck.pos.plusEq(directionV.multiplyNew((puck.R * 2.5) - directionMagnitude));
            }
        }
    },

    draw: function() {
        ctx.fillStyle = "orange";
        for (var i = 0, length = this.wells.length; i < length; i++) {
            ctx.circlePathV(this.wells[i].pos, puck.R * 1.5);
            ctx.fill();
        }
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
    center: function() {
        this.pos = new Vector2(canvas.width / 2, canvas.height / 2);
    },
    draw: function() {
        ctx.fillStyle = "red";
        ctx.circlePathV(this.pos, this.R);
        ctx.fill();
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
                puck.V.x = -puck.V.x * this.wallBounceRatio;
            }
            else if (puck.pos.x - puck.R < this.margin) {
                puck.pos.x = puck.R + this.margin;
                puck.V.x = -puck.V.x * this.wallBounceRatio;
            }
        }

        if (this.landscape ||
                puck.pos.x < this.goalPosts[0].x - this.goalPostR ||
                puck.pos.x > this.goalPosts[1].x + this.goalPostR) {
            if (puck.pos.y + puck.R > this.height + this.margin) {
                puck.pos.y = (this.height + this.margin) - puck.R;
                puck.V.y = -puck.V.y * this.wallBounceRatio;
            }
            else if (puck.pos.y - puck.R < this.margin) {
                puck.pos.y = puck.R + this.margin;
                puck.V.y = -puck.V.y * this.wallBounceRatio;
            }
        } 
    }
};

function update(elapsed) {
    if (paused) {
        return;
    }

    //lastWellVCheck += elapsed;
    //if (lastWellVCheck > 200) {
        for (var i = 0, len = gravityWells.wells.length; i < len; i++) {
            var well = gravityWells.wells[i];
            // weighted average
            var newV = well.pos.minusNew(well.startPos).multiplyEq(2);
            well.V = newV.plusEq(well.V).divideEq(3).divideEq(elapsed);
            well.pos.copyTo(well.startPos);
        }
      //  lastWellVCheck = 0;
    //}

    puck.pos.plusEq(puck.V.multiplyNew(elapsed));

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

    window.requestAnimationFrame(main);
}

function initGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    puck.center(canvas);
    field.addGoals(canvas);
}

initGame();
window.requestAnimationFrame(main);
