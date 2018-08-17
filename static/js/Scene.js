function Scene(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
}

Scene.prototype.init = null;
Scene.prototype.update = null;
Scene.prototype.draw = null;
