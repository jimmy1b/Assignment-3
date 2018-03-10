var bounding_box = false;
var flash = false;
var score = 0;

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
    this.dead = [];
    Entity.call(this, game, 0, 0);
}

Target_Spawner.prototype = new Entity();
Target_Spawner.prototype.constructor = Target_Spawner;

Target_Spawner.prototype.update = function() {
    //if random 0-19 = 0
    //  x = flor(random * (right bounds - something) + something)
    //  y = floor(random * (bottom bounds - something2) + something2)
    //  type = floor(random * 3)
    //  make a target with those coords and add it to the array
    // if (Math.floor(Math.random() * 10) == 0) { //faster spawning for testing
    if (Math.floor(Math.random() * 30) == 0) {
        console.log("new spawn");
        this.targets.push(new Target(this.game, Math.floor(Math.random() * (this.game.ctx.canvas.width - 90 + 75) ),
             Math.floor(Math.random() * (this.game.ctx.canvas.height - 177 + 110) ), Math.floor(Math.random() * 3)));
    }

    if (this.targets[0] && !this.targets[0].live) {
        this.dead.push(this.targets.shift());
    }

    if (this.dead[0] && this.dead[0].dead) this.dead.shift();

    //update and draw for each target in targets[]
    this.targets.forEach(function(target) {
        target.update();
    });

    this.dead.forEach(function(target) {
        target.update();
    });
}

Target_Spawner.prototype.draw = function(ctx) {
    this.targets.forEach(function(target) {
        target.draw(ctx);
    });
    this.dead.forEach(function(target) {
        target.draw(ctx);
    });
    // var i = 0;
    // for (i; i < this.targets.length; i++) {
    //     this.targets[i].draw();
    // }
}

//target object
//var to determine placement and if it is alive

function Target(game, x, y, type) {
    this.live = true;
    this.dead = false;
    // this.animation = new Animation(ASSET_MANAGER.getAsset("./img/RobotUnicorn.png"), 0, 0, 206, 110, 0.02, 30, true, true);
    this.spawnAnim = new Animation(ASSET_MANAGER.getAsset("./img/targets.png"), 0, 0, 90, 171, 0.1, 2, false, false);
    this.idle = new Animation(ASSET_MANAGER.getAsset("./img/targets.png"), (type * 90), 353, 90, 171, 1, 1, true, false);
    this.deathAnim = new Animation(ASSET_MANAGER.getAsset("./img/targets.png"), 0, 171, 90, 171, 0.25, 2, false, false);
    Entity.call(this, game, x, y);
    this.bb = new BoundingBox(this.x - 8, this.y - 8, 16, 16);
}

Target.prototype = new Entity();
Target.prototype.constructor = Target;

Target.prototype.update = function() {
    if (this.deathAnim.isDone()) this.dead = true;
}

Target.prototype.draw = function(ctx) {
    if (this.spawnAnim.isDone()) {
        if (this.live) {
            this.idle.drawFrame(this.game.clockTick, ctx, this.x - 45, this.y - 80, 1);
        } else {
            this.deathAnim.drawFrame(this.game.clockTick, ctx, this.x - 45, this.y - 80, 1);
        }
    } else {
        this.spawnAnim.drawFrame(this.game.clockTick, ctx, this.x - 45, this.y - 80, 1);
    }

    if(bounding_box) {
        this.game.ctx.strokeStyle = "yellow";
        this.game.ctx.strokeRect(this.bb.x, this.bb.y, this.bb.width, this.bb.height);
    }
}

//shooter object
//ai to go to the earliest target that appeared
//MATHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH
//shoots when over the target

function Shooter(game, targetSpawner, bullet) {
    this.anim = new Animation(ASSET_MANAGER.getAsset("./img/reticle.png"), 0, 0, 480, 480, 1, 1, true, false);
    this.dx = 0;
    this.dy = 0;
    this.angle = 0;
    this.speed = 20;
    this.maxSpeed = 20;
    this.target;
    this.spawner = targetSpawner;
    this.bullet = bullet;
    Entity.call(this, game, 700, 440);
    this.bb = new BoundingBox(this.x - 4, this.y - 4, 8, 8);
}

Shooter.prototype = new Entity();
Shooter.prototype.constructor = Shooter;

