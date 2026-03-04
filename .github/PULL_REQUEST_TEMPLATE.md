# Pull Request Template

## Description
<!-- What does this PR do? -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring

## Architectural Changes
<!-- Does this PR affect the system architecture? If yes, SSOT.md must be updated. -->

## Checklist

- [ ] I have verified that my changes do not conflict with the architectural guidelines in `docs/SSOT.md`.
- [ ] I have NOT added fragmented `.md` files to the root directory.
- [ ] If this PR introduces new APIs, Environment Variables, or infrastructural dependencies, I have updated `docs/SSOT.md`.
- [ ] Port numbers used are consistent with §38 Final Service Port Map.
- [ ] Code passes linting (`npm run lint`)
- [ ] Tests pass (`npm run test`)

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)

## Additional Notes
<!-- Any additional context or screenshots -->
