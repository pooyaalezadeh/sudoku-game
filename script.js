const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const errorsEl = document.getElementById("errors");
const messageEl = document.getElementById("message");
const timerEl = document.getElementById("timer");
const livesEl = document.getElementById("lives");
const floatingMessage =
document.getElementById("floatingMessage");
let score = 0;
let errors = 0;
let time = 0;
let timerInterval;
let lives = 3;
let isGameOver = false;
const progressValue =
document.getElementById("progressValue"); 
let board = [];
let solution = [];

/* =========================
   🔊 سیستم صوتی (موزیک زمینه + افکت‌ها)
========================= */
let audioCtx;
let bgMusicInterval;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// تابع تولید موزیک زمینه آروم
function startBackgroundMusic() {
    initAudio();
    
    // اگر قبلاً موزیکی پخش می‌شد، قطعش نکن (چون می‌خوایم قطع نشه)
    // stopBackgroundMusic(); // این خط رو حذف کردیم

    // یک ملودی ساده و آروم (نت‌های پیانو-مانند)
    const melody = [
        { freq: 261.63, dur: 0.5 }, // C4
        { freq: 329.63, dur: 0.5 }, // E4
        { freq: 392.00, dur: 0.5 }, // G4
        { freq: 523.25, dur: 1.0 }, // C5
        { freq: 392.00, dur: 0.5 }, // G4
        { freq: 329.63, dur: 0.5 }, // E4
        { freq: 261.63, dur: 1.0 }, // C4
        { freq: 0, dur: 0.5 }       // سکوت
    ];

    let noteIndex = 0;
    let time = audioCtx.currentTime;

    function playNextNote() {
        // شرط isGameOver رو هم حذف کردیم تا موزیک قطع نشه
        // if (isGameOver) return; 

        const note = melody[noteIndex];
        
        if (note.freq > 0) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine'; // صدای نرم
            osc.frequency.value = note.freq;
            
            // تنظیم ولوم برای اینکه آروم باشه
            gain.gain.setValueAtTime(0.05, time); 
            gain.gain.exponentialRampToValueAtTime(0.01, time + note.dur);
            
            osc.start(time);
            osc.stop(time + note.dur);
        }

        time += note.dur;
        noteIndex = (noteIndex + 1) % melody.length;
        
        // تکرار موزیک هر 4 ثانیه
        bgMusicInterval = setTimeout(playNextNote, note.dur * 1000);
    }

    playNextNote();
}

// تابع پخش افکت‌های صوتی (درست، غلط، برد)
function playSound(type) {
    initAudio();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'correct') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);

    } else if (type === 'wrong') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.linearRampToValueAtTime(100, now + 0.15);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);

    } else if (type === 'win') {
        // صدای برد: ملودی پیروزی
        const notes = [523.25, 659.25, 783.99, 1046.50];
        let time = now;
        
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            osc.start(time);
            osc.stop(time + 0.2);
            time += 0.15;
        });
        
        // موزیک زمینه قطع نمی‌شه
    }
}

/* =========================
   ⏱ تایمر
========================= */
function startTimer() {
    clearInterval(timerInterval);
    time = 0;

    timerInterval = setInterval(() => {
        time++;
        timerEl.textContent = "Time: " + time + "s";
    }, 1000);
}

/* =========================
   🧠 الگوریتم سودوکو
========================= */
function isValid(grid, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (grid[row][i] === num) return false;
        if (grid[i][col] === num) return false;
    }

    let startRow = Math.floor(row / 3) * 3;
    let startCol = Math.floor(col / 3) * 3;

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (grid[startRow + r][startCol + c] === num) return false;
        }
    }

    return true;
}

