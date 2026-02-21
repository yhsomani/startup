from flask import jsonify
from . import lessons_bp
from app.models import Lesson

@lessons_bp.route('/<uuid:lesson_id>', methods=['GET'])
def get_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)

    return jsonify({
        'id': lesson.id,
        'sectionId': lesson.section_id,
        'challengeId': lesson.challenge_id,
        'title': lesson.title,
        'description': lesson.description,
        'type': lesson.type,
        'videoUrl': lesson.video_url,
        'duration': lesson.duration,
        'orderIndex': lesson.order_index,
        'isPublished': lesson.is_active, # Assuming active means visible
        'sectionTitle': lesson.section.title,
        'courseId': lesson.section.course_id,
        'courseTitle': lesson.section.course.title
    })
