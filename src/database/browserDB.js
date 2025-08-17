// Simple browser-compatible database using localStorage for demo
const STORAGE_KEYS = {
  USERS: 'sizewise_users',
  PROJECTS: 'sizewise_projects',
  TASKS: 'sizewise_tasks',
  SESSIONS: 'sizewise_sessions'
};

// Initialize with sample data
function initializeData() {
  // Check if data already exists
  if (localStorage.getItem(STORAGE_KEYS.USERS)) {
    console.log('Database already initialized');
    return;
  }

  console.log('Initializing database with sample data...');

  // Sample users
  const users = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@sizewise.com',
      passwordHash: 'admin123',
      fullName: 'System Administrator',
      role: 'admin',
      createdAt: new Date().toISOString(),
      isActive: true
    }
  ];

  // Sample projects
  const projects = [
    {
      id: 1,
      name: 'Project Alpha',
      description: 'Strategic development initiative for Q1',
      ownerId: 1,
      location: 'New York, NY',
      startDate: '2024-01-15',
      dueDate: '2024-06-30',
      priority: 'high',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Project Beta',
      description: 'Customer experience enhancement program',
      ownerId: 1,
      location: 'San Francisco, CA',
      startDate: '2024-02-01',
      dueDate: '2024-05-15',
      priority: 'medium',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Project Gamma',
      description: 'Infrastructure modernization project',
      ownerId: 1,
      location: 'Austin, TX',
      startDate: '2024-03-01',
      dueDate: '2024-08-30',
      priority: 'high',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 4,
      name: 'Project Delta',
      description: 'Market research and analysis',
      ownerId: 1,
      location: 'Chicago, IL',
      startDate: '2023-12-01',
      dueDate: '2024-02-28',
      priority: 'low',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Sample tasks
  const tasks = [
    {
      id: 1,
      projectId: 1,
      title: 'Requirements gathering',
      description: 'Collect and document project requirements',
      assigneeId: 1,
      status: 'completed',
      priority: 'high',
      dueDate: '2024-01-30',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      projectId: 1,
      title: 'Design mockups',
      description: 'Create initial design concepts',
      assigneeId: 1,
      status: 'in-progress',
      priority: 'medium',
      dueDate: '2024-02-15',
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      projectId: 2,
      title: 'User research',
      description: 'Conduct user interviews and surveys',
      assigneeId: 1,
      status: 'pending',
      priority: 'high',
      dueDate: '2024-01-20', // Overdue
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      projectId: 3,
      title: 'Infrastructure audit',
      description: 'Review current infrastructure',
      assigneeId: 1,
      status: 'pending',
      priority: 'high',
      dueDate: '2024-01-25', // Overdue
      createdAt: new Date().toISOString()
    }
  ];

  // Store in localStorage
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));

  // Database initialized successfully
}

// Database operations
export const dbOperations = {
  // Users
  async findUserByCredentials(username) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return users.find(user => user.username === username);
  },

  // Projects
  async getAllProjects() {
    console.log('Getting all projects from localStorage...');
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

    console.log('Found projects:', projects.length);
    console.log('Found users:', users.length);

    const result = projects.map(project => {
      const owner = users.find(user => user.id === project.ownerId);
      return {
        ...project,
        ownerName: owner ? owner.fullName : 'Unknown User'
      };
    });

    console.log('Returning projects with owners:', result);
    return result;
  },

  async createProject(projectData) {
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    const newId = Math.max(...projects.map(p => p.id), 0) + 1;
    const newProject = {
      ...projectData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    projects.push(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    
    const owner = users.find(user => user.id === projectData.ownerId);
    return {
      ...newProject,
      ownerName: owner ? owner.fullName : 'Unknown User'
    };
  },

  // Tasks
  async getTasksDueThisWeek() {
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const tasksThisWeek = tasks.filter(task => {
      if (task.status === 'completed' || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= startOfWeek && dueDate <= endOfWeek;
    });
    
    return tasksThisWeek.length;
  },

  async getOverdueTasks() {
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    const overdueTasks = tasks.filter(task => {
      return task.status !== 'completed' && task.dueDate && task.dueDate < today;
    });
    
    const top3 = overdueTasks.slice(0, 3).map(task => {
      const project = projects.find(p => p.id === task.projectId);
      const daysLate = Math.floor((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
      return {
        id: task.id,
        name: task.title,
        projectId: task.projectId,
        projectName: project ? project.name : 'Unknown Project',
        daysLate
      };
    });
    
    return {
      count: overdueTasks.length,
      top3
    };
  },

  // Sessions
  async createSession(userId, token, expiresAt) {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const session = { userId, token, expiresAt, createdAt: new Date().toISOString() };
    sessions.push(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    return session;
  },

  async findValidSession(token) {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    const session = sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
    if (session) {
      return users.find(user => user.id === session.userId);
    }
    return null;
  }
};

// Initialize database
initializeData();

// Test database operations
console.log('Testing database operations...');
dbOperations.getAllProjects().then(projects => {
  console.log('Test: getAllProjects returned:', projects);
}).catch(error => {
  console.error('Test: getAllProjects failed:', error);
});
