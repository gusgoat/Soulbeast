# Kingdom boss rollout

Apply `schema.sql`, then apply `install-engine.py` to the current, unmodified
account-function source and deploy `soulbeast-accounts` with its existing Auth
configuration. The status endpoint requires a verified login and returns only
the schedule and the latest game event; entering a fight also checks character ownership. The
test and live environments have separate state and configuration.

Keep the live row disabled until the frontend is deployed. To enable the test
schedule in live use:

```sql
update public.sb_kingdom_boss_config set enabled=true, testing=true where environment='live';
```

Bangkok hours: 10, 12, 14, 16, 18, 20, 22. Each round ends one hour later.
After validation, set `testing=false` to keep only 10:00 and 22:00. An active
round keeps its original deadline when switching schedules. `enabled=false`
stops new joins and hides the feed. There is no automatic changeover date.

Players find the boss from the country map marker. Walking into range starts
an auto battle through the standard combat renderer. Health and the last hit
are server-authoritative. Winning letters are delivered through the existing
mailbox; repeated loads and saves do not credit them again.
