/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on your player and enemy objects (defined in your app.js).
 *
 * A game engine works by drawing the entire game screen over and over, kind of
 * like a flipbook you may have created as a kid. When your player moves across
 * the screen, it may look like just that image/character is moving or being
 * drawn but that is not the case. What's really happening is the entire "scene"
 * is being drawn over and over, presenting the illusion of animation.
 *
 * This engine is available globally via the Engine variable and it also makes
 * the canvas' context (ctx) object globally available to make writing app.js
 * a little simpler to work with.
 */

var BLOCK_WIDTH = 101;
var BLOCK_HEIGHT = 81;
var EMPTY_AREA_TOP = 50;
var EMPTY_AREA_BOT = 40;
var CANVAS_ROWS = 7;
var CANVAS_COLUMNS = 8;
var CANVAS_WIDTH = BLOCK_WIDTH * CANVAS_COLUMNS;
var CANVAS_HEIGHT = BLOCK_WIDTH * CANVAS_ROWS;
var NUMBER_OF_WATER_ROWS = 2;
var NUMBER_OF_GRASS_ROWS = 1;
var NUMBER_OF_BLOCK_ROWS = CANVAS_ROWS - NUMBER_OF_WATER_ROWS - NUMBER_OF_GRASS_ROWS;
var WATER_Y_LIMIT = NUMBER_OF_WATER_ROWS * BLOCK_HEIGHT + EMPTY_AREA_TOP;
var BLOCK_MIDDLE_Y = WATER_Y_LIMIT + BLOCK_HEIGHT * (NUMBER_OF_BLOCK_ROWS >> 1);
var BLOCK_AREA_HEIGHT_HALF = BLOCK_HEIGHT * (NUMBER_OF_BLOCK_ROWS >> 1);

function createMap() {
    var rowImages = [];

    var appendToRows = function(list){
        for(var i=0; i<list.length ; i+= 2)
            for(var j=0; j<list[i] ; j++)
                rowImages.push(list[i+1]);
    };

    appendToRows([NUMBER_OF_WATER_ROWS, 'images/water-block.png',
                  NUMBER_OF_BLOCK_ROWS, 'images/stone-block.png',
                  NUMBER_OF_GRASS_ROWS, 'images/grass-block.png']);

    return rowImages;
}


