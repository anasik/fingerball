function AudioManager(audioContext) {
    this.ctx = audioContext;

    if (!audioContext.createGain) {
        audioContext.createGain = audioContext.createGainNode;
    }

    this.gainNode = audioContext.createGain();
    this.gainNode.connect(audioContext.destination);

    this.playerHit = new AudioAsset('playerHit', this);
    this.wallHit = new AudioAsset('wallHit', this);
}

function AudioAsset(elementId, audioMgr) {
    this.element = document.getElementById(elementId);
    this.audioMgr = audioMgr;
    this.source = audioMgr.ctx.createMediaElementSource(this.element);
    this.source.connect(audioMgr.gainNode);
}

AudioAsset.prototype.play = function(volume) {
    this.audioMgr.gainNode.gain.value = volume * 1.5;
    this.element.play();
};

AudioAsset.prototype.impactSound = function(V) {
    var speed;
    if (V.magnitude) {
        speed = V.magnitude();
    }
    else {
        speed = V;
    }

    if (speed > 1) {
        this.play(1);
    }
    else if (speed > 0) {
        this.play(speed);
    }
};
