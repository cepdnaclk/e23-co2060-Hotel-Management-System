import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { reasonLabels } from "./ReportStatus";
import "../styles/reports.css";

export default function EventReportForm({ event }) {
  const { user, isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("incorrect_information");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reportId, setReportId] = useState(null);
  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { data } = await api.post("/reports", { event_id: event.event_id, reason, details: details.trim() });
      setReportId(data.report.id); setDetails(""); setOpen(false);
    } catch (err) { setError(err.response?.data?.message || "Report could not be submitted. Please try again."); }
    finally { setBusy(false); }
  };
  return <section className="report-ui" aria-labelledby="report-event-title">
    <div className="report-card">
      <h2 id="report-event-title">Something wrong with this event?</h2>
      <p className="report-muted">Tell our team about incorrect details or a problem with this listing. Your report is shared with the review team.</p>
      {reportId ? <div role="status" className="report-alert report-success">Report R-{reportId} submitted. <Link to="/my-reports">Track it in My Reports</Link>.</div> : null}
      {!isLoggedIn ? <Link className="report-button secondary" to="/login" state={{ from: `/events/${event.slug}` }}>Log in to report an issue</Link>
        : user?.role !== "tourist" ? <p className="report-help">Use your tourist account to submit a report.</p>
        : !open ? <div className="report-actions"><button className="secondary" onClick={() => { setOpen(true); setError(""); }}>Report an issue</button><Link to="/my-reports">My Reports</Link></div>
        : <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <label htmlFor="report-reason">Reason</label>
            <select id="report-reason" value={reason} onChange={e => setReason(e.target.value)}>{Object.entries(reasonLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
            <label htmlFor="report-details">What happened?</label>
            <textarea id="report-details" value={details} onChange={e => setDetails(e.target.value)} minLength={10} maxLength={3000} required aria-describedby="report-details-help" placeholder="Explain the issue so our team can investigate." />
            <p id="report-details-help" className="report-muted">10–3000 characters. Do not include passwords or payment card details.</p>
            {error && <div role="alert" className="report-alert">{error} <Link to="/my-reports">My Reports</Link></div>}
            <div className="report-actions"><button type="submit">{busy ? "Submitting…" : "Submit report"}</button><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button></div>
          </fieldset>
        </form>}
    </div>
  </section>;
}
