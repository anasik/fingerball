function AssetManager() {
    var screenWidth = window.innerWidth,
        screenHeight = window.innerHeight;
    this.field = new SvgAsset(
            'stadium',
            screenWidth, screenHeight,
            true, true);
    this.puck = new SvgAsset(
            'football',
            100, 100,
            false, false);
    this.redPlayer = new SvgAsset(
            'player-red',
            150, 150,
            false, true);
    this.bluePlayer = new SvgAsset(
            'player-blue',
            150, 150,
            false, true);
}

AssetManager.prototype.refresh = function() {
    this.field.reRender(window.innerWidth, window.innerHeight);
};

function SvgAsset(name, width, height, multiAspect, autoRotate) {
    if (!name || !width || !height) {
        throw new Error('invalid parameters');
    }

    this.name = name;
    this.width = width;
    this.height = height;
    this.multiAspect = multiAspect;
    this.autoRotate = autoRotate;
    this.prevWide = this.getWide();

    this.image = new Image();
    this.loaded = false;

    this.image.onload = $.proxy(function() {
        this.loaded = true;
        this.reRender(this.width, this.height);
    }, this);

    this.loadImage(name);

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
}

SvgAsset.prototype.getLandscape = function() {
    return this.width >= this.height;
};

SvgAsset.prototype.getWide = function() {
    if (this.getLandscape()) {
        return this.width / this.height > 1.55;
    }
    else {
        return this.height / this.width > 1.55;
    }
};

SvgAsset.prototype.loadImage = function(name) {
    this.loaded = false;

    if (this.multiAspect && this.getWide()) {
        this.image.src = '/images/' + name + '-wide.svg';
    }
    else {
        this.image.src = '/images/' + name + '.svg';
    }
};

SvgAsset.prototype.reRender = function(width, height) {
    this.width = this.canvas.width = width;
    this.height = this.canvas.height = height;

    if (this.multiAspect) {
        var newWide = this.getWide();
        if (newWide !== this.prevWide) {
            this.prevWide = newWide;
            this.loadImage(this.name);
            return;
        }
    }

    if (!this.loaded) {
        return;
    }

    if (this.getLandscape() || !this.autoRotate) {
        this.ctx.drawImage(this.image, 0, 0, width, height);
    }
    else {
        var halfWidth = width / 2,
            halfHeight = height / 2;
        this.ctx.save();
        this.ctx.translate(halfWidth, halfHeight);
        this.ctx.rotate(Math.PI / 2);
        this.ctx.drawImage(
                this.image,
                -halfHeight, -halfWidth,
                height, width);
        this.ctx.restore();
    }
};
