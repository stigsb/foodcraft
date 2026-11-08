const fs=require('fs'),path=require('path');const d=__dirname+'/';const out=path.resolve(__dirname,'../../dist/modellbenk')+'/';
const js=fs.readFileSync(out+'data.js','utf8')+['app1.js','app2.js','app3.js','app4.js','app5.js'].map(f=>fs.readFileSync(d+f,'utf8')).join('\n');
fs.writeFileSync(out+'check.js',js);
const html=fs.readFileSync(d+'head.html','utf8')+fs.readFileSync(d+'body.html','utf8')+'\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n'+js+'</script>\n';
if(/<\/script/i.test(js))throw 'bad';
fs.writeFileSync(out+'modellbenk.html',html);console.log('size',html.length);
