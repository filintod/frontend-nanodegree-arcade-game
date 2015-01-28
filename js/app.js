/*
DRY utility function for inheritance steps
 */
function inherits(thisClass, baseClass){
    thisClass.prototype = Object.create(baseClass.prototype);
    thisClass.prototype.constructor = thisClass;
}

var Sprite = function(x, y, sprite) {
    var img = Resources.get(sprite);
    this.image = img.image;
    this.alpha = img.alpha;
    this.x = x;
    this.y = y;
    this.xOrigin = x;
    this.yOrigin = y;
};

/**
 * Finds weather two sprites collides. First check that the rectangles do collides and then check weather the alpha
 * values of the images collide for the rectangles that do collide
 *
 * @param other
 * @returns {*}
 */
Sprite.prototype.collidesWith = function(other){
    var rectangle = this.getRectangleIntersectionWith(other);
    if (rectangle) {
        // check the alpha pixels for the rectangle match the ones for the other sprite
        var x,y;
        for(y=rectangle[1]; y<rectangle[3]; y++){
            for(x=rectangle[0]; x<rectangle[2]; x++){
                if (this.alpha[(y - this.y)*this.image.width + (x - this.x)] && other.alpha[(y - other.y)*other.image.width + (x - other.x)])
                    return true
            }
        }
    }
    return false;
};

Sprite.prototype.update = function(dt){
};


/*
Function to find if the sprite is visible on the canvas. We are only checking X dimension
 */
Sprite.prototype.isVisible = function() {
    return ((this.x + this.image.width) > 0 &&  this.x < CANVAS_WIDTH)
};

Sprite.prototype.render = function(ctx) {
    if (this.isVisible()) {
        ctx.drawImage(this.image, this.x, this.y, this.image.width, this.image.height);
    }
};

Sprite.prototype.reset_location = function() {
    this.x = this.xOrigin;
    this.y = this.yOrigin;
};

Sprite.prototype.getRectangleIntersectionWith = function(other) {
    var x0 = Math.max(this.x, other.x);
    var x1 = Math.min(this.x + this.image.width, other.x + other.image.width);

    if (x1 < x0)
        return false;

    var y0 = Math.max(this.y, other.y);
    var y1 = Math.min(this.y + this.image.height, other.y + other.image.height);

    if (y1 < y0)
        return false;

    return [x0, y0, x1, y1];
};

/* Enemies our player must avoid
 */
var Enemy = function(y, speed, movement) {
    this.move = movement;
    this.speed = speed;
    this.dt = 0;
    Sprite.call(this, 0, (y + 2) * Y_OFFSET, 'images/bug_small.png');
    this.reset_location();
};
inherits(Enemy, Sprite);

/*

 */
function randomNegativeXOffset(){
    return -10 * X_OFFSET * Math.random();
}

Enemy.prototype.reset_location = function(){
    Sprite.prototype.reset_location.call(this);
    this.x = Math.floor(randomNegativeXOffset());
    this.dt = 0;
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.move(this.speed * dt);

    if (this.x > X_OFFSET * 5) {
        this.reset_location();
    }
};


var Charm = function(sprite){
    Sprite.call(this, sprite);
};
inherits(Charm, Sprite);

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

var Player = function(character_image) {
    Sprite.call(this, X_OFFSET * 2, Y_OFFSET * 5, 'images/' + character_image);
    this.myCharms = [];
    this.yStep = Math.floor(Y_OFFSET / 8);
    this.xStep = Math.floor(X_OFFSET / 8);
};
inherits(Player, Sprite);

Player.prototype.move = function(keys){
    var speed = (keys[17]) ? 2 : 1;
    for(keycode in movePlayerKey){
        if (keys[keycode]){
            movePlayerKey[keycode].call(this, speed);
        }
    }
};

Player.prototype.moveUp = function(speed) {
    this.y -= this.yStep * speed;
    if (this.y < 0)
        this.y += this.yStep;
};

Player.prototype.moveDown = function(speed) {
    this.y += this.yStep * speed;
    if (this.y + this.height > CANVAS_HEIGHT)
        this.y -= this.yStep;
};

Player.prototype.moveRight = function(speed) {
    this.x += this.xStep * speed;
    if (this.x + this.image.width > CANVAS_WIDTH)
        this.x -= this.xStep;
};

Player.prototype.moveLeft = function(speed) {
    this.x -= this.xStep * speed;
    if (this.x < 0)
        this.x += this.xStep;
};

var straightFunction = function(speed) {
    this.x += Math.floor(X_OFFSET * speed);
};

var sineFunction = function(speed){
    this.dt += speed;
    this.x += Math.floor(X_OFFSET * speed);
    this.y = Math.floor(Y_OFFSET * (Math.sin(this.dt) + 3) - this.image.height / 2);
};

function getEnemyMovement(){
    var randomMove = Math.random();
    if (randomMove < 0.1)
        return [sineFunction, 1];
    return [straightFunction, Math.floor(3 * Math.random())];
}

function createEnemies(count) {
    var enemies = [];
    for(var i=0; i<count ; i++){
        var speed = 2 * Math.random() + 0.5;
        // bugs can only be on three sections (paved area) as seen from the video
        var moveAndYLocation = getEnemyMovement();
        enemies.push(new Enemy(moveAndYLocation[1], speed, moveAndYLocation[0]));
    }
    return enemies;
}

var allEnemies, player, charms;
var movePlayerKey, keys=[];
var NUMBER_OF_ENEMIES = 10;

/**
 * Creates the entities after the resources have been loaded. Wait one second before re-checking if not ready.
 */
function createEntities(){
    // Now instantiate your objects.
    // Place all enemy objects in an array called allEnemies
    // Place the player object in a variable called player
    allEnemies = createEnemies(NUMBER_OF_ENEMIES);
    player = new Player('char-boy.png');
    charms = [];

    movePlayerKey = {
        37: player.moveLeft,
        38: player.moveUp,
        39: player.moveRight,
        40: player.moveDown
    };

    document.addEventListener('keydown', function(e) {
        keys[e.keyCode] = true;
        (keys[37] || keys[38] || keys[39] || keys[40]) ? player.move(keys) : 0;
    });

    document.addEventListener('keyup', function(e) {
        delete keys[e.keyCode];
    });

}

Resources.onReady(createEntities);
