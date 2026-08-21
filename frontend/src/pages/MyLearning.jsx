import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import Loader from "../components/Loader";

export default function MyLearning() {
  const [enrollments, setEnrollments] = useState(null);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/payments/my-enrollments").then(async (res) => {
      setEnrollments(res.data);
      const details = {};
      await Promise.all(
        res.data.map(async (e) => {
          const { data } = await api.get(`/courses/${e.course_id}`);
          details[e.course_id] = data;
        })
      );
      setCourses(details);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loader label="Loading your courses" />;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-1">My learning</h1>
      <p className="text-ink/55 mb-8">Courses you've enrolled in.</p>

      {enrollments.length === 0 ? (
        <div className="text-center py-20 card">
          <p className="text-4xl mb-3">🎒</p>
          <p className="font-semibold">Nothing here yet</p>
          <p className="text-ink/50 text-sm mt-1 mb-5">Enroll in a course to see it show up here.</p>
          <Link to="/courses" className="btn-primary inline-block">Browse courses</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrollments.map((e) => {
            const c = courses[e.course_id];
            if (!c) return null;
            return (
              <Link key={e.id} to={`/courses/${c.id}`} className="card p-5 hover:-translate-y-1 hover:shadow-cardHover">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-2xl mb-4">
                  {c.thumbnail_emoji}
                </div>
                <h3 className="font-display font-semibold leading-snug">{c.title}</h3>
                <p className="text-xs text-ink/50 mt-1">by {c.instructor_name}</p>
                <span className="inline-block mt-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-mint-500/10 text-mint-600">
                  ✓ Enrolled
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
