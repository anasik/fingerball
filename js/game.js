var Vector2 = window.Vector2;

var canvas = document.createElement("canvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

window.onresize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    puck.center(canvas);
    draw();
};

var gravityWells = [];

canvas.onmousedown = function(e) {
    gravityWells[0] = new Vector2(e.clientX, e.clientY);
    canvas.onmousemove = function(e) {
        gravityWells[0].x = e.clientX;
        gravityWells[0].y = e.clientY;
        return false;
    };
};

canvas.onmouseup = function() {
    gravityWells = [];
    canvas.onmousemove = null;
};

function touchWells(e) {
    e.preventDefault();

    gravityWells = [];
    for (var i = 0; i < e.touches.length; i++) {
        var touchV = new Vector2(e.touches[i].pageX, e.touches[i].pageY);
        gravityWells.push(touchV);
    }
}

canvas.ontouchstart = touchWells;
canvas.ontouchmove = touchWells; 
canvas.ontouchend = touchWells;

function drawCirclePath(ctx, pos, r) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2, true);
    ctx.closePath();
}

var puck = {
    pos: new Vector2(0, 0),
    R: 30,
    V: new Vector2(0, 0),
    center: function(canvas) {
        this.pos = new Vector2(canvas.width / 2, canvas.height / 2);
    },
    draw: function(ctx) {
        ctx.fillStyle = "red";
        drawCirclePath(ctx, this.pos, this.R);
        ctx.fill();
    }
};

function update() {
    var wallBounceRatio = 0.9;

    if (gravityWells.length > 0) {
        for (var i = 0; i < gravityWells.length; i++) {
            var directionV = gravityWells[i].minusNew(puck.pos);

            var directionMagnitude = directionV.magnitude();
            directionV.normalise();

            if (directionMagnitude > puck.R * 2) {
                var force = 10000 / Math.pow(directionMagnitude, 2);
                var accelV = directionV.multiplyNew(force);

                puck.V.plusEq(accelV);
            }
            else {
                // Bounce and remove puck from collision.
                // directionV points away from surface normal, but
                // reflect(angle + 180deg) is the same as reflect(angle).
                puck.V.reflect(directionV);
                puck.pos.minusEq(directionV.multiplyNew((puck.R * 2) - directionMagnitude));
            }
        }
    }

    if (puck.pos.x + puck.R > canvas.width) {
        puck.pos.x = canvas.width - puck.R;
        puck.V.x = -puck.V.x * wallBounceRatio;
    }
    else if (puck.pos.x - puck.R < 0) {
        puck.pos.x = puck.R;
        puck.V.x = -puck.V.x * wallBounceRatio;
    }

    if (puck.pos.y + puck.R > canvas.height) {
        puck.pos.y = canvas.height - puck.R;
        puck.V.y = -puck.V.y * wallBounceRatio;
    }
    else if (puck.pos.y - puck.R < 0) {
        puck.pos.y = puck.R;
        puck.V.y = -puck.V.y * wallBounceRatio;
    }

    puck.pos.plusEq(puck.V);
}

var ctx = canvas.getContext("2d");

function draw() {
    // Clear screen
    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw puck
    puck.draw(ctx);
}

function main() {
    update();
    draw();
}

puck.center(canvas);
setInterval(main, 1000 / 60);
