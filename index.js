(/** @type {HTMLButtonElement} */ document.querySelector('#startinjection')).addEventListener('click', async function (ev){
    var msg = await chrome.runtime.sendMessage({type: "startinspect",prefix: document.querySelector('#extid').value});
    console.log(msg);
})
document.querySelector('#cancelinjection').addEventListener('click', async function (ev){
    var m = await chrome.runtime.sendMessage({type: 'cancelinspect'});
    console.log(m);
})