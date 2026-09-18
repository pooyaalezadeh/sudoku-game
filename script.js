
// ===============================
// SUDOKU ULTIMATE - PRO MOBILE
// ===============================

const SIZE = 9;
const BOX = 3;
const MAX_ERRORS = 3;

// ===============================
// GAME STATE
// ===============================

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
let musicTimer = null;

let paused = false;
let notesMode = false;
let soundEnabled = true;
let musicEnabled = false;

let gameFinished = false;

let audioContext = null;

// ===============================
// DIFFICULTY
// ===============================

const difficultySettings = {
  easy: 38,
  medium: 31,
  hard: 25,
  expert: 21
};

// ===============================
// DOM
// ===============================

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const errorsEl = document.getElementById("errors");
const timerEl = document.getElementById("timer");

const bestTimeEl =
  document.getElementById("bestTime") ||
  document.getElementById("best-time");

const progressEl =
  document.getElementById("progressBar") ||
  document.getElementById("progress");

const progressTextEl =
  document.getElementById("progressText") ||
  document.getElementById("progress-text");

// ===============================
// AUDIO
// ===============================

function initAudio() {

  if (!audioContext) {

    const AudioCtx =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioCtx) return;

    try {
      audioContext = new AudioCtx();
    } catch (error) {
      console.warn("Audio unavailable:", error);
      return;
    }
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

function playTone(
  frequency,
  duration = 0.08,
  type = "sine",
  volume = 0.04
) {

  if (!soundEnabled) return;

  initAudio();

  if (!audioContext) return;

  try {

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    const now =
      audioContext.currentTime;

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      now
    );

    gain.gain.setValueAtTime(
      volume,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);

    oscillator.stop(now + duration);

  } catch (error) {
    console.warn("Audio error:", error);
  }
}

function playClickSound() {
  playTone(520, 0.06, "sine", 0.035);
}

function playCorrectSound() {

  if (!soundEnabled) return;

  playTone(523.25, 0.08, "sine", 0.04);

  setTimeout(() => {
    playTone(659.25, 0.1, "sine", 0.045);
  }, 70);

  setTimeout(() => {
    playTone(783.99, 0.14, "sine", 0.05);
  }, 140);
}

function playWrongSound() {

  if (!soundEnabled) return;

  playTone(220, 0.12, "sawtooth", 0.035);

  setTimeout(() => {
    playTone(165, 0.16, "sawtooth", 0.03);
  }, 100);
}

function playHintSound() {

  if (!soundEnabled) return;

  playTone(392, 0.08, "sine", 0.035);

  setTimeout(() => {
    playTone(523.25, 0.12, "sine", 0.04);
  }, 90);
}

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

      playTone(
        frequency,
        0.18,
        "sine",
        0.055
      );

    }, delay);

  });
}

function playPauseSound() {
  playTone(330, 0.08, "sine", 0.03);
}

// ===============================
// MUSIC
// ===============================

