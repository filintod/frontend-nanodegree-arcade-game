// Enemies our player must avoid
var Enemy = function(x, y, speed) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';
    this.speed = speed;
    this.y = y * Y_OFFSET;
    this.x = x;
};

function randomNegativeXOffset(){
    return -10 * X_OFFSET * Math.random();
}

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x += dt * X_OFFSET * this.speed;

    if (this.x > X_OFFSET * 5)
        this.x = randomNegativeXOffset();

};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
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
};

Player.prototype.update = function(dt){

};

Player.prototype.render = function(){
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.handleInput = function(key){

} ;

function createEnemies(count) {
    var enemies = [];
    for(var i=0; i<count ; i++){
        var speed = 3 * Math.random() + 0.5;
        // bugs can only be on three sections (paved area) as seen from the video
        var y_location = Math.floor(3 * Math.random()) + 1;
        var x_location = randomNegativeXOffset();
        enemies.push(new Enemy(x_location, y_location, speed));
    }
    return enemies;
}


// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = createEnemies(10);
var player = new Player('char-boy.png');
var charms = [];



// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
