import { useState, useEffect } from 'react';
import SizeWiseLogo from './SizeWiseLogo';
import ProjectCreationModal from './ProjectCreationModal';
import TaskManager from './TaskManager';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import { useTranslation } from '../i18n';

export default function Dashboard({ onLogout }) {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const [timelineView, setTimelineView] = useState('Week');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [taskManagerProjectId, setTaskManagerProjectId] = useState(null);

  // Panel states for KPI details
  const [activePanel, setActivePanel] = useState(null);
  const [panelData, setPanelData] = useState(null);

  // Load dashboard data on mount if not already loaded
  useEffect(() => {
    if (!state.dashboardData && !state.isLoading) {
      actions.loadDashboardData();
    }
  }, [state.dashboardData, state.isLoading]);

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.isLoading) {
        actions.loadDashboardData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [state.isLoading]);

  // Panel handlers
  const openPanel = (panelType, data) => {
    setPanelData(data);
    setActivePanel(panelType);
  };

  const closePanel = () => {
    setActivePanel(null);
    setPanelData(null);
  };

  // Project management handlers
  const handleEditProject = (project, e) => {
    e.stopPropagation(); // Prevent project selection
    closePanel(); // Close All Projects modal first
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteProject = (project, e) => {
    e.stopPropagation(); // Prevent project selection
    closePanel(); // Close All Projects modal first
    setShowDeleteConfirm(project);
  };

  const confirmDeleteProject = async () => {
    if (showDeleteConfirm) {
      await actions.deleteProject(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
    }
  };

  const cancelDeleteProject = () => {
    setShowDeleteConfirm(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleOpenTaskManager = (project, e) => {
    e.stopPropagation();
    closePanel(); // Close All Projects modal first
    setTaskManagerProjectId(project.id);
    setShowTaskManager(true);
  };

  const handleCloseTaskManager = () => {
    setShowTaskManager(false);
    setTaskManagerProjectId(null);
  };

  // Keyboard support for panels
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activePanel && e.key === 'Escape') {
        closePanel();
      }
    };

    if (activePanel) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [activePanel]);

  // KPI click handlers
  const handleTasksWeekClick = () => {
    const tasksData = {
      title: 'Tasks Due This Week',
      count: dashboardData.tasksThisWeek,
      items: [], // In a real app, this would fetch actual tasks
      description: `${dashboardData.tasksThisWeek} tasks are due within the current week`
    };
    openPanel('tasks-week', tasksData);
  };

  const handleOverdueClick = () => {
    const overdueData = {
      title: 'Overdue Tasks',
      count: dashboardData.overdue.count,
      items: dashboardData.overdue.top3,
      description: `${dashboardData.overdue.count} tasks are overdue and need immediate attention`
    };
    openPanel('overdue', overdueData);
  };

  const handleMilestonesClick = () => {
    const milestonesData = {
      title: 'Completed This Month',
      count: dashboardData.milestones.wonThisMonth + dashboardData.milestones.finishedThisMonth,
      items: dashboardData.milestones.recent,
      description: `${dashboardData.milestones.wonThisMonth} projects won and ${dashboardData.milestones.finishedThisMonth} projects finished this month`
    };
    openPanel('milestones', milestonesData);
  };

  const handleTotalProjectsClick = () => {
    const projectsData = {
      title: 'All Projects',
      count: projects.length,
      items: projects,
      description: `${projects.length} total projects: ${projects.filter(p => p.status === 'active').length} active, ${projects.filter(p => p.status === 'completed').length} completed`
    };
    openPanel('projects', projectsData);
  };

  // Get data from state or use defaults
  const dashboardData = state.dashboardData || {
    tasksThisWeek: 0,
    overdue: { count: 0, top3: [] },
    milestones: { wonThisMonth: 0, finishedThisMonth: 0, recent: [] },
    projects: []
  };

  const projects = state.projects || [];

  // Force re-render when projects change
  useEffect(() => {
    console.log('Dashboard: Projects updated, count:', projects.length);
  }, [projects]);

  // Generate gantt data from active projects
  const ganttData = projects
    .filter(p => p.status === 'active')
    .slice(0, 3)
    .map((project, index) => ({
      name: project.name,
      start: 10 + (index * 15),
      duration: 40 + (index * 10),
      color: ['#ef4444', '#3b82f6', '#10b981'][index] || '#6b7280'
    }));

  // Generate realistic project locations based on actual project data
  const projectLocations = {
    'New York, NY': { x: 75, y: 40 },
    'San Francisco, CA': { x: 15, y: 45 },
    'Austin, TX': { x: 50, y: 60 },
    'Chicago, IL': { x: 65, y: 35 },
    'Seattle, WA': { x: 20, y: 25 },
    'Boston, MA': { x: 80, y: 30 }
  };

  // Map projects to their real locations
  const projectsWithRealLocations = projects.map(project => ({
    ...project,
    location: projectLocations[project.location] || { x: 50, y: 50 }
  }));

  // Generate globe background dots (fewer, more strategic)
  const globeDots = [];
  for (let i = 0; i < 25; i++) {
    globeDots.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    });
  }

  // Show loading state
  if (state.isLoading && !state.dashboardData) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <SizeWiseLogo width={200} height={50} />
        <div className="header-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search..." />
          </div>
          <button className="settings-btn">⚙ Settings</button>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* Success/Error Messages */}
      {state.success && (
        <div className="message success-message">
          {state.success}
        </div>
      )}
      {state.error && (
        <div className="message error-message">
          {state.error}
        </div>
      )}

      {/* Real-time Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-dot active"></span>
          <span>Live Data Connected</span>
        </div>
        <div className="status-item">
          <span>Last Updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="status-item">
          <span>📊 {projects.length} Projects • 👥 {projects.filter(p => p.status === 'active').length} Active</span>
        </div>
      </div>

      {/* Layer 1 - Project Hub */}
      <section className="dashboard-container project-hub">
        <div className="hub-controls">
          <button
            className="new-project-btn"
            onClick={() => setIsModalOpen(true)}
          >
            + New Project
          </button>
          <div className="quick-stats">
            <div
              className="stat-card tasks-week"
              onClick={handleTasksWeekClick}
              onKeyDown={(e) => e.key === 'Enter' && handleTasksWeekClick()}
              role="button"
              tabIndex={0}
              aria-label="View tasks due this week details"
            >
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-number">{dashboardData.tasksThisWeek}</div>
                <div className="stat-label">Tasks Due This Week</div>
                <div className="stat-trend">
                  {dashboardData.tasksThisWeek > 0 ? '📈 Active' : '✅ Clear'}
                </div>
              </div>
            </div>

            <div
              className="stat-card overdue-tasks"
              onClick={handleOverdueClick}
              onKeyDown={(e) => e.key === 'Enter' && handleOverdueClick()}
              role="button"
              tabIndex={0}
              aria-label="View overdue tasks details"
            >
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <div className="stat-number">{dashboardData.overdue.count}</div>
                <div className="stat-label">Overdue Tasks</div>
                <div className="stat-trend">
                  {dashboardData.overdue.count > 0 ? '🔴 Needs Attention' : '✅ All Clear'}
                </div>
              </div>
            </div>

            <div
              className="stat-card milestones"
              onClick={handleMilestonesClick}
              onKeyDown={(e) => e.key === 'Enter' && handleMilestonesClick()}
              role="button"
              tabIndex={0}
              aria-label="View completed milestones details"
            >
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <div className="stat-number">
                  {dashboardData.milestones.wonThisMonth + dashboardData.milestones.finishedThisMonth}
                </div>
                <div className="stat-label">Completed This Month</div>
                <div className="stat-trend">
                  🏆 {dashboardData.milestones.wonThisMonth} Won, ✅ {dashboardData.milestones.finishedThisMonth} Finished
                </div>
              </div>
            </div>

            <div
              className="stat-card total-projects"
              onClick={handleTotalProjectsClick}
              onKeyDown={(e) => e.key === 'Enter' && handleTotalProjectsClick()}
              role="button"
              tabIndex={0}
              aria-label="View all projects details"
            >
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-number">{projects.length}</div>
                <div className="stat-label">Total Projects</div>
                <div className="stat-trend">
                  💼 {projects.filter(p => p.status === 'active').length} Active,
                  ✅ {projects.filter(p => p.status === 'completed').length} Done
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="projects-section">
          <div className="projects-header">
            <h3>Active Projects ({projects.filter(p => p.status === 'active').length})</h3>
            <div className="project-stats">
              <span className="stat-badge active">
                {projects.filter(p => p.status === 'active').length} Active
              </span>
              <span className="stat-badge completed">
                {projects.filter(p => p.status === 'completed').length} Completed
              </span>
              <span className="stat-badge planning">
                {projects.filter(p => p.status === 'planning').length} Planning
              </span>
            </div>
          </div>

          <div className="projects-scroll">
            {projects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>No projects found</p>
                <p className="empty-subtitle">Create your first project to get started</p>
              </div>
            ) : (
              projects.map(project => (
                <div
                  key={project.id}
                  className={`project-item ${project.status} ${selectedProjectId === project.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    actions.selectProject(project);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedProjectId(project.id);
                      actions.selectProject(project);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select project ${project.name}`}
                >
                  <div className="project-info">
                    <div className="project-main">
                      <span className="project-name">{project.name}</span>
                      <span className="project-location">📍 {project.location}</span>
                    </div>
                    <div className="project-meta">
                      <span className="project-owner">👤 {project.ownerName || 'Unassigned'}</span>
                      <span className="project-dates">
                        📅 {new Date(project.startDate).toLocaleDateString()} - {new Date(project.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="project-status-section">
                    <span className={`project-status status-${project.status}`}>
                      {project.status.toUpperCase()}
                    </span>
                    <span className={`project-priority priority-${project.priority}`}>
                      {project.priority === 'high' ? '🔴' : project.priority === 'medium' ? '🟡' : '🟢'} {project.priority}
                    </span>
                    <div className="project-actions">
                      <button
                        className="action-btn tasks-btn"
                        onClick={(e) => handleOpenTaskManager(project, e)}
                        title={t('general.manageTasks')}
                        aria-label={`Manage tasks for ${project.name}`}
                      >
                        📋
                      </button>
                      <button
                        className="action-btn edit-btn"
                        onClick={(e) => handleEditProject(project, e)}
                        title={t('project.edit')}
                        aria-label={`Edit ${project.name}`}
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={(e) => handleDeleteProject(project, e)}
                        title={t('project.delete')}
                        aria-label={`Delete ${project.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Layer 2 - Gantt Chart */}
      <section className="dashboard-container gantt-chart">
        <div className="gantt-header">
          <h3>PROJECT GANTT CHART</h3>
          <div className="timeline-controls">
            {['Week', 'Month', 'Quarter'].map(view => (
              <button
                key={view}
                className={`timeline-btn ${timelineView === view ? 'active' : ''}`}
                onClick={() => setTimelineView(view)}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        <div className="gantt-content">
          <div className="gantt-timeline">
            {ganttData.map((item) => (
              <div key={item.name} className="gantt-row">
                <div className="gantt-label">{item.name}</div>
                <div className="gantt-track">
                  <div
                    className="gantt-bar"
                    style={{
                      left: `${item.start}%`,
                      width: `${item.duration}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Layer 3 - Project Map */}
      <section className="dashboard-container project-map">
        <div className="map-header">
          <h3>PROJECT MAP (Zoomed Globe)</h3>
        </div>

        <div className="globe-container">
          <div className="globe">
            {/* Globe dots (grey) */}
            {globeDots.map(dot => (
              <div
                key={dot.id}
                className="globe-dot"
                style={{
                  left: `${dot.x}%`,
                  top: `${dot.y}%`
                }}
              />
            ))}

            {/* Project dots (red) - using real locations */}
            {projects.filter(p => p.status === 'active').map(project => {
              const location = projectLocations[project.location] || { x: 50, y: 50 };
              return (
                <div
                  key={project.id}
                  className="project-dot"
                  style={{
                    left: `${location.x}%`,
                    top: `${location.y}%`
                  }}
                  title={`${project.name} - ${project.location}`}
                />
              );
            })}
          </div>

          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-dot globe-dot"></div>
              <span>Globe / Islands</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot project-dot"></div>
              <span>Project Location</span>
            </div>
          </div>
        </div>
      </section>

      {/* Project Creation/Edit Modal */}
      <ProjectCreationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={editingProject}
        mode={editingProject ? 'edit' : 'create'}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={cancelDeleteProject}>
          <div className="modal-content delete-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('project.delete')}</h2>
              <button className="modal-close" onClick={cancelDeleteProject}>×</button>
            </div>
            <div className="modal-body">
              <p>{t('project.confirmDeletePrefix')} <strong>{showDeleteConfirm.name}</strong>?</p>
              <p className="warning-text">{t('general.thisActionCannotBeUndone')}</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelDeleteProject}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDeleteProject}>
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Detail Panel */}
      {activePanel && panelData && (
        <div className="panel-overlay" onClick={closePanel}>
          <div
            className={`kpi-detail-panel ${activePanel}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-header">
              <h2>{panelData.title}</h2>
              <button className="panel-close" onClick={closePanel}>×</button>
            </div>

            <div className="panel-content">
              <div className="panel-summary">
                <div className="summary-number">{panelData.count}</div>
                <div className="summary-description">{panelData.description}</div>
              </div>

              <div className="panel-items">
                {panelData.items && panelData.items.length > 0 ? (
                  <div className="items-list">
                    <h3>Details:</h3>
                    {panelData.items.map((item, index) => (
                      <div key={item.id || index} className="item-card">
                        {activePanel === 'projects' ? (
                          <>
                            <div className="item-header">
                              <span className="item-name">{item.name}</span>
                              <span className={`item-status status-${item.status}`}>
                                {item.status.toUpperCase()}
                              </span>
                              <div className="item-actions">
                                <button
                                  className="action-btn tasks-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenTaskManager(item, e);
                                  }}
                                  title={t('general.manageTasks')}
                                  aria-label={`Manage tasks for ${item.name}`}
                                >
                                  📋
                                </button>
                                <button
                                  className="action-btn edit-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditProject(item, e);
                                  }}
                                  title={t('project.edit')}
                                  aria-label={`Edit ${item.name}`}
                                >
                                  ✏️
                                </button>
                                <button
                                  className="action-btn delete-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProject(item, e);
                                  }}
                                  title={t('project.delete')}
                                  aria-label={`Delete ${item.name}`}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                            <div className="item-details">
                              <span className="item-location">📍 {item.location}</span>
                              <span className="item-owner">👤 {item.ownerName}</span>
                              <span className="item-priority priority-${item.priority}">
                                {item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢'} {item.priority}
                              </span>
                            </div>
                            <div className="item-dates">
                              📅 {new Date(item.startDate).toLocaleDateString()} - {new Date(item.dueDate).toLocaleDateString()}
                            </div>
                          </>
                        ) : activePanel === 'overdue' ? (
                          <>
                            <div className="item-header">
                              <span className="item-name">{item.name}</span>
                              <span className="overdue-days">⚠️ {item.daysLate} days late</span>
                            </div>
                            <div className="item-details">
                              <span className="item-project">📋 {item.projectName}</span>
                            </div>
                          </>
                        ) : activePanel === 'milestones' ? (
                          <>
                            <div className="item-header">
                              <span className="item-name">{item.name}</span>
                              <span className={`milestone-type type-${item.type}`}>
                                {item.type === 'won' ? '🏆 Won' : '✅ Finished'}
                              </span>
                            </div>
                            <div className="item-details">
                              <span className="item-date">📅 {new Date(item.date).toLocaleDateString()}</span>
                            </div>
                          </>
                        ) : (
                          <div className="item-header">
                            <span className="item-name">{item.name || item.title}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-items">
                    <div className="no-items-icon">📋</div>
                    <p>No detailed items available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Manager */}
      {showTaskManager && (
        <TaskManager
          projectId={taskManagerProjectId}
          onClose={handleCloseTaskManager}
        />
      )}
    </div>
  );
}
