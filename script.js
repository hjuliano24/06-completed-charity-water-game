// Log to confirm the script is loaded
console.log('JavaScript file is linked correctly.');

const gameboard = document.getElementById('gameboard');
const scoreDisplay = document.getElementById('score');
// timer display element (exists in index.html)
const timerDisplay = document.getElementById('timer');

// Keep track of game state
let playerPos = { row: 1, col: 4 }; // start at 1,4 for Easy
let visitedCheckpoints = {}; // record which checkpoints were collected
let gameEnded = false;
let score = 0;

// Timer state
let timer = 60;           // seconds for the level (you can change)
let timerInterval = null; // holds setInterval id

// current grid size (used for bounds checks). Easy = 4, Normal/Hard = 6
let gridSize = 4;

// current level name used to adjust behaviour (score values, bush movement)
let currentLevel = 'easy';

// Attach listener for Easy button
document.getElementById('easy').addEventListener('click', setupEasy);
// Attach listener for Normal button
document.getElementById('normal').addEventListener('click', setupNormal);
// Attach listener for Hard button
document.getElementById('hard').addEventListener('click', setupHard);

/**
 * Build a 4x4 grid, place bushes, checkpoints, goal and the player.
 * Simple beginner-friendly DOM code with comments.
 */
function setupEasy() {
  // ensure bounds use 4x4
  gridSize = 4;
  currentLevel = 'easy';

  // Reset state
  visitedCheckpoints = {};
  gameEnded = false;
  score = 0;
  scoreDisplay.textContent = score;

  // reset and show timer
  timer = 60; // 60 seconds for easy
  if (timerDisplay) timerDisplay.textContent = timer;

  // Hide level selection UI
  const levelDiv = document.getElementById('level');
  if (levelDiv) levelDiv.style.display = 'none';

  // Show and configure the gameboard as a 4x4 grid
  gameboard.style.display = 'grid';
  gameboard.style.gridTemplateColumns = 'repeat(4, 1fr)';
  gameboard.style.gridTemplateRows = 'repeat(4, 1fr)';
  gameboard.innerHTML = ''; // remove previous cells if any

  // Create 4x4 cells with ids like cell-1-1
  for (let r = 1; r <= 4; r++) {
    for (let c = 1; c <= 4; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `cell-${r}-${c}`;
      // center content in each cell
      cell.style.display = 'flex';
      cell.style.justifyContent = 'center';
      cell.style.alignItems = 'center';
      // keep a small label for debugging / visibility
      cell.dataset.coord = `${r},${c}`;
      // clear any inline styles from previous runs
      cell.style.backgroundColor = '';
      gameboard.appendChild(cell);
    }
  }

  // Place bushes (impassable)
  const bushes = [{ row: 3, col: 1 }, { row: 2, col: 3 }, { row: 4, col: 4 }];
  bushes.forEach(p => {
    const el = document.getElementById(`cell-${p.row}-${p.col}`);
    if (!el) return;
    el.classList.add('bush');
    el.textContent = '🌿'; // simple emoji marker
  });

  // Place checkpoints (collect once for +50)
  const checkpoints = [{ row: 1, col: 1 }, { row: 2, col: 4 }];
  checkpoints.forEach(p => {
    const el = document.getElementById(`cell-${p.row}-${p.col}`);
    if (!el) return;
    el.classList.add('checkpoint');
    el.textContent = '🏘️';
  });

  // Place goal (ends the game)
  const goal = { row: 4, col: 1 };
  const goalEl = document.getElementById(`cell-${goal.row}-${goal.col}`);
  if (goalEl) {
    goalEl.classList.add('goal');
    goalEl.textContent = '🏁';
  }

  // Place the player at 1,4
  playerPos = { row: 1, col: 4 };
  drawPlayer();

  // start countdown timer for this level
  startTimer();

  // Make sure keyboard controls are active for this level
  // (listener added once globally below handles movement and checks gameEnded)
}

// Draw or move the visual player element inside the current cell
function drawPlayer() {
  // Remove any existing player markers
  document.querySelectorAll('.player').forEach(el => el.remove());

  // Find target cell, bail out if not present
  const cell = document.getElementById(`cell-${playerPos.row}-${playerPos.col}`);
  if (!cell) return;

  // Create a simple player element
  const p = document.createElement('div');
  p.className = 'player';
  p.textContent = '🚶';
  p.style.fontSize = '1.8rem';
  p.style.pointerEvents = 'none'; // prevent blocking clicks
  cell.appendChild(p);
}

