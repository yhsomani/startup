from flask import request, jsonify
from . import progress_bp
from app.models import Enrollment, LessonProgress, Course, Lesson
from app.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid
from app.events import publish_event

@progress_bp.route('', methods=['POST'])
@jwt_required()
def create_enrollment():
    user_id = get_jwt_identity()
    data = request.get_json()
    course_id = data.get('courseId')

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'message': 'Course not found'}), 404

    if not course.is_published:
        return jsonify({'message': 'Cannot enroll in unpublished course'}), 400

    if Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first():
        return jsonify({'message': 'User already enrolled'}), 409

    enrollment = Enrollment(
        user_id=user_id,
        course_id=course_id,
        enrolled_at=datetime.utcnow()
    )
    db.session.add(enrollment)
    db.session.commit()

    publish_event('enrollment.created', {
        'userId': user_id,
        'courseId': course_id,
        'enrollmentId': enrollment.id,
        'timestamp': datetime.utcnow()
    })

    return jsonify({
        'id': enrollment.id,
        'userId': enrollment.user_id,
        'courseId': enrollment.course_id,
        'courseTitle': course.title,
        'progressPercentage': 0,
        'status': 'in_progress'
    }), 201

@progress_bp.route('/<uuid:enrollment_id>/lessons/<uuid:lesson_id>/complete', methods=['PUT'])
@jwt_required()
def mark_lesson_complete(enrollment_id, lesson_id):
    user_id = get_jwt_identity()
    enrollment = Enrollment.query.get_or_404(enrollment_id)

    if str(enrollment.user_id) != user_id:
        return jsonify({'message': 'Forbidden'}), 403

    lesson = Lesson.query.get_or_404(lesson_id)
    if lesson.section.course_id != enrollment.course_id:
        return jsonify({'message': 'Lesson does not belong to this course'}), 400

    progress = LessonProgress.query.filter_by(enrollment_id=enrollment_id, lesson_id=lesson_id).first()
    if not progress:
        progress = LessonProgress(enrollment_id=enrollment_id, lesson_id=lesson_id)
        db.session.add(progress)

    if not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
        db.session.commit() # Save progress first

        # update enrollment progress
        # count lessons
        total_lessons = sum(len(s.lessons) for s in enrollment.course.sections if s.is_active)
        completed_lessons = LessonProgress.query.filter_by(enrollment_id=enrollment_id, is_completed=True).count()

        if total_lessons > 0:
            percentage = int((completed_lessons / total_lessons) * 100)
            enrollment.progress_percentage = percentage
            if percentage == 100 and not enrollment.completed_at:
                enrollment.completed_at = datetime.utcnow()
                publish_event('course.completed', {
                    'userId': user_id,
                    'courseId': enrollment.course_id,
                    'enrollmentId': enrollment.id,
                    'timestamp': datetime.utcnow()
                })
            db.session.commit()

    return jsonify({
        'lessonProgress': {
            'lessonId': lesson_id,
            'isCompleted': True,
            'completedAt': progress.completed_at
        },
        'enrollmentProgress': {
            'enrollmentId': enrollment_id,
            'progressPercentage': enrollment.progress_percentage,
            'completedAt': enrollment.completed_at
        }
    })

@progress_bp.route('/<uuid:enrollment_id>/progress', methods=['GET'])
@jwt_required()
def get_progress_details(enrollment_id):
    user_id = get_jwt_identity()
    enrollment = Enrollment.query.get_or_404(enrollment_id)

    if str(enrollment.user_id) != user_id:
        return jsonify({'message': 'Forbidden'}), 403

    progresses = LessonProgress.query.filter_by(enrollment_id=enrollment_id).all()
    progress_map = {p.lesson_id: p for p in progresses}

    lessons = []
    # Sort sections and lessons
    for section in sorted(enrollment.course.sections, key=lambda s: s.order_index):
        if not section.is_active: continue
        for lesson in sorted(section.lessons, key=lambda l: l.order_index):
            if not lesson.is_active: continue

            lp = progress_map.get(lesson.id)
            lessons.append({
                'lessonId': lesson.id,
                'lessonTitle': lesson.title,
                'sectionTitle': section.title,
                'type': lesson.type,
                'isCompleted': lp.is_completed if lp else False,
                'completedAt': lp.completed_at if lp else None,
                'videoPosition': lp.video_position_seconds if lp else 0
            })

    return jsonify({
        'enrollmentId': enrollment.id,
        'courseId': enrollment.course_id,
        'courseTitle': enrollment.course.title,
        'progressPercentage': enrollment.progress_percentage,
        'completedAt': enrollment.completed_at,
        'lessons': lessons
    })

@progress_bp.route('/lookup', methods=['GET'])
@jwt_required()
def lookup_enrollment():
    user_id = get_jwt_identity()
    course_id = request.args.get('courseId')

    if not course_id:
        return jsonify({'message': 'Course ID required'}), 400

    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()

    if not enrollment:
        return jsonify({'message': 'Enrollment not found'}), 404

    return jsonify({
        'id': enrollment.id,
        'userId': enrollment.user_id,
        'courseId': enrollment.course_id,
        'progressPercentage': enrollment.progress_percentage,
        'status': enrollment.completed_at and 'completed' or 'in_progress'
    })
