export const reportLabels = { submitted: "Submitted", under_review: "Under review", resolved: "Resolved", dismissed: "Dismissed" };
export const reasonLabels = { incorrect_information: "Incorrect information", cancelled_event: "Cancelled event", misleading_price: "Misleading price", inappropriate_content: "Inappropriate content", other: "Other issue" };
export const reportDate = value => value ? new Date(value).toLocaleString() : "—";
export default function ReportStatus({ status }) {
  return <span className={`report-badge ${status}`}>{reportLabels[status] || status}</span>;
}
export function ReportHistory({ history = [], admin = false }) {
  return <ol className="report-timeline" aria-label="Report history">{history.map(item => <li key={item.id}>
    <ReportStatus status={item.status} /><time>{reportDate(item.created_at)}</time>
    {item.response && <p className="report-copy">{item.response}</p>}
    {admin && item.visibility_action !== "unchanged" && <p className="report-help">Event action: {item.visibility_action}. {item.moderation_reason}</p>}
  </li>)}</ol>;
}