// add a blue trail at the given cell coordinates
function leaveTrail(row, col) {
  const cell = document.getElementById(`cell-${row}-${col}`);
  if (!cell) return;
  // don't overwrite special items (goal, checkpoint, bush)
  if (cell.classList.contains('goal') || cell.classList.contains('checkpoint') || cell.classList.contains('bush')) return;
  // only add one trail element per cell
  if (!cell.querySelector('.trail')) {
    // set a subtle blue background
    cell.style.backgroundColor = '#b3e0ff';
    // add a small droplet marker
    const t = document.createElement('div');
    t.className = 'trail';
    t.textContent = '💧';
    t.style.fontSize = '1.2rem';
    t.style.pointerEvents = 'none';
    cell.appendChild(t);
  }
}

// Get references to the audio elements
const victorySound = document.getElementById('victorySound');
const waterSound = document.getElementById('waterSound');

// Move the player with boundary and bush checks
function movePlayer(deltaRow, deltaCol) {
  if (gameEnded) return;

  const newRow = playerPos.row + deltaRow;
  const newCol = playerPos.col + deltaCol;

  // Bounds check using gridSize
  if (newRow < 1 || newRow > gridSize || newCol < 1 || newCol > gridSize) return;

  const target = document.getElementById(`cell-${newRow}-${newCol}`);
  if (!target) return;

  // Block movement if there's a bush
  if (target.classList.contains('bush')) {
    target.style.transition = 'transform 0.08s';
    target.style.transform = 'translateY(-3px)';
    setTimeout(() => { target.style.transform = ''; }, 80);
    return;
  }

  // Leave a trail at the current position before moving
  leaveTrail(playerPos.row, playerPos.col);

  // Move player
  playerPos = { row: newRow, col: newCol };
  drawPlayer();

  // If we land on a checkpoint and haven't collected it yet, give points
  if (target.classList.contains('checkpoint')) {
    const key = `${newRow}-${newCol}`;
    if (!visitedCheckpoints[key]) {
      visitedCheckpoints[key] = true;

      // Play water sound
      if (waterSound) waterSound.play();

      // Award points
      const checkpointValue = (gridSize === 6) ? 25 : 50;
      score += checkpointValue;
      scoreDisplay.textContent = score;

      // Small visual feedback: pulse the cell
      target.style.transition = 'box-shadow 0.4s';
      target.style.boxShadow = '0 0 12px 4px gold';
      setTimeout(() => { target.style.boxShadow = ''; }, 500);

      // Remove checkpoint marker
      target.textContent = '✅';
      target.classList.remove('checkpoint');

      // On hard mode, move the bushes after collecting a checkpoint
      if (currentLevel === 'hard') {
        moveBushes();
      }
    }
  }

  // If we reach the goal, end the game with a congratulations message
  if (target.classList.contains('goal')) {
    // Play victory sound
    if (victorySound) victorySound.play();

    endGame();
  }
}

// Start the countdown timer (simple beginner-friendly)
function startTimer() {
  // clear any existing interval
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (timerDisplay) timerDisplay.textContent = timer;

  timerInterval = setInterval(() => {
    if (gameEnded) {
      clearInterval(timerInterval);
      timerInterval = null;
      return;
    }
    if (timer > 0) {
      timer--;
      if (timerDisplay) timerDisplay.textContent = timer;
    } else {
      // time's up
      clearInterval(timerInterval);
      timerInterval = null;
      gameEnded = true;
      // hide the board
      gameboard.style.display = 'none';
      // show modal with game over message
      const title = document.getElementById('modalTitle');
      const body = document.getElementById('modalBody');
      if (title) title.innerText = 'Time is up!';
      if (body) {
        body.innerHTML = `
          <p>Time has run out. Game over.</p>
          <p>Score: <strong>${score}</strong></p>
          <p>Click "Play Again" to try again.</p>
        `;
      }
      const endModal = new bootstrap.Modal(document.getElementById('endGameModal'));
      endModal.show();
    }
  }, 1000); // every second
}

