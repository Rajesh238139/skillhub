import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address";
    if (form.password.length < 6) e.password = "Use at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await register(form);
      push(`Account created — welcome, ${user.name.split(" ")[0]}`, "success");
      navigate(user.role === "instructor" ? "/instructor" : "/courses");
    } catch (err) {
      push(err.response?.data?.detail || "Couldn't create your account.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 bg-mesh">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-sm text-ink/55 mb-6">Start learning or start teaching — takes under a minute.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Full name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ada Lovelace"
            />
            {errors.name && <p className="text-coral-600 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Email</label>
            <input
              type="email"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-coral-600 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Password</label>
            <input
              type="password"
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
            />
            {errors.password && <p className="text-coral-600 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "student", label: "Learn", emoji: "🎓" },
                { value: "instructor", label: "Teach", emoji: "🚀" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setForm({ ...form, role: opt.value })}
                  className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                    form.role === opt.value ? "border-violet-500 bg-violet-50" : "border-violet-100 hover:border-violet-300"
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <p className="font-semibold text-sm mt-1">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary mt-2" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-ink/55 mt-6 text-center">
          Already have an account? <Link to="/login" className="text-violet-600 font-semibold">Log in</Link>
        </p>
      </div>
    </div>
  );
}
