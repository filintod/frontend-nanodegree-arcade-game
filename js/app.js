// TODO: use google closure library that seems to include several methods used here (inherit, rectangle functions) @see https://developers.google.com/closure/library/

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
 * @param {Number} x - X location of sprite
 * @param {Number} y - Y location of sprite
 * @param {String} sprite - URL of image
 * @param {Array} [spriteMapLocation=[0, 0, image.width, image.height]] - Rectangle coordinates of the sprite in the sprite map if given
 * @constructor
 */
var Sprite = function(x, y, sprite, spriteMapLocation) {

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
     * The location of the sprite in the spriteMap image 
     */
    if (spriteMapLocation == undefined){
        this.spriteMapLocation = [0, 0, this.image.width, this.image.height, 1, 1];
        this.width = this.image.width;
        this.height = this.image.height;
    } else {
        this.spriteMapLocation = spriteMapLocation;
        this.width = spriteMapLocation[2];
        this.height = spriteMapLocation[3];
    }

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
    var x1 = Math.min(this.x + this.width, other.x + other.width);

    if (x1 < x0)
        return null;

    var y0 = Math.max(this.y, other.y);
    var y1 = Math.min(this.y + this.height, other.y + other.height);

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
                if (this.alpha[(y - this.y + this.spriteMapLocation[1]) * this.width + (x - this.x) + this.spriteMapLocation[0]] &&
                        other.alpha[(y - other.y + other.spriteMapLocation[1]) * other.width + (x - other.x) + other.spriteMapLocation[0]])
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
 * Checks weather the sprite is visible on the canvas
 * @returns {boolean}
 */
Sprite.prototype.isVisible = function() {
    return ((this.x + this.width) > 0 &&  this.x < CANVAS_WIDTH)
};

/**
 * Renders the sprite onto the canvas
 * @param ctx Canvas Context
 */
Sprite.prototype.render = function(ctx) {
    if (this.isVisible()) {
        ctx.drawImage(this.image, this.spriteMapLocation[0], this.spriteMapLocation[1], this.width, this.height, 
                                  this.x, this.y, this.width, this.height);
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
    Sprite.call(this, x, (y + NUMBER_OF_WATER_ROWS + 1) * BLOCK_HEIGHT, 'images/bug_small.png');
    this.y = this.yOrigin -= this.height >> 1;
    this.reset_location();
};
inherits(Enemy, Sprite);

/**
 * Returns a random value where to start the enemy at
 * @returns {number}
 */
function randomNegativeXOffset(){
    return Math.floor(-10 * BLOCK_WIDTH * Math.random());
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

    if (this.x > CANVAS_WIDTH + this.width) {
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
    Sprite.call(this, 0, 0, sprite);
    this.reset_location();
};
inherits(Charm, Sprite);

/**
 * Overrides the base class reset_location to use the randomNegativeXOffset function
 */
Charm.prototype.reset_location = function(){
    this.x = BLOCK_WIDTH * Math.floor((CANVAS_ROWS - 1) * Math.random()) + 1;
    this.y = BLOCK_HEIGHT * Math.floor((NUMBER_OF_BLOCK_ROWS - 1) * Math.random() + NUMBER_OF_WATER_ROWS);
};


var PLAYER_STEP_DIVISION = 4;
/**
 * Class representing our player
 *
 * @param {Object} spriteMap - sprite map location rectangle [x,y,w,h]
 * @constructor
 */
var Player = function(spriteMap) {
    var middleOfGrassY = BLOCK_HEIGHT * (NUMBER_OF_BLOCK_ROWS + NUMBER_OF_WATER_ROWS + 1);
    var middleOfGrassX = (CANVAS_WIDTH - spriteMap[2])  >> 1;
    Sprite.call(this, middleOfGrassX, middleOfGrassY, 'images/char_sprite_map.png', spriteMap);

    // array of charms collected by this player
    this.myCharms = [];

    // how fast the player can move in the Y direction
    this.yStep = Math.floor(BLOCK_HEIGHT / PLAYER_STEP_DIVISION);

    // how fast the player can move in the X direction
    this.xStep = Math.floor(BLOCK_WIDTH / PLAYER_STEP_DIVISION);

    // weather the avatar can swim (it has collected the diving mask)
    this.canSwim = false;

    // relation between key press and what function to use
    this.moveFunctionKey = {
        37: this.moveLeft,
        38: this.moveUp,
        39: this.moveRight,
        40: this.moveDown
    };

    this.lives = NUMBER_OF_PLAYER_LIVES;
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
 * Called by the loop engine when there is a collision with a bug
 */
Player.prototype.touchedByBug = function(){
    if (this.lives--) {
        this.reset_location();
    } else {
        gameOVER();
    }
};

Player.prototype.touchedCharm = function(){
    var newCharm = charms.pop();
    this.myCharms.push(charms.pop());

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

    if (this.y + this.height < WATER_Y_LIMIT){
        return (!this.canSwim);
    } else {
        return (this.x < 0 ||
                this.x + this.width > CANVAS_WIDTH ||
                this.y + this.height > CANVAS_HEIGHT - EMPTY_AREA_BOT
               );
    }
};

/** DRY function for moving avatar
 *
 * @param k {'x'|'y'} - coordinate to use
 * @param v - step value
 * @param speed - speed to move
 * @private
 */
Player.prototype._checkObstacle = function(k, v, speed){
    v *= speed;
    this[k] += v;
    if (this.isEnteringObstacle()) {
        this[k] -= v << 1;
    }
};

/**
 * Moves Player up
 * @param speed {Number}
 */
Player.prototype.moveUp = function(speed) {
    this.y -= this.yStep * speed;
    if (this.isEnteringObstacle())
        this.reset_location();
};

/**
 * Moves Player down
 * @param speed {Number}
 */
Player.prototype.moveDown = function(speed) {
    return this._checkObstacle('y', this.yStep, speed)
};

/**
 * Moves Player right
 * @param speed {Number}
 */
Player.prototype.moveRight = function(speed) {
    return this._checkObstacle('x', this.xStep, speed)
};

/**
 * Moves Player left
 * @param speed {Number}
 */
Player.prototype.moveLeft = function(speed) {
    return this._checkObstacle('x', - this.xStep, speed)
};

/**
 * Function to represent horizontal left to right movement of a sprite
 * @param speed
 */
var straightFunction = function(speed) {
    this.x += Math.floor(BLOCK_WIDTH * speed);
};

/**
 * Function to represent sinusoidal movement of a sprite
 * @param speed
 */
var sineFunction = function(speed){
    this.dt += speed;
    this.x += Math.floor(BLOCK_WIDTH * speed);
    this.y = BLOCK_MIDDLE_Y + Math.floor((BLOCK_AREA_HEIGHT_HALF - (this.height >> 1))* Math.sin(this.dt) - this.height / 2);
};

/**
 * Factory function to select movement for sprite at random. 10% of the time it will choose sinusoidal and 90% straight
 * @returns {Function}
 */
function getEnemyMovement(sinePercentage){
    if (Math.random() < sinePercentage)
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
        var yLocation = Math.floor(NUMBER_OF_BLOCK_ROWS * Math.random());
        enemies.push(new Enemy(0, yLocation, speed, getEnemyMovement(0.1)));
    }
    return enemies;
}

/**
 * Create the charm and set a timeout to move it in case it has not been collected
 */
function createCharms() {
    charms.push(new Charm(arrayOfCharms[currentCharm]));
}

/**
 * Function to bind onClick to the different avatars that can be used as Players
 */
function addOnClickToCharacters(characters){
    for (var id in characters) {
        if (characters.hasOwnProperty(id)) {
            document.getElementById(id).onclick = (function () {
                player.spriteMapLocation = characters[this.id];
            }).bind({id: id});
        }
    }
}

/*  ***************************************************************************
 *                          GLOBAL VARIABLES
 *  ***************************************************************************
 */

/**
 * Main charactersSpriteMapLocation
 * @type {Sprite}
  */
var allEnemies, player, charms=[];

/**
 * Keeps track of currently pressed keys. Whenever a key is pressed its keycode is inserted here,
 * and when it is released it is deleted from here
 *
 * @type {Object}
 */
var keys={};

/**
 * Number of Enemies to start with. It will increase as we progress
 * @type {number}
 */
var NUMBER_OF_ENEMIES = 10;

/**
 * Number of lives of the player before resetting the game
 * @type {number}
 */
var NUMBER_OF_PLAYER_LIVES = 5;

/**
 * The different avatar images that we can use.  It is a list of avatar HTML ID to image reference
 * @type {string[]}
 */
var charactersSpriteMapLocation = {
    'char_boy':  [0,0,80,81,1,1],
    'char_pink': [0,400,80,81,1,1],
    'char_cat':  [0,600,80,81,1,1]
};

/**
 * Array of Charms to collect, with a timeout value of how long they will be shown in screen before being moved
 * to another area of the play area
 *
 * @type {*[]}
 */
var arrayOfCharms = ['images/Gem Green.png', 60,
                     'images/Gem Orange.png', 50,
                     'images/Gem Blue.png', 40,
                     'images/psd100-Diving-mask.png', 30,
                     'images/Star.png', 20,
                     'images/Heart.png', 10];

var currentCharm = 0;


/** **********************************************************************
 *          Creates the entities after the resources are ready.
 *  **********************************************************************
 */
function createEntities(){
    allEnemies = createEnemies(NUMBER_OF_ENEMIES);
    player = new Player(charactersSpriteMapLocation['char_boy']);
    allCharms = createCharms();

    document.addEventListener('keydown', function(e) {
        // store key value in keydown keyring
        keys[e.keyCode] = true;
        player.handleInput(keys);
    });

    document.addEventListener('keyup', function(e) {
        delete keys[e.keyCode];
    });

    // add onClick behaviors
    addOnClickToCharacters(charactersSpriteMapLocation);
}

Resources.onReady(createEntities);