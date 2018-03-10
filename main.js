function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, frameDuration, frames, loop, reverse) {
    this.spriteSheet = spriteSheet;
    this.startX = startX;
    this.startY = startY;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight = frameHeight;
    this.frames = frames;
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.reverse = reverse;
}

Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
        }
    } else if (this.isDone()) {
        return;
    }
    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var vindex = 0;
    if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) {
        index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
        vindex++;
    }
    while ((index + 1) * this.frameWidth > this.spriteSheet.width) {
        index -= Math.floor(this.spriteSheet.width / this.frameWidth);
        vindex++;
    }

    var locX = x;
    var locY = y;
    var offset = vindex === 0 ? this.startX : 0;
    ctx.drawImage(this.spriteSheet,
                  index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  locX, locY,
                  this.frameWidth * scaleBy,
                  this.frameHeight * scaleBy);
}

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
}

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
}

function Background(game) {
    Entity.call(this, game, 0, 400);
    this.radius = 200;
}

Background.prototype = new Entity();
Background.prototype.constructor = Background;

Background.prototype.update = function () {
}

Background.prototype.draw = function (ctx) {
    ctx.fillStyle = "SaddleBrown";
    ctx.fillRect(0,500,800,300);
    Entity.prototype.draw.call(this);
}

//target spawner
//spawns targets in random locations around the canvas, but not outside
//array for the live targets, pushed when adding new, shift after kill animation
function Target_Spawner(game) {
    this.targets = [];
    this.game = game;
}

Target_Spawner.prototype = new Entity();
Target_Spawner.prototype.constructor = Target_Spawner;

Target_Spawner.prototype.update = function() {

}

Target_Spawner.prototype.draw = function(ctx) {

}



//target object
//var to determine placement and if it is alive

function Target(game, x, y, type) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.live = true;
    // this.animation = new Animation(ASSET_MANAGER.getAsset("./img/RobotUnicorn.png"), 0, 0, 206, 110, 0.02, 30, true, true);
    this.spawnAnim = new Animation(ASSET_MANAGER.getAsset("./img/targets.png"), 0, 0, 90, 171, 0.4, 2, false, false);
    this.idle = new Animation(ASSET_MANAGER.getAsset("./img/targets.png"), (type * 90), 342, 90, 171, 1, 1, true, false);
    this.deathAnim = new Animation(ASSET_MANAGER.getAsset("./img/targets.png"), 0, 171, 90, 171, 0.4, 2, false, false);

}

Target.prototype = new Entity();
Target.prototype.constructor = Target;

Target.prototype.update = function() {

}

Target.prototype.draw = function(ctx) {
    
}

//shooter object
//ai to go to the earliest target that appeared
//MATHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH
//shoots when over the target

function Shooter(game) {
    this.anim = new Animation(ASSET_MANAGER.getAsset("./img/reticle.png"), 0, 0, 480, 480, 1, 1, true, false);
    Entity.call(this, game, 0, 440);
}

Shooter.prototype = new Entity();
Shooter.prototype.constructor = Shooter;

Shooter.prototype.update = function() {

}

Shooter.prototype.draw = function(ctx) {
    this.anim.drawFrame(this.game.clockTick, ctx, this.x, this.y, 0.25);
}

//bullet object
//only out for a few frames at most
//shown by white screen with black box of where it was shot (throwback to old lightgun games)
//var to determine placement and if it is alive
//shooting will make the bullet go where the shooter is pointing and then set it to live

function Bullet(game, x, y) {

}

Bullet.prototype = new Entity();
Bullet.prototype.constructor = Bullet;

Bullet.prototype.update = function() {

}

Bullet.prototype.draw = function(ctx) {
    
}

function BoundingBox(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.left = x;
    this.top = y;
    this.right = this.left + width;
    this.bottom = this.top + height;
}

BoundingBox.prototype.collide = function (oth) {
    if (this.right > oth.left && this.left < oth.right && this.top < oth.bottom && this.bottom > oth.top) return true;
    return false;
}

// the "main" code begins here

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./img/reticle.png");
ASSET_MANAGER.queueDownload("./img/targets.png");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var gameEngine = new GameEngine();
    var bg = new Background(gameEngine);
    var shooter = new Shooter(gameEngine);

    gameEngine.addEntity(bg);
    gameEngine.addEntity(shooter);
 
    gameEngine.init(ctx);
    gameEngine.start();
});
