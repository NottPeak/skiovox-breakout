
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
        const code =  function () {
            alert("wassup");
        }
        chrome.debugger.onEvent.addListener(async function (e, v, p) {
            var reqID = p.requestId;
            var isGoguardian = p.request.url.includes("haldl");
            if (isGoguardian) {
                await chrome.debugger.sendCommand({targetId: "browser"}, "Fetch.fullfillRequest", {
                    requestId: reqID,
                    responseCode: 200,
                    body: atob(`(${code.toString()})()`)
                })
                
            }
        })
        await chrome.debugger.sendCommand({targetId: 'browser'}, 'Fetch.enable');



    }
    if (msg.type === "cancelinspect") {
        await chrome.debugger.detach({ targetId: 'browser' });
        sendResponse({ error: null, type: 'response', data: {} });
    }
})
