export function normalizeFriendPair(userIdA: string, userIdB: string) {
  if (userIdA < userIdB) {
    return { userAId: userIdA, userBId: userIdB };
  }

  return { userAId: userIdB, userBId: userIdA };
}
