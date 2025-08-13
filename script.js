// Global variables
let currentTest = 1;
let studentName = "";
let testData = {};
let userAnswers = {};
let currentQuestionIndex = 0;
let autoSaveInterval;

// DOM elements
const testGrid = document.querySelector(".test-grid");
const nameInputSection = document.getElementById("name-input-section");
const testSection = document.getElementById("test-section");
const resultSection = document.getElementById("result-section");
const studentNameInput = document.getElementById("student-name");
const startTestBtn = document.getElementById("start-test");
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
const questionGrid = document.querySelector(".question-grid");
const recoveryModal = document.getElementById("recovery-modal");
const recoveryTime = document.getElementById("recovery-time");
const recoverBtn = document.getElementById("recover-btn");
const startNewBtn = document.getElementById("start-new-btn");

// Initialize the page
async function init() {
  if (testGrid) {
    renderTestButtons();
  } else if (nameInputSection) {
    const urlParams = new URLSearchParams(window.location.search);
    currentTest = parseInt(urlParams.get("test")) || 1;

    try {
      testData = await loadTestDataAsync(currentTest);
      startTestBtn.addEventListener("click", startTest);
      submitTestBtn.addEventListener("click", submitTest);
      backToTestsBtn.addEventListener("click", goBackToTests);

      prevQuestionBtn.addEventListener("click", () =>
        navigateToQuestion(currentQuestionIndex - 1)
      );
      nextQuestionBtn.addEventListener("click", () =>
        navigateToQuestion(currentQuestionIndex + 1)
      );

      checkSavedTest();
    } catch (error) {
      console.error("Error loading test data:", error);
      testData = generateSampleData(currentTest);
    }
  }
}

function checkSavedTest() {
  const savedState = localStorage.getItem("toeicTestState");
  if (!savedState) return;
  const state = JSON.parse(savedState);
  if (!state.testStarted) return;
  if (state.currentTest === currentTest) {
    showRecoveryDialog(state.timestamp);
  }
}

function showRecoveryDialog(timestamp) {
  recoveryTime.textContent = new Date(timestamp).toLocaleString();
  recoveryModal.style.display = "flex";
  recoverBtn.onclick = () => {
    recoveryModal.style.display = "none";
    restoreTestState();
  };
  startNewBtn.onclick = () => {
    localStorage.removeItem("toeicTestState");
    recoveryModal.style.display = "none";
    location.reload();
  };
}

function restoreTestState() {
  const saved = localStorage.getItem("toeicTestState");
  if (!saved) return;
  const state = JSON.parse(saved);
  if (!state.testStarted) return;

  studentName = state.studentName;
  userAnswers = state.userAnswers || {};
  currentQuestionIndex = state.currentQuestionIndex || 0;

  studentNameInput.value = studentName;
  nameInputSection.style.display = "none";
  testSection.style.display = "block";
  studentNameDisplay.textContent =
    studentName.length > 15
      ? studentName.substring(0, 12) + "..."
      : studentName;
  studentNameDisplay.title = studentName;

  testTitle.textContent = testData.title || `Test ${currentTest}`;

  if (listeningAudio) {
    listeningAudio.src = testData.audio || `audio/test${currentTest}.mp3`;
  }
  if (resultAudio) {
    resultAudio.src = testData.audio || `audio/test${currentTest}.mp3`;
  }

  renderQuestions();

  Object.keys(userAnswers).forEach((qNumber) => {
    const input = document.querySelector(
      `input[name="q${qNumber}"][value="${userAnswers[qNumber]}"]`
    );
    if (input) input.checked = true;
  });

  navigateToQuestion(currentQuestionIndex);
  updateNavigation();
  setupProgressTracking();
  autoSaveInterval = setInterval(saveTestState, 30000);
  window.addEventListener("beforeunload", handleBeforeUnload);
}

