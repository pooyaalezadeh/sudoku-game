// ===============================
// SUDOKU ULTIMATE - PRO VERSION
// ===============================

const SIZE = 9;
const BOX = 3;
const MAX_ERRORS = 3;

// ---------- Game State ----------
let solution = [];
let puzzle = [];
let board = [];
let notes = Array.from({ length: 9 }, () =>
  Array.from({ length: 9 }, () => new Set())
);

let history = [];
let selectedRow = -1;
let selectedCol = -1;

let difficulty = "easy";
let errors = 0;
let score = 0;
let seconds = 0;
let timerInterval = null;
let paused = false;
let notesMode = false;
let soundEnabled = true;
let musicEnabled = false;

let audioContext = null;
let musicTimer = null;

// ---------- Difficulty ----------
const difficultySettings = {
  easy: 38,
  medium: 31,
  hard: 25,
  expert: 21
};

// ---------- DOM ----------
const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const errorsEl = document.getElementById("errors");
const timerEl = document.getElementById("timer");
const bestTimeEl = document.getElementById("best-time");
const progressEl = document.getElementById("progress");
const progressTextEl = document.getElementById("progress-text");

// ===============================
// AUDIO SYSTEM
// ===============================

function initAudio() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;

    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }

  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTone(frequency, duration = 0.08, type = "sine", volume = 0.04) {
  if (!soundEnabled) return;

  initAudio();

  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(
    frequency,
    audioContext.currentTime
  );

  gain.gain.setValueAtTime(volume, audioContext.currentTime);

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();

  oscillator.stop(audioContext.currentTime + duration);
}

// ---------- UI Click ----------
function playClickSound() {
  playTone(520, 0.06, "sine", 0.035);
}

// ---------- Correct ----------
function playCorrectSound() {
  if (!soundEnabled) return;

  initAudio();

  playTone(523.25, 0.08, "sine", 0.04);

  setTimeout(() => {
    playTone(659.25, 0.1, "sine", 0.045);
  }, 70);

  setTimeout(() => {
    playTone(783.99, 0.14, "sine", 0.05);
  }, 140);
}

// ---------- Wrong ----------
function playWrongSound() {
  if (!soundEnabled) return;

  initAudio();

  playTone(220, 0.12, "sawtooth", 0.035);

  setTimeout(() => {
    playTone(165, 0.16, "sawtooth", 0.03);
  }, 100);
}

// ---------- Hint ----------
function playHintSound() {
  if (!soundEnabled) return;

  playTone(392, 0.08, "sine", 0.035);

  setTimeout(() => {
    playTone(523.25, 0.12, "sine", 0.04);
  }, 90);
}

// ---------- Win ----------
function playWinSound() {
  if (!soundEnabled) return;

  const melody = [
    [523.25, 0],
    [659.25, 120],
    [783.99, 240],
    [1046.5, 380]
  ];

  melody.forEach(([frequency, delay]) => {
    setTimeout(() => {
      playTone(frequency, 0.18, "sine", 0.055);
    }, delay);
  });
}

// ---------- Pause ----------
function playPauseSound() {
  playTone(330, 0.08, "sine", 0.03);
}

// ===============================
// BACKGROUND MUSIC
// ===============================

function startMusic() {
  if (!musicEnabled) return;

  stopMusic();

  const melody = [
    261.63,
    329.63,
    392.0,
    329.63,
    293.66,
    349.23,
    440.0,
    349.23
  ];

  let index = 0;

  musicTimer = setInterval(() => {
    if (!paused && musicEnabled && soundEnabled) {
      playTone(
        melody[index],
        0.45,
        "sine",
        0.012
      );

      index++;

      if (index >= melody.length) {
        index = 0;
      }
    }
  }, 520);
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

// ===============================
// SUDOKU GENERATOR
// ===============================

function shuffle(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function isSafe(grid, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }

  return true;
}

function fillGrid(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {

      if (grid[row][col] === 0) {

        const numbers = shuffle([
          1, 2, 3, 4, 5, 6, 7, 8, 9
        ]);

        for (const num of numbers) {

          if (isSafe(grid, row, col, num)) {

            grid[row][col] = num;

            if (fillGrid(grid)) {
              return true;
            }

            grid[row][col] = 0;
          }
        }

        return false;
      }
    }
  }

  return true;
}

