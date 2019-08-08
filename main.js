//    |
// ---|-------------- using row col coordinates
//    |
//    |
//    |
//    |
//    |

//TODO fix weird grid generation bug
class Player {
  constructor(x, y, direction, height) {
    this.x = x;
    this.y = y;
    this.height = height;
    this.direction = direction;
  }
  changeDirection(step) {
    this.direction = (this.direction + step) % (Math.PI * 2);
  }
  move(step) { //can only move +-forward
    if (map[Math.floor((this.y - step * Math.sin(this.direction)) / GRID_SIZE)][Math.floor((this.x + step * Math.cos(this.direction)) / GRID_SIZE)] === 0) {
      this.x += step * Math.cos(this.direction);
      this.y -= step * Math.sin(this.direction);
    } 
    // else if (map[Math.floor((this.y) / GRID_SIZE)][Math.floor((this.x + step * Math.cos(this.direction)) / GRID_SIZE)] === 0) {
    //   this.x += step * Math.cos(this.direction);
    // } else if (map[Math.floor((this.y - step * Math.sin(this.direction)) / GRID_SIZE)][Math.floor((this.x) / GRID_SIZE)] === 0) {
    //   this.y -= step * Math.sin(this.direction);
    // }
  }
  strafe(step) {
    let perpDir = this.direction + ((step > 0) ? Math.PI / 2 : -1 * Math.PI / 2); //L R
    step = Math.abs(step);
    if (map[Math.floor((this.y - step * Math.sin(perpDir)) / GRID_SIZE)][Math.floor((this.x + step * Math.cos(perpDir)) / GRID_SIZE)] === 0) {
      this.x += step * Math.cos(perpDir);
      this.y -= step * Math.sin(perpDir);
    } 
    // else if (map[Math.floor((this.y) / GRID_SIZE)][Math.floor((this.x + step * Math.cos(perpDir)) / GRID_SIZE)] === 0) {
    //   this.x += step * Math.cos(perpDir);
    // } else if (map[Math.floor((this.y - step * Math.sin(perpDir)) / GRID_SIZE)][Math.floor((this.x) / GRID_SIZE)] === 0) {
    //   this.y -= step * Math.sin(perpDir);
    // }
  }
}
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x+r, y);
  this.arcTo(x+w, y,   x+w, y+h, r);
  this.arcTo(x+w, y+h, x,   y+h, r);
  this.arcTo(x,   y+h, x,   y,   r);
  this.arcTo(x,   y,   x+w, y,   r);
  this.closePath();
  return this;
}; //https://stackoverflow.com/a/7838871/11695068 credit to
const LEFT = 0, W = 1, RIGHT = 2, S = 3; A = 4, D = 5;//used for smooth movement in keydown
//hsl so brightness drop off is on the l paramater
const COLOURS = [null, [0, 100, 50], [30, 100, 50], [60, 100, 50], [120, 100, 50], [240, 100, 50], [270, 100, 50], [330, 100, 50]]; //r y o g b v p

const ROW_SELECTED = -5; const COL_SELECTED = -10;

const GRID_SIZE = 1024; //controls how many pixels a square on the map is 
const FOV = Math.PI / 3;
const WIDTH = 1120; //canvas size
const HEIGHT = 700;
const dTheta = FOV / WIDTH;
const DISTANCE_TO_SCREEN = WIDTH / (2 * Math.tan(FOV / 2)); //used for determining how big walls are relative to position
const SCREEN_CENTER = [WIDTH / 2, HEIGHT / 2];

//the following below deals with the user setting up the environment