var Engine = (function(global) {
    /* Predefine the variables we'll be using within this scope,
     * create the canvas element, grab the 2D context for that canvas
     * set the canvas elements height/width and add it to the DOM.
     */
    var doc = global.document,
        win = global.window,
        bgCanvas = doc.getElementById('bgCanvas'),
        bgCtx = bgCanvas.getContext('2d'),
        fgCanvas = doc.getElementById('fgCanvas'),
        fgCtx = fgCanvas.getContext('2d'),
        lastTime;

    bgCanvas.width = fgCanvas.width = CANVAS_WIDTH;
    bgCanvas.height = fgCanvas.height = CANVAS_HEIGHT;

    /* This function serves as the kickoff point for the game loop itself
     * and handles properly calling the update and render methods.
     */
    function main() {
        /* Get our time delta information which is required if your game
         * requires smooth animation. Because everyone's computer processes
         * instructions at different speeds we need a constant value that
         * would be the same for everyone (regardless of how fast their
         * computer is) - hurray time!
         */
        var now = Date.now(),
            dt = (now - lastTime) / 1000.0;

        /* Call our update/render functions, pass along the time delta to
         * our update function since it may be used for smooth animation.
         */
        update(dt);
        renderEntities(fgCtx);

        /* Set our lastTime variable which is used to determine the time delta
         * for the next time this function is called.
         */
        lastTime = now;

        /* Use the browser's requestAnimationFrame function to call this
         * function again as soon as the browser is able to draw another frame.
         */
        win.requestAnimationFrame(main);
    };

    /* This function does some initial setup that should only occur once,
     * particularly setting the lastTime variable that is required for the
     * game loop.
     */
    function init() {
        reset();
        lastTime = Date.now();
        renderBG();
        main();
    }

    /* This function is called by main (our game loop) and itself calls all
     * of the functions which may need to update entity's data. Based on how
     * you implement your collision detection (when two entities occupy the
     * same space, for instance when your character should die), you may find
     * the need to add an additional function call here. For now, we've left
     * it commented out - you may or may not want to implement this
     * functionality this way (you could just implement collision detection
     * on the entities themselves within your app.js file).
     */
    function update(dt) {
        updateEntities(dt);
        checkCollisions();
    }

    /* This is called by the update function  and loops through all of the
     * objects within your allEnemies array as defined in app.js and calls
     * their update() methods. It will then call the update function for your
     * player object. These update methods should focus purely on updating
     * the data/properties related to  the object. Do your drawing in your
     * render methods.
     */
    function updateEntities(dt) {
        allEnemies.forEach(function (enemy) {
            enemy.update(dt);
        });
        player.update();
    }

    function checkCollisions(){
        // check collision with bug
        if (!allEnemies.some(function(enemy) {
                    if (enemy.isVisible() && enemy.collidesWith(player)) {
                        player.lostLife();
                        return true;
                    }
                })) {
            // check collision with charm
            if (!charms.some(function (charm) {
                        if (charm.isVisible() && charm.collidesWith(player)) {
                            player.grabCharm();
                            return true;
                        }
                    })) {
                // check collision with princess
                if (player.collidesWith(princess)) {
                    if (player.hasHeart) {
                        player.won();
                    } else {
                        player.resetLocation();
                    }
                }
            }
        }
    }

    function renderBG(){
        /* This array holds the relative URL to the image used
         * for that particular row of the game level.
         */
        var rowImages = createMap();

        /* Loop through the number of rows and columns we've defined above
         * and, using the rowImages array, draw the correct image for that
         * portion of the "grid"
         */
        for (var row = 0; row < CANVAS_ROWS; row++) {
            for (var col = 0; col < CANVAS_COLUMNS; col++) {
                /* The drawImage function of the canvas' context element
                 * requires 3 parameters: the image to draw, the x coordinate
                 * to start drawing and the y coordinate to start drawing.
                 * We're using our Resources helpers to refer to our images
                 * so that we get the benefits of caching these images, since
                 * we're using them over and over.
                 */
                bgCtx.drawImage(Resources.get(rowImages[row]).image, col * BLOCK_WIDTH, row * BLOCK_HEIGHT);
            }
        }
    }

    /* This function is called by the main function and is called on each game
     * tick. It's purpose is to then call the render functions you have defined
     * on your enemy and player entities within app.js
     */
    function renderEntities(ctx) {
        /* Loop through all of the objects within the allEnemies array and call
         * the render function you have defined.
         */
        ctx.clearRect ( 0 , 0 , CANVAS_WIDTH, CANVAS_HEIGHT);

        allEnemies.forEach(function(enemy) {
            enemy.render(ctx);
        });

        ctx.drawImage(Resources.get('images/Rock.png').image, princess.x, 0);
        princess.render(ctx);

        player.render(ctx);

        /* Loop through the charms if any */
        charms.forEach(function(charm) {
            charm.render(ctx);
        });
    }

    /* This function does nothing but it could have been a good place to
     * handle game reset states - maybe a new game menu or a game over screen
     * those sorts of things. It's only called once by the init() method.
     */
    function reset() {
        // noop
    }

    /* Go ahead and load all of the images we know we're going to need to
     * draw our game level. Then set init as the callback method, so that when
     * all of these images are properly loaded our game will start.
     */
    Resources.load([
        'images/stone-block.png',
        'images/water-block.png',
        'images/grass-block.png',
        'images/Rock.png',
        'images/bug_small.png',
        'images/char_sprite_map.png',
        'images/char-princess-girl.png',
        'images/Gem Blue.png',
        'images/Gem Green.png',
        'images/Gem Orange.png',
        'images/Heart.png',
        'images/Key.png',
        'images/Star.png',
        'images/psd100-Diving-mask.png'
    ]);
    Resources.onReady(init);

    /* Assign the canvas' context object to the global variable (the window
     * object when run in a browser) so that developer's can use it more easily
     * from within their app.js files.
     */
    global.fgCtx = fgCtx;
})(this);
