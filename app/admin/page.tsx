import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import {
  Ban,
  BellRing,
  CheckCircle,
  Megaphone,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  canManageRoles,
  canAccessAdminPanel,
  canBanTarget,
  canManagePoints,
  canManageUsers,
  canModerateComments,
  canSendNotifications,
  canViewAuditLogs,
  type StaffRole,
} from "@/lib/admin-auth";
import { getRecentAdminAuditLogs } from "@/lib/admin-audit";
import { resolveStaffRole, resolveStaffRolesForUsers } from "@/lib/admin-auth-server";
const USERS_PAGE_SIZE = 30;
const COMMENTS_PAGE_SIZE = 20;

function toDisplayName(user: {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
}) {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (fullName) return fullName;
  return user.username || "Oyuncu";
}

function roleLabel(role: StaffRole) {
  if (role === "OWNER") return "OWNER";
  if (role === "ADMIN") return "ADMIN";
  if (role === "MODERATOR") return "MOD";
  return "USER";
}

function roleChipClass(role: StaffRole) {
  if (role === "OWNER") return "text-amber-200 bg-amber-500/15 border-amber-400/30";
  if (role === "ADMIN") return "text-cyan-200 bg-cyan-500/15 border-cyan-400/30";
  if (role === "MODERATOR") return "text-violet-200 bg-violet-500/15 border-violet-400/30";
  return "text-slate-300 bg-white/5 border-white/10";
}

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function parsePage(raw: string, fallback = 1) {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function buildAdminHref(input: { q: string; userPage: number; commentPage: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.userPage > 1) params.set("userPage", String(input.userPage));
  if (input.commentPage > 1) params.set("commentPage", String(input.commentPage));
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = (await searchParams) || {};
  const searchQuery = getSingleParam(params.q).trim().slice(0, 40);
  const rawUserPage = parsePage(getSingleParam(params.userPage), 1);
  const rawCommentPage = parsePage(getSingleParam(params.commentPage), 1);

  const viewer = await currentUser();
  const viewerRole = await resolveStaffRole(viewer?.id);

  if (!viewer || !canAccessAdminPanel(viewerRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-500 font-bold text-2xl flex-col gap-4">
        <Ban size={64} />
        <p>YETKISIZ GIRIS</p>
      </div>
    );
  }

  const userWhere = searchQuery
    ? {
        OR: [
          { id: { contains: searchQuery, mode: "insensitive" as const } },
          { username: { contains: searchQuery, mode: "insensitive" as const } },
          { firstName: { contains: searchQuery, mode: "insensitive" as const } },
          { lastName: { contains: searchQuery, mode: "insensitive" as const } },
          { email: { contains: searchQuery, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [totalUsers, totalPendingComments, recentAuditLogs, recentTransactions, rawActiveTeamPosts] = await Promise.all([
    prisma.user.count({ where: userWhere }),
    prisma.comment.count({ where: { isApproved: false } }),
    canViewAuditLogs(viewerRole) ? getRecentAdminAuditLogs(30) : Promise.resolve([]),
    prisma.pointTransaction.findMany({
      where: { NOT: { type: "ADMIN_AUDIT" } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.teamPost.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  const totalUserPages = Math.max(1, Math.ceil(totalUsers / USERS_PAGE_SIZE));
  const totalCommentPages = Math.max(1, Math.ceil(totalPendingComments / COMMENTS_PAGE_SIZE));
  const userPage = Math.min(rawUserPage, totalUserPages);
  const commentPage = Math.min(rawCommentPage, totalCommentPages);

  const [users, pendingComments] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { comments: true } } },
      skip: (userPage - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
    }),
    prisma.comment.findMany({
      where: { isApproved: false },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: (commentPage - 1) * COMMENTS_PAGE_SIZE,
      take: COMMENTS_PAGE_SIZE,
    }),
  ]);

  const userRoleMap = await resolveStaffRolesForUsers(users.map((u) => u.id));

  const teamPostIds = rawActiveTeamPosts.map((post) => post.id);

  const appCountByPost = new Map<string, { total: number; accepted: number }>();
  if (teamPostIds.length > 0) {
    const applications = await prisma.teamApplication.findMany({
      where: { teamPostId: { in: teamPostIds } },
      select: { teamPostId: true, status: true },
    });

    for (const app of applications) {
      const current = appCountByPost.get(app.teamPostId) || { total: 0, accepted: 0 };
      current.total += 1;
      if (app.status === "ACCEPTED") current.accepted += 1;
      appCountByPost.set(app.teamPostId, current);
    }
  }

  const activeTeamPosts = rawActiveTeamPosts.map((post) => {
    const counts = appCountByPost.get(post.id) || { total: 0, accepted: 0 };
    return {
      ...post,
      applicationCount: counts.total,
      acceptedCount: counts.accepted,
    };
  });

  const canManageUserState = canManageUsers(viewerRole);
  const canAdjustPoints = canManagePoints(viewerRole);
  const canNotify = canSendNotifications(viewerRole);
  const canModerate = canModerateComments(viewerRole);
  const canAssignRoles = canManageRoles(viewerRole);

  return (
    <div className="min-h-screen bg-[#050A14] text-slate-200 pt-32 px-6 pb-20 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <ShieldCheck className="text-[#00FFFF]" size={40} /> Control Center
            </h1>
            <p className="text-gray-400">Admin role: {roleLabel(viewerRole)}</p>
          </div>
          <div className="text-right">
            <span className="text-[#00FFFF] font-bold text-xl">{users.length}</span>{" "}
            <span className="text-xs text-gray-500 uppercase tracking-wider">Kullanici</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#0A1120] to-[#0f192e] border border-white/10 rounded-2xl p-6 mb-12 relative overflow-hidden group hover:border-[#00FFFF]/30 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Megaphone size={120} />
          </div>

          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <BellRing className="text-[#00FFFF]" /> Duyuru Istasyonu
            </h2>

            {canNotify ? (
              <form action="/api/admin/action" method="post" className="flex flex-col md:flex-row gap-4 items-end">
                <input type="hidden" name="actionType" value="SEND_GLOBAL_NOTIFICATION" />
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="text"
                    name="title"
                    placeholder="Baslik"
                    className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-white focus:border-[#00FFFF] outline-none"
                    maxLength={80}
                    required
                  />
                  <input
                    type="text"
                    name="message"
                    placeholder="Mesaj"
                    className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-white focus:border-[#00FFFF] outline-none"
                    maxLength={300}
                    required
                  />
                </div>

                <div className="w-full md:w-48 space-y-2">
                  <select name="type" className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-gray-300 focus:border-[#00FFFF] outline-none">
                    <option value="INFO">Bilgi</option>
                    <option value="GIFT">Hediye</option>
                    <option value="WARNING">Uyari</option>
                    <option value="SUCCESS">Basari</option>
                  </select>
                  <button className="w-full bg-[#00FFFF] hover:bg-white text-black font-bold py-2 rounded transition-all">
                    HERKESE GONDER
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-sm text-slate-400 border border-dashed border-white/15 rounded-lg px-4 py-3">
                Bu hesabin herkese duyuru gonderme yetkisi yok.
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0A1120] border border-white/10 rounded-2xl overflow-hidden mb-12">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <Users className="text-[#00FFFF]" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Kullanici Listesi</h2>
          </div>

          <div className="px-6 py-4 border-b border-white/5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <form action="/admin" method="get" className="flex items-center gap-2">
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="ID, kullanici adi, ad, email ara..."
                className="w-72 max-w-[70vw] bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-cyan-300 outline-none"
              />
              <button className="px-3 py-2 rounded bg-cyan-500/20 text-cyan-200 text-xs font-bold border border-cyan-400/30">
                Ara
              </button>
            </form>
            <p className="text-xs text-slate-400">
              Toplam {totalUsers} kayit | Sayfa {userPage}/{totalUserPages}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-black/20 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-4">Kullanici</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Rol Ata</th>
                  <th className="p-4">Puan</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4">Yorum</th>
                  <th className="p-4">Puan Islemi</th>
                  <th className="p-4">Ozel Mesaj</th>
                  <th className="p-4 text-right">Ban</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                  const memberRole = userRoleMap.get(u.id) || "USER";
                  const canBanThisUser = canManageUserState && canBanTarget(viewerRole, memberRole) && viewer.id !== u.id;
                  const canEditRole =
                    canAssignRoles && viewer.id !== u.id && memberRole !== "OWNER";

                  return (
                    <tr key={u.id} className={`hover:bg-white/5 transition-colors ${u.isBanned ? "bg-red-900/10" : ""}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Image src={u.imageUrl || "/file.svg"} alt="" width={40} height={40} className="rounded-full border border-white/10" />
                          <div>
                            <p className={`font-bold ${u.isBanned ? "text-red-400 line-through" : "text-white"}`}>
                              {toDisplayName(u)}
                            </p>
                            <p className="text-[10px] text-gray-600 font-mono tracking-tighter">ID: {u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[11px] border rounded px-2 py-1 font-bold ${roleChipClass(memberRole)}`}>
                          {roleLabel(memberRole)}
                        </span>
                      </td>
                      <td className="p-4">
                        {canEditRole ? (
                          <form action="/api/admin/action" method="post" className="flex items-center gap-2">
                            <input type="hidden" name="actionType" value="SET_STAFF_ROLE" />
                            <input type="hidden" name="userId" value={u.id} />
                            <select
                              name="role"
                              defaultValue={memberRole}
                              className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-cyan-300"
                            >
                              <option value="USER">USER</option>
                              <option value="MODERATOR">MODERATOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                            <button className="text-xs px-2 py-1 rounded border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/15">
                              Kaydet
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-[#00FFFF] font-bold text-lg">{u.currentPoints} SP</td>
                      <td className="p-4">
                        {u.isBanned ? (
                          <span className="text-red-500 font-bold text-xs bg-red-500/10 px-2 py-1 rounded">BANLI</span>
                        ) : (
                          <span className="text-emerald-500 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded">AKTIF</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-300">{u._count.comments}</td>
                      <td className="p-4">
                        {canAdjustPoints ? (
                          <form action="/api/admin/action" method="post" className="flex items-center gap-2">
                            <input type="hidden" name="actionType" value="MANAGE_POINTS" />
                            <input type="hidden" name="userId" value={u.id} />
                            <input
                              type="number"
                              name="amount"
                              placeholder="+/-"
                              className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-[#00FFFF] outline-none"
                            />
                            <button className="bg-[#00FFFF]/10 text-[#00FFFF] p-1.5 rounded hover:bg-[#00FFFF] hover:text-black transition-colors">
                              <Save size={14} />
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-slate-500">Yetki yok</span>
                        )}
                      </td>
                      <td className="p-4">
                        {canNotify ? (
                          <form action="/api/admin/action" method="post" className="flex items-center gap-2">
                            <input type="hidden" name="actionType" value="SEND_PRIVATE_NOTIFICATION" />
                            <input type="hidden" name="userId" value={u.id} />
                            <input
                              type="text"
                              name="message"
                              placeholder="Mesaj..."
                              className="w-36 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-blue-400 outline-none"
                              maxLength={300}
                            />
                            <button className="bg-blue-500/10 text-blue-400 p-1.5 rounded hover:bg-blue-500 hover:text-white transition-colors">
                              <Send size={14} />
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-slate-500">Yetki yok</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {canBanThisUser ? (
                          <form action="/api/admin/action" method="post">
                            <input type="hidden" name="actionType" value="TOGGLE_BAN" />
                            <input type="hidden" name="userId" value={u.id} />
                            <button className="text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded">
                              <Ban size={18} />
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between text-xs">
            <Link
              href={buildAdminHref({
                q: searchQuery,
                userPage: Math.max(1, userPage - 1),
                commentPage,
              })}
              className={`px-3 py-1.5 rounded border ${
                userPage === 1
                  ? "pointer-events-none opacity-40 border-white/10 text-slate-500"
                  : "border-white/20 text-slate-200 hover:border-cyan-300/40"
              }`}
            >
              Onceki
            </Link>
            <span className="text-slate-400">
              Kullanici sayfa {userPage}/{totalUserPages}
            </span>
            <Link
              href={buildAdminHref({
                q: searchQuery,
                userPage: Math.min(totalUserPages, userPage + 1),
                commentPage,
              })}
              className={`px-3 py-1.5 rounded border ${
                userPage === totalUserPages
                  ? "pointer-events-none opacity-40 border-white/10 text-slate-500"
                  : "border-white/20 text-slate-200 hover:border-cyan-300/40"
              }`}
            >
              Sonraki
            </Link>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          Onay Bekleyen Yorumlar
          <span className="text-sm font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{totalPendingComments}</span>
        </h2>

        <div className="space-y-4 mb-12">
          {pendingComments.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl text-gray-500">
              Onay bekleyen yorum yok.
            </div>
          ) : (
            pendingComments.map((comment) => (
              <div key={comment.id} className="bg-[#0A1120] border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between hover:border-white/20 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-[#00FFFF]">{comment.user?.username || "Isimsiz"}</span>
                    <span className="text-xs text-gray-500">| {comment.guideId}</span>
                  </div>
                  <p className="text-gray-300 bg-black/30 p-3 rounded-lg border border-white/5">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3">
                  <form action="/api/admin/action" method="post">
                    <input type="hidden" name="actionType" value="DELETE_COMMENT" />
                    <input type="hidden" name="commentId" value={comment.id} />
                    <button className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-bold text-sm hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2">
                      <Trash2 size={16} /> REDDET
                    </button>
                  </form>
                  <form action="/api/admin/action" method="post">
                    <input type="hidden" name="actionType" value="APPROVE_COMMENT" />
                    <input type="hidden" name="commentId" value={comment.id} />
                    <button className="px-6 py-2 bg-[#00FFFF] text-black rounded-lg font-bold text-sm hover:bg-white transition-colors flex items-center gap-2">
                      <CheckCircle size={16} /> ONAYLA
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mb-12 flex items-center justify-between text-xs">
          <Link
            href={buildAdminHref({
              q: searchQuery,
              userPage,
              commentPage: Math.max(1, commentPage - 1),
            })}
            className={`px-3 py-1.5 rounded border ${
              commentPage === 1
                ? "pointer-events-none opacity-40 border-white/10 text-slate-500"
                : "border-white/20 text-slate-200 hover:border-cyan-300/40"
            }`}
          >
            Onceki Yorumlar
          </Link>
          <span className="text-slate-400">
            Yorum sayfa {commentPage}/{totalCommentPages}
          </span>
          <Link
            href={buildAdminHref({
              q: searchQuery,
              userPage,
              commentPage: Math.min(totalCommentPages, commentPage + 1),
            })}
            className={`px-3 py-1.5 rounded border ${
              commentPage === totalCommentPages
                ? "pointer-events-none opacity-40 border-white/10 text-slate-500"
                : "border-white/20 text-slate-200 hover:border-cyan-300/40"
            }`}
          >
            Sonraki Yorumlar
          </Link>
        </div>

        <div className="bg-[#0A1120] border border-white/10 rounded-2xl overflow-hidden mb-12">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <Users className="text-[#00FFFF]" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Takim Ilan Moderasyonu</h2>
          </div>

          {activeTeamPosts.length === 0 ? (
            <div className="p-6 text-sm text-slate-400">Aktif ilan bulunmuyor.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {activeTeamPosts.map((post) => (
                <div key={post.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold">{post.title}</p>
                    <p className="text-xs text-slate-400">
                      Sahip: {toDisplayName(post.user)} | Basvuru: {post.applicationCount} | Kabul: {post.acceptedCount}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString("tr-TR")}</p>
                  </div>
                  {canModerate ? (
                    <form action="/api/admin/action" method="post">
                      <input type="hidden" name="actionType" value="CLOSE_TEAM_POST" />
                      <input type="hidden" name="postId" value={post.id} />
                      <button className="px-3 py-1.5 rounded border border-red-400/30 bg-red-500/10 text-red-300 text-xs font-bold hover:bg-red-500/20">
                        Ilani Kapat
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-slate-500">Yetki yok</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0A1120] border border-white/10 rounded-2xl overflow-hidden mb-12">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <Save className="text-[#00FFFF]" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Son Puan Hareketleri</h2>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-6 text-sm text-slate-400">Kayit bulunmuyor.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                  <div>
                    <p className="text-white font-semibold">{toDisplayName(tx.user)}</p>
                    <p className="text-xs text-slate-400">{tx.type}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} SP
                    </p>
                    <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString("tr-TR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {canViewAuditLogs(viewerRole) ? (
          <div className="bg-[#0A1120] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <ShieldCheck className="text-[#00FFFF]" />
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Admin Audit Log</h2>
            </div>

            {recentAuditLogs.length === 0 ? (
              <div className="p-6 text-sm text-slate-400">Log bulunamadi.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentAuditLogs.map((log) => (
                  <div key={log.id} className="px-6 py-4 text-sm flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white font-semibold">
                        {log.action} - <span className="text-cyan-300">{log.actorName}</span>
                      </p>
                      <span className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      role={log.actorRole}
                      {log.targetUserId ? ` | targetUser=${log.targetUserId}` : ""}
                      {log.targetCommentId ? ` | targetComment=${log.targetCommentId}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
