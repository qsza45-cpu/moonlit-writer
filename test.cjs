const {test}=require('node:test');const assert=require('node:assert/strict');const Timer=require('./timer.cjs');
test('pause excludes idle time and resume preserves remainder',()=>{let t=new Timer(60);t.start(1000);assert.equal(t.tick(11000),10);t.pause(21000);assert.equal(t.tick(100000),0);t.start(100000);assert.equal(t.tick(110000),10);assert.equal(t.remaining,30)});
test('delayed tick completes only once and clamps elapsed',()=>{let t=new Timer(5);t.start(0);assert.equal(t.tick(12000),5);assert.equal(t.remaining,0);assert.equal(t.tick(15000),0);assert.equal(t.running,false)});
test('reset replaces duration and stops timer',()=>{let t=new Timer();t.start(0);t.tick(12000);t.reset(300);assert.equal(t.remaining,300);assert.equal(t.running,false)});
