var Vector2 = window.Vector2;

function Field(physics, canvas, ctx, goalPostR, margin, bounce) {
    this.physics = physics;
    this.canvas = canvas;
    this.ctx = ctx;
    this.goalPosts = [];
    this.goalPostR = goalPostR;
    this.landscape = false;
    this.width = 0;
    this.height = 0;
    this.margin = margin;
    this.wallBounceRatio = bounce;
    this.rightWall = new Vector2(-1, 0);
    this.leftWall = new Vector2(1, 0);
    this.topWall = new Vector2(0, 1);
    this.bottomWall = new Vector2(0, -1);
}

Field.prototype.createGoalPost = function(pos) {
    return {
        pos: pos,
        V: new Vector2(0, 0),
        R: this.goalPostR
    };
};

Field.prototype.addGoals = function() {
    this.width = this.canvas.width - (2 * this.margin);
    this.maxX = this.margin + this.width;
    this.height = this.canvas.height - (2 * this.margin);
    this.maxY = this.margin + this.height;
    this.fieldCenterV = new Vector2(
            this.canvas.width / 2,
            this.canvas.height / 2
            );

    if (this.canvas.width < this.canvas.height) {
        this.landscape = false;
        var oneQuarterW = (this.width / 4) + this.margin;
        var threeQuartersW = (this.width * 3 / 4) + this.margin;
        this.goalPosts[0] = this.createGoalPost(new Vector2(oneQuarterW, this.margin));
        this.goalPosts[1] = this.createGoalPost(new Vector2(threeQuartersW, this.margin));
        this.goalPosts[2] = this.createGoalPost(new Vector2(oneQuarterW, this.height + this.margin));
        this.goalPosts[3] = this.createGoalPost(new Vector2(threeQuartersW, this.height + this.margin));
    }
    else {
        this.landscape = true;
        var oneQuarterH = (this.height / 4) + this.margin;
        var threeQuartersH = (this.height * 3 / 4) + this.margin;
        this.goalPosts[0] = this.createGoalPost(new Vector2(this.margin, oneQuarterH));
        this.goalPosts[1] = this.createGoalPost(new Vector2(this.margin, threeQuartersH));
        this.goalPosts[2] = this.createGoalPost(new Vector2(this.width + this.margin, oneQuarterH));
        this.goalPosts[3] = this.createGoalPost(new Vector2(this.width + this.margin, threeQuartersH));
    }
};

Field.prototype.draw = function() {
    this.ctx.drawImage(window.assets.field.canvas, 0, 0);
    return;
};

Field.prototype.collide = function(puck, elapsed) {
    if (this.landscape) {
        if (puck.pos.y - puck.R > this.goalPosts[0].pos.y + this.goalPostR &&
                puck.pos.y + puck.R < this.goalPosts[1].pos.y - this.goalPostR) {
            return;
        }
    }
    else {
        if (puck.pos.x - puck.R > this.goalPosts[0].pos.x + this.goalPostR &&
                puck.pos.x + puck.R < this.goalPosts[1].pos.x - this.goalPostR) {
            return;
        }
    }

    this.goalPosts.forEach(function (goalPost) {
        if (this.physics.collidePuckCircle(puck, goalPost, elapsed)) {
            window.sounds.wallHit.impactSound(puck.V);
        }
    }, this);

    if (!this.landscape ||
            puck.pos.y < this.goalPosts[0].pos.y - this.goalPostR ||
            puck.pos.y > this.goalPosts[1].pos.y + this.goalPostR) {
        if (puck.pos.x + puck.R > this.width + this.margin) {
            puck.pos.x = (this.width + this.margin) - puck.R;
            puck.collideWithNormal(this.rightWall);
            window.sounds.wallHit.impactSound(puck.V.dot(this.rightWall));
        }
        else if (puck.pos.x - puck.R < this.margin) {
            puck.pos.x = puck.R + this.margin;
            puck.collideWithNormal(this.leftWall);
            window.sounds.wallHit.impactSound(puck.V.dot(this.leftWall));
        }
    }

    if (this.landscape ||
            puck.pos.x < this.goalPosts[0].pos.x - this.goalPostR ||
            puck.pos.x > this.goalPosts[1].pos.x + this.goalPostR) {
        if (puck.pos.y + puck.R > this.height + this.margin) {
            puck.pos.y = (this.height + this.margin) - puck.R;
            puck.collideWithNormal(this.bottomWall);
            window.sounds.wallHit.impactSound(puck.V.dot(this.bottomWall));
        }
        else if (puck.pos.y - puck.R < this.margin) {
            puck.pos.y = puck.R + this.margin;
            puck.collideWithNormal(this.topWall);
            window.sounds.wallHit.impactSound(puck.V.dot(this.topWall));
        }
    }
};
