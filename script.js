// ===================== FIREBASE INIT =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXhIFZXqZbaL-l5suMd5xjvBCIDYaU9NM",
  authDomain: "part2-1919d.firebaseapp.com",
  projectId: "part2-1919d",
  storageBucket: "part2-1919d.firebasestorage.app",
  messagingSenderId: "450308079464",
  appId: "1:450308079464:web:5950863653cc80fcdc20dd",
  measurementId: "G-5266CEW8X1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===================== ADMIN LIST =====================
const ADMIN_EMAILS = ["tinhpr556@gmail.com", "trantrinh0203@gmail.com"]; // thêm email admin tại đây
function isAdmin(user) {
  return user && ADMIN_EMAILS.includes(user.email);
}

// ===================== AUTH HANDLING =====================
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const historyLink = document.getElementById("history-link");
const userInfo = document.getElementById("user-info");
const adminDashboardLink = document.getElementById("admin-dashboard-link");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUserInfo(result.user);
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed: " + err.message);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed: " + err.message);
    }
  });
}

// Lưu thông tin người dùng
async function saveUserInfo(user) {
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving user info:", error);
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (historyLink) historyLink.style.display = "inline-block";
    if (userInfo)
      userInfo.textContent = `Hi, ${user.displayName || user.email}`;
    if (adminDashboardLink)
      adminDashboardLink.style.display = isAdmin(user)
        ? "inline-block"
        : "none";

    if (window.location.pathname.includes("admin.html") && !isAdmin(user)) {
      window.location.href = "index.html";
    }

    if (testSection && testData) {
      startTest();
    }

    if (document.getElementById("history-list")) {
      loadHistory(user);
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (historyLink) historyLink.style.display = "none";
    if (adminDashboardLink) adminDashboardLink.style.display = "none";
    if (userInfo) userInfo.textContent = "";

    if (testSection) {
      alert("Please login with Google to take the test.");
      window.location.href = "index.html";
    }
  }
});

// ===================== GLOBAL TEST VARIABLES =====================
let currentTest = 1;
let studentName = "";
let testData = {};
let userAnswers = {};
let currentQuestionIndex = 0;

// DOM elements
const testGrid = document.querySelector(".test-grid");
const testSection = document.getElementById("test-section");
const resultSection = document.getElementById("result-section");
const submitTestBtn = document.getElementById("submit-test");
const backToTestsBtn = document.getElementById("back-to-tests");
const studentNameDisplay = document.getElementById("student-name-display");
const testTitle = document.getElementById("test-title");
const listeningAudio = document.getElementById("listening-audio");
const resultAudio = document.getElementById("result-audio");
const questionsContainer = document.querySelector(".questions-container");
const scoreDisplay = document.getElementById("score-display");
const answersContainer = document.getElementById("answers-container");
const prevQuestionBtn = document.getElementById("prev-question");
const nextQuestionBtn = document.getElementById("next-question");
const currentQDisplay = document.getElementById("current-q");
const progressBar = document.getElementById("progress-bar");

// ===================== INIT PAGE =====================
async function init() {
  if (testGrid && !document.getElementById("history-list")) {
    renderTestButtons();
  } else if (testSection) {
    const urlParams = new URLSearchParams(window.location.search);
    currentTest = parseInt(urlParams.get("test")) || 1;

    try {
      testData = await loadTestDataAsync(currentTest);

      submitTestBtn.addEventListener("click", submitTest);
      backToTestsBtn?.addEventListener("click", goBackToTests);

      prevQuestionBtn.addEventListener("click", () =>
        navigateToQuestion(currentQuestionIndex - 1)
      );
      nextQuestionBtn.addEventListener("click", () =>
        navigateToQuestion(currentQuestionIndex + 1)
      );
    } catch (error) {
      console.error("Error loading test data:", error);
      alert("Cannot load test data!");
    }
  }
}

// ===================== TEST FUNCTIONS =====================
function renderTestButtons() {
  if (!testGrid) return;
  testGrid.innerHTML = "";
  for (let i = 1; i <= 20; i++) {
    const testBtn = document.createElement("a");
    testBtn.className = "test-btn";
    testBtn.innerHTML = `
      <div class="test-number">Test ${i}</div>
      <div class="test-label">25 Questions</div>
    `;
    testBtn.href = `test.html?test=${i}`;
    testGrid.appendChild(testBtn);
  }
}

async function loadTestDataAsync(testId) {
  const response = await fetch(`tests/test${testId}.json`);
  if (!response.ok) throw new Error("Test file not found");
  return await response.json();
}

function startTest() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please login with Google before starting the test.");
    return;
  }

  studentName = user.displayName || user.email;

  testSection.style.display = "block";

  studentNameDisplay.textContent = studentName;
  testTitle.textContent = testData.title || `Test ${currentTest}`;

  if (listeningAudio) listeningAudio.src = testData.audio;
  if (resultAudio) resultAudio.src = testData.audio;

  renderQuestions();
  navigateToQuestion(0);
}

