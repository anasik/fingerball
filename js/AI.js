var Vector2 = window.Vector2,
    GravityWell = window.GravityWell;

function AI(gravityWells, puck, field) {
    this.gravityWells = gravityWells;
    this.puck = puck;
    this.field = field;

    var startPos = field.landscape ?
        new Vector2(field.margin + (field.width * 0.80),
                field.margin + (field.height / 2)) :
        new Vector2(field.margin + (field.width / 2),
                field.margin + (field.height * 0.20));

    this.myGravityWell = new GravityWell(startPos, 45);
    gravityWells.wells.ai = this.myGravityWell;
}

AI.prototype.think = function(elapsed) {
    //this.gravityWells.wells[-1] = this.myGravityWell;
};