function generateSolution() {
  const grid = Array.from({ length: 9 }, () =>
    Array(9).fill(0)
  );

  fillGrid(grid);

  return grid;
}

// ===============================
// CREATE PUZZLE
// ===============================

function createPuzzle(fullGrid, clues) {

  const result = fullGrid.map(row => [...row]);

  let cellsToRemove = 81 - clues;

  const positions = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }

  const shuffled = shuffle(positions);

  for (let i = 0; i < cellsToRemove; i++) {
    const [r, c] = shuffled[i];

    result[r][c] = 0;
  }

  return result;
}

// ===============================
// NEW GAME
// ===============================

function newGame() {

  stopTimer();

  solution = generateSolution();

  puzzle = createPuzzle(
    solution,
    difficultySettings[difficulty]
  );

  board = puzzle.map(row => [...row]);

  notes = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set())
  );

  history = [];

  selectedRow = -1;
  selectedCol = -1;

  errors = 0;
  score = 0;
  seconds = 0;
  paused = false;
  notesMode = false;

  updateStats();
  renderBoard();
  startTimer();
  updateBestTime();

  saveGame();

  playClickSound();
}

// ===============================
// RENDER BOARD
// ===============================

function renderBoard() {

  if (!boardEl) return;

  boardEl.innerHTML = "";

  for (let row = 0; row < 9; row++) {

    for (let col = 0; col < 9; col++) {

      const cell = document.createElement("div");

      cell.className = "cell";

      cell.dataset.row = row;
      cell.dataset.col = col;

      const value = board[row][col];

      if (value !== 0) {

        cell.textContent = value;

        if (puzzle[row][col] !== 0) {
          cell.classList.add("fixed");
        } else {
          cell.classList.add("user-number");
        }
      }

      // Selected
      if (
        row === selectedRow &&
        col === selectedCol
      ) {
        cell.classList.add("selected");
      }

      // Same row / column / box
      if (selectedRow !== -1 && selectedCol !== -1) {

        if (
          row === selectedRow ||
          col === selectedCol ||
          (
            Math.floor(row / 3) === Math.floor(selectedRow / 3) &&
            Math.floor(col / 3) === Math.floor(selectedCol / 3)
          )
        ) {
          cell.classList.add("highlight");
        }

        if (
          value !== 0 &&
          value === board[selectedRow][selectedCol]
        ) {
          cell.classList.add("same-number");
        }
      }

      // Notes
      if (value === 0 && notes[row][col].size > 0) {

        const notesContainer =
          document.createElement("div");

        notesContainer.className = "notes";

        for (let n = 1; n <= 9; n++) {

          const note =
            document.createElement("span");

          note.textContent =
            notes[row][col].has(n) ? n : "";

          notesContainer.appendChild(note);
        }

        cell.appendChild(notesContainer);
      }

      cell.addEventListener("click", () => {

        if (paused) return;

        initAudio();

        selectedRow = row;
        selectedCol = col;

        playClickSound();

        renderBoard();
      });

      boardEl.appendChild(cell);
    }
  }

  updateProgress();
}

// ===============================
// ENTER NUMBER
// ===============================

