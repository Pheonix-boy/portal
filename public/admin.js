// Elements
const loggedInTable = document.getElementById("loggedInUsers").querySelector("tbody");
const forgotTable = document.getElementById("forgotRequests").querySelector("tbody");
const materialsTable = document.getElementById("materialsTable").querySelector("tbody");
const logoutBtn = document.getElementById("logoutBtn");
const uploadForm = document.getElementById("uploadForm");

// ------------------ FETCH FUNCTIONS ------------------
async function fetchLoggedInUsers() {
    const res = await fetch("/admin/logged-in-users");
    const data = await res.json();
    loggedInTable.innerHTML = "";
    data.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.lastLogin}</td>
        `;
        loggedInTable.appendChild(row);
    });
}

async function fetchForgotRequests() {
    const res = await fetch("/admin/forgot-password-requests");
    const data = await res.json();
    forgotTable.innerHTML = "";
    data.forEach(req => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${req.id}</td>
            <td>${req.username}</td>
            <td>${req.email}</td>
            <td>${req.requestTime}</td>
            <td><button onclick="deleteForgotRequest(${req.id})">Delete</button></td>
        `;
        forgotTable.appendChild(row);
    });
}

async function fetchMaterials() {
    const res = await fetch("/admin/materials");
    const data = await res.json();
    materialsTable.innerHTML = "";
    data.forEach(mat => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${mat.id}</td>
            <td>${mat.subject}</td>
            <td>${mat.chapter}</td>
            <td>${mat.type}</td>
            <td><a href="/uploads/${mat.filename}" target="_blank">View</a></td>
            <td>${mat.uploaded_at}</td>
            <td><button onclick="deleteMaterial(${mat.id})">Delete</button></td>
        `;
        materialsTable.appendChild(row);
    });
}

// ------------------ DELETE FUNCTIONS ------------------
async function deleteForgotRequest(id) {
    if(!confirm("Delete this forgot password request?")) return;
    await fetch(`/admin/forgot-password/${id}`, { method: "DELETE" });
    fetchForgotRequests();
}

async function deleteMaterial(id) {
    if(!confirm("Delete this material?")) return;
    await fetch(`/admin/materials/${id}`, { method: "DELETE" });
    fetchMaterials();
}

// ------------------ UPLOAD FORM ------------------
uploadForm.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    const res = await fetch("/admin/upload-material", {
        method: "POST",
        body: formData
    });
    const data = await res.json();
    alert(data.message);
    if(data.success) uploadForm.reset();
    fetchMaterials();
});

// ------------------ LOGOUT ------------------
logoutBtn.addEventListener("click", async () => {
    await fetch("/logout", { method: "POST" });
    window.location.href = "index.html";
});

// ------------------ INITIAL FETCH ------------------
fetchLoggedInUsers();
fetchForgotRequests();
fetchMaterials();

// Refresh every 30s
setInterval(() => {
    fetchLoggedInUsers();
    fetchForgotRequests();
    fetchMaterials();
}, 30000);