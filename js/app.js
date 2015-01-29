// TODO: use google closure library that seems to include several methods used here (inherit, rectangle functions) @see https://developers.google.com/closure/library/
// TODO: change how we obtain the sprites so we can get them from the sprite map

/**
 * DRY utility function for inheritance steps. Adding the Object.Create and putting the correct constructor back to the prototype object
 *
 * @param thisClass (class) child class
 * @param baseClass (class) parent class
 */
function inherits(thisClass, baseClass){
    thisClass.prototype = Object.create(baseClass.prototype);
    thisClass.prototype.constructor = thisClass;
}

/**
 * Class for representing Sprite objects
 *
 * @param x {Number} X location of sprite
 * @param y {Number} Y location of sprite
 * @param sprite {String} url of image
 * @constructor
 */
var Sprite = function(x, y, sprite) {
    var img = Resources.get(sprite);
    /**
     * The image object this sprite is using
     * @type {image|*}
     */
    this.image = img.image;

    /**
     * The array of alpha values
     * @type {Uint8Array[]}
     */
    this.alpha = img.alpha;

    /**
     * The horizontal position of the sprite
     * @type {Number}
     */
    this.x = x;

    /**
     * The vertical position of the sprite
     * @type {Number}
     */
    this.y = y;

    /**
     * The default horizontal position of the sprite given at creation
     * @type {Number}
     */
    this.xOrigin = x;

    /**
     * The default vertical position of the sprite given at creation
     * @type {Number}
     */
    this.yOrigin = y;
};

/**
 * Returns the intersecting rectangle between this sprite and another one, or False if they don't intersect.
 *
 * @param other {Sprite} the other sprite we are comparing against
 * @returns {Array|Boolean} rectangle coordinates (x0, y0, x1, y1)
 */
Sprite.prototype.getRectangleIntersectionWith = function(other) {
    var x0 = Math.max(this.x, other.x);
    var x1 = Math.min(this.x + this.image.width, other.x + other.image.width);

    if (x1 < x0)
        return null;

    var y0 = Math.max(this.y, other.y);
    var y1 = Math.min(this.y + this.image.height, other.y + other.image.height);

    if (y1 < y0)
        return null;

    return [x0, y0, x1, y1];
};

/**
 * Checks weather two sprites collides. First check that the rectangles do collides and then check weather the alpha
 * values of the images collide for the rectangles that do collide
 *
 * @param other {Sprite} the other sprite we are checking against
 * @returns {Boolean}
 */
Sprite.prototype.collidesWith = function(other){

    var rectangle = this.getRectangleIntersectionWith(other);

    // if they do intersect, check if the alpha values of the images do touch
    if (rectangle) {
        // check the alpha pixels for the rectangle match the ones for the other sprite
        var x,y;
        for(y = rectangle[1]; y < rectangle[3]; y++){
            for(x = rectangle[0]; x < rectangle[2]; x++){
                if (this.alpha[(y - this.y) * this.image.width + (x - this.x)] &&
                        other.alpha[(y - other.y) * other.image.width + (x - other.x)])
                    return true;
            }
        }
    }
    return false;
};

/**
 * Default behavior for update of sprite is to do nothing
 * @param dt {Number} delta time from last refresh
 */
Sprite.prototype.update = function(dt){
};

/**
 * Checks weather the sprite is visible in the canvas
 * @returns {boolean}
 */
Sprite.prototype.isVisible = function() {
    return ((this.x + this.image.width) > 0 &&  this.x < CANVAS_WIDTH)
};

/**
 * Renders the sprite onto the canvas
 * @param ctx Canvas Context
 */
Sprite.prototype.render = function(ctx) {
    if (this.isVisible()) {
        ctx.drawImage(this.image, this.x, this.y, this.image.width, this.image.height);
    }
};

/**
 * Resets the location of the sprite to the original values given during creation
 */
