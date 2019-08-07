# Raycaster
A doom-esque raycaster made in JavaScript and Canvas.
See it in action at https://cs.mcgill.ca/~ysarto/projectsDir/raycaster
## Goals
When I first started to learn how to use the `canvas` element, on the resource I was using to learn (MDN webdocs), I saw that they [made a raycaster](https://mdn.github.io/canvas-raycaster/), and thought to myself, "that's pretty cool". I also thought it looked kind of bad. As a result, when I got better at using JavaScript and the `canvas` element, I decided to make it and improve upon it. 
Many thanks to the classic [F. Permadi's raycasting tutorial](https://permadi.com/1996/05/ray-casting-tutorial-table-of-contents/). My goals with this project were the following:
- applying my 10th grade trig knowledge. Thankfully I didn't forget it all :)
- creating a maze that can be user-navigated
- simulating shadows (albeit in a very basic manner)
- allowing users to generate their own maze, complete with colour
## On what can be improved
This was a very barebones implementation of a technique upon which can be vastly improved. As such, there are many additions that can be made such as, in order of my own desire of implementating:
- strafing
- a live-updated map
- improved floor casting (My current implementation assumes the viewing area to be a rectangle, which is of course false. However, in my code, I commented out an attempt that would work, but at the resolution at which I wish to run it, it is much too slow)
- sprites
- variable wall heights
- more indication that a human is being controlled (i.e. a hand à la FPS)

Bugs I have identified:
- there's a fix I have to fix rays being coloured the wrong side colour from a far (basically checking if it's monotonic with its neighbours and of a different side) However, at close distances to the wall, this doesn't work because the wrong ray colours are more than one long. I'm pretty sure this can be fixed by continuing building the queue while it is monotonic, and when it stops, go back and colour everything the correct way, or do horizontal and vertical grid line checks simultaneously.
