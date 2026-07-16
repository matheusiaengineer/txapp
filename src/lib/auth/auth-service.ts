export type Role = "passenger" | "driver" | "company" | "transporter" | "employee" | "admin";

export interface AuthResponse {
  user?: any;
  session?: any;
  role?: string;
  error?: string;
}

export async function signUp(
  email: string,
  password: string,
  role: Role,
  metadata?: Record<string, string>
): Promise<AuthResponse> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "signup", email, password, role, metadata }),
  });
  return res.json();
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "signin", email, password }),
  });
  return res.json();
}

const DASHBOARD_ROUTES: Record<string, string> = {
  passenger: "/dashboard/passenger",
  driver: "/dashboard/driver",
  company: "/dashboard/company",
  transporter: "/dashboard/transporter",
  employee: "/dashboard/employee",
  admin: "/admin",
};

export function getDashboardRoute(role: Role): string {
  return DASHBOARD_ROUTES[role] || "/dashboard/passenger";
}

export async function signOut() {
  await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "signout" }),
  });
}
