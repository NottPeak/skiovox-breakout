let extensionPrefix = document.querySelector("input").value;
let payload = document.querySelector("textarea").value;
let status = document.querySelector("#status");
let [start, cancel] = document.querySelectorAll("button");
function changeStatusMessage(message) {
    status.textContent = ([message] || [""]).join();
}
function checkIfValid() {
    return new Promise((resolve, reject) => {
        resolve(Boolean(extensionPrefix.length > 0));
    });
}
start.addEventListener("click", async function () {
    let valid = await checkIfValid();
    if (!valid) return;
    let msg = await chrome.runtime.sendMessage({ type: "start-inspect", prefix: extensionPrefix, payload: payload });
    if (!msg) return changeStatusMessage("failed!");
    return changeStatusMessage(msg);
});

cancel.addEventListener("click", async function () {
    let msg = await chrome.runtime.sendMessage({ type: "cancel-inspect" });
    if (!msg) return changeStatusMessage("failed!");
    return changeStatusMessage("canceled");
});