function saveTestState() {
  const state = {
    currentTest,
    studentName,
    userAnswers,
    currentQuestionIndex,
    testStarted: testSection.style.display !== "none",
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem("toeicTestState", JSON.stringify(state));
}

function handleBeforeUnload(e) {
  if (testSection.style.display !== "none") {
    saveTestState();
    e.preventDefault();
    e.returnValue =
      "Bạn có chắc muốn rời đi? Tiến trình làm bài sẽ được lưu tự động.";
  }
}

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

function generateSampleData(testId) {
  const questions = [];
  for (let i = 7; i <= 31; i++) {
    questions.push({
      number: i,
      options: ["A", "B", "C"],
      correctAnswer: ["A", "B", "C"][Math.floor(Math.random() * 3)],
      explanation: `Sample explanation for question ${i}.`,
    });
  }
  return {
    title: `Test ${testId}`,
    audio: `part2/audio/test${testId}.mp3`,
    questions: questions,
  };
}

function startTest() {
  studentName = studentNameInput.value.trim();
  if (!studentName) {
    alert("Please enter your name");
    return;
  }
  if (!testData || !testData.questions || testData.questions.length === 0) {
    alert("Test data is not loaded yet.");
    return;
  }
  nameInputSection.style.display = "none";
  testSection.style.display = "block";
  const displayName =
    studentName.length > 15
      ? studentName.substring(0, 12) + "..."
      : studentName;
  studentNameDisplay.textContent = displayName;
  studentNameDisplay.title = studentName;
  testTitle.textContent = testData.title || `Test ${currentTest}`;
  if (listeningAudio) {
    listeningAudio.src = testData.audio || `audio/test${currentTest}.mp3`;
  }
  if (resultAudio) {
    resultAudio.src = testData.audio || `audio/test${currentTest}.mp3`;
  }
  renderQuestions();
  currentQuestionIndex = 0;
  navigateToQuestion(0);
  setupProgressTracking();
  autoSaveInterval = setInterval(saveTestState, 30000);
  window.addEventListener("beforeunload", handleBeforeUnload);
  saveTestState();
}

function setupProgressTracking() {
  const radioInputs = document.querySelectorAll(
    '.questions-container input[type="radio"]'
  );
  const progressBar = document.getElementById("progress-bar");
  const totalQuestions = testData.questions?.length || 25;
  radioInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const answered = document.querySelectorAll(
        '.questions-container input[type="radio"]:checked'
      ).length;
      const progress = (answered / totalQuestions) * 100;
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
      const questionNumber = input.name.substring(1);
      userAnswers[questionNumber] = input.value;
      updateNavigation();
    });
  });
}

function renderQuestions() {
  if (!questionsContainer || !questionGrid) return;
  if (!testData || !testData.questions || testData.questions.length === 0) {
    questionsContainer.innerHTML = "<p>No questions available.</p>";
    return;
  }
  questionsContainer.innerHTML = "";
  questionGrid.innerHTML = "";
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
          </label>
        `
          )
          .join("")}
      </div>
    `;
    questionsContainer.appendChild(questionElement);
    const qNumberBtn = document.createElement("button");
    qNumberBtn.className = "question-number-btn";
    qNumberBtn.textContent = question.number;
    qNumberBtn.dataset.qIndex = index;
    qNumberBtn.addEventListener("click", () => navigateToQuestion(index));
    questionGrid.appendChild(qNumberBtn);
  });
}

function navigateToQuestion(index) {
  if (!testData.questions || index < 0 || index >= testData.questions.length) {
    return;
  }
  const currentQuestion = document.querySelector(".question.active");
  if (currentQuestion) currentQuestion.classList.remove("active");
  const currentNavBtn = document.querySelector(".question-number-btn.active");
  if (currentNavBtn) currentNavBtn.classList.remove("active");
  currentQuestionIndex = index;
  document.querySelectorAll(".question")[index].classList.add("active");
  document
    .querySelector(`.question-number-btn[data-q-index="${index}"]`)
    .classList.add("active");
  if (currentQDisplay) {
    currentQDisplay.textContent = testData.questions[index].number;
  }
  updateNavigation();
}