function enterNumber(num) {

  if (paused) return;

  if (
    selectedRow === -1 ||
    selectedCol === -1
  ) {
    return;
  }

  const row = selectedRow;
  const col = selectedCol;

  // Fixed cell
  if (puzzle[row][col] !== 0) {
    playWrongSound();
    return;
  }

  // Notes mode
  if (notesMode) {

    if (board[row][col] !== 0) {
      return;
    }

    const currentNotes = notes[row][col];

    if (currentNotes.has(num)) {
      currentNotes.delete(num);
    } else {
      currentNotes.add(num);
    }

    playClickSound();

    renderBoard();
    saveGame();

    return;
  }

  history.push({
    row,
    col,
    value: board[row][col]
  });

  // Correct
  if (num === solution[row][col]) {

    board[row][col] = num;

    score += 100;

    removeRelatedNotes(row, col, num);

    playCorrectSound();

  } else {

    board[row][col] = num;

    errors++;

    score = Math.max(0, score - 25);

    playWrongSound();

    setTimeout(() => {

      if (
        board[row][col] === num &&
        solution[row][col] !== num
      ) {
        board[row][col] = 0;
        renderBoard();
      }

    }, 350);
  }

  updateStats();
  renderBoard();
  saveGame();

  if (errors >= MAX_ERRORS) {
    gameOver();
    return;
  }

  if (checkWin()) {
    winGame();
  }
}

// ===============================
// REMOVE NOTES
// ===============================

function removeRelatedNotes(row, col, num) {

  for (let i = 0; i < 9; i++) {
    notes[row][i].delete(num);
    notes[i][col].delete(num);
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      notes[r][c].delete(num);
    }
  }
}

// ===============================
// ERASE
// ===============================

function eraseCell() {

  if (paused) return;

  if (
    selectedRow === -1 ||
    selectedCol === -1
  ) {
    return;
  }

  const row = selectedRow;
  const col = selectedCol;

  if (puzzle[row][col] !== 0) {
    return;
  }

  if (board[row][col] !== 0) {

    history.push({
      row,
      col,
      value: board[row][col]
    });

    board[row][col] = 0;

    playClickSound();
  }

  notes[row][col].clear();

  renderBoard();
  saveGame();
  updateStats();
}

// ===============================
// UNDO
// ===============================

function undoMove() {

  if (paused) return;

  if (history.length === 0) {
    playWrongSound();
    return;
  }

  const last = history.pop();

  board[last.row][last.col] =
    last.value;

  playClickSound();

  renderBoard();
  saveGame();
  updateStats();
}

// ===============================
// HINT
// ===============================

function hint() {

  if (paused) return;

  let emptyCells = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {

      if (
        puzzle[r][c] === 0 &&
        board[r][c] !== solution[r][c]
      ) {
        emptyCells.push([r, c]);
      }
    }
  }

  if (emptyCells.length === 0) {
    return;
  }

  const [row, col] =
    emptyCells[
      Math.floor(Math.random() * emptyCells.length)
    ];

  history.push({
    row,
    col,
    value: board[row][col]
  });

  board[row][col] = solution[row][col];

  score = Math.max(0, score - 50);

  selectedRow = row;
  selectedCol = col;

  removeRelatedNotes(
    row,
    col,
    solution[row][col]
  );

  playHintSound();

  updateStats();
  renderBoard();
  saveGame();

  if (checkWin()) {
    winGame();
  }
}

// ===============================
// CHECK WIN
// ===============================

function checkWin() {

  for (let r = 0; r < 9; r++) {

    for (let c = 0; c < 9; c++) {

      if (board[r][c] !== solution[r][c]) {
        return false;
      }
    }
  }

  return true;
}

// ===============================
// GAME OVER
// ===============================

function gameOver() {

  stopTimer();

  paused = true;

  playWrongSound();

  setTimeout(() => {

    alert(
      "بازی تمام شد!\nتعداد خطاها به ۳ رسید."
    );

    newGame();

  }, 400);
}

// ===============================
// WIN
// ===============================