Shooter.prototype.update = function() {
    if (this.target == null || !this.target.live) {
        if (this.spawner.targets[0] && this.spawner.targets[0].live) {
            this.target = this.spawner.targets[0];
            console.log("new target");
        } else if (this.spawner.targets[1]) {
            this.target = this.spawner.targets[1];
            console.log("new target");
        }
    } else {
        // this.speed = Math.min(this.maxSpeed, 4 * Math.log10(Math.sqrt(Math.pow(this.dx, 2), Math.pow(this.dy, 2))))
        this.x -= this.speed * Math.cos(this.angle);
        this.y -= this.speed * Math.sin(this.angle);
        this.bb = new BoundingBox(this.x - 4, this.y - 4, 8, 8);
        if(this.bb.collide(this.target.bb)) {
            this.bullet.bb = new BoundingBox(this.x - 5, this.y - 5, 10, 10);
            this.bullet.live = true;
            this.target.live = false;
            score++;
        }
    }

    if (this.target != null) {
        this.dx = this.x - this.target.x;
        this.dy = this.y - this.target.y;
        this.angle = Math.atan2(this.dy, this.dx);
        // * 180 / Math.PI;
        if (this.angle < 0) this.angle += 2 * Math.PI;
            // 360;

        // this.x += this.speed * Math.cos(this.angle);
        // this.y += this.speed * Math.sin(this.angle);
    }
}

Shooter.prototype.draw = function(ctx) {
    this.anim.drawFrame(this.game.clockTick, ctx, this.x - 60, this.y - 60, 0.25);
    if(bounding_box) {
        this.game.ctx.strokeStyle = "yellow";
        this.game.ctx.strokeRect(this.bb.x, this.bb.y, this.bb.width, this.bb.height);
    }
}

//bullet object
//only out for a few frames at most
//shown by white screen with black box of where it was shot (throwback to old lightgun games)
//var to determine placement and if it is alive
//shooting will make the bullet go where the shooter is pointing and then set it to live

function Bullet(game, x, y) {
    this.duration = 6;
    this.counter = 0;
    this.live = false;
    this.target;
    this.anim = new Animation(ASSET_MANAGER.getAsset("./img/shot.png"), 0, 0, 420, 420, 1, 1, true, false);
    Entity.call(this, game, x, y);
    this.bb = new BoundingBox(this.x - 5, this.y - 5, 10, 10);
}

Bullet.prototype = new Entity();
Bullet.prototype.constructor = Bullet;

Bullet.prototype.update = function() {
    if (this.live) {
        if (this.counter++ >= this.duration) {
            this.live = false;
            this.counter = 0;
        }
    }
    // Entity.prototype.update.call(this);
}

Bullet.prototype.draw = function(ctx) {
    if (this.live) {
        //draw 
        if (flash) {
            this.game.ctx.fillStyle = "white";
            this.game.ctx.fillRect(0, 0, this.game.ctx.canvas.width, this.game.ctx.canvas.height);
            this.game.ctx.fillStyle = "black";
            this.game.ctx.fillRect(this.bb.x - 10, this.bb.y - 10, this.bb.width + 20, this.bb.height + 20);

            this.live = false;
            this.counter = 0;
        } else {
            this.anim.drawFrame(this.game.clockTick, ctx, this.bb.x - 100, this.bb.y - 100, 0.5);
        }
    }
    // Entity.prototype.draw.call(this);

    if(bounding_box) {
        if (this.live) this.game.ctx.strokeStyle = "red";
        else this.game.ctx.strokeStyle = "yellow";
        this.game.ctx.strokeRect(this.bb.x, this.bb.y, this.bb.width, this.bb.height);
    }
}

function Score(game) {
    Entity.call(this, game, 8, 24);
    // this.game.ctx.font = "15px Arial";
    // this.game.ctx.fillstyle = "black"
    // this.game.ctx.fillText("SCORE: " + score, this.x, this.y);
}

Score.prototype = new Entity();
Score.prototype.constructor = Score;

Score.prototype.update = function() {
    if (this.game.flashtoggle) flash = !flash;
}

Score.prototype.draw = function(ctx) {
    this.game.ctx.font = "20px Arial";
    this.game.ctx.fillstyle = "black"
    this.game.ctx.fillText("SCORE: " + score, this.x, this.y);
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
ASSET_MANAGER.queueDownload("./img/shot.png");


ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var gameEngine = new GameEngine();
    var bg = new Background(gameEngine);
    var t = new Target_Spawner(gameEngine);
    var bullet = new Bullet(gameEngine, 50, 50);
    var shooter = new Shooter(gameEngine, t, bullet);
    var scoree = new Score(gameEngine);
    // var t1 = new Target(gameEngine, 50, 50, 0);
    // var t2 = new Target(gameEngine, 100, 100, 1);
    // var t3 = new Target(gameEngine, 150, 150, 2);


    gameEngine.addEntity(bg);
    gameEngine.addEntity(t);
    // gameEngine.addEntity(t1);
    // gameEngine.addEntity(t2);
    // gameEngine.addEntity(t3);
    if (flash) {
        gameEngine.addEntity(shooter);
        gameEngine.addEntity(bullet);
    } else {
        gameEngine.addEntity(bullet);
        gameEngine.addEntity(shooter);
    }
    gameEngine.addEntity(scoree)
 
    gameEngine.init(ctx);
    gameEngine.start();
});
