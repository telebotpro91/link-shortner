const pathName = window.location.pathname.split("/").pop();
const params = new URLSearchParams(window.location.search);
const dest = params.get('dest');

// Dashboard Logic
if (document.getElementById('shortenBtn')) {
    document.getElementById('shortenBtn').onclick = async () => {
        const longUrl = document.getElementById('longUrl').value;
        const res = await fetch('/api/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ longUrl })
        });
        const data = await res.json();
        document.getElementById('resultLink').innerHTML = `Link: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>`;
        updateStats();
    };
}

async function updateStats() {
    const res = await fetch('/api/stats');
    const d = await res.json();
    const vals = document.querySelectorAll('.sensor-value');
    if (vals.length > 0) {
        vals[0].innerText = d.totalClicks;
        vals[1].innerHTML = `<span class="unit">$</span>${d.earnings}`;
        vals[2].innerText = d.totalLinks;
    }
}

// Timer Logic for step1, step2, step3
const timerDisp = document.getElementById('timer-display');
const btn = document.getElementById('get-link-btn');

if (timerDisp && btn) {
    let sec = 10;
    const timer = setInterval(() => {
        sec--;
        timerDisp.innerText = sec;
        if (sec <= 0) {
            clearInterval(timer);
            btn.classList.remove('blur-btn');
            btn.style.filter = "none";
            btn.style.pointerEvents = "auto";
            btn.onclick = () => {
                if (pathName === "step1.html") window.location.href = `step2.html?dest=${dest}`;
                else if (pathName === "step2.html") window.location.href = `step3.html?dest=${dest}`;
                else if (pathName === "step3.html") window.location.href = atob(dest);
            };
        }
    }, 1000);
}
window.onload = updateStats;