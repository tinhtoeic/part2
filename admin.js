import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
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
const ADMIN_EMAILS = ["tinhpr556@gmail.com", "trantrinh0203@gmail.com"]; // thêm admin tại đây
function isAdmin(user) {
  return user && ADMIN_EMAILS.includes(user.email);
}

// DOM elements
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");
const resultsBody = document.getElementById("results-body");
const noResults = document.getElementById("no-results");

// filter elements
const filterUser = document.getElementById("filter-user");
const filterTest = document.getElementById("filter-test");
const filterScore = document.getElementById("filter-score");

let allResults = [];

// ===================== AUTH HANDLING =====================
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

onAuthStateChanged(auth, (user) => {
  if (isAdmin(user)) {
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (userInfo)
      userInfo.textContent = `Admin: ${user.displayName || user.email}`;
    loadAllResults();
  } else {
    if (logoutBtn) logoutBtn.style.display = "none";
    if (userInfo) userInfo.textContent = "";
    window.location.href = "index.html";
  }
});

// ===================== LOAD ALL RESULTS =====================
async function loadAllResults() {
  try {
    allResults = [];
    resultsBody.innerHTML = "";
    let hasResults = false;

    const usersSnapshot = await getDocs(collection(db, "users"));

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        const resultsSnapshot = await getDocs(
          collection(db, "users", userId, "results")
        );

        for (const resultDoc of resultsSnapshot.docs) {
          const data = resultDoc.data();
          allResults.push({
            userId,
            name: userData.displayName || userData.email || userId,
            testNumber: data.testNumber,
            score: data.score,
            total: data.total,
            percentage: data.percentage,
            timestamp: data.timestamp,
          });
          hasResults = true;
        }
      } catch (error) {
        console.error(`Error loading results for user ${userId}:`, error);
      }
    }

    renderResults(allResults);
    noResults.style.display = hasResults ? "none" : "block";
  } catch (error) {
    console.error("Error loading results:", error);
    noResults.style.display = "block";
    noResults.textContent = "Error loading results: " + error.message;
  }
}

// ===================== RENDER RESULTS =====================
function renderResults(data) {
  resultsBody.innerHTML = "";

  if (!data.length) {
    noResults.style.display = "block";
    return;
  }
  noResults.style.display = "none";

  data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>Test ${item.testNumber}</td>
      <td>${item.score}/${item.total}</td>
      <td>${item.percentage}%</td>
      <td>${new Date(item.timestamp).toLocaleString()}</td>
      <td>
        <button class="auth-btn view-details" 
                data-userid="${item.userId}" 
                data-test="${item.testNumber}">
          View Details
        </button>
      </td>
    `;
    resultsBody.appendChild(row);
  });

  document.querySelectorAll(".view-details").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const userId = e.target.getAttribute("data-userid");
      const testNumber = e.target.getAttribute("data-test");
      window.location.href = `admin-result.html?user=${userId}&test=${testNumber}`;
    });
  });
}

// ===================== FILTERING =====================
function applyFilters() {
  const search = filterUser?.value.toLowerCase() || "";
  const test = filterTest?.value || "";
  const score = filterScore?.value || "";

  let filtered = allResults.filter((item) => {
    let matchUser = item.name.toLowerCase().includes(search);
    let matchTest = test ? item.testNumber == test : true;
    let matchScore = true;
    if (score === "high") matchScore = item.percentage >= 80;
    if (score === "medium")
      matchScore = item.percentage >= 50 && item.percentage < 80;
    if (score === "low") matchScore = item.percentage < 50;

    return matchUser && matchTest && matchScore;
  });

  renderResults(filtered);
}

if (filterUser) filterUser.addEventListener("input", applyFilters);
if (filterTest) filterTest.addEventListener("change", applyFilters);
if (filterScore) filterScore.addEventListener("change", applyFilters);
