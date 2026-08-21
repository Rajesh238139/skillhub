import { Link } from "react-router-dom";

const LEVEL_STYLES = {
  Beginner: "bg-mint-500/10 text-mint-600",
  Intermediate: "bg-coral-500/10 text-coral-600",
  Advanced: "bg-violet-500/10 text-violet-700",
};

export default function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="card group p-5 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-cardHover"
    >
      <div className="w-14 h-14 rounded-2xl bg-mesh bg-violet-50 flex items-center justify-center text-2xl">
        {course.thumbnail_emoji || "📘"}
      </div>

      <div className="flex-1">
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${LEVEL_STYLES[course.level] || LEVEL_STYLES.Beginner}`}>
          {course.level}
        </span>
        <h3 className="font-display font-semibold text-lg leading-snug group-hover:text-violet-600 transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-ink/55 mt-1.5 line-clamp-2">{course.description}</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-violet-100/70">
        <span className="text-xs text-ink/50">by {course.instructor_name || "Unknown"}</span>
        <span className="font-display font-bold text-violet-600">₹{Number(course.price).toLocaleString("en-IN")}</span>
      </div>
    </Link>
  );
}
