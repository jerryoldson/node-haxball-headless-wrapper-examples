// This is a browser-only example focusing on running the API inside the website: https://www.haxball.com/headless
// To test, directly copy and paste this code into the browser console.
// You might provide a headless token like this: https://www.haxball.com/headless?token=thr1.AAAAAGZ6tHrTNjEqONznoQ.xlDgVJTT31k
// BUG: Currently receiving "Connection closed (0)" while joining a room that was created using this script.

var EnglishLanguage = null, token = window.location.search.startsWith("?token=")?window.location.search.substring(7):""; // Or you might write your token here.

delete window.HBInit;

var loadScript = (url, isModule) => new Promise((resolve, reject)=>{
  if (isModule)
    window.module = {};
  var s=document.createElement("script");
  s.src=url;
  s.onerror=(error)=>{
    delete window.module;
    reject(error);
  };
  s.onload=()=>{
    var m = isModule ? window.module.exports : null;
    delete window.module;
    resolve(m);
  };
  document.body.appendChild(s);
});

Promise.all([
  loadScript("https://cdn.jsdelivr.net/gh/wxyz-abcd/node-haxball@latest/examples_web/src/vendor/json5.min.js", false),
  loadScript("https://cdn.jsdelivr.net/gh/wxyz-abcd/node-haxball@latest/examples_web/src/vendor/pako-jszip.min.js", false),
  loadScript("https://cdn.jsdelivr.net/gh/wxyz-abcd/node-haxball@latest/src/api.js", false), 
  loadScript("https://cdn.jsdelivr.net/gh/wxyz-abcd/node-haxball@latest/examples/languages/englishLanguage.js", true) // if you want to use error.toString()
]).then(([i, j, k, l])=>{
  if (token.length>0)
    start();
  else
    showRecaptcha();
});

function showRecaptcha(){
  window.document.head.innerHTML = "";
  window.document.body.innerHTML = "";
  var c = document.createElement("iframe");
  c.style = "width:100%;height:100%";
  c.src = "https://www.haxball.com/headlesstoken";
  document.body.appendChild(c);
  function f(){
    var t = c.contentDocument.body.getElementsByTagName("pre")[0]?.innerText;
    if (!t)
      setTimeout(f, 500);
    else{
      t = t.slice(17, -1);
      if (t){
        token = t;
        start();
      }
      else
        showRecaptcha();
    }
  }
  f();
}

function _start(API, fStart){
  window.document.head.innerHTML = "";
  window.document.body.innerHTML = "";
  console.log("starting with token = "+token);

  API.Language.current = new EnglishLanguage(API); // if you want to use error.toString()
  fStart(API);
}

function start(){
  _start(API, example);
}

function example(API){
    loadScript("https://cdn.jsdelivr.net/gh/wxyz-abcd/node-haxball@latest/src/headlessWrapper.js", true).then(()=>{
        const { HBInit } = headlessWrapper(API);
        
        window.startHeadless = (arg) => {
            if (typeof arg == "function") {
                arg();
            } else if (typeof arg == "string") {
                loadScript(arg, false);
            } else {
                console.error("startHeadless requires a function or a string")
            }
        }

        const myScript = () => {
            const room = HBInit({ name: "my pretty haxball script :)" });
            room.onRoomLink = (link) => console.log(link);
            room.onPlayerJoin = (player) => {
                console.log(`${player.name} joined the room`);
                room.sendAnnouncement(`Welcome ${player.name}!`, player.id, 0xFFFFFF, "bold", 2);
                room.setPlayerAdmin(player.id, true);
            };
        };

        startHeadless(myScript);
        //startHeadless("https://raw.githubusercontent.com/thenorthstar/HaxBall-Example-Scripts/4dc7384e9b3fe095e1183357919ae0675eba4f55/Beginner/Collision.js");
    });
}