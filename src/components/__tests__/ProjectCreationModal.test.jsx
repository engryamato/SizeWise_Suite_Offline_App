import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProjectCreationModal from '../ProjectCreationModal.jsx';

const mockCreate = vi.fn().mockResolvedValue({ success: true });
const mockUpdate = vi.fn().mockResolvedValue({ success: true });

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    actions: {
      createProject: mockCreate,
      updateProject: mockUpdate,
    },
  }),
}));

const renderModal = (props = {}) => {
  const defaultProps = { isOpen: true, onClose: vi.fn() };
  return render(<ProjectCreationModal {...defaultProps} {...props} />);
};

describe('ProjectCreationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('validates required fields and shows errors', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /create project/i }));

    expect(await screen.findByText(/project name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/start date is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/due date is required/i)).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('creates new project with valid data', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    await user.type(screen.getByLabelText(/project name/i), ' New Project ');
    await user.type(screen.getByLabelText(/start date/i), '2024-01-01');
    await user.type(screen.getByLabelText(/due date/i), '2024-01-10');

    await user.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'New Project',
        description: null,
        location: null,
        startDate: '2024-01-01',
        dueDate: '2024-01-10',
        priority: 'medium',
        tags: [],
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('updates existing project in edit mode', async () => {
    const user = userEvent.setup();
    const project = {
      id: 1,
      name: 'Old Name',
      description: 'desc',
      location: 'loc',
      startDate: '2024-02-01',
      dueDate: '2024-02-10',
      priority: 'high',
      tags: ['x'],
    };
    renderModal({ project, mode: 'edit' });

    const nameInput = screen.getByLabelText(/project name/i);
    expect(nameInput).toHaveValue('Old Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated');

    await user.click(screen.getByRole('button', { name: /update project/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(1, {
        name: 'Updated',
        description: 'desc',
        location: 'loc',
        startDate: '2024-02-01',
        dueDate: '2024-02-10',
        priority: 'high',
        tags: ['x'],
      });
    });
  });

  test('shows error when due date before start date', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/project name/i), 'Edge Project');
    await user.type(screen.getByLabelText(/start date/i), '2024-01-10');
    await user.type(screen.getByLabelText(/due date/i), '2024-01-01');

    await user.click(screen.getByRole('button', { name: /create project/i }));

    expect(await screen.findByText(/due date must be after start date/i)).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('closes when escape key pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });
});

