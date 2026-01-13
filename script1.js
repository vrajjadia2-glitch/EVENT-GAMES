/*************************************************
 * SYSTEM OVERRIDE – FINAL JS
 * Author: Code & Conquer x Stealscape
 * Purpose: System Override Game Logic
 *************************************************/
                           

/* =================================================
   GLOBAL STATE VARIABLES
   ================================================= */

// ---- TEAM / FLOW ----
let selectedTeam = null;

// ---- TIMER ----
let timeElapsed = 0;
let timerInterval = null;

// ---- ATTEMPTS & RESETS ----
let attemptsLeft = 4;          // global attempts
let resetCount = 0;
const MAX_RESETS = 3;

// ---- RUN CONTROL ----
let runIndex = 0;              // which run is active (0 / 1)
const TOTAL_RUNS = 2;          // sirf 2 runs demo ke liye

// ---- MODULE STATE ----
let solved = [false, false, false, false, false];   // 5 modules
let passwordDigits = ["_", "_", "_", "_", "_"]; // 5 digits

/* =================================================
   VOLUNTEER PASSWORD (STATIC – physical volunteer)
   ================================================= */
const VOLUNTEER_PASSWORD = "PRAK2026"; // volunteer ke paas rahega

/* =================================================
   QUESTION BANK (DEMO – 2 RUNS ONLY)
   Structure yaad rakh: aage tu 96 questions dalega
   ================================================= */

const runs = [
  // ================= RUN 1 =================
  [
    {
      // MODULE 1 – LOGICAL RIDDLE
      type: "LOGICAL RIDDLE",
      q: "What gets wetter the more it dries?",
      o: ["Sponge", "Water", "Shadow"],
      a: 0
    },
    {
      // MODULE 2 – LOGICAL REASONING
      type: "LOGICAL REASONING",
      q: "1, 4, 9, 16, ?",
      o: ["20", "25", "36"],
      a: 1
    },
    {
      // MODULE 3 – TECH
      type: "TECH",
      q: "Which data structure works on LIFO?",
      o: ["Queue", "Stack", "Array"],
      a: 1
    }
    // MODULE 4 – GENERAL KNOWLEDGE
    ,{
      type: "GENERAL KNOWLEDGE",
      q: "What is the capital of Australia?",
      o: ["Sydney", "Melbourne", "Canberra"],
      a: 2
    }
    // MODULE 5 – PUZZLE (FUTURE)
    ,{
      type: "PUZZLE",
      q: "A system shows RED for lies and GREEN for truth. If I say 'The next statement is true' and the next statement is 'The previous statement is false', what color will the system show?",
      o: ["RED", "GREEN", "BLUE"],
      a: 1
    }
  ],

  // ================= RUN 2 =================
  [
    {
      // MODULE 1 – LOGICAL RIDDLE
      type: "LOGICAL RIDDLE",
      q: "What has keys but can't open locks?",
      o: ["Map", "Piano", "Password"],
      a: 1
    },
    {
      // MODULE 2 – LOGICAL REASONING
      type: "LOGICAL REASONING",
      q: "If ALL BLOOPS are RAZZIES, all RAZZIES are LUPPS. Are all BLOOPS LUPPS?",
      o: ["Yes", "No", "Can't say"],
      a: 0
    },
    {
      // MODULE 3 – TECH (MASTER stays same in future)
      type: "TECH",
      q: "Default port of HTTP?",
      o: ["21", "80", "443"],
      a: 1
    }
    // MODULE 4 – GENERAL KNOWLEDGE
    ,{
      type: "GENERAL KNOWLEDGE",
      q: "Who wrote '1984'?",
      o: ["George Orwell", "Aldous Huxley", "Ray Bradbury"],
      a: 0
    }
    // MODULE 5 – PUZZLE (FUTURE)
    ,{
      type: "PUZZLE",
      q: "What is the next number in the sequence: 1, 1, 2, 3, 5, 8?",
      o: ["10", "12", "13"],
      a: 2
    }
  ]
];

