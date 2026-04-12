document.getElementById("signupForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value.trim();
const password = document.getElementById("password").value.trim();

    // Send signup data to server
    const res = await fetch("/signup", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if(data.success){
        alert("Account created successfully!");
        window.location.href = "index.html"; // redirect to login page
    } else {
        alert("Error: " + data.message);
    }
});