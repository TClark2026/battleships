const COL = 13;
const ROW = 13;

const ships = [
    { length: 5, name: "Carrier" },
    { length: 4, name: "Battleship" },
    { length: 3, name: "Cruiser" },
    { length: 3, name: "Submarine" },
    { length: 2, name: "Destroyer" }
]



const friendlyBoard = document.getElementById("friendly-board")
const enemyBoard = document.getElementById("enemy-board")
let myTurn = false;

initGame();

function initGame() {
    createBoard(friendlyBoard)
    createBoard(enemyBoard)
    setOptions(ships)
    startGame();
}

function startGame(){
    placeFriendlyShips();
    placeEnemyShips();
    shoot()
    
}

function shoot(){
    const board = document.getElementById("enemy-board");
    
     const cells = board.children;

    for (const cell of cells) {
        cell.addEventListener("click", () => {
        
        if(cell.classList.contains("ship")){
            cell.id = "hit"
            console.log("hit")
        }else{
            cell.id = "miss"
            console.log("miss")
        }
        
        });
    }
}

function placeEnemyShips(){
    const board = document.getElementById("enemy-board")

    for(i = 0; i < 5; i++){
        const shipLen = Number(ships[i].length);
        let valid = false;
        while(!valid){
        const x = Math.floor(Math.random() * 12) + 1;
        const y = Math.floor(Math.random() * 12) + 1;
        if(x + shipLen - 1 <= 12){
            valid = true;
           for (let i = 0; i < shipLen; i++) {
                    const target = board.querySelector(`[data-x="${x + i}"][data-y="${y}"]`);
                    target.classList.add("ship");
                    
            }
        }
        }
       
    }
}

function placeFriendlyShips() {
  
    const selectedShip = document.getElementById("friendly-select")

    const board = document.getElementById("friendly-board")
    const cells = board.children;

    for (const cell of cells) {
        cell.addEventListener("click", () => {

            const shipLen = Number(selectedShip.value);
            const x = Number(cell.dataset.x);
            const y = Number(cell.dataset.y);


            if (x + shipLen - 1 <= 12) {
                for (let i = 0; i < shipLen; i++) {
                    const target = document.querySelector(`[data-x="${x + i}"][data-y="${y}"]`);
                    target.classList.add("ship");
                    
                }
                selectedShip.remove(selectedShip.selectedIndex)
                if (selectedShip.options.length === 0) {
                selectedShip.remove();
                }

            } else {
                console.log("Out of bounds!");
            }
        });
    }


}

function createBoard(board) {
    let numCounter = 1;
    let letterCounter = 0;
    let letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']
    for (let r = 0; r < ROW; r++) {
        for (let c = 0; c < COL; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            if (r != 0 && c % 13 == 0) {
                cell.innerHTML = numCounter++;
                cell.id = "border"
            }
            if (c != 0 && r % 13 == 0) {
                cell.innerHTML = letters[letterCounter++]
                cell.id = "border"
            }
            if (c == 0 && r == 0) {
                cell.id = "border"
            }
            if (r != 0 && c % 13 != 0 && c != 0 && r % 13 != 0) {
                cell.dataset.x = c;
                cell.dataset.y = r;
            }
            board.appendChild(cell);
        }
    }
}

function setOptions(ships) {
    const selectBox = document.getElementById("friendly-select")
    ships.forEach(ship => {
        const opt = document.createElement("option");
        opt.value = ship.length;
        opt.innerHTML = ship.name;
        selectBox.appendChild(opt)
    });

}

