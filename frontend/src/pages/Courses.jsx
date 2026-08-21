import { useEffect, useState } from "react";
import { api } from "../api/axios";
import CourseCard from "../components/CourseCard";
import Loader from "../components/Loader";

const LEVELS = ["", "Beginner", "Intermediate", "Advanced"];

export default function Courses() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const limit = 9;

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api
        .get("/courses", { params: { page, limit, search, level } })
        .then((res) => setData(res.data))
        .finally(() => setLoading(false));
    }, 300); // debounce search typing
    return () => clearTimeout(t);
  }, [page, search, level]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Find your next skill</h1>
        <p className="text-ink/55 mt-1">Practical, project-based courses taught by working engineers.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          className="input-field sm:max-w-xs"
          placeholder="Search courses…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className="flex gap-2 flex-wrap">
          {LEVELS.map((l) => (
            <button
              key={l || "all"}
              onClick={() => { setLevel(l); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                level === l ? "bg-ink text-white" : "bg-white border border-violet-100 text-ink/60 hover:border-violet-300"
              }`}
            >
              {l || "All levels"}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <Loader label="Fetching courses" />
      ) : data?.items?.length ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                className="btn-secondary !px-4 !py-2 text-sm disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span className="text-sm text-ink/60 px-2">Page {page} of {totalPages}</span>
              <button
                className="btn-secondary !px-4 !py-2 text-sm disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold">No courses match that search</p>
          <p className="text-ink/50 text-sm mt-1">Try a different keyword or clear the level filter.</p>
        </div>
      )}
    </div>
  );
}
