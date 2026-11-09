(function (scope) {
 'use strict';
 const entrances = {
  blue: {x: 2244, y: 3483},
  green: {x: 4960, y: 8477},
  red: {x: 4400, y: 7549},
 };
 function site(country) {
  if (!Object.hasOwn(entrances, country)) throw Error('Unknown colosseum country');
  return {
   ...entrances[country],
   id: country + '-colosseum',
   anchor: country + '-capital',
   type: 'colosseum',
   art: 'colosseum',
   name: 'โคลอสเซียม',
   description: 'สนามประลองของผู้ผนึก · โหมดทีมและเอาตัวรอด',
  };
 }
 const api = {site};
 scope.WalkColosseum = api;
 if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