function renderQuestions() {
  if (!questionsContainer) return;
  questionsContainer.innerHTML = "";

  testData.questions.forEach((question, index) => {
    const questionElement = document.createElement("div");
    questionElement.className = `question ${index === 0 ? "active" : ""}`;
    questionElement.id = `q-${question.number}`;
    questionElement.innerHTML = `
      <div class="question-number">Question ${question.number}</div>
      <div class="options">
        ${question.options
          .map(
            (option) => `
          <label class="option">
            <input type="radio" name="q${question.number}" value="${option}">
            ${option}
          </label>`
          )
          .join("")}
      </div>
    `;
    questionsContainer.appendChild(questionElement);
  });
}

function updateProgress() {
  if (!progressBar || !testData) return;
  const total = testData.questions.length;
  const percent = ((currentQuestionIndex + 1) / total) * 100;
  progressBar.style.width = percent + "%";
}

function navigateToQuestion(index) {
  if (index < 0 || index >= testData.questions.length) return;

  const questions = document.querySelectorAll(".question");
  questions.forEach((q, i) => {
    q.classList.toggle("active", i === index);
  });

  currentQuestionIndex = index;

  if (currentQDisplay) {
    currentQDisplay.textContent = testData.questions[index].number;
  }

  updateProgress();
}

function submitTest() {
  testData.questions.forEach((question) => {
    const selected = document.querySelector(
      `input[name="q${question.number}"]:checked`
    );
    userAnswers[question.number] = selected ? selected.value : null;
  });

  const score = calculateScore();
  showResults(score);
  saveResultsToFirestore(score);
}

function calculateScore() {
  let correct = 0;
  testData.questions.forEach((q) => {
    if (userAnswers[q.number] === q.correctAnswer) correct++;
  });
  const percentage = Math.round((correct / testData.questions.length) * 100);
  return { correct, total: testData.questions.length, percentage };
}

function showResults(score) {
  if (listeningAudio && !listeningAudio.paused) {
    listeningAudio.pause();
    listeningAudio.currentTime = 0;
  }

  testSection.style.display = "none";
  resultSection.style.display = "block";

  scoreDisplay.innerHTML = `
    You scored <b>${score.correct}/${score.total}</b> (${score.percentage}%)
  `;

  answersContainer.innerHTML = "";
  const questions = testData.questions || [];
  questions.forEach((question) => {
    const userAnswer = userAnswers[question.number];
    const isCorrect = userAnswer === question.correctAnswer;
    const answerItem = document.createElement("div");
    answerItem.className = `answer-item ${isCorrect ? "correct" : "incorrect"}`;
    answerItem.innerHTML = `
      <div class="answer-question">Question ${question.number}</div>
      <div>Your answer: <strong>${userAnswer || "Not answered"}</strong></div>
      <div>Correct answer: <strong>${question.correctAnswer}</strong></div>
      <div class="answer-explanation">${question.explanation}</div>
    `;
    answersContainer.appendChild(answerItem);
  });
}

function goBackToTests() {
  window.location.href = "index.html";
}

async function saveResultsToFirestore(score) {
  const user = auth.currentUser;
  if (!user) return;
  const answers = testData.questions.map((q) => ({
    number: q.number,
    correctAnswer: q.correctAnswer,
    userAnswer: userAnswers[q.number] || null,
    isCorrect: userAnswers[q.number] === q.correctAnswer,
  }));

  await setDoc(
    doc(collection(db, "users", user.uid, "results"), `test${currentTest}`),
    {
      testNumber: currentTest,
      score: score.correct,
      total: score.total,
      percentage: score.percentage,
      timestamp: new Date().toISOString(),
      answers,
    }
  );
}

async function loadHistory() {
  const user = auth.currentUser;
  if (!user) return;
  const historyList = document.getElementById("history-list");
  const noHistory = document.getElementById("no-history");

  historyList.innerHTML = "";
  const snapshot = await getDocs(collection(db, "users", user.uid, "results"));

  if (snapshot.empty) {
    if (noHistory) noHistory.style.display = "block";
    return;
  }
  if (noHistory) noHistory.style.display = "none";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    let scoreClass = "low";
    if (data.percentage >= 80) scoreClass = "high";
    else if (data.percentage >= 50) scoreClass = "medium";

    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = `
      <h3>Test ${data.testNumber}</h3>
      <div class="history-score ${scoreClass}">
        Score: ${data.score}/${data.total} (${data.percentage}%)
      </div>
      <div class="history-date">Completed at: ${new Date(
        data.timestamp
      ).toLocaleString()}</div>
      <a href="result.html?test=${
        data.testNumber
      }" class="auth-btn" style="margin-top:10px; display:inline-block;">View Details</a>
    `;
    historyList.appendChild(card);
  });
}

// ===================== START =====================
document.addEventListener("DOMContentLoaded", init);
