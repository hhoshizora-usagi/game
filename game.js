
(function(){
var TARGETS=[
  {emoji:'🎯',pts:10,size:65,color:'#FF80AB'},
  {emoji:'⭐',pts:25,size:55,color:'#FFD740'},
  {emoji:'🌸',pts:10,size:60,color:'#F8BBD0'},
  {emoji:'🍎',pts:15,size:55,color:'#EF5350'},
  {emoji:'💖',pts:10,size:58,color:'#FF80AB'},
  {emoji:'🎵',pts:10,size:55,color:'#7C4DFF'},
  {emoji:'🌈',pts:20,size:52,color:'#00BCD4'},
  {emoji:'🍰',pts:15,size:58,color:'#FFB74D'}
];
var BOMB={emoji:'💣',pts:-20,size:55,color:'#555'};

var duration=10,score=0,taps=0,combo=0,maxCombo=0,timer,startTime,best,fever=false;
try{best=parseInt(localStorage.getItem('spt2'))||0;}catch(e){best=0;}

/* --- Speed & Size settings --- */
var speedMode='normal';
var sizeMode='normal';
var oniFlashTimer=null;

function getSpeedMult(){
  if(speedMode==='slow') return 1.5;
  if(speedMode==='fast') return 0.55;
  if(speedMode==='oni') return 0.45;
  return 1;
}
function getSizeMult(){
  if(sizeMode==='large') return 1.3;
  if(sizeMode==='small') return 0.65;
  return 1;
}
function getScoreBonus(){
  var b=1;
  if(speedMode==='fast') b*=1.3;
  else if(speedMode==='oni') b*=1.5;
  else if(speedMode==='slow') b*=0.85;
  if(speedMode!=='oni'){
    if(sizeMode==='small') b*=1.2;
    else if(sizeMode==='large') b*=0.9;
  }
  return b;
}
/* --- end settings --- */

function getEl(id){return document.getElementById(id);}
function showScreen(id){var s=document.querySelectorAll('.screen');for(var i=0;i<s.length;i++)s[i].classList.remove('active');getEl(id).classList.add('active');}

function spawnTarget(){
  var zone=getEl('zone');
  var zw=zone.offsetWidth||300,zh=zone.offsetHeight||380;
  var roll=Math.random();
  var t;

  /* Oni mode: bomb rate doubles */
  var bombRate=(speedMode==='oni')? 0.25 : 0.12;
  if(roll<bombRate)t={emoji:BOMB.emoji,pts:BOMB.pts,size:BOMB.size,color:BOMB.color};
  else if(roll<bombRate+0.13)t={emoji:'⭐',pts:30,size:50,color:'#FFD740'};
  else{var base=TARGETS[Math.floor(Math.random()*TARGETS.length)];t={emoji:base.emoji,pts:base.pts,size:base.size,color:base.color};}

  /* Size: oni speed → random 30%~120%, otherwise use sizeMode */
  var sz;
  if(speedMode==='oni'){
    sz=Math.round(t.size*(0.3+Math.random()*0.9));
  }else{
    sz=Math.round(t.size*getSizeMult());
  }
  if(sz<24)sz=24;

  var x=10+Math.random()*(zw-sz-20);
  var y=10+Math.random()*(zh-sz-20);

  var el=document.createElement('div');
  el.className='target';
  el.style.left=x+'px';
  el.style.top=y+'px';
  el.style.width=sz+'px';
  el.style.height=sz+'px';
  el.style.background=t.color;
  el.style.fontSize=Math.floor(sz*0.55)+'px';
  el.textContent=t.emoji;

  /* Apply score bonus */
  var adjustedPts=t.pts<0? t.pts : Math.round(t.pts*getScoreBonus());
  el.setAttribute('data-pts',adjustedPts);

  el.addEventListener('click',function(e){
    e.stopPropagation();
    var pts=parseInt(this.getAttribute('data-pts'));
    taps++;

    if(pts<0){
      combo=0;fever=false;
      score+=pts;if(score<0)score=0;
      var eff=document.createElement('div');
      eff.className='effect';eff.textContent='💥-'+Math.abs(pts);
      eff.style.left=x+'px';eff.style.top=y+'px';eff.style.color='#FF5252';eff.style.fontSize='20px';
      zone.appendChild(eff);
      setTimeout(function(){if(eff.parentNode)eff.remove();},600);
    }else{
      combo++;if(combo>maxCombo)maxCombo=combo;
      var mult=1+Math.floor(combo/5)*0.5;
      if(combo>=10){fever=true;mult+=1;}
      var gained=Math.floor(pts*mult);
      score+=gained;

      var eff=document.createElement('div');
      eff.className='effect';
      eff.textContent='+'+gained+(combo>=5?' 🔥':'');
      eff.style.left=x+'px';eff.style.top=y+'px';
      eff.style.color=t.color==='#FFD740'?'#FF6F00':t.color;
      eff.style.fontSize='18px';
      zone.appendChild(eff);
      setTimeout(function(){if(eff.parentNode)eff.remove();},600);
    }

    getEl('score').textContent=score;
    if(combo>=5)getEl('comboDisplay').textContent='🔥 '+combo+' COMBO!'+(fever?' FEVER!🔥🔥':'');
    else getEl('comboDisplay').textContent='';

    el.remove();
    spawnTarget();
    if(Math.random()<0.2)spawnTarget();
  });

  zone.appendChild(el);

  /* Apply speed multiplier to auto-remove timing */
  var baseTime=2500-Math.min(1500,score*2);
  var autoRemoveTime=Math.round(baseTime*getSpeedMult());
  if(autoRemoveTime<350)autoRemoveTime=350;
  setTimeout(function(){
    if(el.parentNode){el.remove();combo=0;getEl('comboDisplay').textContent='';spawnTarget();}
  },autoRemoveTime);
}

function startOniEffects(){
  var overlay=getEl('oniOverlay');
  overlay.classList.add('active');
  var flash=true;
  oniFlashTimer=setInterval(function(){
    overlay.style.opacity=flash?'0.12':'0.04';
    flash=!flash;
  },400);
}
function stopOniEffects(){
  var overlay=getEl('oniOverlay');
  overlay.classList.remove('active');
  overlay.style.opacity='0';
  if(oniFlashTimer){clearInterval(oniFlashTimer);oniFlashTimer=null;}
}

function startGame(){
  GameShell.beginRound();
  score=0;taps=0;combo=0;maxCombo=0;fever=false;
  getEl('score').textContent='0';
  getEl('timeLeft').textContent=duration;
  getEl('comboDisplay').textContent='';
  showScreen('playScreen');
  var zone=getEl('zone');zone.innerHTML='';
  stopOniEffects();

  var cd=document.createElement('div');
  cd.style.cssText='font-size:60px;text-align:center;padding-top:40%';
  cd.textContent='3';
  zone.appendChild(cd);
  var c=3;
  var cdt=setInterval(function(){
    c--;
    if(c>0){cd.textContent=c;}
    else{clearInterval(cdt);cd.remove();actualStart();}
  },700);
}

function actualStart(){
  if(speedMode==='oni') startOniEffects();
  startTime=GameShell.now();
  spawnTarget();spawnTarget();
  timer=setInterval(function(){
    var el=Math.floor((GameShell.now()-startTime)/1000);
    var left=duration-el;if(left<0)left=0;
    getEl('timeLeft').textContent=left;
    if(left<=0){clearInterval(timer);endGame();}
  },200);
}

function endGame(){
  stopOniEffects();
  var zone=getEl('zone');
  while(zone.firstChild)zone.removeChild(zone.firstChild);
  if(score>best){best=score;try{localStorage.setItem('spt2',best);}catch(e){}}
  var tps=(taps/duration).toFixed(1);

  showScreen('resultScreen');
  if(score>=duration*20){
    getEl('rTitle').textContent='🔥 すご〜い！';getEl('rTitle').style.color='#FF6F00';
    getEl('rEmoji').textContent='🎯🔥';
  }else if(score>=duration*10){
    getEl('rTitle').textContent='✨ いいかんじ！';getEl('rTitle').style.color='#FF9800';
    getEl('rEmoji').textContent='🎯✨';
  }else{
    getEl('rTitle').textContent='💪 がんばろ〜！';getEl('rTitle').style.color='#999';
    getEl('rEmoji').textContent='🎯💪';
  }
  getEl('rScore').textContent=score+'てん！';
  getEl('rTaps').textContent=taps+'タップ ('+tps+'/秒) ｜ 最大コンボ: '+maxCombo;
  getEl('rBest').textContent='🏆 ベスト: '+best+'てん';
}

// Miss tap on zone background
getEl('zone').addEventListener('click',function(){combo=0;fever=false;getEl('comboDisplay').textContent='';});

// Duration buttons
var mBtns=[getEl('m10'),getEl('m20'),getEl('m30')];
var durs=[10,20,30];
for(var i=0;i<3;i++){(function(idx){
  mBtns[idx].addEventListener('click',function(){
    for(var j=0;j<3;j++)mBtns[j].classList.remove('active');
    mBtns[idx].classList.add('active');duration=durs[idx];
  });
})(i);}

// Speed buttons (including oni)
var spdBtns=document.querySelectorAll('.opt-spd');
for(var i=0;i<spdBtns.length;i++){(function(btn){
  btn.addEventListener('click',function(){
    for(var j=0;j<spdBtns.length;j++)spdBtns[j].classList.remove('active');
    btn.classList.add('active');
    speedMode=btn.getAttribute('data-val');
    /* When oni speed is selected, hide size options (size becomes random) */
    var sizeLabel=getEl('sizeLabelRow');
    var sizeRow=getEl('sizeBtnRow');
    if(speedMode==='oni'){
      sizeLabel.style.display='none';
      sizeRow.style.display='none';
    }else{
      sizeLabel.style.display='';
      sizeRow.style.display='';
    }
  });
})(spdBtns[i]);}

// Size buttons
var szBtns=document.querySelectorAll('.opt-sz');
for(var i=0;i<szBtns.length;i++){(function(btn){
  btn.addEventListener('click',function(){
    for(var j=0;j<szBtns.length;j++)szBtns[j].classList.remove('active');
    btn.classList.add('active');
    sizeMode=btn.getAttribute('data-val');
  });
})(szBtns[i]);}

getEl('startBtn').addEventListener('click',startGame);
getEl('retryBtn').addEventListener('click',startGame);
getEl('backBtn').addEventListener('click',function(){showScreen('titleScreen');});
})();

(function(){function decorate(){document.querySelectorAll(".num,.pad,.cbtn,.box,.big-btn,.target").forEach(el=>{if(el.hasAttribute("tabindex")||el.tagName==="BUTTON")return;el.tabIndex=0;el.setAttribute("role","button");el.addEventListener("keydown",e=>{if((e.code==="Enter"||e.code==="Space")&&!e.repeat){e.preventDefault();el.click();}});});}decorate();new MutationObserver(decorate).observe(document.getElementById("g"),{subtree:true,childList:true});})();
