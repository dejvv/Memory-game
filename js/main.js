const ptsElement = document.querySelector("#pts"); // element for points
let numberOfPuzzlesButton = false; // if user changed number of puzzles
let gameInProgress = false; // if game is in progress
let colors = []; // colors that are used in for puzzles

// function returns random color
function setColors(n) {
    for(let i = 0; i < n; i++) {
        // color of two puzzles
        let color = getColor();
        // if this color is already 2 times in array
        if(checkArray(colors, color)){
            i--;
            continue;
        }
        // add this color to colors
        colors.push(color);
        colors.push(color);
    }
    // lets mix shuffle colors
    colors = shuffleArray(colors);
}
// function checks if element is in array 2 times and returns true if it is or false otherwise
function checkArray(array, element) {
    let inside = array.indexOf(element);
    inside = array.indexOf(element, inside + 1);
    return inside !== -1;
}

// function shuffle's array
// reference https://bost.ocks.org/mike/shuffle/
function shuffleArray(array) {
    let m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}

// function checks value of html element(textarea,..)
// returns elements value if it's number, otherwise returns false
function checkInput(element) {
    console.log("[Checking element]", element);
    console.log("[Checking element's value]", element.value);

    if (element.value === "") return false; // empty element
    if (isNaN(element.value)) return false; // not a number
    return element.value; // it is a number, so return it
}

// method for computing how many squares can be fit into bigger square(grid)
// reference: https://math.stackexchange.com/a/2570649
function computeSquare(x, y, n) {
    // Compute number of rows and columns, and cell size
    let ratio = x / y;
    let ncols_float = Math.sqrt(n * ratio);
    let nrows_float = n / ncols_float;

    // Find best option filling the whole height
    let nrows1 = Math.ceil(nrows_float);
    let ncols1 = Math.ceil(n / nrows1);
    while (nrows1 * ratio < ncols1) {
        nrows1++;
        ncols1 = Math.ceil(n / nrows1);
    }
    let cell_size1 = y / nrows1;

    // Find best option filling the whole width
    let ncols2 = Math.ceil(ncols_float);
    let nrows2 = Math.ceil(n / ncols2);
    while (ncols2 < nrows2 * ratio) {
        ncols2++;
        nrows2 = Math.ceil(n / ncols2);
    }
    let cell_size2 = x / ncols2;

    // Find the best values
    let nrows, ncols, cell_size;
    if (cell_size1 < cell_size2) {
        nrows = nrows2;
        ncols = ncols2;
        cell_size = cell_size2;
    } else {
        nrows = nrows1;
        ncols = ncols1;
        cell_size = cell_size1;
    }
    //console.log("rows:", nrows, "cols:", ncols, "size:", cell_size);
    return {
        rows: nrows,
        cols: ncols,
        size: cell_size
    }
}

// method returns(when button is pressed) number of puzzles that user wrote in text area
function setNumberOfPuzzles() {
    numberOfPuzzlesButton = true;
    // check value that is in textarea
    let number = checkInput(document.getElementById("puzzles"));
    // no correct input
    if (!number) return false;
    return number;
}

// returns random color
// reference https://www.paulirish.com/2009/random-hex-color-code-snippets/
function getColor() {
    return '#'+Math.floor(Math.random()*16777215).toString(16);
}

// function starts after body is loaded
function start() {
    requestAnimationFrame(() => a.refresh());
    console.log("Started");
}


class Canvas {
    constructor() {
        this.canvas = document.getElementById("memory"); // canvas
        this.context = this.canvas.getContext("2d"); // and its context

        this.puzzles = []; // no puzzles on canvas yes
        this.numberOfPuzzles = 16; // by default, you are solving 16 puzzles, so 16 pairs

        // number of currently selected puzzles;
        this.selectedPuzzles = 0;

        // time for puzzles
        this.time = null;

        // indexes of puzzles that are selected
        this.selectedIndexes = [];

        // score
        this.score = 0;

        // general distance for one square
        this.distance = computeSquare(this.canvas.width, this.canvas.height, this.numberOfPuzzles).size;

        // create new grid and draw it
        this.grid = new Grid(this.context, this.canvas.width, this.canvas.height);

        // create 16 (this.numberOfPuzzles) puzzles
        this.fillPuzzles();

        this.canvas.addEventListener("click", (event) => this.mouseClicked(event));
    }

