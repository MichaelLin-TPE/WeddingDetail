// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyDMIYZFIZPzhwghYJ3qtKibko0hj9TCB_M",
  authDomain: "weddingmoney-4d314.firebaseapp.com",
  projectId: "weddingmoney-4d314",
  storageBucket: "weddingmoney-4d314.firebasestorage.app",
  messagingSenderId: "634360158749",
  appId: "1:634360158749:web:5e638592aa25f110c444f4",
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function fetchData(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => doc.data());
}

function renderTable(data, tableBodyId, totalId, searchTerm = "") {
  const tbody = document.querySelector(`#${tableBodyId} tbody`);
  tbody.innerHTML = "";
  let total = 0;

  const term = (searchTerm || "").trim();

  // 篩選符合搜尋條件的資料
  const filtered = data
    .filter((item) => {
      if (term === "") return true;
      const name = (item.name || "").toString();
      const no = item.no != null ? String(item.no) : "";
      return name.includes(term) || no.includes(term);
    })
    .sort((a, b) => (a.no || 0) - (b.no || 0));

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" class="no-result">查無資料</td>`;
    tbody.appendChild(tr);
    document.getElementById(totalId).textContent = 0;
    return;
  }

  filtered.forEach((item) => {
    const money = Number(item.money) || 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${item.no ?? "-"}</td>
        <td>${item.name ?? "-"}</td>
        <td>${money}</td>
        <td>${item.category ?? "-"}</td>
      `;
    tbody.appendChild(tr);
    total += money;
  });

  document.getElementById(totalId).textContent = total;
}

async function init() {
  const femaleData = await fetchData("female_friends");
  const maleData = await fetchData("male_friends");

  renderTable(femaleData, "femaleList", "femaleTotal");
  renderTable(maleData, "maleList", "maleTotal");

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value;
    renderTable(femaleData, "femaleList", "femaleTotal", term);
    renderTable(maleData, "maleList", "maleTotal", term);
  });
}

init();
