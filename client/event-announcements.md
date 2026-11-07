# Activity announcements

`event-announcements.mjs` owns presentation in the outer page. Embedded HUD and
menu frames do not mount a second notice. Country and town walking pages use a
full dialog while idle; visible menus, maps, NPC dialogs, social screens, and all
dungeon/lobby pages use a compact banner. Details open only on an explicit tap
while busy. Returning to walking expands unread notices. Closing acknowledges
the current phase. Pending notices survive same-tab navigation, scoped to the
online walk owner, character code and environment.

`kingdom-boss-feed.mjs` reads confirmed events from the account function's
lightweight status endpoint with the current game login. It pauses in background tabs. The endpoint
spawns at most one shared boss per due window, only after the first status or
activity request reaches the server. It reports expiry using server time. The
browser cannot spawn, advance, or extend a round through the announcement API.

```js
window.SoulbeastAnnouncements.publish({
  id: 'server-event-id',
  status: 'active', // active | defeated | expired
  end: 1794052800000, // server activity deadline, milliseconds since epoch
  country: 'green', // blue | green | red
  name: 'กิเลน',
  level: 55,
  location: 'ชื่อสถานที่จากกิจกรรม',
  winner: '' // defeated events may include the final attacker
});
```

Alternatively dispatch `soulbeast-event-announcement` with that object as detail
in the outer page. Do not expose this as a cross-origin message receiver.
Send terminal status even if the viewer missed the spawn. Newer phases supersede
older ones; older rounds cannot replace the latest round. `serverManaged` waits
for the endpoint to confirm expiry. Do not describe victory rewards until the
server confirms them.

Walking input pauses while a full notice is visible. Country auto-travel stops;
closing the notice requires the player to resume movement. Notification rendering
uses activity DOM changes. The feed makes short status requests only while the
tab is visible; it does not open a second WebSocket.
