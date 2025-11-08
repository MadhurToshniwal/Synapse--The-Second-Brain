# Contributing to Synapse

Thank you for your interest in contributing to Synapse! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards others

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/MadhurToshniwal/Synapse--The-Second-Brain/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, versions)

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear use case
   - Proposed solution
   - Alternative approaches considered
   - Mockups/diagrams if helpful

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes:**
   - Follow existing code style
   - Write meaningful commit messages
   - Add tests for new features
   - Update documentation

4. **Test your changes:**
   ```bash
   npm test
   npm run lint
   ```

5. **Commit with conventional commits:**
   ```
   feat: add user preferences
   fix: resolve search bug
   docs: update API documentation
   style: format code
   refactor: simplify auth logic
   test: add search tests
   chore: update dependencies
   ```

6. **Push and create PR:**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **In your PR description:**
   - Describe what you changed and why
   - Link related issues
   - Include screenshots for UI changes
   - List any breaking changes

## Development Setup

See [QUICKSTART.md](QUICKSTART.md) for development environment setup.

## Code Style

### JavaScript/Node.js
- Use ES6+ features
- Use async/await over callbacks
- Meaningful variable and function names
- Comment complex logic
- Keep functions small and focused

### React
- Use functional components with hooks
- Props validation with PropTypes
- Keep components under 200 lines
- Extract reusable logic to custom hooks

### Git Commits
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Example:**
```
feat(search): add semantic search with embeddings

- Implement vector similarity search
- Add hybrid ranking algorithm
- Update search UI with filters

Closes #123
```

## Project Structure

```
synapse/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   └── test/              # Backend tests
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── utils/         # Utilities
│   └── public/           # Static assets
└── extension/            # Chrome extension
```

## Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm test -- search         # Run specific test
npm run test:coverage      # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                   # Run tests
npm run test:watch        # Watch mode
```

## Documentation

- Update README.md for major features
- Add JSDoc comments for functions
- Update API documentation
- Include inline comments for complex logic

## Questions?

- 💬 [GitHub Discussions](https://github.com/MadhurToshniwal/Synapse--The-Second-Brain/discussions)
- 📧 Email: madhurtoshniwal03@gmail.com

Thank you for contributing! 🙏