function updateNavigation() {
  if (!testData.questions) return;
  if (prevQuestionBtn) {
    prevQuestionBtn.disabled = currentQuestionIndex === 0;
  }
  if (nextQuestionBtn) {
    nextQuestionBtn.disabled =
      currentQuestionIndex === testData.questions.length - 1;
  }
  const allQButtons = document.querySelectorAll(".question-number-btn");
  allQButtons.forEach((btn) => btn.classList.remove("active"));
  if (allQButtons[currentQuestionIndex]) {
    allQButtons[currentQuestionIndex].classList.add("active");
  }
  testData.questions.forEach((q, index) => {
    const answered = document.querySelector(
      `input[name="q${q.number}"]:checked`
    );
    if (answered && allQButtons[index]) {
      allQButtons[index].classList.add("answered");
    }
  });
}

function submitTest() {
  userAnswers = {};
  const questions = testData.questions || [];
  questions.forEach((question) => {
    const selectedOption = document.querySelector(
      `input[name="q${question.number}"]:checked`
    );
    userAnswers[question.number] = selectedOption ? selectedOption.value : null;
  });
  const score = calculateScore();
  showResults(score);
  localStorage.removeItem("toeicTestState");
  clearInterval(autoSaveInterval);
  window.removeEventListener("beforeunload", handleBeforeUnload);
}

function calculateScore() {
  let correct = 0;
  const questions = testData.questions || [];
  questions.forEach((question) => {
    if (userAnswers[question.number] === question.correctAnswer) {
      correct++;
    }
  });
  const percentage = Math.round((correct / questions.length) * 100);
  let scoreClass = "";
  if (percentage >= 80) scoreClass = "score-high";
  else if (percentage >= 50) scoreClass = "score-medium";
  else scoreClass = "score-low";
  return { correct, total: questions.length, percentage, scoreClass };
}

function showResults(score) {
  testSection.style.display = "none";
  resultSection.style.display = "block";
  if (listeningAudio && resultAudio) {
    const wasPlaying = !listeningAudio.paused;
    listeningAudio.pause();
    resultAudio.currentTime = listeningAudio.currentTime;
    if (wasPlaying) {
      resultAudio.play().catch((e) => console.log("Audio play error:", e));
    }
  }
  if (scoreDisplay) {
    scoreDisplay.innerHTML = `
      You scored <span class="${score.scoreClass}">${score.correct} out of ${score.total}</span> (${score.percentage}%)
    `;
  }
  if (answersContainer) {
    answersContainer.innerHTML = "";
    const questions = testData.questions || [];
    questions.forEach((question) => {
      const userAnswer = userAnswers[question.number];
      const isCorrect = userAnswer === question.correctAnswer;
      const answerItem = document.createElement("div");
      answerItem.className = `answer-item ${
        isCorrect ? "correct" : "incorrect"
      }`;
      answerItem.innerHTML = `
        <div class="answer-question">Question ${question.number}</div>
        <div>Your answer: <strong>${userAnswer || "Not answered"}</strong></div>
        <div>Correct answer: <strong>${question.correctAnswer}</strong></div>
        <div class="answer-explanation">${question.explanation}</div>
      `;
      answersContainer.appendChild(answerItem);
    });
  }
  saveResultsToGoogleSheets(studentName, score.correct);
}

function goBackToTests() {
  window.location.href = "index.html";
}

async function saveResultsToGoogleSheets(studentName, correctAnswers) {
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwRvOoHa1Gpry9R5hrvPD5e2biNYFUJioM52Oopx-dgKdIBaEKbTrsc9uY59N_R63_V/exec";

  const payload = {
    studentName: studentName.substring(0, 100),
    correctAnswers: Number(correctAnswers) || 0,
    testNumber: currentTest, // gửi thêm số hiệu bài test
  };

  console.log("Preparing to send:", payload);

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      mode: "no-cors",
    });
    return { status: "success" };
  } catch (error) {
    console.error("POST failed, trying GET fallback:", error);
    try {
      const getUrl =
        `${SCRIPT_URL}?` +
        new URLSearchParams({
          studentName: payload.studentName,
          correctAnswers: payload.correctAnswers,
          testNumber: payload.testNumber,
        });
      await fetch(getUrl, { mode: "no-cors" });
      return { status: "success" };
    } catch (getError) {
      console.error("GET fallback also failed:", getError);
      return { status: "error", error: getError.message };
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