function startMusic() {

  if (!musicEnabled || !soundEnabled) {
    return;
  }

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

    if (
      !paused &&
      !gameFinished &&
      musicEnabled &&
      soundEnabled
    ) {

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

  for (
    let i = arr.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(Math.random() * (i + 1));

    [
      arr[i],
      arr[j]
    ] = [
      arr[j],
      arr[i]
    ];
  }

  return arr;
}

function isSafe(grid, row, col, num) {

  for (let i = 0; i < 9; i++) {

    if (grid[row][i] === num) {
      return false;
    }

    if (grid[i][col] === num) {
      return false;
    }
  }

  const startRow =
    Math.floor(row / 3) * 3;

  const startCol =
    Math.floor(col / 3) * 3;

  for (
    let r = startRow;
    r < startRow + 3;
    r++
  ) {

    for (
      let c = startCol;
      c < startCol + 3;
      c++
    ) {

      if (grid[r][c] === num) {
        return false;
      }
    }
  }

  return true;
}

function fillGrid(grid) {

  for (let row = 0; row < 9; row++) {

    for (let col = 0; col < 9; col++) {

      if (grid[row][col] === 0) {

        const numbers =
          shuffle([
            1,2,3,4,5,6,7,8,9
          ]);

        for (const num of numbers) {

          if (
            isSafe(
              grid,
              row,
              col,
              num
            )
          ) {

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

  const grid =
    Array.from(
      { length: 9 },
      () => Array(9).fill(0)
    );

  fillGrid(grid);

  return grid;
}

// ===============================
// CREATE PUZZLE
// ===============================

function createPuzzle(fullGrid, clues) {

  const result =
    fullGrid.map(row => [...row]);

  const cellsToRemove =
    81 - clues;

  const positions = [];

  for (let r = 0; r < 9; r++) {

    for (let c = 0; c < 9; c++) {

      positions.push([r, c]);
    }
  }

  const shuffled =
    shuffle(positions);

  for (
    let i = 0;
    i < cellsToRemove;
    i++
  ) {

    const [r, c] =
      shuffled[i];

    result[r][c] = 0;
  }

  return result;
}

// ===============================
// NEW GAME
// ===============================

function newGame() {

  stopTimer();
  stopMusic();

  gameFinished = false;
  paused = false;
  notesMode = false;

  solution = generateSolution();

  puzzle = createPuzzle(
    solution,
    difficultySettings[difficulty]
  );

  board =
    puzzle.map(row => [...row]);

  notes =
    Array.from(
      { length: 9 },
      () =>
        Array.from(
          { length: 9 },
          () => new Set()
        )
    );

  history = [];

  selectedRow = -1;
  selectedCol = -1;

  errors = 0;
  score = 0;
  seconds = 0;

  hidePauseOverlay();
  hideWinModal();

  updateDifficultyButtons();
  updateNotesButton();
  updateStats();
  updateBestTime();

  renderBoard();

  startTimer();

  saveGame();

  playClickSound();

  if (musicEnabled) {
    startMusic();
  }
}

// ===============================
// START GAME
// ===============================

function startGame(level) {

  if (!difficultySettings[level]) {
    level = "easy";
  }

  difficulty = level;

  newGame();
}

// ===============================
// RENDER BOARD
// ===============================

function renderBoard() {

  if (!boardEl) return;

  boardEl.innerHTML = "";

  for (let row = 0; row < 9; row++) {

    for (let col = 0; col < 9; col++) {

      const cell =
        document.createElement("div");

      cell.className = "cell";

      cell.dataset.row = row;
      cell.dataset.col = col;

      const value =
        board[row][col];

      if (value !== 0) {

        cell.textContent = value;

        if (puzzle[row][col] !== 0) {
          cell.classList.add("fixed");
          cell.classList.add("prefilled");
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

      // Highlight
      if (
        selectedRow !== -1 &&
        selectedCol !== -1
      ) {

        if (
          row === selectedRow ||
          col === selectedCol ||
          (
            Math.floor(row / 3) ===
            Math.floor(selectedRow / 3) &&
            Math.floor(col / 3) ===
            Math.floor(selectedCol / 3)
          )
        ) {

          cell.classList.add("highlight");
        }

        if (
          value !== 0 &&
          value ===
          board[selectedRow][selectedCol]
        ) {

          cell.classList.add("same-number");
        }
      }

      // Notes
      if (
        value === 0 &&
        notes[row][col].size > 0
      ) {

        const notesContainer =
          document.createElement("div");

        notesContainer.className = "notes";

        for (let n = 1; n <= 9; n++) {

          const note =
            document.createElement("span");

          note.className = "note";

          note.textContent =
            notes[row][col].has(n)
              ? n
              : "";

          notesContainer.appendChild(note);
        }

        cell.appendChild(
          notesContainer
        );
      }

      // Touch / click
      cell.addEventListener(
        "pointerup",
        event => {

          event.preventDefault();

          if (paused || gameFinished) {
            return;
          }

          initAudio();

          selectedRow = row;
          selectedCol = col;

          playClickSound();

          renderBoard();
        }
      );

      boardEl.appendChild(cell);
    }
  }

  updateProgress();
}

// ===============================
// SELECT NUMBER
// ===============================

function selectNumber(num) {

  initAudio();

  enterNumber(Number(num));
}

// ===============================
// ENTER NUMBER
// ===============================

function enterNumber(num) {

  if (paused || gameFinished) {
    return;
  }

  if (
    selectedRow === -1 ||
    selectedCol === -1
  ) {

    playWrongSound();
    return;
  }

  const row = selectedRow;
  const col = selectedCol;

  if (
    puzzle[row][col] !== 0
  ) {

    playWrongSound();
    return;
  }

  // Notes
  if (notesMode) {

    if (board[row][col] !== 0) {
      playWrongSound();
      return;
    }

    const currentNotes =
      notes[row][col];

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
  if (
    num === solution[row][col]
  ) {

    board[row][col] = num;

    score += 100;

    removeRelatedNotes(
      row,
      col,
      num
    );

    playCorrectSound();

  } else {

    board[row][col] = num;

    errors++;

    score =
      Math.max(
        0,
        score - 25
      );

    const wrongNumber = num;

    playWrongSound();

    setTimeout(() => {

      if (
        board[row][col] === wrongNumber &&
        solution[row][col] !== wrongNumber
      ) {

        board[row][col] = 0;

        renderBoard();
        saveGame();
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
// REMOVE RELATED NOTES
// ===============================

function removeRelatedNotes(
  row,
  col,
  num
) {

  for (let i = 0; i < 9; i++) {

    notes[row][i].delete(num);
    notes[i][col].delete(num);
  }

  const startRow =
    Math.floor(row / 3) * 3;

  const startCol =
    Math.floor(col / 3) * 3;

  for (
    let r = startRow;
    r < startRow + 3;
    r++
  ) {

    for (
      let c = startCol;
      c < startCol + 3;
      c++
    ) {

      notes[r][c].delete(num);
    }
  }
}

// ===============================
// ERASE
// ===============================

function eraseCell() {

  if (paused || gameFinished) {
    return;
  }

  if (
    selectedRow === -1 ||
    selectedCol === -1
  ) {

    playWrongSound();
    return;
  }

  const row = selectedRow;
  const col = selectedCol;

  if (puzzle[row][col] !== 0) {

    playWrongSound();
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

  if (paused || gameFinished) {
    return;
  }

  if (history.length === 0) {

    playWrongSound();
    return;
  }

  const last =
    history.pop();

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

  if (paused || gameFinished) {
    return;
  }

  const emptyCells = [];

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
      Math.floor(
        Math.random() *
        emptyCells.length
      )
    ];

  history.push({
    row,
    col,
    value: board[row][col]
  });

  board[row][col] =
    solution[row][col];

  score =
    Math.max(
      0,
      score - 50
    );

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

// Alias
function useHint() {
  hint();
}

// ===============================
// CHECK WIN
// ===============================

function checkWin() {

  for (let r = 0; r < 9; r++) {

    for (let c = 0; c < 9; c++) {

      if (
        board[r][c] !==
        solution[r][c]
      ) {

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
  stopMusic();

  paused = true;
  gameFinished = true;

  playWrongSound();

  setTimeout(() => {

    alert(
      "بازی تمام شد!\nتعداد خطاها به ۳ رسید."
    );

    newGame();

  }, 450);
}

// ===============================
// WIN
// ===============================

function winGame() {

  if (gameFinished) {
    return;
  }

  gameFinished = true;

  stopTimer();
  stopMusic();

  score +=
    Math.max(
      0,
      1000 - seconds * 3
    );

  updateStats();

  saveBestTime();

  playWinSound();

  const modal =
    document.getElementById("winModal") ||
    document.getElementById("win-modal");

  if (modal) {

    modal.classList.remove("hidden");
    modal.classList.add("show");

    const finalScore =
      document.getElementById("finalScore");

    const finalTime =
      document.getElementById("finalTime");

    if (finalScore) {
      finalScore.textContent = score;
    }

    if (finalTime) {
      finalTime.textContent =
        formatTime(seconds);
    }

  } else {

    setTimeout(() => {

      alert(
        `تبریک! 🎉\nامتیاز: ${score}\nزمان: ${formatTime(seconds)}`
      );

    }, 400);
  }

  saveGame();
}

// ===============================
// TIMER
// ===============================

function startTimer() {

  stopTimer();

  timerInterval =
    setInterval(() => {

      if (
        !paused &&
        !gameFinished
      ) {

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
    Math.floor(
      totalSeconds / 60
    );

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

  if (!solution.length) {
    return;
  }

  let completed = 0;

  for (let r = 0; r < 9; r++) {

    for (let c = 0; c < 9; c++) {

      if (
        board[r][c] ===
        solution[r][c]
      ) {

        completed++;
      }
    }
  }

  const percentage =
    Math.round(
      (completed / 81) * 100
    );

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

  if (!bestTimeEl) {
    return;
  }

  const best =
    localStorage.getItem(
      getBestKey()
    );

  bestTimeEl.textContent =
    best
      ? formatTime(Number(best))
      : "--:--";
}

function saveBestTime() {

  const key =
    getBestKey();

  const old =
    localStorage.getItem(key);

  if (
    !old ||
    seconds < Number(old)
  ) {

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

  updateDifficultyButtons();

  newGame();
}

function updateDifficultyButtons() {

  document
    .querySelectorAll(".difficulty-btn")
    .forEach(btn => {

      const level =
        btn.dataset.level ||
        btn.dataset.difficulty;

      btn.classList.toggle(
        "active",
        level === difficulty
      );
    });
}

// ===============================
// PAUSE
// ===============================

function togglePause() {

  if (gameFinished) {
    return;
  }

  paused = !paused;

  playPauseSound();

  const overlay =
    document.getElementById("pauseOverlay") ||
    document.getElementById("pause-overlay");

  if (overlay) {

    overlay.classList.toggle(
      "hidden",
      !paused
    );

    overlay.classList.toggle(
      "show",
      paused
    );
  }

  saveGame();
}

function pauseGame() {
  togglePause();
}

function hidePauseOverlay() {

  const overlay =
    document.getElementById("pauseOverlay") ||
    document.getElementById("pause-overlay");

  if (overlay) {

    overlay.classList.add("hidden");
    overlay.classList.remove("show");
  }
}

// ===============================
// NOTES
// ===============================

function toggleNotes() {

  if (paused || gameFinished) {
    return;
  }

  notesMode = !notesMode;

  playClickSound();

  updateNotesButton();
}

function updateNotesButton() {

  const btn =
    document.getElementById("notesBtn") ||
    document.getElementById("notes-btn");

  if (btn) {

    btn.classList.toggle(
      "active",
      notesMode
    );
  }
}

// ===============================
// SETTINGS
// ===============================

function toggleSettings() {

  const settings =
    document.getElementById("settings");

  if (!settings) {
    return;
  }

  const isHidden =
    settings.classList.contains("hidden");

  if (isHidden) {
    openSettings();
  } else {
    closeSettings();
  }
}

function openSettings() {

  const settings =
    document.getElementById("settings") ||
    document.getElementById("settings-modal");

  if (!settings) {
    return;
  }

  settings.classList.remove("hidden");
  settings.classList.add("show");

  playClickSound();
}

function closeSettings() {

  const settings =
    document.getElementById("settings") ||
    document.getElementById("settings-modal");

  if (!settings) {
    return;
  }

  settings.classList.add("hidden");
  settings.classList.remove("show");
}

function applySettings() {
  saveSettings();
}

function saveSettings() {

  const bg =
    document.getElementById("bgColor") ||
    document.getElementById("bg-color");

  const cell =
    document.getElementById("cellColor") ||
    document.getElementById("cell-color");

  const text =
    document.getElementById("textColor") ||
    document.getElementById("text-color");

  if (bg) {

    document.documentElement
      .style
      .setProperty(
        "--bg",
        bg.value
      );

    localStorage.setItem(
      "sudokuBg",
      bg.value
    );
  }

  if (cell) {

    document.documentElement
      .style
      .setProperty(
        "--cell",
        cell.value
      );

    localStorage.setItem(
      "sudokuCell",
      cell.value
    );
  }

  if (text) {

    document.documentElement
      .style
      .setProperty(
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

function resetSettings() {

  const defaults = {
    bg: "#07152f",
    cell: "#102650",
    text: "#ffffff"
  };

  document.documentElement
    .style
    .setProperty(
      "--bg",
      defaults.bg
    );

  document.documentElement
    .style
    .setProperty(
      "--cell",
      defaults.cell
    );

  document.documentElement
    .style
    .setProperty(
      "--text",
      defaults.text
    );

  localStorage.setItem(
    "sudokuBg",
    defaults.bg
  );

  localStorage.setItem(
    "sudokuCell",
    defaults.cell
  );

  localStorage.setItem(
    "sudokuText",
    defaults.text
  );

  const bg =
    document.getElementById("bgColor");

  const cell =
    document.getElementById("cellColor");

  const text =
    document.getElementById("textColor");

  if (bg) bg.value = defaults.bg;
  if (cell) cell.value = defaults.cell;
  if (text) text.value = defaults.text;

  playClickSound();
}

function loadSettings() {

  const bg =
    localStorage.getItem("sudokuBg");

  const cell =
    localStorage.getItem("sudokuCell");

  const text =
    localStorage.getItem("sudokuText");

  if (bg) {

    document.documentElement
      .style
      .setProperty(
        "--bg",
        bg
      );

    const input =
      document.getElementById("bgColor") ||
      document.getElementById("bg-color");

    if (input) {
      input.value = bg;
    }
  }

  if (cell) {

    document.documentElement
      .style
      .setProperty(
        "--cell",
        cell
      );

    const input =
      document.getElementById("cellColor") ||
      document.getElementById("cell-color");

    if (input) {
      input.value = cell;
    }
  }

  if (text) {

    document.documentElement
      .style
      .setProperty(
        "--text",
        text
      );

    const input =
      document.getElementById("textColor") ||
      document.getElementById("text-color");

    if (input) {
      input.value = text;
    }
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
// SOUND CONTROLS
// ===============================

function toggleSound() {

  soundEnabled = !soundEnabled;

  localStorage.setItem(
    "sudokuSound",
    soundEnabled ? "1" : "0"
  );

  if (soundEnabled) {

    initAudio();
    playClickSound();

    if (musicEnabled) {
      startMusic();
    }

  } else {

    stopMusic();
  }
}

function toggleMusic() {

  musicEnabled = !musicEnabled;

  localStorage.setItem(
    "sudokuMusic",
    musicEnabled ? "1" : "0"
  );

  if (
    musicEnabled &&
    soundEnabled
  ) {

    initAudio();
    startMusic();

  } else {

    stopMusic();
  }
}

// ===============================
// WIN MODAL
// ===============================

function closeWinModal() {
  hideWinModal();
}

function hideWinModal() {

  const modal =
    document.getElementById("winModal") ||
    document.getElementById("win-modal");

  if (modal) {

    modal.classList.add("hidden");
    modal.classList.remove("show");
  }
}

// ===============================
// SAVE GAME
// ===============================

function saveGame() {

  if (
    !solution.length ||
    !puzzle.length ||
    !board.length
  ) {
    return;
  }

  const data = {

    solution,
    puzzle,
    board,

    notes:
      notes.map(row =>
        row.map(set =>
          [...set]
        )
      ),

    history,

    difficulty,
    errors,
    score,
    seconds,

    selectedRow,
    selectedCol,

    notesMode,

    paused: false,
    gameFinished
  };

  try {

    localStorage.setItem(
      "sudokuCurrentGame",
      JSON.stringify(data)
    );

  } catch (error) {

    console.warn(
      "Save game failed:",
      error
    );
  }
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
      Number(data.errors) || 0;

    score =
      Number(data.score) || 0;

    seconds =
      Number(data.seconds) || 0;

    selectedRow =
      Number.isInteger(data.selectedRow)
        ? data.selectedRow
        : -1;

    selectedCol =
      Number.isInteger(data.selectedCol)
        ? data.selectedCol
        : -1;

    notesMode =
      Boolean(data.notesMode);

    paused = false;

    gameFinished =
      Boolean(data.gameFinished);

    // Notes
    if (
      Array.isArray(data.notes) &&
      data.notes.length === 9
    ) {

      notes =
        data.notes.map(row =>
          row.map(values =>
            new Set(
              Array.isArray(values)
                ? values
                : []
            )
          )
        );

    } else {

      notes =
        Array.from(
          { length: 9 },
          () =>
            Array.from(
              { length: 9 },
              () => new Set()
            )
        );
    }

    history =
      Array.isArray(data.history)
        ? data.history
        : [];

    updateDifficultyButtons();
    updateNotesButton();
    updateStats();
    renderBoard();
    updateBestTime();

    if (gameFinished) {

      winGame();

    } else {

      startTimer();

      if (musicEnabled) {
        startMusic();
      }
    }

  } catch (error) {

    console.error(
      "Load game failed:",
      error
    );

    newGame();
  }
}

// ===============================
// KEYBOARD
// ===============================

document.addEventListener(
  "keydown",
  event => {

    if (paused || gameFinished) {
      return;
    }

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

    if (
      key === "ArrowUp" ||
      key === "ArrowDown" ||
      key === "ArrowLeft" ||
      key === "ArrowRight"
    ) {

      event.preventDefault();

      if (
        selectedRow === -1 ||
        selectedCol === -1
      ) {
        selectedRow = 0;
        selectedCol = 0;
        renderBoard();
        return;
      }

      if (key === "ArrowUp") {
        selectedRow =
          Math.max(
            0,
            selectedRow - 1
          );
      }

      if (key === "ArrowDown") {
        selectedRow =
          Math.min(
            8,
            selectedRow + 1
          );
      }

      if (key === "ArrowLeft") {
        selectedCol =
          Math.max(
            0,
            selectedCol - 1
          );
      }

      if (key === "ArrowRight") {
        selectedCol =
          Math.min(
            8,
            selectedCol + 1
          );
      }

      renderBoard();
      return;
    }

    if (
      key.toLowerCase() === "n"
    ) {

      toggleNotes();
      return;
    }

    if (
      key.toLowerCase() === "h"
    ) {

      hint();
      return;
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

  // مهم:
  // HTML فعلی شما onclick دارد.
  // بنابراین دوباره click listener اضافه نمی‌کنیم
  // تا روی اندروید دو بار اجرا نشود.

  // Difficulty
  document
    .querySelectorAll(".difficulty-btn")
    .forEach(btn => {

      btn.addEventListener(
        "pointerup",
        event => {

          event.preventDefault();

          initAudio();

          const level =
            btn.dataset.level ||
            btn.dataset.difficulty;

          if (level) {
            setDifficulty(level);
          }
        }
      );
    });

  // Number pad
  document
    .querySelectorAll(".number-pad button")
    .forEach(btn => {

      btn.addEventListener(
        "pointerup",
        event => {

          event.preventDefault();

          initAudio();

          const onclickText =
            btn.getAttribute("onclick") || "";

          const match =
            onclickText.match(
              /selectNumber\s*\(\s*(\d+)\s*\)/
            );

          if (match) {

            selectNumber(
              Number(match[1])
            );
          }
        }
      );
    });
}

// ===============================
// MOBILE TOUCH SUPPORT
// ===============================

function setupTouchSupport() {

  document.body.style.touchAction =
    "manipulation";

  document
    .querySelectorAll("button")
    .forEach(button => {

      button.style.touchAction =
        "manipulation";

      button.style.webkitTapHighlightColor =
        "transparent";

      button.style.userSelect =
        "none";
    });
}

// ===============================
// FIRST USER INTERACTION
// ===============================

document.addEventListener(
  "pointerdown",
  () => {
    initAudio();
  },
  {
    once: true,
    passive: true
  }
);

// ===============================
// START
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadSettings();

    setupButtons();

    setupTouchSupport();

    loadGame();

  }
);
