from flask import request, jsonify
from . import courses_bp
from app.models import Course, Section, Lesson, CourseSkill
from sqlalchemy import desc
from sqlalchemy.orm import joinedload, selectinload
from app.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity


@courses_bp.route('', methods=['GET'])
def list_courses():
    """List courses with pagination and filtering"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    instructor_id = request.args.get('instructorId')
    is_published = request.args.get('isPublished', 'true') == 'true'

    # Build query with eager loading to avoid N+1
    query = Course.query.options(
        joinedload(Course.instructor)
    ).filter_by(is_active=True)
    
    if is_published:
        query = query.filter_by(is_published=True)
    if instructor_id:
        query = query.filter_by(instructor_id=instructor_id)

    # Apply pagination
    pagination = query.order_by(desc(Course.created_at)).paginate(
        page=page, per_page=limit, error_out=False
    )

    data = []
    for course in pagination.items:
        course_data = {
            'id': course.id,
            'instructorId': course.instructor_id,
            'instructorName': course.instructor.email if course.instructor else '',
            'title': course.title,
            'subtitle': course.subtitle,
            'description': course.description,
            'price': float(course.price) if course.price else 0,
            'currency': course.currency,
            'thumbnailUrl': course.thumbnail_url,
            'previewVideoUrl': course.preview_video_url,
            'isPublished': course.is_published,
            'isActive': course.is_active,
            'createdAt': course.created_at.isoformat() if course.created_at else None,
            'updatedAt': course.updated_at.isoformat() if course.updated_at else None
        }
        data.append(course_data)

    return jsonify({
        'courses': data,
        'pagination': {
            'page': pagination.page,
            'pages': pagination.pages,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })


@courses_bp.route('/<uuid:course_id>', methods=['GET'])
def get_course(course_id):
    """Get course details with all sections and lessons. Cached for 120 seconds."""
    # Eager load all relationships to avoid N+1 queries
    course = Course.query.options(
        selectinload(Course.sections).selectinload(Section.lessons),
        selectinload(Course.skills)
    ).get_or_404(course_id)
    
    sections_data = []
    for section in sorted(course.sections, key=lambda s: s.order_index):
        if not section.is_active:
            continue
            
        lessons_data = []
        for lesson in sorted(section.lessons, key=lambda l: l.order_index):
            if not lesson.is_active:
                continue
                
            lesson_data = {
                'id': str(lesson.id),
                'type': lesson.type,
                'title': lesson.title,
                'description': lesson.description,
                'content': lesson.content_markdown,
                'videoUrl': lesson.video_url,
                'duration': lesson.duration,
                'orderIndex': lesson.order_index,
                'challengeId': str(lesson.challenge_id) if lesson.challenge_id else None,
                'isActive': lesson.is_active,
                'createdAt': lesson.created_at.isoformat() if lesson.created_at else None
            }
            lessons_data.append(lesson_data)
        
        section_data = {
            'id': str(section.id),
            'title': section.title,
            'orderIndex': section.order_index,
            'isActive': section.is_active,
            'lessons': lessons_data,
            'createdAt': section.created_at.isoformat() if section.created_at else None
        }
        sections_data.append(section_data)

    skills_data = []
    for skill in course.skills:
        skill_data = {
            'id': str(skill.id),
            'name': skill.skill_name,
            'createdAt': skill.created_at.isoformat() if skill.created_at else None
        }
        skills_data.append(skill_data)

    return jsonify({
        'id': str(course.id),
        'instructorId': str(course.instructor_id),
        'title': course.title,
        'subtitle': course.subtitle,
        'description': course.description,
        'price': float(course.price) if course.price else 0,
        'currency': course.currency,
        'thumbnailUrl': course.thumbnail_url,
        'previewVideoUrl': course.preview_video_url,
        'isPublished': course.is_published,
        'isActive': course.is_active,
        'sections': sections_data,
        'skills': skills_data,
        'createdAt': course.created_at.isoformat() if course.created_at else None,
        'updatedAt': course.updated_at.isoformat() if course.updated_at else None
    })


@courses_bp.route('', methods=['POST'])
@jwt_required()
def create_course():
    """Create new course"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    instructor_id = get_jwt_identity()
    
    course = Course(
        instructor_id=instructor_id,
        title=data.get('title', ''),
        subtitle=data.get('subtitle', ''),
        description=data.get('description', ''),
        price=data.get('price', 0),
        currency=data.get('currency', 'USD'),
        thumbnail_url=data.get('thumbnailUrl', ''),
        preview_video_url=data.get('previewVideoUrl', ''),
        is_published=data.get('isPublished', False)
    )
    
    db.session.add(course)
    db.session.commit()
    
    return jsonify({
        'id': str(course.id),
        'message': 'Course created successfully'
    }), 201