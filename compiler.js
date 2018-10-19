/* r3www 2018 - GPITTAU PHREDA */
"use strict";

/*------COMPILER------*/

// 0-imm 1-code 2-data 3-reserve 4-bytes 5-qwords
var modo=0;

var includes=[];  // nombre del include

var dicc=[];    // nombre palabra
var dicca=[];   // direccion de entrada
var dicci=[];   // info
var dicclocal;

var level=0;
var stacka=[];

var boot=-1;
var nro=0;

var memc=0;
var memcode=new Int32Array(0xffff); // 256kb

var memd=0;
var meminidata=0;
//var memdata=new ArrayBuffer(0xfffffff); // 256Mb
var memdata=new ArrayBuffer(0xffffff); // 16Mb
var mem=new DataView(memdata);

var r3echo="";
var r3domx=-1;
var r3showx=-1;

var xm=0;
var ym=0;
var bm=0;

var ke=0;
var kc=0;

var r3machine=[
"nop",":","::","#","##","|","^",  // 6
"lit","lit","lit","lit","str",    // 11
"call","var","dcode","ddata",   // 15
";","jmp","jmpw","[","]"
];
var r3base=[
";","(",")","[","]","EX","0?","1?","+?","-?",       // 10
"<?",">?","=?",">=?","<=?","<>?","AN?","NA?","BTW?",    // 19
"DUP","DROP","OVER","PICK2","PICK3","PICK4","SWAP","NIP", // 27
"ROT","2DUP","2DROP","3DROP","4DROP","2OVER","2SWAP",   // 34
">R","R>","R@",                       // 37
"AND","OR","XOR","NOT","NEG",               // 42
"+","-","*","/","*/",                   // 47
"/MOD","MOD","ABS","SQRT","CLZ",              // 52
"<<",">>","0>>","*>>","<</",                // 57
"@","C@","Q@","@+","C@+","Q@+",               // 65
"!","C!","Q!","!+","C!+","Q!+",               // 71
"+!","C+!","Q+!",                       // 74
">A","A>","A@","A!","A+","A@+","A!+",           // 81 32bits
">B","B>","B@","B!","B+","B@+","B!+",           // 88 64bits
"MOVE","MOVE>","FILL",                    // 91
"CMOVE","CMOVE>","CFILL",                 // 94
"DMOVE","DMOVE>","DFILL",                 // 97
"SYSCALL","SYSMEM",                     // 99
0 ];

function isNro(tok) {
  var sign;
  if (tok[0]=="-") { tok=tok.slice(1);sign=-1; } else { sign=1;}
  nro=tok.match(/^\d+$/); // integer
  if (nro!=null) { nro=parseInt(tok)*sign;return true; }
  nro=tok.match(/^\d+.\d+$/); // fixed.point
  if (nro!=null) {
    n=tok.split(".");
    var n1=parseInt(n[0]),v=1;
    for (var i=0;i<n[1].length;i++) { v*=10; }
    n2=0x10000*parseInt(n[1])/v;
    nro=((n1<<16)|(n2&0xffff))*sign;// falta
    return true;
    }
  switch (tok[0]) {
  case "$": // $hex
    tok=tok.split('.').join('0');   // convert . or 0
    tok=tok.slice(1);nro=tok.match(/^[0-9A-F]+$/);
    if (nro!=null) { nro=parseInt(tok,16)*sign;return true; };
    break;
  case "%":  // %bin %..1.1 allow
    tok=tok.split('.').join('0');   // convert . or 0
    tok=tok.slice(1);nro=tok.match(/^[0-1]+$/);
    if (nro!=null) { nro=parseInt(tok,2)*sign;return true; };
    break;
  }
  return false;
}

function isBas(tok) {
  nro=r3base.indexOf(tok);
  if (nro<0) { return false; }
  return true;
  }

function isWord(tok) { var i=dicc.length;
  while (i--) { if (dicc[i]===tok && ((dicci[i]&1)==1 || i>=dicclocal)) { break; } }
  return i;
  }

