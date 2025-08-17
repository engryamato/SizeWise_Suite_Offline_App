import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
const db = new Database(join(__dirname, 'sizewise.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  try {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schema);
    
    // Hash the default admin password properly
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    // Update the admin user with proper password hash
    const updateAdmin = db.prepare(`
      UPDATE users 
      SET password_hash = ? 
      WHERE username = 'admin'
    `);
    updateAdmin.run(hashedPassword);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User authentication functions
export const userQueries = {
  // Find user by username or email
  findByCredentials: db.prepare(`
    SELECT id, username, email, password_hash, full_name, role, is_active 
    FROM users 
    WHERE (username = ? OR email = ?) AND is_active = 1
  `),
  
  // Create new user
  create: db.prepare(`
    INSERT INTO users (username, email, password_hash, full_name, role)
    VALUES (?, ?, ?, ?, ?)
  `),
  
  // Update last login
  updateLastLogin: db.prepare(`
    UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
  `),
  
  // Get user by ID
  findById: db.prepare(`
    SELECT id, username, email, full_name, role, created_at, last_login
    FROM users WHERE id = ? AND is_active = 1
  `)
};

// Project management functions
export const projectQueries = {
  // Get all projects
  getAll: db.prepare(`
    SELECT p.*, u.full_name as owner_name
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    ORDER BY p.updated_at DESC
  `),
  
  // Get project by ID
  getById: db.prepare(`
    SELECT p.*, u.full_name as owner_name
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `),
  
  // Create new project
  create: db.prepare(`
    INSERT INTO projects (name, description, owner_id, location, start_date, due_date, priority, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  // Update project
  update: db.prepare(`
    UPDATE projects 
    SET name = ?, description = ?, location = ?, start_date = ?, due_date = ?, 
        priority = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  
  // Delete project
  delete: db.prepare(`DELETE FROM projects WHERE id = ?`),
  
  // Get projects by status
  getByStatus: db.prepare(`
    SELECT p.*, u.full_name as owner_name
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.status = ?
    ORDER BY p.updated_at DESC
  `)
};

// Task management functions
export const taskQueries = {
  // Get tasks due this week
  getDueThisWeek: db.prepare(`
    SELECT COUNT(*) as count
    FROM tasks 
    WHERE due_date BETWEEN date('now', 'weekday 0', '-6 days') AND date('now', 'weekday 0')
    AND status != 'completed'
  `),
  
  // Get overdue tasks
  getOverdue: db.prepare(`
    SELECT t.*, p.name as project_name,
           julianday('now') - julianday(t.due_date) as days_late
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.due_date < date('now') AND t.status != 'completed'
    ORDER BY days_late DESC
    LIMIT ?
  `),
  
  // Get overdue count
  getOverdueCount: db.prepare(`
    SELECT COUNT(*) as count
    FROM tasks 
    WHERE due_date < date('now') AND status != 'completed'
  `),
  
  // Get tasks by project
  getByProject: db.prepare(`
    SELECT t.*, u.full_name as assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.project_id = ?
    ORDER BY t.due_date ASC
  `),
  
  // Create task
  create: db.prepare(`
    INSERT INTO tasks (project_id, title, description, assignee_id, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  
  // Update task
  update: db.prepare(`
    UPDATE tasks 
    SET title = ?, description = ?, assignee_id = ?, status = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
};

// Milestone functions
export const milestoneQueries = {
  // Get milestones for current month
  getCurrentMonth: db.prepare(`
    SELECT 
      COUNT(CASE WHEN p.status = 'won' AND date(p.updated_at) >= date('now', 'start of month') THEN 1 END) as won_this_month,
      COUNT(CASE WHEN p.status = 'completed' AND date(p.updated_at) >= date('now', 'start of month') THEN 1 END) as finished_this_month
    FROM projects p
  `),
  
  // Get recent milestones
  getRecent: db.prepare(`
    SELECT p.id, p.name, p.status as type, p.updated_at as date
    FROM projects p
    WHERE (p.status = 'won' OR p.status = 'completed')
    AND date(p.updated_at) >= date('now', 'start of month')
    ORDER BY p.updated_at DESC
    LIMIT 3
  `)
};

// Session management
export const sessionQueries = {
  // Create session
  create: db.prepare(`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `),
  
  // Find valid session
  findValid: db.prepare(`
    SELECT s.*, u.id as user_id, u.username, u.email, u.full_name, u.role
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1
  `),
  
  // Delete session
  delete: db.prepare(`DELETE FROM user_sessions WHERE token = ?`),
  
  // Clean expired sessions
  cleanExpired: db.prepare(`DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP`)
};

// Initialize database on import
initializeDatabase();

export default db;
