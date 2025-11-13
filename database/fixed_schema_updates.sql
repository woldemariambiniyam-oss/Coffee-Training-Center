-- Fixed Coffee Training Center Schema Updates
-- Only adding missing elements based on current DB state

USE coffee_training_center;

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN session_timeout_minutes INT DEFAULT 30,
ADD COLUMN language_preference VARCHAR(10) DEFAULT 'en';

-- Update role enum to include public_verifier
ALTER TABLE users MODIFY COLUMN role ENUM('trainee', 'trainer', 'admin', 'public_verifier') DEFAULT 'trainee';

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_active (is_active)
);

-- Add collection_status to certificates table (to fix reports error)
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS collection_status ENUM('pending_collection', 'ready_for_collection', 'collected', 'not_collected') DEFAULT 'pending_collection',
ADD COLUMN IF NOT EXISTS collection_reference_code VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS collected_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS collected_by INT NULL,
ADD FOREIGN KEY IF NOT EXISTS (collected_by) REFERENCES users(id) ON DELETE SET NULL,
ADD INDEX IF NOT EXISTS idx_collection_status (collection_status);
