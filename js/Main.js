window.requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;
window.AudioContext = window.AudioContext || window.webkitAudioContext;

var canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d"),
    audioCtx = new window.AudioContext(),
    sounds = new window.AudioManager(audioCtx),
    lastUpdate = 0,
    elapsed = 0,
    framesRendered,
    timeSinceLastFPScheck = 0,
    fps,
    debug = false,
    scene = new window.MenuScene(canvas, ctx),
    assets = new window.AssetManager();

window.onresize = function() {
    assets.refresh();
    scene.init();
    scene.draw();
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
        scene.draw();
        alert(msg);
    }
}

function debugLog(msg) {
    if (debug) {
        console.log(msg);
    }
}

function main(timestamp) {
    window.requestAnimationFrame(main);

    elapsed = timestamp - lastUpdate;
    lastUpdate = timestamp;

    scene.update(elapsed);
    scene.draw();

    framesRendered += 1;
    timeSinceLastFPScheck += elapsed;

    if (timeSinceLastFPScheck > 200) {
        fps = Math.floor((framesRendered / timeSinceLastFPScheck) * 1000);
        framesRendered = 0;
        timeSinceLastFPScheck = 0;
    }

    ctx.fillStyle = "white";
    ctx.fillText("FPS: " + fps, 60, 14);
}

scene.init();
window.requestAnimationFrame(main);
