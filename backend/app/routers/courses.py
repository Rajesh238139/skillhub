from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.db.database import get_db
from app.models.course import Course
from app.models.user import User
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.schemas.course import CourseCreate, CourseOut, PaginatedCourses
from app.deps import get_current_user, require_instructor

router = APIRouter(prefix="/courses", tags=["courses"])


def _to_course_out(course: Course) -> CourseOut:
    data = CourseOut.model_validate(course)
    data.instructor_name = course.instructor.name if course.instructor else None
    return data


@router.get("", response_model=PaginatedCourses)
def list_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(9, ge=1, le=50),
    search: str = Query("", max_length=100),
    level: str = Query("", max_length=30),
    db: Session = Depends(get_db),
):
    q = db.query(Course).options(joinedload(Course.instructor))
    if search:
        q = q.filter(Course.title.ilike(f"%{search}%"))
    if level:
        q = q.filter(Course.level == level)

    total = q.with_entities(func.count(Course.id)).scalar() or 0
    items = q.order_by(Course.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return PaginatedCourses(items=[_to_course_out(c) for c in items], total=total, page=page, limit=limit)


@router.get("/mine", response_model=list[CourseOut])
def my_courses(current_user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    items = db.query(Course).filter(Course.instructor_id == current_user.id).order_by(Course.created_at.desc()).all()
    return [_to_course_out(c) for c in items]


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: str, db: Session = Depends(get_db)):
    course = db.query(Course).options(joinedload(Course.instructor)).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return _to_course_out(course)


@router.post("", response_model=CourseOut, status_code=201)
def create_course(
    payload: CourseCreate,
    current_user: User = Depends(require_instructor),
    db: Session = Depends(get_db),
):
    course = Course(**payload.model_dump(), instructor_id=current_user.id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return _to_course_out(course)


@router.get("/{course_id}/students")
def course_students(course_id: str, current_user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.instructor_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not yours")

    enrollments = (
        db.query(Enrollment)
        .options(joinedload(Enrollment.student))
        .filter(Enrollment.course_id == course_id, Enrollment.status == EnrollmentStatus.paid)
        .all()
    )
    return [{"id": e.student.id, "name": e.student.name, "email": e.student.email} for e in enrollments]
