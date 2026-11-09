#!/bin/bash
cd "$(dirname "$0")"
{
  cat src/head.html
  echo '<style>'; cat src/style.css; echo '</style>'
  echo '<div id="app"></div><div id="modal"></div>'
  echo '<script>'; cat src/data.js src/foundation15.js src/progression16.js src/ageing17.js src/training18.js src/evaluation19.js src/abilities20.js src/world21.js src/sim.js src/career.js src/engine2.js src/quali2.js src/dev2.js src/story.js src/ui1.js src/ui4.js src/minigames.js src/ui5.js src/ui6.js src/ui3.js src/mg3.js src/cardata.js src/pit6.js src/calib.js src/radio6.js src/mgr7.js src/news7.js src/drv10.js src/con12.js src/mkt12.js src/fin12.js src/obj12.js src/rep12.js src/spon12.js src/tm12.js src/sit12.js src/fac12.js src/fnl13.js src/th13.js src/ver13.js src/team11.js src/start9.js src/flags.js src/home8.js src/onb14.js src/hub14.js src/hub16.js src/strat14.js src/con14.js src/snd14.js src/jr14.js src/market22.js src/career23.js src/junior24.js src/content25.js src/season26.js src/driver27.js src/team28.js; echo '</script>'
} > index.html
wc -c index.html
