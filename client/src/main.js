import './styles/main.scss';

const createMatchButton = document.getElementById("create-match");
const joinMatchButton = document.getElementById("join-match");

createMatchButton.addEventListener("click", createMatchMenu)

function createMatchMenu(){
    joinMatchButton.remove();
    createMatchButton.remove();
    spawnGameBoard();
}