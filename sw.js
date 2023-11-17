const target = { targetId: 'browser' }

function injection() {
    alert("Yo!!");
}

async function onNetEvent(_, _, event) {
    if (!event.request.url.startsWith("chrome-extension:")) {
        await chrome.debugger.sendCommand(target, "Fetch.continueRequest", {
            requestId: event.requestId
        });
        return;
    };

    await chrome.debugger.sendCommand(target, "Fetch.fulfillRequest", {
        requestId: event.requestId,
        responseCode: 200,
        body: btoa(`(${injection.toString()})()`)
    })
}

async function start() {
    await chrome.debugger.attach(target, '1.3');
    // let { targetInfos } = await chrome.debugger.sendCommand(target, 'Target.getTargets');

    chrome.debugger.onEvent.addListener(onNetEvent)
    await chrome.debugger.sendCommand(target, 'Fetch.enable');
}

async function stop() {
    await chrome.debugger.detach(target);
}

start();