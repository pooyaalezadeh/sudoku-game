const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const errorsEl = document.getElementById("errors");
const timerEl = document.getElementById("timer");
const bestTimeEl = document.getElementById("bestTime");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

let board = [];
let solution = [];
let originalBoard = [];

let selectedCell = null;
let score = 0;
let errors = 0;
let time = 0;
let timer = null;

let currentLevel = "easy";
let notesMode = false;
let paused = false;
let gameFinished = false;

let history = [];

let notes = Array.from(
  { length: 81 },
  () => new Set()
);

/* =========================
   DIFFICULTY
========================= */

const difficulty = {
  easy: 38,
  medium: 31,
  hard: 25,
  expert: 21
};

/* =========================
   START GAME
========================= */

function startGame(level = "easy") {

  currentLevel = level;

  document.querySelectorAll(".difficulty-btn").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.level === level
    );
  });

  newGame();
}

/* =========================
   NEW GAME
========================= */

function newGame() {

  clearInterval(timer);

  score = 0;
  errors = 0;
  time = 0;

  selectedCell = null;
  paused = false;
  gameFinished = false;

  history = [];

  notes = Array.from(
    { length: 81 },
    () => new Set()
  );

  solution = generateSolution();

  board = solution.map(row => [...row]);

  removeNumbers(
    board,
    difficulty[currentLevel]
  );

  originalBoard = board.map(row => [...row]);

  updateStats();
  renderBoard();
  startTimer();
  saveGame();
}

/* =========================
   GENERATE SUDOKU
========================= */

function generateSolution() {

  const grid = Array.from(
    { length: 9 },
    () => Array(9).fill(0)
  );

  solveGrid(grid);

  return grid;
}

function solveGrid(grid) {

  const empty = findEmpty(grid);

  if (!empty) {
    return true;
  }

  const [row, col] = empty;

  const numbers = shuffle([
    1,2,3,4,5,6,7,8,9
  ]);

  for (const num of numbers) {

    if (
      isValidMove(
        grid,
        row,
        col,
        num
      )
    ) {

      grid[row][col] = num;

      if (solveGrid(grid)) {
        return true;
      }

      grid[row][col] = 0;
    }
  }

  return false;
}

/* =========================
   FIND EMPTY
========================= */

function findEmpty(grid) {

  for (let row = 0; row < 9; row++) {

    for (let col = 0; col < 9; col++) {

      if (grid[row][col] === 0) {
        return [row, col];
      }

    }
  }

  return null;
}

/* =========================
   VALIDATE MOVE
========================= */

function isValidMove(
  grid,
  row,
  col,
  num
) {

  for (let c = 0; c < 9; c++) {

    if (
      c !== col &&
      grid[row][c] === num
    ) {
      return false;
    }
  }

  for (let r = 0; r < 9; r++) {

    if (
      r !== row &&
      grid[r][col] === num
    ) {
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

      if (
        (r !== row || c !== col) &&
        grid[r][c] === num
      ) {
        return false;
      }

    }
  }

  return true;
}

/* =========================
   REMOVE NUMBERS
========================= */

function removeNumbers(grid, clues) {

  const cells = [];

  for (let i = 0; i < 81; i++) {
    cells.push(i);
  }

  shuffle(cells);

  const removeCount = 81 - clues;

  for (
    let i = 0;
    i < removeCount;
    i++
  ) {

    const index = cells[i];

    const row =
      Math.floor(index / 9);

    const col =
      index % 9;

    grid[row][col] = 0;
  }
}

/* =========================
   RENDER BOARD
========================= */

function renderBoard() {

  boardEl.innerHTML = "";

  for (let i = 0; i < 81; i++) {

    const row =
      Math.floor(i / 9);

    const col =
      i % 9;

    const cell =
      document.createElement("div");

    cell.className = "cell";

    cell.dataset.index = i;
    cell.dataset.row = row;
    cell.dataset.col = col;

    if (
      originalBoard[row][col] !== 0
    ) {

      cell.textContent =
        originalBoard[row][col];

      cell.classList.add(
        "prefilled"
      );

    } else if (
      board[row][col] !== 0
    ) {

      cell.textContent =
        board[row][col];
    }

    renderNotes(cell, i);

    cell.addEventListener(
      "click",
      () => selectCell(i)
    );

    boardEl.appendChild(cell);
  }

  updateHighlights();
  updateProgress();
}

/* =========================
   RENDER NOTES
========================= */

function renderNotes(cell, index) {

  if (
    notes[index].size === 0 ||
    board[
      Math.floor(index / 9)
    ][index % 9] !== 0
  ) {
    return;
  }

  const notesBox =
    document.createElement("div");

  notesBox.className = "notes";

  for (let n = 1; n <= 9; n++) {

    const note =
      document.createElement("span");

    note.className = "note";

    if (notes[index].has(n)) {
      note.textContent = n;
    }

    notesBox.appendChild(note);
  }

  cell.appendChild(notesBox);
}

