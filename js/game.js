var Vector2 = window.Vector2;

var canvas = document.createElement("canvas");

document.body.appendChild(canvas);

window.onresize = function() {
    initGame();
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

function ctxVecOp(ctx, op, vec) {
    ctx[op](vec.x, vec.y);
}

var field = {
    goalPosts: [],
    goalPostR: 5,
    landscape: false,
    width: 0,
    height: 0,
    margin: 20,
    wallBounceRatio: 0.9,

    addGoals: function(canvas) {
        this.width = canvas.width - this.margin;
        this.height = canvas.height - this.margin;

        if (canvas.width < canvas.height) {
            this.landscape = false;
            var oneThirdW = (canvas.width / 3) + this.margin;
            var twoThirdsW = (canvas.width * 2 / 3) + this.margin;
            this.goalPosts[0] = new Vector2(oneThirdW, this.margin);
            this.goalPosts[1] = new Vector2(twoThirdsW, this.margin);
            this.goalPosts[2] = new Vector2(oneThirdW, this.height);
            this.goalPosts[3] = new Vector2(twoThirdsW, this.height);
        }
        else {
            this.landscape = true;
            var oneThirdH = (canvas.height / 3) + this.margin;
            var twoThirdsH = (canvas.height * 2 / 3) + this.margin;
            this.goalPosts[0] = new Vector2(this.margin, oneThirdH);
            this.goalPosts[1] = new Vector2(this.margin, twoThirdsH);
            this.goalPosts[2] = new Vector2(this.width, oneThirdH);
            this.goalPosts[3] = new Vector2(this.width, twoThirdsH);
        }
    },

    draw: function(ctx) {
        ctx.beginPath();
        ctxVecOp(ctx, "moveTo", this.goalPosts[0]);
        ctx.lineTo(this.margin, this.margin);
        if (this.landscape) {
            ctx.lineTo(this.width, this.margin);
            ctxVecOp(ctx, "lineTo", this.goalPosts[2]);
            ctxVecOp(ctx, "moveTo", this.goalPosts[3]);
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(this.margin, this.height);
            ctxVecOp(ctx, "lineTo", this.goalPosts[1]);
        }
        else {
            ctx.lineTo(this.margin, this.height);
            ctxVecOp(ctx, "lineTo", this.goalPosts[2]);
            ctxVecOp(ctx, "moveTo", this.goalPosts[3]);
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(this.width, this.margin);
            ctxVecOp(ctx, "lineTo", this.goalPosts[1]);
        }
        ctx.lineWidth = 3;
        ctx.strokeStyle = "red";
        ctx.stroke();

        ctx.fillStyle = "red";
        for (var i = 0; i < 4; i++) {
            drawCirclePath(ctx, this.goalPosts[i], this.goalPostR);
            ctx.fill();
        }
    },

    collide: function(puck) {
        var futurePos = puck.pos.plusNew(puck.V);

        if (this.landscape) {
            if (futurePos.y - puck.R > this.goalPosts[0].y &&
                    futurePos.y + puck.R < this.goalPosts[1].y) {
                return;
            }
        }
        else {
            if (futurePos.x - puck.R > this.goalPosts[0].x &&
                    futurePos.x + puck.R < this.goalPosts[1].x) {
                return;
            }
        }

        for (var i = 0; i < 4; i++) {
            var direction = this.goalPosts[i].minusNew(futurePos);
            if (direction.isMagLessThan(puck.R)) {
                direction.normalise();
                puck.V.reflect(direction);
                return;
            }
        }

        if (futurePos.x + puck.R > this.width) {
            futurePos.x = this.width - puck.R;
            puck.V.x = -puck.V.x * this.wallBounceRatio;
        }
        else if (futurePos.x - puck.R < this.margin) {
            futurePos.x = puck.R + this.margin;
            puck.V.x = -puck.V.x * this.wallBounceRatio;
        }

        if (futurePos.y + puck.R > this.height) {
            futurePos.y = this.height - puck.R;
            puck.V.y = -puck.V.y * this.wallBounceRatio;
        }
        else if (futurePos.y - puck.R < this.margin) {
            futurePos.y = puck.R + this.margin;
            puck.V.y = -puck.V.y * this.wallBounceRatio;
        }
    }
};

function update() {
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

    field.collide(puck);
    puck.pos.plusEq(puck.V);
}

var ctx = canvas.getContext("2d");

function draw() {
    // Clear screen
    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    puck.draw(ctx);
    field.draw(ctx);
}

function main() {
    update();
    draw();
}

function initGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    puck.center(canvas);
    field.addGoals(canvas);
}

initGame();
setInterval(main, 1000 / 60);
