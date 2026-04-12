document.getElementById("forgotForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    // ✅ IMPORTANT: clear any existing login session
    await fetch("/logout", { method: "POST" });

    const res = await fetch("/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });

    const data = await res.json();

    if(data.success){
        alert("Request sent to admin!");
        window.location.href = "index.html";
    } else {
        alert(data.message);
    }
});