/* =========================
   SELECT CELL
========================= */

function selectCell(index) {

  if (
    paused ||
    gameFinished
  ) {
    return;
  }

  const row =
    Math.floor(index / 9);

  const col =
    index % 9;

  selectedCell = index;

  updateHighlights();

  if (
    originalBoard[row][col] !== 0
  ) {
    return;
  }
}

/* =========================
   HIGHLIGHTS
========================= */

function updateHighlights() {

  const cells =
    document.querySelectorAll(".cell");

  cells.forEach(cell => {

    cell.classList.remove(
      "selected",
      "highlight",
      "same-number"
    );

  });

  if (selectedCell === null) {
    return;
  }

  const selected =
    cells[selectedCell];

  if (!selected) {
    return;
  }

  const row =
    Number(selected.dataset.row);

  const col =
    Number(selected.dataset.col);

  const selectedValue =
    board[row][col];

  cells.forEach(cell => {

    const r =
      Number(cell.dataset.row);

    const c =
      Number(cell.dataset.col);

    const sameBox =
      Math.floor(r / 3) === Math.floor(row / 3) &&
      Math.floor(c / 3) === Math.floor(col / 3);

    if (
      r === row ||
      c === col ||
      sameBox
    ) {

      cell.classList.add(
        "highlight"
      );
    }

    if (
      selectedValue !== 0 &&
      board[r][c] === selectedValue
    ) {

      cell.classList.add(
        "same-number"
      );
    }

  });

  selected.classList.add(
    "selected"
  );
}

/* =========================
   SELECT NUMBER
========================= */

function selectNumber(num) {

  if (
    selectedCell === null ||
    paused ||
    gameFinished
  ) {
    return;
  }

  const row =
    Math.floor(selectedCell / 9);

  const col =
    selectedCell % 9;

  if (
    originalBoard[row][col] !== 0
  ) {
    return;
  }

  /* NOTES */

  if (notesMode) {

    if (
      notes[selectedCell].has(num)
    ) {

      notes[selectedCell].delete(num);

    } else {

      notes[selectedCell].add(num);
    }

    renderBoard();

    return;
  }

  /* SAME NUMBER */

  if (
    board[row][col] === num
  ) {
    return;
  }

  history.push({
    index: selectedCell,
    previous: board[row][col],
    score: score,
    errors: errors
  });

  /* WRONG */

  if (
    solution[row][col] !== num
  ) {

    errors++;

    score =
      Math.max(
        0,
        score - 10
      );

    flashCell(
      selectedCell,
      "error"
    );

    updateStats();

    if (errors >= 3) {

      errors = 3;

      setTimeout(() => {

        alert(
          "❌ سه خطا کردی! بازی دوباره شروع می‌شود."
        );

        newGame();

      }, 400);

      return;
    }

    saveGame();

    return;
  }

  /* CORRECT */

  board[row][col] = num;

  score += 100;

  notes[selectedCell].clear();

  removeNumberFromNotes(
    num,
    row,
    col
  );

  flashCell(
    selectedCell,
    "correct"
  );

  renderBoard();

  updateStats();
  saveGame();

  checkWin();
}

/* =========================
   REMOVE NUMBER FROM NOTES
========================= */

function removeNumberFromNotes(
  num,
  row,
  col
) {

  for (let i = 0; i < 81; i++) {

    const r =
      Math.floor(i / 9);

    const c =
      i % 9;

    const sameBox =
      Math.floor(r / 3) === Math.floor(row / 3) &&
      Math.floor(c / 3) === Math.floor(col / 3);

    if (
      r === row ||
      c === col ||
      sameBox
    ) {

      notes[i].delete(num);
    }
  }
}

/* =========================
   ERASE
========================= */

function eraseCell() {

  if (
    selectedCell === null ||
    paused ||
    gameFinished
  ) {
    return;
  }

  const row =
    Math.floor(selectedCell / 9);

  const col =
    selectedCell % 9;

  if (
    originalBoard[row][col] !== 0
  ) {
    return;
  }

  if (
    board[row][col] === 0
  ) {
    return;
  }

  history.push({
    index: selectedCell,
    previous: board[row][col],
    score: score,
    errors: errors
  });

  board[row][col] = 0;

  renderBoard();
  updateStats();
  saveGame();
}

/* =========================
   UNDO
========================= */

function undoMove() {

  if (
    history.length === 0 ||
    paused ||
    gameFinished
  ) {
    return;
  }

  const move =
    history.pop();

  const row =
    Math.floor(move.index / 9);

  const col =
    move.index % 9;

  board[row][col] =
    move.previous;

  score =
    move.score;

  errors =
    move.errors;

  selectedCell =
    move.index;

  renderBoard();
  updateStats();
  saveGame();
}

