const parser = require('bash-parser');
const fs  = require('node:fs');

try {
	const data = fs.readFileSync('script.sh', 'utf8');
	const ast = parser(data);
	const commands = ast.commands.filter((c) => {return c.type === "Command"});
} catch (err) {
	console.error(err)
}
