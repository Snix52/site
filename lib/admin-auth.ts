export type DbStaffRole = "USER" | "MODERATOR" | "ADMIN";
export type StaffRole = DbStaffRole | "OWNER";
export const ASSIGNABLE_STAFF_ROLES = ["USER", "MODERATOR", "ADMIN"] as const;

const LEGACY_OWNER_IDS = new Set(["user_38IQNX84WzWPGgn1wdzcOWogLaN"]);
const ROLE_WEIGHT: Record<StaffRole, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

function parseCsvIds(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getEnvValue(key: string) {
  if (typeof window === "undefined") {
    return process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
  }
  return process.env[`NEXT_PUBLIC_${key}`];
}

export function getOwnerIds() {
  return new Set([
    ...LEGACY_OWNER_IDS,
    ...parseCsvIds(getEnvValue("OWNER_IDS")),
  ]);
}

export function isOwnerId(userId: string | null | undefined) {
  if (!userId) return false;
  return getOwnerIds().has(userId);
}

export function resolveRoleWithOwner(userId: string | null | undefined, dbRole: DbStaffRole = "USER"): StaffRole {
  if (isOwnerId(userId)) return "OWNER";
  return dbRole;
}

export function hasAtLeastRole(role: StaffRole, required: StaffRole) {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[required];
}

export function pickHigherRole(a: StaffRole, b: StaffRole): StaffRole {
  return ROLE_WEIGHT[a] >= ROLE_WEIGHT[b] ? a : b;
}

export function isAssignableStaffRole(input: string): input is (typeof ASSIGNABLE_STAFF_ROLES)[number] {
  return ASSIGNABLE_STAFF_ROLES.includes(input as (typeof ASSIGNABLE_STAFF_ROLES)[number]);
}

export function canAccessAdminPanel(role: StaffRole) {
  return hasAtLeastRole(role, "MODERATOR");
}

export function canModerateComments(role: StaffRole) {
  return hasAtLeastRole(role, "MODERATOR");
}

export function canSendNotifications(role: StaffRole) {
  return hasAtLeastRole(role, "ADMIN");
}

export function canManageUsers(role: StaffRole) {
  return hasAtLeastRole(role, "ADMIN");
}

export function canManagePoints(role: StaffRole) {
  return hasAtLeastRole(role, "ADMIN");
}

export function canViewAuditLogs(role: StaffRole) {
  return hasAtLeastRole(role, "ADMIN");
}

export function canManageRoles(role: StaffRole) {
  return role === "OWNER";
}

export function canBanTarget(actorRole: StaffRole, targetRole: StaffRole) {
  if (!hasAtLeastRole(actorRole, "ADMIN")) return false;
  if (targetRole === "OWNER") return false;
  return ROLE_WEIGHT[actorRole] > ROLE_WEIGHT[targetRole];
}
