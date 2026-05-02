import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

function MonthlyFeesPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  const loadItems = async () => {
    try {
      const res = await api.get("/admin/monthly-payments");
      setItems(res.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load monthly payments");
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const markPayment = async (id, status) => {
    try {
      await api.put(`/admin/properties/${id}/payment`, {
        monthly_payment_status: status,
      });

      setMessage(`Monthly fee marked as ${status}`);
      loadItems();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update payment");
    }
  };

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "Pending") return item.monthly_admin_status === "Pending";
    return item.monthly_admin_status === filter;
  });

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Monthly Fee</p>
          <h1>Monthly Fee Paid & Pending</h1>
          <p>
            First month after registration is free. After due date, unpaid
            properties are hidden from public pages.
          </p>
        </div>

        <Link className="outline-link" to="/dashboard">
          Back to Dashboard
        </Link>
      </section>

      {message && <div className="alert-card">{message}</div>}

      <section className="table-card">
        <div className="table-head">
          <h2>Monthly Payments</h2>

          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Free period active">Free period active</option>
          </select>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Partner</th>
                <th>Version</th>
                <th>Amount</th>
                <th>Monthly Status</th>
                <th>Cycle</th>
                <th>Visible</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <br />
                    <small>{item.city}</small>
                  </td>

                  <td>
                    {item.partner_name}
                    <br />
                    <small>{item.partner_email}</small>
                  </td>

                  <td>{item.plan_type}</td>

                  <td>Rs. {Number(item.monthly_charge || 0).toLocaleString()}</td>

                  <td>
                    <span
                      className={
                        item.monthly_admin_status === "Pending"
                          ? "status pending"
                          : "status paid"
                      }
                    >
                      {item.monthly_admin_status}
                    </span>
                  </td>

                  <td>
                    <small>
                      {item.monthly_cycle_start
                        ? new Date(item.monthly_cycle_start).toLocaleDateString()
                        : "-"}{" "}
                      to{" "}
                      {item.monthly_cycle_end
                        ? new Date(item.monthly_cycle_end).toLocaleDateString()
                        : "-"}
                    </small>
                  </td>

                  <td>{item.public_visible ? "Yes" : "No"}</td>

                  <td className="action-row">
                    <button onClick={() => markPayment(item.id, "Paid")}>
                      Mark Paid
                    </button>

                    <button
                      className="danger-btn small"
                      onClick={() => markPayment(item.id, "Unpaid")}
                    >
                      Mark Pending
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default MonthlyFeesPage;