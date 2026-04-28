// Per-user state — sync locks, rate limiting.
// Use this to prevent concurrent syncs for the same user from racing.

export class UserState {
  state: DurableObjectState;
  syncing = false;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/lock-sync') {
      if (this.syncing) {
        return Response.json({ acquired: false });
      }
      this.syncing = true;
      // Auto-release after 5 minutes to prevent stuck locks
      setTimeout(() => { this.syncing = false; }, 5 * 60 * 1000);
      return Response.json({ acquired: true });
    }

    if (url.pathname === '/unlock-sync') {
      this.syncing = false;
      return Response.json({ released: true });
    }

    return new Response('Not found', { status: 404 });
  }
}
