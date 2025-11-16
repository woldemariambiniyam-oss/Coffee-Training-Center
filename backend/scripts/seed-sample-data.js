const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

function log(msg) { console.log(msg); }

async function getConn() {
	return await mysql.createConnection({
		host: process.env.DB_HOST || 'localhost',
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME || 'coffee_training_center',
		port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
	});
}

async function seed() {
	const conn = await getConn();
	try {
		await conn.query('CREATE DATABASE IF NOT EXISTS coffee_training_center;');
		await conn.query('USE coffee_training_center;');

		// Ensure base admin exists (schema.sql already inserts it)
		const [adminRows] = await conn.query(`SELECT id FROM users WHERE email='admin@coffeetraining.com'`);
		const adminId = adminRows[0]?.id || 1;

		// Seed programs
		await conn.query(`INSERT IGNORE INTO training_programs (id, name, code, description, category, duration_days) VALUES
			(1,'Espresso Basics','ESP-BAS','Intro to espresso','brewing',1),
			(2,'Coffee Cupping','CUP-101','Sensory evaluation','cupping',1)
		`);
		log('✓ Programs seeded');

		// Seed trainer
		const [trainerRows] = await conn.query(`SELECT id FROM users WHERE email='trainer1@ctc.local'`);
		let trainerId = trainerRows[0]?.id;
		if (!trainerId) {
			await conn.query(
				`INSERT INTO users (email, password_hash, first_name, last_name, phone, role, status) VALUES
				('trainer1@ctc.local', '$2a$10$kGkdTrJptCqWF7erNkGnceAnaAqhpp3knD9R5KBs4YYo8O1Ew3kI6', 'Trainer', 'One', '+10000000010', 'trainer', 'active')`
			);
			trainerId = (await conn.query(`SELECT id FROM users WHERE email='trainer1@ctc.local'`))[0][0].id;
		}
		log('✓ Trainer ensured');

		// Seed trainees
		const trainees = [
			{ email: 'trainee1@ctc.local', first: 'Trainee', last: 'One', phone: '+10000000001' },
			{ email: 'trainee2@ctc.local', first: 'Trainee', last: 'Two', phone: '+10000000002' },
			{ email: 'trainee3@ctc.local', first: 'Trainee', last: 'Three', phone: '+10000000003' }
		];
		for (const t of trainees) {
			await conn.query(
				`INSERT IGNORE INTO users (email, password_hash, first_name, last_name, phone, role, status)
				 VALUES (?, '$2a$10$kGkdTrJptCqWF7erNkGnceAnaAqhpp3knD9R5KBs4YYo8O1Ew3kI6', ?, ?, ?, 'trainee', 'active')`,
				[t.email, t.first, t.last, t.phone]
			);
		}
		log('✓ Trainees ensured');

		// Seed sessions linked to programs
		const now = new Date();
		const iso = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
		const start1 = new Date(now.getTime() + 24 * 3600 * 1000);
		const start2 = new Date(now.getTime() + 48 * 3600 * 1000);
		await conn.query(
			`INSERT IGNORE INTO training_sessions (id, title, description, trainer_id, session_date, duration_minutes, max_capacity, location, status, program_id)
			 VALUES 
			 (1,'Espresso Cohort A','Hands-on espresso',?, ?,90,20,'Lab A','scheduled',1),
			 (2,'Cupping Batch B','Cupping basics',?, ?,60,15,'Lab B','scheduled',2)
			`,
			[trainerId, iso(start1), trainerId, iso(start2)]
		);
		log('✓ Sessions seeded');

		// Enroll trainees and add to queue
		const [t1] = await conn.query(`SELECT id FROM users WHERE email='trainee1@ctc.local'`);
		const [t2] = await conn.query(`SELECT id FROM users WHERE email='trainee2@ctc.local'`);
		const trainee1 = t1[0].id, trainee2 = t2[0].id;
		for (const sid of [1, 2]) {
			await conn.query(`INSERT IGNORE INTO session_enrollments (trainee_id, session_id, status) VALUES (?, ?, 'registered')`, [trainee1, sid]);
			await conn.query(`INSERT IGNORE INTO session_enrollments (trainee_id, session_id, status) VALUES (?, ?, 'registered')`, [trainee2, sid]);
		}
		// Simple queue entries
		await conn.query(`INSERT IGNORE INTO queue_entries (trainee_id, session_id, queue_position, status) VALUES (?, 1, 1, 'waiting')`, [trainee1]);
		await conn.query(`INSERT IGNORE INTO queue_entries (trainee_id, session_id, queue_position, status) VALUES (?, 1, 2, 'waiting')`, [trainee2]);
		log('✓ Enrollments and queue seeded');

		// Create exam for session 1
		await conn.query(
			`INSERT IGNORE INTO examinations (id, session_id, title, description, passing_score, duration_minutes, status)
			 VALUES (1, 1, 'Espresso Quiz', 'Basics of espresso', 60.00, 15, 'active')`
		);
		// Questions
		await conn.query(
			`INSERT IGNORE INTO exam_questions (id, exam_id, question_text, question_type, options, correct_answer, points, question_order)
			 VALUES 
			 (1,1,'Ideal espresso temperature?','multiple_choice','[\"80C\",\"90-96C\",\"100C\"]','90-96C',1.00,1),
			 (2,1,'Espresso ratio?','multiple_choice','[\"1:1\",\"1:2\",\"1:4\"]','1:2',1.00,2)`
		);
		log('✓ Exams and questions seeded');

		// Create a certificate for trainee1 for session 1
		// Create attempt record first if not present
		await conn.query(`INSERT IGNORE INTO exam_attempts (id, trainee_id, exam_id, submitted_at, score, total_points, percentage_score, passed, status)
			VALUES (1, ?, 1, NOW(), 2.00, 2.00, 100.00, TRUE, 'submitted')`, [trainee1]);
		await conn.query(
			`INSERT IGNORE INTO certificates (id, trainee_id, session_id, exam_attempt_id, certificate_number, issue_date, status, qr_code_data)
			 VALUES (1, ?, 1, 1, 'CTC-00000001', CURDATE(), 'issued', 'CTC-00000001')`,
			[trainee1]
		);
		log('✓ Certificates seeded');

		log('✓ Sample data seeding completed');
	} finally {
		await conn.end();
	}
}

seed().catch(err => {
	console.error('Seeding failed:', err.message);
	process.exit(1);
});


