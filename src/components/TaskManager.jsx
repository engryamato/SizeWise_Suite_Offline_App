import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function TaskManager({ projectId, onClose }) {
  const { state, actions } = useApp();
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    assigneeId: null
  });

  // Load tasks for the project
  useEffect(() => {
    if (projectId) {
      loadProjectTasks();
    }
  }, [projectId]);

  const loadProjectTasks = async () => {
    try {
      // Use the task service to get tasks for this project
      const result = await fetch(`/api/tasks/project/${projectId}`);
      if (result.ok) {
        const data = await result.json();
        setTasks(data.data || []);
      } else {
        // Fallback: get all tasks and filter by project
        const allTasks = JSON.parse(localStorage.getItem('sizewise_tasks') || '[]');
        const projectTasks = allTasks.filter(task => task.projectId === projectId);
        setTasks(projectTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      // Fallback to localStorage
      const allTasks = JSON.parse(localStorage.getItem('sizewise_tasks') || '[]');
      const projectTasks = allTasks.filter(task => task.projectId === projectId);
      setTasks(projectTasks);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const taskData = {
      ...formData,
      projectId: projectId
    };

    try {
      let result;
      if (editingTask) {
        result = await actions.updateTask(editingTask.id, taskData);
      } else {
        result = await actions.createTask(taskData);
      }

      if (result.success) {
        setShowTaskForm(false);
        setEditingTask(null);
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          status: 'todo',
          dueDate: '',
          assigneeId: null
        });
        loadProjectTasks();
      }
    } catch (error) {
      console.error('Task operation failed:', error);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      dueDate: task.dueDate || '',
      assigneeId: task.assigneeId || null
    });
    setShowTaskForm(true);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const result = await actions.deleteTask(taskId);
      if (result.success) {
        loadProjectTasks();
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const result = await actions.updateTask(taskId, { status: newStatus });
    if (result.success) {
      loadProjectTasks();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return '#6b7280';
      case 'in-progress': return '#3b82f6';
      case 'review': return '#f59e0b';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="task-manager-overlay">
      <div className="task-manager">
        <div className="task-manager-header">
          <h2>Task Management</h2>
          <div className="header-actions">
            <button 
              className="btn-primary"
              onClick={() => setShowTaskForm(true)}
            >
              + Add Task
            </button>
            <button className="btn-close" onClick={onClose}>×</button>
          </div>
        </div>

        {showTaskForm && (
          <div className="task-form-container">
            <form onSubmit={handleSubmit} className="task-form">
              <h3>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowTaskForm(false);
                    setEditingTask(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="task-list">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks yet. Create your first task to get started!</p>
            </div>
          ) : (
            <div className="task-grid">
              {['todo', 'in-progress', 'review', 'completed'].map(status => (
                <div key={status} className="task-column">
                  <h4 className="column-header">
                    {status.replace('-', ' ').toUpperCase()}
                    <span className="task-count">
                      {tasks.filter(t => t.status === status).length}
                    </span>
                  </h4>
                  
                  <div className="task-items">
                    {tasks
                      .filter(task => task.status === status)
                      .map(task => (
                        <div key={task.id} className="task-item">
                          <div className="task-header">
                            <span className="task-priority">
                              {getPriorityIcon(task.priority)}
                            </span>
                            <h5 className="task-title">{task.title}</h5>
                          </div>
                          
                          {task.description && (
                            <p className="task-description">{task.description}</p>
                          )}
                          
                          {task.dueDate && (
                            <div className="task-due-date">
                              📅 {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          
                          <div className="task-actions">
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className="status-select"
                            >
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="completed">Completed</option>
                            </select>
                            
                            <button
                              className="btn-edit"
                              onClick={() => handleEdit(task)}
                              title="Edit task"
                            >
                              ✏️
                            </button>
                            
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(task.id)}
                              title="Delete task"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
