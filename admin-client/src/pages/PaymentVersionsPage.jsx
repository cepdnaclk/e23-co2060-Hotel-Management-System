import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

const emptyForm = {
  plan_key: "",
  plan_name: "",
  room_limit: 50,
  registration_fee: 0,
  monthly_fee: 0,
  description: "",
  is_active: true,
};

function PaymentVersionsPage() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const loadPlans = async () => {
    try {
      const res = await api.get("/admin/plans");
      setPlans(res.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load payment versions");
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const editPlan = (plan) => {
    setEditingId(plan.id);

    setForm({
      plan_key: plan.plan_key,
      plan_name: plan.plan_name,
      room_limit: plan.room_limit,
      registration_fee: plan.registration_fee,
      monthly_fee: plan.monthly_fee,
      description: plan.description || "",
      is_active: Boolean(plan.is_active),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const savePlan = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(`/admin/plans/${editingId}`, form);
        setMessage("Payment version updated successfully");
      } else {
        await api.post("/admin/plans", form);
        setMessage("Payment version created successfully");
      }

      resetForm();
      loadPlans();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save payment version");
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Payment Versions</p>
          <h1>Control Version Fees</h1>
          <p>
            Admin can edit Normal/Premium fees and add more versions with
            different room limits.
          </p>
        </div>

        <Link className="outline-link" to="/dashboard">
          Back to Dashboard
        </Link>
      </section>

      {message && <div className="alert-card">{message}</div>}

      <section className="form-card">
        <h2>{editingId ? "Edit Version" : "Add New Version"}</h2>

        <form onSubmit={savePlan} className="admin-form-grid">
          <label>
            Version Key
            <input
              name="plan_key"
              value={form.plan_key}
              onChange={handleChange}
              placeholder="example: business"
              disabled={Boolean(editingId)}
              required
            />
          </label>

          <label>
            Version Name
            <input
              name="plan_name"
              value={form.plan_name}
              onChange={handleChange}
              placeholder="Business Version"
              required
            />
          </label>

          <label>
            Room Limit
            <input
              type="number"
              name="room_limit"
              value={form.room_limit}
              onChange={handleChange}
              min="1"
              required
            />
          </label>

          <label>
            Registration Fee
            <input
              type="number"
              name="registration_fee"
              value={form.registration_fee}
              onChange={handleChange}
              min="0"
              required
            />
          </label>

          <label>
            Monthly Fee
            <input
              type="number"
              name="monthly_fee"
              value={form.monthly_fee}
              onChange={handleChange}
              min="0"
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Explain what this version includes"
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Active version
          </label>

          <div className="action-row">
            <button type="submit">
              {editingId ? "Update Version" : "Create Version"}
            </button>

            {editingId && (
              <button type="button" className="danger-btn small" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="table-card">
        <div className="table-head">
          <h2>Existing Versions</h2>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>Name</th>
                <th>Rooms</th>
                <th>Registration Fee</th>
                <th>Monthly Fee</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td>{plan.plan_key}</td>

                  <td>
                    <strong>{plan.plan_name}</strong>
                    <br />
                    <small>{plan.description}</small>
                  </td>

                  <td>{plan.room_limit}</td>
                  <td>Rs. {Number(plan.registration_fee || 0).toLocaleString()}</td>
                  <td>Rs. {Number(plan.monthly_fee || 0).toLocaleString()}</td>
                  <td>{plan.is_active ? "Yes" : "No"}</td>

                  <td>
                    <button onClick={() => editPlan(plan)}>Edit</button>
                  </td>
                </tr>
              ))}

              {plans.length === 0 && (
                <tr>
                  <td colSpan="7">No payment versions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default PaymentVersionsPage;