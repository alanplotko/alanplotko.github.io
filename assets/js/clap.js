const MAX_CLAPS = 50;

const clapData = document.querySelector(".applause-container");
const clapBtn = document.querySelector(".applause-button");
const clapSpinner = document.querySelector(".applause-count-spinner");
const clapCount = document.querySelector(".applause-count");
const clapBufferCount = document.querySelector(".applause-buffer-count");
const clapMessageContainer = document.querySelector(".applause-message-container");
const multiclapCountdown = document.querySelector(".applause-multiclap-countdown");

var cachedCount = 0;
var totalClaps = 0;
var bufferedClaps = 0;
var confirmTimer, holdTimer, countdownTimer;

const debounce = (func, timeout = 300) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

const getClaps = (api, url) =>
    fetch(`${api}/clap?url=${url}`, {
        headers: {
            "Content-Type": "text/plain",
        },
    })
        .then(response => response.text())
        .then(res => Number(res))
        .catch(() => {
            clapBtn.setAttribute("disabled", "disabled");
            if (clapCount.classList.contains("d-none")) {
                clapCount.classList.remove("d-none");
            }
            clapCount.innerHTML = "OFFLINE";
            clapMessageContainer.innerHTML = "Service is offline. Please try again later.";
        });

const updateClaps = (api, url, claps) =>
    fetch(`${api}/clap?url=${url}`, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain"
        },
        body: JSON.stringify(claps)
    })
        .then(response => response.text())
        .then(res => Number(res));

const updateCount = debounce(() => {
    if (totalClaps < MAX_CLAPS) {
        const increment = Math.min(
            bufferedClaps,
            MAX_CLAPS - totalClaps
        );
        // Send number claps and confirm if accepted by server
        updateClaps(clapData.attributes.api.value, clapData.attributes.url.value, increment)
            .then(updatedClapCount => {
                if (updatedClapCount === cachedCount) {
                    // If claps match (thereby rejected by server), then disable button
                    clapBtn.setAttribute("disabled", "disabled");
                    clapCount.innerHTML = updatedClapCount;
                }
                cachedCount = updatedClapCount;
                clapBufferCount.innerHTML = '';
                clapCount.innerHTML = updatedClapCount;
                totalClaps += increment;
                bufferedClaps = 0;
                if (clapCount.classList.contains("d-none")) {
                    clapCount.classList.remove("d-none");
                }
                if (!clapBufferCount.classList.contains("d-none")) {
                    clapBufferCount.classList.add("d-none");
                }
            })
            .catch(() => {
                clapBtn.setAttribute("disabled", "disabled");
                clapBufferCount.innerHTML = '';
                bufferedClaps = 0;
                if (!clapBufferCount.classList.contains("d-none")) {
                    clapBufferCount.classList.add("d-none");
                }
                if (clapCount.classList.contains("d-none")) {
                    clapCount.classList.remove("d-none");
                }
                clapCount.innerHTML = "OFFLINE";
                clapMessageContainer.innerHTML = "Service is offline. Please try again later.";
            });
    }
}, 2000);

clapBtn.addEventListener("click", event => {
    // Track consecutive claps
    bufferedClaps++;
    updateCount();
    if (clapBufferCount.classList.contains("d-none")) {
        clapBufferCount.classList.remove("d-none");
    }
    clapBufferCount.innerHTML = ` (+${bufferedClaps})`;

    // Check if exceeded claps
    if (bufferedClaps + totalClaps >= MAX_CLAPS) {
        clapBtn.setAttribute("disabled", "disabled");
    }
});

clapBtn.addEventListener("mousedown", event => {
    // Left-click only
    if (event.button === 0) {
        let count = 4;
        countdownTimer = setInterval(() => {
            count--;
            multiclapCountdown.innerHTML = `Multiclapping in ${count}... `;
        }, 1000);
        confirmTimer = setTimeout(() => {
            clearInterval(countdownTimer);
            multiclapCountdown.innerHTML = 'Release or click off the button to stop. ';
            holdTimer = setInterval(() => {
                // Track consecutive claps
                bufferedClaps++;
                updateCount();
                if (clapBufferCount.classList.contains("d-none")) {
                    clapBufferCount.classList.remove("d-none");
                }
                clapBufferCount.innerHTML = ` (+${bufferedClaps})`;

                // Check if exceeded claps
                if (bufferedClaps + totalClaps >= MAX_CLAPS) {
                    clapBtn.setAttribute("disabled", "disabled");
                    if (holdTimer) {
                        clearInterval(holdTimer);
                    }
                }
            }, 100);
        }, 4000);
    }
});

["mouseup", "blur"].forEach(eventType => {
    clapBtn.addEventListener(eventType, event => {
        if (countdownTimer) {
            clearInterval(countdownTimer);
            multiclapCountdown.innerHTML = '';
        }
        if (confirmTimer) {
            clearInterval(confirmTimer);
        }
        if (holdTimer) {
            clearInterval(holdTimer);
        }
    });
});


document.addEventListener('DOMContentLoaded', (event) => {
    getClaps(clapData.attributes.api.value, clapData.attributes.url.value).then(res => {
        clapSpinner.classList.add("d-none");
        cachedCount = res;
        if (cachedCount > 0) {
            clapCount.innerHTML = cachedCount;
            clapCount.classList.remove("d-none");
        }
    });
});