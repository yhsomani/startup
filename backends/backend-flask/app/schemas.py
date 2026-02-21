"""
Marshmallow Schemas for TalentSphere Models

Provides consistent serialization/deserialization for API responses.
"""

from marshmallow import Schema, fields, validate, post_load
from typing import Any, Dict


class UserSchema(Schema):
    """Schema for User model serialization."""
    id = fields.UUID(dump_only=True)
    email = fields.Email(required=True)
    role = fields.Str(validate=validate.OneOf(['STUDENT', 'INSTRUCTOR', 'ADMIN', 'RECRUITER']))
    first_name = fields.Str(load_default=None)
    last_name = fields.Str(load_default=None)
    bio = fields.Str(load_default=None)
    profile_picture_url = fields.Url(load_default=None)
    phone = fields.Str(load_default=None)
    location = fields.Str(load_default=None)
    website = fields.Url(load_default=None)
    linkedin = fields.Url(load_default=None)
    github = fields.Url(load_default=None)
    is_active = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class UserPublicSchema(Schema):
    """Public user info - no sensitive data."""
    id = fields.UUID(dump_only=True)
    email = fields.Email(dump_only=True)
    role = fields.Str(dump_only=True)
    first_name = fields.Str(dump_only=True)
    last_name = fields.Str(dump_only=True)


class LoginSchema(Schema):
    """Schema for login request validation."""
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=1))


class RegisterSchema(Schema):
    """Schema for registration request validation."""
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8))
    role = fields.Str(load_default='STUDENT', validate=validate.OneOf(['STUDENT', 'INSTRUCTOR']))


class AuthResponseSchema(Schema):
    """Schema for auth response."""
    token = fields.Str(required=True)
    refreshToken = fields.Str(required=True)
    expiresIn = fields.Int(required=True)
    user = fields.Nested(UserPublicSchema)


class CourseSkillSchema(Schema):
    """Schema for CourseSkill model."""
    id = fields.UUID(dump_only=True)
    name = fields.Str(attribute='skill_name')
    created_at = fields.DateTime(dump_only=True)


class LessonSchema(Schema):
    """Schema for Lesson model."""
    id = fields.UUID(dump_only=True)
    type = fields.Str()
    title = fields.Str(required=True)
    description = fields.Str()
    content = fields.Str(attribute='content_markdown')
    video_url = fields.Url(load_default=None)
    duration = fields.Int()
    order_index = fields.Int()
    challenge_id = fields.UUID(load_default=None)
    is_active = fields.Bool()
    created_at = fields.DateTime(dump_only=True)


class SectionSchema(Schema):
    """Schema for Section model."""
    id = fields.UUID(dump_only=True)
    title = fields.Str(required=True)
    order_index = fields.Int()
    is_active = fields.Bool()
    lessons = fields.List(fields.Nested(LessonSchema))
    created_at = fields.DateTime(dump_only=True)


class CourseSchema(Schema):
    """Schema for Course model."""
    id = fields.UUID(dump_only=True)
    instructor_id = fields.UUID()
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    subtitle = fields.Str(validate=validate.Length(max=500))
    description = fields.Str()
    price = fields.Decimal(places=2, load_default=0)
    currency = fields.Str(load_default='USD', validate=validate.Length(equal=3))
    thumbnail_url = fields.Url(load_default=None)
    preview_video_url = fields.Url(load_default=None)
    is_published = fields.Bool(load_default=False)
    is_active = fields.Bool(dump_only=True)
    sections = fields.List(fields.Nested(SectionSchema))
    skills = fields.List(fields.Nested(CourseSkillSchema))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class CourseListSchema(Schema):
    """Schema for course list response."""
    id = fields.UUID(dump_only=True)
    instructor_id = fields.UUID()
    instructor_name = fields.Str()
    title = fields.Str()
    subtitle = fields.Str()
    description = fields.Str()
    price = fields.Decimal(places=2)
    currency = fields.Str()
    thumbnail_url = fields.Url()
    is_published = fields.Bool()
    created_at = fields.DateTime()


class PaginationSchema(Schema):
    """Schema for pagination metadata."""
    page = fields.Int()
    pages = fields.Int()
    per_page = fields.Int()
    total = fields.Int()
    has_next = fields.Bool()
    has_prev = fields.Bool()


class EnrollmentSchema(Schema):
    """Schema for Enrollment model."""
    id = fields.UUID(dump_only=True)
    user_id = fields.UUID()
    course_id = fields.UUID()
    progress_percentage = fields.Int()
    enrolled_at = fields.DateTime(dump_only=True)
    completed_at = fields.DateTime()
    last_accessed_at = fields.DateTime()
    is_active = fields.Bool()


class PasswordResetRequestSchema(Schema):
    """Schema for password reset request."""
    email = fields.Email(required=True)


class PasswordResetSchema(Schema):
    """Schema for password reset with token."""
    token = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8))


# Schema instances for reuse
user_schema = UserSchema()
user_public_schema = UserPublicSchema()
login_schema = LoginSchema()
register_schema = RegisterSchema()
auth_response_schema = AuthResponseSchema()
course_schema = CourseSchema()
course_list_schema = CourseListSchema(many=True)
section_schema = SectionSchema()
lesson_schema = LessonSchema()
enrollment_schema = EnrollmentSchema()
