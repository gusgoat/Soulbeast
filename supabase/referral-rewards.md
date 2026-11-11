The live coupon shop creates one invite code per verified account. The first
active character to open the panel is the reward recipient. If that character
is deleted, rewards already credited stay there; future rewards go to an
active character on the same account. Changing character never resets the cap.

Install order: confirm the live character level projection from
`walk-profile-sync.sql` is installed and Supabase Cron is enabled, then apply
`referral-rewards.sql` as the database owner before publishing the frontend.
The migration installs a named job running once per minute. It credits one
pending inviter per transaction, using the same revision check and append-only
coupon ledger as the game. Test world progress does not qualify.

After deploying to a test project, use separate verified accounts. Open the
coupon shop on the inviter, follow the copied link to register the other
account, then save a character at level 10. Confirm the status shows one reward
and reopen the recipient's coupon shop to check the available balance. Repeat
with a second character on the same account and confirm the balance does not
increase again.
