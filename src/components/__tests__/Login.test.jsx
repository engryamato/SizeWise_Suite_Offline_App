import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../Login'

describe('Login page interactions', () => {
  test('renders CSS iridescent background and welcome container', () => {
    render(<Login onLogin={() => {}} />)
    expect(document.querySelector('.iridescent-background')).toBeInTheDocument()
    const container = screen.getByRole('button', { name: /welcome/i })
    expect(container).toBeInTheDocument()
  })

  test('hover changes text to "Enter PIN to Login" and unhover reverts', async () => {
    const user = userEvent.setup()
    render(<Login onLogin={() => {}} />)
    const container = screen.getByRole('button', { name: /welcome/i })
    await user.hover(container)
    expect(screen.getByRole('button', { name: /enter pin to login/i })).toBeInTheDocument()
    await user.unhover(container)
    expect(screen.getByRole('button', { name: /welcome/i })).toBeInTheDocument()
  })

  test('click expands to panel and shows PIN input and login button', async () => {
    const user = userEvent.setup()
    render(<Login onLogin={() => {}} />)
    const container = screen.getByRole('button', { name: /welcome/i })
    await user.click(container)
    expect(screen.getByRole('dialog', { name: /pin entry panel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    const pinInput = screen.getByPlaceholderText(/enter pin/i)
    expect(pinInput).toBeInTheDocument()
  })

  test('enter key on PIN triggers login handler', async () => {
    const mockLogin = vi.fn()
    const user = userEvent.setup()
    render(<Login onLogin={mockLogin} />)
    await user.click(screen.getByRole('button', { name: /welcome/i }))
    const pinInput = screen.getByPlaceholderText(/enter pin/i)
    await user.type(pinInput, '1234{enter}')
    expect(mockLogin).toHaveBeenCalled()
  })

  test('close button collapses the panel back to button', async () => {
    const user = userEvent.setup()
    render(<Login onLogin={() => {}} />)
    await user.click(screen.getByRole('button', { name: /welcome/i }))
    const closeBtn = screen.getByRole('button', { name: /×/ })
    await user.click(closeBtn)
    expect(screen.getByRole('button', { name: /welcome/i })).toBeInTheDocument()
  })
})
