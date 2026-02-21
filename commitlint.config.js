module.exports = {
    extends: ["@commitlint/config-conventional"],
    rules: {
        "body-leading-blank": [0, "never"],
        "body-max-line-length": [0, "always", 100],
        "footer-leading-blank": [0, "never"],
        "footer-max-line-length": [0, "always", 100],
        "header-max-length": [0, "always", 100],
        "subject-case": [0, "never"],
        "subject-empty": [0, "never"],
        "subject-full-stop": [0, "never", "."],
        "type-case": [0, "never"],
        "type-empty": [0, "never"],
        "type-enum": [
            2,
            "always",
            [
                "feat", // New feature
                "fix", // Bug fix
                "docs", // Documentation changes
                "style", // Code style changes (formatting, missing semi colons, etc)
                "refactor", // Code refactoring without changes to functionality
                "perf", // Performance improvements
                "test", // Adding or updating tests
                "chore", // Maintenance tasks, dependency updates, etc.
                "build", // Build system or external dependency changes
                "ci", // CI configuration changes
                "revert", // Reverting previous changes
                "security", // Security fixes
            ],
        ],
        "scope-case": [0, "always"],
        "scope-empty": [0, "never"],
        "scope-enum": [
            0,
            "always",
            [
                "analytics",
                "auth",
                "user",
                "company",
                "job",
                "application",
                "notification",
                "search",
                "file",
                "video",
                "messaging",
                "config",
                "infrastructure",
                "documentation",
                "test",
                "shared",
            ],
        ],
    },
};
