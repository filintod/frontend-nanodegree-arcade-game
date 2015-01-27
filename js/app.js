// 50 px are empty on the sprites
var SPRITE_Y_OFFSET_EMPTY = 50;
var BUG_OFFSET = [1, 79, 99, 143];
var BOY_OFFSET = [18, 64, 84, 138];
var BUG_HEIGHT = BUG_OFFSET[3] - BUG_OFFSET[1];
var BUG_WIDTH = BUG_OFFSET[2] - BUG_OFFSET[0];

/* Enemies our player must avoid

     For this project there is only one enemy type (bugY_OFFSETW+ are hardcoding the y-offset and height of the bug ind
     of cropping the original image.  If there were more than one type we would have to dynamically find this values.
 */
var Enemy = function(x, y, speed, movement) {


    this.sprite = 'images/enemy-bug.png';
    this.move = movement;
    this.speed = speed;
    this.dt = 0;
    this.y = y * Y_OFFSET + BUG_HEIGHT;
    this.originalY = this.y;
    this.x = x;
    this.offset = BUG_OFFSET;
};

/*

 */
function randomNegativeXOffset(){
    return -10 * X_OFFSET * Math.random();
}

Enemy.prototype.collidesWith = function(other){
    if (((this.x + this.offset[2]) < (other.x + other.offset[0])) ||
        ((this.x + this.offset[0]) > (other.x + other.offset[2])) ||
        ((this.y + this.offset[3]) < (other.y + other.offset[1])) ||
        ((this.y + this.offset[1]) > (other.y + other.offset[3]))) {

        return false;
    }
    return true;
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.move(this.speed * dt);

    if (this.x > X_OFFSET * 5) {
        this.x = randomNegativeXOffset();
        this.y = this.originalY;
        this.dt = 0;
    }
};

Enemy.prototype.isVisible = function() {
    return ((this.x + BUG_WIDTH) > 0 &&  this.x < CANVAS_WIDTH)
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    if (this.isVisible())
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

var Charm = function(sprite){
    this.sprite = sprite;
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

var Player = function(character_image) {
    this.sprite = 'images/' + character_image;
    this.myCharms = [];
    this.reset_location();
    this.offset = BOY_OFFSET;
};

Player.prototype.reset_location = function() {
    this.x = X_OFFSET * 2;
    this.y = Y_OFFSET * 5;
};

Player.prototype.update = function(dt){
};

Player.prototype.render = function(){
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
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
        var x_location = randomNegativeXOffset();
        var moveAndYLocation = getEnemyMovement();

        enemies.push(new Enemy(x_location, moveAndYLocation[1], speed, moveAndYLocation[0]));
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