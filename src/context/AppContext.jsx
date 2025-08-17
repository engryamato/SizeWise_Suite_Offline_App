import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, dashboardService, projectService, taskService } from '../services/api.js';

// Initial state
const initialState = {
  // Authentication
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  
  // Dashboard data
  dashboardData: null,
  
  // Projects
  projects: [],
  selectedProject: null,
  
  // UI state
  error: null,
  success: null
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SUCCESS: 'SET_SUCCESS',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  
  // Auth actions
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  
  // Dashboard actions
  SET_DASHBOARD_DATA: 'SET_DASHBOARD_DATA',
  
  // Project actions
  SET_PROJECTS: 'SET_PROJECTS',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  SELECT_PROJECT: 'SELECT_PROJECT'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
      
    case ActionTypes.SET_SUCCESS:
      return { ...state, success: action.payload, isLoading: false };
      
    case ActionTypes.CLEAR_MESSAGES:
      return { ...state, error: null, success: null };
      
    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
      
    case ActionTypes.LOGOUT:
      return {
        ...initialState
      };
      
    case ActionTypes.SET_DASHBOARD_DATA:
      return { ...state, dashboardData: action.payload };
      
    case ActionTypes.SET_PROJECTS:
      return { ...state, projects: action.payload };
      
    case ActionTypes.ADD_PROJECT:
      return { ...state, projects: [action.payload, ...state.projects] };
      
    case ActionTypes.UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id ? action.payload : p
        )
      };
      
    case ActionTypes.DELETE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        selectedProject: state.selectedProject?.id === action.payload ? null : state.selectedProject
      };
      
    case ActionTypes.SELECT_PROJECT:
      return { ...state, selectedProject: action.payload };
      
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Actions
  const actions = {
    // Utility actions
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    setSuccess: (message) => dispatch({ type: ActionTypes.SET_SUCCESS, payload: message }),
    clearMessages: () => dispatch({ type: ActionTypes.CLEAR_MESSAGES }),
    
    // Authentication actions
    async login(pin) {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      try {
        const result = await authService.loginWithPin(pin);
        if (result.success) {
          // Store token in localStorage
          localStorage.setItem('sizewise_token', result.token);
          dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: result });

          // Load dashboard data after successful login
          await actions.loadDashboardData();

          return { success: true };
        } else {
          dispatch({ type: ActionTypes.SET_ERROR, payload: result.error });
          return { success: false, error: result.error };
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Login failed' });
        return { success: false, error: 'Login failed' };
      }
    },
    
    async logout() {
      const token = localStorage.getItem('sizewise_token');
      if (token) {
        await authService.logout(token);
        localStorage.removeItem('sizewise_token');
      }
      dispatch({ type: ActionTypes.LOGOUT });
    },
    
    async verifyToken() {
      const token = localStorage.getItem('sizewise_token');
      if (token) {
        const result = await authService.verifyToken(token);
        if (result.success) {
          dispatch({ 
            type: ActionTypes.LOGIN_SUCCESS, 
            payload: { user: result.user, token } 
          });
          return true;
        } else {
          localStorage.removeItem('sizewise_token');
        }
      }
      return false;
    },
    
    // Dashboard actions
    async loadDashboardData() {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      try {
        console.log('Loading dashboard data...');
        const result = await dashboardService.getDashboardData();
        console.log('Dashboard data result:', result);
        if (result.success) {
          dispatch({ type: ActionTypes.SET_DASHBOARD_DATA, payload: result.data });
          dispatch({ type: ActionTypes.SET_PROJECTS, payload: result.data.projects });
          console.log('Dashboard data loaded successfully:', result.data);
        } else {
          console.error('Dashboard data error:', result.error);
          dispatch({ type: ActionTypes.SET_ERROR, payload: result.error });
        }
      } catch (error) {
        console.error('Dashboard data error:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load dashboard data' });
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },
    
    // Project actions
    async createProject(projectData) {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      try {
        const result = await projectService.create({
          ...projectData,
          ownerId: state.user.id
        });
        if (result.success) {
          // Add the new project to the list immediately for UI feedback
          dispatch({ type: ActionTypes.ADD_PROJECT, payload: result.data });

          // Small delay to ensure database is updated before refreshing dashboard
          setTimeout(async () => {
            await actions.loadDashboardData();
          }, 500);

          dispatch({ type: ActionTypes.SET_SUCCESS, payload: 'Project created successfully' });
          return { success: true };
        } else {
          dispatch({ type: ActionTypes.SET_ERROR, payload: result.error });
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error('Create project error:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to create project' });
        return { success: false, error: 'Failed to create project' };
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async updateProject(projectId, projectData) {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      try {
        const result = await projectService.update(projectId, projectData);
        if (result.success) {
          // Update the project in the list
          dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: result.data });

          // Refresh dashboard data to update KPIs
          await actions.loadDashboardData();

          dispatch({ type: ActionTypes.SET_SUCCESS, payload: 'Project updated successfully' });
          return { success: true };
        } else {
          dispatch({ type: ActionTypes.SET_ERROR, payload: result.error });
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error('Update project error:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to update project' });
        return { success: false, error: 'Failed to update project' };
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async deleteProject(projectId) {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      try {
        const result = await projectService.delete(projectId);
        if (result.success) {
          // Remove the project from the list
          dispatch({ type: ActionTypes.DELETE_PROJECT, payload: projectId });

          // Refresh dashboard data to update KPIs
          await actions.loadDashboardData();

          dispatch({ type: ActionTypes.SET_SUCCESS, payload: 'Project deleted successfully' });
          return { success: true };
        } else {
          dispatch({ type: ActionTypes.SET_ERROR, payload: result.error });
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error('Delete project error:', error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to delete project' });
        return { success: false, error: 'Failed to delete project' };
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    // Task actions
    async createTask(taskData) {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      try {
        const result = await taskService.create(taskData);
        if (result.success) {
          dispatch({ type: ActionTypes.SET_SUCCESS, payload: 'Task created successfully' });
          // Reload dashboard data to update task counts
          await actions.loadDashboardData();
          return result;
        } else {
          dispatch({ type: ActionTypes.SET_ERROR, payload: result.error });
          return result;
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to create task' });
        return { success: false, error: 'Failed to create task' };
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async updateTask(taskId, taskData) {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      try {
        const result = await taskService.update(taskId, taskData);
        if (result.success) {
          dispatch({ type: ActionTypes.SET_SUCCESS, payload: 'Task updated successfully' });
          // Reload dashboard data to update task counts
          await actions.loadDashboardData();
          return result;
        } else {
          dispatch({ type: ActionTypes.SET_ERROR, payload: result.error });
          return result;
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to update task' });
        return { success: false, error: 'Failed to update task' };
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    async deleteTask(taskId) {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      try {
        const result = await taskService.delete(taskId);
        if (result.success) {
          dispatch({ type: ActionTypes.SET_SUCCESS, payload: 'Task deleted successfully' });
          // Reload dashboard data to update task counts
          await actions.loadDashboardData();
          return result;
        } else {
          dispatch({ type: ActionTypes.SET_ERROR, payload: result.error });
          return result;
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to delete task' });
        return { success: false, error: 'Failed to delete task' };
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },

    selectProject: (project) => dispatch({ type: ActionTypes.SELECT_PROJECT, payload: project })
  };
  
  // Auto-verify token on app start and load dashboard data
  useEffect(() => {
    const initializeApp = async () => {
      await actions.verifyToken();
      // Load dashboard data regardless of authentication for demo
      await actions.loadDashboardData();
    };

    initializeApp();
  }, []);
  
  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (state.error || state.success) {
      const timer = setTimeout(() => {
        actions.clearMessages();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error, state.success]);
  
  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
