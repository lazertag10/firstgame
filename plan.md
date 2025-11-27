Here we write what this project is about?

This project is a simple platformer game that is a 2d side scroller.
its a browser based game.


the game uses sprites in assets folder. 
    - background
    - characters   
        - hero
        - enemy_chicken
    - tiles

The hero characteristics
    - can move left, right, jump up 
    - No double jump
    - loses one heart when enemy touches him (ignore repeat touches if they happen closely)
    - hero is knocked back when the enemy touches him

The enemy characteristics
    - chases hero if nearby 
    - can move left, right, and jump
    - moves slightly slower than hero
    - in first level, only one enemy , in second level 2 enemies and so on

world characteristics
    - world has tiles that can be used as floor for hero and enemeis.
    - the tile map for each level is saved in a seperate file which is used to create the level 
    
game characteristics
    - life is shown as 5 hearts at the top right
    - pause button on the top left

controls
    - left, right arrows for left and right movement of hero
    - up arrow for jump
    - down arrow for falling down to bottom level if allowed.

tile characterstics
    - most tiles are normal
    - few tiles are pass through, where the hero can press down arrow and fall down to the bottom level if allowed
    - one power up tile in each level, at some place 
        - the power up can be : 
            - one heart
            - invincibility for 5 seconds
            - speed boost for 10 seconds
            - double jump for rest of the level