function winGame() {

  stopTimer();

  score += Math.max(
    0,
    1000 - seconds * 3
  );

  updateStats();

  saveBestTime();

  playWinSound();

  const modal =
    document.getElementById("win-modal");

  if (modal) {
    modal.classList.add("show");
  } else {
    setTimeout(() => {
      alert(
        `تبریک! 🎉\nامتیاز: ${score}\nزمان: ${formatTime(seconds)}`
      );
    }, 500);
  }

  saveGame();
}

// ===============================
// TIMER
// ===============================

function startTimer() {

  stopTimer();

  timerInterval = setInterval(() => {

    if (!paused) {

      seconds++;

      updateTimer();

      if (seconds % 5 === 0) {
        saveGame();
      }
    }

  }, 1000);
}

function stopTimer() {

  if (timerInterval) {

    clearInterval(timerInterval);

    timerInterval = null;
  }
}

function formatTime(totalSeconds) {

  const minutes =
    Math.floor(totalSeconds / 60);

  const secs =
    totalSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );
}

function updateTimer() {

  if (timerEl) {
    timerEl.textContent =
      formatTime(seconds);
  }
}

// ===============================
// STATS
// ===============================

function updateStats() {

  if (scoreEl) {
    scoreEl.textContent = score;
  }

  if (errorsEl) {
    errorsEl.textContent =
      `${errors}/${MAX_ERRORS}`;
  }

  updateTimer();
  updateProgress();
}

function updateProgress() {

  let completed = 0;

  for (let r = 0; r < 9; r++) {

    for (let c = 0; c < 9; c++) {

      if (
        board[r][c] === solution[r][c]
      ) {
        completed++;
      }
    }
  }

  const percentage =
    Math.round((completed / 81) * 100);

  if (progressEl) {
    progressEl.style.width =
      `${percentage}%`;
  }

  if (progressTextEl) {
    progressTextEl.textContent =
      `${percentage}%`;
  }
}

// ===============================
// BEST TIME
// ===============================

function getBestKey() {
  return `sudokuBestTime_${difficulty}`;
}

function updateBestTime() {

  if (!bestTimeEl) return;

  const best =
    localStorage.getItem(getBestKey());

  bestTimeEl.textContent =
    best ? formatTime(Number(best)) : "--:--";
}

function saveBestTime() {

  const key = getBestKey();

  const old =
    localStorage.getItem(key);

  if (!old || seconds < Number(old)) {
    localStorage.setItem(
      key,
      seconds
    );
  }

  updateBestTime();
}

// ===============================
// DIFFICULTY
// ===============================

function setDifficulty(level) {

  if (!difficultySettings[level]) {
    return;
  }

  difficulty = level;

  document
    .querySelectorAll(".difficulty-btn")
    .forEach(btn => {

      btn.classList.toggle(
        "active",
        btn.dataset.difficulty === level
      );

    });

  newGame();
}

// ===============================
// PAUSE
// ===============================

function togglePause() {

  paused = !paused;

  playPauseSound();

  const overlay =
    document.getElementById("pause-overlay");

  if (overlay) {
    overlay.classList.toggle(
      "show",
      paused
    );
  }
}

// ===============================
// NOTES
// ===============================

function toggleNotes() {

  notesMode = !notesMode;

  playClickSound();

  const btn =
    document.getElementById("notes-btn");

  if (btn) {
    btn.classList.toggle(
      "active",
      notesMode
    );
  }
}

// ===============================
// SOUND SETTINGS
// ===============================

function toggleSound() {

  soundEnabled = !soundEnabled;

  if (soundEnabled) {
    initAudio();
    playClickSound();
  } else {
    stopMusic();
  }

  localStorage.setItem(
    "sudokuSound",
    soundEnabled ? "1" : "0"
  );
}

function toggleMusic() {

  musicEnabled = !musicEnabled;

  localStorage.setItem(
    "sudokuMusic",
    musicEnabled ? "1" : "0"
  );

  if (musicEnabled) {
    initAudio();
    startMusic();
  } else {
    stopMusic();
  }
}

// ===============================
// SAVE GAME
// ===============================

