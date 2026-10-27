class Timer{
 constructor(seconds=1500){this.duration=seconds;this.remaining=seconds;this.running=false;this.last=0}
 start(now){this.last=now;this.running=true}
 tick(now){if(!this.running)return 0;const elapsed=Math.max(0,(now-this.last)/1000);this.last=now;const used=Math.min(elapsed,this.remaining);this.remaining=Math.max(0,this.remaining-used);if(this.remaining===0)this.running=false;return used}
 pause(now){const used=this.tick(now);this.running=false;return used}
 reset(seconds=this.duration){this.duration=seconds;this.remaining=seconds;this.running=false}
}
if(typeof module!=='undefined')module.exports=Timer;else window.Timer=Timer;