let stillTyping = false;
let chosenOrigin = [-1, -1];
function main() {
  let tileSelected = null;
  let table = [];
  
  for (let i = 0; i < 20; i++) { //20 is a an arbritray cap I chose
    table.push([]);
    for (let j = 0; j < 20; j++) {
      table[i].push(0);
    }
  }
  document.getElementById("main").addEventListener("click", function(event) {
    tileSelected = handleClicks(event);
    stillTyping = false; //to allow for clicking off an element
    if (tileSelected === "submit") { //switches to ray caster
      transitionFunction(table, chosenOrigin[0], chosenOrigin[1]);
    }
  });
  document.getElementById("main").addEventListener("keydown", function(event) {
    tileSelected = handleKeystrokes(event, tileSelected, table);
  });
  window.requestAnimationFrame(function repeatedTableDrawing() {
    drawTable(table, tileSelected);
    if (tileSelected !== "submit") window.requestAnimationFrame(repeatedTableDrawing);
  });
}
function handleClicks(event) {
  let canvas = document.getElementById("main");
  let mouseX = event.clientX - parseInt(canvas.getBoundingClientRect().left); //for when there's margins
  let mouseY = event.clientY - parseInt(canvas.getBoundingClientRect().top);
  if (50 <= mouseX && mouseX <= 90 && 2 <= mouseY && mouseY <= 42) return ROW_SELECTED; //hardcoded, from drawTable
  else if (150 <= mouseX && mouseX <= 190 && 2 <= mouseY && mouseY <= 42) return COL_SELECTED;
  else if (225 <= mouseX && mouseX <= 325 && 2 <= mouseY && mouseY <= 42) return "submit";
  else return [Math.floor((mouseY - 45) / (45)), Math.floor((mouseX - 2) / (45))]; //inverse of how to find pixels from i and j in drawTable 
}
function handleKeystrokes(event, tileSelected, table) {
  let keyStroke = event.key;
  if (keyStroke === "Enter") {
    stillTyping = false;
    return null;
  } else if (keyStroke === "o") {
    if (tileSelected && 0 <= tileSelected[0] && tileSelected[0] < table.length && 0 <= tileSelected[1] && tileSelected[1] < table[0].length) {
      chosenOrigin = [tileSelected[0], tileSelected[1]];
      return null;
    }    
  } else if (!Number.isNaN(+keyStroke)) {
    let val = 0;
    if (tileSelected === ROW_SELECTED) {
      if (stillTyping) val = table.length * 10 + +keyStroke; //so you can input n digit numbers
      else val = +keyStroke; //overrides if not directly typing
      stillTyping = true;
      if (val > 20) val = 20;
      while (val !== table.length) {
        if (val > table.length) { //we need more rows
          table.push([]);
          for (let elem of table[0]) table[table.length - 1].push(0);
        } else {
          table.pop();
        }
      }
      return tileSelected;
    } else if (tileSelected === COL_SELECTED) { //same logic as above
      if (stillTyping) val = table[0].length * 10 + +keyStroke;
      else val = +keyStroke;
      stillTyping = true;
      if (val > 20) val = 20;
      while (val !== table[0].length) {
        if (val > table[0].length) {
          for (let elem of table) elem.push(0);
        } else {
          for (let elem of table) elem.pop();
        }
      }
      return tileSelected;
    } else if (0 <= tileSelected[0] && tileSelected[0] < table.length && 0 <= tileSelected[1] && tileSelected[1] < table[0].length) { //same logic as aboce
      if (stillTyping) val = table[tileSelected[0]][tileSelected[1]] * 10 + +keyStroke;
      else val = +keyStroke;
      stillTyping = true;
      if (val >= COLOURS.length) val = COLOURS.length - 1;
      table[tileSelected[0]][tileSelected[1]] = val;
      return tileSelected;
    }
  }
}
function drawTable(table, tileSelected) {
  let canvas = document.getElementById("main");
  let ctx = canvas.getContext("2d");
  ctx.fillStyle = "white"
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = ctx.fillStyle = "black";
  ctx.font = "15px Courier New";
  
  ctx.fillText("Rows:", 0, 24);
  if (tileSelected === ROW_SELECTED) ctx.strokeStyle = ctx.fillStyle = "blue";
  ctx.roundRect(50, 2, 40, 40, 10).stroke();
  ctx.fillText(table.length, 2 + 60, 25);
  ctx.strokeStyle = ctx.fillStyle = "black";
  
  ctx.fillText("Cols:", 100, 24);
  if (tileSelected === COL_SELECTED) ctx.strokeStyle = ctx.fillStyle = "blue";
  ctx.roundRect(150, 2, 40, 40, 10).stroke();
  ctx.fillText((table[0]) ? table[0].length : 0, 2 + 160, 25);
  ctx.strokeStyle = ctx.fillStyle = "black";
  
  ctx.fillStyle = "green";
  ctx.roundRect(225, 2, 100, 40, 10).fill();
  ctx.roundRect(225, 2, 100, 40, 10).stroke();
  ctx.fillStyle = "black";
  ctx.fillText("Render", 250, 24);
  
  for (let i = 0; i < table.length; i++) {
    for (let j = 0; j < table[0].length; j++) {
      if (chosenOrigin[0] === i && chosenOrigin[1] === j) {//they clicked on a non-special tileSelected
        ctx.fillStyle = "green";
        ctx.roundRect(2 + (40 + 5)*j, 45 + (40 + 5)*i, 40, 40, 10).fill();
        ctx.fillStyle = "black";
      } else if (i % 2 === j % 2) { //checkerboard pattern makes it easier on the eyes
        ctx.fillStyle = "lightGray";
        ctx.roundRect(2 + (40 + 5)*j, 45 + (40 + 5)*i, 40, 40, 10).fill();
        ctx.fillStyle = "black";
      }
      if (tileSelected && tileSelected[0] === i && tileSelected[1] === j) ctx.strokeStyle = ctx.fillStyle = "blue";
      ctx.roundRect(2 + (40 + 5)*j, 45 + (40 + 5)*i, 40, 40, 10).stroke();
      ctx.font = (table[i][j] !== 0) ?  "bold 16px Courier New": "15px Courier New"; 
      ctx.fillText(table[i][j], 2 + 17 + (40 + 5)*j, 45 + 23 + (40 + 5)*i);
      ctx.strokeStyle = ctx.fillStyle = "black";
    }
  }
}

