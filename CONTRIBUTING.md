# Contributing to Invoice³

Thank you for considering contributing to Invoice³! We welcome contributions from the community.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
```bash
git clone https://github.com/your-username/invoice3.git
cd invoice3
```

3. **Create a branch** for your feature or bugfix
```bash
git checkout -b feature/your-feature-name
```

4. **Set up your development environment**
   - Follow the setup instructions in [README.md](README.md)
   - Install dependencies for both backend and frontend

## 💻 Development Guidelines

### Code Style

#### Python (Backend)
- Follow [PEP 8](https://pep8.org/) style guide
- Use type hints where appropriate
- Write docstrings for all functions and classes
- Keep functions focused and under 50 lines when possible

```python
def process_invoice(invoice_data: Dict[str, Any]) -> InvoiceResult:
    """
    Process an invoice through the validation pipeline.
    
    Args:
        invoice_data: Dictionary containing invoice fields
        
    Returns:
        InvoiceResult object with validation results
    """
    ...
```

#### TypeScript (Frontend)
- Use TypeScript strict mode
- Follow functional programming patterns
- Use meaningful variable names
- Keep components small and focused

```typescript
interface InvoiceProps {
  invoice: Invoice;
  onUpdate: (invoice: Invoice) => void;
}

export const InvoiceCard: React.FC<InvoiceProps> = ({ invoice, onUpdate }) => {
  // Component logic
};
```

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add batch invoice processing
fix: resolve database connection timeout
docs: update API documentation
refactor: simplify validation logic
test: add tests for fraud detection
```

### Testing

- Write tests for new features
- Ensure existing tests pass before submitting PR
- Aim for >80% code coverage

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📝 Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Run linters and formatters**:
```bash
# Backend
black app/
flake8 app/

# Frontend
npm run lint
npm run format
```

4. **Create a Pull Request** with a clear description:
   - What does this PR do?
   - Why is this change needed?
   - How has it been tested?
   - Any breaking changes?

5. **Wait for review** - maintainers will review your PR
6. **Address feedback** if requested
7. **Celebrate!** 🎉 Your contribution will be merged

## 🐛 Reporting Bugs

When reporting bugs, please include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, Python version, Node version)

## 💡 Feature Requests

We love new ideas! When suggesting features:

- **Describe the problem** you're trying to solve
- **Explain your proposed solution**
- **Consider alternatives** you've thought about
- **Discuss impact** on existing functionality

## 📖 Documentation

Help improve our docs:

- Fix typos or clarify confusing sections
- Add examples and use cases
- Translate documentation
- Create tutorials or guides

## 🤝 Code of Conduct

Be respectful, inclusive, and constructive. We're all here to learn and build together.

## ❓ Questions?

- Open a [GitHub Discussion](https://github.com/yourusername/invoice3/discussions)
- Check existing issues and PRs
- Reach out to maintainers

Thank you for making Invoice³ better! 🙏
