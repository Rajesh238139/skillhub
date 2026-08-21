# SkillHub — Full-Stack Course Platform

A resume-ready full-stack project: a paid course marketplace with JWT authentication,
role-based access control, and Razorpay payment integration.

**Stack:** FastAPI · MySQL (SQLAlchemy + Alembic-ready) · React (Vite) · TailwindCSS · JWT · Razorpay

---

## What this project demonstrates

- **JWT auth done properly** — short-lived access tokens (15 min) kept in memory on the
  frontend (never localStorage, to reduce XSS token-theft risk), paired with a long-lived
  refresh token in an `httpOnly` cookie that rotates on every use.
- **Role-based access control** — `student` vs `instructor`, enforced server-side via a
  FastAPI dependency, not just hidden in the UI.
- **Real payment verification** — the backend verifies the Razorpay signature server-side
  (`/payments/verify`) instead of trusting the frontend's "payment succeeded" callback,
  which is the difference between a toy checkout and a secure one. Includes idempotency
  handling so a webhook/retry firing twice doesn't double-process a payment.
- **Demo mode** — if you don't add real Razorpay keys, the app still works end-to-end
  using a `/payments/demo-complete` fallback, so you (or an interviewer) can click through
  the entire flow without needing a merchant account.

---

## Project structure

```
skillhub/
├── backend/
│   ├── app/
│   │   ├── core/        # config, JWT + password hashing
│   │   ├── db/          # SQLAlchemy engine/session
│   │   ├── models/      # User, Course, Enrollment, Payment
│   │   ├── schemas/     # Pydantic request/response models
│   │   ├── routers/     # auth, courses, payments
│   │   ├── deps.py      # get_current_user, require_instructor
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js         # auto-refresh interceptor
    │   ├── context/             # AuthContext, ToastContext
    │   ├── components/          # Navbar, CourseCard, PrivateRoute, Loader
    │   └── pages/                # Login, Register, Courses, CourseDetail,
    │                              # MyLearning, InstructorDashboard
    └── .env.example
```

---

## 1. Backend setup

### Install MySQL locally
Easiest via Docker:
```bash
docker run --name skillhub-mysql -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=skillhub -e MYSQL_USER=skillhub_user \
  -e MYSQL_PASSWORD=skillhub_pass -p 3306:3306 -d mysql:8
```

### Install dependencies & run
```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET_KEY, and (optionally) Razorpay test keys

uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive Swagger docs — tables are auto-created
on first run.

### Getting Razorpay test keys (optional — app works without them)
Sign up free at [dashboard.razorpay.com](https://dashboard.razorpay.com), switch to
**Test Mode**, and copy the Key ID / Key Secret into `.env`. Without them, checkout uses
the built-in demo-mode fallback.

---

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env    # points VITE_API_URL at your backend

npm run dev
```

Visit `http://localhost:5173`.

> ⚠️ **Use `localhost`, not `127.0.0.1`**, for both frontend and backend URLs — the
> backend's CORS config only allows the exact `FRONTEND_ORIGIN` string, so a mismatch
> between `localhost` and `127.0.0.1` will silently fail all API calls.

---

## 3. Try it out

1. Register two accounts — one as **instructor**, one as **student**.
2. As the instructor, go to **Instructor studio** and publish a course.
3. As the student, browse **Courses**, open one, and click **Enroll now**.
4. Check **My learning** as the student, and **View students** on the course as the instructor.

---

## Talking points for interviews

- *"Why httpOnly cookies for the refresh token instead of just localStorage for everything?"*
  → JS can't read httpOnly cookies, so an XSS payload can't steal the long-lived token —
  worst case it steals a 15-minute access token.
- *"How do you avoid double-charging on a payment retry?"* → `/payments/verify` checks
  `payment.status == "paid"` before processing and returns success idempotently if it's
  already been handled.
- *"How would you scale course listing?"* → Already paginated + filtered server-side
  (`page`, `limit`, `search`, `level` query params) rather than shipping the whole table
  to the client.
- *"What would you add for production?"* → Real Alembic migration history (currently
  using `create_all` for speed), Razorpay webhook endpoint as a second source of truth
  alongside the client-driven `/verify` call, rate limiting on `/auth/login`, and
  structured logging.

## Next steps to push further
- Add Alembic migrations (`alembic init alembic`) instead of `create_all`
- Add a Razorpay **webhook** endpoint so payment confirmation doesn't rely solely on the
  client calling back
- Add pytest coverage for the auth and payment-verification logic
- Deploy: Railway/Render (backend + MySQL) + Vercel (frontend)
