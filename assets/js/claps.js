const MAX_CLAPS = 50;

const clapData = document.querySelector(".applause-container");
const clapBtn = document.querySelector(".applause-button");
const clapSpinner = document.querySelector(".applause-count-spinner");
const clapCount = document.querySelector(".applause-count");
const clapBufferCount = document.querySelector(".applause-buffer-count");
const clapMessageContainer = document.querySelector(".applause-message-container");
const multiclapCountdown = document.querySelector(".applause-multiclap-countdown");

const storagePostKey = `apblog-${clapData.attributes.slug.value}`;
const storageUserKey = 'apblog-storage-user-id';
var totalClaps = parseInt(window.localStorage.getItem(storagePostKey)) || 0;
var userId = window.localStorage.getItem(storageUserKey);
if (userId === null) {
  userId = window.crypto.randomUUID();
  window.localStorage.setItem(storageUserKey, userId);
}
var bufferedClaps = 0;
var confirmTimer, holdTimer, countdownTimer;

const debounce = (func, timeout = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

const handleResponse = (response) => {
  if (response.ok) {
    return response.json();
  }
  throw new Error(response.statusText);
}

const onError = () => {
  clapBtn.setAttribute("disabled", "disabled");
  if (clapCount.classList.contains("d-none")) {
    clapCount.classList.remove("d-none");
  }
  clapCount.innerHTML = "OFFLINE";
  clapMessageContainer.innerHTML = "Service is offline. Please try again later.";
}

const getClaps = (api, slug) =>
  fetch(`${api}/api/claps/${slug}`,)
    .then(handleResponse)
    .catch(onError);

const updateClaps = (api, slug, claps) =>
  fetch(`${api}/api/claps/${slug}`, {
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(claps),
  })
    .then(handleResponse)
    .catch(onError);

const updateCount = debounce(() => {
  if (totalClaps < MAX_CLAPS) {
    const increment = Math.min(
      bufferedClaps,
      MAX_CLAPS - totalClaps
    );
    // Send number claps and confirm if accepted by server
    updateClaps(clapData.attributes.api.value, clapData.attributes.slug.value, { claps: increment })
      .then(res => {
        const updatedClapCount = res.claps;
        clapBufferCount.innerHTML = '';
        clapCount.innerHTML = updatedClapCount;
        totalClaps += increment;
        window.localStorage.setItem(storagePostKey, totalClaps);
        if (window.umami) {
          window.umami.trackEvent(`Clapped for ${clapData.attributes.slug.value}`, { type: 'claps', userId: userId, claps: increment, postSlug: clapData.attributes.slug.value });
        }
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
  getClaps(clapData.attributes.api.value, clapData.attributes.slug.value).then(res => {
    clapSpinner.classList.add("d-none");
    if (res.claps > 0) {
      clapCount.innerHTML = res.claps;
      clapCount.classList.remove("d-none");
    }
    if (totalClaps < MAX_CLAPS) {
      clapBtn.removeAttribute("disabled");
    }
  });
});