function solveSudoku(grid) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                let numbers = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
                for (let num of numbers) {
                    if (isValid(grid, row, col, num)) {
                        grid[row][col] = num;
                        if (solveSudoku(grid)) return true;
                        grid[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function generateFullBoard() {
    let grid = Array(9).fill().map(() => Array(9).fill(0));
    solveSudoku(grid);
    return grid;
}

function generatePuzzle(sol, remove = 45) {
    let puzzle = sol.map(row => [...row]);
    for (let i = 0; i < remove; i++) {
        let r = Math.floor(Math.random() * 9);
        let c = Math.floor(Math.random() * 9);
        puzzle[r][c] = 0;
    }
    return puzzle;
}

/* =========================
   🧠 رندر و منطق بازی
========================= */
function render() {
    boardEl.innerHTML = "";

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const input = document.createElement("input");
            input.className = "cell";
            input.dataset.row = r;
            input.dataset.col = c;

            if (board[r][c] !== 0) {
                input.value = board[r][c];
                input.classList.add("prefilled");
                input.disabled = true;
                updateProgress();
            } else {
                input.addEventListener("input", (e) => {
                    let val = parseInt(e.target.value);

                    if (val < 1 || val > 9 || isNaN(val)) {
                        e.target.value = "";
                        return;
                    }

                    if (input.dataset.done === "true") return;

                    if (val === solution[r][c]) {
                        // ✅ جواب درست
                        input.classList.add("correct");
                        input.classList.remove("wrong");
                        
                        score++;
                        scoreEl.textContent = score;
                        
                        messageEl.textContent = "Correct ✅";
                        messageEl.style.color = "#00ff88";
                        
                        input.dataset.done = "true";
                        input.classList.add("locked");
                        input.disabled = true;
                        
                        playSound('correct');
                    } else {showToast("اشتباه بود ❌","error");
                        setTimeout(() => {
                            input.classList.remove("wrong");
                            input.value = "";
                            
                        }, 800);
                        // ❌ جواب غلط
                        input.classList.add("wrong");
                        input.classList.remove("correct");
                        
                        errors++;
                        errorsEl.textContent = errors;
                        
                        messageEl.textContent = "Wrong ❌";
                        messageEl.style.color = "#ff5555";
                        
                        lives--;
                        updateLives();
                        
                        playSound('wrong');
                    }

                    checkWin();
                });
            }
            boardEl.appendChild(input);
        }
    }
}

/* =========================
   🏆 بررسی برد
========================= */
function checkWin() {
    const inputs = document.querySelectorAll(".cell");
    let filled = 0;

    inputs.forEach(i => {
        if (i.value !== "") filled++;
    });

    if (filled === 81) {const solved =
        document.querySelectorAll(
        '.cell[data-done="true"]'
        ).length;
        
        if(solved + document.querySelectorAll('.prefilled').length === 81){
           showWinOverlay();
           saveRecord();
        }
       }
}

/* =========================
   🔄 شروع بازی
========================= */
function startGame(level) {
    lives = 3;
    isGameOver = false;
    updateLives();
    
    score = 0;
    errors = 0;
    
    scoreEl.textContent = 0;
    errorsEl.textContent = 0;
    messageEl.textContent = "";

    let full = generateFullBoard();
    solution = full;

    let removeCount = 45;
    if(level === "easy") removeCount = 30;
    if(level === "medium") removeCount = 45;
    if(level === "hard") removeCount = 60;

    board = generatePuzzle(full, removeCount);

    startTimer();
    render();
    
    // شروع موزیک زمینه
    startBackgroundMusic();
}

function updateLives() {
    if (lives === 3) livesEl.textContent = "❤️❤️❤️";
    if (lives === 2) livesEl.textContent = "❤️❤️🤍";
    if (lives === 1) livesEl.textContent = "❤️🤍🤍";
    
    if (lives <= 0 && !isGameOver) {
        isGameOver = true;
        livesEl.textContent = "💀";
        messageEl.textContent = "💀 Game Over! (ادامه بازی...)";
        messageEl.style.color = "red";
        // موزیک زمینه قطع نمی‌شه
    }
}

// شروع بازی
startGame("easy");
function showWinOverlay() {
    const overlay = document.getElementById('winOverlay');
    const confettiContainer = document.getElementById('confettiContainer');
  
    if (!overlay || !confettiContainer) return;
  
    overlay.classList.remove('hidden');
  
    // پاک کردن confetti قبلی
    confettiContainer.innerHTML = '';
  
    // ساخت confetti جدید
    const colors = ['#ff4d4f', '#40a9ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1'];
  
    for (let i = 0; i < 80; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
  
      const left = Math.random() * 100;
      const sizeW = 6 + Math.random() * 8;
      const sizeH = 10 + Math.random() * 16;
      const delay = Math.random() * 0.8;
      const duration = 2.5 + Math.random() * 2.5;
  
      piece.style.left = `${left}%`;
      piece.style.width = `${sizeW}px`;
      piece.style.height = `${sizeH}px`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = `${duration}s`;
      piece.style.animationDelay = `${delay}s`;
      piece.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
  
      confettiContainer.appendChild(piece);
    }
  
    // پخش دوباره confetti بعد از چند ثانیه اگر خواستی
    setTimeout(() => {
      if (overlay.classList.contains('hidden')) return;
      confettiContainer.innerHTML = '';
      for (let i = 0; i < 80; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
  
        const left = Math.random() * 100;
        const sizeW = 6 + Math.random() * 8;
        const sizeH = 10 + Math.random() * 16;
        const delay = Math.random() * 0.8;
        const duration = 2.5 + Math.random() * 2.5;
  
        piece.style.left = `${left}%`;
        piece.style.width = `${sizeW}px`;
        piece.style.height = `${sizeH}px`;
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = `${duration}s`;
        piece.style.animationDelay = `${delay}s`;
        piece.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
  
        confettiContainer.appendChild(piece);
      }
    }, 1200);
  }
  
  function hideWinOverlay() {
    const overlay = document.getElementById('winOverlay');
    if (overlay) overlay.classList.add('hidden');
  }
    // در تابع showWinOverlay یا تابعی که ذرات Confetti را تولید می‌کند:
    function getConfettiColors() {
        const rootStyles = getComputedStyle(document.documentElement);
        const colors = [];
        // سعی کنید تا 4 رنگ اصلی را بخوانید
        for (let i = 1; i <= 4; i++) {
          const color = rootStyles.getPropertyValue(`--confetti-color-${i}`).trim();
          if (color) {
            colors.push(color);
          }
        }
        // اگر رنگ کافی نبود، چند رنگ پیش‌فرض اضافه کنید
        if (colors.length < 3) {
          colors.push('#ADD8E6', '#87CEEB', '#4682B4');
        }
        return colors;
      }
  
      // ... در جای دیگری از کد که ذرات ساخته می‌شوند ...
      const confettiColors = getConfettiColors();
      // حالا از confettiColors برای رنگ دادن به ذرات استفاده کنید
      // مثلاً: new Confetti(x, y, { colors: confettiColors });
      // 1. تعریف تم‌های رنگی
const themes = {
    dark: {
      '--background-color': '#001f4d',
      '--secondary-background': '#003b8e',
      '--board-border-color': 'white',
      '--cell-border-color': 'rgba(255, 255, 255, 0.3)',
      '--cell-background': 'rgba(0, 0, 139, 0.85)', // آبی پررنگ
      '--prefilled-background': 'rgba(255, 255, 255, 0.35)',
      '--number-color': 'white',
      '--predefined-number-color': 'white',
      '--selected-cell-background': 'rgba(0, 70, 255, 0.95)',
      '--card-bg': '#003b8e',
      '--text-color': 'white',
    },
    light: { // یک تم روشن به عنوان مثال
      '--background-color': '#f0f0f0',
      '--secondary-background': '#e0e0e0',
      '--board-border-color': '#333',
      '--cell-border-color': 'rgba(0, 0, 0, 0.2)',
      '--cell-background': 'white',
      '--prefilled-background': 'rgba(0, 0, 0, 0.1)',
      '--number-color': '#333',
      '--predefined-number-color': '#333',
      '--selected-cell-background': '#cceeff',
      '--card-bg': '#d0d0d0',
      '--text-color': '#333',
    },
    // می توانی تم های بیشتری اضافه کنی
    // مثال: تم "سبز"
    green: {
      '--background-color': '#1a4d2e', // سبز تیره
      '--secondary-background': '#4d7c5d', // سبز متوسط
      '--board-border-color': 'white',
      '--cell-border-color': 'rgba(255, 255, 255, 0.4)',
      '--cell-background': 'rgba(60, 179, 113, 0.8)', // سبز متوسط برای سلول
      '--prefilled-background': 'rgba(255, 255, 255, 0.3)',
      '--number-color': 'white',
      '--predefined-number-color': 'white',
      '--selected-cell-background': 'rgba(144, 238, 144, 0.9)', // سبز روشن برای سلول انتخاب شده
      '--card-bg': '#4d7c5d',
      '--text-color': 'white',
    }
  };
  
  // 2. تابعی برای اعمال تم
  function applyTheme(themeName) {
    const selectedTheme = themes[themeName];
    if (!selectedTheme) {
      console.error(`Theme "${themeName}" not found.`);
      return;
    }
  
    const root = document.documentElement; // این همان :root در CSS است
  
    // اعمال هر متغیر رنگی تم انتخاب شده
    for (const property in selectedTheme) {
      root.style.setProperty(property, selectedTheme[property]);
    }
  
    // (اختیاری) ذخیره تم انتخاب شده در localStorage برای ماندگاری
    localStorage.setItem('sudokuTheme', themeName);
  }
  
  // 3. مقداردهی اولیه تم هنگام بارگذاری صفحه
  function initializeGame() {
    // ابتدا تم ذخیره شده در localStorage را چک کن
    const savedTheme = localStorage.getItem('sudokuTheme');
  
    // اگر تم ذخیره شده بود، از آن استفاده کن، در غیر این صورت از تم پیش‌فرض (مثلا dark) استفاده کن
    const initialTheme = savedTheme || 'dark'; // 'dark' تم پیش‌فرض است
  
    applyTheme(initialTheme);
  
    // بقیه کدهای مقداردهی اولیه بازی شما اینجا قرار می‌گیرد
    // مثلاً ساخت جدول سودوکو، تولید اعداد و ...
    console.log(`Game initialized with theme: ${initialTheme}`);
  }
  
  // 4. فراخوانی تابع مقداردهی اولیه هنگام بارگذاری صفحه
  // مطمئن شو که این کد بعد از تعریف توابع بالا و قبل از بستن تگ <script> قرار دارد
  // یا اینکه در یک فایل js جداگانه هست و به درستی به HTML لینک شده است.
  document.addEventListener('DOMContentLoaded', initializeGame);
  
  // --- مثال: دکمه‌ای برای تغییر تم ---
  // فرض کنید یک دکمه با id="theme-switcher" در HTML داری
  // <button id="theme-switcher">تغییر تم</button>
  
  // const themeSwitcherButton = document.getElementById('theme-switcher');
  // if (themeSwitcherButton) {
  //   themeSwitcherButton.addEventListener('click', () => {
  //     const currentTheme = localStorage.getItem('sudokuTheme') || 'dark';
  //     let nextTheme = 'dark'; // تم بعدی پیش‌فرض
  //     if (currentTheme === 'dark') {
  //       nextTheme = 'green'; // اگر الان dark هست، برو به green
  //     } else if (currentTheme === 'green') {
  //       nextTheme = 'light'; // اگر الان green هست، برو به light
  //     } else { // اگر currentTheme light هست یا تعریف نشده
  //       nextTheme = 'dark'; // برو به dark
  //     }
  //     applyTheme(nextTheme);
  //     console.log(`Theme changed to: ${nextTheme}`);
  //   });
  // }
  
  // --- برای اینکه بفهمیم کد درست کار میکنه یا نه ---
  // میتونی بعد از اعمال تم، چند تا لاگ بزنی:
  function testThemeApplication() {
    const cellBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--cell-background');
    const numberColor = getComputedStyle(document.documentElement).getPropertyValue('--number-color');
    console.log("Current --cell-background:", cellBackgroundColor);
    console.log("Current --number-color:", numberColor);
  
    // همچنین میتونی مستقیما روی یک عنصر اعمال شده تست کنی
    const firstCell = document.querySelector('.cell');
    if (firstCell) {
      console.log("Background of first cell:", getComputedStyle(firstCell).backgroundColor);
    }
  }
  
  // میتونی testThemeApplication() را بعد از applyTheme فراخوانی کنی تا نتیجه رو ببینی
  // مثلا داخل initializeGame بعد از applyTheme:
  // initializeGame() {
  //   ...
  //   applyTheme(initialTheme);
  //   testThemeApplication(); // تست بعد از اعمال تم
  //   ...
  // }
  document.addEventListener("DOMContentLoaded", () => {

    const saveBtn = document.getElementById("save-theme-btn");
    const resetBtn = document.getElementById("reset-theme-btn");

    const colorPickers = document.querySelectorAll(
        "#theme-settings input[type='color']"
    );

    // بارگذاری رنگ‌های ذخیره شده
    colorPickers.forEach(picker => {
        const cssVar = picker.dataset.cssVar;

        const savedColor = localStorage.getItem(cssVar);

        if (savedColor) {
            picker.value = savedColor;
            document.documentElement.style.setProperty(cssVar, savedColor);
        }
    });

    // ذخیره رنگ‌ها
    saveBtn.addEventListener("click", () => {

        colorPickers.forEach(picker => {

            const cssVar = picker.dataset.cssVar;
            const color = picker.value;

            document.documentElement.style.setProperty(cssVar, color);

            localStorage.setItem(cssVar, color);
        });

        alert("تنظیمات ذخیره شد ✅");
    });

    // بازگشت به پیش فرض
    resetBtn.addEventListener("click", () => {

        localStorage.clear();

        location.reload();
    });
});
function solveBoard() {
    // کپی از solution (جواب کامل)
    board = solution.map(row => [...row]);

    render();

    messageEl.textContent = "🧠 حل شد!";
    messageEl.style.color = "gold";

    playSound("win");
}
function saveRecord() {

    const records =
        JSON.parse(
            localStorage.getItem("sudokuRecords")
        ) || [];

    records.push({
        score: score,
        time: time,
        date: new Date().toLocaleDateString()
    });

    records.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.time - b.time;
    });

    const top10 = records.slice(0, 10);

    localStorage.setItem(
        "sudokuRecords",
        JSON.stringify(top10)
    );

    loadRecords();
}
function showToast(text,type){

    floatingMessage.textContent = text;

    floatingMessage.className =
        type === "success"
        ? "show success-msg"
        : "show error-msg";

    setTimeout(()=>{
        floatingMessage.className="";
    },1500);
}
function updateProgress(){

    let done =
    document.querySelectorAll(
      ".cell[data-done='true']"
    ).length;

    let percent =
    Math.floor((done / 81) * 100);

    progressValue.textContent =
    percent;
}
  
    