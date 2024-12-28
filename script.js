const themeToggle = document.getElementById('theme-toggle');
let isDarkMode = true;

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    isDarkMode = true;
    themeToggle.querySelector('#theme-icon').textContent = '🌙';
} else {
    document.body.classList.remove('dark-mode');
    themeToggle.querySelector('#theme-icon').textContent = '🌞';
}

themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    const themeIcon = themeToggle.querySelector('#theme-icon');
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        themeIcon.textContent = '🌞';
        localStorage.setItem('theme', 'light');
    }
});

function openPopup(imageUrl) {
    const popup = document.getElementById('popup');
    const popupImg = document.getElementById('popup-img');
    popupImg.src = imageUrl;
    popup.style.display = 'block';
}

document.getElementById('close-btn').addEventListener('click', () => {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
});

fetch('source.txt')
    .then(response => response.text())
    .then(data => {
        const sources = data.split('\n').filter(url => url.trim() !== '');
        const sourceList = document.getElementById("source-list");
        const promises = [];

        sources.forEach(source => {
            const match = source.match(/githubusercontent\.com\/([^\/]+)\/([^\/]+)/);
            if (match) {
                const owner = match[1];
                const repo = match[2];

                const promise = fetch(`https://abolghasems.pythonanywhere.com/last-commit-time?owner=${owner}&repo=${repo}`)
                    .then(response => response.json())
                    .then(data => {
                        return {
                            source: source,
                            last_commit_time: data.last_commit_time || "Unknown",
                            name: data.name || "Unknown",
                            owner: owner,
                            timestamp: data.timestamp || 0
                        };
                    })
                    .catch(() => {
                        return {
                            source: source,
                            last_commit_time: "Error",
                            name: "Error",
                            owner: owner,
                            timestamp: 0
                        };
                    });

                promises.push(promise);
            }
        });

        Promise.allSettled(promises).then(results => {
            const sortedResults = results
                .filter(result => result.status === 'fulfilled')
                .map(item => item.value)
                .sort((a, b) => b.timestamp - a.timestamp);

            sortedResults.forEach(item => {
                const listItem = document.createElement("li");
                const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(item.source)}&size=1080x1080`;

                listItem.innerHTML = `
                    <span>${item.owner}</span>
                    <div>
                        <button onclick="copyToClipboard('${item.source}')">Copy URL</button>
                    </div>
                    <div class="update-time-container">${item.last_commit_time}</div>
                    <a href="https://github.com/${item.owner}" target="_blank">
                        <div class="github-icon"></div>
                    </a>
                    <img src="${qrCodeUrl}" class="qr-icon" alt="QR Code" onclick="openPopup('${qrCodeUrl}')">
                `;

                sourceList.appendChild(listItem);
            });

            document.getElementById("loading-message").style.display = 'none';
        }).catch(() => {
            alert("Error loading sources.");
        });
    })
    .catch(() => {
        alert("Error loading the source file.");
    });

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => alert("Link copied!"));
}
