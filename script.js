// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');

// --- Player Movement Logic ---
// Player starts at cell-1-4 (row 1, col 4)
let playerPosition = { row: 1, col: 6 };
let visitedCheckpoints = {};
let gameEnded = false;

// Helper to get cell element by row/col
function getCell(row, col) {
  return document.getElementById(`cell-${row}-${col}`);
}

// Place player on the board
function drawPlayer() {
  // Remove any existing player
  document.querySelectorAll('.player').forEach(el => el.remove());
  const cell = getCell(playerPosition.row, playerPosition.col);
  const playerDiv = document.createElement('div');
  playerDiv.className = 'player';
  playerDiv.textContent = '🚶';
  playerDiv.style.fontSize = '2em';
  playerDiv.style.textAlign = 'center';
  cell.appendChild(playerDiv);
}

// Draw initial player
drawPlayer();

// Helper to check if a cell is a bush
function isBush(row, col) {
  const cell = getCell(row, col);
  return cell && cell.classList.contains('bush');
}

// Helper to check if a cell is a checkpoint
function isCheckpoint(row, col) {
  const cell = getCell(row, col);
  return cell && cell.classList.contains('checkpoint');
}

// Helper to check if a cell is the goal
function isGoal(row, col) {
  const cell = getCell(row, col);
  return cell && cell.classList.contains('goal');
}

// Helper to leave a trail
function leaveTrail(row, col) {
  const cell = getCell(row, col);
  // Only leave trail if not bush, checkpoint, or goal
  if (!cell.classList.contains('bush') && !cell.classList.contains('checkpoint') && !cell.classList.contains('goal')) {
    cell.style.backgroundColor = '#b3e0ff'; // light blue
    // Add a water droplet emoji as trail
    const trail = document.createElement('div');
    trail.textContent = '💧';
    trail.style.fontSize = '1.5em';
    cell.appendChild(trail);
  }
}

// Move player if possible
function movePlayer(deltaRow, deltaCol) {
  if (gameEnded) return;
  const newRow = playerPosition.row + deltaRow;
  const newCol = playerPosition.col + deltaCol;
  // Check bounds
  if (newRow < 1 || newRow > 6 || newCol < 1 || newCol > 6) return;
  // Check bush
  if (isBush(newRow, newCol)) return;
  // Leave trail at current position
  leaveTrail(playerPosition.row, playerPosition.col);
  // Move player
  playerPosition = { row: newRow, col: newCol };
  drawPlayer();
  // Check for checkpoint
  if (isCheckpoint(newRow, newCol)) {
    const key = `${newRow}-${newCol}`;
    if (!visitedCheckpoints[key]) {
      visitedCheckpoints[key] = true;
      showVictoryAnimation(newRow, newCol);
      increaseScore();
    }
  }
  // Check for goal
  if (isGoal(newRow, newCol)) {
    endGame();
  }
}

// Keyboard controls
document.addEventListener('keydown', function(e) {
  if (gameEnded) return;
  if (e.key === 'ArrowUp') movePlayer(-1, 0);
  if (e.key === 'ArrowDown') movePlayer(1, 0);
  if (e.key === 'ArrowLeft') movePlayer(0, -1);
  if (e.key === 'ArrowRight') movePlayer(0, 1);
});

// Touch/swipe controls for mobile
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', function(e) {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
});
document.addEventListener('touchend', function(e) {
  if (gameEnded) return;
  if (e.changedTouches.length === 1) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) movePlayer(0, 1); // right
      else if (dx < -30) movePlayer(0, -1); // left
    } else {
      if (dy > 30) movePlayer(1, 0); // down
      else if (dy < -30) movePlayer(-1, 0); // up
    }
  }
});

// Show victory animation at checkpoint
function showVictoryAnimation(row, col) {
  const cell = getCell(row, col);
  cell.style.transition = 'box-shadow 0.5s';
  cell.style.boxShadow = '0 0 20px 10px gold';
  setTimeout(() => {
    cell.style.boxShadow = '';
  }, 700);
}

// End game and show final screen
function endGame() {
  if (gameEnded) return; // Prevent double end
  gameEnded = true;
  if (typeof timerIntervalGlobal !== 'undefined') {
    clearInterval(timerIntervalGlobal);
  }

  // Hide the gameboard
  document.getElementById('gameboard').style.display = 'none';

  // Set modal content
  document.getElementById('modalTitle').innerText = 'Congratulations!';
  document.getElementById('modalBody').innerHTML = `
    <p>You reached the goal! 🎉</p>
    <p>Score: <b>${score}</b></p>
    <p>Time left: <b>${timer}</b> seconds</p>
  `;

  // Show the modal using Bootstrap's JS API
  const endModal = new bootstrap.Modal(document.getElementById('endGameModal'));
  endModal.show();
}

let score = 0;
let timer = 60; // Set timer to 60 seconds

const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');

scoreDisplay.textContent = score;
timerDisplay.textContent = timer; 


function bush() {
  const bushCells = document.getElementsByClassName('bush'); // returns a collection

  for (let i = 0; i < bushCells.length; i++) {
    const cell = bushCells[i];

    cell.style.backgroundColor = 'lightgreen';
    cell.style.width = '100%';

    const bushElement = document.createElement('div');
    bushElement.textContent = '🌿'; // or use an image
    bushElement.style.fontSize = '2em';

    cell.appendChild(bushElement);
  }
}
bush();

function checkpoint() {
  const checkpointCells = document.getElementsByClassName('checkpoint'); // returns a collection

  for (let i = 0; i < checkpointCells.length; i++) {
    const cell = checkpointCells[i];

    cell.style.backgroundColor = 'yellow';
    cell.style.width = '100%';

    const checkpointElement = document.createElement('div');
    checkpointElement.textContent = '🏁';
    checkpointElement.style.fontSize = '2em';
    
    cell.appendChild(checkpointElement);
  } 
}
checkpoint();

function goal() {
  const goalCells = document.getElementsByClassName('goal'); // returns a collection

  for (let i = 0; i < goalCells.length; i++) {
    const cell = goalCells[i];

    cell.style.backgroundColor = 'orange';
    cell.style.width = '100%';

    const goalElement = document.createElement('div');
    goalElement.textContent = '🎯';
    goalElement.style.fontSize = '2em';
    
    cell.appendChild(goalElement);
  } 
}
goal();

// Timer countdown function
let timerIntervalGlobal;
function startTimer() {
  timerIntervalGlobal = setInterval(() => {
    if (timer > 0) {
      timer--;
      timerDisplay.textContent = timer;
    } else {
      clearInterval(timerIntervalGlobal);
      if (!gameEnded) {
        gameEnded = true;
        document.getElementById('gameboard').style.display = 'none';
        document.getElementById('modalTitle').innerText = 'Time is up!';
        document.getElementById('modalBody').innerHTML = `<p>Game over.</p><p>Score: <b>${score}</b></p>`;
        const endModal = new bootstrap.Modal(document.getElementById('endGameModal'));
        endModal.show();
      }
    }
  }, 1000); // Update every second
}

// Start the timer when the game begins
startTimer();
// Function to increase score
function increaseScore() {
  score += 10; // Increase score by 10 points
  scoreDisplay.textContent = score;
}

// Example: Increase score when a specific cell is clicked (you can modify this as needed)
document.getElementById('cell-1-6').addEventListener('click', increaseScore);
// Ask AI to create how to crate a flow game logic for the game
//if i have time create a phone version of the game and make it responsive to swipes