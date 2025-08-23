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
  getDoc,
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

// DOM
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const historyLink = document.getElementById("history-link");
const userInfo = document.getElementById("user-info");
const resultTitle = document.getElementById("result-title");
const scoreSummary = document.getElementById("score-summary");
const answersContainer = document.getElementById("answers-container");
const resultAudio = document.getElementById("result-audio");

// Auth
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (historyLink) historyLink.style.display = "inline-block";
    if (userInfo)
      userInfo.textContent = `Hi, ${user.displayName || user.email}`;

    loadResult(user);
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (historyLink) historyLink.style.display = "none";
    if (userInfo) userInfo.textContent = "";
  }
});

// Load result
async function loadResult(user) {
  const params = new URLSearchParams(window.location.search);
  const testNumber = params.get("test");
  if (!testNumber) return;

  // lấy dữ liệu từ Firestore
  const ref = doc(db, "users", user.uid, "results", `test${testNumber}`);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    answersContainer.innerHTML = `<p>No result found for Test ${testNumber}</p>`;
    return;
  }

  const data = snap.data();
  resultTitle.textContent = `Result - Test ${data.testNumber}`;
  scoreSummary.textContent = `Score: ${data.score}/${data.total} (${data.percentage}%)`;

  // load transcript từ file json gốc
  const response = await fetch(`tests/test${testNumber}.json`);
  const testJson = await response.json();

  // set audio file vào player
  if (resultAudio && testJson.audio) {
    resultAudio.src = testJson.audio;
  }

  // hiển thị đáp án
  answersContainer.innerHTML = "";
  data.answers.forEach((ans) => {
    const q = testJson.questions.find((q) => q.number === ans.number);
    const answerItem = document.createElement("div");
    answerItem.className = `answer-item ${
      ans.isCorrect ? "correct" : "incorrect"
    }`;
    answerItem.innerHTML = `
      <div class="answer-question">Question ${ans.number}</div>
      <div>Your answer: <strong>${
        ans.userAnswer || "Not answered"
      }</strong></div>
      <div>Correct answer: <strong>${ans.correctAnswer}</strong></div>
      <div class="answer-explanation">${q.explanation}</div>
    `;
    answersContainer.appendChild(answerItem);
  });
}
