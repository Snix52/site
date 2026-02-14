import { prisma } from "@/lib/prisma";
import {
  isAssignableStaffRole,
  resolveRoleWithOwner,
  type DbStaffRole,
  type StaffRole,
} from "@/lib/admin-auth";

function normalizeDbRole(input: string | null | undefined): DbStaffRole {
  const role = (input || "").toUpperCase();
  if (isAssignableStaffRole(role)) return role;
  return "USER";
}

export async function resolveStaffRole(userId: string | null | undefined): Promise<StaffRole> {
  if (!userId) return "USER";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { staffRole: true },
  });

  return resolveRoleWithOwner(userId, normalizeDbRole(user?.staffRole));
}

export async function resolveStaffRolesForUsers(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, StaffRole>();
  if (ids.length === 0) return map;

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, staffRole: true },
  });

  const roleById = new Map<string, DbStaffRole>();
  for (const user of users) {
    roleById.set(user.id, normalizeDbRole(user.staffRole));
  }

  for (const id of ids) {
    map.set(id, resolveRoleWithOwner(id, roleById.get(id) || "USER"));
  }

  return map;
}

export async function persistStaffRoleAssignment(targetUserId: string, role: StaffRole) {
  if (role === "OWNER") {
    throw new Error("OWNER role cannot be assigned from UI");
  }
  if (!isAssignableStaffRole(role)) {
    throw new Error("Invalid staff role");
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { staffRole: role },
  });
}
