import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
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

// DOM elements
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");
const userInfoPanel = document.getElementById("user-info-panel");
const testInfoPanel = document.getElementById("test-info-panel");
const answersContainer = document.getElementById("answers-container");

// Admin email
const ADMIN_EMAIL = "tinhpr556@gmail.com";

// Auth handling
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Logout error:", error);
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user && user.email === ADMIN_EMAIL) {
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (userInfo)
      userInfo.textContent = `Admin: ${user.displayName || user.email}`;
    await loadUserResult();
  } else {
    window.location.href = "index.html";
  }
});

// Load user result
async function loadUserResult() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("user");
  const testNumber = params.get("test");

  if (!userId || !testNumber) {
    answersContainer.innerHTML = "<p>Invalid URL parameters</p>";
    return;
  }

  try {
    // Lấy thông tin user
    const userDoc = await getDoc(doc(db, "users", userId));
    const userData = userDoc.exists() ? userDoc.data() : {};

    userInfoPanel.innerHTML = `
      <div class="history-card">
        <h3>User Information</h3>
        <div><strong>Name:</strong> ${
          userData.displayName || "Not provided"
        }</div>
        <div><strong>Email:</strong> ${userData.email || userId}</div>
        <div><strong>User ID:</strong> ${userId}</div>
      </div>
    `;

    // Lấy kết quả test
    const resultRef = doc(db, "users", userId, "results", `test${testNumber}`);
    const resultDoc = await getDoc(resultRef);

    if (!resultDoc.exists()) {
      answersContainer.innerHTML = `<p>No result found for Test ${testNumber}</p>`;
      return;
    }

    const resultData = resultDoc.data();

    testInfoPanel.innerHTML = `
      <div class="history-card">
        <h3>Test Information</h3>
        <div><strong>Test:</strong> ${resultData.testNumber}</div>
        <div><strong>Score:</strong> ${resultData.score}/${resultData.total} (${
      resultData.percentage
    }%)</div>
        <div><strong>Completed:</strong> ${new Date(
          resultData.timestamp
        ).toLocaleString()}</div>
      </div>
    `;

    // Load transcript từ file json gốc
    try {
      const response = await fetch(`tests/test${testNumber}.json`);
      if (!response.ok) throw new Error("Test file not found");
      const testJson = await response.json();

      // Hiển thị đáp án
      answersContainer.innerHTML = "<h3>Answers</h3>";
      if (resultData.answers && Array.isArray(resultData.answers)) {
        resultData.answers.forEach((ans) => {
          const question = testJson.questions.find(
            (q) => q.number === ans.number
          );
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
            <div class="answer-explanation">${question?.explanation || ""}</div>
          `;
          answersContainer.appendChild(answerItem);
        });
      } else {
        answersContainer.innerHTML += "<p>No answer data available</p>";
      }
    } catch (error) {
      console.error("Error loading test data:", error);
      answersContainer.innerHTML = `<p>Error loading test data: ${error.message}</p>`;
    }
  } catch (error) {
    console.error("Error loading user result:", error);
    answersContainer.innerHTML = `<p>Error loading result: ${error.message}</p>`;
  }
}
