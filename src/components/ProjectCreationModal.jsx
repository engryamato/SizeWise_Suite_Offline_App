import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n';
import { validateProject } from '../../app/tools/estimating-app/validators/project.js';

export default function ProjectCreationModal({ isOpen, onClose, project = null, mode = 'create' }) {
  const { actions, state } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    startDate: '',
    dueDate: '',
    priority: 'medium',
    tags: []
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  // Reset form when modal opens/closes or populate with project data for editing
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && project) {
        // Populate form with existing project data
        setFormData({
          name: project.name || '',
          description: project.description || '',
          location: project.location || '',
          startDate: project.startDate || '',
          dueDate: project.dueDate || '',
          priority: project.priority || 'medium',
          tags: project.tags || []
        });
      } else {
        // Reset form for create mode
        setFormData({
          name: '',
          description: '',
          location: '',
          startDate: '',
          dueDate: '',
          priority: 'medium',
          tags: []
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, project]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Map validator issues to i18n-friendly messages
  const mapIssueToMessage = (path, message) => {
    switch (path) {
      case 'name':
        if (/at least|minimum|min/i.test(message)) return t('project.name') + ' ' + t('validation.tooShort')
        if (/at most|maximum|max/i.test(message)) return t('project.name') + ' ' + t('validation.tooLong')
        return t('project.name') + ' ' + t('validation.invalid')
      case 'description':
        if (/at most|maximum|max/i.test(message)) return t('project.description') + ' ' + t('validation.tooLong')
        return t('project.description') + ' ' + t('validation.invalid')
      case 'location':
        if (/at most|maximum|max/i.test(message)) return t('project.location') + ' ' + t('validation.tooLong')
        return t('project.location') + ' ' + t('validation.invalid')
      case 'priority':
        return t('project.priority') + ' ' + t('validation.invalid')
      default:
        return message;
    }
  };

  // Validate form using schema
  const validateForm = () => {
    const projectData = {
      ...formData,
      ownerId: state.user?.id
    };

    const newErrors = {};

    // Required fields (friendly, localized)
    if (!projectData.name || !projectData.name.trim()) {
      newErrors.name = `${t('project.name')} ${t('validation.required')}`;
    }
    if (!projectData.startDate) {
      newErrors.startDate = `${t('project.startDate')} ${t('validation.required')}`;
    }
    if (!projectData.dueDate) {
      newErrors.dueDate = `${t('project.dueDate')} ${t('validation.required')}`;
    }

    // Schema validation via Zod (map to localized messages)
    const { valid, errors: validationErrors } = validateProject({
      ...projectData,
      name: projectData.name?.trim() || '',
      description: projectData.description?.trim() || null,
      location: projectData.location?.trim() || null
    });
    if (!valid) {
      for (const err of validationErrors) {
        const key = err.path;
        if (!newErrors[key]) {
          newErrors[key] = mapIssueToMessage(key, err.message);
        }
      }
    }

    // Cross-field validation
    if (projectData.startDate && projectData.dueDate) {
      if (new Date(projectData.dueDate) <= new Date(projectData.startDate)) {
        newErrors.dueDate = `${t('project.dueDate')} ${t('validation.dueAfterStart')}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const projectData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        ownerId: state.user?.id
      };

      let result;
      if (mode === 'edit' && project) {
        result = await actions.updateProject(project.id, projectData);
      } else {
        result = await actions.createProject(projectData);
      }

      if (result.success) {
        // Small delay to ensure state updates before closing modal
        setTimeout(() => {
          onClose();
        }, 100);
      }
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} project:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'edit' ? t('project.edit') : t('project.create')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          {/* Project Name */}
          <div className="form-group">
            <label htmlFor="name">{t('project.name')} *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder={t('project.namePlaceholder')}
              maxLength={120}
              autoFocus
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">{t('project.description')}</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? 'error' : ''}
              placeholder={t('project.descriptionPlaceholder')}
              rows={3}
              maxLength={2000}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          {/* Location */}
          <div className="form-group">
            <label htmlFor="location">{t('project.location')}</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder={t('project.locationPlaceholder')}
            />
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">{t('project.startDate')} *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={errors.startDate ? 'error' : ''}
              />
              {errors.startDate && <span className="error-message">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">{t('project.dueDate')} *</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={errors.dueDate ? 'error' : ''}
              />
              {errors.dueDate && <span className="error-message">{errors.dueDate}</span>}
            </div>
          </div>

          {/* Priority */}
          <div className="form-group">
            <label htmlFor="priority">{t('project.priority')}</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="low">{t('general.low')}</option>
              <option value="medium">{t('general.medium')}</option>
              <option value="high">{t('general.high')}</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t('general.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (mode === 'edit' ? t('project.updating') : t('project.creating'))
                : (mode === 'edit' ? t('project.update') : t('project.createButton'))
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