Sprite.prototype.reset_location = function() {
    this.x = this.xOrigin;
    this.y = this.yOrigin;
};

/**
 * Class representing the enemies we should avoid.
 *
 * @param x {Number} x location of sprite
 * @param y {Number} y location of sprite
 * @param speed {Number} how fast this enemy is
 * @param movement {Function} function that will govern how the sprite will move
 * @constructor
 */
var Enemy = function(x, y, speed, movement) {
    this.move = movement;
    this.speed = speed;
    this.dt = 0;
    Sprite.call(this, x, (y + 2) * Y_OFFSET, 'images/bug_small.png');
    this.reset_location();
};
inherits(Enemy, Sprite);

/**
 * Returns a random value where to start the enemy at
 * @returns {number}
 */
function randomNegativeXOffset(){
    return Math.floor(-10 * X_OFFSET * Math.random());
}

/**
 * Overrides the base class reset_location to use the randomNegativeXOffset function
 */
Enemy.prototype.reset_location = function(){
    Sprite.prototype.reset_location.call(this);
    this.x = Math.floor(randomNegativeXOffset());
    this.dt = 0;
};

/**
 * Update the enemy's position
 * @param dt {Number} time delta between ticks refresh so we can extrapolate how much to move
 */
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.move(this.speed * dt);

    if (this.x > CANVAS_WIDTH + this.image.width) {
        this.reset_location();
    }
};

/**
 * Class Representing Charms to collect
 *
 * @param sprite
 * @constructor
 */
var Charm = function(sprite){
    Sprite.call(this, sprite);
};
inherits(Charm, Sprite);


var PLAYER_STEP_DIVISION = 4;
/**
 * Class representing our player
 *
 * @param sprite
 * @constructor
 */
var Player = function(sprite) {
    Sprite.call(this, (CANVAS_WIDTH - X_OFFSET) / 2, CANVAS_HEIGHT - 4 * Y_OFFSET, sprite);

    // array of charms collected by this player
    this.myCharms = [];

    // how fast the player can move in the Y direction
    this.yStep = Math.floor(Y_OFFSET / PLAYER_STEP_DIVISION);

    // how fast the player can move in the X direction
    this.xStep = Math.floor(X_OFFSET / PLAYER_STEP_DIVISION);

    // relation between key press and what function to use
    this.moveFunctionKey = {
        37: this.moveLeft,
        38: this.moveUp,
        39: this.moveRight,
        40: this.moveDown
    };
};
inherits(Player, Sprite);

/**
 * Move the player depending on what keys are currently being pressed.
 * Player can move in eight directions and two speeds.
 * Keys allowed are the Arrow keys and CTRL. CTRL controls speed (not pressed => normal speed, pressed => double speed)
 *
 * @param keys
 */
Player.prototype.handleInput = function(keys){
    if (this.isAnyOfTheseKeysActionable(keys)) {
        var speed = (keys[17]) ? 2 : 1;
        for (keycode in this.moveFunctionKey) {
            if (keys[keycode]) {
                this.moveFunctionKey[keycode].call(this,speed);
            }
        }
    }
};

/**
 * Checks weather any of the pressed keys is an move key
 * @param keys {Array}
 * @returns {boolean}
 */
Player.prototype.isAnyOfTheseKeysActionable = function(keys){
    for(key in this.moveFunctionKey) {
        if (keys[key])
            return true;
    }
    return false;
};

Player.prototype.isEnteringObstacle = function(){
    return (this.x < 0 || this.y < 0 ||
            this.x + this.image.width > CANVAS_WIDTH ||
            this.y + this.image.height > CANVAS_HEIGHT - Y_OFFSET
    )
};

/**
 * Moves Player up
 * @param speed {Number}
 */
Player.prototype.moveUp = function(speed) {
    this.y -= this.yStep * speed;
    if (this.isEnteringObstacle())
        this.y = 0;
};

/**
 * Moves Player down
 * @param speed {Number}
 */
