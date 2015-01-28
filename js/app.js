// TODO: make it more object oriented

// 50 px are empty on the sprites
var BUG_OFFSET = [1, 1, 100, 75];
var BOY_OFFSET = [18, 64, 84, 138];
var BUG_HEIGHT = BUG_OFFSET[3] - BUG_OFFSET[1];

/*
DRY utility function for inheritance steps
 */
function inherits(thisClass, baseClass){
    thisClass.prototype = Object.create(baseClass.prototype);
    thisClass.prototype.constructor = thisClass;
}

var Sprite = function(x, y, sprite, spriteOffset) {
    this.sprite = sprite;
    this.x = x;
    this.y = y;
    this.xOrigin = x;
    this.yOrigin = y;
    this.offset = spriteOffset;
    this.width = spriteOffset[2] - spriteOffset[0];
    this.height = spriteOffset[3] - spriteOffset[1];
};

// TODO: create a better collision detection using alpha pixels collision
Sprite.prototype.collidesWith = function(other){
    if (!((this.x + this.width < other.x)) ||   // too far left
              (this.x > other.x + other.width) ||   // too far right
              (this.y + this.height < other.y) ||   // too far down
              (this.y > other.y + other.height)){
        return this.alphaChannelCollidesWith(other);
    } else {
        return false;
    }
};

/*
Function to find if the sprite is visible on the canvas. We are only checking X dimension
 */
Sprite.prototype.isVisible = function() {
    return ((this.x + this.offset[0] + this.width) > 0 &&  this.x < CANVAS_WIDTH)
};

Sprite.prototype.render = function(ctx) {
    if (this.isVisible()) {
        ctx.drawImage(Resources.get(this.sprite).image, this.offset[0], this.offset[1], this.width, this.height, this.x, this.y, this.width, this.height);
    }
};

Sprite.prototype.reset_location = function() {
    this.x = this.xOrigin;
    this.y = this.yOrigin;
};

/*
Returns a 2-dimensional array of the Alpha values for the pixels define in the rectangle given.
The rectangle values are given in the current space coordinate so we need to translate to the original sprite values
 */
Sprite.prototype.getSpriteAlphaValuesForRectangle = function(rectangle){

};

Sprite.prototype.getRectangleIntersectionWith = function(other) {
    var myArea = [], otherArea = [];
    var x0 = Math.max(this.x, other.x);
    var x1 = Math.min(this.x + this.width, other.x + other.width);

    var y0 = Math.max(this.y, other.y);
    var y1 = Math.min(this.y + this.height, other.y + other.height);
    return [x0, y0, x1, y1];
};

Sprite.prototype.alphaChannelCollidesWith = function(other){
    var rectangle = this.getRectangleIntersectionWith(other);
    var thisAlpha = this.getSpriteAlphaValuesForRectangle(rectangle);
    var otherAlpha = other.getSpriteAlphaValuesForRectangle(rectangle);
    var i,j;
    for(i=0; i<thisAlpha.length; i++){
        for(j=0; j<thisAlpha[0].length; j++){
            if (thisAlpha[i][j] & otherAlpha[i][j]){
                return true;
            }
        }
    }
    return false;
};

/* Enemies our player must avoid
 */
var Enemy = function(y, speed, movement) {
    this.move = movement;
    this.speed = speed;
    this.dt = 0;
    Sprite.call(this, 0, y * Y_OFFSET + 2 * Y_OFFSET - BUG_HEIGHT/2, 'images/bug_small.png', BUG_OFFSET);
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
    Sprite.call(this, X_OFFSET * 2, Y_OFFSET * 5, 'images/' + character_image, BOY_OFFSET);
    this.myCharms = [];
    this.yStep = Math.floor(Y_OFFSET / 8);
    this.xStep = Math.floor(X_OFFSET / 8);
};
inherits(Player, Sprite);


Player.prototype.update = function(dt){
};


Player.prototype.moveUp = function() {
    this.y -= this.yStep;
    if (this.y < 0)
        this.y += this.yStep;
};

Player.prototype.moveDown = function() {
    this.y += this.yStep;
    if (this.y + this.height > CANVAS_HEIGHT)
        this.y -= this.yStep;
};

Player.prototype.moveRight = function() {
    this.x += this.xStep;
    if (this.x + this.width > CANVAS_WIDTH)
        this.x -= this.xStep;
};

Player.prototype.moveLeft = function() {
    this.x -= this.xStep;
    if (this.x < 0)
        this.x += this.xStep;
};

var straightFunction = function(speed) {
    this.x += Math.floor(X_OFFSET * speed);
};

var sineFunction = function(speed){
    this.dt += speed;
    this.x += Math.floor(X_OFFSET * speed);
    this.y = Math.floor(Y_OFFSET * (Math.sin(this.dt) + 3) - BUG_HEIGHT / 2);
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

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = createEnemies(10);
var player = new Player('char-boy.png');
var charms = [];

var movePlayerKey = {
        37: player.moveLeft,
        38: player.moveUp,
        39: player.moveRight,
        40: player.moveDown
    };

document.addEventListener('keydown', function(e) {
    (movePlayerKey[e.keyCode]) ? movePlayerKey[e.keyCode](): 0;
});
