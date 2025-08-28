const path = require("path");
const initNh = require("node-haxball");
const headlessWrapper = require("node-haxball/src/headlessWrapper");
const API = initNh(); // initiate node-haxball API
const { HBInit } = headlessWrapper(API); // pass API object to headlessWrapper

const HAXBALL_TOKEN = "thr1.AAAAAGiwpnoOX5tbPqO68g.wCSP49KytFw"; // required

// we need this global function so external-scripts can use it normally
global.HBInit = (args) => {
  args.token = HAXBALL_TOKEN;
  const room = HBInit(args); // this is wrapper HBInit!!!
  return room;
};

const scriptPath = process.argv[2];
if (!scriptPath) {
  console.error("❌ You must provide a script path, e.g.: node index.js Beginner/Powershot");
  process.exit(1);
}

require(path.resolve(`external-scripts/${scriptPath}.js`));