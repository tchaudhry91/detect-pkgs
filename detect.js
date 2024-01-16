const parser = require("bash-parser");
const fs = require("node:fs");
const { execSync } = require("child_process");

function getPkgs(cmds) {
  let pkgs = new Set();
  cmds.forEach((c) => {
    if (c.name) {
      pkgs.add(c.name.text);
    }
  });
  return pkgs;
}

function filterCommandTypesRecursive(ast) {
  let cmds = [];
  if (ast.hasOwnProperty("commands")) {
    ast.commands.forEach((c) => {
      if (c.type === "Command") {
        if (c.name) {
          cmds.push(c);
        }
        if (c.prefix) {
          c.prefix.forEach((cm) => {
            if (cm.expansion) {
              cm.expansion.forEach((subAST) => {
                if (subAST.commandAST) {
                  let local = filterCommandTypesRecursive(subAST.commandAST);
                  cmds.push(...local);
                }
              });
            }
          });
        }
      }
      if (c.type === "Pipeline") {
        let local = filterCommandTypesRecursive(c);
        cmds.push(...local);
      }
    });
  }
  return cmds;
}

function checkCommandDeps(cmd) {
  // Check if the command is already available
  try {
    execSync(`which ${cmd}`);
    return [];
  } catch (e) {
    try {
      execSync(`apk add ${cmd}`);
      execSync(`which ${cmd}`);
      return [cmd];
    } catch (e) {
      return null;
    }
  }
}

try {
  const data = fs.readFileSync("script.sh", "utf8");
  const ast = parser(data);

  let cmds = filterCommandTypesRecursive(ast);
  let pkgs = getPkgs(cmds);

  var deps = new Set();
  pkgs.forEach((p) => {
    let packs = checkCommandDeps(p, true);
    // this means detection failed
    if (packs == null) {
      console.error("Exiting..Could not detect package for :" + p);
      process.exit(1);
    }
    packs.forEach((pack) => {
      deps.add(pack);
    });
  });
  let result = {
    deps: [...deps]
  };
  console.log(JSON.stringify(result));
} catch (err) {
  console.error(err);
}
