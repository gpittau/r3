/*------RUNER------*/

var ip;

var TOS=0;
var NOS=0;
var REGA=0,REGB=0;
var RTOS=254;
var stack=new Int32Array(256);
//---------------------------//
// TOS..DSTACK--> <--RSTACK  //
//---------------------------//

function r3op(op) { var W,W1;
  switch(op&0x7f){
  case 7: NOS++;stack[NOS]=TOS;TOS=(op<<16)>>23;break;    //LIT9
  case 8: NOS++;stack[NOS]=TOS;TOS=op>>7;break;       //LITres
  case 9: NOS++;stack[NOS]=TOS;TOS=-(op>>7);break;      //LITreg neg
  case 10:NOS++;stack[NOS]=TOS;TOS=memcode[op>>7];break;    // LITcte
  case 11:NOS++;stack[NOS]=TOS;TOS=op>>7;break;       // STR
  case 12:RTOS--;stack[RTOS]=ip;ip=op>>7;break;       // CALL
  case 13:NOS++;stack[NOS]=TOS;TOS=mem.getInt32(op>>7);break; // VAR
  case 14:NOS++;stack[NOS]=TOS;TOS=op>>7;break;       // DWORD
  case 15:NOS++;stack[NOS]=TOS;TOS=op>>7;break;       // DVAR
  case 16:ip=stack[RTOS];RTOS++;break;            // ;
  case 17:ip=(op>>7);break;//JMP
  case 18:ip+=(op>>7);break;//JMPR
  case 19:break;
  case 20:break;
  case 21:W=TOS;TOS=stack[NOS];NOS--;RTOS--;stack[RTOS]=ip;ip=W;break;//EX

  case 22:if (TOS!=0) {ip+=(op>>7);}; break;//ZIF
  case 23:if (TOS==0) {ip+=(op>>7);}; break;//UIF
  case 24:if (TOS<0) {ip+=(op>>7);}; break;//PIF
  case 25:if (TOS>=0) {ip+=(op>>7);}; break;//NIF
  case 26:if (TOS==stack[NOS]) {ip+=(op>>7);} TOS=stack[NOS];NOS--;break;//IFN
  case 27:if (TOS!=stack[NOS]) {ip+=(op>>7);} TOS=stack[NOS];NOS--;break;//IFNO
  case 28:if (TOS>stack[NOS]) {ip+=(op>>7);} TOS=stack[NOS];NOS--;break;//IFL
  case 29:if (TOS>stack[NOS]) {ip+=(op>>7);} TOS=stack[NOS];NOS--;break;//IFG
  case 30:if (TOS<=stack[NOS]) {ip+=(op>>7);} TOS=stack[NOS];NOS--;break;//IFLE
  case 31:if (TOS>=stack[NOS]) {ip+=(op>>7);} TOS=stack[NOS];NOS--;break;//IFGE
  case 32:if (TOS&stack[NOS]) {ip+=(op>>7);} TOS=stack[NOS];NOS--;break;//IFAN
  case 33:if (!(TOS&stack[NOS])) {ip+=(op>>7);} TOS=stack[NOS];NOS--;break;//IFNA
  case 34:if (TOS<=stack[NOS]&&stack[NOS]<=stack[NOS]) {ip+=(op>>7);}
        TOS=stack[NOS-1];NOS-=2;break;//BTW (need bit trick)

  case 35:NOS++;stack[NOS]=TOS;break;           //DUP
  case 36:TOS=stack[NOS];NOS--;break;           //DROP
  case 37:NOS++;stack[NOS]=TOS;TOS=stack[NOS-1];break;  //OVER
  case 38:NOS++;stack[NOS]=TOS;TOS=stack[NOS-2];break;  //PICK2
  case 39:NOS++;stack[NOS]=TOS;TOS=stack[NOS-3];break;  //PICK3
  case 40:NOS++;stack[NOS]=TOS;TOS=stack[NOS-4];break;  //PICK4
  case 41:W=stack[NOS];stack[NOS]=TOS;TOS=W;break;    //SWAP
  case 42:NOS--;break;                  //NIP
  case 43:W=TOS;TOS=stack[NOS-1];stack[NOS-1]=stack[NOS];stack[NOS]=W;break;//ROT
  case 44:W=stack[NOS];NOS++;stack[NOS]=TOS;NOS++;stack[NOS]=W;break;//DUP2
  case 45:NOS--;TOS=stack[NOS];NOS--;break;       //DROP2
  case 46:NOS-=2;TOS=stack[NOS];NOS--;break;        //DROP3
  case 47:NOS-=3;TOS=stack[NOS];NOS--;break;        //DROP4
  case 48:NOS++;stack[NOS]=TOS;TOS=stack[NOS-3];
      NOS++;stack[NOS]=TOS;TOS=stack[NOS-3];break;  //OVER2
  case 49:W=stack[NOS];stack[NOS]=stack[NOS-2];stack[NOS-2]=W;
      W=TOS;TOS=stack[NOS-1];stack[NOS-1]=W;break;  //SWAP2

  case 50:RTOS--;stack[RTOS]=TOS;TOS=stack[NOS];NOS--;break;  //>r
  case 51:NOS++;stack[NOS]=TOS;TOS=stack[RTOS];RTOS++;break;  //r>
  case 52:NOS++;stack[NOS]=TOS;TOS=stack[RTOS];break;     //r@

  case 53:TOS&=stack[NOS];NOS--;break;          //AND
  case 54:TOS|=stack[NOS];NOS--;break;          //OR
  case 55:TOS^=stack[NOS];NOS--;break;          //XOR
  case 56:TOS=~TOS;break;                 //NOT
  case 57:TOS=-TOS;break;                 //NEG
  case 58:TOS=stack[NOS]+TOS;NOS--;break;         //SUMA
  case 59:TOS=stack[NOS]-TOS;NOS--;break;         //RESTA
  case 60:TOS=stack[NOS]*TOS;NOS--;break;         //MUL
  case 61:TOS=stack[NOS]/TOS;NOS--;break;         //DIV
  case 62:TOS=(stack[NOS-1]*stack[NOS])/TOS;NOS-=2;break; //MULDIV
  case 63:W=stack[NOS]%TOS;stack[NOS]=stack[NOS]/TOS;TOS=W;break;//DIVMOD
  case 64:TOS=stack[NOS]%TOS;NOS--;break;         //MOD
  case 65:W=(TOS>>31);TOS=(TOS+W)^W;break;        //ABS
  case 66:TOS=Math.sqrt(TOS);break;           //CSQRT
  case 67:TOS=Math.clz32(TOS);break;            //CLZ
  case 68:TOS=stack[NOS]<<TOS;NOS--;break;        //SAR
  case 69:TOS=stack[NOS]>>TOS;NOS--;break;        //SAL
  case 70:TOS=stack[NOS]>>TOS;NOS--;break;        //SHL
  case 71:TOS=(stack[NOS-1]*stack[NOS])>>TOS;NOS-=2;break;//MULSHR
  case 72:TOS=(stack[NOS-1]<<TOS)/stack[NOS];NOS-=2;break;//CDIVSH

  case 73:TOS=mem.getInt32(TOS);break;//@
  case 74:TOS=mem.getInt8(TOS);break;//C@
  case 75:TOS=mem.getInt64(TOS);break;//Q@

  case 76:NOS++;stack[NOS]=TOS+4;TOS=mem.getInt32(TOS);break;//@+
  case 77:NOS++;stack[NOS]=TOS+1;TOS=mem.getInt8(TOS);break;// C@+
  case 78:NOS++;stack[NOS]=TOS+8;TOS=mem.getInt64(TOS);break;//Q@+

  case 79:mem.setInt32(TOS,stack[NOS]);NOS--;TOS=stack[NOS];NOS--;break;// !
  case 80:mem.setInt8(TOS,stack[NOS]);NOS--;TOS=stack[NOS];NOS--;break;//C!
  case 81:mem.setInt64(TOS,stack[NOS]);NOS--;TOS=stack[NOS];NOS--;break;//Q!

  case 82:mem.setInt32(TOS,stack[NOS]);NOS--;TOS+=4;break;// !+
  case 83:mem.setInt8(TOS,stack[NOS]);NOS--;TOS++;break;//C!+
  case 84:mem.setInt64(TOS,stack[NOS]);NOS--;TOS+=8;break;//Q!+

  case 85:mem.setInt32(TOS,mem.getInt32(TOS)+stack[NOS]);NOS--;TOS=stack[NOS];NOS--;break;//+!
  case 86:mem.setInt8(TOS,mem.getInt8(TOS)+stack[NOS]);NOS--;TOS=stack[NOS];NOS--;break;//C+!
  case 87:mem.setInt64(TOS,mem.getInt64(TOS)+stack[NOS]);NOS--;TOS=stack[NOS];NOS--;break;//Q+!

  case 88:REGA=TOS;TOS=stack[NOS];NOS--;break; //>A
  case 89:NOS++;stack[NOS]=TOS;TOS=REGA;break; //A>
  case 90:NOS++;stack[NOS]=TOS;TOS==mem.getInt32(REGA);break;//A@
  case 91:mem.setInt32(REGA,TOS);TOS=stack[NOS];NOS--;break;//A!
  case 92:REGA+=TOS;TOS=stack[NOS];NOS--;break;//A+
  case 93:NOS++;stack[NOS]=TOS;TOS==mem.getInt32(REGA);REGA+=4;break;//A@+
  case 94:mem.setInt32(REGA,TOS);TOS=stack[NOS];NOS--;REGA+=4;break;//A!+

  case 95:REGB=TOS;TOS=stack[NOS];NOS--;break; //>B
  case 96:NOS++;stack[NOS]=TOS;TOS=REGB;break; //B>
  case 97:NOS++;stack[NOS]=TOS;TOS==mem.getInt64(REGB);break;//B@
  case 98:mem.setInt64(REGB,TOS);TOS=stack[NOS];NOS--;break;//B!
  case 99:REGB+=TOS;TOS=stack[NOS];NOS--;break;//B+
  case 100:NOS++;stack[NOS]=TOS;TOS==mem.getInt64(REGB);REGB+=8;break;//B@+
  case 101:mem.setInt64(REGB,TOS);TOS=stack[NOS];NOS--;REGB+=8;break;//B!+

  case 102://MOVE
    W=stack[NOS-1];W1=stack[NOS];
    while (TOS--) { mem.setInt32(W,mem.getInt32(W1));W+=4;W1+=4; }
    NOS-=2;TOS=stack[NOS];NOS--;break;
  case 103://MOVE>
    W=stack[NOS-1]+(TOS<<2);W1=stack[NOS]+(TOS<<2);
    while (TOS--) { W-=4;W1-=4;mem.setInt32(W,mem.getInt32(W1)); }
    NOS-=2;TOS=stack[NOS];NOS--;break;
  case 104://FILL
    W1=stack[NOS-1];W=stack[NOS];
    while (TOS--) { mem.setInt32(W,W1);W+=4; }
    NOS-=2;TOS=stack[NOS];NOS--;break;
  case 105://CMOVE
    W=stack[NOS-1];W1=stack[NOS];
    while (TOS--) { mem.setInt8(W,mem.getInt8(W1));W++;W1++; }
    NOS-=2;TOS=stack[NOS];NOS--;break;
  case 106://CMOVE>
    W=stack[NOS-1]+TOS;W1=stack[NOS]+TOS;
    while (TOS--) { W--;W1--;mem.setInt8(W,mem.getInt8(W1)); }
    NOS-=2;TOS=stack[NOS];NOS--;break;
  case 107://CFILL
    W1=stack[NOS-1];W=stack[NOS];
    while (TOS--) { mem.setInt8(W,W1);W++; }
    NOS-=2;TOS=stack[NOS];NOS--;break;
  case 108://QMOVE
    W=stack[NOS-1];W1=stack[NOS];
    while (TOS--) { mem.setInt64(W,mem.getInt64(W1));W+=8;W1+=8; }
    NOS-=2;TOS=stack[NOS];NOS--;break;
  case 109://MOVE>
    W=stack[NOS-1]+(TOS<<3);W1=stack[NOS]+(TOS<<3);
    while (TOS--) { W-=8;W1-=8;mem.setInt64(W,mem.getInt64(W1)); }
    NOS-=2;TOS=stack[NOS];NOS--;break;
  case 110://QFILL
    W1=stack[NOS-1];W=stack[NOS];
    while (TOS--) { mem.setInt64(W,W1);W+=8; }
    NOS-=2;TOS=stack[NOS];NOS--;break;

  case 111:systemcall(TOS,stack[NOS]);TOS=stack[NOS-1];NOS-=2;break; //SYSCALL | nro int --
  case 112:TOS=systemmem(TOS);break;//SYSMEM | nro -- ini

  }
  //op>>=8;}
  }

