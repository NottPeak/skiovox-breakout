let extensionPrefix = document.querySelector("input").value;
let payload = document.querySelector("textarea").value;
let status = document.querySelector("#status");
let [cancel, start] = document.querySelectorAll("button");  
let sections = document.querySelectorAll('body>div');
function changeStatusMessage(message) {
    status.textContent = ([message] || [""]).join();
}
function checkIfValid() {
    return new Promise((resolve, reject) => {
        resolve(Boolean(document.querySelector("input").value.length > 0));
    });
}
start.addEventListener("click", async function () {
    let valid = await checkIfValid();
    if (!valid) return;
    payload = document.querySelector("textarea").value;
    extensionPrefix = document.querySelector("input").value;
    const { status } = await chrome.runtime.sendMessage({ type: "start-inspect", prefix: extensionPrefix, payload: payload === '' ? undefined : payload });
    if (!status) return changeStatusMessage("failed!");
    return changeStatusMessage(status);
});

cancel.addEventListener("click", async function () {
    let msg = await chrome.runtime.sendMessage({ type: "cancel-inspect" });
    if (!msg) return changeStatusMessage("failed!");
    return changeStatusMessage("canceled");
});
var currentIndex = 0;
function switchToNextSlide() {
    sections[currentIndex].style.display = 'none';

    if (currentIndex+1 >= sections.length) {
        currentIndex = -1;
    }
    var newIndex = currentIndex + 1;
}
window.onkeydown = async function (ev) {
    if (ev.repeat) return;
    if (ev.key === 'Left') {

    }
}
