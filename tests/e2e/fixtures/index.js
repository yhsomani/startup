/**
 * Test Data Fixtures for E2E Tests
 * Sample data for testing various scenarios
 */

const fs = require('fs');
const path = require('path');

// Sample job data
const jobFixtures = {
  softwareEngineer: {
    title: 'Senior Software Engineer',
    description: `We are looking for a Senior Software Engineer to join our dynamic team. 
    You will be responsible for developing scalable web applications, mentoring junior developers, 
    and contributing to technical decisions. The ideal candidate has strong experience in 
    modern JavaScript frameworks and cloud technologies.`,
    location: 'San Francisco, CA',
    type: 'Full-time',
    category: 'Engineering',
    experienceLevel: 'Senior',
    salary: '$120,000 - $180,000',
    remote: 'Hybrid',
    benefits: [
      'Health insurance',
      '401(k) matching',
      'Unlimited PTO',
      'Remote work options',
      'Professional development budget'
    ],
    requirements: [
      '5+ years of software development experience',
      'Proficiency in JavaScript and React',
      'Experience with Node.js and Express',
      'Strong understanding of REST APIs',
      'Experience with cloud platforms (AWS/Azure/GCP)',
      'Excellent problem-solving skills'
    ],
    responsibilities: [
      'Design and implement scalable web applications',
      'Write clean, maintainable code',
      'Participate in code reviews',
      'Mentor junior developers',
      'Collaborate with cross-functional teams'
    ]
  },
  
  productManager: {
    title: 'Product Manager',
    description: 'Seeking an experienced Product Manager to drive product strategy...',
    location: 'New York, NY',
    type: 'Full-time',
    category: 'Product',
    experienceLevel: 'Mid-level',
    salary: '$100,000 - $140,000',
    remote: 'Remote'
  },
  
  dataScientist: {
    title: 'Data Scientist',
    description: 'Looking for a Data Scientist to join our analytics team...',
    location: 'Boston, MA',
    type: 'Full-time',
    category: 'Data Science',
    experienceLevel: 'Senior',
    salary: '$130,000 - $170,000',
    remote: 'Hybrid'
  }
};

// Sample user profiles
const userFixtures = {
  jobSeeker: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@talentsphere.test',
    password: 'TestPassword123!',
    phone: '+1-555-0123',
    location: 'San Francisco, CA',
    bio: 'Experienced software engineer with 5+ years in web development',
    skills: [
      'JavaScript',
      'React',
      'Node.js',
      'Python',
      'AWS',
      'Docker'
    ],
    experience: [
      {
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        startDate: '2020-01',
        endDate: '2024-01',
        current: false,
        description: 'Led development of enterprise web applications'
      },
      {
        title: 'Software Engineer',
        company: 'StartupXYZ',
        location: 'San Francisco, CA',
        startDate: '2018-06',
        endDate: '2019-12',
        current: false,
        description: 'Full-stack development using modern technologies'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        school: 'University of California, Berkeley',
        graduationYear: '2018'
      }
    ]
  },
  
  employer: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@talentsphere.test',
    password: 'TestPassword123!',
    company: 'TechCorp Inc.',
    role: 'HR Manager',
    companySize: '500-1000',
    industry: 'Technology',
    companyDescription: 'Leading technology company specializing in enterprise software solutions'
  }
};

// Resume and file fixtures
const fileFixtures = {
  resume: {
    filename: 'sample-resume.pdf',
    content: 'Sample resume content for testing',
    mimeType: 'application/pdf'
  },
  
  coverLetter: {
    filename: 'sample-cover-letter.docx',
    content: 'Sample cover letter content for testing',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  
  profileImage: {
    filename: 'sample-profile.jpg',
    content: 'Sample profile image content for testing',
    mimeType: 'image/jpeg'
  }
};

// Create fixture files if they don't exist
function createFixtureFiles() {
  const fixturesDir = path.join(__dirname, '../fixtures');
  
  // Ensure fixtures directory exists
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  
  // Create sample files
  Object.entries(fileFixtures).forEach(([key, fixture]) => {
    const filePath = path.join(fixturesDir, fixture.filename);
    
    if (!fs.existsSync(filePath)) {
      // Create a simple file for testing
      const buffer = Buffer.from(fixture.content);
      fs.writeFileSync(filePath, buffer);
      console.log(`Created fixture file: ${fixture.filename}`);
    }
  });
}

// Export fixtures for use in tests
module.exports = {
  jobFixtures,
  userFixtures,
  fileFixtures,
  createFixtureFiles
};

// Auto-create fixture files when module is imported
createFixtureFiles();