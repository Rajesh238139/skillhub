import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Loader from "../components/Loader";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const { user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/courses/${id}`).then((res) => setCourse(res.data)).finally(() => setLoading(false));
    if (user) {
      api.get("/payments/my-enrollments").then((res) => {
        setEnrolled(res.data.some((e) => e.course_id === id));
      });
    }
  }, [id, user]);

  const handleBuy = useCallback(async () => {
    if (!user) {
      navigate("/login", { state: { from: `/courses/${id}` } });
      return;
    }
    setPaying(true);
    try {
      const { data: order } = await api.post("/payments/create-order", { course_id: id });

      if (order.key_id === "demo_mode") {
        // No real Razorpay keys configured on the backend -- exercise the same
        // create-order -> confirm flow using the demo-complete endpoint so the
        // app is fully clickable without a merchant account.
        await new Promise((r) => setTimeout(r, 900)); // mimic checkout latency
        await api.post("/payments/demo-complete", { course_id: id });
        setEnrolled(true);
        push("Payment successful — you're enrolled! (demo mode)", "success");
        setPaying(false);
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok) {
        push("Couldn't load the payment widget. Check your connection.", "error");
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "SkillHub",
        description: order.course_title,
        order_id: order.order_id,
        handler: async (response) => {
          try {
            await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setEnrolled(true);
            push("Payment successful — you're enrolled!", "success");
          } catch {
            push("We couldn't verify that payment. Contact support if you were charged.", "error");
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
        theme: { color: "#7C5CFF" },
      });
      rzp.open();
    } catch (err) {
      push(err.response?.data?.detail || "Something went wrong starting checkout.", "error");
      setPaying(false);
    }
  }, [user, id, navigate, push]);

  if (loading) return <Loader label="Loading course" />;
  if (!course) return <p className="text-center py-20">Course not found.</p>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-[1fr,320px] gap-8">
        <div>
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 mb-3">
            {course.level}
          </span>
          <h1 className="text-3xl font-bold leading-tight">{course.title}</h1>
          <p className="text-ink/60 mt-2">by {course.instructor_name}</p>
          <p className="text-ink/70 mt-6 leading-relaxed">{course.description}</p>

          <div className="mt-8 card p-5">
            <h3 className="font-display font-semibold mb-3">What you'll walk away with</h3>
            <ul className="space-y-2 text-sm text-ink/70">
              <li className="flex gap-2"><span className="text-mint-500">✓</span> Hands-on project you can put on your resume</li>
              <li className="flex gap-2"><span className="text-mint-500">✓</span> Lifetime access to course updates</li>
              <li className="flex gap-2"><span className="text-mint-500">✓</span> Direct access to the instructor for questions</li>
            </ul>
          </div>
        </div>

        <div className="card p-6 h-fit sticky top-24">
          <p className="text-3xl font-display font-bold text-violet-600">₹{Number(course.price).toLocaleString("en-IN")}</p>
          <p className="text-xs text-ink/50 mb-5">One-time payment · lifetime access</p>

          {enrolled ? (
            <div className="text-center py-3 rounded-xl bg-mint-500/10 text-mint-600 font-semibold text-sm">
              ✓ You're enrolled
            </div>
          ) : (
            <button onClick={handleBuy} disabled={paying} className="btn-primary w-full">
              {paying ? "Processing…" : "Enroll now"}
            </button>
          )}

          <p className="text-[11px] text-ink/40 mt-3 text-center">Secured checkout via Razorpay</p>
        </div>
      </div>
    </div>
  );
}
