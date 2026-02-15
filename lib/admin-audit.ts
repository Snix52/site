import { prisma } from "@/lib/prisma";
import type { StaffRole } from "@/lib/admin-auth";
import { Prisma } from "@prisma/client";

export type AdminAuditAction =
  | "SEND_GLOBAL_NOTIFICATION"
  | "SEND_PRIVATE_NOTIFICATION"
  | "SET_STAFF_ROLE"
  | "TOGGLE_BAN"
  | "MANAGE_POINTS"
  | "APPROVE_COMMENT"
  | "DELETE_COMMENT"
  | "RESOLVE_PROFILE_REPORT"
  | "CLOSE_TEAM_POST";

type WriteAdminAuditInput = {
  actorId: string;
  actorRole: StaffRole;
  action: AdminAuditAction;
  targetUserId?: string | null;
  targetCommentId?: string | null;
  details?: Prisma.InputJsonValue;
};

export type AdminAuditLogItem = {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
  action: string;
  targetUserId: string | null;
  targetCommentId: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
};

function toActorName(user: { username: string | null; firstName: string | null; lastName: string | null }) {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (fullName) return fullName;
  return user.username || "Unknown";
}

function toDetailsRecord(details: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) return null;
  return details as Record<string, unknown>;
}

export async function writeAdminAuditLog(input: WriteAdminAuditInput) {
  try {
    await prisma.adminActionLog.create({
      data: {
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: input.action,
        targetUserId: input.targetUserId || null,
        targetCommentId: input.targetCommentId || null,
        details: input.details ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error("[ADMIN_AUDIT_WRITE_ERROR]", error);
  }
}

export async function getRecentAdminAuditLogs(limit = 25): Promise<AdminAuditLogItem[]> {
  const rows = await prisma.adminActionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    actorId: row.actor.id,
    actorName: toActorName(row.actor),
    actorRole: row.actorRole as StaffRole,
    action: row.action,
    targetUserId: row.targetUserId || null,
    targetCommentId: row.targetCommentId || null,
    details: toDetailsRecord(row.details),
    createdAt: row.createdAt,
  }));
}
