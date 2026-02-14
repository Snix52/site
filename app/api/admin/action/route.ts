import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import {
  canBanTarget,
  canManagePoints,
  canManageRoles,
  canManageUsers,
  canModerateComments,
  canSendNotifications,
  isAssignableStaffRole,
  type StaffRole,
} from "@/lib/admin-auth";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { persistStaffRoleAssignment, resolveStaffRole } from "@/lib/admin-auth-server";

const NOTIFICATION_TYPES = new Set(["INFO", "GIFT", "WARNING", "SUCCESS"]);

type AdminActionType =
  | "SEND_GLOBAL_NOTIFICATION"
  | "SEND_PRIVATE_NOTIFICATION"
  | "SET_STAFF_ROLE"
  | "TOGGLE_BAN"
  | "MANAGE_POINTS"
  | "APPROVE_COMMENT"
  | "DELETE_COMMENT"
  | "CLOSE_TEAM_POST";

function safeTrim(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseAmount(raw: FormDataEntryValue | null) {
  const parsed = typeof raw === "string" ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function adminRedirect(request: Request) {
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}

function isActionType(input: string): input is AdminActionType {
  return (
    input === "SEND_GLOBAL_NOTIFICATION" ||
    input === "SEND_PRIVATE_NOTIFICATION" ||
    input === "SET_STAFF_ROLE" ||
    input === "TOGGLE_BAN" ||
    input === "MANAGE_POINTS" ||
    input === "APPROVE_COMMENT" ||
    input === "DELETE_COMMENT" ||
    input === "CLOSE_TEAM_POST"
  );
}

function assertRole(role: StaffRole, min: StaffRole) {
  const rank: Record<StaffRole, number> = {
    USER: 0,
    MODERATOR: 1,
    ADMIN: 2,
    OWNER: 3,
  };
  return rank[role] >= rank[min];
}

export async function POST(request: Request) {
  try {
    const actor = await currentUser();
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorRole = await resolveStaffRole(actor.id);
    const form = await request.formData();
    const action = safeTrim(form.get("actionType")).toUpperCase();
    if (!isActionType(action)) {
      return adminRedirect(request);
    }

    if (action === "SEND_GLOBAL_NOTIFICATION") {
      if (!canSendNotifications(actorRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const title = safeTrim(form.get("title"));
      const message = safeTrim(form.get("message"));
      const type = safeTrim(form.get("type")).toUpperCase() || "INFO";

      if (!title || !message || title.length > 80 || message.length > 300) return adminRedirect(request);
      if (!NOTIFICATION_TYPES.has(type)) return adminRedirect(request);

      const allUsers = await prisma.user.findMany({
        where: { isBanned: false },
        select: { id: true },
      });

      if (allUsers.length > 0) {
        await prisma.notification.createMany({
          data: allUsers.map((user) => ({
            userId: user.id,
            title,
            message,
            type,
            isRead: false,
          })),
        });

        await writeAdminAuditLog({
          actorId: actor.id,
          actorRole,
          action: "SEND_GLOBAL_NOTIFICATION",
          details: { recipientCount: allUsers.length, title, type },
        });
      }

      return adminRedirect(request);
    }

    if (action === "SEND_PRIVATE_NOTIFICATION") {
      if (!canSendNotifications(actorRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const targetUserId = safeTrim(form.get("userId"));
      const message = safeTrim(form.get("message"));
      if (!targetUserId || !message || message.length > 300) return adminRedirect(request);

      const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
      if (!target) return adminRedirect(request);

      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: "Yonetici Mesaji",
          message,
          type: "INFO",
        },
      });

      await writeAdminAuditLog({
        actorId: actor.id,
        actorRole,
        action: "SEND_PRIVATE_NOTIFICATION",
        targetUserId,
      });

      return adminRedirect(request);
    }

    if (action === "SET_STAFF_ROLE") {
      if (!canManageRoles(actorRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const targetUserId = safeTrim(form.get("userId"));
      const role = safeTrim(form.get("role")).toUpperCase();
      if (!targetUserId || !isAssignableStaffRole(role)) return adminRedirect(request);
      if (targetUserId === actor.id) return adminRedirect(request);

      const targetCurrentRole = await resolveStaffRole(targetUserId);
      if (targetCurrentRole === "OWNER") return adminRedirect(request);

      await persistStaffRoleAssignment(targetUserId, role);

      await writeAdminAuditLog({
        actorId: actor.id,
        actorRole,
        action: "SET_STAFF_ROLE",
        targetUserId,
        details: { role },
      });

      return adminRedirect(request);
    }

    if (action === "TOGGLE_BAN") {
      if (!canManageUsers(actorRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const targetUserId = safeTrim(form.get("userId"));
      if (!targetUserId || targetUserId === actor.id) return adminRedirect(request);

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, isBanned: true },
      });
      if (!targetUser) return adminRedirect(request);

      const targetRole = await resolveStaffRole(targetUser.id);
      if (!canBanTarget(actorRole, targetRole)) return adminRedirect(request);

      const nextStatus = !targetUser.isBanned;
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { isBanned: nextStatus },
      });

      await writeAdminAuditLog({
        actorId: actor.id,
        actorRole,
        action: "TOGGLE_BAN",
        targetUserId: targetUser.id,
        details: { banned: nextStatus },
      });

      return adminRedirect(request);
    }

    if (action === "MANAGE_POINTS") {
      if (!canManagePoints(actorRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const targetUserId = safeTrim(form.get("userId"));
      const amount = parseAmount(form.get("amount"));
      if (!targetUserId || !Number.isFinite(amount) || amount === 0) return adminRedirect(request);
      if (amount > 5000 || amount < -5000) return adminRedirect(request);

      const targetRole = await resolveStaffRole(targetUserId);
      if (!canBanTarget(actorRole, targetRole) && targetRole !== "USER") return adminRedirect(request);

      const result = await prisma.$transaction(async (tx) => {
        const target = await tx.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, currentPoints: true },
        });
        if (!target) return { appliedDelta: 0 };

        const appliedDelta = Math.max(-target.currentPoints, amount);
        if (appliedDelta === 0) return { appliedDelta: 0 };

        await tx.user.update({
          where: { id: target.id },
          data: {
            currentPoints: { increment: appliedDelta },
            totalEarned: appliedDelta > 0 ? { increment: appliedDelta } : undefined,
          },
        });

        await tx.pointTransaction.create({
          data: {
            userId: target.id,
            amount: appliedDelta,
            type: "ADMIN_ADJUSTMENT",
            description: `Admin adjust by ${actor.id}`,
          },
        });

        return { appliedDelta };
      });

      if (result.appliedDelta !== 0) {
        await writeAdminAuditLog({
          actorId: actor.id,
          actorRole,
          action: "MANAGE_POINTS",
          targetUserId,
          details: { amount: result.appliedDelta },
        });
      }

      return adminRedirect(request);
    }

    if (action === "APPROVE_COMMENT") {
      if (!canModerateComments(actorRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const commentId = safeTrim(form.get("commentId"));
      if (!commentId) return adminRedirect(request);

      await prisma.comment.updateMany({
        where: { id: commentId, isApproved: false },
        data: { isApproved: true },
      });

      await writeAdminAuditLog({
        actorId: actor.id,
        actorRole,
        action: "APPROVE_COMMENT",
        targetCommentId: commentId,
      });

      return adminRedirect(request);
    }

    if (action === "DELETE_COMMENT") {
      if (!canModerateComments(actorRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const commentId = safeTrim(form.get("commentId"));
      if (!commentId) return adminRedirect(request);

      await prisma.comment.deleteMany({ where: { id: commentId } });

      await writeAdminAuditLog({
        actorId: actor.id,
        actorRole,
        action: "DELETE_COMMENT",
        targetCommentId: commentId,
      });

      return adminRedirect(request);
    }

    if (action === "CLOSE_TEAM_POST") {
      if (!assertRole(actorRole, "MODERATOR")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const postId = safeTrim(form.get("postId"));
      if (!postId) return adminRedirect(request);

      const post = await prisma.teamPost.findUnique({
        where: { id: postId },
        select: { id: true, userId: true, isActive: true },
      });

      if (!post || !post.isActive) return adminRedirect(request);

      await prisma.teamPost.update({
        where: { id: post.id },
        data: { isActive: false },
      });

      await writeAdminAuditLog({
        actorId: actor.id,
        actorRole,
        action: "CLOSE_TEAM_POST",
        targetUserId: post.userId,
        details: { postId: post.id },
      });

      return adminRedirect(request);
    }

    return adminRedirect(request);
  } catch (error) {
    console.error("[ADMIN_ACTION_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