    // method returns coordinates of mouse
    mouseCord(event) {
        // get radius/2 of a puzzle, its important otherwise it doesn't work
        // puzzle is exactly at x, y coordinates and not at x - radius/2, y - radius/2
        // as its common to draw it, so this offset needs to be subtracted here
        let difference = this.puzzles[0].radius / 2;
        return {
            x: event.pageX - this.canvas.offsetLeft - difference,
            y: event.pageY - this.canvas.offsetTop - difference
        };
    }

    // mouse click
    mouseClicked(event) {
        // simulate wait for 2 seconds, do nothing with click in this interval
        // that works, because time is initialized only when 2 puzzles are selected
        // so i know i should do nothing if two puzzles are selected
        if(this.time !== null && this.time < 120) return;

        // get mouse coordinates
        const {x, y} = this.mouseCord(event);
        // check if any puzzle is in collision with this coordinates
        let collision = this.checkHitted(x, y);
        if(collision >= 0){
            // add index of this puzzle to indexes and increment number of puzzles
            this.selectedIndexes.push(collision);
            this.selectedPuzzles++;
            console.log("[PUZZLES] Number of selected puzzles:", this.selectedPuzzles);
        }
    }

    fillPuzzles() {
        // distances along different axis
        let xDistance = 0;
        let yDistance = 0;

        // set up all the colors needed
        setColors(this.numberOfPuzzles/2);

        // go to (number of puzzles)/2 because in each iteration 2 puzzles are being created
        for(let i = 0; i < this.numberOfPuzzles/2; i++){
            // y distance is at maximum
            if(yDistance === this.canvas.height){
                yDistance = 0;
                xDistance += this.distance;
            }
            // color of puzzle
            let color = colors.pop();
            // add new puzzle, and increment position along y axis for new one
            this.puzzles.push(new Puzzle(this.context, color, xDistance, yDistance, this.distance));
            yDistance += this.distance;

            color = colors.pop();
            this.puzzles.push(new Puzzle(this.context, color, xDistance, yDistance, this.distance));
            yDistance += this.distance;

        }
    }

    // checkMembershipOfPair(element) {
        // let inside = this.puzzles.indexOf(element);
        // // check if another element is present, but ahead of this index
        // inside = this.puzzles.indexOf(element, inside + 1);
        // console.log("inside",inside===-1);
        // if(inside === -1) return false;
        // return true;
    //     let countElement = 0; // represents how many times element with same color is present in array
    //     for(let i = 0; i < this.puzzles.length; i++){
    //         if(this.puzzles[i].color === element)
    //             countElement++;
    //         // if two elements got same color, no more elements should be added
    //         if(countElement === 2) return true;
    //     }
    //     return false;
    // }

    game(){
        // two puzzles are selected, so lets determine whether they match or not
        if(this.puzzles[this.selectedIndexes[0]].color === this.puzzles[this.selectedIndexes[1]].color){
            console.log("**BINGO**");
            // puzzles match so lets remove it
            // first remove bigger index because it might be last index of array which is going to be
            // modified and indexes might not match
            if(this.selectedIndexes[0] > this.selectedIndexes[1]) {
                this.puzzles.splice(this.selectedIndexes[0], 1);
                this.puzzles.splice(this.selectedIndexes[1], 1);
            } else {
                this.puzzles.splice(this.selectedIndexes[1], 1);
                this.puzzles.splice(this.selectedIndexes[0], 1);
            }

            // score should increase
            this.score += 10;
        }
    }

