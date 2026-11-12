FROM denoland/deno:2.9.5

WORKDIR /app
COPY tools/colosseum/*.mjs ./tools/colosseum/
COPY content/beast-names.js ./content/beast-names.js
COPY tools/hemant-walk-demo/war-engine.generated.js ./tools/hemant-walk-demo/
COPY tools/labyrinth-demo/traps.js ./tools/labyrinth-demo/

USER deno
CMD ["run", "--allow-env=PORT,SB_COLOSSEUM_SITE_ORIGIN,SB_COLOSSEUM_ACCOUNT_URL,SB_COLOSSEUM_ACCOUNT_KEY,SB_COLOSSEUM_RANK_KEY", "--allow-net=0.0.0.0,zycmmtvubzyxduxqpuzl.supabase.co:443", "tools/colosseum/server.mjs", "--public"]
