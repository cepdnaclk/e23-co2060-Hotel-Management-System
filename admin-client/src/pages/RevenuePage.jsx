import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

function RevenuePage() {
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");

  const loadReport = async () => {
    try {
      const res = await api.get("/admin/revenue");
      setReport(res.data.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load revenue report");
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const maxRevenue = useMemo(() => {
    const monthly = report?.monthly || [];
    return Math.max(...monthly.map((row) => Number(row.total_revenue || 0)), 1);
  }, [report]);

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Revenue</p>
          <h1>Revenue Chart</h1>
          <p>
            Shows income from registration fees and monthly subscription fees.
          </p>
        </div>

        <Link className="outline-link" to="/dashboard">
          Back to Dashboard
        </Link>
      </section>

      {message && <div className="alert-card">{message}</div>}

      <section className="admin-grid">
        <div className="admin-card">
          <span>Total Revenue</span>
          <strong>
            Rs. {Number(report?.totals?.total_revenue || 0).toLocaleString()}
          </strong>
        </div>

        <div className="admin-card">
          <span>Registration Revenue</span>
          <strong>
            Rs. {Number(report?.totals?.registration_revenue || 0).toLocaleString()}
          </strong>
        </div>

        <div className="admin-card">
          <span>Monthly Revenue</span>
          <strong>
            Rs. {Number(report?.totals?.monthly_revenue || 0).toLocaleString()}
          </strong>
        </div>

        <div className="admin-card">
          <span>Transactions</span>
          <strong>{report?.totals?.transaction_count || 0}</strong>
        </div>
      </section>

      <section className="table-card">
        <div className="table-head">
          <h2>Monthly Revenue Chart</h2>
        </div>

        <div className="chart-box">
          {(report?.monthly || []).map((row) => {
            const total = Number(row.total_revenue || 0);
            const width = Math.max((total / maxRevenue) * 100, 4);

            return (
              <div className="chart-row" key={row.month_label}>
                <span>{row.month_label}</span>

                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${width}%` }}>
                    Rs. {total.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}

          {(!report?.monthly || report.monthly.length === 0) && (
            <p>No revenue data yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default RevenuePage;