    refresh() {
        // display score
        ptsElement.textContent = this.score;

        // check if there are any elements left
        if(this.puzzles.length === 0) {
            alert("Congratulations!");
            window.location.reload(false);
        }

        // if two puzzles are opened, initialize time to default value(0)
        if(this.time === null && this.selectedPuzzles === 2) this.time = 0;
        // how many iterations passed
        if(this.time !== null) this.time++;

        // two puzzles are selected, so lets determine whether they match or not
        if(this.selectedPuzzles === 2){

            // simulate wait for 2 seconds, 60 calls of this method are made per second
            if(this.time >= 120) {
                console.log("[PUZZLES] Hiding puzzles");
                // do something with this two puzzles

                // change selected puzzles to not selected, can be maximum two, so not need for loop
                this.puzzles[this.selectedIndexes[0]].changeState();
                this.puzzles[this.selectedIndexes[1]].changeState();
                this.game();

                // let's reset this
                this.time = null;
                this.selectedPuzzles = 0;
                this.selectedIndexes = [];
            }
        }

        // clear canvas and draw again
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // draw grid
        this.grid.draw(this.numberOfPuzzles);

        // draw puzzles
        for (let i = 0; i < this.puzzles.length; i++)
            // lets draw it only if its selected
            if(this.puzzles[i].selected)
                this.puzzles[i].draw();


        requestAnimationFrame(() => this.refresh());
    }

    // returns index of puzzle that is clicked by user or false instead
    checkHitted(x, y) {
        // which puzzle is hitted
        for (let i = 0; i < this.puzzles.length; i++) {
            // if puzzle is not already selected, its nonsense to check if
            // it was hit if it is already selected
            if(!this.puzzles[i].selected) {
                let hitted = this.puzzles[i].isHitted(x, y);
                if (hitted) {
                    this.puzzles[i].changeState();
                    return i;
                }
            }
        }
        return -1;
    }
}

class Grid {
    constructor(context, canvasWidth, canvasHeight) {
        this.context = context; // canvas context
        this.canvasWidth = canvasWidth; // canvas width
        this.canvasHeight = canvasHeight;
    }

    draw(numberOfPuzzles) {
        let compute= computeSquare(this.canvasWidth, this.canvasHeight, numberOfPuzzles);
        // check if size is whole number, it its not, canvas cant be divided equally
        if(compute.size % 1 !== 0) {
            return;
        }
        // draw line at each delimiter
        let delimiter = compute.size;
        this.context.beginPath(); // start
        for (let i = 0; i < numberOfPuzzles - 1; i++) {
            // move to location and draw horizontal and vertical line
            this.context.moveTo(delimiter, 0);
            this.context.lineTo(delimiter, this.canvasHeight);
            this.context.moveTo(0, delimiter);
            this.context.lineTo(this.canvasWidth, delimiter);
            // increase delimiter
            delimiter += compute.size;
        }
        this.context.stroke();
    }
}

class Puzzle {
    constructor(context, name, x, y, radius) {
        // this.picture = "./pictures/..."; // coming soon
        this.context = context;
        this.color = name; // name of puzzle, 2 puzzles with same name match
        this.selected = false; // is puzzle selected(opened-clicked by user)
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    // reverse state of puzzle, if selected then not selected
    changeState() {
        this.selected = !this.selected;
    }

    // draws square
    draw() {
        this.context.beginPath();
        this.context.rect(this.x, this.y, this.radius, this.radius);
        this.context.fillStyle = this.color;
        this.context.fill();
    }

    // returns coordinates if this rectangle was clicked or false otherwise
    isHitted(x, y) {
        if (x >= this.x - this.radius / 2 && x <= this.x + this.radius / 2 &&
            y >= this.y - this.radius / 2 && y <= this.y + this.radius / 2) {
            console.log("[PUZZLE]", this.color, "clicked");
            return {
                x: this.x,
                y: this.y
            };
        }
        return false;
    }
}

a = new Canvas();