function codetok(nro) {
  if (modo==0 && boot==-1) { boot=memc; }
  memcode[memc++]=nro;
  }

function datanro(nro) {
  switch(modo){
    case 2:mem.setInt32(memd,nro);memd+=4;break;
    case 3:for(var i=0;i<nro;i++) { mem.setInt8(memd++,0); };break;
    case 4:mem.setInt8(memd,nro);memd+=1;break;
    case 5:mem.setInt64(memd,nro);memd+=8;break;
    }
  }

function datasave(str) {  var r=memd;
  for(var i=0;i<str.length;i++)
    { if (str.charCodeAt(i)==34) {i++;} mem.setInt8(memd++,str.charCodeAt(i)); }
  mem.setInt8(memd++,0);
  return r;
  }

function datastr(n) { var s="";
  while (mem.getInt8(n)!=0) { s+=String.fromCharCode(mem.getInt8(n++)); }
  return s;
  }


function compilaDATA(name) { var ex=0;
  if (name[1]=="#") { ex=1; }
  dicc.push(name.slice(ex+1,name.length).toUpperCase());
  dicca.push(memd);
  dicci.push(ex+0x10);  // 0x10 es dato
  modo=2;
  }

function dataMAC(n){
  if (n==44) {modo=3;} // * reserva bytes
  if (n==1) {modo=4;} // (  bytes
  if (n==2) {modo=2;} // )
  if (n==3) {modo=5;} // [  qwords
  if (n==4) {modo=2;} // ]
  }

function compilaCODE(name) { var ex=0;
  if (name[1]==":") { ex=1; }
  dicc.push(name.slice(ex+1,name.length).toUpperCase());
  dicca.push(memc);
  dicci.push(ex);
  modo=1;
  }

function compilaADDR(n) {
  if (modo>1) { datanro(dicca[n]);return; }
  codetok((dicca[n]<<7)+14+((dicci[n]>>4)&1));
  }

function compilaLIT(n) {
  if (modo>1) { datanro(n);return; }
//  if (n>-257 && n<256) { codetok(((n<<7)&0xff80)+7);return; }
  if (n==(n<<6)>>6) { // un bit mas por signo (token 8 y 9)
//    codetok((n<<7)+8+((n>>25)&1));
    codetok((n<<7)+8);
    return;
    }
  codetok((n<<7)+10); // falta cte en mem
  }

function compilaSTR(str) {
  var ini=datasave(str);
  if (modo<2) {codetok((ini<<7)+11);}
  }


function blockIn(){
  stacka.push(memc);
  level++;
  }

function solvejmp(from,to) {
  var whi=false;
  for (var i=from;i<to;i++) {
    var op=memcode[i]&0x7f;
    if (op>21 && op<35 && (memcode[i]>>7)==0) {
      memcode[i]+=(memc-i)<<7;  // patch while
      whi=true;
      }
    }
  return whi;
  }

function blockOut(){
  var from=stacka.pop();
  var dist=memc-from;
  if (solvejmp(from,memc)) { // salta
    codetok((-(dist+1)<<7)+18);   // jmpr
  } else {
    memcode[from-1]+=(dist<<7);   // patch if
  }
  level--;
  }

function compilaMAC(n) {
  if(modo>1) { dataMAC(n);return; }
  if (n==1) { blockIn();return; }   //( etiqueta
  if (n==2) { blockOut();return; }  //) salto
  if (n==3) { anonIn();return; }    //[ salto:etiqueta
  if (n==4) { anonOut();return; }   //] etiqueta;push
  codetok(n+16);
  if (n==0) { if (level==0) {modo=0;} } // ;
  }

function compilaWORD(n) {
  if (modo>1) { datanro(n);return; }
  codetok((dicca[n]<<7)+12+((dicci[n]>>4)&1));
  }

