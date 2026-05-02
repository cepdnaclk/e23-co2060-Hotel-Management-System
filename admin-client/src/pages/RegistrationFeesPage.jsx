import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

function RegistrationFeesPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  const loadItems = async () => {
    try {
      const res = await api.get("/admin/registration-payments");
      setItems(res.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load registration payments");
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const markPayment = async (id, status) => {
    try {
      await api.put(`/admin/properties/${id}/payment`, {
        registration_payment_status: status,
      });

      setMessage(`Registration fee marked as ${status}`);
      loadItems();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update payment");
    }
  };

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    return item.registration_payment_status === filter;
  });

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Registration Fee</p>
          <h1>Registration Fee Paid & Pending</h1>
          <p>Control property registration fee status from one page.</p>
        </div>

        <Link className="outline-link" to="/dashboard">
          Back to Dashboard
        </Link>
      </section>

      {message && <div className="alert-card">{message}</div>}

      <section className="table-card">
        <div className="table-head">
          <h2>Registration Payments</h2>

          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Pending</option>
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
                <th>Status</th>
                <th>Paid At</th>
                <th>Public Visible</th>
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

                  <td>Rs. {Number(item.registration_fee || 0).toLocaleString()}</td>

                  <td>
                    <span
                      className={
                        item.registration_payment_status === "Paid"
                          ? "status paid"
                          : "status pending"
                      }
                    >
                      {item.registration_payment_status === "Paid" ? "Paid" : "Pending"}
                    </span>
                  </td>

                  <td>
                    {item.registration_paid_at
                      ? new Date(item.registration_paid_at).toLocaleDateString()
                      : "-"}
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

export default RegistrationFeesPage;