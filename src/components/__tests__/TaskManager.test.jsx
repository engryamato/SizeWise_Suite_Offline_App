import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TaskManager from '../TaskManager.jsx';

const mockCreateTask = vi.fn().mockResolvedValue({ success: true });
const mockUpdateTask = vi.fn().mockResolvedValue({ success: true });
const mockDeleteTask = vi.fn().mockResolvedValue({ success: true });

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    state: {},
    actions: {
      createTask: mockCreateTask,
      updateTask: mockUpdateTask,
      deleteTask: mockDeleteTask,
    },
  }),
}));

const sampleTasks = [
  { id: 1, projectId: 1, title: 'Task A', status: 'todo', priority: 'low' },
];

describe('TaskManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: sampleTasks }),
    });
  });

  test('loads tasks on mount', async () => {
    render(<TaskManager projectId={1} onClose={vi.fn()} />);

    expect(fetch).toHaveBeenCalledWith('/api/tasks/project/1');
    await waitFor(() => {
      expect(screen.getByText('Task A')).toBeInTheDocument();
    });
  });

  test('creates a new task', async () => {
    const user = userEvent.setup();
    render(<TaskManager projectId={1} onClose={vi.fn()} />);
    await waitFor(() => screen.getByText('Task A'));

    await user.click(screen.getByRole('button', { name: /add task/i }));
    await user.type(screen.getByLabelText(/task title/i), 'New Task');
    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        assigneeId: null,
        projectId: 1,
      });
    });
  });

  test('edits an existing task', async () => {
    const user = userEvent.setup();
    render(<TaskManager projectId={1} onClose={vi.fn()} />);
    await waitFor(() => screen.getByText('Task A'));

    await user.click(screen.getByTitle('Edit task'));
    const titleInput = screen.getByLabelText(/task title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Task A Updated');
    await user.click(screen.getByRole('button', { name: /update task/i }));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith(1, {
        title: 'Task A Updated',
        description: '',
        priority: 'low',
        status: 'todo',
        dueDate: '',
        assigneeId: null,
        projectId: 1,
      });
    });
  });

  test('deletes a task', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<TaskManager projectId={1} onClose={vi.fn()} />);
    await waitFor(() => screen.getByText('Task A'));

    await user.click(screen.getByTitle('Delete task'));

    await waitFor(() => {
      expect(mockDeleteTask).toHaveBeenCalledWith(1);
    });
  });

  test('updates task status', async () => {
    const user = userEvent.setup();
    render(<TaskManager projectId={1} onClose={vi.fn()} />);
    await waitFor(() => screen.getByText('Task A'));

    const statusSelect = screen.getByDisplayValue('todo');
    await user.selectOptions(statusSelect, 'completed');

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith(1, { status: 'completed' });
    });
  });
});

