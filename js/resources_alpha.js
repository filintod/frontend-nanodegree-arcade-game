/**
 * Retrieves the alpha values from the image canvas and returns a 2-dim array.
 * Every value is a 32 bit representation of weather the pixel has a alpha value or not. This might not work for semi-
 * transparent objects but this is not the case on this game.
 *
 * @param image - The Image object after it has been loaded
 */
function getAlphaPixels(image){
    var c = document.createElement('canvas');
    c.width = image.width;
    c.height = image.height;
    var ctx = c.getContext('2d');
    ctx.drawImage(image, 0, 0);
    var alphaArray = new Array(c.height);
    var i=0, bitLocation, pixelCol=0, colAlpha=0;
    var img_data = ctx.getImageData(0, 0, c.width, c.height).data;
    var rowDone = false;
    for(var row=0; row < c.height; row++) {
        rowDone = false;
        while (!rowDone) {
            for (bitLocation = 31; bitLocation >= 0; bitLocation--) {
                alphaArray[row][colAlpha] |= (((img_data[i] || img_data[i + 1] || img_data[i + 2]) && img_data[i + 3]) | 0) << bitLocation;
                i += 4;
                pixelCol++;
                if (pixelCol > c.width) {
                    pixelCol = 0;
                    rowDone = true;
                    break;
                }
            }
            if (!rowDone)
                colAlpha++;
        }
    }
}

/* Resources.js
 * This is simple an image loading utility. It eases the process of loading
 * image files so that they can be used within your game. It also includes
 * a simple "caching" layer so it will reuse cached images if you attempt
 * to load the same image multiple times.
 */
(function() {
    var resourceCache = {};
    var loading = [];
    var readyCallbacks = [];

    /* This is the publicly accessible image loading function. It accepts
     * an array of strings pointing to image files or a string for a single
     * image. It will then call our private image loading function accordingly.
     */
    function load(urlOrArr) {
        if(urlOrArr instanceof Array) {
            /* If the developer passed in an array of images
             * loop through each value and call our image
             * loader on that image file
             */
            urlOrArr.forEach(function(url) {
                _load(url);
            });
        } else {
            /* The developer did not pass an array to this function,
             * assume the value is a string and call our image loader
             * directly.
             */
            _load(urlOrArr);
        }
    }

    /* This is our private image loader function, it is
     * called by the public image loader function.
     */
    function _load(url) {
        if(resourceCache[url]) {
            /* If this URL has been previously loaded it will exist within
             * our resourceCache array. Just return that image rather
             * re-loading the image.
             */
            return resourceCache[url];
        } else {
            /* This URL has not been previously loaded and is not present
             * within our cache; we'll need to load this image.
             */
            var img = new Image();
            img.onload = function() {
                /* Once our image has properly loaded, add it to our cache
                 * so that we can simply return this image if the developer
                 * attempts to load this file in the future.
                 */
                resourceCache[url] = {image: img, alphaArray: getAlphaPixels(img)};

                /* Once the image is actually loaded and properly cached,
                 * call all of the onReady() callbacks we have defined.
                 */
                if(isReady()) {
                    readyCallbacks.forEach(function(func) { func(); });
                }
            };

            /* Set the initial cache value to false, this will change when
             * the image's onload event handler is called. Finally, point
             * the images src attribute to the passed in URL.
             */
            resourceCache[url] = false;
            img.src = url;
        }
    }

    /* This is used by developer's to grab references to images they know
     * have been previously loaded. If an image is cached, this functions
     * the same as calling load() on that URL.
     */
    function get(url) {
        return resourceCache[url];
    }

    /* This function determines if all of the images that have been requested
     * for loading have in fact been completed loaded.
     */
    function isReady() {
        var ready = true;
        for(var k in resourceCache) {
            if(resourceCache.hasOwnProperty(k) &&
               !resourceCache[k]) {
                ready = false;
            }
        }
        return ready;
    }

    /* This function will add a function to the callback stack that is called
     * when all requested images are properly loaded.
     */
    function onReady(func) {
        readyCallbacks.push(func);
    }

    /* This object defines the publicly accessible functions available to
     * developers by creating a global Resources object.
     */
    window.Resources = {
        load: load,
        get: get,
        onReady: onReady,
        isReady: isReady
    };
})();