function saveGame() {

  const data = {
    solution,
    puzzle,
    board,
    difficulty,
    errors,
    score,
    seconds,
    paused: false
  };

  localStorage.setItem(
    "sudokuCurrentGame",
    JSON.stringify(data)
  );
}

// ===============================
// LOAD GAME
// ===============================

function loadGame() {

  try {

    const saved =
      localStorage.getItem(
        "sudokuCurrentGame"
      );

    if (!saved) {
      newGame();
      return;
    }

    const data =
      JSON.parse(saved);

    if (
      !data.solution ||
      !data.puzzle ||
      !data.board
    ) {
      newGame();
      return;
    }

    solution = data.solution;
    puzzle = data.puzzle;
    board = data.board;

    difficulty =
      data.difficulty || "easy";

    errors =
      data.errors || 0;

    score =
      data.score || 0;

    seconds =
      data.seconds || 0;

    notes = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => new Set())
    );

    updateDifficultyButtons();
    updateStats();
    renderBoard();
    startTimer();
    updateBestTime();

  } catch (error) {

    console.error(error);

    newGame();
  }
}

// ===============================
// DIFFICULTY BUTTON UI
// ===============================

function updateDifficultyButtons() {

  document
    .querySelectorAll(".difficulty-btn")
    .forEach(btn => {

      btn.classList.toggle(
        "active",
        btn.dataset.difficulty === difficulty
      );

    });
}

// ===============================
// SETTINGS
// ===============================

function openSettings() {

  const modal =
    document.getElementById("settings-modal");

  if (modal) {
    modal.classList.add("show");
  }

  playClickSound();
}

function closeSettings() {

  const modal =
    document.getElementById("settings-modal");

  if (modal) {
    modal.classList.remove("show");
  }
}

function saveSettings() {

  const bg =
    document.getElementById("bg-color");

  const cell =
    document.getElementById("cell-color");

  const text =
    document.getElementById("text-color");

  if (bg) {
    document.documentElement.style.setProperty(
      "--bg",
      bg.value
    );

    localStorage.setItem(
      "sudokuBg",
      bg.value
    );
  }

  if (cell) {
    document.documentElement.style.setProperty(
      "--cell",
      cell.value
    );

    localStorage.setItem(
      "sudokuCell",
      cell.value
    );
  }

  if (text) {
    document.documentElement.style.setProperty(
      "--text",
      text.value
    );

    localStorage.setItem(
      "sudokuText",
      text.value
    );
  }

  playClickSound();

  closeSettings();
}

function loadSettings() {

  const bg =
    localStorage.getItem("sudokuBg");

  const cell =
    localStorage.getItem("sudokuCell");

  const text =
    localStorage.getItem("sudokuText");

  if (bg) {
    document.documentElement.style.setProperty(
      "--bg",
      bg
    );

    const input =
      document.getElementById("bg-color");

    if (input) input.value = bg;
  }

  if (cell) {
    document.documentElement.style.setProperty(
      "--cell",
      cell
    );

    const input =
      document.getElementById("cell-color");

    if (input) input.value = cell;
  }

  if (text) {
    document.documentElement.style.setProperty(
      "--text",
      text
    );

    const input =
      document.getElementById("text-color");

    if (input) input.value = text;
  }

  const storedSound =
    localStorage.getItem("sudokuSound");

  if (storedSound !== null) {
    soundEnabled =
      storedSound === "1";
  }

  const storedMusic =
    localStorage.getItem("sudokuMusic");

  if (storedMusic !== null) {
    musicEnabled =
      storedMusic === "1";
  }
}

// ===============================
// KEYBOARD
// ===============================

