// Cuts one strike out of the CC0 chime, mono 16-bit 44.1 kHz, ~1 s with a fade, normalized.
const fs=require("fs");
const [src,out]=process.argv.slice(2);
const b=fs.readFileSync(src);let i=12,fmt,data;
while(i<b.length-8){const id=b.toString("ascii",i,i+4),n=b.readUInt32LE(i+4);if(id==="fmt ")fmt={ch:b.readUInt16LE(i+10),rate:b.readUInt32LE(i+12),bits:b.readUInt16LE(i+22)};if(id==="data"){data={off:i+8,len:Math.min(n,b.length-i-8)};break;}i+=8+n+(n&1);}
if(fmt.ch!==1||fmt.bits!==16)throw new Error("expected mono 16-bit");
const fr=data.len/2,x=new Float32Array(fr);for(let k=0;k<fr;k++)x[k]=b.readInt16LE(data.off+2*k)/32768;
let pk=0,pi=0;x.forEach((v,k)=>{if(Math.abs(v)>pk){pk=Math.abs(v);pi=k}});
// onset: last quiet point (under 10% of peak) before the peak
let st=pi;while(st>0&&Math.abs(x[st])>pk*0.1)st--;st=Math.max(0,st-Math.round(fmt.rate*0.003));
const len=Math.min(fr-st,Math.round(fmt.rate*1.0)),fade=Math.round(fmt.rate*0.25);
const gain=0.85/pk,o=Buffer.alloc(44+len*2);
o.write("RIFF",0);o.writeUInt32LE(36+len*2,4);o.write("WAVE",8);o.write("fmt ",12);o.writeUInt32LE(16,16);o.writeUInt16LE(1,20);o.writeUInt16LE(1,22);o.writeUInt32LE(fmt.rate,24);o.writeUInt32LE(fmt.rate*2,28);o.writeUInt16LE(2,32);o.writeUInt16LE(16,34);o.write("data",36);o.writeUInt32LE(len*2,40);
for(let k=0;k<len;k++){let v=x[st+k]*gain;if(k<64)v*=k/64;if(k>len-fade)v*=(len-k)/fade;o.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(v*32767))),44+2*k);}
fs.writeFileSync(out,o);console.log("start",(st/fmt.rate).toFixed(3)+"s","length",(len/fmt.rate).toFixed(2)+"s","gain",gain.toFixed(2));
