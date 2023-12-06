const parser = require('bash-parser');
const fs  = require('node:fs');

function getPkgs(cmds) {
	let pkgs = new Set();
	cmds.forEach((c) => {
		pkgs.add(c.name.text);
	});
	return pkgs
}

function filterCommandTypesRecursive(ast) {
	let cmds = [];
	if (ast.hasOwnProperty('commands')){
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

try {
	const data = fs.readFileSync('script.sh', 'utf8');
	const ast = parser(data);

	let cmds = filterCommandTypesRecursive(ast)
	let pkgs = getPkgs(cmds);
	console.log(pkgs);
} catch (err) {
	console.error(err)
}