document.addEventListener(
  "keydown",
  event => {

    if (paused) return;

    const key = event.key;

    if (
      key >= "1" &&
      key <= "9"
    ) {

      enterNumber(
        Number(key)
      );

      return;
    }

    if (
      key === "Backspace" ||
      key === "Delete" ||
      key === "0"
    ) {

      eraseCell();

      return;
    }

    if (key === "ArrowUp") {

      event.preventDefault();

      selectedRow =
        Math.max(0, selectedRow - 1);

      renderBoard();

      return;
    }

    if (key === "ArrowDown") {

      event.preventDefault();

      selectedRow =
        Math.min(8, selectedRow + 1);

      renderBoard();

      return;
    }

    if (key === "ArrowLeft") {

      event.preventDefault();

      selectedCol =
        Math.max(0, selectedCol - 1);

      renderBoard();

      return;
    }

    if (key === "ArrowRight") {

      event.preventDefault();

      selectedCol =
        Math.min(8, selectedCol + 1);

      renderBoard();

      return;
    }

    if (key.toLowerCase() === "n") {
      toggleNotes();
    }

    if (key.toLowerCase() === "h") {
      hint();
    }

    if (key === " ") {

      event.preventDefault();

      togglePause();
    }
  }
);

// ===============================
// BUTTON EVENTS
// ===============================

function setupButtons() {

  // New Game
  const newGameBtn =
    document.getElementById("new-game");

  if (newGameBtn) {
    newGameBtn.addEventListener(
      "click",
      newGame
    );
  }

  // Undo
  const undoBtn =
    document.getElementById("undo-btn");

  if (undoBtn) {
    undoBtn.addEventListener(
      "click",
      undoMove
    );
  }

  // Hint
  const hintBtn =
    document.getElementById("hint-btn");

  if (hintBtn) {
    hintBtn.addEventListener(
      "click",
      hint
    );
  }

  // Notes
  const notesBtn =
    document.getElementById("notes-btn");

  if (notesBtn) {
    notesBtn.addEventListener(
      "click",
      toggleNotes
    );
  }

  // Pause
  const pauseBtn =
    document.getElementById("pause-btn");

  if (pauseBtn) {
    pauseBtn.addEventListener(
      "click",
      togglePause
    );
  }

  // Settings
  const settingsBtn =
    document.getElementById("settings-btn");

  if (settingsBtn) {
    settingsBtn.addEventListener(
      "click",
      openSettings
    );
  }

  // Close Settings
  const closeSettingsBtn =
    document.getElementById(
      "close-settings"
    );

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener(
      "click",
      closeSettings
    );
  }

  // Save Settings
  const saveSettingsBtn =
    document.getElementById(
      "save-settings"
    );

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener(
      "click",
      saveSettings
    );
  }

  // Number Pad
  document
    .querySelectorAll("[data-number]")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          initAudio();

          enterNumber(
            Number(
              btn.dataset.number
            )
          );
        }
      );
    });

  // Erase
  const eraseBtn =
    document.getElementById("erase-btn");

  if (eraseBtn) {
    eraseBtn.addEventListener(
      "click",
      eraseCell
    );
  }

  // Difficulty
  document
    .querySelectorAll(".difficulty-btn")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          const level =
            btn.dataset.difficulty;

          setDifficulty(level);
        }
      );
    });

  // Resume
  const resumeBtn =
    document.getElementById(
      "resume-btn"
    );

  if (resumeBtn) {
    resumeBtn.addEventListener(
      "click",
      togglePause
    );
  }

  // Win New Game
  const winNewGameBtn =
    document.getElementById(
      "win-new-game"
    );

  if (winNewGameBtn) {
    winNewGameBtn.addEventListener(
      "click",
      () => {

        const modal =
          document.getElementById(
            "win-modal"
          );

        if (modal) {
          modal.classList.remove("show");
        }

        newGame();
      }
    );
  }
}

// ===============================
// FIRST USER INTERACTION
// ===============================

document.addEventListener(
  "pointerdown",
  () => {
    initAudio();
  },
  { once: true }
);

// ===============================
// START
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadSettings();

    setupButtons();

    loadGame();
  }
);
