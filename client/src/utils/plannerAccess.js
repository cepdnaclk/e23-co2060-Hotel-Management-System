// Match the existing server policy exactly; partners/admins are not guests.
export function canManageTripPlans(authReady, user) {
  return authReady && (!user || user.role === "tourist");
}

export function plannerAccessMessage(user) {
  return `Road routing and saved plans are available to tourists and guests. You are signed in as ${user?.role || "an unsupported account role"}. Sign out to continue as a guest, or sign in with a tourist account. Your local trip stays on this device.`;
}
