const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
let W, H, t = 0, yaw = 0, speed = 0.25, cast = false, tension = 0, weight = 0, caught = 0;
let particles = Array.from({length:90}, () => ({x:Math.random(), y:Math.random(), s:Math.random()*2+1, drift:Math.random()}));
const keys = {};
function resize(){ W=canvas.width=innerWidth*devicePixelRatio; H=canvas.height=innerHeight*devicePixelRatio; canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px'; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); W=innerWidth;H=innerHeight; }
addEventListener('resize',resize); resize();
function setMessage(text){ $('message').textContent=text; $('journalText').textContent=text; }
function sky(){
  const grad=ctx.createLinearGradient(0,0,0,H*.62); grad.addColorStop(0,'#547d91');grad.addColorStop(.45,'#9ac1bc');grad.addColorStop(1,'#d2c58f');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H*.7);
  // distant islands
  ctx.fillStyle='#315b59'; ctx.beginPath(); ctx.moveTo(0,H*.45); for(let x=0;x<=W;x+=70) ctx.lineTo(x,H*.4+Math.sin(x*.008+yaw)*30+Math.sin(x*.023)*16); ctx.lineTo(W,H*.58);ctx.lineTo(0,H*.58);ctx.fill();
  // water perspective bands
  const water=ctx.createLinearGradient(0,H*.48,0,H);water.addColorStop(0,'#356f73');water.addColorStop(1,'#123c47');ctx.fillStyle=water;ctx.fillRect(0,H*.48,W,H*.52);
  ctx.globalAlpha=.23; for(let y=H*.52;y<H;y+=19){ctx.strokeStyle='#a7d0c2';ctx.lineWidth=1;ctx.beginPath();for(let x=0;x<W;x+=20)ctx.lineTo(x,y+Math.sin(x*.02+t+y)*3);ctx.stroke();} ctx.globalAlpha=1;
  // sun
  ctx.fillStyle='#f6d58b';ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(W*.76,H*.2,42,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
}
function boat(){
  // bow
  ctx.save();ctx.translate(W*.5,H*.79);ctx.fillStyle='#734a36';ctx.beginPath();ctx.moveTo(-190,5);ctx.lineTo(190,5);ctx.lineTo(90,74);ctx.lineTo(0,90);ctx.lineTo(-90,74);ctx.closePath();ctx.fill();
  ctx.fillStyle='#b8714b';ctx.beginPath();ctx.moveTo(-150,12);ctx.lineTo(150,12);ctx.lineTo(78,48);ctx.lineTo(-78,48);ctx.closePath();ctx.fill();
  ctx.fillStyle='#4e342b';ctx.fillRect(-55,-6,110,26);ctx.fillStyle='#c08b5d';ctx.fillRect(-42,-5,84,9);ctx.restore();
}
function rain(){ for(const p of particles){p.y+=.004*p.s;if(p.y>1)p.y=0;p.x+=Math.sin(t*.01+p.drift)*.0003;ctx.strokeStyle=`rgba(220,239,226,${.09+p.s*.025})`;ctx.lineWidth=p.s*.45;ctx.beginPath();ctx.moveTo(p.x*W,p.y*H*.7);ctx.lineTo(p.x*W-.5,p.y*H*.7+p.s*7);ctx.stroke();} }
function animate(){ t++; sky(); boat(); rain();
  // bobber and ring when cast
  if(cast){ const bx=W*.52+Math.sin(t*.04)*18, by=H*.59+Math.sin(t*.08)*4;ctx.strokeStyle='#b6ddd0aa';ctx.beginPath();ctx.ellipse(bx,by+5,30+Math.sin(t*.05)*4,5,0,0,7);ctx.stroke();ctx.fillStyle=tension>70?'#d95f46':'#e8bd68';ctx.beginPath();ctx.arc(bx,by,5,0,7);ctx.fill(); }
  requestAnimationFrame(animate);
}
animate();
function castLine(){ if(cast){ setMessage('I let the line rest. The lake keeps its secrets for another minute.'); cast=false; $('fishStatus').textContent='LINE DRY'; return; } cast=true;tension=8;setMessage('I cast beyond the wake. The lure settles, and every ripple feels like a question.');$('fishStatus').textContent='WAITING'; }
function reel(){ if(!cast){setMessage('I thumb the reel, but my line is still tucked away.');return;} if(Math.random()<.28 || tension>84){ weight=+(Math.random()*4+1).toFixed(1);caught+=weight;tension=0;cast=false;$('catchCount').textContent=caught.toFixed(1)+' kg';$('fishStatus').textContent='FISH ON';setMessage(`I feel the rod load up. I guide a ${weight} kg silver trout over the gunwale!`);return;} tension=Math.max(0,tension-16);setMessage('I reel slowly, keeping the line singing but never tight enough to snap.'); }
function throttle(){speed=Math.min(1,speed+.12);setMessage('I push the throttle. Spray beads on my sleeves as the boat noses toward deeper water.');}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space'){e.preventDefault();castLine()} if(e.key.toLowerCase()==='r')reel();if(e.key.toLowerCase()==='w')throttle();});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
$('castBtn').onclick=castLine;$('reelBtn').onclick=reel;$('throttleBtn').onclick=throttle;$('lookBtn').onclick=()=>{yaw+=.4;setMessage('I turn my shoulders and scan the horizon. A flock of gulls marks a hidden shoal.');};
setInterval(()=>{let mins=360+Math.floor(t/50);$('time').textContent=String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0');$('depth').textContent=(12.4+speed*8+Math.sin(t*.02)*.4).toFixed(1)+' m';if(cast){tension=Math.min(100,tension+(Math.random()<.12?18:0));$('tensionBar').style.width=tension+'%';if(tension>75){$('fishStatus').textContent='BITE!';setMessage('I feel a hard tug. I keep my wrist low and get ready to reel.');}}},500);
