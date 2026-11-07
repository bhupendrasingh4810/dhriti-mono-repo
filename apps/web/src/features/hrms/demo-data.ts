import type { HRMSInitialData } from "./components/ui-primitives";

export const hrmsDemoData: HRMSInitialData = {
  currentUser: { name: "Neha Mehta", roles: ["employee", "manager", "hr", "platform-admin"] },
  organizations: [{ id: "acme-technologies", name: "Acme Technologies" }],
  employees: [
    { id: "employee-1", name: "Ananya Sharma", code: "DHR-1042", role: "Senior Product Designer", department: "Product & Design", location: "Bengaluru", type: "Full-time", status: "active" },
    { id: "employee-2", name: "Rohan Kapoor", code: "DHR-1038", role: "Engineering Manager", department: "Engineering", location: "Hyderabad", type: "Full-time", status: "active" },
    { id: "employee-3", name: "Neha Mehta", code: "DHR-1021", role: "People Partner", department: "People", location: "Mumbai", type: "Full-time", status: "on-leave" },
  ],
};
