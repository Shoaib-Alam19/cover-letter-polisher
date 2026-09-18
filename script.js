const draftInput = document.getElementById("draftInput");
const polishBtn = document.getElementById("polishBtn");
const resultBox = document.getElementById("resultBox");
const changesBox = document.getElementById("changesBox");
const changesList = document.getElementById("changesList");

polishBtn.addEventListener("click", async function () {
    const draft = draftInput.value.trim();

    if (draft === "") {
        alert("Please enter a draft first.");
        return;
    }

    polishBtn.disabled = true;
    polishBtn.textContent = "Polishing...";
    resultBox.classList.remove("empty");
    resultBox.innerHTML = "";
    changesBox.hidden = true;
    changesList.innerHTML = "";

    const loadingMsg = document.createElement("p");
    loadingMsg.className = "loading-msg";
    loadingMsg.textContent = "Polishing your draft...";
    resultBox.appendChild(loadingMsg);

    try {
        const response = await fetch("/api/polish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draft: draft })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong. Please try again.");
        }

        // Safely render polished text (no innerHTML injection risk)
        resultBox.innerHTML = "";
        const resultP = document.createElement("p");
        resultP.textContent = data.polished;
        resultBox.appendChild(resultP);

        // Render "what changed" list, if present
        if (data.changes && data.changes.length > 0) {
            changesList.innerHTML = "";
            data.changes.forEach(function (change) {
                const li = document.createElement("li");
                li.textContent = change;
                changesList.appendChild(li);
            });
            changesBox.hidden = false;
        }

    } catch (error) {
        const message = error.message === "Failed to fetch"
            ? "Couldn't reach the server. Check your internet connection and try again."
            : error.message;

        resultBox.innerHTML = "";
        const errorP = document.createElement("p");
        errorP.className = "error-msg";
        errorP.textContent = "⚠️ " + message;
        resultBox.appendChild(errorP);

    } finally {
        polishBtn.disabled = false;
        polishBtn.textContent = "Polish it";
    }
});