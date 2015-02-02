#Frontend Nanodegree - Arcade Game

This is a forked of the Udacity Arcade Game in pursuing of the Front End Nanodegree.

I have made some modifications/improvements to original js files:

*engine.js*
* Added a create map function to create the background map.
* Split the context into background (never changes) and foreground context to speed up rendering

*resources.js*
* Change the object resourceCache so that it will contain the image data and the alpha data of the image. This was done
so collisions could be detected by alpha values of the sprites as I noted that the rectangle collision detection was too
coarse for our avatars.

The index.html file contains elements to show avatars that can be chosen and updates the values of the lives left and
what charms have been collected so far.

## Objective of the Game:

* You should try to rescue the princess from her rock island.  But you cannot swim, so you will have to grabbed the
charms that will appear on the blocks while avoiding the bugs.  The bugs will increase in speed and quantity the more
charms you grabbed.  There are two special charms, the diving mask that will let you swim, and the heart.
Without a heart you cannot rescue the princess.
* The player will have 5 lives that will be lost every time it touches any bug or when entering the water without a
diving mask. Whenever it dies it goes to the original location.
* If the player tries to rescue the princess without a heart it will be sent to its original location.

## How to control the player:

* The game uses the arrow keys to move the player.
* More than one key can be pressed at the same time making it possible to move diagonally.
* There is also a speed-up of 2X when pressing the CTRL key in addition to the arrow keys.

## How to select an avatar:

* Just click on any of the avatar images on the left pane.
* You can change the avatar during play.

