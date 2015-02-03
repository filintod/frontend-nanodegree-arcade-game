// TODO: use google closure library that seems to include several methods used here (inherit, rectangle functions) @see https://developers.google.com/closure/library/

var isGameOver = false;

/**
 * DRY function to draw fill and stroke text
 * @param txt
 * @param x
 * @param y
 */
function drawTextWhiteBlack(txt, x, y){
    fgCtx.fillText(txt, x, y);
    fgCtx.strokeText(txt, x, y);
}

/**
 * DRY function to write message on screen and stop the game (isGameOver = True). For some reason I need a timeout before calling this. Need to check why...
 * @param message
 */
function showMessageAfterLostWin(message){
    fgCtx.font = "80pt 'Press Start 2P'";
    fgCtx.strokeStyle = "black";
    fgCtx.fillStyle = "white";
    var words = message.split(' ');
    var xLoc = (CANVAS_WIDTH - fgCtx.measureText(words[1]).width) >> 1;
    drawTextWhiteBlack(words[0], xLoc, (CANVAS_HEIGHT >> 1) - 100);
    drawTextWhiteBlack(words[1], xLoc, (CANVAS_HEIGHT >> 1) + 100);
    fgCtx.font = "20pt 'Press Start 2P'";
    drawTextWhiteBlack('Press R to restart', xLoc, (CANVAS_HEIGHT >> 1) + 200);
}

/**
 * Shows Game over message on screen
 */
function gameOver(){
    isGameOver = true;
    setTimeout(function(){showMessageAfterLostWin('Game Over!'); }, 100);
}

/**
 * Player got princess with Heart
 */
function playerWon(){
    isGameOver = true;
    setTimeout(function(){showMessageAfterLostWin('You WON!'); }, 100);
    showMessageAfterLostWin('You WON!');
}

/**
 * Restart the game
 */