Player.prototype.moveDown = function(speed) {
    this.y += this.yStep * speed;
    if (this.isEnteringObstacle())
        this.y = Math.floor(Y_OFFSET * (CANVAS_ROWS - 1 - 2 / PLAYER_STEP_DIVISION));
};

/**
 * Moves Player right
 * @param speed {Number}
 */
Player.prototype.moveRight = function(speed) {
    this.x += this.xStep * speed;
    if (this.isEnteringObstacle()) {
        // moves player back to simulate hitting a wall
        this.x = Math.floor(X_OFFSET * (CANVAS_COLUMNS - 1 -  1 / PLAYER_STEP_DIVISION));
    }
};

/**
 * Moves Player left
 * @param speed {Number}
 */
Player.prototype.moveLeft = function(speed) {
    this.x -= this.xStep * speed;
    if (this.isEnteringObstacle()) {
        // moves player back to simulate hitting a wall
        this.x = Math.floor(X_OFFSET / PLAYER_STEP_DIVISION);
    }
};

/**
 * Function
 * @param sprite
 */
Player.prototype.changeSprite = function(sprite){
   var img = Resources.get(sprite);
    /**
     * The image object this sprite is using
     * @type {image|*}
     */
    this.image = img.image;

    /**
     * The array of alpha values
     * @type {Uint8Array[]}
     */
    this.alpha = img.alpha;
};

/**
 * Function to represent horizontal left to right movement of a sprite
 * @param speed
 */
var straightFunction = function(speed) {
    this.x += Math.floor(X_OFFSET * speed);
};

/**
 * Function to represent sinusoidal movement of a sprite
 * @param speed
 */
var sineFunction = function(speed){
    this.dt += speed;
    this.x += Math.floor(X_OFFSET * speed);
    this.y = Math.floor(Y_OFFSET * (Math.sin(this.dt) + 3) - this.image.height / 2);
};

/**
 * Factory function to select movement for sprite at random. 10% of the time it will choose sinusoidal and 90% straight
 * @returns {Function}
 */
function getEnemyMovement(){
    var randomMove = Math.random();
    if (randomMove < 0.1)
        return sineFunction;
    return straightFunction;
}

/**
 * Factory of enemies
 * @param count {Number} number of enemies to create
 * @returns {Array}
 */
function createEnemies(count) {
    var enemies = [];
    for(var i=0; i<count ; i++){
        var speed = 2 * Math.random() + 0.5;
        // bugs can only be on three sections (paved area) as seen from the video
        var yLocation = Math.floor(3 * Math.random());
        enemies.push(new Enemy(0, yLocation, speed, getEnemyMovement()));
    }
    return enemies;
}

// global variables
var allEnemies, player, charms;
var keys={};
var NUMBER_OF_ENEMIES = 3;
var arrayofIdSprites = ['char_boy', 'images/char-boy.png',
                        'char_pink', 'images/char-pink-girl.png',
                        'char_cat', 'images/char-cat-girl.png'];

/**
 * Function to bind onClick to the different avatars that can be use as characters
 */
function addOnClickToCharacters(){
    for(var i = 0; i < arrayofIdSprites.length ; i += 2)
        document.getElementById(arrayofIdSprites[i]).onclick=(function(){
            player.changeSprite(arrayofIdSprites[this.i + 1])
        }).bind({i:i});
}

/**
 * Creates the entities after the resources are ready.
 */
function createEntities(){
    allEnemies = createEnemies(NUMBER_OF_ENEMIES);
    player = new Player('images/char-boy.png');
    charms = [];

    document.addEventListener('keydown', function(e) {
        // store key value in keydown keyring
        keys[e.keyCode] = true;
        player.handleInput(keys);
    });

    document.addEventListener('keyup', function(e) {
        delete keys[e.keyCode];
    });

    // add onClick behaviors
    addOnClickToCharacters();
}

Resources.onReady(createEntities);