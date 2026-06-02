const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const errorsEl = document.getElementById("errors");
const timerEl = document.getElementById("timer");

let board=[], solution=[];
let score=0, errors=0, time=0, timer;

// ================= MUSIC =================
let audioCtx;

function sound(freq){
  if(!audioCtx) audioCtx=new AudioContext();

  const o=audioCtx.createOscillator();
  const g=audioCtx.createGain();

  o.connect(g);
  g.connect(audioCtx.destination);

  o.frequency.value=freq;
  g.gain.value=0.05;

  o.start();
  o.stop(audioCtx.currentTime+0.1);
}

// background music
function music(){
  const notes=[261,329,392,523];
  let i=0;

  setInterval(()=>{
    sound(notes[i%4]);
    i++;
  },700);
}

// ================= SUDOKU =================
function generate(){
  let g=Array(9).fill().map(()=>Array(9).fill(0));

  function ok(r,c,n){
    for(let i=0;i<9;i++)
      if(g[r][i]==n||g[i][c]==n) return false;

    let sr=Math.floor(r/3)*3, sc=Math.floor(c/3)*3;
    for(let i=0;i<3;i++)
      for(let j=0;j<3;j++)
        if(g[sr+i][sc+j]==n) return false;

    return true;
  }

  function solve(){
    for(let r=0;r<9;r++){
      for(let c=0;c<9;c++){
        if(g[r][c]==0){
          let nums=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-0.5);

          for(let n of nums){
            if(ok(r,c,n)){
              g[r][c]=n;
              if(solve()) return true;
              g[r][c]=0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve();
  return g;
}

function make(sol){
  let p=sol.map(r=>[...r]);
  for(let i=0;i<45;i++){
    let r=Math.random()*9|0;
    let c=Math.random()*9|0;
    p[r][c]=0;
  }
  return p;
}

// ================= GAME =================
function startGame(){
  score=0; errors=0; time=0;

  scoreEl.textContent=0;
  errorsEl.textContent=0;

  clearInterval(timer);
  timer=setInterval(()=>{
    timerEl.textContent=++time;
  },1000);

  solution=generate();
  board=make(solution);

  render();
  music();

  saveGame();
}

// ================= RENDER =================
function render(){
  boardEl.innerHTML="";

  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){

      let cell=document.createElement("input");
      cell.className="cell";

      if(board[r][c]){
        cell.value=board[r][c];
        cell.disabled=true;
        cell.classList.add("prefilled");
      } else {
        cell.addEventListener("input",e=>{
          let v=+e.target.value;

          if(v===solution[r][c]){
            score++;
            scoreEl.textContent=score;
            sound(600);
            cell.disabled=true;
          } else {
            errors++;
            errorsEl.textContent=errors;
            sound(200);
            cell.value="";
          }
          saveGame();
        });
      }

      boardEl.appendChild(cell);
    }
  }
}

// ================= SAVE / CONTINUE =================
function saveGame(){
  localStorage.setItem("sudoku",JSON.stringify({
    board,solution,score,errors,time
  }));
}

function continueGame(){
  let data=JSON.parse(localStorage.getItem("sudoku"));
  if(!data) return;

  board=data.board;
  solution=data.solution;
  score=data.score;
  errors=data.errors;
  time=data.time;

  render();
}

// ================= SETTINGS =================
function toggleSettings(){
  document.getElementById("settings").classList.toggle("hidden");
}

function applySettings(){
  let bg=document.getElementById("bgColor").value;
  let cell=document.getElementById("cellColor").value;
  let text=document.getElementById("textColor").value;

  document.documentElement.style.setProperty("--bg",bg);
  document.documentElement.style.setProperty("--cell",cell);
  document.documentElement.style.setProperty("--text",text);

  localStorage.setItem("theme",JSON.stringify({bg,cell,text}));
}

function loadSettings(){
  let t=JSON.parse(localStorage.getItem("theme"));
  if(!t) return;

  document.documentElement.style.setProperty("--bg",t.bg);
  document.documentElement.style.setProperty("--cell",t.cell);
  document.documentElement.style.setProperty("--text",t.text);
}

function resetSettings(){
  localStorage.removeItem("theme");
  location.reload();
}

// INIT
loadSettings();