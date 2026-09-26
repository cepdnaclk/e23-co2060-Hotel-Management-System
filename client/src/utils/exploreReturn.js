// A return ticket belongs to one Explore -> detail navigation, not a session.
// Keeping it in memory deliberately prevents restoration after a refresh.
export function createExploreReturnStore() {
  let ticket = null;
  return {
    save(sourceKey, detailPath, snapshot) {
      ticket = { sourceKey, detailPath, snapshot, detailKey: null };
    },
    stateForDetail(location) {
      return ticket?.detailPath === location.pathname
        ? { exploreReturnKey: ticket.sourceKey }
        : null;
    },
    resolve(previous, location, navigationType) {
      if (!ticket || location.pathname !== "/explore" ||
          previous?.key !== ticket.detailKey ||
          previous?.pathname !== ticket.detailPath) return null;
      const back = navigationType === "POP" && location.key === ticket.sourceKey;
      const returnLink = navigationType === "PUSH" &&
        location.state?.exploreReturnKey === ticket.sourceKey;
      return back || returnLink ? ticket.snapshot : null;
    },
    commit(previous, location) {
      if (!ticket) return;
      if (previous?.key === ticket.sourceKey && previous.pathname === "/explore" &&
          location.pathname === ticket.detailPath) {
        ticket.detailKey = location.key;
      } else if (location.key !== ticket.detailKey) {
        ticket = null;
      }
    },
  };
}

export const exploreReturn = createExploreReturnStore();