function systemcall(TOS,NOS) {
  switch(TOS) {
  case 0:r3echo+=datastr(NOS);break;  // "hola" 0 systemcall // echo
  case 1:r3domx=NOS;break;
  case 2:r3showx=NOS;animate();break;
    }
  }

var date=new Date();

function systemmem(TOS) {
  switch(TOS) {
  //graphics
  case 0:return 0;        // VFRAME
  case 1:return canvas.width;   // sw
  case 2:return canvas.height;  // sh
  //time
  case 3:return Date.now();   // msec
  case 4:return (date.getFullYear()<<16)+(date.getMonth()<<8)+date.getDay();    // y-m-d 0000-00-00
  case 5:return (date.getHours()<<16)+(date.getMinutes()<<8)+date.getSeconds();   // h:m:s .. 00:00:00
  // keyboard
  case 6: return ke;
  case 7: return kc;
  // miqui maus
  case 8: return ym<<16|xm;
  case 9: return bm;
  case 10: return memd;
    }
  }



////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

function num9(tok) // 9 bits
{ return (tok<<16)>>23; }
function numr(tok) // r bits
{ return (tok>>7);}
function numrn(tok) // r bits neg
{ return -(tok>>7);}
function numct(tok) // cte
{ return memcode[tok>>7];}

function printmr3(tok) {
var s="";
switch(tok&0x7f){
    case 7:s+="."+num9(tok);break
    case 8:
    case 12:case 13:case 14:case 15:
    case 17:case 18:
    case 22:case 23:case 24:case 25:
    case 26:case 27:case 28:case 29:case 30:case 31:
    case 32:case 33:case 34:
      s+="."+numr(tok);break
    case 9:s+="."+numrn(tok);break
    case 10:s+="."+numct(tok);break
//    default:
  }
if ((tok&0x7f)>20) { return r3base[(tok&0x7f)-16]+s; }
return r3machine[tok&0x7f]+s;
}

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

function Run(name = "runable") {
  if (r3compilewi(name)!=0) { return; }
  r3run();redraw();redom();
}
