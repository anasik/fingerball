window.requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;
window.AudioContext = window.AudioContext || window.webkitAudioContext;

var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") {
    hidden = "hidden";
    visibilityChange = "visibilitychange";
}
else if (typeof document.mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
}
else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
}
else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
}

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

if (debug) {
    window.gameConsole = new window.GameConsole(canvas);
    window.gameConsole.message("Game loaded.");
}

window.onresize = function() {
    assets.refresh();
    scene.init();
    scene.draw();
};

function handleVisibilityChange() {
    if (window.scene && window.scene.hasOwnProperty("paused")) {
        if (document[hidden]) {
            window.scene.paused = true;
        }
        else {
            window.scene.paused = false;
        }
    }
}
document.addEventListener(visibilityChange, handleVisibilityChange, false);

document.body.appendChild(canvas);

// No idea what this is and why it was ever needed. Doesn't seem to be doing anything. 0 Usages.
// var crc2DProto = CanvasRenderingContext2D.prototype;
// crc2DProto.lineToV = function(vec) {
//     this.lineTo(vec.x, vec.y);
// };
// crc2DProto.moveToV = function(vec) {
//     this.moveTo(vec.x, vec.y);
// };
// crc2DProto.circlePathV = function(pos, r) {
//     this.beginPath();
//     this.arc(pos.x, pos.y, r, 0, Math.PI * 2, true);
//     this.closePath();
// };

function main(timestamp) {
    window.requestAnimationFrame(main);

    elapsed = timestamp - lastUpdate;
    lastUpdate = timestamp;

    scene.update(elapsed);
    scene.draw();

    if (debug) {
        framesRendered += 1;
        timeSinceLastFPScheck += elapsed;

        if (timeSinceLastFPScheck > 200) {
            fps = Math.floor(
                    (framesRendered / timeSinceLastFPScheck) * 1000);
            framesRendered = 0;
            timeSinceLastFPScheck = 0;
        }

        ctx.fillStyle = "white";
        ctx.fillText("FPS: " + fps, 60, 14);
    }
}

scene.init();
window.requestAnimationFrame(main);
