"""
TalentSphere Course Seed Script
Seeds sample course data for development/demo purposes.
"""
from app import create_app
from app.extensions import db
from app.models import Course, Section, Lesson, User
import uuid

app = create_app()

with app.app_context():
    # Ensure instructor exists
    instructor = User.query.filter_by(role='instructor').first()
    if not instructor:
        instructor = User(email="instructor@demo.com", role="instructor")
        instructor.set_password("password123")
        db.session.add(instructor)
        db.session.commit()
        print(f"Created instructor: {instructor.email}")
    
    # Check if courses already exist
    existing_courses = Course.query.count()
    if existing_courses > 0:
        print(f"Database already has {existing_courses} courses. Skipping seed.")
    else:
        # Seed Course 1: Python Fundamentals
        course1 = Course(
            title="Python Fundamentals",
            subtitle="Master Python programming from scratch",
            description="A comprehensive course covering Python basics, data structures, functions, and OOP concepts. Perfect for beginners who want to start their programming journey.",
            instructor_id=instructor.id,
            price=49.99,
            currency="USD",
            thumbnail_url="https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400",
            is_published=True,
            is_active=True
        )
        db.session.add(course1)
        db.session.flush()
        
        # Add sections to Course 1
        section1 = Section(course_id=course1.id, title="Getting Started", order_index=1, is_active=True)
        section2 = Section(course_id=course1.id, title="Data Types and Variables", order_index=2, is_active=True)
        db.session.add_all([section1, section2])
        db.session.flush()
        
        # Add lessons
        lesson1 = Lesson(section_id=section1.id, title="Introduction to Python", type="video", order_index=1, duration=600, is_active=True)
        lesson2 = Lesson(section_id=section1.id, title="Setting Up Your Environment", type="video", order_index=2, duration=480, is_active=True)
        lesson3 = Lesson(section_id=section2.id, title="Numbers and Strings", type="video", order_index=1, duration=720, is_active=True)
        db.session.add_all([lesson1, lesson2, lesson3])
        
        # Seed Course 2: Web Development
        course2 = Course(
            title="Full Stack Web Development",
            subtitle="Build modern web applications",
            description="Learn to build complete web applications using React, Node.js, and PostgreSQL. Covers frontend, backend, and deployment.",
            instructor_id=instructor.id,
            price=79.99,
            currency="USD",
            thumbnail_url="https://images.unsplash.com/photo-1547658719-da2b51169166?w=400",
            is_published=True,
            is_active=True
        )
        db.session.add(course2)
        db.session.flush()
        
        section3 = Section(course_id=course2.id, title="HTML & CSS Basics", order_index=1, is_active=True)
        db.session.add(section3)
        db.session.flush()
        
        lesson4 = Lesson(section_id=section3.id, title="HTML5 Fundamentals", type="video", order_index=1, duration=900, is_active=True)
        db.session.add(lesson4)
        
        # Seed Course 3: Data Science
        course3 = Course(
            title="Data Science with Python",
            subtitle="Analyze data like a pro",
            description="Master data analysis, visualization, and machine learning with Python, Pandas, NumPy, and Scikit-learn.",
            instructor_id=instructor.id,
            price=99.99,
            currency="USD",
            thumbnail_url="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
            is_published=True,
            is_active=True
        )
        db.session.add(course3)
        
        db.session.commit()
        print("Seeded 3 courses with sections and lessons successfully!")
        
    # Print current state
    print(f"\nDatabase state:")
    print(f"  Users: {User.query.count()}")
    print(f"  Courses: {Course.query.count()}")
    print(f"  Sections: {Section.query.count()}")
    print(f"  Lessons: {Lesson.query.count()}")
