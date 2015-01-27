// TODO: make it more object oriented

// 50 px are empty on the sprites
var SPRITE_Y_OFFSET_EMPTY = 50;
var BUG_OFFSET = [1, 79, 99, 143];
var BOY_OFFSET = [18, 64, 84, 138];
var BUG_HEIGHT = BUG_OFFSET[3] - BUG_OFFSET[1];
var BUG_WIDTH = BUG_OFFSET[2] - BUG_OFFSET[0];

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
    return (!(((this.x + this.offset[2]) < (other.x + other.offset[0])) ||
              ((this.x + this.offset[0]) > (other.x + other.offset[2])) ||
              ((this.y + this.offset[3]) < (other.y + other.offset[1])) ||
              ((this.y + this.offset[1]) > (other.y + other.offset[3]))))
};

/*
Function to find if the sprite is visible on the canvas. We are only checking X dimension
 */
Sprite.prototype.isVisible = function() {
    return ((this.x + this.offset[0] + this.width) > 0 &&  this.x < CANVAS_WIDTH)
};

Sprite.prototype.render = function() {
    if (this.isVisible())
        fgCtx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Sprite.prototype.reset_location = function() {
    this.x = this.xOrigin;
    this.y = this.yOrigin;
};


function getAlphaPixels(image){
    var img_data = ctx.getImageData(0, 0, c.width, c.height);
        for (var i = 0; i < img_data.data.length; i += 4) {
            gray = img_data.data[i] * 0.289 + img_data.data[i+1] * 0.5870 + img_data.data[i+2] * 0.1140;
            img_data.data[i] = gray;
            img_data.data[i + 1] = gray;
            img_data.data[i + 2] = gray;
        }
        fgCtx.putImageData(img_data, 0, 0);
}

/* Enemies our player must avoid

     For this project there is only one enemy type (bugY_OFFSETW+ are hardcoding the y-offset and height of the bug ind
     of cropping the original image.  If there were more than one type we would have to dynamically find this values.
 */
var Enemy = function(y, speed, movement) {
    this.move = movement;
    this.speed = speed;
    this.dt = 0;
    Sprite.call(this, 0, y * Y_OFFSET + BUG_HEIGHT, 'images/enemy-bug.png', BUG_OFFSET);
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
    this.x = randomNegativeXOffset();
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
};
inherits(Player, Sprite);


Player.prototype.update = function(dt){
};


Player.prototype.handleInput = function(key){
};

Player.prototype.moveUp = function() {
    this.y -= Y_OFFSET / 2;
};

Player.prototype.moveDown = function() {
    this.y += Y_OFFSET / 2;
};

Player.prototype.moveRight = function() {
    this.x += X_OFFSET / 2;
};

Player.prototype.moveLeft = function() {
    this.x -= X_OFFSET / 2;
};

var straightFunction = function(speed) {
    this.x += X_OFFSET * speed;
};

var sineFunction = function(speed){
    this.dt += speed;
    this.x += X_OFFSET * speed;
    this.y = Y_OFFSET * (Math.sin(this.dt) + 2) - BUG_HEIGHT / 2;
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

var allowedKeys = {
        37: 'moveLeft',
        38: 'moveUp',
        39: 'moveRight',
        40: 'moveDown'
    };

document.addEventListener('keydown', function(e) {
    if (allowedKeys[e.keyCode])
        player[allowedKeys[e.keyCode]](); //.handleInput(allowedKeys[e.keyCode]);
});
