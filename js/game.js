var canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d"),
    Vector2 = window.Vector2, // library imported in index.html
    physics = null,
    gravityWells = null,
    puck = null,
    field = null,
    ai = null,
    lastUpdate = 0,
    framesRendered,
    lastFPScheck = 0,
    fps,
    puckV,
    puckAV,
    paused = false,
    debug = false;

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

function update(elapsed) {
    if (paused) {
        return;
    }

    ai.think(elapsed);

    gravityWells.allWellsArray().forEach(function (well) {
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

    puck.pos.plusEq(puck.V.multiplyNew(elapsed));

    puck.angle += puck.angularV * elapsed;
    if (puck.angle < 0 || puck.angle > Math.PI * 2) {
        puck.angle -= Math.floor(puck.angle / (Math.PI * 2)) * Math.PI * 2;
    }

    puck.applyDrag(elapsed);

    gravityWells.applyForces(puck, elapsed);

    field.collide(puck, elapsed);

    if (puck.pos.x + puck.R < field.margin || puck.pos.x - puck.R > field.width + field.margin ||
            puck.pos.y + puck.R < field.margin || puck.pos.y - puck.R > field.height + field.margin)
    {
        puck.V = new Vector2(0, 0);
        puck.center(canvas);
    }
}

function draw() {
    // Clear screen
    ctx.fillStyle = "lightgray";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    field.draw("rgb(33,33,33)");
    puck.draw("rgb(33,33,33)", "red");
    gravityWells.draw("rgb(33,33,33)");
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
        puckAV = Math.round(puck.angularV * 1000 * 100 / (Math.PI * 2)) / 100;
    }

    ctx.fillStyle = "white";
    ctx.fillText("FPS: " + fps +
            " puckV: " + puckV +
            " puckAV: " + puckAV,
            80, 14);
}

function initGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    physics = new window.Physics();
    gravityWells = new window.GravityWells(physics, canvas, ctx, false, 45);
    puck = new window.Puck(canvas, ctx, 30);
    puck.center(canvas);
    field = new window.Field(physics, canvas, ctx, 10, 20, 0.9);
    field.addGoals(canvas);
    ai = new window.AI(gravityWells, puck, field);

    canvas.onmousedown = $.proxy(gravityWells.mouseDown, gravityWells);
    canvas.onmouseup = $.proxy(gravityWells.mouseUp, gravityWells);
    var touchWellsProxy = $.proxy(gravityWells.touchWells, gravityWells);
    canvas.ontouchstart = touchWellsProxy;
    canvas.ontouchmove = touchWellsProxy; 
    canvas.ontouchend = touchWellsProxy;
}

initGame();
window.requestAnimationFrame(main);
