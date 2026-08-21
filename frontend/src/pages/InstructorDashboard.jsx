import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { useToast } from "../context/ToastContext";
import Loader from "../components/Loader";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const EMOJIS = ["📘", "🚀", "🎨", "🧠", "⚙️", "💡", "📊", "🔒"];

export default function InstructorDashboard() {
  const [courses, setCourses] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", level: "Beginner", thumbnail_emoji: "📘" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [students, setStudents] = useState({});
  const { push } = useToast();

  const loadCourses = () => api.get("/courses/mine").then((res) => setCourses(res.data));

  useEffect(() => { loadCourses(); }, []);

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 3) e.title = "Title needs at least 3 characters";
    if (form.description.trim().length < 10) e.description = "Add a bit more detail (10+ characters)";
    if (!form.price || Number(form.price) < 0) e.price = "Enter a valid price";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/courses", { ...form, price: Number(form.price) });
      push("Course published", "success");
      setForm({ title: "", description: "", price: "", level: "Beginner", thumbnail_emoji: "📘" });
      setShowForm(false);
      loadCourses();
    } catch (err) {
      push(err.response?.data?.detail || "Couldn't create the course.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStudents = async (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }
    setExpandedCourse(courseId);
    if (!students[courseId]) {
      const { data } = await api.get(`/courses/${courseId}/students`);
      setStudents((s) => ({ ...s, [courseId]: data }));
    }
  };

  if (!courses) return <Loader label="Loading your studio" />;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Instructor studio</h1>
          <p className="text-ink/55 mt-1">Publish courses and see who's enrolled.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New course"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 mb-8 flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Title</label>
            <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. React Performance Masterclass" />
            {errors.title && <p className="text-coral-600 text-xs mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Description</label>
            <textarea className="input-field min-h-[100px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What will students learn and build?" />
            {errors.description && <p className="text-coral-600 text-xs mt-1">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Price (₹)</label>
              <input type="number" min="0" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="999" />
              {errors.price && <p className="text-coral-600 text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Level</label>
              <select className="input-field" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((emo) => (
                <button
                  type="button"
                  key={emo}
                  onClick={() => setForm({ ...form, thumbnail_emoji: emo })}
                  className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border-2 transition-colors ${
                    form.thumbnail_emoji === emo ? "border-violet-500 bg-violet-50" : "border-violet-100"
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary self-start" disabled={submitting}>
            {submitting ? "Publishing…" : "Publish course"}
          </button>
        </form>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-20 card">
          <p className="text-4xl mb-3">🎬</p>
          <p className="font-semibold">You haven't published a course yet</p>
          <p className="text-ink/50 text-sm mt-1">Click "+ New course" to publish your first one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {courses.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-xl">{c.thumbnail_emoji}</div>
                  <div>
                    <h3 className="font-display font-semibold">{c.title}</h3>
                    <p className="text-xs text-ink/50">{c.level} · ₹{Number(c.price).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <button onClick={() => toggleStudents(c.id)} className="btn-secondary !px-4 !py-2 text-sm">
                  {expandedCourse === c.id ? "Hide students" : "View students"}
                </button>
              </div>

              {expandedCourse === c.id && (
                <div className="mt-4 pt-4 border-t border-violet-100/70">
                  {!students[c.id] ? (
                    <p className="text-sm text-ink/50">Loading…</p>
                  ) : students[c.id].length === 0 ? (
                    <p className="text-sm text-ink/50">No paid enrollments yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {students[c.id].map((s) => (
                        <li key={s.id} className="flex items-center justify-between text-sm bg-violet-50/60 rounded-lg px-3 py-2">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-ink/50">{s.email}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