function r3token(name = "src") {
  let str = localStorage.getItem(name);

  level=0;
  var now=0;
  var ini;
  var ntoken;
  str=str.trim();
  while(now<str.length) {
    while (str.charCodeAt(now)<33) { now++; }
    if(str[now]==="^") {          // include
      ini=now;
      while (str.charCodeAt(now)>32) { now++; }
      continue;
      }
    if(str[now]==="|") {          // comments
      now=str.indexOf("\n",now)+1;
      if (now<=0) { now=str.length;}
      continue; }

    if(str[now]=== "\"") {          // strings
      ini=++now;
      while (str.charCodeAt(now)!=0) {
        if (str[now]=== "\"") { if (str[now+1]!="\"") { break; } now++; }
        now++; }
      compilaSTR(str.slice(ini,now));
      now+=2;
    } else {
      ini=now;
      while (str.charCodeAt(now)>32) { now++; }
      ntoken=str.slice(ini,now);
      switch (ntoken.charCodeAt(0)) { // genera tokens
        case 0x3A:// $3a :  Definicion  // :CODE
          compilaCODE(ntoken);break;
        case 0x23:// $23 #  Variable  // #DATA
          compilaDATA(ntoken);break;
        case 0x27:// $27 ' Direccion  // 'ADR
          ntoken=ntoken.substr(1).toUpperCase();
          nro=isWord(ntoken);if (nro<0) { r3Error.show(str,now);return 2; }
          compilaADDR(nro);break;
        default:
          ntoken=ntoken.toUpperCase();
          if (isNro(ntoken)) {
            compilaLIT(nro);break; }
          if (isBas(ntoken)) {
            compilaMAC(nro);break; }
          nro=isWord(ntoken);if (nro<0) { r3Error.show(str,now);return 1; }
          compilaWORD(nro);
          break;
        }
      }
    }
  ip=boot;
  if (memcode[memc-1]!=16) { memcode[memc++]=16; } // last;
  return 0;
  }


function r3includes(name = "src") {
  var now=0;
  var ini;
  let str = localStorage.getItem(name);
  str=str.trim();
  while(now<str.length) {
    while (str.charCodeAt(now)<33) { now++; }
    if(str[now]==="^") {          // include
      ini=++now;
      while (str.charCodeAt(now)>32) { now++; }
      let name=str.slice(ini,now);
      if (includes.indexOf(name)==-1) {
        //if (localStorage.getItem(name)=null) return;
        r3includes(name);
        includes.push(name);
        }
      continue;
      }
    if(str[now]==="|") {          // comments
      now=str.indexOf("\n",now)+1;
      if (now<=0) { now=str.length;}
      continue; }
    if(str[now]=== "\"") {          // strings
      ini=++now;
      while (str.charCodeAt(now)!=0) {
        if (str[now]=== "\"") { if (str[now+1]!="\"") { break; } now++; }
        now++; }
      now+=2;
    } else {
      ini=now;
      while (str.charCodeAt(now)>32) { now++; }
      }
    }
  }

var nowerror=0;

function r3compile(name = "src") {
  includes.splice(0,includes.length);

// load includes
  r3includes(name);

  dicc.splice(0,dicc.length);
  dicca.splice(0,dicca.length);
  dicci.splice(0,dicci.length);
  dicclocal=0;

  boot=-1

  memc=1;
  memd=meminidata;

// tokenize
  for (var i=0;i<includes.length;i++) {
    if (r3token(includes[i])) return nowerror;
    dicclocal=dicc.length;
    }

// last tokenizer
  if (r3token(name)!=0) return nowerror;
  r3Error.clear();
  return -1;
  }

function r3compilewi(name = "src") {
  dicc.splice(0,dicc.length);
  dicca.splice(0,dicca.length);
  dicci.splice(0,dicci.length);

  boot=-1

  memc=1;
  memd=meminidata;

// last tokenizer
  if (r3token(name)!=0) return nowerror;
  r3Error.clear();
  return -1;

  }

