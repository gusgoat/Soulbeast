'use strict';
for(const button of document.querySelectorAll('[data-trial-draw]'))button.addEventListener('click',()=>GachaCardTrial.draw(Number(button.dataset.trialDraw)));
document.querySelector('[data-trial-all]').addEventListener('click',()=>GachaCardTrial.draw(8,true));
document.querySelector('[data-trial-mixed]').addEventListener('click',()=>GachaCardTrial.drawMixed());
document.getElementById('trialSound').addEventListener('change',event=>GachaCardTrial.setSound(event.target.checked));
