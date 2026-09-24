import { useEffect, useState } from "react";
import api from "../api/api";
import ReportStatus, { ReportHistory, reportLabels, reasonLabels, reportDate } from "../components/ReportStatus";
import "../styles/reports.css";

const transitions = { submitted: ["submitted", "under_review", "dismissed"], under_review: ["under_review", "resolved", "dismissed"], resolved: ["resolved", "under_review"], dismissed: ["dismissed", "under_review"] };
function ReviewReport({ id, onSaved, onBusy }) {
  const [report, setReport] = useState(null), [status, setStatus] = useState("under_review");
  const [response, setResponse] = useState(""), [action, setAction] = useState("unchanged"), [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [refresh, setRefresh] = useState(0);
  const [error, setError] = useState(""), [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    api.get(`/admin/reports/${id}`).then(({ data }) => {
      if (!active) return;
      setReport(data.report); setStatus(data.report.status); setResponse(data.report.admin_response || ""); setAction("unchanged"); setReason("");
    }).catch(err => { if (active) { setReport(null); setError(err.response?.data?.message || "Could not load this report."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, refresh]);
  const save = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); onBusy(true); setError(""); setMessage("");
    try {
      await api.patch(`/admin/reports/${id}`, { status, version: report.version, admin_response: response.trim(), visibility_action: action, moderation_reason: reason.trim() });
      setMessage("Report saved. The tourist can now see the updated status and response.");
      setRefresh(n => n + 1); onSaved();
    } catch (err) { setError(err.response?.data?.message || "Could not save this report. Please try again."); }
    finally { setBusy(false); onBusy(false); }
  };
  return <section className="report-card" aria-label="Review report">
    <div className="report-row"><h2>Review R-{id}</h2><button className="secondary" disabled={busy || loading} onClick={() => setRefresh(n => n + 1)}>Refresh report</button></div>
    {error && <div className="report-alert" role="alert">{error}</div>}
    {message && <div className="report-alert report-success" role="status">{message}</div>}
    {loading ? <p role="status">Loading report…</p> : report && <>
      <h3>{report.event_title}</h3><ReportStatus status={report.status} />
      <p className="report-muted">{report.reporter_name} · {reportDate(report.created_at)}<br />{reasonLabels[report.reason]}</p>
      <p className="report-copy">{report.details}</p>
      <p className="report-help">Event: {!report.event_id ? "Deleted; report history retained" : Number(report.event_hidden) ? "Hidden by admin moderation" : ["approved", "published"].includes(report.event_status) ? "Publicly visible" : `Not public (${report.event_status})`}.</p>
      <form onSubmit={save}><fieldset disabled={busy}>
        <label htmlFor="review-status">Report status</label><select id="review-status" value={status} onChange={e => setStatus(e.target.value)}>{transitions[report.status].map(key => <option key={key} value={key}>{reportLabels[key]}</option>)}</select>
        <p className="report-muted">Move a submitted report to Under review before resolving it. Reopen a closed report by choosing Under review.</p>
        <label htmlFor="review-response">Response to the tourist</label><textarea id="review-response" value={response} onChange={e => setResponse(e.target.value)} maxLength={3000} minLength={["resolved", "dismissed"].includes(status) ? 10 : undefined} required={["resolved", "dismissed"].includes(status)} placeholder="Explain what your team found or what happens next." />
        <label htmlFor="review-action">Event visibility</label><select id="review-action" disabled={!report.event_id} value={action} onChange={e => setAction(e.target.value)}><option value="unchanged">Keep current visibility</option><option value="hide">Hide event from tourists</option><option value="restore">Remove admin hold</option></select>
        <p className="report-muted">Closing a report does not automatically restore an event. Removing a hold only makes it public if it is approved.</p>
        {action !== "unchanged" && <><label htmlFor="review-reason">Reason for the event action</label><textarea id="review-reason" minLength={10} maxLength={1000} required value={reason} onChange={e => setReason(e.target.value)} /><p className="report-muted">Shared with the event partner and kept in the admin history.</p></>}
        <div className="report-actions"><button type="submit">{busy ? "Saving…" : "Save review"}</button></div>
      </fieldset></form>
      <h3>Report history</h3><ReportHistory history={report.history} admin />
    </>}
  </section>;
}
export default function ReportsPage() {
  const [reports, setReports] = useState([]), [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all"), [page, setPage] = useState(1), [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    api.get("/admin/reports", { params: { status, page } }).then(({ data }) => { if (active) { setReports(data.reports); setTotal(data.total); } })
      .catch(err => { if (active) { setReports([]); setError(err.response?.data?.message || "Could not load reports."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, page, refresh]);
  return <main className="report-ui report-page">
    <header className="report-hero"><span className="report-kicker">Moderation and support</span><h1>Event Reports</h1><p>Investigate issues, respond to tourists and keep event information reliable.</p></header>
    <div className="report-filters"><label>Report status<select disabled={busy} value={status} onChange={e => { setStatus(e.target.value); setPage(1); setSelected(null); }}><option value="all">All reports</option>{Object.entries(reportLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><button className="secondary" disabled={loading || busy} onClick={() => setRefresh(n => n + 1)}>Refresh list</button></div>
    {error && <div className="report-alert" role="alert">{error}</div>}
    <div className="report-split"><section aria-label="Report queue">
      {loading ? <div className="report-card" role="status">Loading reports…</div> : !error && !reports.length ? <div className="report-card report-empty"><h2>No reports in this view</h2><p>New tourist reports will appear here.</p></div> : reports.map(report => <article key={report.id} className={`report-card ${selected === report.id ? "report-selected" : ""}`}>
        <div className="report-row"><strong>R-{report.id}</strong><ReportStatus status={report.status} /></div><h3>{report.event_title}</h3><p className="report-muted">{reasonLabels[report.reason]}<br />{reportDate(report.created_at)}</p><button className="secondary" disabled={busy} onClick={() => setSelected(report.id)} aria-pressed={selected === report.id}>Review R-{report.id}</button>
      </article>)}
      {!loading && !error && <div className="report-row"><span>{total} reports · Page {page}</span><div className="report-actions"><button className="secondary" disabled={busy || page === 1} onClick={() => setPage(n => n - 1)}>Previous</button><button className="secondary" disabled={busy || page * 20 >= total} onClick={() => setPage(n => n + 1)}>Next</button></div></div>}
    </section>
    {selected ? <ReviewReport key={selected} id={selected} onBusy={setBusy} onSaved={() => setRefresh(n => n + 1)} /> : <div className="report-card report-empty"><h2>Select a report</h2><p>Review the details and history before taking action.</p></div>}
    </div>
  </main>;
}
