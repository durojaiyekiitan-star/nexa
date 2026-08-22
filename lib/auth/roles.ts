export type Role = "student" | "sponsor" | "organization";

/** Where to send someone if they land somewhere their role doesn't allow. */
export const ROLE_HOME: Record<Role, string> = {
  student: "/student/dashboard",
  sponsor: "/sponsor/dashboard",
  organization: "/organization",
};

/** Display label for the role badge in the nav bar. */
export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  sponsor: "Sponsor",
  organization: "Organization",
};
