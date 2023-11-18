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
                        writer.onwriteend = function () {
                            resolve(entry)
                        }
                    });
                })
            })
        }
        function removeFile(name) {
            return new Promise(function (resolve) {
                fs.root.getFile(name, {create: true}, function (entry) {
                    entry.remove(resolve);
                })
            })
        }
        function filemain() {
            function buildBlobWithScript(script) {
                var scriptURL = URL.createObjectURL(new Blob([script], {type: "text/javascript"}));
                var htmlURL = URL.createObjectURL(new Blob([`<script src="${scriptURL}"></script>`]));
                open(htmlURL);
            }
            document.querySelector('button').onclick = () => {eval(document.querySelector('textarea').value)};
        }
        await removeFile('shim.html');
        await removeFile('shim.js');
        var entry = await writeFile("shim.html", "<textarea></textarea><br/><button>Evaluate</button><script src=\"shim.js\"></script>");
        await writeFile("shim.js", `(${filemain.toString()})()`);
        alert("Save this in your bookmarks: " + entry.toURL());

    })
    }
}
var onInjectionFinished;
var extPrefixContext;
async function searchForBackgroundPage() {
    var {targetInfos: infos} = await chrome.debugger.sendCommand(target, 'Target.getTargets');
    var result;
    infos.forEach(function (info){
        if (info.url.startsWith("chrome-extension://" + extPrefixContext) && info.type.includes('background')) {
            console.log(info);
            result = info;
        }
    })
    return result;
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
    onInjectionFinished({ status: `success visit chrome-extension://${extPrefixContext}/_generated_background_page.html to commence further with the code execution process.` });
}

async function start() {
    await chrome.debugger.attach(target, '1.3');
    // let { targetInfos } = await chrome.debugger.sendCommand(target, 'Target.getTargets');
    if (extPrefixContext && extPrefixContext !== '' ) {
        // var {url: pageURL, browserContextId} = await searchForBackgroundPage();
        // await chrome.debugger.sendCommand(target, 'Target.createTarget', {url: pageURL, browserContextId});
    }
    chrome.debugger.onEvent.addListener(onNetEvent)
    await chrome.debugger.sendCommand(target, 'Fetch.enable');
}

async function stop() {
    await chrome.debugger.detach(target);
}

chrome.runtime.onMessage.addListener(async function (msg, sender, respondWith) {
    const { prefix } = msg;
    
    if (msg.type === "start-inspect") {
        extPrefixContext = msg.prefix;
        await start();
        onInjectionFinished = respondWith;
    }
    if (msg.type === "cancel-inspect") {
        await stop();
        respondWith({status: 'success'});
    }
});