// End the game: show modal with congratulations and final score
function endGame() {
  if (gameEnded) return;
  gameEnded = true;

  // Stop timer if running
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Hide the board (optional)
  gameboard.style.display = 'none';

  // Fill modal content
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  if (title) title.innerText = 'Congratulations!';
  if (body) {
    body.innerHTML = `
      <p>You reached the goal! 🎉</p>
      <p>Score: <strong>${score}</strong></p>
      <p>Click "Play Again" to try another round.</p>
    `;
  }

  // Show Bootstrap modal
  const endModal = new bootstrap.Modal(document.getElementById('endGameModal'));
  endModal.show();
}

// Keyboard controls: arrows to move the player
document.addEventListener('keydown', (e) => {
  if (gameEnded) return;
  if (e.key === 'ArrowUp') movePlayer(-1, 0);
  if (e.key === 'ArrowDown') movePlayer(1, 0);
  if (e.key === 'ArrowLeft') movePlayer(0, -1);
  if (e.key === 'ArrowRight') movePlayer(0, 1);
});

// Basic touch/swipe support for mobile (very simple)
let touchStartX = 0;
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
  if (!e.touches || e.touches.length === 0) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
document.addEventListener('touchend', (e) => {
  if (gameEnded) return;
  if (!e.changedTouches || e.changedTouches.length === 0) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) movePlayer(0, 1); // swipe right
    else if (dx < -30) movePlayer(0, -1); // swipe left
  } else {
    if (dy > 30) movePlayer(1, 0); // swipe down
    else if (dy < -30) movePlayer(-1, 0); // swipe up
  }
});

// Optional: draw player if board is already visible on load
drawPlayer();

