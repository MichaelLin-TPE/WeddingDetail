// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyDMIYZFIZPzhwghYJ3qtKibko0hj9TCB_M",
  authDomain: "weddingmoney-4d314.firebaseapp.com",
  projectId: "weddingmoney-4d314",
  storageBucket: "weddingmoney-4d314.firebasestorage.app",
  messagingSenderId: "634360158749",
  appId: "1:634360158749:web:5e638592aa25f110c444f4",
};

let isLoggedIn = false; // 一開始預設未登入

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 取得資料
async function fetchData(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => doc.data());
}

// 渲染表格
function renderTable(data, tableBodyId, totalId, searchTerm = "") {
  const tbody = document.querySelector(`#${tableBodyId} tbody`);
  tbody.innerHTML = "";
  let total = 0;

  const term = (searchTerm || "").trim();

  const filtered = data
    .filter((item) => {
      if (term === "") return true;
      const name = (item.name || "").toString();
      const no = item.no != null ? String(item.no) : "";
      return name.includes(term) || no.includes(term);
    })
    .sort((a, b) => {
      const aNo = Number(a.no);
      const bNo = Number(b.no);
      const aIsNum = !isNaN(aNo);
      const bIsNum = !isNaN(bNo);
      if (aIsNum && bIsNum) return aNo - bNo;
      if (!aIsNum && bIsNum) return 1;
      if (aIsNum && !bIsNum) return -1;
      return 0;
    });

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" class="no-result">查無資料</td>`;
    tbody.appendChild(tr);
    document.getElementById(totalId).textContent = 0;
    return;
  }

  filtered.forEach((item) => {
    const money = item.money || "0";
    const invitedIcon = item.isInvited ? "✅" : "❌";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.no ?? "-"}</td>
      <td>${item.name ?? "-"}</td>
      <td>${money}</td>
      <td>${invitedIcon}</td>
      <td>${item.cookieCount ?? "0"}</td>
      <td><button class="remark-btn" data-remark="${
        item.remark || ""
      }">查看</button></td>
      ${
        isLoggedIn
          ? `<td>
              <button class="edit-btn" data-id="${item.no}">編輯</button>
              <button class="delete-btn" data-id="${item.no}">刪除</button>
            </td>`
          : ""
      }
    `;
    tbody.appendChild(tr);
    total += Number(money);
  });

  document.getElementById(totalId).textContent = total;

  // 綁定「查看備註」事件
  const remarkBtns = tbody.querySelectorAll(".remark-btn");
  remarkBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const remark = btn.dataset.remark || "（無備註）";
      document.getElementById("remarkContent").textContent = remark;
      document.getElementById("remarkPopup").classList.remove("hidden");
    });
  });

  // 綁定「刪除」與「編輯」事件（登入後才有）
  if (isLoggedIn) {
    const deleteBtns = tbody.querySelectorAll(".delete-btn");
    deleteBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        const collection =
          tableBodyId === "femaleList" ? "female_friends" : "male_friends";
        deleteTarget = { id: Number(id), collection };
        deleteMessage.textContent = `確定要刪除「${id}」這筆資料嗎？`;
        deletePopup.classList.remove("hidden");
      });
    });

    const editBtns = tbody.querySelectorAll(".edit-btn");
    editBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = Number(e.target.dataset.id);
        const collection =
          tableBodyId === "femaleList" ? "female_friends" : "male_friends";
        const target = filtered.find((x) => x.no === id);
        if (!target) return;

        editTarget = { id, collection };
        editNameInput.value = target.name || "";
        editMoneyInput.value = target.money || "0";
        editPopup.classList.remove("hidden");
      });
    });
  }
}

// 初始化
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

// ========== 🔸 新增名單 ==========
const addBtn = document.getElementById("addBtn");
const popup = document.getElementById("popup");
const closePopup = document.getElementById("closePopup");
const addForm = document.getElementById("addForm");

addBtn.addEventListener("click", () => popup.classList.remove("hidden"));
closePopup.addEventListener("click", () => popup.classList.add("hidden"));
popup.addEventListener("click", (e) => {
  if (e.target === popup) popup.classList.add("hidden");
});

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("nameInput").value.trim();
  const type = document.getElementById("typeSelect").value;
  const money = document.getElementById("moneyInput").value.trim() || "0";

  if (!name) return alert("請輸入姓名");

  const snapshot = await db.collection(type).get();
  const numbers = snapshot.docs
    .map((d) => Number(d.data().no))
    .filter((n) => !isNaN(n));
  const maxNo = numbers.length > 0 ? Math.max(...numbers) : 0;

  const newData = {
    name,
    money,
    no: maxNo + 1,
    isInvited: true,
    cookieCount: "0",
    remark: "",
  };

  await db.collection(type).add(newData);
  alert("新增成功！");
  popup.classList.add("hidden");
  addForm.reset();
  init();
});

// ========== 🔸 登入系統 ==========
const loginBtn = document.getElementById("loginBtn");
const loginPopup = document.getElementById("loginPopup");
const closeLogin = document.getElementById("closeLogin");
const loginForm = document.getElementById("loginForm");

loginBtn.addEventListener("click", () => loginPopup.classList.remove("hidden"));
closeLogin.addEventListener("click", () => loginPopup.classList.add("hidden"));
loginPopup.addEventListener("click", (e) => {
  if (e.target === loginPopup) loginPopup.classList.add("hidden");
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const account = document.getElementById("loginAccount").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (account === "rumor0404" && password === "wedding1108") {
    isLoggedIn = true;
    alert("登入成功！");
    loginPopup.classList.add("hidden");
    loginForm.reset();
    init();
  } else {
    alert("帳號或密碼錯誤！");
  }
});

// ========== 🔸 刪除彈窗 ==========
const deletePopup = document.getElementById("deletePopup");
const deleteMessage = document.getElementById("deleteMessage");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let deleteTarget = { id: null, collection: null };

cancelDeleteBtn.addEventListener("click", () => {
  deletePopup.classList.add("hidden");
  deleteTarget = { id: null, collection: null };
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (!deleteTarget.id || !deleteTarget.collection) return;
  try {
    const snapshot = await db
      .collection(deleteTarget.collection)
      .where("no", "==", deleteTarget.id)
      .get();

    if (!snapshot.empty) {
      const docId = snapshot.docs[0].id;
      await db.collection(deleteTarget.collection).doc(docId).delete();
      alert("刪除成功！");
    } else {
      alert("找不到該筆資料。");
    }

    deletePopup.classList.add("hidden");
    deleteTarget = { id: null, collection: null };
    init();
  } catch (err) {
    console.error("刪除失敗：", err);
    alert("刪除過程發生錯誤。");
  }
});

// ========== 🔸 編輯彈窗 ==========
const editPopup = document.getElementById("editPopup");
const editForm = document.getElementById("editForm");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editNameInput = document.getElementById("editName");
const editMoneyInput = document.getElementById("editMoney");

let editTarget = { id: null, collection: null };

cancelEditBtn.addEventListener("click", () => {
  editPopup.classList.add("hidden");
  editTarget = { id: null, collection: null };
});

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newName = editNameInput.value.trim();
  const newMoney = editMoneyInput.value.trim() || "0";
  if (!newName) return alert("姓名不能為空！");

  try {
    const snapshot = await db
      .collection(editTarget.collection)
      .where("no", "==", editTarget.id)
      .get();

    if (!snapshot.empty) {
      const docId = snapshot.docs[0].id;
      await db.collection(editTarget.collection).doc(docId).update({
        name: newName,
        money: newMoney,
      });
      alert("更新成功！");
      editPopup.classList.add("hidden");
      editTarget = { id: null, collection: null };
      init();
    } else {
      alert("找不到該筆資料。");
    }
  } catch (err) {
    console.error("更新失敗：", err);
    alert("更新過程發生錯誤。");
  }
});

// ========== 🔸 備註彈窗 ==========
const remarkPopup = document.getElementById("remarkPopup");
const closeRemarkBtn = document.getElementById("closeRemarkBtn");
closeRemarkBtn.addEventListener("click", () => {
  remarkPopup.classList.add("hidden");
});
