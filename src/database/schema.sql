-- SizeWise Suite Database Schema

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  owner_id INTEGER NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on-hold', 'archived', 'completed', 'won')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users (id)
);

-- Project tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS project_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  tag_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  UNIQUE(project_id, tag_name)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users (id)
);

-- Project milestones
CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  completed_at DATETIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, role) 
VALUES (1, 'admin', 'admin@sizewise.com', '$2a$10$rOzJqQZQZQZQZQZQZQZQZOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', 'System Administrator', 'admin');

-- Insert sample projects
INSERT OR IGNORE INTO projects (id, name, description, owner_id, location, start_date, due_date, priority, status) VALUES
(1, 'Project Alpha', 'Strategic development initiative for Q1', 1, 'New York, NY', '2024-01-15', '2024-06-30', 'high', 'active'),
(2, 'Project Beta', 'Customer experience enhancement program', 1, 'San Francisco, CA', '2024-02-01', '2024-05-15', 'medium', 'active'),
(3, 'Project Gamma', 'Infrastructure modernization project', 1, 'Austin, TX', '2024-03-01', '2024-08-30', 'high', 'active'),
(4, 'Project Delta', 'Market research and analysis', 1, 'Chicago, IL', '2023-12-01', '2024-02-28', 'low', 'completed'),
(5, 'Project Epsilon', 'Product launch preparation', 1, 'Seattle, WA', '2024-02-15', '2024-07-31', 'high', 'active'),
(6, 'Project Zeta', 'Compliance and security audit', 1, 'Boston, MA', '2024-04-01', '2024-09-30', 'medium', 'planning');

-- Insert sample tasks
INSERT OR IGNORE INTO tasks (project_id, title, description, assignee_id, status, priority, due_date) VALUES
(1, 'Requirements gathering', 'Collect and document project requirements', 1, 'completed', 'high', '2024-01-30'),
(1, 'Design mockups', 'Create initial design concepts', 1, 'in-progress', 'medium', '2024-02-15'),
(1, 'Development setup', 'Set up development environment', 1, 'pending', 'medium', '2024-02-20'),
(2, 'User research', 'Conduct user interviews and surveys', 1, 'in-progress', 'high', '2024-02-10'),
(2, 'Prototype development', 'Build interactive prototype', 1, 'pending', 'medium', '2024-03-01'),
(3, 'Infrastructure audit', 'Review current infrastructure', 1, 'pending', 'high', '2024-03-15'),
(3, 'Migration planning', 'Plan migration strategy', 1, 'pending', 'high', '2024-04-01');

-- Insert sample milestones
INSERT OR IGNORE INTO milestones (project_id, title, description, target_date, status) VALUES
(1, 'Phase 1 Complete', 'Requirements and design phase completion', '2024-03-01', 'pending'),
(1, 'Beta Release', 'Beta version ready for testing', '2024-05-01', 'pending'),
(2, 'User Testing Complete', 'All user testing sessions completed', '2024-03-15', 'pending'),
(3, 'Infrastructure Assessment', 'Complete infrastructure review', '2024-04-01', 'pending');