/* =========================
   HINT
========================= */

function useHint() {

  if (
    paused ||
    gameFinished
  ) {
    return;
  }

  const emptyCells = [];

  for (let i = 0; i < 81; i++) {

    const row =
      Math.floor(i / 9);

    const col =
      i % 9;

    if (
      originalBoard[row][col] === 0 &&
      board[row][col] === 0
    ) {

      emptyCells.push(i);
    }
  }

  if (
    emptyCells.length === 0
  ) {
    return;
  }

  const index =
    emptyCells[
      Math.floor(
        Math.random() *
        emptyCells.length
      )
    ];

  const row =
    Math.floor(index / 9);

  const col =
    index % 9;

  selectedCell = index;

  history.push({
    index: index,
    previous: 0,
    score: score,
    errors: errors
  });

  board[row][col] =
    solution[row][col];

  score =
    Math.max(
      0,
      score - 25
    );

  notes[index].clear();

  removeNumberFromNotes(
    solution[row][col],
    row,
    col
  );

  renderBoard();
  updateStats();
  saveGame();

  flashCell(
    index,
    "correct"
  );

  checkWin();
}

/* =========================
   NOTES MODE
========================= */

function toggleNotes() {

  notesMode =
    !notesMode;

  document
    .getElementById("notesBtn")
    .classList.toggle(
      "active",
      notesMode
    );
}

/* =========================
   TIMER
========================= */

function startTimer() {

  clearInterval(timer);

  timer =
    setInterval(() => {

      if (
        paused ||
        gameFinished
      ) {
        return;
      }

      time++;

      updateTimer();

      if (time % 5 === 0) {
        saveGame();
      }

    }, 1000);
}

function updateTimer() {

  timerEl.textContent =
    formatTime(time);
}

/* =========================
   UPDATE STATS
========================= */

function updateStats() {

  scoreEl.textContent =
    score;

  errorsEl.textContent =
    `${errors} / 3`;

  updateTimer();
  updateProgress();
  loadBestTime();
}

/* =========================
   PROGRESS
========================= */

function updateProgress() {

  let filled = 0;

  for (let r = 0; r < 9; r++) {

    for (let c = 0; c < 9; c++) {

      if (
        board[r][c] !== 0
      ) {
        filled++;
      }
    }
  }

  const percent =
    Math.round(
      (filled / 81) * 100
    );

  progressBar.style.width =
    percent + "%";

  progressText.textContent =
    percent + "%";
}

/* =========================
   CHECK WIN
========================= */

function checkWin() {

  for (let r = 0; r < 9; r++) {

    for (let c = 0; c < 9; c++) {

      if (
        board[r][c] !==
        solution[r][c]
      ) {
        return;
      }
    }
  }

  gameFinished = true;

  clearInterval(timer);

  score +=
    Math.max(
      100,
      1000 - time * 2
    );

  updateStats();

  const best =
    localStorage.getItem(
      `sudokuBest_${currentLevel}`
    );

  if (
    !best ||
    time < Number(best)
  ) {

    localStorage.setItem(
      `sudokuBest_${currentLevel}`,
      time
    );
  }

  loadBestTime();

  document.getElementById(
    "finalScore"
  ).textContent = score;

  document.getElementById(
    "finalTime"
  ).textContent =
    formatTime(time);

  setTimeout(() => {

    document
      .getElementById("winModal")
      .classList.remove(
        "hidden"
      );

  }, 500);
}

/* =========================
   BEST TIME
========================= */

function loadBestTime() {

  const best =
    localStorage.getItem(
      `sudokuBest_${currentLevel}`
    );

  if (!best) {

    bestTimeEl.textContent =
      "--:--";

    return;
  }

  bestTimeEl.textContent =
    formatTime(
      Number(best)
    );
}

/* =========================
   FORMAT TIME
========================= */

function formatTime(seconds) {

  const minutes =
    Math.floor(
      seconds / 60
    );

  const secs =
    seconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );
}

/* =========================
   PAUSE
========================= */

function pauseGame() {

  if (gameFinished) {
    return;
  }

  paused =
    !paused;

  document
    .getElementById(
      "pauseOverlay"
    )
    .classList.toggle(
      "hidden",
      !paused
    );
}

/* =========================
   SETTINGS
========================= */

function toggleSettings() {

  document
    .getElementById(
      "settings"
    )
    .classList.toggle(
      "hidden"
    );
}

function applySettings() {

  const bg =
    document.getElementById(
      "bgColor"
    ).value;

  const cell =
    document.getElementById(
      "cellColor"
    ).value;

  const text =
    document.getElementById(
      "textColor"
    ).value;

  document.documentElement.style
    .setProperty(
      "--bg",
      bg
    );

  document.documentElement.style
    .setProperty(
      "--cell",
      cell
    );

  document.documentElement.style
    .setProperty(
      "--text",
      text
    );

  localStorage.setItem(
    "sudokuSettings",
    JSON.stringify({
      bg,
      cell,
      text
    })
  );

  toggleSettings();
}