let keyDown = [false,false,false,false]; //for smooth movement
let prevPos = [-1, -1, -1]; //to avoid unnecessary redraws

//switches from set up to immersion
function transitionFunction(table, startingRow, startingCol) { 
  //pads with walls
  table.unshift([]); table.push([]); 
  for (let i = 0; i < table[1].length + 2; i++) {
    table[0].push(1);
    table[table.length - 1].push(1);
  }
  for (let i = 1; i < table.length - 1; i++) {
    table[i].unshift(1);
    table[i].push(1);
  }
  
  //so orientationis correct
  let miniMap = [];
  table.forEach(function(row, i) {
    miniMap.push([]);
    row.forEach(function(elem, j) {
      miniMap[i].push(elem);
    });
  });
  table.reverse();
  map = table;
  
  //deletes old canvas, which also removes previous listeners
  document.getElementById("main").outerHTML = "";
  let canvas = document.createElement("canvas");
  canvas.id = "main";
  canvas.width = WIDTH + map[0].length*4;
  canvas.height = HEIGHT;
  canvas.setAttribute("tabindex", "1");
  document.body.appendChild(canvas);
  
  //since we added walls
  startingCol += 1;
  startingRow += 1;
  startingRow = table.length - startingRow - 1; //since we mirrored the map
  if (map[startingRow] && map[startingRow][startingCol] !== 0) { //in case the user was mean and tried to spawn in a wall
    for (let i = 1; i < table.length; i++) {
      let j = 1;
      for (j; j < table[i].length; j++) {
        if (table[i][j] === 0) {
          startingRow = i;
          startingCol = j;
          break;
        }
      }
      if (j !== table[i].length) break;
    }  
  }
  //centers facing east
  let p = new Player((startingCol + .5) * GRID_SIZE, (startingRow + .5) * GRID_SIZE, 0, GRID_SIZE / 2);
  
  canvas.addEventListener("keydown", function(event) {
    if (event.key === "ArrowLeft") keyDown[LEFT] = true;
    else if (event.key === "ArrowRight") keyDown[RIGHT] = true;
    else if(event.key === "w") keyDown[W] = true;
    else if(event.key === "s") keyDown[S] = true;
    else if(event.key === "a") keyDown[A] = true;
    else if(event.key === "d") keyDown[D] = true;
    event.preventDefault();
  });
  canvas.addEventListener("keyup", function(event) {
    if (event.key === "ArrowLeft") keyDown[LEFT] = false;
    else if (event.key === "ArrowRight") keyDown[RIGHT] = false;
    else if(event.key === "w") keyDown[W] = false;
    else if(event.key === "s") keyDown[S] = false;
    else if(event.key === "a") keyDown[A] = false;
    else if(event.key === "d") keyDown[D] = false;
  });
  window.requestAnimationFrame(function repeat() {
    if (p.x !== prevPos[0] || p.y !== prevPos[1] || p.direction !== prevPos[2]) { //avoids unnecessary drawing
      draw(p);
      drawMiniMap(miniMap, p);
      prevPos[0] = p.x; prevPos[1] = p.y; prevPos[2] = p.direction;
    }
    //rotates view
    if (keyDown[LEFT] && !keyDown[RIGHT]) p.changeDirection(2*-2*Math.PI/360);
    else if (!keyDown[LEFT] && keyDown[RIGHT]) p.changeDirection(2*2*Math.PI/360);
    
    //translates player
    if (keyDown[W] && !keyDown[S]) p.move(GRID_SIZE / 20);
    else if (!keyDown[W] && keyDown[S]) p.move(-GRID_SIZE / 20);
    
    if (keyDown[A] && !keyDown[D]) p.strafe(-GRID_SIZE / 20);
    else if (!keyDown[A] && keyDown[D]) p.strafe(GRID_SIZE / 20);
    window.requestAnimationFrame(repeat);
  });
}
function rayDraw(p) {
  let canvas = document.getElementById("main");
  let ctx = canvas.getContext("2d");
  let distances = [];
  //draws a ray for every horizontal pixel
  for (let i = SCREEN_CENTER[1]; i < HEIGHT; i++) {
    let pixelDistance = floorRays(i, p);
    let adjustedDistance = pixelDistance /// Math.cos(rayAngle - p.direction);
    ctx.fillStyle = `hsl(180,100%,${50*(1 + (adjustedDistance / DISTANCE_TO_SCREEN) * .1)}%)`;
    ctx.fillRect(0, i, WIDTH, 1);
    ctx.fillRect(0, 2*SCREEN_CENTER[1] - i, WIDTH, 1);
  }
  for (let rayAngle = p.direction - FOV / 2, steps = 0; steps < WIDTH; rayAngle = (rayAngle + dTheta) % (Math.PI * 2), steps += 1) {
    let retVal = findRay(rayAngle, p); //[distanceFromWall, colourOfWall, sideOfWall]
    let rayHeight = Math.floor((GRID_SIZE * DISTANCE_TO_SCREEN) / retVal[0]); //based on similar triangles
    distances.push(rayHeight + "@" + (rayAngle * 180 / Math.PI));
    if (!retVal[1]) retVal[1] = COLOURS[1];
    //changes colour of wall depending on which side it is on. Creates a primitive shadow effeect
    if (retVal[2] === 0)
      ctx.fillStyle = `hsl(${COLOURS[retVal[1]][0]},${COLOURS[retVal[1]][1]}%,${COLOURS[retVal[1]][2]*(1 - (retVal[0]/DISTANCE_TO_SCREEN) * .08)}%)`; //decrease light as distance increases
    else
      ctx.fillStyle = `hsl(${COLOURS[retVal[1]][0]},${COLOURS[retVal[1]][1]}%,${COLOURS[retVal[1]][2]*(1 - (retVal[0]/DISTANCE_TO_SCREEN) * .08)*0.5}%)`
    ctx.fillRect(steps, SCREEN_CENTER[1] - rayHeight * 0.5, 1, rayHeight);
    /*
    //the commented out portion draws floor rays. It however, lags a lot at the current resolution
    for (let i = SCREEN_CENTER[1] + rayHeight * 0.5 + 1; i < HEIGHT; i++) {
      let pixelDistance = floorRays(i, p);
      let adjustedDistance = pixelDistance /// Math.cos(rayAngle - p.direction);
      ctx.fillStyle = `hsl(180,100%,${50*(1 + (adjustedDistance / DISTANCE_TO_SCREEN) * .1)}%)`;
      ctx.fillRect(steps, i, 1, HEIGHT - i);
    }*/
  }
}

