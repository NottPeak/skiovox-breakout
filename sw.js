const target = { targetId: 'browser' }

function injection() {
    if (!self.isRunning) {
        self.isRunning = true;
    webkitRequestFileSystem(TEMPORARY, 1024 * 1024 * 300, async function (fs) {
        function writeFile(name, data) {
            return new Promise((resolve) => {
                fs.root.getFile(name, {create: true}, function (entry) {
                    entry.createWriter(function (writer) {
                        writer.write(new Blob([data]));
                        writer.onwriteend = resolve;
                    });
                })
            })
        }
        await writeFile("shim.html", "<textarea></textarea><br/><button>Evaluate</button><script src=\"shim.js\"></script>");
        await writeFile("shim.js", "document.querySelector('button').onclick = () => {eval(document.querySelector('textarea').value)};")
    })
    }
}
var onInjectionFinished;
var extPrefixContext;
async function searchForBackgroundPage() {
    
}
async function onNetEvent(_, _, event) {
    if (!event.request.url.startsWith("chrome-extension://" + extPrefixContext)) {
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
    onInjectionFinished({status: 'success'});
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

chrome.runtime.onMessage.addListener(async function (msg, sender, respondWith) {
    if (msg.type === "startinspect") {
        extPrefixContext = msg.prefix;
        await start();
        onInjectionFinished = respondWith;
    }
    if (msg.type === "cancelinspect") {
        await stop();
        respondWith({status: 'success'});
    }
})