/* =================================================
   DOM READY – ENTRY POINT (MUST BE TOP)
   ================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- SCREENS ---------- */
  const teamScreen = document.getElementById("teamScreen");
  const volunteerScreen = document.getElementById("volunteerScreen");
  const systemScreen = document.getElementById("systemScreen");
  const successScreen = document.getElementById("successScreen");
  const eliminationScreen = document.getElementById("eliminationScreen");

  /* ---------- UI ELEMENTS ---------- */
  const teamNameEl = document.getElementById("teamName");
  const timerEl = document.getElementById("timer");
  const attemptsEl = document.getElementById("attempts");
  const resetsEl = document.getElementById("resets");

  const questionOverlay = document.getElementById("questionOverlay");
  const questionTitle = document.getElementById("questionTitle");
  const questionText = document.getElementById("questionText");
  const optionBtns = document.querySelectorAll(".option");

  const digits = document.querySelectorAll(".digit");

  /* =================================================
     TEAM SELECTION (8 teams easily addable)
     ================================================= */
  document.querySelectorAll(".team-btn").forEach(btn => {
    btn.onclick = () => {
      selectedTeam = btn.dataset.team;
      teamNameEl.textContent = "TEAM " + selectedTeam;

      teamScreen.classList.remove("active");
      volunteerScreen.classList.add("active");
    };
  });

  /* =================================================
     VOLUNTEER AUTH (ANTI-CHEAT)
     ================================================= */
  document.getElementById("verifyVolunteer").onclick = () => {
    const input = document.getElementById("volunteerInput").value;
    const error = document.getElementById("volunteerError");

    if (input === VOLUNTEER_PASSWORD) {
      volunteerScreen.classList.remove("active");
      systemScreen.classList.add("active");
      startTimer();
    } else {
      error.textContent = "Invalid authorization code";
    }
  };

  /* =================================================
     MODULE OPEN BUTTONS
     ================================================= */
  document.querySelectorAll(".open-module").forEach((btn, idx) => {
    btn.onclick = () => openQuestion(idx);
  });

  /* =================================================
     FUNCTIONS
     ================================================= */

  // ---------- TIMER ----------
  function startTimer() {
    timerInterval = setInterval(() => {
      timeElapsed++;
      timerEl.textContent = `Time: ${timeElapsed}s`;

      // Hint windows
      if (timeElapsed === 600) alert("HINT: Assumptions are dangerous.");
      if (timeElapsed === 1200) alert("HINT: Think simpler.");

    }, 1000);
  }

  // ---------- OPEN QUESTION ----------
  function openQuestion(moduleIndex) {
    if (solved[moduleIndex]) return;

    const q = runs[runIndex][moduleIndex];
    questionTitle.textContent = `Module ${moduleIndex + 1} – ${q.type}`;
    questionText.textContent = q.q;

    optionBtns.forEach((btn, i) => {
      btn.textContent = q.o[i];
      btn.onclick = () => checkAnswer(i, q.a, moduleIndex);
    });

    questionOverlay.classList.add("active");
  }

  // ---------- ANSWER CHECK ----------
  function checkAnswer(selected, correct, moduleIndex) {

  // 🔴 LAST LIFE CHECK (MOST IMPORTANT)
  if (
    attemptsLeft === 1 &&          // last attempt
    resetCount === MAX_RESETS - 1 &&// last reset already used
    selected !== correct           // answer is WRONG
  ) {
    // Direct elimination – NO animation, NO digit
    eliminate();
    return;
  }

  // Disable buttons to prevent spam
  optionBtns.forEach(btn => btn.disabled = true);

  // ✅ CORRECT ANSWER
  if (selected === correct) {
    optionBtns[selected].classList.add("correct");

    const digit = Math.floor(Math.random() * 9) + 1;
    passwordDigits[moduleIndex] = digit;
    digits[moduleIndex].textContent = digit;

    setTimeout(() => {
      optionBtns.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove("correct");
      });

      solved[moduleIndex] = true;
      questionOverlay.classList.remove("active");
      checkSuccess();
    }, 700);

  }
  // ❌ WRONG ANSWER
  else {
    optionBtns[selected].classList.add("wrong");
    attemptsLeft--;
    attemptsEl.textContent = `Attempts Left: ${attemptsLeft}`;

    setTimeout(() => {
      optionBtns.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove("wrong");
      });

      // Normal reset flow
      if (attemptsLeft <= 0) {
        resetSystem();
      }
    }, 600);
  }
}


  // ---------- RESET SYSTEM ----------
  function resetSystem() {
    resetCount++;
    resetsEl.textContent = `Resets Used: ${resetCount}/3`;

    if (resetCount >= MAX_RESETS) {
      eliminate();
      return;
    }

    // Reset state
    attemptsLeft = 4;
    solved = [false, false, false, false];
    passwordDigits = ["_", "_", "_", "_"];
    digits.forEach(d => d.textContent = "_");

    // Move to next run
    runIndex++;
    if (runIndex >= TOTAL_RUNS) runIndex = TOTAL_RUNS - 1;

    alert("SYSTEM RESET – QUESTIONS & PASSWORD UPDATED");
  }

  // ---------- SUCCESS ----------
  function checkSuccess() {
    if (!passwordDigits.includes("_")) {
      clearInterval(timerInterval);
      systemScreen.classList.remove("active");
      successScreen.classList.add("active");

      // FINAL OUTPUT = NEXT LOCATION (NOT PASSWORD)
      document.getElementById("finalOutput").textContent =
        "Proceed to: XYZ LOCATION";
    }
  }

  // ---------- ELIMINATION ----------
  function eliminate() {
    clearInterval(timerInterval);
    systemScreen.classList.remove("active");
    eliminationScreen.classList.add("active");
  }

});