function findRay(rayAngle, p) {
  if (rayAngle < 0) rayAngle += Math.PI * 2;
  //doing horizontal grid line checks first
  let hPoint = [0, 0];
  let colours = [];
  let dy = 0, dx = 0;
  if (0 <= rayAngle && rayAngle < Math.PI) { //going up, y decreases
    hPoint[1] = Math.floor(p.y / GRID_SIZE) * GRID_SIZE - 0.000001; //miniscule amount prevents it from being on the border, yet being too much that it draws the wrong side (i.e. "jumps the wall")
    dy = -1 * GRID_SIZE;
  } else {//going down, y increases
    hPoint[1] = Math.floor(p.y / GRID_SIZE) * GRID_SIZE + GRID_SIZE;
    dy = GRID_SIZE;
  }

  //based on trig
  let diff = Math.abs((p.y - hPoint[1]) / Math.tan(rayAngle));
  if (Math.PI * 0.5 <= rayAngle && rayAngle <= Math.PI * 1.5) { //facing left, x decreases
    hPoint[0] = p.x - diff;
    dx = -1 * Math.abs(GRID_SIZE / Math.tan(rayAngle));
  } else { //going right, x increases
    hPoint[0] = p.x + diff;
    dx = Math.abs(GRID_SIZE / Math.tan(rayAngle));
  }
  
  while (map[Math.trunc(hPoint[1] / GRID_SIZE)] && map[Math.trunc(hPoint[1] / GRID_SIZE)][Math.trunc(hPoint[0] / GRID_SIZE)] === 0) {
    hPoint[1] += dy;
    hPoint[0] += dx;
  }
  //fixes weird colour bug
  (map[Math.trunc(hPoint[1] / GRID_SIZE)]) ? colours.push(map[Math.trunc(hPoint[1] / GRID_SIZE)][Math.trunc(hPoint[0] / GRID_SIZE)]) : colours.push(1);
  
  //vertical lineChecks
  //same logic
  let vPoint = [0, 0];
  dy = dx = 0;
  if (Math.PI * 0.5 <= rayAngle && rayAngle <= Math.PI * 1.5) {
    vPoint[0] = Math.floor(p.x / GRID_SIZE) * GRID_SIZE - 0.000001;
    dx = -1 * GRID_SIZE;
  } else {
    vPoint[0] = Math.floor(p.x / GRID_SIZE) * GRID_SIZE + GRID_SIZE;
    dx = GRID_SIZE;
  }
  
  diff = Math.abs((p.x - vPoint[0]) * Math.tan(rayAngle));
  if (0 <= rayAngle && rayAngle < Math.PI) {
    vPoint[1] = p.y - diff;
    dy = -1 * Math.abs(GRID_SIZE * Math.tan(rayAngle));
  } else {
    vPoint[1] = p.y + diff;
    dy = Math.abs(GRID_SIZE * Math.tan(rayAngle));
  }
  while (map[Math.trunc(vPoint[1] / GRID_SIZE)] && map[Math.trunc(vPoint[1] / GRID_SIZE)][Math.trunc(vPoint[0] / GRID_SIZE)] === 0) {
    vPoint[1] += dy;
    vPoint[0] += dx;
  }
  (map[Math.trunc(vPoint[1] / GRID_SIZE)]) ? colours.push(map[Math.trunc(vPoint[1] / GRID_SIZE)][Math.trunc(vPoint[0] / GRID_SIZE)]) : colours.push(1);
  
  //choses the one it hits first (i.e with which is closer)
  let distances = [Math.sqrt(Math.pow(p.x - hPoint[0], 2) + Math.pow(p.y - hPoint[1], 2)),
  Math.sqrt(Math.pow(p.x - vPoint[0], 2) + Math.pow(p.y - vPoint[1], 2))];
  let index = (Math.min(distances[0], distances[1]) === distances[0]) ? 0 : 1;
  
  //cos term fixes fish-bowl effect
  return [distances[index] * Math.cos(rayAngle - p.direction), colours[index], index]; 
}
function floorRays(pixelHeight, p) {
  let distanceToIntersect = (p.height * DISTANCE_TO_SCREEN) / (SCREEN_CENTER[1] - pixelHeight);
  return distanceToIntersect;
}
function draw(p) {
  let canvas = document.getElementById("main");
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  rayDraw(p);
}
function drawMiniMap(miniMap, p) {
  let canvas = document.getElementById("main");
  let ctx = canvas.getContext("2d");
  ctx.strokeStyle = "black";
  ctx.clearRect(WIDTH, 0, miniMap[0].length * 4, miniMap.length * 4);
  miniMap.forEach(function(row, i) {
    row.forEach(function(elem, j) {
      if(COLOURS[elem]) ctx.fillStyle = `hsl(${COLOURS[elem][0]},${COLOURS[elem][1]}%,${COLOURS[elem][2]}%)`;
      if (elem !== 0) {
        ctx.fillRect(WIDTH + 4*j, 4*i, 4, 4);
        ctx.strokeRect(WIDTH + 4*j, 4*i, 4, 4);
      }  
    });
  });
  ctx.fillStyle = "green";
  ctx.fillRect(WIDTH + (p.x / GRID_SIZE) * 4, miniMap.length*4 - (p.y / GRID_SIZE) *4, 4, 4);
}
main();