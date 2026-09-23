import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import ReportStatus, { ReportHistory, reportLabels, reasonLabels, reportDate } from "../components/ReportStatus";
import "../styles/reports.css";

function ReportDetail({ id }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    api.get(`/reports/${id}`).then(({ data }) => { if (active) { setReport(data.report); setError(""); } })
      .catch(err => { if (active) setError(err.response?.data?.message || "Could not load report history."); });
    return () => { active = false; };
  }, [id, retry]);
  if (error) return <div className="report-alert" role="alert">{error} <button className="secondary" onClick={() => setRetry(n => n + 1)}>Try again</button></div>;
  if (!report) return <p role="status">Loading history…</p>;
  return <div><h3>Your report</h3><p className="report-copy">{report.details}</p><h3>Progress and responses</h3><ReportHistory history={report.history} /></div>;
}
export default function MyReportsPage() {
  const { user, isLoggedIn } = useAuth();
  const [reports, setReports] = useState([]), [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all"), [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0), [selected, setSelected] = useState(null);
  useEffect(() => {
    if (!isLoggedIn || user?.role !== "tourist") return;
    let active = true;
    setLoading(true); setError(""); setSelected(null);
    api.get("/reports", { params: { status, page } }).then(({ data }) => {
      if (active) { setReports(data.reports); setTotal(data.total); }
    }).catch(err => { if (active) { setReports([]); setError(err.response?.data?.message || "Could not load your reports."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isLoggedIn, user?.id, user?.role, status, page, refresh]);
  return <main className="report-ui report-page">
    <header className="report-hero"><span className="report-kicker">Tourist support</span><h1>My Reports</h1><p>Track your event reports and read responses from our team.</p></header>
    {!isLoggedIn ? <div className="report-card"><p>Log in to see your reports.</p><Link to="/login" state={{ from: "/my-reports" }}>Log in</Link></div>
      : user?.role !== "tourist" ? <div className="report-card">Reports are available to tourist accounts.</div>
      : <>
        <div className="report-filters"><label>Report status<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="all">All reports</option>{Object.entries(reportLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className="secondary" disabled={loading} onClick={() => setRefresh(n => n + 1)}>Refresh reports</button></div>
        {error ? <div role="alert" className="report-alert">{error}</div> : loading ? <div className="report-card" role="status">Loading your reports…</div> : !reports.length ? <div className="report-card report-empty"><h2>No reports here yet</h2><p>Use “Report an issue” on an event’s details page if something needs our attention.</p><Link to="/events">Browse events</Link></div>
          : reports.map(report => <article className="report-card" key={report.id}>
            <div className="report-row"><strong>R-{report.id} · {reasonLabels[report.reason]}</strong><ReportStatus status={report.status} /></div>
            <h2>{report.event_title}</h2><p className="report-muted">Submitted {reportDate(report.created_at)} · Updated {reportDate(report.updated_at)}</p>
            {report.admin_response && <p className="report-help report-copy"><strong>Latest response:</strong><br />{report.admin_response}</p>}
            <div className="report-actions"><button className="secondary" aria-expanded={selected === report.id} onClick={() => setSelected(selected === report.id ? null : report.id)}>{selected === report.id ? "Close history" : "View history"}</button>
              {report.event_slug && !Number(report.event_hidden) && ["approved", "published"].includes(report.event_status) ? <Link to={`/events/${report.event_slug}`}>View event</Link> : <span className="report-muted">Event currently unavailable</span>}</div>
            {selected === report.id && <ReportDetail key={report.id} id={report.id} />}
          </article>)}
        {!loading && !error && <div className="report-row"><span>{total} report{total === 1 ? "" : "s"} · Page {page}</span><div className="report-actions"><button className="secondary" disabled={page === 1} onClick={() => setPage(n => n - 1)}>Previous</button><button className="secondary" disabled={page * 20 >= total} onClick={() => setPage(n => n + 1)}>Next</button></div></div>}
      </>}
  </main>;
}
