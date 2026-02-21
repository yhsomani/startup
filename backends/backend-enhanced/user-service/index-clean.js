    // Create demo users in memory after database initialization
  async seedInMemoryDemoData() {
    const demoUsers = [
      {
        id: uuidv4(),
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
        password: await bcrypt.hash("password123", 10),
        role: "candidate",
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        email: "jane.smith@example.com",
        firstName: "Jane",
        lastName: "Smith",
        password: await bcrypt.hash("password123", 10),
        role: "candidate",
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        email: "company.hr@example.com",
        firstName: "Company",
        lastName: "HR",
        password: await bcrypt.hash("password123", 10),
        role: "employer",
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const userData of demoUsers) {
      try {
        await this.registerUser(userData);
      } catch (error) {
        // User might already exist
      }
    }