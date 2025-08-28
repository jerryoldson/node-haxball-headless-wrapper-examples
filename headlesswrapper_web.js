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
  //loadScript("https://cdn.jsdelivr.net/gh/wxyz-abcd/node-haxball@latest/examples/languages/englishLanguage.js", true) // if you want to use error.toString()
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

function start(){
  window.document.head.innerHTML = "";
  window.document.body.innerHTML = "";
  console.log("starting with token = "+token);

  const { OperationType, VariableType, ConnectionState, AllowFlags, Direction, CollisionFlags, CameraFollow, BackgroundType, GamePlayState, BanEntryType, Callback, Utils, Room, Replay, Query, Library, RoomConfig, Plugin, Renderer, Errors, Language, EventFactory, Impl } = API = abcHaxballAPI(window);
  const {HBInit} = headlessWrapper(API);
var colors = {
    Chat: {
        Admin: {
            Collision: [0x00FF00, 0x00FF00]
        },
        Commands: [0xFFFFFF, 0xFFFFFF],
        NoAuthorization: {
            Collision: [0xFF0000, 0xFF0000]
        },
        NotACommand: 0xFF0000,
        Player: [0xFFFFFF, 0xFFDB72],
        SomethingWentWrong: {
            Commands: 0xFFFF00
        }
    },
    Join: {
        Welcome: 0xFFFFFF
    }
};

var fonts = {
    Chat: {
        Admin: {
            Collision: ["normal", "normal"]
        },
        Commands: ["normal", "normal"],
        NoAuthorization: {
            Collision: ["bold", "bold"]
        },
        NotACommand: "bold",
        Player: ["normal", "bold"],
        SomethingWentWrong: {
            Commands: "bold"
        }
    },
    Join: {
        Welcome: "normal"
    }
};

var sounds = {
    Chat: {
        Admin: {
            Collision: [1, 1]
        },
        Commands: [1, 1],
        NoAuthorization: {
            Collision: [2, 2]
        },
        NotACommand: 2,
        Player: [1, 1],
        SomethingWentWrong: {
            Commands: 1
        }
    },
    Join: {
        Welcome: 1
    }
};

var roomObject = {
    collision: true,
    commandPrefix: "!",
    maxPlayers: 20,
    name: "Collision Feature",
    noPlayer: true,
    password: null,
    public: true,
    recaptcha: false,
    scoreLimit: 0,
    teamsLock: true,
    timeLimit: 0,
    token: null
};

var messages = {
    Chat: {
        Admin: {
            Collision: ["Collision feature was deactivated!", "Collision feature was activated!"]
        },
        Commands: ["Available commands: !admin, !commands", "Available commands: !admin, !collision, !commands"],
        NoAuthorization: {
            Collision: ["You have no authorization to activate the collision feature!", "You have no authorization to deactivate on the collision feature!"]
        },
        NotACommand: "There's no such a command. Type !commands to see commands.",
        SomethingWentWrong: {
            Commands: "Something went wrong with this command. Please try again."
        }
    },
    Join: {
        Welcome: "Welcome!"
    }
};

var commands = ["!admin", "!collision", "!commands"];

var room = HBInit({ token:token, roomName: roomObject.name, noPlayer: roomObject.noPlayer, public: roomObject.public, maxPlayers: roomObject.maxPlayers });
room.onRoomLink = (link) => console.log(link);
room.onPlayerJoin = player => room.setPlayerAdmin(player.id, true);
var cf = room.CollisionFlags;
console.log(cf)
var pushOff_cGroups = [cf.c0, cf.c1];
var pushOn_cGroups = [cf.red, cf.blue];
var push_cGroups = [pushOff_cGroups, pushOn_cGroups];
var cGroups = [pushOff_cGroups, pushOn_cGroups];

var chatFunctions = [chat_admin, chat_collision, chat_commands];

function chat_admin(player, message) {
    if (message.split(" ")[0] == commands[0]) {
        room.setPlayerAdmin(player.id, !player.admin);
        return false;
    }
}

function chat_collision(player, message) {
    if (message.split(" ")[0] == commands[1]) {
        if (player.admin == true) {
            roomObject.collision = !roomObject.collision;
            var players = room.getPlayerList().filter(p => room.getPlayerDiscProperties(p.id) != null && room.getPlayerDiscProperties(p.id).cGroup != push_cGroups[Number(roomObject.collision)][p.team - 1]);
            players.forEach(p => room.setPlayerDiscProperties(p.id, { cGroup: push_cGroups[Number(roomObject.collision)][p.team - 1] }));       
            room.sendAnnouncement(`${messages.Chat.Admin.Collision[Number(roomObject.collision)]}`, player.id, colors.Chat.Admin.Collision[Number(roomObject.collision)], fonts.Chat.Admin.Collision[Number(roomObject.collision)], sounds.Chat.Admin.Collision[Number(roomObject.collision)]);
            return false;
        }
        else {
            room.sendAnnouncement(`${messages.Chat.NoAuthorization.Collision[Number(roomObject.collision)]}`, player.id, colors.Chat.NoAuthorization.Collision[Number(roomObject.collision)], fonts.Chat.NoAuthorization.Collision[Number(roomObject.collision)], sounds.Chat.NoAuthorization.Collision[Number(roomObject.collision)]);
            return false;
        }
    }
}

function chat_commands(player, message) {
    if (message.split(" ")[0] == commands[2]) {
        room.sendAnnouncement(`${messages.Chat.Commands[Number(player.admin)]}`, player.id, colors.Chat.Commands[Number(player.admin)], fonts.Chat.Commands[Number(player.admin)], sounds.Chat.Commands[Number(player.admin)]);
        return false;
    }
}

function isCommand(string) {
    return commands.includes(string) == true || commands.includes(string.split(" ")[0]) == true;
}

function resetCollisions(){
    var players = room.getPlayerList().filter(p => room.getPlayerDiscProperties(p.id) != null && room.getPlayerDiscProperties(p.id).cGroup != push_cGroups[Number(roomObject.collision)][p.team - 1]);
    players.forEach(p => room.setPlayerDiscProperties(p.id, { cGroup: push_cGroups[Number(roomObject.collision)][p.team - 1] }));
}

room.onGameStart = function(byPlayer){
    resetCollisions();
}

room.onPlayerChat = function (player, message) {
    console.log(`${player.name}: ${message}`);

    if (message.startsWith(roomObject.commandPrefix) == true) {
        if (isCommand(message) == true) {
            var index = commands.indexOf(message.split(" ")[0]);
            index !== -1 ? chatFunctions[index](player, message) : room.sendAnnouncement(`${messages.Chat.SomethingWentWrong.Commands}`, player.id, colors.Chat.SomethingWentWrong.Commands, fonts.Chat.SomethingWentWrong.Commands, sounds.Chat.SomethingWentWrong.Commands);
            return false;
        }
        else {
            room.sendAnnouncement(`${messages.Chat.NotACommand}`, player.id, colors.Chat.NotACommand, fonts.Chat.NotACommand, sounds.Chat.NotACommand);
            return false;
        }
    }
    else {
        room.sendAnnouncement(`${player.name}: ${message}`, null, colors.Chat.Player[Number(player.admin)], fonts.Chat.Player[Number(player.admin)], sounds.Chat.Player[Number(player.admin)]);
        return false;
    }
}
  
}