/* New: Setup Normal level (6x6) with requested layout
   - character at 1,6
   - bushes: 1,1 1,2 1,3 2,5 2,6 3,4 3,5 4,2 4,5 5,2 6,1 6,2
   - checkpoints: 2,1 3,6 5,1 6,6
   - goal: 6,3
*/
function setupNormal() {
  // use a 6x6 grid
  gridSize = 6;
  currentLevel = 'normal';

  // reset basic state
  visitedCheckpoints = {};
  gameEnded = false;
  score = 0;
  scoreDisplay.textContent = score;

  // set timer for normal (adjustable)
  timer = 45;
  if (timerDisplay) timerDisplay.textContent = timer;

  // hide level UI
  const levelDiv = document.getElementById('level');
  if (levelDiv) levelDiv.style.display = 'none';

  // show and configure a 6x6 board
  gameboard.style.display = 'grid';
  gameboard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  gameboard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
  gameboard.innerHTML = '';

  // create 6x6 cells
  for (let r = 1; r <= gridSize; r++) {
    for (let c = 1; c <= gridSize; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `cell-${r}-${c}`;
      // center content in each cell
      cell.style.display = 'flex';
      cell.style.justifyContent = 'center';
      cell.style.alignItems = 'center';
      cell.dataset.coord = `${r},${c}`;
      cell.style.backgroundColor = ''; // clear any previous
      gameboard.appendChild(cell);
    }
  }

  // place bushes
  const bushes = [
    { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
    { row: 2, col: 5 }, { row: 2, col: 6 },
    { row: 3, col: 4 }, { row: 3, col: 5 },
    { row: 4, col: 2 }, { row: 4, col: 5 },
    { row: 5, col: 2 },
    { row: 6, col: 1 }, { row: 6, col: 2 }
  ];
  bushes.forEach(p => {
    const el = document.getElementById(`cell-${p.row}-${p.col}`);
    if (!el) return;
    el.classList.add('bush');
    el.textContent = '🌿';
  });

  // place checkpoints
  const checkpoints = [{ row: 2, col: 1 }, { row: 3, col: 6 }, { row: 5, col: 1 }, { row: 6, col: 6 }];
  checkpoints.forEach(p => {
    const el = document.getElementById(`cell-${p.row}-${p.col}`);
    if (!el) return;
    el.classList.add('checkpoint');
    el.textContent = '🏘️';
  });

  // place goal
  const goal = { row: 6, col: 3 };
  const goalEl = document.getElementById(`cell-${goal.row}-${goal.col}`);
  if (goalEl) {
    goalEl.classList.add('goal');
    goalEl.textContent = '🏁';
  }

  // place player at 1,6
  playerPos = { row: 1, col: 6 };
  drawPlayer();

  // start timer
  startTimer();
}

/* New: Setup Hard level (6x6) with requested layout
   - character at 1,6
   - bushes: 2,3 2,4 2,5 3,1 3,3 4,4 5,1 5,4 6,1
   - checkpoints: 1,1 4,3 4,6 6,5
   - goal: 3,4
   - timer starts at 30
   - each checkpoint is 25 points (gridSize === 6 will give 25)
   - bushes move whenever any checkpoint is collected
*/
function setupHard() {
  gridSize = 6;
  currentLevel = 'hard';

  // reset basic state
  visitedCheckpoints = {};
  gameEnded = false;
  score = 0;
  scoreDisplay.textContent = score;

  // set timer for hard
  timer = 30;
  if (timerDisplay) timerDisplay.textContent = timer;

  // hide level UI
  const levelDiv = document.getElementById('level');
  if (levelDiv) levelDiv.style.display = 'none';

  // show and configure a 6x6 board
  gameboard.style.display = 'grid';
  gameboard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  gameboard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
  gameboard.innerHTML = '';

  // create 6x6 cells
  for (let r = 1; r <= gridSize; r++) {
    for (let c = 1; c <= gridSize; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `cell-${r}-${c}`;
      // center content in each cell
      cell.style.display = 'flex';
      cell.style.justifyContent = 'center';
      cell.style.alignItems = 'center';
      cell.dataset.coord = `${r},${c}`;
      cell.style.backgroundColor = ''; // clear any previous
      cell.textContent = ''; // ensure empty
      gameboard.appendChild(cell);
    }
  }

  // place bushes for Hard level (these will be moved when a checkpoint is reached)
  const bushes = [
    { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
    { row: 3, col: 1 }, { row: 3, col: 3 }, { row: 4, col: 4 },
    { row: 5, col: 1 }, { row: 5, col: 4 }, { row: 6, col: 1 }
  ];
  bushes.forEach(p => {
    const el = document.getElementById(`cell-${p.row}-${p.col}`);
    if (!el) return;
    el.classList.add('bush');
    el.textContent = '🌿';
  });

  // place checkpoints
  const checkpoints = [{ row: 1, col: 1 }, { row: 4, col: 3 }, { row: 4, col: 6 }, { row: 6, col: 5 }];
  checkpoints.forEach(p => {
    const el = document.getElementById(`cell-${p.row}-${p.col}`);
    if (!el) return;
    el.classList.add('checkpoint');
    el.textContent = '🏘️';
  });

  // place goal
  const goal = { row: 3, col: 4 };
  const goalEl = document.getElementById(`cell-${goal.row}-${goal.col}`);
  if (goalEl) {
    goalEl.classList.add('goal');
    goalEl.textContent = '🏁';
  }

  // place player at 1,6
  playerPos = { row: 1, col: 6 };
  drawPlayer();

  // start timer
  startTimer();
}

// When a checkpoint gets collected, move bushes (hard level)
function moveBushes() {
  // Only active on hard level
  if (currentLevel !== 'hard') return;

  // collect current number of bushes
  const existingBushEls = Array.from(document.querySelectorAll('.bush'));
  const count = existingBushEls.length;

  // Clear current bushes
  existingBushEls.forEach(el => {
    el.classList.remove('bush');
    // clear emoji/text but preserve other classes like checkpoint/goal/player
    if (!el.classList.contains('checkpoint') && !el.classList.contains('goal')) {
      el.textContent = '';
      el.style.backgroundColor = '';
    }
  });

  // Build a set of forbidden positions: player, checkpoints, goal
  const forbidden = new Set();
  if (playerPos) forbidden.add(`${playerPos.row}-${playerPos.col}`);
  document.querySelectorAll('.checkpoint, .goal').forEach(el => {
    if (el.id && el.id.startsWith('cell-')) {
      forbidden.add(el.id.replace('cell-', ''));
    }
  });

  // Choose new random positions for the same number of bushes
  const newPositions = new Set();
  while (newPositions.size < count) {
    const r = Math.floor(Math.random() * gridSize) + 1;
    const c = Math.floor(Math.random() * gridSize) + 1;
    const key = `${r}-${c}`;
    if (forbidden.has(key) || newPositions.has(key)) continue;
    newPositions.add(key);
  }

  // Apply new bush positions in the DOM
  newPositions.forEach(k => {
    const [r, c] = k.split('-').map(Number);
    const el = document.getElementById(`cell-${r}-${c}`);
    if (!el) return;
    // don't overwrite checkpoint/goal/player
    if (el.classList.contains('checkpoint') || el.classList.contains('goal')) return;
    el.classList.add('bush');
    el.textContent = '🌿';
  });
}

