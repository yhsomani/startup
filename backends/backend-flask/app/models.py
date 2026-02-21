from .extensions import db
from datetime import datetime, timezone
import uuid
from sqlalchemy.dialects.postgresql import UUID
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='STUDENT', nullable=False, index=True)
    is_active = db.Column(db.Boolean, default=True, index=True)

    # Profile fields
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    profile_picture_url = db.Column(db.String(500), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    location = db.Column(db.String(200), nullable=True)
    website = db.Column(db.String(500), nullable=True)
    linkedin = db.Column(db.String(500), nullable=True)
    github = db.Column(db.String(500), nullable=True)

    # Learning preferences
    learning_preferences = db.Column(db.JSON, nullable=True)  # {languages, topics, difficulty_level}

    # Password reset fields
    password_reset_token = db.Column(db.String(255), nullable=True)
    password_reset_expires = db.Column(db.DateTime, nullable=True)
    password_reset_sent = db.Column(db.DateTime, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    def __init__(self, email=None, password_hash=None, role='STUDENT', **kwargs):
        super(User, self).__init__(**kwargs)
        if email is not None:
            self.email = email
        if password_hash is not None:
            self.password_hash = password_hash
        if role is not None:
            self.role = role

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instructor_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    subtitle = db.Column(db.String(500))
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), default=0)
    currency = db.Column(db.String(3), default='USD')
    thumbnail_url = db.Column(db.String(500))
    preview_video_url = db.Column(db.String(500))
    is_published = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    instructor = db.relationship('User', backref='courses')
    sections = db.relationship('Section', backref='course', lazy=True, cascade="all, delete-orphan")
    skills = db.relationship('CourseSkill', backref='course', lazy=True, cascade="all, delete-orphan")

class Section(db.Model):
    __tablename__ = 'sections'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = db.Column(UUID(as_uuid=True), db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    order_index = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    lessons = db.relationship('Lesson', backref='section', lazy=True, cascade="all, delete-orphan")

class Lesson(db.Model):
    __tablename__ = 'lessons'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    section_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sections.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False) # video, quiz, challenge, text
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    order_index = db.Column(db.Integer, nullable=False)
    video_url = db.Column(db.String(500))
    duration = db.Column(db.Integer)
    content_markdown = db.Column(db.Text)
    challenge_id = db.Column(UUID(as_uuid=True), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

class CourseSkill(db.Model):
    __tablename__ = 'course_skills'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = db.Column(UUID(as_uuid=True), db.ForeignKey('courses.id'), nullable=False)
    skill_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, index=True)
    course_id = db.Column(UUID(as_uuid=True), db.ForeignKey('courses.id'), nullable=False, index=True)
    progress_percentage = db.Column(db.Integer, default=0)
    enrolled_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime)
    last_accessed_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

    user = db.relationship('User')
    course = db.relationship('Course')

    __table_args__ = (db.UniqueConstraint('user_id', 'course_id', name='unique_enrollment'),)

class LessonProgress(db.Model):
    __tablename__ = 'lesson_progress'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id = db.Column(UUID(as_uuid=True), db.ForeignKey('enrollments.id'), nullable=False, index=True)
    lesson_id = db.Column(UUID(as_uuid=True), db.ForeignKey('lessons.id'), nullable=False, index=True)
    is_completed = db.Column(db.Boolean, default=False, index=True)
    completed_at = db.Column(db.DateTime)
    video_position_seconds = db.Column(db.Integer, default=0)
    last_accessed_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

    enrollment = db.relationship('Enrollment')
    lesson = db.relationship('Lesson')

    __table_args__ = (db.UniqueConstraint('enrollment_id', 'lesson_id', name='unique_lesson_progress'),)

class Challenge(db.Model):
    __tablename__ = 'challenges'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    evaluationMetric = db.Column(db.String(50))
    dataset_url = db.Column(db.String(500))
    passing_score = db.Column(db.Numeric(5, 2), default=70.0)
    test_cases = db.Column(db.JSON)  # List of {input, output}
    language = db.Column(db.String(20), default='python', index=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class Submission(db.Model):
    __tablename__ = 'submissions'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_id = db.Column(UUID(as_uuid=True), db.ForeignKey('challenges.id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), default='pending') # pending, grading, passed, failed
    score = db.Column(db.Numeric(5, 2))
    feedback = db.Column(db.Text)
    submitted_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    graded_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

    challenge = db.relationship('Challenge')
    user = db.relationship('User')
