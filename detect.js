const parser = require("bash-parser");
const fs = require("node:fs");
const { exec } = require("child_process");

function getPkgs(cmds) {
  let pkgs = new Set();
  cmds.forEach((c) => {
    pkgs.add(c.name.text);
  });
  return pkgs;
}

function filterCommandTypesRecursive(ast) {
  let cmds = [];
  if (ast.hasOwnProperty("commands")) {
    ast.commands.forEach((c) => {
      if (c.type === "Command") {
        cmds.push(c);
      }
      if (c.type === "Pipeline") {
        let local = filterCommandTypesRecursive(c);
        cmds.push(...local);
      }
    });
  }
  return cmds;
}

function checkCommandDeps(cmd, install) {
  // Check if the command is already available
  exec(`which ${cmd}`, (error, stdout, stderr) => {
    if (!error) {
      return [];
    }
    // check if we can install a package with the same name and then get the command working
    // a better version would be apt-file like alternative, but that doesn't yet exist for alpine
    // In most cases this should be enough.
    if (install) {
      exec(`apk add ${cmd}`),
        (error, stdout, stderr) => {
          if (!error) {
            // Retry
            return checkCommandDeps(cmd, false);
          }
        };
    }

    // If nothing else, print a fail message but do not exit
    console.log("Could not resolve package for command:" + cmd);
  });
}

try {
  const data = fs.readFileSync("script.sh", "utf8");
  const ast = parser(data);

  let cmds = filterCommandTypesRecursive(ast);
  let pkgs = getPkgs(cmds);

  var deps = new Set();
  pkgs.forEach((p) => {
    checkCommandDeps(p, true);
  });
} catch (err) {
  console.error(err);
}
