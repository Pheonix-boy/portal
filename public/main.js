// 1️⃣ Check if user is already logged in on page load
async function checkLogin() {
    try {
        const res = await fetch("/profile");
        const data = await res.json();
        if (data.loggedIn) {
            // Redirect immediately if already logged in
            window.location.href = "home.html"; 
        }
    } catch (err) {
        console.error("Check login failed:", err);
    }
}

checkLogin(); // run immediately

// 2️⃣ Existing login form handler
document.querySelector("form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
            // No need to use localStorage anymore if using cookies
            // localStorage.setItem("username", data.username);

            if (data.isAdmin) {
                alert("Admin login successful!");
                window.location.href = "admin.html";
            } else {
                alert("User login successful!");
                window.location.href = "home.html";
            }
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error(error);
        alert("Something went wrong!");
    }
});