function headlessWrapper(API){
    const { Room, Utils, OperationType, Errors, CollisionFlags } = API, cf = Object.keys(CollisionFlags).reduce((obj, key)=>{ obj[key] = 1<<CollisionFlags[key]; return obj; }, {});
    function HBInit({ roomName, playerName, password, maxPlayers, public, geo, token, noPlayer }){
        var room = null, retRoom = { };
        // basro's terrible logic asserts that we have to create and return new objects instead of original objects to prevent their direct modification.
        function convertPlayer(h){
            if (h==null)
                return null;
            let n = null, v = h.disc;
            if (v!=null)
                n = {
                    x: v.pos.x,
                    y: v.pos.y
                };
            return {
                name: h.name,
                team: h.team.id,
                id: h.id,
                admin: h.isAdmin,
                position: n,
                auth: h.auth,
                conn: h.conn
            };
        }
        function getScoresObject(r){
            return (!r.gameState)?null:{
                red: r.gameState.redScore, 
                blue: r.gameState.blueScore, 
                time: r.gameState.timeElapsed, 
                scoreLimit: r.gameState.scoreLimit, 
                timeLimit: r.gameState.timeLimit
            };
        }
        function getDiscPropertiesObject(h){
            return (h==null) ? null : {
                x: h.pos.x,
                y: h.pos.y,
                xspeed: h.speed.x,
                yspeed: h.speed.y,
                xgravity: h.gravity.x,
                ygravity: h.gravity.y,
                radius: h.radius,
                bCoeff: h.bCoeff,
                invMass: h.invMass,
                damping: h.damping,
                color: h.color,
                cMask: h.cMask,
                cGroup: h.cGroup
            };
        }
            Room.create({
                name: roomName, 
                password: password, 
                showInRoomList: public, 
                maxPlayerCount: maxPlayers,
                token: token,
                noPlayer: noPlayer
            }, {
                storage: {
                    player_name: playerName,
                },
                onOpen: (r)=>{
                    room = r;
                    r.onPlayerJoin = (playerObj)=>retRoom.onPlayerJoin?.(convertPlayer(playerObj));
                    r.onPlayerLeave = (playerObj, reason, isBanned, byId)=>((reason==null)?retRoom.onPlayerLeave?.(convertPlayer(playerObj)):retRoom.onPlayerKicked?.(convertPlayer(playerObj), reason, isBanned, convertPlayer(r.getPlayer(byId))));
                    r.onGameEnd = (winningTeamId)=>retRoom.onTeamVictory?.(getScoresObject(r));
                    r.onBeforeOperationReceived = (type, msg)=>((type!=OperationType.SendChat)||(msg.byId==0)||retRoom.onPlayerChat?.(convertPlayer(r.getPlayer(msg.byId)), msg.text));
                    r.onPlayerBallKick = (playerId)=>retRoom.onPlayerBallKick?.(convertPlayer(r.getPlayer(playerId)));
                    r.onTeamGoal = (teamId)=>retRoom.onTeamGoal?.(teamId);
                    r.onGameStart = (byId)=>retRoom.onGameStart?.(convertPlayer(r.getPlayer(byId)));
                    r.onGameStop = (byId)=>retRoom.onGameStop?.(convertPlayer(r.getPlayer(byId)));
                    r.onPlayerAdminChange = (id, isAdmin, byId)=>retRoom.onPlayerAdminChange?.(convertPlayer(r.getPlayer(id)), convertPlayer(r.getPlayer(byId)));
                    r.onPlayerTeamChange = (id, teamId, byId)=>retRoom.onPlayerTeamChange?.(convertPlayer(r.getPlayer(id)), convertPlayer(r.getPlayer(byId)));
                    r.onGameTick = ()=>retRoom.onGameTick?.();
                    r.onGamePauseChange = (isPaused, byId)=>(isPaused?retRoom.onGamePause?.(convertPlayer(r.getPlayer(byId))):retRoom.onGameUnpause?.(convertPlayer(r.getPlayer(byId))));
                    r.onPositionsReset = ()=>retRoom.onPositionsReset?.();
                    r.onPlayerInputChange = (id, value)=>retRoom.onPlayerActivity?.(convertPlayer(r.getPlayer(id)));
                    r.onStadiumChange = (stadium, byId)=>retRoom.onStadiumChange?.(stadium.name, convertPlayer(r.getPlayer(byId)));
                    r.onRoomLink = (link)=>retRoom.onRoomLink?.(link);
                    r.onKickRateLimitChange = (min, rate, burst, byId)=>retRoom.onKickRateLimitSet?.(min, rate, burst, convertPlayer(r.getPlayer(byId)));
                    r.onTeamsLockChange = (value, byId)=>retRoom.onTeamsLockChange?.(value, convertPlayer(r.getPlayer(byId)));
                },
                onClose: (msg)=>{
                    room = null;
                    if (msg?.code==Errors.ErrorCodes.MissingRecaptchaCallbackError)
                        console.error("Invalid token");
                    else if (msg)
                        console.error("Bot has left the room:" + msg.code);
                    throw "";
                }
            });
            Object.assign(retRoom, {
                nhInstance: room,
                sendChat: (message, targetId)=>Utils.runAfterGameTick(()=>room.sendChat(message, targetId)),
                setPlayerAdmin: (playerID, admin)=>Utils.runAfterGameTick(()=>room.setPlayerAdmin(playerID, admin)),
                setPlayerTeam: (playerID, team)=>Utils.runAfterGameTick(()=>room.setPlayerTeam(playerID, team)),
                kickPlayer: (playerID, reason, ban)=>Utils.runAfterGameTick(()=>room.kickPlayer(playerID, reason, ban)),
                clearBan: (playerId)=>room.clearBan(playerId),
                clearBans: ()=>room.clearBans(),
                setScoreLimit: (limit)=>Utils.runAfterGameTick(()=>room.setScoreLimit(limit)),
                setTimeLimit: (limit)=>Utils.runAfterGameTick(()=>room.setTimeLimit(limit)),
                setCustomStadium: (stadiumFileContents)=>Utils.runAfterGameTick(()=>room.setCurrentStadium(Utils.parseStadium(stadiumFileContents))),
                setDefaultStadium: (stadiumName)=>Utils.runAfterGameTick(()=>room.setCurrentStadium(Utils.getDefaultStadiums().find((stadium)=>stadium.name==stadiumName))),
                setTeamsLock: (locked)=>Utils.runAfterGameTick(()=>((room.teamsLocked!=locked) && room.lockTeams())),
                setTeamColors: (team, angle, textColor, colors)=>Utils.runAfterGameTick(()=>room.setTeamColors(team, angle, textColor, ...colors)),
                startGame: ()=>Utils.runAfterGameTick(()=>room.startGame()),
                stopGame: ()=>Utils.runAfterGameTick(()=>room.stopGame()),
                pauseGame: (pauseState)=>Utils.runAfterGameTick(()=>((room.isGamePaused()!=pauseState) && room.pauseGame())),
                getPlayer: (playerId)=>convertPlayer(room.getPlayer(playerId)),
                getPlayerList: ()=>room.players.map(convertPlayer),
                getScores: ()=>getScoresObject(room),
                getBallPosition: ()=>{var b = room.getBall();return b?{x: b.pos.x, y: b.pos.y}:null;},
                startRecording: ()=>room.startRecording(),
                stopRecording: ()=>room.stopRecording(),
                setPassword: (pass)=>room.setProperties({password: pass}),
                setRequireRecaptcha: (required)=>(room.requireRecaptcha = required),
                reorderPlayers: (playerIdList, moveToTop)=>Utils.runAfterGameTick(()=>room.reorderPlayers(playerIdList, moveToTop)),
                sendAnnouncement: (msg, targetId, color, style, sound)=>Utils.runAfterGameTick(()=>room.sendAnnouncement(msg, targetId, color, style, sound), 3),
                setKickRateLimit: (min = 2, rate = 0, burst = 0)=>Utils.runAfterGameTick(()=>room.setKickRateLimit(min, rate, burst)),
                setPlayerAvatar: (playerId, avatar)=>Utils.runAfterGameTick(()=>room.setPlayerAvatar(playerId, avatar, true)),
                setDiscProperties: (discIndex, properties)=>Utils.runAfterGameTick(()=>room.setDiscProperties(discIndex, properties)),
                getDiscProperties: (discIndex)=>getDiscPropertiesObject(room.getDisc(discIndex)),
                setPlayerDiscProperties: (playerId, properties)=>Utils.runAfterGameTick(()=>room.setPlayerDiscProperties(playerId, properties)),
                getPlayerDiscProperties: (playerId)=>getDiscPropertiesObject(room.getPlayer(playerId)?.disc),
                getDiscCount: ()=>(room.gameState?.physicsState.discs.length||0),
                CollisionFlags: cf
            });
            retRoom.onHBLoaded?.();
        return retRoom;
    };
    return {
        HBInit
    };
}

if (typeof exports!=='undefined'){
    if (typeof module!=='undefined' && module.exports)
        exports = module.exports = headlessWrapper;
    exports["headlessWrapper"] = headlessWrapper;
}
else if (typeof root!=='undefined')
    root["headlessWrapper"] = headlessWrapper;
else 
    window["headlessWrapper"] = headlessWrapper;