function resetSettings() {

  const defaults = {
    bg: "#07152f",
    cell: "#102650",
    text: "#ffffff"
  };

  document.documentElement.style
    .setProperty(
      "--bg",
      defaults.bg
    );

  document.documentElement.style
    .setProperty(
      "--cell",
      defaults.cell
    );

  document.documentElement.style
    .setProperty(
      "--text",
      defaults.text
    );

  document.getElementById(
    "bgColor"
  ).value = defaults.bg;

  document.getElementById(
    "cellColor"
  ).value = defaults.cell;

  document.getElementById(
    "textColor"
  ).value = defaults.text;

  localStorage.setItem(
    "sudokuSettings",
    JSON.stringify(
      defaults
    )
  );
}

function loadSettings() {

  const saved =
    localStorage.getItem(
      "sudokuSettings"
    );

  if (!saved) {
    return;
  }

  try {

    const settings =
      JSON.parse(saved);

    document.documentElement.style
      .setProperty(
        "--bg",
        settings.bg
      );

    document.documentElement.style
      .setProperty(
        "--cell",
        settings.cell
      );

    document.documentElement.style
      .setProperty(
        "--text",
        settings.text
      );

    document.getElementById(
      "bgColor"
    ).value = settings.bg;

    document.getElementById(
      "cellColor"
    ).value = settings.cell;

    document.getElementById(
      "textColor"
    ).value = settings.text;

  } catch (error) {

    console.log(
      "Settings error:",
      error
    );
  }
}

/* =========================
   SAVE GAME
========================= */

function saveGame() {

  if (gameFinished) {
    return;
  }

  const data = {
    board: board,
    solution: solution,
    originalBoard: originalBoard,
    score: score,
    errors: errors,
    time: time,
    currentLevel: currentLevel,
    selectedCell: selectedCell,
    notes: notes.map(
      set => [...set]
    )
  };

  localStorage.setItem(
    "sudokuCurrentGame",
    JSON.stringify(data)
  );
}

/* =========================
   LOAD GAME
========================= */

function loadGame() {

  const saved =
    localStorage.getItem(
      "sudokuCurrentGame"
    );

  if (!saved) {
    return false;
  }

  try {

    const data =
      JSON.parse(saved);

    if (
      !data.board ||
      !data.solution ||
      !data.originalBoard
    ) {
      return false;
    }

    board =
      data.board;

    solution =
      data.solution;

    originalBoard =
      data.originalBoard;

    score =
      data.score || 0;

    errors =
      data.errors || 0;

    time =
      data.time || 0;

    currentLevel =
      data.currentLevel || "easy";

    selectedCell =
      data.selectedCell ?? null;

    notes =
      data.notes
        ? data.notes.map(
            arr => new Set(arr)
          )
        : Array.from(
            { length: 81 },
            () => new Set()
          );

    document
      .querySelectorAll(
        ".difficulty-btn"
      )
      .forEach(btn => {

        btn.classList.toggle(
          "active",
          btn.dataset.level ===
          currentLevel
        );

      });

    renderBoard();
    updateStats();
    startTimer();

    return true;

  } catch (error) {

    console.log(
      "Load error:",
      error
    );

    return false;
  }
}

/* =========================
   CLOSE WIN
========================= */

function closeWinModal() {

  document
    .getElementById(
      "winModal"
    )
    .classList.add(
      "hidden"
    );
}

/* =========================
   CELL EFFECT
========================= */

function flashCell(
  index,
  className
) {

  const cell =
    document.querySelector(
      `.cell[data-index="${index}"]`
    );

  if (!cell) {
    return;
  }

  cell.classList.add(
    className
  );

  setTimeout(() => {

    cell.classList.remove(
      className
    );

  }, 600);
}

/* =========================
   SHUFFLE
========================= */

function shuffle(array) {

  const arr =
    [...array];

  for (
    let i = arr.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

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

/* =========================
   KEYBOARD
========================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      paused ||
      gameFinished
    ) {
      return;
    }

    if (
      event.key >= "1" &&
      event.key <= "9"
    ) {

      selectNumber(
        Number(event.key)
      );

      return;
    }

    if (
      event.key === "Backspace" ||
      event.key === "Delete"
    ) {

      eraseCell();

      return;
    }

    if (
      event.key.toLowerCase() === "z" &&
      (event.ctrlKey || event.metaKey)
    ) {

      event.preventDefault();

      undoMove();
    }

  }
);

/* =========================
   INIT
========================= */

loadSettings();

if (!loadGame()) {
  startGame("easy");
}
