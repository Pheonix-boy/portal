 const username = localStorage.getItem("username");

    if (username) {
        document.getElementById("welcome").innerText = `Hi, ${username}`;
    }
const mathsButton = document.getElementById("maths");
const physicsButton = document.getElementById("physics");
const chemistryButton = document.getElementById("chemistry");
document.getElementById("logoutBtn").addEventListener("click", async () => {
    try {
        const res = await fetch("/logout", {
            method: "POST"
        });

        const data = await res.json();

        if (data.success) {
            alert(data.message);
            window.location.href = "index.html"; // redirect to login
        }
    } catch (err) {
        console.error(err);
        alert("Logout failed!");
    }
});