function restartGame(){
    player.initPlayer();
    princess.resetLocation();
    createEnemiesAndCharms();
    isGameOver = false;
}

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
Sprite.prototype.resetLocation = function() {
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
    this.resetLocation();

    /**
     * Pre-calculation of height of sprite that might be use in the sinusoidal movement
     * @type {Number}
     */
    this.height_half = this.height >> 1;

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
 * Overrides the base class resetLocation to use the randomNegativeXOffset function
 */
Enemy.prototype.resetLocation = function(){
    Sprite.prototype.resetLocation.call(this);
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
        this.resetLocation();
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
    this.resetLocation();
    this.spriteURL = sprite;
};
inherits(Charm, Sprite);

/**
 * Overrides the base class resetLocation to use the randomNegativeXOffset function
 */
Charm.prototype.resetLocation = function(){
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

    // number of lives currently
    this.lives = NUMBER_OF_PLAYER_LIVES;

    // true after grabbing heart charm. Without the heart it cannot grab the princess
    this.hasHeart = false;
    this.initPlayer();
};
inherits(Player, Sprite);


/**
 * Resets player parameters to its original values.
 */
Player.prototype.initPlayer = function(){
    var charmHTML = document.getElementById('charms');
    charmHTML.innerHTML = "";
    this.myCharms = [];
    this.resetLocation();
    this.updateLives();
    this.lives = NUMBER_OF_PLAYER_LIVES;
    this.hasHeart = false;
    this.canSwim = false;
};

/**
 * Move the player depending on what keys are currently being pressed.
 * Player can move in eight directions and two speeds.
 * Keys allowed are the Arrow keys and CTRL. CTRL controls speed (not pressed => normal speed, pressed => double speed)
 *
 * @param keys
 */
Player.prototype.handleInput = function(keys){
    if (!isGameOver && this.isAnyOfTheseKeysActionable(keys)) {
        // if CTRL is pressed speed up the player
        var speed = (keys[17]) ? 2 : 1;

        for (keycode in this.moveFunctionKey) {
            if (keys[keycode]) {
                this.moveFunctionKey[keycode].call(this,speed);
            }
        }
    }
};

/**
 * Updates the number of lives on the screen
 */
Player.prototype.updateLives = function(){
    document.getElementById('counter').innerHTML = this.lives;
};

/**
 * Execute losing a life on the player. If lives count is zero the game is over, if not we just update the counter and send
 * the player to the original location
 */
Player.prototype.lostLife = function(){
    this.lives -= 1;
    this.updateLives();
    if (this.lives > 0) {
        this.resetLocation();
    } else {
        gameOver();
    }
};


/**
 * Appends img tag with the URL of the charm we just grabbed to the chams HTML div.
 * Note: we are not using jQuery that would make this step much simpler looking.
 *
 * @param {String} charmURL - the URL of the charm we got
 */
Player.prototype._appendCharmImage = function(charmURL){
    var charmHTML = document.getElementById('charms');
    var imgNode = document.createElement('img');
    imgNode.src = charmURL;
    imgNode.className = "charm-image";
    imgNode.height = "100";
    imgNode.width = "70";
    charmHTML.appendChild(imgNode);
};


/**
 * Called by the loop engine to check for collisions with charms. If the charm is a diving mask the player will be able to swim
 * in the water, if the charm is the heart the player will be able to rescue the princess (no heart no princess)
 */

Player.prototype.grabCharm = function(){
    var newCharm = charms.pop();
    this.myCharms.push(newCharm);
    this._appendCharmImage(newCharm.spriteURL);
    createEnemies(NUMBER_OF_ENEMIES);
    createCharms();
    if (newCharm.spriteURL == 'images/psd100-Diving-mask.png'){
        this.canSwim = true;
    } else {
        if (newCharm.spriteURL == 'images/Heart.png'){
            this.hasHeart = true;
        }
    }
};

/**
 * Checks weather any of the pressed keys is a move key
 * @param keys {Array}
 * @returns {boolean}
 */
Player.prototype.isAnyOfTheseKeysActionable = function(keys){
    for(var k in this.moveFunctionKey){
        if (keys[k])
            return true;
    }
    return false;
};

/**
 * Checks weather the Player is entering and obstacle area (bottom and side walls and the water on top)
 * @param {boolean} [checkWaterLimit=false] - flag to indicate we want to check water limit like moving up
 * @returns {boolean}
 */
Player.prototype.isEnteringObstacle = function(checkWaterLimit){
    // default value
    if (checkWaterLimit === undefined)
        checkWaterLimit = false;

    if (checkWaterLimit && this.y + this.height < WATER_Y_LIMIT){
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
Player.prototype._moveIfNoObstacle = function(k, v, speed){
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
    if (this.isEnteringObstacle(true)) {
        this.lostLife();
    }
};

/**
 * Moves Player down
 * @param speed {Number}
 */
Player.prototype.moveDown = function(speed) {
    return this._moveIfNoObstacle('y', this.yStep, speed)
};

/**
 * Moves Player right
 * @param speed {Number}
 */
Player.prototype.moveRight = function(speed) {
    return this._moveIfNoObstacle('x', this.xStep, speed)
};

/**
 * Moves Player left
 * @param speed {Number}
 */
Player.prototype.moveLeft = function(speed) {
    return this._moveIfNoObstacle('x', - this.xStep, speed)
};


/**
 * Class to represent a Princess
 * @constructor
 */
var Princess = function(){
    Sprite.call(this, this.getX(), 0, 'images/char-princess-girl.png');
};
inherits(Princess, Sprite);

/**
 * Returns the location where to put the princess at
 * @returns {number}
 */
Princess.prototype.getX = function(){
    return Math.floor(CANVAS_COLUMNS * Math.random()) * BLOCK_WIDTH;
};

/**
 * Overrides the base class resetLocation to use the getX function
 */
Princess.prototype.resetLocation = function(){
    Sprite.prototype.resetLocation.call(this);
    this.x = this.getX();
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
    this.y = BLOCK_MIDDLE_Y + Math.floor((BLOCK_AREA_HEIGHT_HALF - this.height_half) * Math.sin(this.dt) - this.height_half);
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
    enemiesMinSpeed += 0.3;
    enemiesSinePercentage += 0.1;
    for(var i=0; i<count ; i++){
        var speed = enemiesMinSpeed * Math.random() + 0.5;
        // bugs can only be on three sections (paved area) as seen from the video
        var yLocation = Math.floor(NUMBER_OF_BLOCK_ROWS * Math.random());
        allEnemies.push(new Enemy(0, yLocation, speed, getEnemyMovement(enemiesSinePercentage)));
    }
}

/**
 * Create the charm and set a timeout to move it in case it has not been collected
 */
function createCharms() {
    if (currentCharm < arrayOfCharms.length) {
        window.setTimeout(function() {
            if (!isGameOver) {
                charms.push(new Charm(arrayOfCharms[currentCharm]));
                currentCharm += 2;
            }
        }, 1000);
    }
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
 * Player and Princess
 * @type {Sprite}
 *
 */
var player, princess;

/**
 * Array of Enemies and Charms
 * @type {Array}
 */
var allEnemies=[], charms=[];

/**
 * Starting values for the Enemies speed and what percentage of the bugs will have sinusoidal movement
 * @type {number}
 */
var enemiesMinSpeed, enemiesSinePercentage;

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
var NUMBER_OF_ENEMIES = 3;

/**
 * Number of lives of the player before resetting the game
 * @type {number}
 */
var NUMBER_OF_PLAYER_LIVES = 5;

/**
 * The different avatar images that we can use.  It is a list of avatar HTML ID to image reference and
 * its location in the sprite map
 *
 * @type {object}
 */
var charactersSpriteMapLocation = {
    'char_boy':  [0,0,80,81,1,1],
    'char_pink': [0,400,80,81,1,1],
    'char_cat':  [0,600,80,81,1,1]
};

// TODO: implement the moving charm timeout, or put a trigger on the page to turn it on/off
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

/**
 * Keeps track of the current charm index that is shown in the screen that has not been grabbed yet
 * @type {number}
 */
var currentCharm;


/** **********************************************************************
 *          Creates the entities after the resources are ready.
 *  **********************************************************************
 */


/**
 * Creates enemies and charms every time the game is restarted
 */
function createEnemiesAndCharms() {
    allEnemies = [];
    charms = [];
    enemiesMinSpeed = 2;
    enemiesSinePercentage = 0.05;
    currentCharm = 0;
    keys = {};

    createEnemies(NUMBER_OF_ENEMIES);
    createCharms();

}

/**
 * Creates the player and the princess only once
 */
function createEntities(){
    player = new Player(charactersSpriteMapLocation['char_boy']);
    princess = new Princess();
    createEnemiesAndCharms();
}

/**
 * Add key event listeners to player and to avatar selectors
 */
function addEventListeners(){
    // add keydown event listener. Add key press to array of keys pressed at the moment
    document.addEventListener('keydown', function(e) {
        // store key value in keydown keyring
        if (e.keyCode ==  82){
            restartGame();
        } else {
            if (!isGameOver) {
                keys[e.keyCode] = true;
                player.handleInput(keys);
            }
        }
    });

    // add keyup event listener. Remove key from list of keys pressed at the moment
    document.addEventListener('keyup', function(e) {
        delete keys[e.keyCode];
    });

    // add onClick behaviors for the avatars so we can switch avatars.
    addOnClickToCharacters(charactersSpriteMapLocation);
}

// call the creation of entities after all resources have been loaded
Resources.onReady(createEntities);
Resources.onReady(addEventListeners);