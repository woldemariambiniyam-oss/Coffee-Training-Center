const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function ensure() {
	const conn = await mysql.createConnection({
		host: process.env.DB_HOST || 'localhost',
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME || 'coffee_training_center',
		port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
	});
	try {
		await conn.query('CREATE DATABASE IF NOT EXISTS coffee_training_center;');
		await conn.query('USE coffee_training_center;');

		// Create training_programs if missing
		await conn.query(`
			CREATE TABLE IF NOT EXISTS training_programs (
				id INT PRIMARY KEY AUTO_INCREMENT,
				name VARCHAR(255) NOT NULL,
				code VARCHAR(50) UNIQUE NOT NULL,
				description TEXT,
				category ENUM('coffee_processing', 'cupping', 'brewing', 'quality_control', 'other') NOT NULL,
				duration_days INT DEFAULT 1,
				is_active BOOLEAN DEFAULT TRUE,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				INDEX idx_code (code),
				INDEX idx_category (category)
			);
		`);

		// Add program_id column to training_sessions if missing
		const [cols] = await conn.query(`
			SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
			WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'training_sessions' AND COLUMN_NAME = 'program_id';
		`);
		if (cols.length === 0) {
			await conn.query(`ALTER TABLE training_sessions ADD COLUMN program_id INT NULL;`);
			await conn.query(`ALTER TABLE training_sessions ADD INDEX idx_program (program_id);`);
			await conn.query(`ALTER TABLE training_sessions ADD CONSTRAINT fk_sessions_program FOREIGN KEY (program_id) REFERENCES training_programs(id) ON DELETE SET NULL;`);
		}

		console.log('✓ Ensured training_programs and training_sessions.program_id exist');
	} finally {
		await conn.end();
	}
}

ensure().catch(err => {
	console.error('Error ensuring program schema:', err.message);
	process.exit(1);
});


