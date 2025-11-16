const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function getConnection() {
	return await mysql.createConnection({
		host: process.env.DB_HOST || 'localhost',
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME || 'coffee_training_center',
		port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
		multipleStatements: true
	});
}

async function runSqlFile(filePath) {
	let conn;
	try {
		const raw = fs.readFileSync(filePath, 'utf8');
		// naive split by semicolon at end of line; keeps comments intact
		const statements = raw
			.split(/;\s*[\r\n]+/g)
			.map(s => s.trim())
			.filter(s => s.length > 0 && !s.startsWith('--'));
		conn = await getConnection();
		let applied = 0;
		for (const stmt of statements) {
			try {
				await conn.query(stmt);
				applied++;
			} catch (e) {
				// Log and continue to make the script idempotent
				console.warn(`Skipping statement due to error: ${e.message}`);
			}
		}
		console.log(`✓ Applied ${applied} statements from ${path.basename(filePath)}`);
	} catch (err) {
		console.error(`Error applying ${path.basename(filePath)}:`, err.message);
		process.exitCode = 1;
	} finally {
		if (conn) await conn.end();
	}
}

(async () => {
	const baseDir = path.resolve(__dirname, '..', '..', 'database');
	const schemaUpdates = path.join(baseDir, 'schema_updates.sql');
	const fixedUpdates = path.join(baseDir, 'fixed_schema_updates.sql');

	if (fs.existsSync(schemaUpdates)) {
		await runSqlFile(schemaUpdates);
	} else {
		console.warn('schema_updates.sql not found, skipping.');
	}

	if (fs.existsSync(fixedUpdates)) {
		await runSqlFile(fixedUpdates);
	} else {
		console.warn('fixed_schema_updates.sql not found, skipping.');
	}
})();


