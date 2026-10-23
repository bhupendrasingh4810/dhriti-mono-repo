import { Icon } from "@/components/shared/icons/icon";

export type OrganizationPlan = "Free" | "Standard" | "Premium" | "Enterprise";

export type AddOrganizationForm = {
  name: string;
  plan: OrganizationPlan;
  seats: string;
  email: string;
};

export type AddOrganizationErrors = {
  name?: string;
  email?: string;
  seats?: string;
};

type AddOrganizationDrawerProps = {
  form: AddOrganizationForm;
  errors: AddOrganizationErrors;
  onFormChange: (form: AddOrganizationForm) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function AddOrganizationDrawer({ form, errors, onFormChange, onClose, onSubmit }: AddOrganizationDrawerProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          width: 520,
          maxWidth: "100%",
          height: "100%",
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Add Organization</h2>
          <button
            type="button"
            aria-label="Close add organization drawer"
            title="Close"
            onClick={onClose}
            style={{ border: "none", backgroundColor: "transparent", cursor: "pointer", color: "#475569", padding: 2 }}
          >
            <Icon name="close" />
          </button>
        </div>
        <Field label="Organization Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(event) => onFormChange({ ...form, name: event.target.value })}
            placeholder="Acme Corporation"
            style={inputStyle(errors.name)}
          />
        </Field>
        <Field label="Admin Email" required error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(event) => onFormChange({ ...form, email: event.target.value })}
            placeholder="admin@company.com"
            style={inputStyle(errors.email)}
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>
              Plan <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              value={form.plan}
              onChange={(event) => onFormChange({ ...form, plan: event.target.value as OrganizationPlan })}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
                backgroundColor: "white",
              }}
            >
              {(["Free", "Standard", "Premium", "Enterprise"] as OrganizationPlan[]).map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>
              Seats <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="number"
              value={form.seats}
              onChange={(event) => onFormChange({ ...form, seats: event.target.value })}
              placeholder="100"
              style={inputStyle(errors.seats)}
            />
            {errors.seats && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>{errors.seats}</p>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={cancelButtonStyle}>
            Cancel
          </button>
          <button
            onClick={onSubmit}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#036c5f",
              color: "white",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Create Organization
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
      </label>
      {children}
      {error && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 };
const cancelButtonStyle = {
  padding: "9px 18px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  backgroundColor: "white",
  cursor: "pointer",
  fontSize: 13,
  color: "#475569",
  fontWeight: 500,
};
const inputStyle = (hasError?: string) =>
  ({
    width: "100%",
    padding: "9px 12px",
    border: `1px solid ${hasError ? "#dc2626" : "#e2e8f0"}`,
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  }) as const;
