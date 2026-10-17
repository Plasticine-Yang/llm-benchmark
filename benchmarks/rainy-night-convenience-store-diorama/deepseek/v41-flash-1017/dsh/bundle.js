(()=>{var hc="170",Zi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Ji={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},bu=0,qc=1,Tu=2;var of=1,fc=2,jn=3,sn=0,Jt=1,Je=2,Si=0,ei=1,ot=2,$c=3,Zc=4,Eu=5,Hi=100,Au=101,wu=102,Ru=103,Cu=104,Pu=200,Iu=201,Lu=202,Du=203,Ho=204,Vo=205,Uu=206,Nu=207,Ou=208,Fu=209,Bu=210,zu=211,ku=212,Hu=213,Vu=214,Go=0,Wo=1,Xo=2,Ms=3,Yo=4,qo=5,$o=6,Zo=7,lf=0,Gu=1,Wu=2,Mi=0,Xu=1,Yu=2,qu=3,uc=4,$u=5,Zu=6,Ju=7;var cf=300,bs=301,Ts=302,ar=303,Jo=304,Ya=306,ni=1e3,Gi=1001,Ko=1002,Kt=1003,Ku=1004;var Rr=1005;var zn=1006,ao=1007;var Wi=1008;var ii=1009,hf=1010,ff=1011,or=1012,dc=1013,Xi=1014,kn=1015,br=1016,pc=1017,mc=1018,Es=1020,uf=35902,df=1021,pf=1022,Ln=1023,mf=1024,gf=1025,vs=1026,As=1027,Tr=1028,gc=1029,_f=1030,_c=1031;var yc=1033,ra=33776,aa=33777,oa=33778,la=33779,jo=35840,Qo=35841,el=35842,tl=35843,nl=36196,il=37492,sl=37496,rl=37808,al=37809,ol=37810,ll=37811,cl=37812,hl=37813,fl=37814,ul=37815,dl=37816,pl=37817,ml=37818,gl=37819,_l=37820,yl=37821,ca=36492,vl=36494,xl=36495,yf=36283,Sl=36284,Ml=36285,bl=36286;var ha=2300,Tl=2301,oo=2302,Jc=2400,Kc=2401,jc=2402;var ju=3200,Qu=3201;var vc=0,ed=1,Bn="",Vt="srgb",Os="srgb-linear",qa="linear",yt="srgb";var ji=7680;var Qc=519,td=512,nd=513,id=514,vf=515,sd=516,rd=517,ad=518,od=519,El=35044;var eh="300 es",Qn=2e3,fa=2001,si=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let s=this._listeners[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let i=this._listeners[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},qt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],th=1234567,tr=Math.PI/180,lr=180/Math.PI;function Hn(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(qt[n&255]+qt[n>>8&255]+qt[n>>16&255]+qt[n>>24&255]+"-"+qt[e&255]+qt[e>>8&255]+"-"+qt[e>>16&15|64]+qt[e>>24&255]+"-"+qt[t&63|128]+qt[t>>8&255]+"-"+qt[t>>16&255]+qt[t>>24&255]+qt[i&255]+qt[i>>8&255]+qt[i>>16&255]+qt[i>>24&255]).toLowerCase()}function Ot(n,e,t){return Math.max(e,Math.min(t,n))}function xc(n,e){return(n%e+e)%e}function ld(n,e,t,i,s){return i+(n-e)*(s-i)/(t-e)}function cd(n,e,t){return n!==e?(t-n)/(e-n):0}function nr(n,e,t){return(1-t)*n+t*e}function hd(n,e,t,i){return nr(n,e,1-Math.exp(-t*i))}function fd(n,e=1){return e-Math.abs(xc(n,e*2)-e)}function ud(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function dd(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function pd(n,e){return n+Math.floor(Math.random()*(e-n+1))}function md(n,e){return n+Math.random()*(e-n)}function gd(n){return n*(.5-Math.random())}function _d(n){n!==void 0&&(th=n);let e=th+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function yd(n){return n*tr}function vd(n){return n*lr}function xd(n){return(n&n-1)===0&&n!==0}function Sd(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function Md(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function bd(n,e,t,i,s){let r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+i)/2),h=a((e+i)/2),u=r((e-i)/2),d=a((e-i)/2),p=r((i-e)/2),y=a((i-e)/2);switch(s){case"XYX":n.set(o*h,l*u,l*d,o*c);break;case"YZY":n.set(l*d,o*h,l*u,o*c);break;case"ZXZ":n.set(l*u,l*d,o*h,o*c);break;case"XZX":n.set(o*h,l*y,l*p,o*c);break;case"YXY":n.set(l*p,o*h,l*y,o*c);break;case"ZYZ":n.set(l*y,l*p,o*h,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function In(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function gt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}var xf={DEG2RAD:tr,RAD2DEG:lr,generateUUID:Hn,clamp:Ot,euclideanModulo:xc,mapLinear:ld,inverseLerp:cd,lerp:nr,damp:hd,pingpong:fd,smoothstep:ud,smootherstep:dd,randInt:pd,randFloat:md,randFloatSpread:gd,seededRandom:_d,degToRad:yd,radToDeg:vd,isPowerOfTwo:xd,ceilPowerOfTwo:Sd,floorPowerOfTwo:Md,setQuaternionFromProperEuler:bd,normalize:gt,denormalize:In},ee=class n{constructor(e=0,t=0){n.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ot(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*i-a*s+e.x,this.y=r*s+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Qe=class n{constructor(e,t,i,s,r,a,o,l,c){n.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,a,o,l,c)}set(e,t,i,s,r,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=i,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],h=i[4],u=i[7],d=i[2],p=i[5],y=i[8],_=s[0],m=s[3],f=s[6],v=s[1],S=s[4],g=s[7],L=s[2],R=s[5],C=s[8];return r[0]=a*_+o*v+l*L,r[3]=a*m+o*S+l*R,r[6]=a*f+o*g+l*C,r[1]=c*_+h*v+u*L,r[4]=c*m+h*S+u*R,r[7]=c*f+h*g+u*C,r[2]=d*_+p*v+y*L,r[5]=d*m+p*S+y*R,r[8]=d*f+p*g+y*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-i*r*h+i*o*l+s*r*c-s*a*l}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*r,p=c*r-a*l,y=t*u+i*d+s*p;if(y===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/y;return e[0]=u*_,e[1]=(s*c-h*i)*_,e[2]=(o*i-s*a)*_,e[3]=d*_,e[4]=(h*t-s*l)*_,e[5]=(s*r-o*t)*_,e[6]=p*_,e[7]=(i*l-c*t)*_,e[8]=(a*t-i*r)*_,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-s*c,s*l,-s*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(lo.makeScale(e,t)),this}rotate(e){return this.premultiply(lo.makeRotation(-e)),this}translate(e,t){return this.premultiply(lo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},lo=new Qe;function Sf(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function ua(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Td(){let n=ua("canvas");return n.style.display="block",n}var nh={};function Qs(n){n in nh||(nh[n]=!0,console.warn(n))}function Ed(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}function Ad(n){let e=n.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function wd(n){let e=n.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var at={enabled:!0,workingColorSpace:Os,spaces:{},convert:function(n,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===yt&&(n.r=ti(n.r),n.g=ti(n.g),n.b=ti(n.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(n.applyMatrix3(this.spaces[e].toXYZ),n.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===yt&&(n.r=xs(n.r),n.g=xs(n.g),n.b=xs(n.b))),n},fromWorkingColorSpace:function(n,e){return this.convert(n,this.workingColorSpace,e)},toWorkingColorSpace:function(n,e){return this.convert(n,e,this.workingColorSpace)},getPrimaries:function(n){return this.spaces[n].primaries},getTransfer:function(n){return n===Bn?qa:this.spaces[n].transfer},getLuminanceCoefficients:function(n,e=this.workingColorSpace){return n.fromArray(this.spaces[e].luminanceCoefficients)},define:function(n){Object.assign(this.spaces,n)},_getMatrix:function(n,e,t){return n.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(n){return this.spaces[n].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(n=this.workingColorSpace){return this.spaces[n].workingColorSpaceConfig.unpackColorSpace}};function ti(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function xs(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var ih=[.64,.33,.3,.6,.15,.06],sh=[.2126,.7152,.0722],rh=[.3127,.329],ah=new Qe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),oh=new Qe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);at.define({[Os]:{primaries:ih,whitePoint:rh,transfer:qa,toXYZ:ah,fromXYZ:oh,luminanceCoefficients:sh,workingColorSpaceConfig:{unpackColorSpace:Vt},outputColorSpaceConfig:{drawingBufferColorSpace:Vt}},[Vt]:{primaries:ih,whitePoint:rh,transfer:yt,toXYZ:ah,fromXYZ:oh,luminanceCoefficients:sh,outputColorSpaceConfig:{drawingBufferColorSpace:Vt}}});var Qi,Al=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Qi===void 0&&(Qi=ua("canvas")),Qi.width=e.width,Qi.height=e.height;let i=Qi.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=Qi}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ua("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=ti(r[a]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(ti(t[i]/255)*255):t[i]=ti(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Rd=0,da=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Rd++}),this.uuid=Hn(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(co(s[a].image)):r.push(co(s[a]))}else r=co(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function co(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Al.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Cd=0,rn=class n extends si{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=Gi,s=Gi,r=zn,a=Wi,o=Ln,l=ii,c=n.DEFAULT_ANISOTROPY,h=Bn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Cd++}),this.uuid=Hn(),this.name="",this.source=new da(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ee(0,0),this.repeat=new ee(1,1),this.center=new ee(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Qe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==cf)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ni:e.x=e.x-Math.floor(e.x);break;case Gi:e.x=e.x<0?0:1;break;case Ko:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ni:e.y=e.y-Math.floor(e.y);break;case Gi:e.y=e.y<0?0:1;break;case Ko:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};rn.DEFAULT_IMAGE=null;rn.DEFAULT_MAPPING=cf;rn.DEFAULT_ANISOTROPY=1;var vt=class n{constructor(e=0,t=0,i=0,s=1){n.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*i+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*i+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*i+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],p=l[5],y=l[9],_=l[2],m=l[6],f=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-_)<.01&&Math.abs(y-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+_)<.1&&Math.abs(y+m)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let S=(c+1)/2,g=(p+1)/2,L=(f+1)/2,R=(h+d)/4,C=(u+_)/4,A=(y+m)/4;return S>g&&S>L?S<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(S),s=R/i,r=C/i):g>L?g<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(g),i=R/s,r=A/s):L<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(L),i=C/r,s=A/r),this.set(i,s,r,t),this}let v=Math.sqrt((m-y)*(m-y)+(u-_)*(u-_)+(d-h)*(d-h));return Math.abs(v)<.001&&(v=1),this.x=(m-y)/v,this.y=(u-_)/v,this.z=(d-h)/v,this.w=Math.acos((c+p+f-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},wl=class extends si{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new vt(0,0,e,t),this.scissorTest=!1,this.viewport=new vt(0,0,e,t);let s={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:zn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);let r=new rn(s,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);r.flipY=!1,r.generateMipmaps=i.generateMipmaps,r.internalFormat=i.internalFormat,this.textures=[];let a=i.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,s=e.textures.length;i<s;i++)this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new da(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},ri=class extends wl{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},pa=class extends rn{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Kt,this.minFilter=Kt,this.wrapR=Gi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Rl=class extends rn{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Kt,this.minFilter=Kt,this.wrapR=Gi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var mn=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,a,o){let l=i[s+0],c=i[s+1],h=i[s+2],u=i[s+3],d=r[a+0],p=r[a+1],y=r[a+2],_=r[a+3];if(o===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u;return}if(o===1){e[t+0]=d,e[t+1]=p,e[t+2]=y,e[t+3]=_;return}if(u!==_||l!==d||c!==p||h!==y){let m=1-o,f=l*d+c*p+h*y+u*_,v=f>=0?1:-1,S=1-f*f;if(S>Number.EPSILON){let L=Math.sqrt(S),R=Math.atan2(L,f*v);m=Math.sin(m*R)/L,o=Math.sin(o*R)/L}let g=o*v;if(l=l*m+d*g,c=c*m+p*g,h=h*m+y*g,u=u*m+_*g,m===1-o){let L=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=L,c*=L,h*=L,u*=L}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,s,r,a){let o=i[s],l=i[s+1],c=i[s+2],h=i[s+3],u=r[a],d=r[a+1],p=r[a+2],y=r[a+3];return e[t]=o*y+h*u+l*p-c*d,e[t+1]=l*y+h*d+c*u-o*p,e[t+2]=c*y+h*p+o*d-l*u,e[t+3]=h*y-o*u-l*d-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(s/2),u=o(r/2),d=l(i/2),p=l(s/2),y=l(r/2);switch(a){case"XYZ":this._x=d*h*u+c*p*y,this._y=c*p*u-d*h*y,this._z=c*h*y+d*p*u,this._w=c*h*u-d*p*y;break;case"YXZ":this._x=d*h*u+c*p*y,this._y=c*p*u-d*h*y,this._z=c*h*y-d*p*u,this._w=c*h*u+d*p*y;break;case"ZXY":this._x=d*h*u-c*p*y,this._y=c*p*u+d*h*y,this._z=c*h*y+d*p*u,this._w=c*h*u-d*p*y;break;case"ZYX":this._x=d*h*u-c*p*y,this._y=c*p*u+d*h*y,this._z=c*h*y-d*p*u,this._w=c*h*u+d*p*y;break;case"YZX":this._x=d*h*u+c*p*y,this._y=c*p*u+d*h*y,this._z=c*h*y-d*p*u,this._w=c*h*u-d*p*y;break;case"XZY":this._x=d*h*u-c*p*y,this._y=c*p*u-d*h*y,this._z=c*h*y+d*p*u,this._w=c*h*u+d*p*y;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=i+o+u;if(d>0){let p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(h-l)*p,this._y=(r-c)*p,this._z=(a-s)*p}else if(i>o&&i>u){let p=2*Math.sqrt(1+i-o-u);this._w=(h-l)/p,this._x=.25*p,this._y=(s+a)/p,this._z=(r+c)/p}else if(o>u){let p=2*Math.sqrt(1+o-i-u);this._w=(r-c)/p,this._x=(s+a)/p,this._y=.25*p,this._z=(l+h)/p}else{let p=2*Math.sqrt(1+u-i-o);this._w=(a-s)/p,this._x=(r+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ot(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-i*c,this._z=r*h+a*c+i*l-s*o,this._w=a*h-i*o-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,s=this._y,r=this._z,a=this._w,o=a*e._w+i*e._x+s*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=i,this._y=s,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let p=1-t;return this._w=p*a+t*this._w,this._x=p*i+t*this._x,this._y=p*s+t*this._y,this._z=p*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-t)*h)/c,d=Math.sin(t*h)/c;return this._w=a*u+this._w*d,this._x=i*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},D=class n{constructor(e=0,t=0,i=0){n.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(lh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(lh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*s-o*i),h=2*(o*t-r*s),u=2*(r*i-a*t);return this.x=t+l*c+a*u-o*h,this.y=i+l*h+o*c-r*u,this.z=s+l*u+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-i*l,this.z=i*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return ho.copy(this).projectOnVector(e),this.sub(ho)}reflect(e){return this.sub(ho.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ot(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ho=new D,lh=new mn,ai=class{constructor(e=new D(1/0,1/0,1/0),t=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(wn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(wn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=wn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,wn):wn.fromBufferAttribute(r,a),wn.applyMatrix4(e.matrixWorld),this.expandByPoint(wn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Cr.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Cr.copy(i.boundingBox)),Cr.applyMatrix4(e.matrixWorld),this.union(Cr)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,wn),wn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Gs),Pr.subVectors(this.max,Gs),es.subVectors(e.a,Gs),ts.subVectors(e.b,Gs),ns.subVectors(e.c,Gs),pi.subVectors(ts,es),mi.subVectors(ns,ts),Ui.subVectors(es,ns);let t=[0,-pi.z,pi.y,0,-mi.z,mi.y,0,-Ui.z,Ui.y,pi.z,0,-pi.x,mi.z,0,-mi.x,Ui.z,0,-Ui.x,-pi.y,pi.x,0,-mi.y,mi.x,0,-Ui.y,Ui.x,0];return!fo(t,es,ts,ns,Pr)||(t=[1,0,0,0,1,0,0,0,1],!fo(t,es,ts,ns,Pr))?!1:(Ir.crossVectors(pi,mi),t=[Ir.x,Ir.y,Ir.z],fo(t,es,ts,ns,Pr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,wn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(wn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(qn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),qn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),qn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),qn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),qn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),qn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),qn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),qn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(qn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},qn=[new D,new D,new D,new D,new D,new D,new D,new D],wn=new D,Cr=new ai,es=new D,ts=new D,ns=new D,pi=new D,mi=new D,Ui=new D,Gs=new D,Pr=new D,Ir=new D,Ni=new D;function fo(n,e,t,i,s){for(let r=0,a=n.length-3;r<=a;r+=3){Ni.fromArray(n,r);let o=s.x*Math.abs(Ni.x)+s.y*Math.abs(Ni.y)+s.z*Math.abs(Ni.z),l=e.dot(Ni),c=t.dot(Ni),h=i.dot(Ni);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var Pd=new ai,Ws=new D,uo=new D,Ti=class{constructor(e=new D,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):Pd.setFromPoints(e).getCenter(i);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Ws.subVectors(e,this.center);let t=Ws.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(Ws,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(uo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Ws.copy(e.center).add(uo)),this.expandByPoint(Ws.copy(e.center).sub(uo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},$n=new D,po=new D,Lr=new D,gi=new D,mo=new D,Dr=new D,go=new D,ws=class{constructor(e=new D,t=new D(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,$n)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=$n.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):($n.copy(this.origin).addScaledVector(this.direction,t),$n.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){po.copy(e).add(t).multiplyScalar(.5),Lr.copy(t).sub(e).normalize(),gi.copy(this.origin).sub(po);let r=e.distanceTo(t)*.5,a=-this.direction.dot(Lr),o=gi.dot(this.direction),l=-gi.dot(Lr),c=gi.lengthSq(),h=Math.abs(1-a*a),u,d,p,y;if(h>0)if(u=a*l-o,d=a*o-l,y=r*h,u>=0)if(d>=-y)if(d<=y){let _=1/h;u*=_,d*=_,p=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d<=-y?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c):d<=y?(u=0,d=Math.min(Math.max(-r,-l),r),p=d*(d+2*l)+c):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(po).addScaledVector(Lr,d),p}intersectSphere(e,t){$n.subVectors(e.center,this.origin);let i=$n.dot(this.direction),s=$n.dot($n)-i*i,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(i=(e.min.x-d.x)*c,s=(e.max.x-d.x)*c):(i=(e.max.x-d.x)*c,s=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),i>a||r>s||((r>i||isNaN(i))&&(i=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),i>l||o>s)||((o>i||i!==i)&&(i=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,$n)!==null}intersectTriangle(e,t,i,s,r){mo.subVectors(t,e),Dr.subVectors(i,e),go.crossVectors(mo,Dr);let a=this.direction.dot(go),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;gi.subVectors(this.origin,e);let l=o*this.direction.dot(Dr.crossVectors(gi,Dr));if(l<0)return null;let c=o*this.direction.dot(mo.cross(gi));if(c<0||l+c>a)return null;let h=-o*gi.dot(go);return h<0?null:this.at(h/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ut=class n{constructor(e,t,i,s,r,a,o,l,c,h,u,d,p,y,_,m){n.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,a,o,l,c,h,u,d,p,y,_,m)}set(e,t,i,s,r,a,o,l,c,h,u,d,p,y,_,m){let f=this.elements;return f[0]=e,f[4]=t,f[8]=i,f[12]=s,f[1]=r,f[5]=a,f[9]=o,f[13]=l,f[2]=c,f[6]=h,f[10]=u,f[14]=d,f[3]=p,f[7]=y,f[11]=_,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,s=1/is.setFromMatrixColumn(e,0).length(),r=1/is.setFromMatrixColumn(e,1).length(),a=1/is.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=a*h,p=a*u,y=o*h,_=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=p+y*c,t[5]=d-_*c,t[9]=-o*l,t[2]=_-d*c,t[6]=y+p*c,t[10]=a*l}else if(e.order==="YXZ"){let d=l*h,p=l*u,y=c*h,_=c*u;t[0]=d+_*o,t[4]=y*o-p,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=p*o-y,t[6]=_+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*h,p=l*u,y=c*h,_=c*u;t[0]=d-_*o,t[4]=-a*u,t[8]=y+p*o,t[1]=p+y*o,t[5]=a*h,t[9]=_-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*h,p=a*u,y=o*h,_=o*u;t[0]=l*h,t[4]=y*c-p,t[8]=d*c+_,t[1]=l*u,t[5]=_*c+d,t[9]=p*c-y,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,p=a*c,y=o*l,_=o*c;t[0]=l*h,t[4]=_-d*u,t[8]=y*u+p,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=p*u+y,t[10]=d-_*u}else if(e.order==="XZY"){let d=a*l,p=a*c,y=o*l,_=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+_,t[5]=a*h,t[9]=p*u-y,t[2]=y*u-p,t[6]=o*h,t[10]=_*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Id,e,Ld)}lookAt(e,t,i){let s=this.elements;return dn.subVectors(e,t),dn.lengthSq()===0&&(dn.z=1),dn.normalize(),_i.crossVectors(i,dn),_i.lengthSq()===0&&(Math.abs(i.z)===1?dn.x+=1e-4:dn.z+=1e-4,dn.normalize(),_i.crossVectors(i,dn)),_i.normalize(),Ur.crossVectors(dn,_i),s[0]=_i.x,s[4]=Ur.x,s[8]=dn.x,s[1]=_i.y,s[5]=Ur.y,s[9]=dn.y,s[2]=_i.z,s[6]=Ur.z,s[10]=dn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],h=i[1],u=i[5],d=i[9],p=i[13],y=i[2],_=i[6],m=i[10],f=i[14],v=i[3],S=i[7],g=i[11],L=i[15],R=s[0],C=s[4],A=s[8],x=s[12],M=s[1],U=s[5],k=s[9],z=s[13],G=s[2],Q=s[6],Y=s[10],se=s[14],q=s[3],ge=s[7],Me=s[11],Ce=s[15];return r[0]=a*R+o*M+l*G+c*q,r[4]=a*C+o*U+l*Q+c*ge,r[8]=a*A+o*k+l*Y+c*Me,r[12]=a*x+o*z+l*se+c*Ce,r[1]=h*R+u*M+d*G+p*q,r[5]=h*C+u*U+d*Q+p*ge,r[9]=h*A+u*k+d*Y+p*Me,r[13]=h*x+u*z+d*se+p*Ce,r[2]=y*R+_*M+m*G+f*q,r[6]=y*C+_*U+m*Q+f*ge,r[10]=y*A+_*k+m*Y+f*Me,r[14]=y*x+_*z+m*se+f*Ce,r[3]=v*R+S*M+g*G+L*q,r[7]=v*C+S*U+g*Q+L*ge,r[11]=v*A+S*k+g*Y+L*Me,r[15]=v*x+S*z+g*se+L*Ce,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],p=e[14],y=e[3],_=e[7],m=e[11],f=e[15];return y*(+r*l*u-s*c*u-r*o*d+i*c*d+s*o*p-i*l*p)+_*(+t*l*p-t*c*d+r*a*d-s*a*p+s*c*h-r*l*h)+m*(+t*c*u-t*o*p-r*a*u+i*a*p+r*o*h-i*c*h)+f*(-s*o*h-t*l*u+t*o*d+s*a*u-i*a*d+i*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],p=e[11],y=e[12],_=e[13],m=e[14],f=e[15],v=u*m*c-_*d*c+_*l*p-o*m*p-u*l*f+o*d*f,S=y*d*c-h*m*c-y*l*p+a*m*p+h*l*f-a*d*f,g=h*_*c-y*u*c+y*o*p-a*_*p-h*o*f+a*u*f,L=y*u*l-h*_*l-y*o*d+a*_*d+h*o*m-a*u*m,R=t*v+i*S+s*g+r*L;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/R;return e[0]=v*C,e[1]=(_*d*r-u*m*r-_*s*p+i*m*p+u*s*f-i*d*f)*C,e[2]=(o*m*r-_*l*r+_*s*c-i*m*c-o*s*f+i*l*f)*C,e[3]=(u*l*r-o*d*r-u*s*c+i*d*c+o*s*p-i*l*p)*C,e[4]=S*C,e[5]=(h*m*r-y*d*r+y*s*p-t*m*p-h*s*f+t*d*f)*C,e[6]=(y*l*r-a*m*r-y*s*c+t*m*c+a*s*f-t*l*f)*C,e[7]=(a*d*r-h*l*r+h*s*c-t*d*c-a*s*p+t*l*p)*C,e[8]=g*C,e[9]=(y*u*r-h*_*r-y*i*p+t*_*p+h*i*f-t*u*f)*C,e[10]=(a*_*r-y*o*r+y*i*c-t*_*c-a*i*f+t*o*f)*C,e[11]=(h*o*r-a*u*r-h*i*c+t*u*c+a*i*p-t*o*p)*C,e[12]=L*C,e[13]=(h*_*s-y*u*s+y*i*d-t*_*d-h*i*m+t*u*m)*C,e[14]=(y*o*s-a*_*s-y*i*l+t*_*l+a*i*m-t*o*m)*C,e[15]=(a*u*s-h*o*s+h*i*l-t*u*l-a*i*d+t*o*d)*C,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+i,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+i,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,a){return this.set(1,i,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,u=o+o,d=r*c,p=r*h,y=r*u,_=a*h,m=a*u,f=o*u,v=l*c,S=l*h,g=l*u,L=i.x,R=i.y,C=i.z;return s[0]=(1-(_+f))*L,s[1]=(p+g)*L,s[2]=(y-S)*L,s[3]=0,s[4]=(p-g)*R,s[5]=(1-(d+f))*R,s[6]=(m+v)*R,s[7]=0,s[8]=(y+S)*C,s[9]=(m-v)*C,s[10]=(1-(d+_))*C,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements,r=is.set(s[0],s[1],s[2]).length(),a=is.set(s[4],s[5],s[6]).length(),o=is.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],Rn.copy(this);let c=1/r,h=1/a,u=1/o;return Rn.elements[0]*=c,Rn.elements[1]*=c,Rn.elements[2]*=c,Rn.elements[4]*=h,Rn.elements[5]*=h,Rn.elements[6]*=h,Rn.elements[8]*=u,Rn.elements[9]*=u,Rn.elements[10]*=u,t.setFromRotationMatrix(Rn),i.x=r,i.y=a,i.z=o,this}makePerspective(e,t,i,s,r,a,o=Qn){let l=this.elements,c=2*r/(t-e),h=2*r/(i-s),u=(t+e)/(t-e),d=(i+s)/(i-s),p,y;if(o===Qn)p=-(a+r)/(a-r),y=-2*a*r/(a-r);else if(o===fa)p=-a/(a-r),y=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=y,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,s,r,a,o=Qn){let l=this.elements,c=1/(t-e),h=1/(i-s),u=1/(a-r),d=(t+e)*c,p=(i+s)*h,y,_;if(o===Qn)y=(a+r)*u,_=-2*u;else if(o===fa)y=r*u,_=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=_,l[14]=-y,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},is=new D,Rn=new ut,Id=new D(0,0,0),Ld=new D(1,1,1),_i=new D,Ur=new D,dn=new D,ch=new ut,hh=new mn,vn=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],u=s[2],d=s[6],p=s[10];switch(t){case"XYZ":this._y=Math.asin(Ot(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ot(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ot(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Ot(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Ot(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Ot(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return ch.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ch,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return hh.setFromEuler(this),this.setFromQuaternion(hh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};vn.DEFAULT_ORDER="XYZ";var ma=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Dd=0,fh=new D,ss=new mn,Zn=new ut,Nr=new D,Xs=new D,Ud=new D,Nd=new mn,uh=new D(1,0,0),dh=new D(0,1,0),ph=new D(0,0,1),mh={type:"added"},Od={type:"removed"},rs={type:"childadded",child:null},_o={type:"childremoved",child:null},Gt=class n extends si{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Dd++}),this.uuid=Hn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new D,t=new vn,i=new mn,s=new D(1,1,1);function r(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ut},normalMatrix:{value:new Qe}}),this.matrix=new ut,this.matrixWorld=new ut,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ma,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ss.setFromAxisAngle(e,t),this.quaternion.multiply(ss),this}rotateOnWorldAxis(e,t){return ss.setFromAxisAngle(e,t),this.quaternion.premultiply(ss),this}rotateX(e){return this.rotateOnAxis(uh,e)}rotateY(e){return this.rotateOnAxis(dh,e)}rotateZ(e){return this.rotateOnAxis(ph,e)}translateOnAxis(e,t){return fh.copy(e).applyQuaternion(this.quaternion),this.position.add(fh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(uh,e)}translateY(e){return this.translateOnAxis(dh,e)}translateZ(e){return this.translateOnAxis(ph,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Zn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Nr.copy(e):Nr.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),Xs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Zn.lookAt(Xs,Nr,this.up):Zn.lookAt(Nr,Xs,this.up),this.quaternion.setFromRotationMatrix(Zn),s&&(Zn.extractRotation(s.matrixWorld),ss.setFromRotationMatrix(Zn),this.quaternion.premultiply(ss.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(mh),rs.child=e,this.dispatchEvent(rs),rs.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Od),_o.child=e,this.dispatchEvent(_o),_o.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Zn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Zn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Zn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(mh),rs.child=e,this.dispatchEvent(rs),rs.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Xs,e,Ud),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Xs,Nd,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),p=a(e.animations),y=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),p.length>0&&(i.animations=p),y.length>0&&(i.nodes=y)}return i.object=s,i;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}};Gt.DEFAULT_UP=new D(0,1,0);Gt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Gt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Cn=new D,Jn=new D,yo=new D,Kn=new D,as=new D,os=new D,gh=new D,vo=new D,xo=new D,So=new D,Mo=new vt,bo=new vt,To=new vt,xi=class n{constructor(e=new D,t=new D,i=new D){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),Cn.subVectors(e,t),s.cross(Cn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){Cn.subVectors(s,t),Jn.subVectors(i,t),yo.subVectors(e,t);let a=Cn.dot(Cn),o=Cn.dot(Jn),l=Cn.dot(yo),c=Jn.dot(Jn),h=Jn.dot(yo),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;let d=1/u,p=(c*l-o*h)*d,y=(a*h-o*l)*d;return r.set(1-p-y,y,p)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,Kn)===null?!1:Kn.x>=0&&Kn.y>=0&&Kn.x+Kn.y<=1}static getInterpolation(e,t,i,s,r,a,o,l){return this.getBarycoord(e,t,i,s,Kn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Kn.x),l.addScaledVector(a,Kn.y),l.addScaledVector(o,Kn.z),l)}static getInterpolatedAttribute(e,t,i,s,r,a){return Mo.setScalar(0),bo.setScalar(0),To.setScalar(0),Mo.fromBufferAttribute(e,t),bo.fromBufferAttribute(e,i),To.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(Mo,r.x),a.addScaledVector(bo,r.y),a.addScaledVector(To,r.z),a}static isFrontFacing(e,t,i,s){return Cn.subVectors(i,t),Jn.subVectors(e,t),Cn.cross(Jn).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Cn.subVectors(this.c,this.b),Jn.subVectors(this.a,this.b),Cn.cross(Jn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,a,o;as.subVectors(s,i),os.subVectors(r,i),vo.subVectors(e,i);let l=as.dot(vo),c=os.dot(vo);if(l<=0&&c<=0)return t.copy(i);xo.subVectors(e,s);let h=as.dot(xo),u=os.dot(xo);if(h>=0&&u<=h)return t.copy(s);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(i).addScaledVector(as,a);So.subVectors(e,r);let p=as.dot(So),y=os.dot(So);if(y>=0&&p<=y)return t.copy(r);let _=p*c-l*y;if(_<=0&&c>=0&&y<=0)return o=c/(c-y),t.copy(i).addScaledVector(os,o);let m=h*y-p*u;if(m<=0&&u-h>=0&&p-y>=0)return gh.subVectors(r,s),o=(u-h)/(u-h+(p-y)),t.copy(s).addScaledVector(gh,o);let f=1/(m+_+d);return a=_*f,o=d*f,t.copy(i).addScaledVector(as,a).addScaledVector(os,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Mf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},yi={h:0,s:0,l:0},Or={h:0,s:0,l:0};function Eo(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Xe=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Vt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,at.toWorkingColorSpace(this,t),this}setRGB(e,t,i,s=at.workingColorSpace){return this.r=e,this.g=t,this.b=i,at.toWorkingColorSpace(this,s),this}setHSL(e,t,i,s=at.workingColorSpace){if(e=xc(e,1),t=Ot(t,0,1),i=Ot(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,a=2*i-r;this.r=Eo(a,r,e+1/3),this.g=Eo(a,r,e),this.b=Eo(a,r,e-1/3)}return at.toWorkingColorSpace(this,s),this}setStyle(e,t=Vt){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Vt){let i=Mf[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=ti(e.r),this.g=ti(e.g),this.b=ti(e.b),this}copyLinearToSRGB(e){return this.r=xs(e.r),this.g=xs(e.g),this.b=xs(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Vt){return at.fromWorkingColorSpace($t.copy(this),e),Math.round(Ot($t.r*255,0,255))*65536+Math.round(Ot($t.g*255,0,255))*256+Math.round(Ot($t.b*255,0,255))}getHexString(e=Vt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=at.workingColorSpace){at.fromWorkingColorSpace($t.copy(this),t);let i=$t.r,s=$t.g,r=$t.b,a=Math.max(i,s,r),o=Math.min(i,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case i:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-i)/u+2;break;case r:l=(i-s)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=at.workingColorSpace){return at.fromWorkingColorSpace($t.copy(this),t),e.r=$t.r,e.g=$t.g,e.b=$t.b,e}getStyle(e=Vt){at.fromWorkingColorSpace($t.copy(this),e);let t=$t.r,i=$t.g,s=$t.b;return e!==Vt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(yi),this.setHSL(yi.h+e,yi.s+t,yi.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(yi),e.getHSL(Or);let i=nr(yi.h,Or.h,t),s=nr(yi.s,Or.s,t),r=nr(yi.l,Or.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},$t=new Xe;Xe.NAMES=Mf;var Fd=0,Vn=class extends si{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Fd++}),this.uuid=Hn(),this.name="",this.blending=ei,this.side=sn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ho,this.blendDst=Vo,this.blendEquation=Hi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Xe(0,0,0),this.blendAlpha=0,this.depthFunc=Ms,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Qc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ji,this.stencilZFail=ji,this.stencilZPass=ji,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==ei&&(i.blending=this.blending),this.side!==sn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Ho&&(i.blendSrc=this.blendSrc),this.blendDst!==Vo&&(i.blendDst=this.blendDst),this.blendEquation!==Hi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Ms&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Qc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ji&&(i.stencilFail=this.stencilFail),this.stencilZFail!==ji&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==ji&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(i.textures=r),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},xn=class extends Vn{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new Xe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new vn,this.combine=lf,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Nt=new D,Fr=new ee,jt=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=El,this.updateRanges=[],this.gpuType=kn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Fr.fromBufferAttribute(this,t),Fr.applyMatrix3(e),this.setXY(t,Fr.x,Fr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Nt.fromBufferAttribute(this,t),Nt.applyMatrix3(e),this.setXYZ(t,Nt.x,Nt.y,Nt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Nt.fromBufferAttribute(this,t),Nt.applyMatrix4(e),this.setXYZ(t,Nt.x,Nt.y,Nt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Nt.fromBufferAttribute(this,t),Nt.applyNormalMatrix(e),this.setXYZ(t,Nt.x,Nt.y,Nt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Nt.fromBufferAttribute(this,t),Nt.transformDirection(e),this.setXYZ(t,Nt.x,Nt.y,Nt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=In(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=gt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=In(t,this.array)),t}setX(e,t){return this.normalized&&(t=gt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=In(t,this.array)),t}setY(e,t){return this.normalized&&(t=gt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=In(t,this.array)),t}setZ(e,t){return this.normalized&&(t=gt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=In(t,this.array)),t}setW(e,t){return this.normalized&&(t=gt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=gt(t,this.array),i=gt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=gt(t,this.array),i=gt(i,this.array),s=gt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=gt(t,this.array),i=gt(i,this.array),s=gt(s,this.array),r=gt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==El&&(e.usage=this.usage),e}};var ga=class extends jt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var _a=class extends jt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var it=class extends jt{constructor(e,t,i){super(new Float32Array(e),t,i)}},Bd=0,yn=new ut,Ao=new Gt,ls=new D,pn=new ai,Ys=new ai,kt=new D,Lt=class n extends si{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Bd++}),this.uuid=Hn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Sf(e)?_a:ga)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new Qe().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return yn.makeRotationFromQuaternion(e),this.applyMatrix4(yn),this}rotateX(e){return yn.makeRotationX(e),this.applyMatrix4(yn),this}rotateY(e){return yn.makeRotationY(e),this.applyMatrix4(yn),this}rotateZ(e){return yn.makeRotationZ(e),this.applyMatrix4(yn),this}translate(e,t,i){return yn.makeTranslation(e,t,i),this.applyMatrix4(yn),this}scale(e,t,i){return yn.makeScale(e,t,i),this.applyMatrix4(yn),this}lookAt(e){return Ao.lookAt(e),Ao.updateMatrix(),this.applyMatrix4(Ao.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ls).negate(),this.translate(ls.x,ls.y,ls.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new it(i,3))}else{for(let i=0,s=t.count;i<s;i++){let r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ai);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];pn.setFromBufferAttribute(r),this.morphTargetsRelative?(kt.addVectors(this.boundingBox.min,pn.min),this.boundingBox.expandByPoint(kt),kt.addVectors(this.boundingBox.max,pn.max),this.boundingBox.expandByPoint(kt)):(this.boundingBox.expandByPoint(pn.min),this.boundingBox.expandByPoint(pn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ti);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(e){let i=this.boundingSphere.center;if(pn.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];Ys.setFromBufferAttribute(o),this.morphTargetsRelative?(kt.addVectors(pn.min,Ys.min),pn.expandByPoint(kt),kt.addVectors(pn.max,Ys.max),pn.expandByPoint(kt)):(pn.expandByPoint(Ys.min),pn.expandByPoint(Ys.max))}pn.getCenter(i);let s=0;for(let r=0,a=e.count;r<a;r++)kt.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(kt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)kt.fromBufferAttribute(o,c),l&&(ls.fromBufferAttribute(e,c),kt.add(ls)),s=Math.max(s,i.distanceToSquared(kt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new jt(new Float32Array(4*i.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let A=0;A<i.count;A++)o[A]=new D,l[A]=new D;let c=new D,h=new D,u=new D,d=new ee,p=new ee,y=new ee,_=new D,m=new D;function f(A,x,M){c.fromBufferAttribute(i,A),h.fromBufferAttribute(i,x),u.fromBufferAttribute(i,M),d.fromBufferAttribute(r,A),p.fromBufferAttribute(r,x),y.fromBufferAttribute(r,M),h.sub(c),u.sub(c),p.sub(d),y.sub(d);let U=1/(p.x*y.y-y.x*p.y);isFinite(U)&&(_.copy(h).multiplyScalar(y.y).addScaledVector(u,-p.y).multiplyScalar(U),m.copy(u).multiplyScalar(p.x).addScaledVector(h,-y.x).multiplyScalar(U),o[A].add(_),o[x].add(_),o[M].add(_),l[A].add(m),l[x].add(m),l[M].add(m))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let A=0,x=v.length;A<x;++A){let M=v[A],U=M.start,k=M.count;for(let z=U,G=U+k;z<G;z+=3)f(e.getX(z+0),e.getX(z+1),e.getX(z+2))}let S=new D,g=new D,L=new D,R=new D;function C(A){L.fromBufferAttribute(s,A),R.copy(L);let x=o[A];S.copy(x),S.sub(L.multiplyScalar(L.dot(x))).normalize(),g.crossVectors(R,x);let U=g.dot(l[A])<0?-1:1;a.setXYZW(A,S.x,S.y,S.z,U)}for(let A=0,x=v.length;A<x;++A){let M=v[A],U=M.start,k=M.count;for(let z=U,G=U+k;z<G;z+=3)C(e.getX(z+0)),C(e.getX(z+1)),C(e.getX(z+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new jt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let d=0,p=i.count;d<p;d++)i.setXYZ(d,0,0,0);let s=new D,r=new D,a=new D,o=new D,l=new D,c=new D,h=new D,u=new D;if(e)for(let d=0,p=e.count;d<p;d+=3){let y=e.getX(d+0),_=e.getX(d+1),m=e.getX(d+2);s.fromBufferAttribute(t,y),r.fromBufferAttribute(t,_),a.fromBufferAttribute(t,m),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),o.fromBufferAttribute(i,y),l.fromBufferAttribute(i,_),c.fromBufferAttribute(i,m),o.add(h),l.add(h),c.add(h),i.setXYZ(y,o.x,o.y,o.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,p=t.count;d<p;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),i.setXYZ(d+0,h.x,h.y,h.z),i.setXYZ(d+1,h.x,h.y,h.z),i.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)kt.fromBufferAttribute(e,t),kt.normalize(),e.setXYZ(t,kt.x,kt.y,kt.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h),p=0,y=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?p=l[_]*o.data.stride+o.offset:p=l[_]*h;for(let f=0;f<h;f++)d[y++]=c[p++]}return new jt(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,i);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){let d=c[h],p=e(d,i);l.push(p)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let p=c[u];h.push(p.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone(t));let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,p=u.length;d<p;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},_h=new ut,Oi=new ws,Br=new Ti,yh=new D,zr=new D,kr=new D,Hr=new D,wo=new D,Vr=new D,vh=new D,Gr=new D,Pe=class extends Gt{constructor(e=new Lt,t=new xn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){Vr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],u=r[l];h!==0&&(wo.fromBufferAttribute(u,e),a?Vr.addScaledVector(wo,h):Vr.addScaledVector(wo.sub(t),h))}t.add(Vr)}return t}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Br.copy(i.boundingSphere),Br.applyMatrix4(r),Oi.copy(e.ray).recast(e.near),!(Br.containsPoint(Oi.origin)===!1&&(Oi.intersectSphere(Br,yh)===null||Oi.origin.distanceToSquared(yh)>(e.far-e.near)**2))&&(_h.copy(r).invert(),Oi.copy(e.ray).applyMatrix4(_h),!(i.boundingBox!==null&&Oi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Oi)))}_computeIntersections(e,t,i){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,p=r.drawRange;if(o!==null)if(Array.isArray(a))for(let y=0,_=d.length;y<_;y++){let m=d[y],f=a[m.materialIndex],v=Math.max(m.start,p.start),S=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let g=v,L=S;g<L;g+=3){let R=o.getX(g),C=o.getX(g+1),A=o.getX(g+2);s=Wr(this,f,e,i,c,h,u,R,C,A),s&&(s.faceIndex=Math.floor(g/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let y=Math.max(0,p.start),_=Math.min(o.count,p.start+p.count);for(let m=y,f=_;m<f;m+=3){let v=o.getX(m),S=o.getX(m+1),g=o.getX(m+2);s=Wr(this,a,e,i,c,h,u,v,S,g),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let y=0,_=d.length;y<_;y++){let m=d[y],f=a[m.materialIndex],v=Math.max(m.start,p.start),S=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let g=v,L=S;g<L;g+=3){let R=g,C=g+1,A=g+2;s=Wr(this,f,e,i,c,h,u,R,C,A),s&&(s.faceIndex=Math.floor(g/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let y=Math.max(0,p.start),_=Math.min(l.count,p.start+p.count);for(let m=y,f=_;m<f;m+=3){let v=m,S=m+1,g=m+2;s=Wr(this,a,e,i,c,h,u,v,S,g),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}};function zd(n,e,t,i,s,r,a,o){let l;if(e.side===Jt?l=i.intersectTriangle(a,r,s,!0,o):l=i.intersectTriangle(s,r,a,e.side===sn,o),l===null)return null;Gr.copy(o),Gr.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Gr);return c<t.near||c>t.far?null:{distance:c,point:Gr.clone(),object:n}}function Wr(n,e,t,i,s,r,a,o,l,c){n.getVertexPosition(o,zr),n.getVertexPosition(l,kr),n.getVertexPosition(c,Hr);let h=zd(n,e,t,i,zr,kr,Hr,vh);if(h){let u=new D;xi.getBarycoord(vh,zr,kr,Hr,u),s&&(h.uv=xi.getInterpolatedAttribute(s,o,l,c,u,new ee)),r&&(h.uv1=xi.getInterpolatedAttribute(r,o,l,c,u,new ee)),a&&(h.normal=xi.getInterpolatedAttribute(a,o,l,c,u,new D),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let d={a:o,b:l,c,normal:new D,materialIndex:0};xi.getNormal(zr,kr,Hr,d.normal),h.face=d,h.barycoord=u}return h}var an=class n extends Lt{constructor(e=1,t=1,i=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],u=[],d=0,p=0;y("z","y","x",-1,-1,i,t,e,a,r,0),y("z","y","x",1,-1,i,t,-e,a,r,1),y("x","z","y",1,1,e,i,t,s,a,2),y("x","z","y",1,-1,e,i,-t,s,a,3),y("x","y","z",1,-1,e,t,i,s,r,4),y("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new it(c,3)),this.setAttribute("normal",new it(h,3)),this.setAttribute("uv",new it(u,2));function y(_,m,f,v,S,g,L,R,C,A,x){let M=g/C,U=L/A,k=g/2,z=L/2,G=R/2,Q=C+1,Y=A+1,se=0,q=0,ge=new D;for(let Me=0;Me<Y;Me++){let Ce=Me*U-z;for(let We=0;We<Q;We++){let ct=We*M-k;ge[_]=ct*v,ge[m]=Ce*S,ge[f]=G,c.push(ge.x,ge.y,ge.z),ge[_]=0,ge[m]=0,ge[f]=R>0?1:-1,h.push(ge.x,ge.y,ge.z),u.push(We/C),u.push(1-Me/A),se+=1}}for(let Me=0;Me<A;Me++)for(let Ce=0;Ce<C;Ce++){let We=d+Ce+Q*Me,ct=d+Ce+Q*(Me+1),K=d+(Ce+1)+Q*(Me+1),fe=d+(Ce+1)+Q*Me;l.push(We,ct,fe),l.push(ct,K,fe),q+=6}o.addGroup(p,q,x),p+=q,d+=se}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Rs(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone():Array.isArray(s)?e[t][i]=s.slice():e[t][i]=s}}return e}function tn(n){let e={};for(let t=0;t<n.length;t++){let i=Rs(n[t]);for(let s in i)e[s]=i[s]}return e}function kd(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function bf(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:at.workingColorSpace}var Sc={clone:Rs,merge:tn},Hd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Vd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,on=class extends Vn{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Hd,this.fragmentShader=Vd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Rs(e.uniforms),this.uniformsGroups=kd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},ya=class extends Gt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ut,this.projectionMatrix=new ut,this.projectionMatrixInverse=new ut,this.coordinateSystem=Qn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},vi=new D,xh=new ee,Sh=new ee,Zt=class extends ya{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=lr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(tr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return lr*2*Math.atan(Math.tan(tr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){vi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(vi.x,vi.y).multiplyScalar(-e/vi.z),vi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(vi.x,vi.y).multiplyScalar(-e/vi.z)}getViewSize(e,t){return this.getViewBounds(e,xh,Sh),t.subVectors(Sh,xh)}setViewOffset(e,t,i,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(tr*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*i/c,s*=a.width/l,i*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},cs=-90,hs=1,Cl=class extends Gt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Zt(cs,hs,e,t);s.layers=this.layers,this.add(s);let r=new Zt(cs,hs,e,t);r.layers=this.layers,this.add(r);let a=new Zt(cs,hs,e,t);a.layers=this.layers,this.add(a);let o=new Zt(cs,hs,e,t);o.layers=this.layers,this.add(o);let l=new Zt(cs,hs,e,t);l.layers=this.layers,this.add(l);let c=new Zt(cs,hs,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===Qn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===fa)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),y=e.xr.enabled;e.xr.enabled=!1;let _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,s),e.render(t,r),e.setRenderTarget(i,1,s),e.render(t,a),e.setRenderTarget(i,2,s),e.render(t,o),e.setRenderTarget(i,3,s),e.render(t,l),e.setRenderTarget(i,4,s),e.render(t,c),i.texture.generateMipmaps=_,e.setRenderTarget(i,5,s),e.render(t,h),e.setRenderTarget(u,d,p),e.xr.enabled=y,i.texture.needsPMREMUpdate=!0}},va=class extends rn{constructor(e,t,i,s,r,a,o,l,c,h){e=e!==void 0?e:[],t=t!==void 0?t:bs,super(e,t,i,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Pl=class extends ri{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new va(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:zn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new an(5,5,5),r=new on({name:"CubemapFromEquirect",uniforms:Rs(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Jt,blending:Si});r.uniforms.tEquirect.value=t;let a=new Pe(s,r),o=t.minFilter;return t.minFilter===Wi&&(t.minFilter=zn),new Cl(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,i,s){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,s);e.setRenderTarget(r)}},Ro=new D,Gd=new D,Wd=new Qe,Pn=class{constructor(e=new D(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=Ro.subVectors(i,t).cross(Gd.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta(Ro),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||Wd.getNormalMatrix(e),s=this.coplanarPoint(Ro).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Fi=new Ti,Xr=new D,cr=class{constructor(e=new Pn,t=new Pn,i=new Pn,s=new Pn,r=new Pn,a=new Pn){this.planes=[e,t,i,s,r,a]}set(e,t,i,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Qn){let i=this.planes,s=e.elements,r=s[0],a=s[1],o=s[2],l=s[3],c=s[4],h=s[5],u=s[6],d=s[7],p=s[8],y=s[9],_=s[10],m=s[11],f=s[12],v=s[13],S=s[14],g=s[15];if(i[0].setComponents(l-r,d-c,m-p,g-f).normalize(),i[1].setComponents(l+r,d+c,m+p,g+f).normalize(),i[2].setComponents(l+a,d+h,m+y,g+v).normalize(),i[3].setComponents(l-a,d-h,m-y,g-v).normalize(),i[4].setComponents(l-o,d-u,m-_,g-S).normalize(),t===Qn)i[5].setComponents(l+o,d+u,m+_,g+S).normalize();else if(t===fa)i[5].setComponents(o,u,_,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Fi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Fi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Fi)}intersectsSprite(e){return Fi.center.set(0,0,0),Fi.radius=.7071067811865476,Fi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Fi)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(Xr.x=s.normal.x>0?e.max.x:e.min.x,Xr.y=s.normal.y>0?e.max.y:e.min.y,Xr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Xr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Tf(){let n=null,e=!1,t=null,i=null;function s(r,a){t(r,a),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function Xd(n){let e=new WeakMap;function t(o,l){let c=o.array,h=o.usage,u=c.byteLength,d=n.createBuffer();n.bindBuffer(l,d),n.bufferData(l,c,h),o.onUploadCallback();let p;if(c instanceof Float32Array)p=n.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=n.HALF_FLOAT:p=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=n.SHORT;else if(c instanceof Uint32Array)p=n.UNSIGNED_INT;else if(c instanceof Int32Array)p=n.INT;else if(c instanceof Int8Array)p=n.BYTE;else if(c instanceof Uint8Array)p=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function i(o,l,c){let h=l.array,u=l.updateRanges;if(n.bindBuffer(c,o),u.length===0)n.bufferSubData(c,0,h);else{u.sort((p,y)=>p.start-y.start);let d=0;for(let p=1;p<u.length;p++){let y=u[d],_=u[p];_.start<=y.start+y.count+1?y.count=Math.max(y.count,_.start+_.count-y.start):(++d,u[d]=_)}u.length=d+1;for(let p=0,y=u.length;p<y;p++){let _=u[p];n.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(n.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Qt=class n extends Lt{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(i),l=Math.floor(s),c=o+1,h=l+1,u=e/o,d=t/l,p=[],y=[],_=[],m=[];for(let f=0;f<h;f++){let v=f*d-a;for(let S=0;S<c;S++){let g=S*u-r;y.push(g,-v,0),_.push(0,0,1),m.push(S/o),m.push(1-f/l)}}for(let f=0;f<l;f++)for(let v=0;v<o;v++){let S=v+c*f,g=v+c*(f+1),L=v+1+c*(f+1),R=v+1+c*f;p.push(S,g,R),p.push(g,L,R)}this.setIndex(p),this.setAttribute("position",new it(y,3)),this.setAttribute("normal",new it(_,3)),this.setAttribute("uv",new it(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},Yd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,qd=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,$d=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Zd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Jd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Kd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,jd=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Qd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,e0=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,t0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,n0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,i0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,s0=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,r0=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,a0=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,o0=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,l0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,c0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,h0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,f0=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,u0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,d0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,p0=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,m0=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,g0=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,_0=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,y0=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,v0=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,x0=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,S0=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,M0="gl_FragColor = linearToOutputTexel( gl_FragColor );",b0=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,T0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,E0=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,A0=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,w0=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,R0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,C0=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,P0=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,I0=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,L0=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,D0=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,U0=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,N0=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,O0=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,F0=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,B0=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,z0=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,k0=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,H0=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,V0=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,G0=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,W0=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,X0=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Y0=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,q0=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,$0=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Z0=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,J0=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,K0=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,j0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Q0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,ep=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,tp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,np=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,ip=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,sp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,rp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,ap=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,op=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,lp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,cp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,hp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,fp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,up=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,dp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,pp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,mp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,gp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,_p=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,yp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,vp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,xp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Sp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Mp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,bp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Tp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ep=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ap=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,wp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Rp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Cp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Pp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Ip=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Lp=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Dp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Up=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Np=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Op=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Fp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Bp=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,zp=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,kp=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Hp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Vp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Gp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Wp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Xp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Yp=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,qp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,$p=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Jp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Kp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,jp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Qp=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,em=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,tm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,nm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,im=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,rm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,am=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,om=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,lm=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,cm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,hm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,fm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,um=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,dm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,pm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,mm=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,gm=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_m=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ym=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vm=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,xm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Sm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Mm=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,bm=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Tm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,tt={alphahash_fragment:Yd,alphahash_pars_fragment:qd,alphamap_fragment:$d,alphamap_pars_fragment:Zd,alphatest_fragment:Jd,alphatest_pars_fragment:Kd,aomap_fragment:jd,aomap_pars_fragment:Qd,batching_pars_vertex:e0,batching_vertex:t0,begin_vertex:n0,beginnormal_vertex:i0,bsdfs:s0,iridescence_fragment:r0,bumpmap_pars_fragment:a0,clipping_planes_fragment:o0,clipping_planes_pars_fragment:l0,clipping_planes_pars_vertex:c0,clipping_planes_vertex:h0,color_fragment:f0,color_pars_fragment:u0,color_pars_vertex:d0,color_vertex:p0,common:m0,cube_uv_reflection_fragment:g0,defaultnormal_vertex:_0,displacementmap_pars_vertex:y0,displacementmap_vertex:v0,emissivemap_fragment:x0,emissivemap_pars_fragment:S0,colorspace_fragment:M0,colorspace_pars_fragment:b0,envmap_fragment:T0,envmap_common_pars_fragment:E0,envmap_pars_fragment:A0,envmap_pars_vertex:w0,envmap_physical_pars_fragment:B0,envmap_vertex:R0,fog_vertex:C0,fog_pars_vertex:P0,fog_fragment:I0,fog_pars_fragment:L0,gradientmap_pars_fragment:D0,lightmap_pars_fragment:U0,lights_lambert_fragment:N0,lights_lambert_pars_fragment:O0,lights_pars_begin:F0,lights_toon_fragment:z0,lights_toon_pars_fragment:k0,lights_phong_fragment:H0,lights_phong_pars_fragment:V0,lights_physical_fragment:G0,lights_physical_pars_fragment:W0,lights_fragment_begin:X0,lights_fragment_maps:Y0,lights_fragment_end:q0,logdepthbuf_fragment:$0,logdepthbuf_pars_fragment:Z0,logdepthbuf_pars_vertex:J0,logdepthbuf_vertex:K0,map_fragment:j0,map_pars_fragment:Q0,map_particle_fragment:ep,map_particle_pars_fragment:tp,metalnessmap_fragment:np,metalnessmap_pars_fragment:ip,morphinstance_vertex:sp,morphcolor_vertex:rp,morphnormal_vertex:ap,morphtarget_pars_vertex:op,morphtarget_vertex:lp,normal_fragment_begin:cp,normal_fragment_maps:hp,normal_pars_fragment:fp,normal_pars_vertex:up,normal_vertex:dp,normalmap_pars_fragment:pp,clearcoat_normal_fragment_begin:mp,clearcoat_normal_fragment_maps:gp,clearcoat_pars_fragment:_p,iridescence_pars_fragment:yp,opaque_fragment:vp,packing:xp,premultiplied_alpha_fragment:Sp,project_vertex:Mp,dithering_fragment:bp,dithering_pars_fragment:Tp,roughnessmap_fragment:Ep,roughnessmap_pars_fragment:Ap,shadowmap_pars_fragment:wp,shadowmap_pars_vertex:Rp,shadowmap_vertex:Cp,shadowmask_pars_fragment:Pp,skinbase_vertex:Ip,skinning_pars_vertex:Lp,skinning_vertex:Dp,skinnormal_vertex:Up,specularmap_fragment:Np,specularmap_pars_fragment:Op,tonemapping_fragment:Fp,tonemapping_pars_fragment:Bp,transmission_fragment:zp,transmission_pars_fragment:kp,uv_pars_fragment:Hp,uv_pars_vertex:Vp,uv_vertex:Gp,worldpos_vertex:Wp,background_vert:Xp,background_frag:Yp,backgroundCube_vert:qp,backgroundCube_frag:$p,cube_vert:Zp,cube_frag:Jp,depth_vert:Kp,depth_frag:jp,distanceRGBA_vert:Qp,distanceRGBA_frag:em,equirect_vert:tm,equirect_frag:nm,linedashed_vert:im,linedashed_frag:sm,meshbasic_vert:rm,meshbasic_frag:am,meshlambert_vert:om,meshlambert_frag:lm,meshmatcap_vert:cm,meshmatcap_frag:hm,meshnormal_vert:fm,meshnormal_frag:um,meshphong_vert:dm,meshphong_frag:pm,meshphysical_vert:mm,meshphysical_frag:gm,meshtoon_vert:_m,meshtoon_frag:ym,points_vert:vm,points_frag:xm,shadow_vert:Sm,shadow_frag:Mm,sprite_vert:bm,sprite_frag:Tm},_e={common:{diffuse:{value:new Xe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Qe},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Qe}},envmap:{envMap:{value:null},envMapRotation:{value:new Qe},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Qe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Qe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Qe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Qe},normalScale:{value:new ee(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Qe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Qe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Qe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Qe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Xe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Xe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0},uvTransform:{value:new Qe}},sprite:{diffuse:{value:new Xe(16777215)},opacity:{value:1},center:{value:new ee(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Qe},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0}}},Fn={basic:{uniforms:tn([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.fog]),vertexShader:tt.meshbasic_vert,fragmentShader:tt.meshbasic_frag},lambert:{uniforms:tn([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new Xe(0)}}]),vertexShader:tt.meshlambert_vert,fragmentShader:tt.meshlambert_frag},phong:{uniforms:tn([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new Xe(0)},specular:{value:new Xe(1118481)},shininess:{value:30}}]),vertexShader:tt.meshphong_vert,fragmentShader:tt.meshphong_frag},standard:{uniforms:tn([_e.common,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.roughnessmap,_e.metalnessmap,_e.fog,_e.lights,{emissive:{value:new Xe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag},toon:{uniforms:tn([_e.common,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.gradientmap,_e.fog,_e.lights,{emissive:{value:new Xe(0)}}]),vertexShader:tt.meshtoon_vert,fragmentShader:tt.meshtoon_frag},matcap:{uniforms:tn([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,{matcap:{value:null}}]),vertexShader:tt.meshmatcap_vert,fragmentShader:tt.meshmatcap_frag},points:{uniforms:tn([_e.points,_e.fog]),vertexShader:tt.points_vert,fragmentShader:tt.points_frag},dashed:{uniforms:tn([_e.common,_e.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:tt.linedashed_vert,fragmentShader:tt.linedashed_frag},depth:{uniforms:tn([_e.common,_e.displacementmap]),vertexShader:tt.depth_vert,fragmentShader:tt.depth_frag},normal:{uniforms:tn([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,{opacity:{value:1}}]),vertexShader:tt.meshnormal_vert,fragmentShader:tt.meshnormal_frag},sprite:{uniforms:tn([_e.sprite,_e.fog]),vertexShader:tt.sprite_vert,fragmentShader:tt.sprite_frag},background:{uniforms:{uvTransform:{value:new Qe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:tt.background_vert,fragmentShader:tt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Qe}},vertexShader:tt.backgroundCube_vert,fragmentShader:tt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:tt.cube_vert,fragmentShader:tt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:tt.equirect_vert,fragmentShader:tt.equirect_frag},distanceRGBA:{uniforms:tn([_e.common,_e.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:tt.distanceRGBA_vert,fragmentShader:tt.distanceRGBA_frag},shadow:{uniforms:tn([_e.lights,_e.fog,{color:{value:new Xe(0)},opacity:{value:1}}]),vertexShader:tt.shadow_vert,fragmentShader:tt.shadow_frag}};Fn.physical={uniforms:tn([Fn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Qe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Qe},clearcoatNormalScale:{value:new ee(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Qe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Qe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Qe},sheen:{value:0},sheenColor:{value:new Xe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Qe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Qe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Qe},transmissionSamplerSize:{value:new ee},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Qe},attenuationDistance:{value:0},attenuationColor:{value:new Xe(0)},specularColor:{value:new Xe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Qe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Qe},anisotropyVector:{value:new ee},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Qe}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag};var Yr={r:0,b:0,g:0},Bi=new vn,Em=new ut;function Am(n,e,t,i,s,r,a){let o=new Xe(0),l=r===!0?0:1,c,h,u=null,d=0,p=null;function y(v){let S=v.isScene===!0?v.background:null;return S&&S.isTexture&&(S=(v.backgroundBlurriness>0?t:e).get(S)),S}function _(v){let S=!1,g=y(v);g===null?f(o,l):g&&g.isColor&&(f(g,1),S=!0);let L=n.xr.getEnvironmentBlendMode();L==="additive"?i.buffers.color.setClear(0,0,0,1,a):L==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,a),(n.autoClear||S)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function m(v,S){let g=y(S);g&&(g.isCubeTexture||g.mapping===Ya)?(h===void 0&&(h=new Pe(new an(1,1,1),new on({name:"BackgroundCubeMaterial",uniforms:Rs(Fn.backgroundCube.uniforms),vertexShader:Fn.backgroundCube.vertexShader,fragmentShader:Fn.backgroundCube.fragmentShader,side:Jt,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(L,R,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Bi.copy(S.backgroundRotation),Bi.x*=-1,Bi.y*=-1,Bi.z*=-1,g.isCubeTexture&&g.isRenderTargetTexture===!1&&(Bi.y*=-1,Bi.z*=-1),h.material.uniforms.envMap.value=g,h.material.uniforms.flipEnvMap.value=g.isCubeTexture&&g.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Em.makeRotationFromEuler(Bi)),h.material.toneMapped=at.getTransfer(g.colorSpace)!==yt,(u!==g||d!==g.version||p!==n.toneMapping)&&(h.material.needsUpdate=!0,u=g,d=g.version,p=n.toneMapping),h.layers.enableAll(),v.unshift(h,h.geometry,h.material,0,0,null)):g&&g.isTexture&&(c===void 0&&(c=new Pe(new Qt(2,2),new on({name:"BackgroundMaterial",uniforms:Rs(Fn.background.uniforms),vertexShader:Fn.background.vertexShader,fragmentShader:Fn.background.fragmentShader,side:sn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=g,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.toneMapped=at.getTransfer(g.colorSpace)!==yt,g.matrixAutoUpdate===!0&&g.updateMatrix(),c.material.uniforms.uvTransform.value.copy(g.matrix),(u!==g||d!==g.version||p!==n.toneMapping)&&(c.material.needsUpdate=!0,u=g,d=g.version,p=n.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null))}function f(v,S){v.getRGB(Yr,bf(n)),i.buffers.color.setClear(Yr.r,Yr.g,Yr.b,S,a)}return{getClearColor:function(){return o},setClearColor:function(v,S=1){o.set(v),l=S,f(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(v){l=v,f(o,l)},render:_,addToRenderList:m}}function wm(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=d(null),r=s,a=!1;function o(M,U,k,z,G){let Q=!1,Y=u(z,k,U);r!==Y&&(r=Y,c(r.object)),Q=p(M,z,k,G),Q&&y(M,z,k,G),G!==null&&e.update(G,n.ELEMENT_ARRAY_BUFFER),(Q||a)&&(a=!1,g(M,U,k,z),G!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(G).buffer))}function l(){return n.createVertexArray()}function c(M){return n.bindVertexArray(M)}function h(M){return n.deleteVertexArray(M)}function u(M,U,k){let z=k.wireframe===!0,G=i[M.id];G===void 0&&(G={},i[M.id]=G);let Q=G[U.id];Q===void 0&&(Q={},G[U.id]=Q);let Y=Q[z];return Y===void 0&&(Y=d(l()),Q[z]=Y),Y}function d(M){let U=[],k=[],z=[];for(let G=0;G<t;G++)U[G]=0,k[G]=0,z[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:k,attributeDivisors:z,object:M,attributes:{},index:null}}function p(M,U,k,z){let G=r.attributes,Q=U.attributes,Y=0,se=k.getAttributes();for(let q in se)if(se[q].location>=0){let Me=G[q],Ce=Q[q];if(Ce===void 0&&(q==="instanceMatrix"&&M.instanceMatrix&&(Ce=M.instanceMatrix),q==="instanceColor"&&M.instanceColor&&(Ce=M.instanceColor)),Me===void 0||Me.attribute!==Ce||Ce&&Me.data!==Ce.data)return!0;Y++}return r.attributesNum!==Y||r.index!==z}function y(M,U,k,z){let G={},Q=U.attributes,Y=0,se=k.getAttributes();for(let q in se)if(se[q].location>=0){let Me=Q[q];Me===void 0&&(q==="instanceMatrix"&&M.instanceMatrix&&(Me=M.instanceMatrix),q==="instanceColor"&&M.instanceColor&&(Me=M.instanceColor));let Ce={};Ce.attribute=Me,Me&&Me.data&&(Ce.data=Me.data),G[q]=Ce,Y++}r.attributes=G,r.attributesNum=Y,r.index=z}function _(){let M=r.newAttributes;for(let U=0,k=M.length;U<k;U++)M[U]=0}function m(M){f(M,0)}function f(M,U){let k=r.newAttributes,z=r.enabledAttributes,G=r.attributeDivisors;k[M]=1,z[M]===0&&(n.enableVertexAttribArray(M),z[M]=1),G[M]!==U&&(n.vertexAttribDivisor(M,U),G[M]=U)}function v(){let M=r.newAttributes,U=r.enabledAttributes;for(let k=0,z=U.length;k<z;k++)U[k]!==M[k]&&(n.disableVertexAttribArray(k),U[k]=0)}function S(M,U,k,z,G,Q,Y){Y===!0?n.vertexAttribIPointer(M,U,k,G,Q):n.vertexAttribPointer(M,U,k,z,G,Q)}function g(M,U,k,z){_();let G=z.attributes,Q=k.getAttributes(),Y=U.defaultAttributeValues;for(let se in Q){let q=Q[se];if(q.location>=0){let ge=G[se];if(ge===void 0&&(se==="instanceMatrix"&&M.instanceMatrix&&(ge=M.instanceMatrix),se==="instanceColor"&&M.instanceColor&&(ge=M.instanceColor)),ge!==void 0){let Me=ge.normalized,Ce=ge.itemSize,We=e.get(ge);if(We===void 0)continue;let ct=We.buffer,K=We.type,fe=We.bytesPerElement,Ue=K===n.INT||K===n.UNSIGNED_INT||ge.gpuType===dc;if(ge.isInterleavedBufferAttribute){let P=ge.data,Z=P.stride,pe=ge.offset;if(P.isInstancedInterleavedBuffer){for(let ye=0;ye<q.locationSize;ye++)f(q.location+ye,P.meshPerAttribute);M.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=P.meshPerAttribute*P.count)}else for(let ye=0;ye<q.locationSize;ye++)m(q.location+ye);n.bindBuffer(n.ARRAY_BUFFER,ct);for(let ye=0;ye<q.locationSize;ye++)S(q.location+ye,Ce/q.locationSize,K,Me,Z*fe,(pe+Ce/q.locationSize*ye)*fe,Ue)}else{if(ge.isInstancedBufferAttribute){for(let P=0;P<q.locationSize;P++)f(q.location+P,ge.meshPerAttribute);M.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=ge.meshPerAttribute*ge.count)}else for(let P=0;P<q.locationSize;P++)m(q.location+P);n.bindBuffer(n.ARRAY_BUFFER,ct);for(let P=0;P<q.locationSize;P++)S(q.location+P,Ce/q.locationSize,K,Me,Ce*fe,Ce/q.locationSize*P*fe,Ue)}}else if(Y!==void 0){let Me=Y[se];if(Me!==void 0)switch(Me.length){case 2:n.vertexAttrib2fv(q.location,Me);break;case 3:n.vertexAttrib3fv(q.location,Me);break;case 4:n.vertexAttrib4fv(q.location,Me);break;default:n.vertexAttrib1fv(q.location,Me)}}}}v()}function L(){A();for(let M in i){let U=i[M];for(let k in U){let z=U[k];for(let G in z)h(z[G].object),delete z[G];delete U[k]}delete i[M]}}function R(M){if(i[M.id]===void 0)return;let U=i[M.id];for(let k in U){let z=U[k];for(let G in z)h(z[G].object),delete z[G];delete U[k]}delete i[M.id]}function C(M){for(let U in i){let k=i[U];if(k[M.id]===void 0)continue;let z=k[M.id];for(let G in z)h(z[G].object),delete z[G];delete k[M.id]}}function A(){x(),a=!0,r!==s&&(r=s,c(r.object))}function x(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:A,resetDefaultState:x,dispose:L,releaseStatesOfGeometry:R,releaseStatesOfProgram:C,initAttributes:_,enableAttribute:m,disableUnusedAttributes:v}}function Rm(n,e,t){let i;function s(c){i=c}function r(c,h){n.drawArrays(i,c,h),t.update(h,i,1)}function a(c,h,u){u!==0&&(n.drawArraysInstanced(i,c,h,u),t.update(h,i,u))}function o(c,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,u);let p=0;for(let y=0;y<u;y++)p+=h[y];t.update(p,i,1)}function l(c,h,u,d){if(u===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let y=0;y<c.length;y++)a(c[y],h[y],d[y]);else{p.multiDrawArraysInstancedWEBGL(i,c,0,h,0,d,0,u);let y=0;for(let _=0;_<u;_++)y+=h[_]*d[_];t.update(y,i,1)}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Cm(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(C){return!(C!==Ln&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){let A=C===br&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==ii&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==kn&&!A)}function l(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),p=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),y=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),f=n.getParameter(n.MAX_VERTEX_ATTRIBS),v=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),S=n.getParameter(n.MAX_VARYING_VECTORS),g=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),L=y>0,R=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:p,maxVertexTextures:y,maxTextureSize:_,maxCubemapSize:m,maxAttributes:f,maxVertexUniforms:v,maxVaryings:S,maxFragmentUniforms:g,vertexTextures:L,maxSamples:R}}function Pm(n){let e=this,t=null,i=0,s=!1,r=!1,a=new Pn,o=new Qe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let p=u.length!==0||d||i!==0||s;return s=d,i=u.length,p},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,p){let y=u.clippingPlanes,_=u.clipIntersection,m=u.clipShadows,f=n.get(u);if(!s||y===null||y.length===0||r&&!m)r?h(null):c();else{let v=r?0:i,S=v*4,g=f.clippingState||null;l.value=g,g=h(y,d,S,p);for(let L=0;L!==S;++L)g[L]=t[L];f.clippingState=g,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(u,d,p,y){let _=u!==null?u.length:0,m=null;if(_!==0){if(m=l.value,y!==!0||m===null){let f=p+_*4,v=d.matrixWorldInverse;o.getNormalMatrix(v),(m===null||m.length<f)&&(m=new Float32Array(f));for(let S=0,g=p;S!==_;++S,g+=4)a.copy(u[S]).applyMatrix4(v,o),a.normal.toArray(m,g),m[g+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,m}}function Im(n){let e=new WeakMap;function t(a,o){return o===ar?a.mapping=bs:o===Jo&&(a.mapping=Ts),a}function i(a){if(a&&a.isTexture){let o=a.mapping;if(o===ar||o===Jo)if(e.has(a)){let l=e.get(a).texture;return t(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new Pl(l.height);return c.fromEquirectangularTexture(n,a),e.set(a,c),a.addEventListener("dispose",s),t(c.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}var xa=class extends ya{constructor(e=-1,t=1,i=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,a=i+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},_s=4,Mh=[.125,.215,.35,.446,.526,.582],Vi=20,Co=new xa,bh=new Xe,Po=null,Io=0,Lo=0,Do=!1,ki=(1+Math.sqrt(5))/2,fs=1/ki,Th=[new D(-ki,fs,0),new D(ki,fs,0),new D(-fs,0,ki),new D(fs,0,ki),new D(0,ki,-fs),new D(0,ki,fs),new D(-1,1,-1),new D(1,1,-1),new D(-1,1,1),new D(1,1,1)],Cs=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,s=100){Po=this._renderer.getRenderTarget(),Io=this._renderer.getActiveCubeFace(),Lo=this._renderer.getActiveMipmapLevel(),Do=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,i,s,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=wh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ah(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Po,Io,Lo),this._renderer.xr.enabled=Do,e.scissorTest=!1,qr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===bs||e.mapping===Ts?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Po=this._renderer.getRenderTarget(),Io=this._renderer.getActiveCubeFace(),Lo=this._renderer.getActiveMipmapLevel(),Do=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:zn,minFilter:zn,generateMipmaps:!1,type:br,format:Ln,colorSpace:Os,depthBuffer:!1},s=Eh(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Eh(e,t,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Lm(r)),this._blurMaterial=Dm(r,e,t)}return s}_compileMaterial(e){let t=new Pe(this._lodPlanes[0],e);this._renderer.compile(t,Co)}_sceneToCubeUV(e,t,i,s){let o=new Zt(90,1,t,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(bh),h.toneMapping=Mi,h.autoClear=!1;let p=new xn({name:"PMREM.Background",side:Jt,depthWrite:!1,depthTest:!1}),y=new Pe(new an,p),_=!1,m=e.background;m?m.isColor&&(p.color.copy(m),e.background=null,_=!0):(p.color.copy(bh),_=!0);for(let f=0;f<6;f++){let v=f%3;v===0?(o.up.set(0,l[f],0),o.lookAt(c[f],0,0)):v===1?(o.up.set(0,0,l[f]),o.lookAt(0,c[f],0)):(o.up.set(0,l[f],0),o.lookAt(0,0,c[f]));let S=this._cubeSize;qr(s,v*S,f>2?S:0,S,S),h.setRenderTarget(s),_&&h.render(y,o),h.render(e,o)}y.geometry.dispose(),y.material.dispose(),h.toneMapping=d,h.autoClear=u,e.background=m}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===bs||e.mapping===Ts;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=wh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ah());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new Pe(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=e;let l=this._cubeSize;qr(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,Co)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=Th[(s-r-1)%Th.length];this._blur(e,r-1,r,a,o)}t.autoClear=i}_blur(e,t,i,s,r){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,s,"latitudinal",r),this._halfBlur(a,e,i,i,s,"longitudinal",r)}_halfBlur(e,t,i,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new Pe(this._lodPlanes[s],c),d=c.uniforms,p=this._sizeLods[i]-1,y=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*Vi-1),_=r/y,m=isFinite(r)?1+Math.floor(h*_):Vi;m>Vi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Vi}`);let f=[],v=0;for(let C=0;C<Vi;++C){let A=C/_,x=Math.exp(-A*A/2);f.push(x),C===0?v+=x:C<m&&(v+=2*x)}for(let C=0;C<f.length;C++)f[C]=f[C]/v;d.envMap.value=e.texture,d.samples.value=m,d.weights.value=f,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);let{_lodMax:S}=this;d.dTheta.value=y,d.mipInt.value=S-i;let g=this._sizeLods[s],L=3*g*(s>S-_s?s-S+_s:0),R=4*(this._cubeSize-g);qr(t,L,R,3*g,2*g),l.setRenderTarget(t),l.render(u,Co)}};function Lm(n){let e=[],t=[],i=[],s=n,r=n-_s+1+Mh.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let l=1/o;a>n-_s?l=Mh[a-n+_s-1]:a===0&&(l=0),i.push(l);let c=1/(o-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],p=6,y=6,_=3,m=2,f=1,v=new Float32Array(_*y*p),S=new Float32Array(m*y*p),g=new Float32Array(f*y*p);for(let R=0;R<p;R++){let C=R%3*2/3-1,A=R>2?0:-1,x=[C,A,0,C+2/3,A,0,C+2/3,A+1,0,C,A,0,C+2/3,A+1,0,C,A+1,0];v.set(x,_*y*R),S.set(d,m*y*R);let M=[R,R,R,R,R,R];g.set(M,f*y*R)}let L=new Lt;L.setAttribute("position",new jt(v,_)),L.setAttribute("uv",new jt(S,m)),L.setAttribute("faceIndex",new jt(g,f)),e.push(L),s>_s&&s--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function Eh(n,e,t){let i=new ri(n,e,t);return i.texture.mapping=Ya,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function qr(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function Dm(n,e,t){let i=new Float32Array(Vi),s=new D(0,1,0);return new on({name:"SphericalGaussianBlur",defines:{n:Vi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Mc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Si,depthTest:!1,depthWrite:!1})}function Ah(){return new on({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Mc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Si,depthTest:!1,depthWrite:!1})}function wh(){return new on({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Mc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Si,depthTest:!1,depthWrite:!1})}function Mc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Um(n){let e=new WeakMap,t=null;function i(o){if(o&&o.isTexture){let l=o.mapping,c=l===ar||l===Jo,h=l===bs||l===Ts;if(c||h){let u=e.get(o),d=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return t===null&&(t=new Cs(n)),u=c?t.fromEquirectangular(o,u):t.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),u.texture;if(u!==void 0)return u.texture;{let p=o.image;return c&&p&&p.height>0||h&&p&&s(p)?(t===null&&(t=new Cs(n)),u=c?t.fromEquirectangular(o):t.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),o.addEventListener("dispose",r),u.texture):null}}}return o}function s(o){let l=0,c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function r(o){let l=o.target;l.removeEventListener("dispose",r);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:a}}function Nm(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&Qs("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function Om(n,e,t,i){let s={},r=new WeakMap;function a(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let y in d.attributes)e.remove(d.attributes[y]);for(let y in d.morphAttributes){let _=d.morphAttributes[y];for(let m=0,f=_.length;m<f;m++)e.remove(_[m])}d.removeEventListener("dispose",a),delete s[d.id];let p=r.get(d);p&&(e.remove(p),r.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(u,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let y in d)e.update(d[y],n.ARRAY_BUFFER);let p=u.morphAttributes;for(let y in p){let _=p[y];for(let m=0,f=_.length;m<f;m++)e.update(_[m],n.ARRAY_BUFFER)}}function c(u){let d=[],p=u.index,y=u.attributes.position,_=0;if(p!==null){let v=p.array;_=p.version;for(let S=0,g=v.length;S<g;S+=3){let L=v[S+0],R=v[S+1],C=v[S+2];d.push(L,R,R,C,C,L)}}else if(y!==void 0){let v=y.array;_=y.version;for(let S=0,g=v.length/3-1;S<g;S+=3){let L=S+0,R=S+1,C=S+2;d.push(L,R,R,C,C,L)}}else return;let m=new(Sf(d)?_a:ga)(d,1);m.version=_;let f=r.get(u);f&&e.remove(f),r.set(u,m)}function h(u){let d=r.get(u);if(d){let p=u.index;p!==null&&d.version<p.version&&c(u)}else c(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function Fm(n,e,t){let i;function s(d){i=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,p){n.drawElements(i,p,r,d*a),t.update(p,i,1)}function c(d,p,y){y!==0&&(n.drawElementsInstanced(i,p,r,d*a,y),t.update(p,i,y))}function h(d,p,y){if(y===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,p,0,r,d,0,y);let m=0;for(let f=0;f<y;f++)m+=p[f];t.update(m,i,1)}function u(d,p,y,_){if(y===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<d.length;f++)c(d[f]/a,p[f],_[f]);else{m.multiDrawElementsInstancedWEBGL(i,p,0,r,d,0,_,0,y);let f=0;for(let v=0;v<y;v++)f+=p[v]*_[v];t.update(f,i,1)}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function Bm(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(r/3);break;case n.LINES:t.lines+=o*(r/2);break;case n.LINE_STRIP:t.lines+=o*(r-1);break;case n.LINE_LOOP:t.lines+=o*r;break;case n.POINTS:t.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function zm(n,e,t){let i=new WeakMap,s=new vt;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0,d=i.get(o);if(d===void 0||d.count!==u){let x=function(){C.dispose(),i.delete(o),o.removeEventListener("dispose",x)};d!==void 0&&d.texture.dispose();let p=o.morphAttributes.position!==void 0,y=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],f=o.morphAttributes.normal||[],v=o.morphAttributes.color||[],S=0;p===!0&&(S=1),y===!0&&(S=2),_===!0&&(S=3);let g=o.attributes.position.count*S,L=1;g>e.maxTextureSize&&(L=Math.ceil(g/e.maxTextureSize),g=e.maxTextureSize);let R=new Float32Array(g*L*4*u),C=new pa(R,g,L,u);C.type=kn,C.needsUpdate=!0;let A=S*4;for(let M=0;M<u;M++){let U=m[M],k=f[M],z=v[M],G=g*L*4*M;for(let Q=0;Q<U.count;Q++){let Y=Q*A;p===!0&&(s.fromBufferAttribute(U,Q),R[G+Y+0]=s.x,R[G+Y+1]=s.y,R[G+Y+2]=s.z,R[G+Y+3]=0),y===!0&&(s.fromBufferAttribute(k,Q),R[G+Y+4]=s.x,R[G+Y+5]=s.y,R[G+Y+6]=s.z,R[G+Y+7]=0),_===!0&&(s.fromBufferAttribute(z,Q),R[G+Y+8]=s.x,R[G+Y+9]=s.y,R[G+Y+10]=s.z,R[G+Y+11]=z.itemSize===4?s.w:1)}}d={count:u,texture:C,size:new ee(g,L)},i.set(o,d),o.addEventListener("dispose",x)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let p=0;for(let _=0;_<c.length;_++)p+=c[_];let y=o.morphTargetsRelative?1:1-p;l.getUniforms().setValue(n,"morphTargetBaseInfluence",y),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:r}}function km(n,e,t,i){let s=new WeakMap;function r(l){let c=i.render.frame,h=l.geometry,u=e.get(l,h);if(s.get(u)!==c&&(e.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let d=l.skeleton;s.get(d)!==c&&(d.update(),s.set(d,c))}return u}function a(){s=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:r,dispose:a}}var Sa=class extends rn{constructor(e,t,i,s,r,a,o,l,c,h=vs){if(h!==vs&&h!==As)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&h===vs&&(i=Xi),i===void 0&&h===As&&(i=Es),super(null,s,r,a,o,l,h,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:Kt,this.minFilter=l!==void 0?l:Kt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Ef=new rn,Rh=new Sa(1,1),Af=new pa,wf=new Rl,Rf=new va,Ch=[],Ph=[],Ih=new Float32Array(16),Lh=new Float32Array(9),Dh=new Float32Array(4);function Fs(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=Ch[s];if(r===void 0&&(r=new Float32Array(s),Ch[s]=r),e!==0){i.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(r,o)}return r}function Ft(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Bt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function $a(n,e){let t=Ph[e];t===void 0&&(t=new Int32Array(e),Ph[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Hm(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Vm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ft(t,e))return;n.uniform2fv(this.addr,e),Bt(t,e)}}function Gm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ft(t,e))return;n.uniform3fv(this.addr,e),Bt(t,e)}}function Wm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ft(t,e))return;n.uniform4fv(this.addr,e),Bt(t,e)}}function Xm(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ft(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Bt(t,e)}else{if(Ft(t,i))return;Dh.set(i),n.uniformMatrix2fv(this.addr,!1,Dh),Bt(t,i)}}function Ym(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ft(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Bt(t,e)}else{if(Ft(t,i))return;Lh.set(i),n.uniformMatrix3fv(this.addr,!1,Lh),Bt(t,i)}}function qm(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Ft(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Bt(t,e)}else{if(Ft(t,i))return;Ih.set(i),n.uniformMatrix4fv(this.addr,!1,Ih),Bt(t,i)}}function $m(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Zm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ft(t,e))return;n.uniform2iv(this.addr,e),Bt(t,e)}}function Jm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ft(t,e))return;n.uniform3iv(this.addr,e),Bt(t,e)}}function Km(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ft(t,e))return;n.uniform4iv(this.addr,e),Bt(t,e)}}function jm(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Qm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ft(t,e))return;n.uniform2uiv(this.addr,e),Bt(t,e)}}function eg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ft(t,e))return;n.uniform3uiv(this.addr,e),Bt(t,e)}}function tg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ft(t,e))return;n.uniform4uiv(this.addr,e),Bt(t,e)}}function ng(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(Rh.compareFunction=vf,r=Rh):r=Ef,t.setTexture2D(e||r,s)}function ig(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||wf,s)}function sg(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||Rf,s)}function rg(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||Af,s)}function ag(n){switch(n){case 5126:return Hm;case 35664:return Vm;case 35665:return Gm;case 35666:return Wm;case 35674:return Xm;case 35675:return Ym;case 35676:return qm;case 5124:case 35670:return $m;case 35667:case 35671:return Zm;case 35668:case 35672:return Jm;case 35669:case 35673:return Km;case 5125:return jm;case 36294:return Qm;case 36295:return eg;case 36296:return tg;case 35678:case 36198:case 36298:case 36306:case 35682:return ng;case 35679:case 36299:case 36307:return ig;case 35680:case 36300:case 36308:case 36293:return sg;case 36289:case 36303:case 36311:case 36292:return rg}}function og(n,e){n.uniform1fv(this.addr,e)}function lg(n,e){let t=Fs(e,this.size,2);n.uniform2fv(this.addr,t)}function cg(n,e){let t=Fs(e,this.size,3);n.uniform3fv(this.addr,t)}function hg(n,e){let t=Fs(e,this.size,4);n.uniform4fv(this.addr,t)}function fg(n,e){let t=Fs(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function ug(n,e){let t=Fs(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function dg(n,e){let t=Fs(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function pg(n,e){n.uniform1iv(this.addr,e)}function mg(n,e){n.uniform2iv(this.addr,e)}function gg(n,e){n.uniform3iv(this.addr,e)}function _g(n,e){n.uniform4iv(this.addr,e)}function yg(n,e){n.uniform1uiv(this.addr,e)}function vg(n,e){n.uniform2uiv(this.addr,e)}function xg(n,e){n.uniform3uiv(this.addr,e)}function Sg(n,e){n.uniform4uiv(this.addr,e)}function Mg(n,e,t){let i=this.cache,s=e.length,r=$a(t,s);Ft(i,r)||(n.uniform1iv(this.addr,r),Bt(i,r));for(let a=0;a!==s;++a)t.setTexture2D(e[a]||Ef,r[a])}function bg(n,e,t){let i=this.cache,s=e.length,r=$a(t,s);Ft(i,r)||(n.uniform1iv(this.addr,r),Bt(i,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||wf,r[a])}function Tg(n,e,t){let i=this.cache,s=e.length,r=$a(t,s);Ft(i,r)||(n.uniform1iv(this.addr,r),Bt(i,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||Rf,r[a])}function Eg(n,e,t){let i=this.cache,s=e.length,r=$a(t,s);Ft(i,r)||(n.uniform1iv(this.addr,r),Bt(i,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Af,r[a])}function Ag(n){switch(n){case 5126:return og;case 35664:return lg;case 35665:return cg;case 35666:return hg;case 35674:return fg;case 35675:return ug;case 35676:return dg;case 5124:case 35670:return pg;case 35667:case 35671:return mg;case 35668:case 35672:return gg;case 35669:case 35673:return _g;case 5125:return yg;case 36294:return vg;case 36295:return xg;case 36296:return Sg;case 35678:case 36198:case 36298:case 36306:case 35682:return Mg;case 35679:case 36299:case 36307:return bg;case 35680:case 36300:case 36308:case 36293:return Tg;case 36289:case 36303:case 36311:case 36292:return Eg}}var Il=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=ag(t.type)}},Ll=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Ag(t.type)}},Dl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],i)}}},Uo=/(\w+)(\])?(\[|\.)?/g;function Uh(n,e){n.seq.push(e),n.map[e.id]=e}function wg(n,e,t){let i=n.name,s=i.length;for(Uo.lastIndex=0;;){let r=Uo.exec(i),a=Uo.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){Uh(t,c===void 0?new Il(o,n,e):new Ll(o,n,e));break}else{let u=t.map[o];u===void 0&&(u=new Dl(o),Uh(t,u)),t=u}}}var Ss=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let r=e.getActiveUniform(t,s),a=e.getUniformLocation(t,r.name);wg(r,a,this)}}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&i.push(a)}return i}};function Nh(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var Rg=37297,Cg=0;function Pg(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}var Oh=new Qe;function Ig(n){at._getMatrix(Oh,at.workingColorSpace,n);let e=`mat3( ${Oh.elements.map(t=>t.toFixed(4))} )`;switch(at.getTransfer(n)){case qa:return[e,"LinearTransferOETF"];case yt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Fh(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=n.getShaderInfoLog(e).trim();if(i&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let a=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+Pg(n.getShaderSource(e),a)}else return s}function Lg(n,e){let t=Ig(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Dg(n,e){let t;switch(e){case Xu:t="Linear";break;case Yu:t="Reinhard";break;case qu:t="Cineon";break;case uc:t="ACESFilmic";break;case Zu:t="AgX";break;case Ju:t="Neutral";break;case $u:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var $r=new D;function Ug(){at.getLuminanceCoefficients($r);let n=$r.x.toFixed(4),e=$r.y.toFixed(4),t=$r.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Ng(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(er).join(`
`)}function Og(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Fg(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),a=r.name,o=1;r.type===n.FLOAT_MAT2&&(o=2),r.type===n.FLOAT_MAT3&&(o=3),r.type===n.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function er(n){return n!==""}function Bh(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function zh(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Bg=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ul(n){return n.replace(Bg,kg)}var zg=new Map;function kg(n,e){let t=tt[e];if(t===void 0){let i=zg.get(e);if(i!==void 0)t=tt[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Ul(t)}var Hg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function kh(n){return n.replace(Hg,Vg)}function Vg(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Hh(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Gg(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===of?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===fc?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===jn&&(e="SHADOWMAP_TYPE_VSM"),e}function Wg(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case bs:case Ts:e="ENVMAP_TYPE_CUBE";break;case Ya:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Xg(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case Ts:e="ENVMAP_MODE_REFRACTION";break}return e}function Yg(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case lf:e="ENVMAP_BLENDING_MULTIPLY";break;case Gu:e="ENVMAP_BLENDING_MIX";break;case Wu:e="ENVMAP_BLENDING_ADD";break}return e}function qg(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function $g(n,e,t,i){let s=n.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=Gg(t),c=Wg(t),h=Xg(t),u=Yg(t),d=qg(t),p=Ng(t),y=Og(r),_=s.createProgram(),m,f,v=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y].filter(er).join(`
`),m.length>0&&(m+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y].filter(er).join(`
`),f.length>0&&(f+=`
`)):(m=[Hh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(er).join(`
`),f=[Hh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Mi?"#define TONE_MAPPING":"",t.toneMapping!==Mi?tt.tonemapping_pars_fragment:"",t.toneMapping!==Mi?Dg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",tt.colorspace_pars_fragment,Lg("linearToOutputTexel",t.outputColorSpace),Ug(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(er).join(`
`)),a=Ul(a),a=Bh(a,t),a=zh(a,t),o=Ul(o),o=Bh(o,t),o=zh(o,t),a=kh(a),o=kh(o),t.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,f=["#define varying in",t.glslVersion===eh?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===eh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let S=v+m+a,g=v+f+o,L=Nh(s,s.VERTEX_SHADER,S),R=Nh(s,s.FRAGMENT_SHADER,g);s.attachShader(_,L),s.attachShader(_,R),t.index0AttributeName!==void 0?s.bindAttribLocation(_,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function C(U){if(n.debug.checkShaderErrors){let k=s.getProgramInfoLog(_).trim(),z=s.getShaderInfoLog(L).trim(),G=s.getShaderInfoLog(R).trim(),Q=!0,Y=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(Q=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,_,L,R);else{let se=Fh(s,L,"vertex"),q=Fh(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+U.name+`
Material Type: `+U.type+`

Program Info Log: `+k+`
`+se+`
`+q)}else k!==""?console.warn("THREE.WebGLProgram: Program Info Log:",k):(z===""||G==="")&&(Y=!1);Y&&(U.diagnostics={runnable:Q,programLog:k,vertexShader:{log:z,prefix:m},fragmentShader:{log:G,prefix:f}})}s.deleteShader(L),s.deleteShader(R),A=new Ss(s,_),x=Fg(s,_)}let A;this.getUniforms=function(){return A===void 0&&C(this),A};let x;this.getAttributes=function(){return x===void 0&&C(this),x};let M=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return M===!1&&(M=s.getProgramParameter(_,Rg)),M},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Cg++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=L,this.fragmentShader=R,this}var Zg=0,Nl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Ol(e),t.set(e,i)),i}},Ol=class{constructor(e){this.id=Zg++,this.code=e,this.usedTimes=0}};function Jg(n,e,t,i,s,r,a){let o=new ma,l=new Nl,c=new Set,h=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures,p=s.precision,y={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(x){return c.add(x),x===0?"uv":`uv${x}`}function m(x,M,U,k,z){let G=k.fog,Q=z.geometry,Y=x.isMeshStandardMaterial?k.environment:null,se=(x.isMeshStandardMaterial?t:e).get(x.envMap||Y),q=se&&se.mapping===Ya?se.image.height:null,ge=y[x.type];x.precision!==null&&(p=s.getMaxPrecision(x.precision),p!==x.precision&&console.warn("THREE.WebGLProgram.getParameters:",x.precision,"not supported, using",p,"instead."));let Me=Q.morphAttributes.position||Q.morphAttributes.normal||Q.morphAttributes.color,Ce=Me!==void 0?Me.length:0,We=0;Q.morphAttributes.position!==void 0&&(We=1),Q.morphAttributes.normal!==void 0&&(We=2),Q.morphAttributes.color!==void 0&&(We=3);let ct,K,fe,Ue;if(ge){let mt=Fn[ge];ct=mt.vertexShader,K=mt.fragmentShader}else ct=x.vertexShader,K=x.fragmentShader,l.update(x),fe=l.getVertexShaderID(x),Ue=l.getFragmentShaderID(x);let P=n.getRenderTarget(),Z=n.state.buffers.depth.getReversed(),pe=z.isInstancedMesh===!0,ye=z.isBatchedMesh===!0,nt=!!x.map,ne=!!x.matcap,ue=!!se,N=!!x.aoMap,He=!!x.lightMap,le=!!x.bumpMap,Re=!!x.normalMap,me=!!x.displacementMap,Ye=!!x.emissiveMap,Ae=!!x.metalnessMap,I=!!x.roughnessMap,E=x.anisotropy>0,H=x.clearcoat>0,J=x.dispersion>0,re=x.iridescence>0,j=x.sheen>0,Oe=x.transmission>0,ve=E&&!!x.anisotropyMap,we=H&&!!x.clearcoatMap,rt=H&&!!x.clearcoatNormalMap,ce=H&&!!x.clearcoatRoughnessMap,Le=re&&!!x.iridescenceMap,qe=re&&!!x.iridescenceThicknessMap,$e=j&&!!x.sheenColorMap,De=j&&!!x.sheenRoughnessMap,lt=!!x.specularMap,et=!!x.specularColorMap,St=!!x.specularIntensityMap,O=Oe&&!!x.transmissionMap,xe=Oe&&!!x.thicknessMap,$=!!x.gradientMap,te=!!x.alphaMap,Ee=x.alphaTest>0,be=!!x.alphaHash,Ke=!!x.extensions,It=Mi;x.toneMapped&&(P===null||P.isXRRenderTarget===!0)&&(It=n.toneMapping);let Yt={shaderID:ge,shaderType:x.type,shaderName:x.name,vertexShader:ct,fragmentShader:K,defines:x.defines,customVertexShaderID:fe,customFragmentShaderID:Ue,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:p,batching:ye,batchingColor:ye&&z._colorsTexture!==null,instancing:pe,instancingColor:pe&&z.instanceColor!==null,instancingMorph:pe&&z.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:P===null?n.outputColorSpace:P.isXRRenderTarget===!0?P.texture.colorSpace:Os,alphaToCoverage:!!x.alphaToCoverage,map:nt,matcap:ne,envMap:ue,envMapMode:ue&&se.mapping,envMapCubeUVHeight:q,aoMap:N,lightMap:He,bumpMap:le,normalMap:Re,displacementMap:d&&me,emissiveMap:Ye,normalMapObjectSpace:Re&&x.normalMapType===ed,normalMapTangentSpace:Re&&x.normalMapType===vc,metalnessMap:Ae,roughnessMap:I,anisotropy:E,anisotropyMap:ve,clearcoat:H,clearcoatMap:we,clearcoatNormalMap:rt,clearcoatRoughnessMap:ce,dispersion:J,iridescence:re,iridescenceMap:Le,iridescenceThicknessMap:qe,sheen:j,sheenColorMap:$e,sheenRoughnessMap:De,specularMap:lt,specularColorMap:et,specularIntensityMap:St,transmission:Oe,transmissionMap:O,thicknessMap:xe,gradientMap:$,opaque:x.transparent===!1&&x.blending===ei&&x.alphaToCoverage===!1,alphaMap:te,alphaTest:Ee,alphaHash:be,combine:x.combine,mapUv:nt&&_(x.map.channel),aoMapUv:N&&_(x.aoMap.channel),lightMapUv:He&&_(x.lightMap.channel),bumpMapUv:le&&_(x.bumpMap.channel),normalMapUv:Re&&_(x.normalMap.channel),displacementMapUv:me&&_(x.displacementMap.channel),emissiveMapUv:Ye&&_(x.emissiveMap.channel),metalnessMapUv:Ae&&_(x.metalnessMap.channel),roughnessMapUv:I&&_(x.roughnessMap.channel),anisotropyMapUv:ve&&_(x.anisotropyMap.channel),clearcoatMapUv:we&&_(x.clearcoatMap.channel),clearcoatNormalMapUv:rt&&_(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ce&&_(x.clearcoatRoughnessMap.channel),iridescenceMapUv:Le&&_(x.iridescenceMap.channel),iridescenceThicknessMapUv:qe&&_(x.iridescenceThicknessMap.channel),sheenColorMapUv:$e&&_(x.sheenColorMap.channel),sheenRoughnessMapUv:De&&_(x.sheenRoughnessMap.channel),specularMapUv:lt&&_(x.specularMap.channel),specularColorMapUv:et&&_(x.specularColorMap.channel),specularIntensityMapUv:St&&_(x.specularIntensityMap.channel),transmissionMapUv:O&&_(x.transmissionMap.channel),thicknessMapUv:xe&&_(x.thicknessMap.channel),alphaMapUv:te&&_(x.alphaMap.channel),vertexTangents:!!Q.attributes.tangent&&(Re||E),vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!Q.attributes.color&&Q.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!Q.attributes.uv&&(nt||te),fog:!!G,useFog:x.fog===!0,fogExp2:!!G&&G.isFogExp2,flatShading:x.flatShading===!0,sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Z,skinning:z.isSkinnedMesh===!0,morphTargets:Q.morphAttributes.position!==void 0,morphNormals:Q.morphAttributes.normal!==void 0,morphColors:Q.morphAttributes.color!==void 0,morphTargetsCount:Ce,morphTextureStride:We,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:x.dithering,shadowMapEnabled:n.shadowMap.enabled&&U.length>0,shadowMapType:n.shadowMap.type,toneMapping:It,decodeVideoTexture:nt&&x.map.isVideoTexture===!0&&at.getTransfer(x.map.colorSpace)===yt,decodeVideoTextureEmissive:Ye&&x.emissiveMap.isVideoTexture===!0&&at.getTransfer(x.emissiveMap.colorSpace)===yt,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===Je,flipSided:x.side===Jt,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:Ke&&x.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ke&&x.extensions.multiDraw===!0||ye)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Yt.vertexUv1s=c.has(1),Yt.vertexUv2s=c.has(2),Yt.vertexUv3s=c.has(3),c.clear(),Yt}function f(x){let M=[];if(x.shaderID?M.push(x.shaderID):(M.push(x.customVertexShaderID),M.push(x.customFragmentShaderID)),x.defines!==void 0)for(let U in x.defines)M.push(U),M.push(x.defines[U]);return x.isRawShaderMaterial===!1&&(v(M,x),S(M,x),M.push(n.outputColorSpace)),M.push(x.customProgramCacheKey),M.join()}function v(x,M){x.push(M.precision),x.push(M.outputColorSpace),x.push(M.envMapMode),x.push(M.envMapCubeUVHeight),x.push(M.mapUv),x.push(M.alphaMapUv),x.push(M.lightMapUv),x.push(M.aoMapUv),x.push(M.bumpMapUv),x.push(M.normalMapUv),x.push(M.displacementMapUv),x.push(M.emissiveMapUv),x.push(M.metalnessMapUv),x.push(M.roughnessMapUv),x.push(M.anisotropyMapUv),x.push(M.clearcoatMapUv),x.push(M.clearcoatNormalMapUv),x.push(M.clearcoatRoughnessMapUv),x.push(M.iridescenceMapUv),x.push(M.iridescenceThicknessMapUv),x.push(M.sheenColorMapUv),x.push(M.sheenRoughnessMapUv),x.push(M.specularMapUv),x.push(M.specularColorMapUv),x.push(M.specularIntensityMapUv),x.push(M.transmissionMapUv),x.push(M.thicknessMapUv),x.push(M.combine),x.push(M.fogExp2),x.push(M.sizeAttenuation),x.push(M.morphTargetsCount),x.push(M.morphAttributeCount),x.push(M.numDirLights),x.push(M.numPointLights),x.push(M.numSpotLights),x.push(M.numSpotLightMaps),x.push(M.numHemiLights),x.push(M.numRectAreaLights),x.push(M.numDirLightShadows),x.push(M.numPointLightShadows),x.push(M.numSpotLightShadows),x.push(M.numSpotLightShadowsWithMaps),x.push(M.numLightProbes),x.push(M.shadowMapType),x.push(M.toneMapping),x.push(M.numClippingPlanes),x.push(M.numClipIntersection),x.push(M.depthPacking)}function S(x,M){o.disableAll(),M.supportsVertexTextures&&o.enable(0),M.instancing&&o.enable(1),M.instancingColor&&o.enable(2),M.instancingMorph&&o.enable(3),M.matcap&&o.enable(4),M.envMap&&o.enable(5),M.normalMapObjectSpace&&o.enable(6),M.normalMapTangentSpace&&o.enable(7),M.clearcoat&&o.enable(8),M.iridescence&&o.enable(9),M.alphaTest&&o.enable(10),M.vertexColors&&o.enable(11),M.vertexAlphas&&o.enable(12),M.vertexUv1s&&o.enable(13),M.vertexUv2s&&o.enable(14),M.vertexUv3s&&o.enable(15),M.vertexTangents&&o.enable(16),M.anisotropy&&o.enable(17),M.alphaHash&&o.enable(18),M.batching&&o.enable(19),M.dispersion&&o.enable(20),M.batchingColor&&o.enable(21),x.push(o.mask),o.disableAll(),M.fog&&o.enable(0),M.useFog&&o.enable(1),M.flatShading&&o.enable(2),M.logarithmicDepthBuffer&&o.enable(3),M.reverseDepthBuffer&&o.enable(4),M.skinning&&o.enable(5),M.morphTargets&&o.enable(6),M.morphNormals&&o.enable(7),M.morphColors&&o.enable(8),M.premultipliedAlpha&&o.enable(9),M.shadowMapEnabled&&o.enable(10),M.doubleSided&&o.enable(11),M.flipSided&&o.enable(12),M.useDepthPacking&&o.enable(13),M.dithering&&o.enable(14),M.transmission&&o.enable(15),M.sheen&&o.enable(16),M.opaque&&o.enable(17),M.pointsUvs&&o.enable(18),M.decodeVideoTexture&&o.enable(19),M.decodeVideoTextureEmissive&&o.enable(20),M.alphaToCoverage&&o.enable(21),x.push(o.mask)}function g(x){let M=y[x.type],U;if(M){let k=Fn[M];U=Sc.clone(k.uniforms)}else U=x.uniforms;return U}function L(x,M){let U;for(let k=0,z=h.length;k<z;k++){let G=h[k];if(G.cacheKey===M){U=G,++U.usedTimes;break}}return U===void 0&&(U=new $g(n,M,x,r),h.push(U)),U}function R(x){if(--x.usedTimes===0){let M=h.indexOf(x);h[M]=h[h.length-1],h.pop(),x.destroy()}}function C(x){l.remove(x)}function A(){l.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:g,acquireProgram:L,releaseProgram:R,releaseShaderCache:C,programs:h,dispose:A}}function Kg(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function s(a,o,l){n.get(a)[o]=l}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function jg(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Vh(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Gh(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function a(u,d,p,y,_,m){let f=n[e];return f===void 0?(f={id:u.id,object:u,geometry:d,material:p,groupOrder:y,renderOrder:u.renderOrder,z:_,group:m},n[e]=f):(f.id=u.id,f.object=u,f.geometry=d,f.material=p,f.groupOrder=y,f.renderOrder=u.renderOrder,f.z=_,f.group=m),e++,f}function o(u,d,p,y,_,m){let f=a(u,d,p,y,_,m);p.transmission>0?i.push(f):p.transparent===!0?s.push(f):t.push(f)}function l(u,d,p,y,_,m){let f=a(u,d,p,y,_,m);p.transmission>0?i.unshift(f):p.transparent===!0?s.unshift(f):t.unshift(f)}function c(u,d){t.length>1&&t.sort(u||jg),i.length>1&&i.sort(d||Vh),s.length>1&&s.sort(d||Vh)}function h(){for(let u=e,d=n.length;u<d;u++){let p=n[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:o,unshift:l,finish:h,sort:c}}function Qg(){let n=new WeakMap;function e(i,s){let r=n.get(i),a;return r===void 0?(a=new Gh,n.set(i,[a])):s>=r.length?(a=new Gh,r.push(a)):a=r[s],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function e1(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new D,color:new Xe};break;case"SpotLight":t={position:new D,direction:new D,color:new Xe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new D,color:new Xe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new D,skyColor:new Xe,groundColor:new Xe};break;case"RectAreaLight":t={color:new Xe,position:new D,halfWidth:new D,halfHeight:new D};break}return n[e.id]=t,t}}}function t1(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ee};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ee};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ee,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var n1=0;function i1(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function s1(n){let e=new e1,t=t1(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new D);let s=new D,r=new ut,a=new ut;function o(c){let h=0,u=0,d=0;for(let x=0;x<9;x++)i.probe[x].set(0,0,0);let p=0,y=0,_=0,m=0,f=0,v=0,S=0,g=0,L=0,R=0,C=0;c.sort(i1);for(let x=0,M=c.length;x<M;x++){let U=c[x],k=U.color,z=U.intensity,G=U.distance,Q=U.shadow&&U.shadow.map?U.shadow.map.texture:null;if(U.isAmbientLight)h+=k.r*z,u+=k.g*z,d+=k.b*z;else if(U.isLightProbe){for(let Y=0;Y<9;Y++)i.probe[Y].addScaledVector(U.sh.coefficients[Y],z);C++}else if(U.isDirectionalLight){let Y=e.get(U);if(Y.color.copy(U.color).multiplyScalar(U.intensity),U.castShadow){let se=U.shadow,q=t.get(U);q.shadowIntensity=se.intensity,q.shadowBias=se.bias,q.shadowNormalBias=se.normalBias,q.shadowRadius=se.radius,q.shadowMapSize=se.mapSize,i.directionalShadow[p]=q,i.directionalShadowMap[p]=Q,i.directionalShadowMatrix[p]=U.shadow.matrix,v++}i.directional[p]=Y,p++}else if(U.isSpotLight){let Y=e.get(U);Y.position.setFromMatrixPosition(U.matrixWorld),Y.color.copy(k).multiplyScalar(z),Y.distance=G,Y.coneCos=Math.cos(U.angle),Y.penumbraCos=Math.cos(U.angle*(1-U.penumbra)),Y.decay=U.decay,i.spot[_]=Y;let se=U.shadow;if(U.map&&(i.spotLightMap[L]=U.map,L++,se.updateMatrices(U),U.castShadow&&R++),i.spotLightMatrix[_]=se.matrix,U.castShadow){let q=t.get(U);q.shadowIntensity=se.intensity,q.shadowBias=se.bias,q.shadowNormalBias=se.normalBias,q.shadowRadius=se.radius,q.shadowMapSize=se.mapSize,i.spotShadow[_]=q,i.spotShadowMap[_]=Q,g++}_++}else if(U.isRectAreaLight){let Y=e.get(U);Y.color.copy(k).multiplyScalar(z),Y.halfWidth.set(U.width*.5,0,0),Y.halfHeight.set(0,U.height*.5,0),i.rectArea[m]=Y,m++}else if(U.isPointLight){let Y=e.get(U);if(Y.color.copy(U.color).multiplyScalar(U.intensity),Y.distance=U.distance,Y.decay=U.decay,U.castShadow){let se=U.shadow,q=t.get(U);q.shadowIntensity=se.intensity,q.shadowBias=se.bias,q.shadowNormalBias=se.normalBias,q.shadowRadius=se.radius,q.shadowMapSize=se.mapSize,q.shadowCameraNear=se.camera.near,q.shadowCameraFar=se.camera.far,i.pointShadow[y]=q,i.pointShadowMap[y]=Q,i.pointShadowMatrix[y]=U.shadow.matrix,S++}i.point[y]=Y,y++}else if(U.isHemisphereLight){let Y=e.get(U);Y.skyColor.copy(U.color).multiplyScalar(z),Y.groundColor.copy(U.groundColor).multiplyScalar(z),i.hemi[f]=Y,f++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=_e.LTC_FLOAT_1,i.rectAreaLTC2=_e.LTC_FLOAT_2):(i.rectAreaLTC1=_e.LTC_HALF_1,i.rectAreaLTC2=_e.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=d;let A=i.hash;(A.directionalLength!==p||A.pointLength!==y||A.spotLength!==_||A.rectAreaLength!==m||A.hemiLength!==f||A.numDirectionalShadows!==v||A.numPointShadows!==S||A.numSpotShadows!==g||A.numSpotMaps!==L||A.numLightProbes!==C)&&(i.directional.length=p,i.spot.length=_,i.rectArea.length=m,i.point.length=y,i.hemi.length=f,i.directionalShadow.length=v,i.directionalShadowMap.length=v,i.pointShadow.length=S,i.pointShadowMap.length=S,i.spotShadow.length=g,i.spotShadowMap.length=g,i.directionalShadowMatrix.length=v,i.pointShadowMatrix.length=S,i.spotLightMatrix.length=g+L-R,i.spotLightMap.length=L,i.numSpotLightShadowsWithMaps=R,i.numLightProbes=C,A.directionalLength=p,A.pointLength=y,A.spotLength=_,A.rectAreaLength=m,A.hemiLength=f,A.numDirectionalShadows=v,A.numPointShadows=S,A.numSpotShadows=g,A.numSpotMaps=L,A.numLightProbes=C,i.version=n1++)}function l(c,h){let u=0,d=0,p=0,y=0,_=0,m=h.matrixWorldInverse;for(let f=0,v=c.length;f<v;f++){let S=c[f];if(S.isDirectionalLight){let g=i.directional[u];g.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),g.direction.sub(s),g.direction.transformDirection(m),u++}else if(S.isSpotLight){let g=i.spot[p];g.position.setFromMatrixPosition(S.matrixWorld),g.position.applyMatrix4(m),g.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),g.direction.sub(s),g.direction.transformDirection(m),p++}else if(S.isRectAreaLight){let g=i.rectArea[y];g.position.setFromMatrixPosition(S.matrixWorld),g.position.applyMatrix4(m),a.identity(),r.copy(S.matrixWorld),r.premultiply(m),a.extractRotation(r),g.halfWidth.set(S.width*.5,0,0),g.halfHeight.set(0,S.height*.5,0),g.halfWidth.applyMatrix4(a),g.halfHeight.applyMatrix4(a),y++}else if(S.isPointLight){let g=i.point[d];g.position.setFromMatrixPosition(S.matrixWorld),g.position.applyMatrix4(m),d++}else if(S.isHemisphereLight){let g=i.hemi[_];g.direction.setFromMatrixPosition(S.matrixWorld),g.direction.transformDirection(m),_++}}}return{setup:o,setupView:l,state:i}}function Wh(n){let e=new s1(n),t=[],i=[];function s(h){c.camera=h,t.length=0,i.length=0}function r(h){t.push(h)}function a(h){i.push(h)}function o(){e.setup(t)}function l(h){e.setupView(t,h)}let c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function r1(n){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new Wh(n),e.set(s,[o])):r>=a.length?(o=new Wh(n),a.push(o)):o=a[r],o}function i(){e=new WeakMap}return{get:t,dispose:i}}var Fl=class extends Vn{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=ju,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Bl=class extends Vn{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},a1=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,o1=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function l1(n,e,t){let i=new cr,s=new ee,r=new ee,a=new vt,o=new Fl({depthPacking:Qu}),l=new Bl,c={},h=t.maxTextureSize,u={[sn]:Jt,[Jt]:sn,[Je]:Je},d=new on({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ee},radius:{value:4}},vertexShader:a1,fragmentShader:o1}),p=d.clone();p.defines.HORIZONTAL_PASS=1;let y=new Lt;y.setAttribute("position",new jt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new Pe(y,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=of;let f=this.type;this.render=function(R,C,A){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||R.length===0)return;let x=n.getRenderTarget(),M=n.getActiveCubeFace(),U=n.getActiveMipmapLevel(),k=n.state;k.setBlending(Si),k.buffers.color.setClear(1,1,1,1),k.buffers.depth.setTest(!0),k.setScissorTest(!1);let z=f!==jn&&this.type===jn,G=f===jn&&this.type!==jn;for(let Q=0,Y=R.length;Q<Y;Q++){let se=R[Q],q=se.shadow;if(q===void 0){console.warn("THREE.WebGLShadowMap:",se,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;s.copy(q.mapSize);let ge=q.getFrameExtents();if(s.multiply(ge),r.copy(q.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/ge.x),s.x=r.x*ge.x,q.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/ge.y),s.y=r.y*ge.y,q.mapSize.y=r.y)),q.map===null||z===!0||G===!0){let Ce=this.type!==jn?{minFilter:Kt,magFilter:Kt}:{};q.map!==null&&q.map.dispose(),q.map=new ri(s.x,s.y,Ce),q.map.texture.name=se.name+".shadowMap",q.camera.updateProjectionMatrix()}n.setRenderTarget(q.map),n.clear();let Me=q.getViewportCount();for(let Ce=0;Ce<Me;Ce++){let We=q.getViewport(Ce);a.set(r.x*We.x,r.y*We.y,r.x*We.z,r.y*We.w),k.viewport(a),q.updateMatrices(se,Ce),i=q.getFrustum(),g(C,A,q.camera,se,this.type)}q.isPointLightShadow!==!0&&this.type===jn&&v(q,A),q.needsUpdate=!1}f=this.type,m.needsUpdate=!1,n.setRenderTarget(x,M,U)};function v(R,C){let A=e.update(_);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,p.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new ri(s.x,s.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,n.setRenderTarget(R.mapPass),n.clear(),n.renderBufferDirect(C,null,A,d,_,null),p.uniforms.shadow_pass.value=R.mapPass.texture,p.uniforms.resolution.value=R.mapSize,p.uniforms.radius.value=R.radius,n.setRenderTarget(R.map),n.clear(),n.renderBufferDirect(C,null,A,p,_,null)}function S(R,C,A,x){let M=null,U=A.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(U!==void 0)M=U;else if(M=A.isPointLight===!0?l:o,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0){let k=M.uuid,z=C.uuid,G=c[k];G===void 0&&(G={},c[k]=G);let Q=G[z];Q===void 0&&(Q=M.clone(),G[z]=Q,C.addEventListener("dispose",L)),M=Q}if(M.visible=C.visible,M.wireframe=C.wireframe,x===jn?M.side=C.shadowSide!==null?C.shadowSide:C.side:M.side=C.shadowSide!==null?C.shadowSide:u[C.side],M.alphaMap=C.alphaMap,M.alphaTest=C.alphaTest,M.map=C.map,M.clipShadows=C.clipShadows,M.clippingPlanes=C.clippingPlanes,M.clipIntersection=C.clipIntersection,M.displacementMap=C.displacementMap,M.displacementScale=C.displacementScale,M.displacementBias=C.displacementBias,M.wireframeLinewidth=C.wireframeLinewidth,M.linewidth=C.linewidth,A.isPointLight===!0&&M.isMeshDistanceMaterial===!0){let k=n.properties.get(M);k.light=A}return M}function g(R,C,A,x,M){if(R.visible===!1)return;if(R.layers.test(C.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&M===jn)&&(!R.frustumCulled||i.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(A.matrixWorldInverse,R.matrixWorld);let z=e.update(R),G=R.material;if(Array.isArray(G)){let Q=z.groups;for(let Y=0,se=Q.length;Y<se;Y++){let q=Q[Y],ge=G[q.materialIndex];if(ge&&ge.visible){let Me=S(R,ge,x,M);R.onBeforeShadow(n,R,C,A,z,Me,q),n.renderBufferDirect(A,null,z,Me,R,q),R.onAfterShadow(n,R,C,A,z,Me,q)}}}else if(G.visible){let Q=S(R,G,x,M);R.onBeforeShadow(n,R,C,A,z,Q,null),n.renderBufferDirect(A,null,z,Q,R,null),R.onAfterShadow(n,R,C,A,z,Q,null)}}let k=R.children;for(let z=0,G=k.length;z<G;z++)g(k[z],C,A,x,M)}function L(R){R.target.removeEventListener("dispose",L);for(let A in c){let x=c[A],M=R.target.uuid;M in x&&(x[M].dispose(),delete x[M])}}}var c1={[Go]:Wo,[Xo]:$o,[Yo]:Zo,[Ms]:qo,[Wo]:Go,[$o]:Xo,[Zo]:Yo,[qo]:Ms};function h1(n,e){function t(){let O=!1,xe=new vt,$=null,te=new vt(0,0,0,0);return{setMask:function(Ee){$!==Ee&&!O&&(n.colorMask(Ee,Ee,Ee,Ee),$=Ee)},setLocked:function(Ee){O=Ee},setClear:function(Ee,be,Ke,It,Yt){Yt===!0&&(Ee*=It,be*=It,Ke*=It),xe.set(Ee,be,Ke,It),te.equals(xe)===!1&&(n.clearColor(Ee,be,Ke,It),te.copy(xe))},reset:function(){O=!1,$=null,te.set(-1,0,0,0)}}}function i(){let O=!1,xe=!1,$=null,te=null,Ee=null;return{setReversed:function(be){if(xe!==be){let Ke=e.get("EXT_clip_control");xe?Ke.clipControlEXT(Ke.LOWER_LEFT_EXT,Ke.ZERO_TO_ONE_EXT):Ke.clipControlEXT(Ke.LOWER_LEFT_EXT,Ke.NEGATIVE_ONE_TO_ONE_EXT);let It=Ee;Ee=null,this.setClear(It)}xe=be},getReversed:function(){return xe},setTest:function(be){be?P(n.DEPTH_TEST):Z(n.DEPTH_TEST)},setMask:function(be){$!==be&&!O&&(n.depthMask(be),$=be)},setFunc:function(be){if(xe&&(be=c1[be]),te!==be){switch(be){case Go:n.depthFunc(n.NEVER);break;case Wo:n.depthFunc(n.ALWAYS);break;case Xo:n.depthFunc(n.LESS);break;case Ms:n.depthFunc(n.LEQUAL);break;case Yo:n.depthFunc(n.EQUAL);break;case qo:n.depthFunc(n.GEQUAL);break;case $o:n.depthFunc(n.GREATER);break;case Zo:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}te=be}},setLocked:function(be){O=be},setClear:function(be){Ee!==be&&(xe&&(be=1-be),n.clearDepth(be),Ee=be)},reset:function(){O=!1,$=null,te=null,Ee=null,xe=!1}}}function s(){let O=!1,xe=null,$=null,te=null,Ee=null,be=null,Ke=null,It=null,Yt=null;return{setTest:function(mt){O||(mt?P(n.STENCIL_TEST):Z(n.STENCIL_TEST))},setMask:function(mt){xe!==mt&&!O&&(n.stencilMask(mt),xe=mt)},setFunc:function(mt,En,Xn){($!==mt||te!==En||Ee!==Xn)&&(n.stencilFunc(mt,En,Xn),$=mt,te=En,Ee=Xn)},setOp:function(mt,En,Xn){(be!==mt||Ke!==En||It!==Xn)&&(n.stencilOp(mt,En,Xn),be=mt,Ke=En,It=Xn)},setLocked:function(mt){O=mt},setClear:function(mt){Yt!==mt&&(n.clearStencil(mt),Yt=mt)},reset:function(){O=!1,xe=null,$=null,te=null,Ee=null,be=null,Ke=null,It=null,Yt=null}}}let r=new t,a=new i,o=new s,l=new WeakMap,c=new WeakMap,h={},u={},d=new WeakMap,p=[],y=null,_=!1,m=null,f=null,v=null,S=null,g=null,L=null,R=null,C=new Xe(0,0,0),A=0,x=!1,M=null,U=null,k=null,z=null,G=null,Q=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Y=!1,se=0,q=n.getParameter(n.VERSION);q.indexOf("WebGL")!==-1?(se=parseFloat(/^WebGL (\d)/.exec(q)[1]),Y=se>=1):q.indexOf("OpenGL ES")!==-1&&(se=parseFloat(/^OpenGL ES (\d)/.exec(q)[1]),Y=se>=2);let ge=null,Me={},Ce=n.getParameter(n.SCISSOR_BOX),We=n.getParameter(n.VIEWPORT),ct=new vt().fromArray(Ce),K=new vt().fromArray(We);function fe(O,xe,$,te){let Ee=new Uint8Array(4),be=n.createTexture();n.bindTexture(O,be),n.texParameteri(O,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(O,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Ke=0;Ke<$;Ke++)O===n.TEXTURE_3D||O===n.TEXTURE_2D_ARRAY?n.texImage3D(xe,0,n.RGBA,1,1,te,0,n.RGBA,n.UNSIGNED_BYTE,Ee):n.texImage2D(xe+Ke,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Ee);return be}let Ue={};Ue[n.TEXTURE_2D]=fe(n.TEXTURE_2D,n.TEXTURE_2D,1),Ue[n.TEXTURE_CUBE_MAP]=fe(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),Ue[n.TEXTURE_2D_ARRAY]=fe(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Ue[n.TEXTURE_3D]=fe(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),P(n.DEPTH_TEST),a.setFunc(Ms),le(!1),Re(qc),P(n.CULL_FACE),N(Si);function P(O){h[O]!==!0&&(n.enable(O),h[O]=!0)}function Z(O){h[O]!==!1&&(n.disable(O),h[O]=!1)}function pe(O,xe){return u[O]!==xe?(n.bindFramebuffer(O,xe),u[O]=xe,O===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=xe),O===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=xe),!0):!1}function ye(O,xe){let $=p,te=!1;if(O){$=d.get(xe),$===void 0&&($=[],d.set(xe,$));let Ee=O.textures;if($.length!==Ee.length||$[0]!==n.COLOR_ATTACHMENT0){for(let be=0,Ke=Ee.length;be<Ke;be++)$[be]=n.COLOR_ATTACHMENT0+be;$.length=Ee.length,te=!0}}else $[0]!==n.BACK&&($[0]=n.BACK,te=!0);te&&n.drawBuffers($)}function nt(O){return y!==O?(n.useProgram(O),y=O,!0):!1}let ne={[Hi]:n.FUNC_ADD,[Au]:n.FUNC_SUBTRACT,[wu]:n.FUNC_REVERSE_SUBTRACT};ne[Ru]=n.MIN,ne[Cu]=n.MAX;let ue={[Pu]:n.ZERO,[Iu]:n.ONE,[Lu]:n.SRC_COLOR,[Ho]:n.SRC_ALPHA,[Bu]:n.SRC_ALPHA_SATURATE,[Ou]:n.DST_COLOR,[Uu]:n.DST_ALPHA,[Du]:n.ONE_MINUS_SRC_COLOR,[Vo]:n.ONE_MINUS_SRC_ALPHA,[Fu]:n.ONE_MINUS_DST_COLOR,[Nu]:n.ONE_MINUS_DST_ALPHA,[zu]:n.CONSTANT_COLOR,[ku]:n.ONE_MINUS_CONSTANT_COLOR,[Hu]:n.CONSTANT_ALPHA,[Vu]:n.ONE_MINUS_CONSTANT_ALPHA};function N(O,xe,$,te,Ee,be,Ke,It,Yt,mt){if(O===Si){_===!0&&(Z(n.BLEND),_=!1);return}if(_===!1&&(P(n.BLEND),_=!0),O!==Eu){if(O!==m||mt!==x){if((f!==Hi||g!==Hi)&&(n.blendEquation(n.FUNC_ADD),f=Hi,g=Hi),mt)switch(O){case ei:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ot:n.blendFunc(n.ONE,n.ONE);break;case $c:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Zc:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}else switch(O){case ei:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ot:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case $c:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Zc:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",O);break}v=null,S=null,L=null,R=null,C.set(0,0,0),A=0,m=O,x=mt}return}Ee=Ee||xe,be=be||$,Ke=Ke||te,(xe!==f||Ee!==g)&&(n.blendEquationSeparate(ne[xe],ne[Ee]),f=xe,g=Ee),($!==v||te!==S||be!==L||Ke!==R)&&(n.blendFuncSeparate(ue[$],ue[te],ue[be],ue[Ke]),v=$,S=te,L=be,R=Ke),(It.equals(C)===!1||Yt!==A)&&(n.blendColor(It.r,It.g,It.b,Yt),C.copy(It),A=Yt),m=O,x=!1}function He(O,xe){O.side===Je?Z(n.CULL_FACE):P(n.CULL_FACE);let $=O.side===Jt;xe&&($=!$),le($),O.blending===ei&&O.transparent===!1?N(Si):N(O.blending,O.blendEquation,O.blendSrc,O.blendDst,O.blendEquationAlpha,O.blendSrcAlpha,O.blendDstAlpha,O.blendColor,O.blendAlpha,O.premultipliedAlpha),a.setFunc(O.depthFunc),a.setTest(O.depthTest),a.setMask(O.depthWrite),r.setMask(O.colorWrite);let te=O.stencilWrite;o.setTest(te),te&&(o.setMask(O.stencilWriteMask),o.setFunc(O.stencilFunc,O.stencilRef,O.stencilFuncMask),o.setOp(O.stencilFail,O.stencilZFail,O.stencilZPass)),Ye(O.polygonOffset,O.polygonOffsetFactor,O.polygonOffsetUnits),O.alphaToCoverage===!0?P(n.SAMPLE_ALPHA_TO_COVERAGE):Z(n.SAMPLE_ALPHA_TO_COVERAGE)}function le(O){M!==O&&(O?n.frontFace(n.CW):n.frontFace(n.CCW),M=O)}function Re(O){O!==bu?(P(n.CULL_FACE),O!==U&&(O===qc?n.cullFace(n.BACK):O===Tu?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Z(n.CULL_FACE),U=O}function me(O){O!==k&&(Y&&n.lineWidth(O),k=O)}function Ye(O,xe,$){O?(P(n.POLYGON_OFFSET_FILL),(z!==xe||G!==$)&&(n.polygonOffset(xe,$),z=xe,G=$)):Z(n.POLYGON_OFFSET_FILL)}function Ae(O){O?P(n.SCISSOR_TEST):Z(n.SCISSOR_TEST)}function I(O){O===void 0&&(O=n.TEXTURE0+Q-1),ge!==O&&(n.activeTexture(O),ge=O)}function E(O,xe,$){$===void 0&&(ge===null?$=n.TEXTURE0+Q-1:$=ge);let te=Me[$];te===void 0&&(te={type:void 0,texture:void 0},Me[$]=te),(te.type!==O||te.texture!==xe)&&(ge!==$&&(n.activeTexture($),ge=$),n.bindTexture(O,xe||Ue[O]),te.type=O,te.texture=xe)}function H(){let O=Me[ge];O!==void 0&&O.type!==void 0&&(n.bindTexture(O.type,null),O.type=void 0,O.texture=void 0)}function J(){try{n.compressedTexImage2D.apply(n,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function re(){try{n.compressedTexImage3D.apply(n,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function j(){try{n.texSubImage2D.apply(n,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Oe(){try{n.texSubImage3D.apply(n,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ve(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function we(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function rt(){try{n.texStorage2D.apply(n,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function ce(){try{n.texStorage3D.apply(n,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function Le(){try{n.texImage2D.apply(n,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function qe(){try{n.texImage3D.apply(n,arguments)}catch(O){console.error("THREE.WebGLState:",O)}}function $e(O){ct.equals(O)===!1&&(n.scissor(O.x,O.y,O.z,O.w),ct.copy(O))}function De(O){K.equals(O)===!1&&(n.viewport(O.x,O.y,O.z,O.w),K.copy(O))}function lt(O,xe){let $=c.get(xe);$===void 0&&($=new WeakMap,c.set(xe,$));let te=$.get(O);te===void 0&&(te=n.getUniformBlockIndex(xe,O.name),$.set(O,te))}function et(O,xe){let te=c.get(xe).get(O);l.get(xe)!==te&&(n.uniformBlockBinding(xe,te,O.__bindingPointIndex),l.set(xe,te))}function St(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),h={},ge=null,Me={},u={},d=new WeakMap,p=[],y=null,_=!1,m=null,f=null,v=null,S=null,g=null,L=null,R=null,C=new Xe(0,0,0),A=0,x=!1,M=null,U=null,k=null,z=null,G=null,ct.set(0,0,n.canvas.width,n.canvas.height),K.set(0,0,n.canvas.width,n.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:P,disable:Z,bindFramebuffer:pe,drawBuffers:ye,useProgram:nt,setBlending:N,setMaterial:He,setFlipSided:le,setCullFace:Re,setLineWidth:me,setPolygonOffset:Ye,setScissorTest:Ae,activeTexture:I,bindTexture:E,unbindTexture:H,compressedTexImage2D:J,compressedTexImage3D:re,texImage2D:Le,texImage3D:qe,updateUBOMapping:lt,uniformBlockBinding:et,texStorage2D:rt,texStorage3D:ce,texSubImage2D:j,texSubImage3D:Oe,compressedTexSubImage2D:ve,compressedTexSubImage3D:we,scissor:$e,viewport:De,reset:St}}function Xh(n,e,t,i){let s=f1(i);switch(t){case df:return n*e;case mf:return n*e;case gf:return n*e*2;case Tr:return n*e/s.components*s.byteLength;case gc:return n*e/s.components*s.byteLength;case _f:return n*e*2/s.components*s.byteLength;case _c:return n*e*2/s.components*s.byteLength;case pf:return n*e*3/s.components*s.byteLength;case Ln:return n*e*4/s.components*s.byteLength;case yc:return n*e*4/s.components*s.byteLength;case ra:case aa:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case oa:case la:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Qo:case tl:return Math.max(n,16)*Math.max(e,8)/4;case jo:case el:return Math.max(n,8)*Math.max(e,8)/2;case nl:case il:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case sl:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case rl:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case al:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case ol:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case ll:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case cl:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case hl:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case fl:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case ul:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case dl:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case pl:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case ml:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case gl:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case _l:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case yl:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case ca:case vl:case xl:return Math.ceil(n/4)*Math.ceil(e/4)*16;case yf:case Sl:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Ml:case bl:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function f1(n){switch(n){case ii:case hf:return{byteLength:1,components:1};case or:case ff:case br:return{byteLength:2,components:1};case pc:case mc:return{byteLength:2,components:4};case Xi:case dc:case kn:return{byteLength:4,components:1};case uf:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}function u1(n,e,t,i,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ee,h=new WeakMap,u,d=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(I,E){return p?new OffscreenCanvas(I,E):ua("canvas")}function _(I,E,H){let J=1,re=Ae(I);if((re.width>H||re.height>H)&&(J=H/Math.max(re.width,re.height)),J<1)if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&I instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&I instanceof ImageBitmap||typeof VideoFrame<"u"&&I instanceof VideoFrame){let j=Math.floor(J*re.width),Oe=Math.floor(J*re.height);u===void 0&&(u=y(j,Oe));let ve=E?y(j,Oe):u;return ve.width=j,ve.height=Oe,ve.getContext("2d").drawImage(I,0,0,j,Oe),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+re.width+"x"+re.height+") to ("+j+"x"+Oe+")."),ve}else return"data"in I&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+re.width+"x"+re.height+")."),I;return I}function m(I){return I.generateMipmaps}function f(I){n.generateMipmap(I)}function v(I){return I.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:I.isWebGL3DRenderTarget?n.TEXTURE_3D:I.isWebGLArrayRenderTarget||I.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function S(I,E,H,J,re=!1){if(I!==null){if(n[I]!==void 0)return n[I];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+I+"'")}let j=E;if(E===n.RED&&(H===n.FLOAT&&(j=n.R32F),H===n.HALF_FLOAT&&(j=n.R16F),H===n.UNSIGNED_BYTE&&(j=n.R8)),E===n.RED_INTEGER&&(H===n.UNSIGNED_BYTE&&(j=n.R8UI),H===n.UNSIGNED_SHORT&&(j=n.R16UI),H===n.UNSIGNED_INT&&(j=n.R32UI),H===n.BYTE&&(j=n.R8I),H===n.SHORT&&(j=n.R16I),H===n.INT&&(j=n.R32I)),E===n.RG&&(H===n.FLOAT&&(j=n.RG32F),H===n.HALF_FLOAT&&(j=n.RG16F),H===n.UNSIGNED_BYTE&&(j=n.RG8)),E===n.RG_INTEGER&&(H===n.UNSIGNED_BYTE&&(j=n.RG8UI),H===n.UNSIGNED_SHORT&&(j=n.RG16UI),H===n.UNSIGNED_INT&&(j=n.RG32UI),H===n.BYTE&&(j=n.RG8I),H===n.SHORT&&(j=n.RG16I),H===n.INT&&(j=n.RG32I)),E===n.RGB_INTEGER&&(H===n.UNSIGNED_BYTE&&(j=n.RGB8UI),H===n.UNSIGNED_SHORT&&(j=n.RGB16UI),H===n.UNSIGNED_INT&&(j=n.RGB32UI),H===n.BYTE&&(j=n.RGB8I),H===n.SHORT&&(j=n.RGB16I),H===n.INT&&(j=n.RGB32I)),E===n.RGBA_INTEGER&&(H===n.UNSIGNED_BYTE&&(j=n.RGBA8UI),H===n.UNSIGNED_SHORT&&(j=n.RGBA16UI),H===n.UNSIGNED_INT&&(j=n.RGBA32UI),H===n.BYTE&&(j=n.RGBA8I),H===n.SHORT&&(j=n.RGBA16I),H===n.INT&&(j=n.RGBA32I)),E===n.RGB&&H===n.UNSIGNED_INT_5_9_9_9_REV&&(j=n.RGB9_E5),E===n.RGBA){let Oe=re?qa:at.getTransfer(J);H===n.FLOAT&&(j=n.RGBA32F),H===n.HALF_FLOAT&&(j=n.RGBA16F),H===n.UNSIGNED_BYTE&&(j=Oe===yt?n.SRGB8_ALPHA8:n.RGBA8),H===n.UNSIGNED_SHORT_4_4_4_4&&(j=n.RGBA4),H===n.UNSIGNED_SHORT_5_5_5_1&&(j=n.RGB5_A1)}return(j===n.R16F||j===n.R32F||j===n.RG16F||j===n.RG32F||j===n.RGBA16F||j===n.RGBA32F)&&e.get("EXT_color_buffer_float"),j}function g(I,E){let H;return I?E===null||E===Xi||E===Es?H=n.DEPTH24_STENCIL8:E===kn?H=n.DEPTH32F_STENCIL8:E===or&&(H=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):E===null||E===Xi||E===Es?H=n.DEPTH_COMPONENT24:E===kn?H=n.DEPTH_COMPONENT32F:E===or&&(H=n.DEPTH_COMPONENT16),H}function L(I,E){return m(I)===!0||I.isFramebufferTexture&&I.minFilter!==Kt&&I.minFilter!==zn?Math.log2(Math.max(E.width,E.height))+1:I.mipmaps!==void 0&&I.mipmaps.length>0?I.mipmaps.length:I.isCompressedTexture&&Array.isArray(I.image)?E.mipmaps.length:1}function R(I){let E=I.target;E.removeEventListener("dispose",R),A(E),E.isVideoTexture&&h.delete(E)}function C(I){let E=I.target;E.removeEventListener("dispose",C),M(E)}function A(I){let E=i.get(I);if(E.__webglInit===void 0)return;let H=I.source,J=d.get(H);if(J){let re=J[E.__cacheKey];re.usedTimes--,re.usedTimes===0&&x(I),Object.keys(J).length===0&&d.delete(H)}i.remove(I)}function x(I){let E=i.get(I);n.deleteTexture(E.__webglTexture);let H=I.source,J=d.get(H);delete J[E.__cacheKey],a.memory.textures--}function M(I){let E=i.get(I);if(I.depthTexture&&(I.depthTexture.dispose(),i.remove(I.depthTexture)),I.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(E.__webglFramebuffer[J]))for(let re=0;re<E.__webglFramebuffer[J].length;re++)n.deleteFramebuffer(E.__webglFramebuffer[J][re]);else n.deleteFramebuffer(E.__webglFramebuffer[J]);E.__webglDepthbuffer&&n.deleteRenderbuffer(E.__webglDepthbuffer[J])}else{if(Array.isArray(E.__webglFramebuffer))for(let J=0;J<E.__webglFramebuffer.length;J++)n.deleteFramebuffer(E.__webglFramebuffer[J]);else n.deleteFramebuffer(E.__webglFramebuffer);if(E.__webglDepthbuffer&&n.deleteRenderbuffer(E.__webglDepthbuffer),E.__webglMultisampledFramebuffer&&n.deleteFramebuffer(E.__webglMultisampledFramebuffer),E.__webglColorRenderbuffer)for(let J=0;J<E.__webglColorRenderbuffer.length;J++)E.__webglColorRenderbuffer[J]&&n.deleteRenderbuffer(E.__webglColorRenderbuffer[J]);E.__webglDepthRenderbuffer&&n.deleteRenderbuffer(E.__webglDepthRenderbuffer)}let H=I.textures;for(let J=0,re=H.length;J<re;J++){let j=i.get(H[J]);j.__webglTexture&&(n.deleteTexture(j.__webglTexture),a.memory.textures--),i.remove(H[J])}i.remove(I)}let U=0;function k(){U=0}function z(){let I=U;return I>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+I+" texture units while this GPU supports only "+s.maxTextures),U+=1,I}function G(I){let E=[];return E.push(I.wrapS),E.push(I.wrapT),E.push(I.wrapR||0),E.push(I.magFilter),E.push(I.minFilter),E.push(I.anisotropy),E.push(I.internalFormat),E.push(I.format),E.push(I.type),E.push(I.generateMipmaps),E.push(I.premultiplyAlpha),E.push(I.flipY),E.push(I.unpackAlignment),E.push(I.colorSpace),E.join()}function Q(I,E){let H=i.get(I);if(I.isVideoTexture&&me(I),I.isRenderTargetTexture===!1&&I.version>0&&H.__version!==I.version){let J=I.image;if(J===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(J.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{K(H,I,E);return}}t.bindTexture(n.TEXTURE_2D,H.__webglTexture,n.TEXTURE0+E)}function Y(I,E){let H=i.get(I);if(I.version>0&&H.__version!==I.version){K(H,I,E);return}t.bindTexture(n.TEXTURE_2D_ARRAY,H.__webglTexture,n.TEXTURE0+E)}function se(I,E){let H=i.get(I);if(I.version>0&&H.__version!==I.version){K(H,I,E);return}t.bindTexture(n.TEXTURE_3D,H.__webglTexture,n.TEXTURE0+E)}function q(I,E){let H=i.get(I);if(I.version>0&&H.__version!==I.version){fe(H,I,E);return}t.bindTexture(n.TEXTURE_CUBE_MAP,H.__webglTexture,n.TEXTURE0+E)}let ge={[ni]:n.REPEAT,[Gi]:n.CLAMP_TO_EDGE,[Ko]:n.MIRRORED_REPEAT},Me={[Kt]:n.NEAREST,[Ku]:n.NEAREST_MIPMAP_NEAREST,[Rr]:n.NEAREST_MIPMAP_LINEAR,[zn]:n.LINEAR,[ao]:n.LINEAR_MIPMAP_NEAREST,[Wi]:n.LINEAR_MIPMAP_LINEAR},Ce={[td]:n.NEVER,[od]:n.ALWAYS,[nd]:n.LESS,[vf]:n.LEQUAL,[id]:n.EQUAL,[ad]:n.GEQUAL,[sd]:n.GREATER,[rd]:n.NOTEQUAL};function We(I,E){if(E.type===kn&&e.has("OES_texture_float_linear")===!1&&(E.magFilter===zn||E.magFilter===ao||E.magFilter===Rr||E.magFilter===Wi||E.minFilter===zn||E.minFilter===ao||E.minFilter===Rr||E.minFilter===Wi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(I,n.TEXTURE_WRAP_S,ge[E.wrapS]),n.texParameteri(I,n.TEXTURE_WRAP_T,ge[E.wrapT]),(I===n.TEXTURE_3D||I===n.TEXTURE_2D_ARRAY)&&n.texParameteri(I,n.TEXTURE_WRAP_R,ge[E.wrapR]),n.texParameteri(I,n.TEXTURE_MAG_FILTER,Me[E.magFilter]),n.texParameteri(I,n.TEXTURE_MIN_FILTER,Me[E.minFilter]),E.compareFunction&&(n.texParameteri(I,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(I,n.TEXTURE_COMPARE_FUNC,Ce[E.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===Kt||E.minFilter!==Rr&&E.minFilter!==Wi||E.type===kn&&e.has("OES_texture_float_linear")===!1)return;if(E.anisotropy>1||i.get(E).__currentAnisotropy){let H=e.get("EXT_texture_filter_anisotropic");n.texParameterf(I,H.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,s.getMaxAnisotropy())),i.get(E).__currentAnisotropy=E.anisotropy}}}function ct(I,E){let H=!1;I.__webglInit===void 0&&(I.__webglInit=!0,E.addEventListener("dispose",R));let J=E.source,re=d.get(J);re===void 0&&(re={},d.set(J,re));let j=G(E);if(j!==I.__cacheKey){re[j]===void 0&&(re[j]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,H=!0),re[j].usedTimes++;let Oe=re[I.__cacheKey];Oe!==void 0&&(re[I.__cacheKey].usedTimes--,Oe.usedTimes===0&&x(E)),I.__cacheKey=j,I.__webglTexture=re[j].texture}return H}function K(I,E,H){let J=n.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(J=n.TEXTURE_2D_ARRAY),E.isData3DTexture&&(J=n.TEXTURE_3D);let re=ct(I,E),j=E.source;t.bindTexture(J,I.__webglTexture,n.TEXTURE0+H);let Oe=i.get(j);if(j.version!==Oe.__version||re===!0){t.activeTexture(n.TEXTURE0+H);let ve=at.getPrimaries(at.workingColorSpace),we=E.colorSpace===Bn?null:at.getPrimaries(E.colorSpace),rt=E.colorSpace===Bn||ve===we?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,E.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,E.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,rt);let ce=_(E.image,!1,s.maxTextureSize);ce=Ye(E,ce);let Le=r.convert(E.format,E.colorSpace),qe=r.convert(E.type),$e=S(E.internalFormat,Le,qe,E.colorSpace,E.isVideoTexture);We(J,E);let De,lt=E.mipmaps,et=E.isVideoTexture!==!0,St=Oe.__version===void 0||re===!0,O=j.dataReady,xe=L(E,ce);if(E.isDepthTexture)$e=g(E.format===As,E.type),St&&(et?t.texStorage2D(n.TEXTURE_2D,1,$e,ce.width,ce.height):t.texImage2D(n.TEXTURE_2D,0,$e,ce.width,ce.height,0,Le,qe,null));else if(E.isDataTexture)if(lt.length>0){et&&St&&t.texStorage2D(n.TEXTURE_2D,xe,$e,lt[0].width,lt[0].height);for(let $=0,te=lt.length;$<te;$++)De=lt[$],et?O&&t.texSubImage2D(n.TEXTURE_2D,$,0,0,De.width,De.height,Le,qe,De.data):t.texImage2D(n.TEXTURE_2D,$,$e,De.width,De.height,0,Le,qe,De.data);E.generateMipmaps=!1}else et?(St&&t.texStorage2D(n.TEXTURE_2D,xe,$e,ce.width,ce.height),O&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ce.width,ce.height,Le,qe,ce.data)):t.texImage2D(n.TEXTURE_2D,0,$e,ce.width,ce.height,0,Le,qe,ce.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){et&&St&&t.texStorage3D(n.TEXTURE_2D_ARRAY,xe,$e,lt[0].width,lt[0].height,ce.depth);for(let $=0,te=lt.length;$<te;$++)if(De=lt[$],E.format!==Ln)if(Le!==null)if(et){if(O)if(E.layerUpdates.size>0){let Ee=Xh(De.width,De.height,E.format,E.type);for(let be of E.layerUpdates){let Ke=De.data.subarray(be*Ee/De.data.BYTES_PER_ELEMENT,(be+1)*Ee/De.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,$,0,0,be,De.width,De.height,1,Le,Ke)}E.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,$,0,0,0,De.width,De.height,ce.depth,Le,De.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,$,$e,De.width,De.height,ce.depth,0,De.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else et?O&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,$,0,0,0,De.width,De.height,ce.depth,Le,qe,De.data):t.texImage3D(n.TEXTURE_2D_ARRAY,$,$e,De.width,De.height,ce.depth,0,Le,qe,De.data)}else{et&&St&&t.texStorage2D(n.TEXTURE_2D,xe,$e,lt[0].width,lt[0].height);for(let $=0,te=lt.length;$<te;$++)De=lt[$],E.format!==Ln?Le!==null?et?O&&t.compressedTexSubImage2D(n.TEXTURE_2D,$,0,0,De.width,De.height,Le,De.data):t.compressedTexImage2D(n.TEXTURE_2D,$,$e,De.width,De.height,0,De.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):et?O&&t.texSubImage2D(n.TEXTURE_2D,$,0,0,De.width,De.height,Le,qe,De.data):t.texImage2D(n.TEXTURE_2D,$,$e,De.width,De.height,0,Le,qe,De.data)}else if(E.isDataArrayTexture)if(et){if(St&&t.texStorage3D(n.TEXTURE_2D_ARRAY,xe,$e,ce.width,ce.height,ce.depth),O)if(E.layerUpdates.size>0){let $=Xh(ce.width,ce.height,E.format,E.type);for(let te of E.layerUpdates){let Ee=ce.data.subarray(te*$/ce.data.BYTES_PER_ELEMENT,(te+1)*$/ce.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,te,ce.width,ce.height,1,Le,qe,Ee)}E.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ce.width,ce.height,ce.depth,Le,qe,ce.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,$e,ce.width,ce.height,ce.depth,0,Le,qe,ce.data);else if(E.isData3DTexture)et?(St&&t.texStorage3D(n.TEXTURE_3D,xe,$e,ce.width,ce.height,ce.depth),O&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ce.width,ce.height,ce.depth,Le,qe,ce.data)):t.texImage3D(n.TEXTURE_3D,0,$e,ce.width,ce.height,ce.depth,0,Le,qe,ce.data);else if(E.isFramebufferTexture){if(St)if(et)t.texStorage2D(n.TEXTURE_2D,xe,$e,ce.width,ce.height);else{let $=ce.width,te=ce.height;for(let Ee=0;Ee<xe;Ee++)t.texImage2D(n.TEXTURE_2D,Ee,$e,$,te,0,Le,qe,null),$>>=1,te>>=1}}else if(lt.length>0){if(et&&St){let $=Ae(lt[0]);t.texStorage2D(n.TEXTURE_2D,xe,$e,$.width,$.height)}for(let $=0,te=lt.length;$<te;$++)De=lt[$],et?O&&t.texSubImage2D(n.TEXTURE_2D,$,0,0,Le,qe,De):t.texImage2D(n.TEXTURE_2D,$,$e,Le,qe,De);E.generateMipmaps=!1}else if(et){if(St){let $=Ae(ce);t.texStorage2D(n.TEXTURE_2D,xe,$e,$.width,$.height)}O&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,Le,qe,ce)}else t.texImage2D(n.TEXTURE_2D,0,$e,Le,qe,ce);m(E)&&f(J),Oe.__version=j.version,E.onUpdate&&E.onUpdate(E)}I.__version=E.version}function fe(I,E,H){if(E.image.length!==6)return;let J=ct(I,E),re=E.source;t.bindTexture(n.TEXTURE_CUBE_MAP,I.__webglTexture,n.TEXTURE0+H);let j=i.get(re);if(re.version!==j.__version||J===!0){t.activeTexture(n.TEXTURE0+H);let Oe=at.getPrimaries(at.workingColorSpace),ve=E.colorSpace===Bn?null:at.getPrimaries(E.colorSpace),we=E.colorSpace===Bn||Oe===ve?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,E.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,E.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,we);let rt=E.isCompressedTexture||E.image[0].isCompressedTexture,ce=E.image[0]&&E.image[0].isDataTexture,Le=[];for(let te=0;te<6;te++)!rt&&!ce?Le[te]=_(E.image[te],!0,s.maxCubemapSize):Le[te]=ce?E.image[te].image:E.image[te],Le[te]=Ye(E,Le[te]);let qe=Le[0],$e=r.convert(E.format,E.colorSpace),De=r.convert(E.type),lt=S(E.internalFormat,$e,De,E.colorSpace),et=E.isVideoTexture!==!0,St=j.__version===void 0||J===!0,O=re.dataReady,xe=L(E,qe);We(n.TEXTURE_CUBE_MAP,E);let $;if(rt){et&&St&&t.texStorage2D(n.TEXTURE_CUBE_MAP,xe,lt,qe.width,qe.height);for(let te=0;te<6;te++){$=Le[te].mipmaps;for(let Ee=0;Ee<$.length;Ee++){let be=$[Ee];E.format!==Ln?$e!==null?et?O&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,0,0,be.width,be.height,$e,be.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,lt,be.width,be.height,0,be.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):et?O&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,0,0,be.width,be.height,$e,De,be.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee,lt,be.width,be.height,0,$e,De,be.data)}}}else{if($=E.mipmaps,et&&St){$.length>0&&xe++;let te=Ae(Le[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,xe,lt,te.width,te.height)}for(let te=0;te<6;te++)if(ce){et?O&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,Le[te].width,Le[te].height,$e,De,Le[te].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,lt,Le[te].width,Le[te].height,0,$e,De,Le[te].data);for(let Ee=0;Ee<$.length;Ee++){let Ke=$[Ee].image[te].image;et?O&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,0,0,Ke.width,Ke.height,$e,De,Ke.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,lt,Ke.width,Ke.height,0,$e,De,Ke.data)}}else{et?O&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,$e,De,Le[te]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,lt,$e,De,Le[te]);for(let Ee=0;Ee<$.length;Ee++){let be=$[Ee];et?O&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,0,0,$e,De,be.image[te]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ee+1,lt,$e,De,be.image[te])}}}m(E)&&f(n.TEXTURE_CUBE_MAP),j.__version=re.version,E.onUpdate&&E.onUpdate(E)}I.__version=E.version}function Ue(I,E,H,J,re,j){let Oe=r.convert(H.format,H.colorSpace),ve=r.convert(H.type),we=S(H.internalFormat,Oe,ve,H.colorSpace),rt=i.get(E),ce=i.get(H);if(ce.__renderTarget=E,!rt.__hasExternalTextures){let Le=Math.max(1,E.width>>j),qe=Math.max(1,E.height>>j);re===n.TEXTURE_3D||re===n.TEXTURE_2D_ARRAY?t.texImage3D(re,j,we,Le,qe,E.depth,0,Oe,ve,null):t.texImage2D(re,j,we,Le,qe,0,Oe,ve,null)}t.bindFramebuffer(n.FRAMEBUFFER,I),Re(E)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,J,re,ce.__webglTexture,0,le(E)):(re===n.TEXTURE_2D||re>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&re<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,J,re,ce.__webglTexture,j),t.bindFramebuffer(n.FRAMEBUFFER,null)}function P(I,E,H){if(n.bindRenderbuffer(n.RENDERBUFFER,I),E.depthBuffer){let J=E.depthTexture,re=J&&J.isDepthTexture?J.type:null,j=g(E.stencilBuffer,re),Oe=E.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ve=le(E);Re(E)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ve,j,E.width,E.height):H?n.renderbufferStorageMultisample(n.RENDERBUFFER,ve,j,E.width,E.height):n.renderbufferStorage(n.RENDERBUFFER,j,E.width,E.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Oe,n.RENDERBUFFER,I)}else{let J=E.textures;for(let re=0;re<J.length;re++){let j=J[re],Oe=r.convert(j.format,j.colorSpace),ve=r.convert(j.type),we=S(j.internalFormat,Oe,ve,j.colorSpace),rt=le(E);H&&Re(E)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,rt,we,E.width,E.height):Re(E)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,rt,we,E.width,E.height):n.renderbufferStorage(n.RENDERBUFFER,we,E.width,E.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Z(I,E){if(E&&E.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,I),!(E.depthTexture&&E.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let J=i.get(E.depthTexture);J.__renderTarget=E,(!J.__webglTexture||E.depthTexture.image.width!==E.width||E.depthTexture.image.height!==E.height)&&(E.depthTexture.image.width=E.width,E.depthTexture.image.height=E.height,E.depthTexture.needsUpdate=!0),Q(E.depthTexture,0);let re=J.__webglTexture,j=le(E);if(E.depthTexture.format===vs)Re(E)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,re,0,j):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,re,0);else if(E.depthTexture.format===As)Re(E)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,re,0,j):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,re,0);else throw new Error("Unknown depthTexture format")}function pe(I){let E=i.get(I),H=I.isWebGLCubeRenderTarget===!0;if(E.__boundDepthTexture!==I.depthTexture){let J=I.depthTexture;if(E.__depthDisposeCallback&&E.__depthDisposeCallback(),J){let re=()=>{delete E.__boundDepthTexture,delete E.__depthDisposeCallback,J.removeEventListener("dispose",re)};J.addEventListener("dispose",re),E.__depthDisposeCallback=re}E.__boundDepthTexture=J}if(I.depthTexture&&!E.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");Z(E.__webglFramebuffer,I)}else if(H){E.__webglDepthbuffer=[];for(let J=0;J<6;J++)if(t.bindFramebuffer(n.FRAMEBUFFER,E.__webglFramebuffer[J]),E.__webglDepthbuffer[J]===void 0)E.__webglDepthbuffer[J]=n.createRenderbuffer(),P(E.__webglDepthbuffer[J],I,!1);else{let re=I.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,j=E.__webglDepthbuffer[J];n.bindRenderbuffer(n.RENDERBUFFER,j),n.framebufferRenderbuffer(n.FRAMEBUFFER,re,n.RENDERBUFFER,j)}}else if(t.bindFramebuffer(n.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer===void 0)E.__webglDepthbuffer=n.createRenderbuffer(),P(E.__webglDepthbuffer,I,!1);else{let J=I.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,re=E.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,re),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,re)}t.bindFramebuffer(n.FRAMEBUFFER,null)}function ye(I,E,H){let J=i.get(I);E!==void 0&&Ue(J.__webglFramebuffer,I,I.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),H!==void 0&&pe(I)}function nt(I){let E=I.texture,H=i.get(I),J=i.get(E);I.addEventListener("dispose",C);let re=I.textures,j=I.isWebGLCubeRenderTarget===!0,Oe=re.length>1;if(Oe||(J.__webglTexture===void 0&&(J.__webglTexture=n.createTexture()),J.__version=E.version,a.memory.textures++),j){H.__webglFramebuffer=[];for(let ve=0;ve<6;ve++)if(E.mipmaps&&E.mipmaps.length>0){H.__webglFramebuffer[ve]=[];for(let we=0;we<E.mipmaps.length;we++)H.__webglFramebuffer[ve][we]=n.createFramebuffer()}else H.__webglFramebuffer[ve]=n.createFramebuffer()}else{if(E.mipmaps&&E.mipmaps.length>0){H.__webglFramebuffer=[];for(let ve=0;ve<E.mipmaps.length;ve++)H.__webglFramebuffer[ve]=n.createFramebuffer()}else H.__webglFramebuffer=n.createFramebuffer();if(Oe)for(let ve=0,we=re.length;ve<we;ve++){let rt=i.get(re[ve]);rt.__webglTexture===void 0&&(rt.__webglTexture=n.createTexture(),a.memory.textures++)}if(I.samples>0&&Re(I)===!1){H.__webglMultisampledFramebuffer=n.createFramebuffer(),H.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let ve=0;ve<re.length;ve++){let we=re[ve];H.__webglColorRenderbuffer[ve]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,H.__webglColorRenderbuffer[ve]);let rt=r.convert(we.format,we.colorSpace),ce=r.convert(we.type),Le=S(we.internalFormat,rt,ce,we.colorSpace,I.isXRRenderTarget===!0),qe=le(I);n.renderbufferStorageMultisample(n.RENDERBUFFER,qe,Le,I.width,I.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ve,n.RENDERBUFFER,H.__webglColorRenderbuffer[ve])}n.bindRenderbuffer(n.RENDERBUFFER,null),I.depthBuffer&&(H.__webglDepthRenderbuffer=n.createRenderbuffer(),P(H.__webglDepthRenderbuffer,I,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(j){t.bindTexture(n.TEXTURE_CUBE_MAP,J.__webglTexture),We(n.TEXTURE_CUBE_MAP,E);for(let ve=0;ve<6;ve++)if(E.mipmaps&&E.mipmaps.length>0)for(let we=0;we<E.mipmaps.length;we++)Ue(H.__webglFramebuffer[ve][we],I,E,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,we);else Ue(H.__webglFramebuffer[ve],I,E,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0);m(E)&&f(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Oe){for(let ve=0,we=re.length;ve<we;ve++){let rt=re[ve],ce=i.get(rt);t.bindTexture(n.TEXTURE_2D,ce.__webglTexture),We(n.TEXTURE_2D,rt),Ue(H.__webglFramebuffer,I,rt,n.COLOR_ATTACHMENT0+ve,n.TEXTURE_2D,0),m(rt)&&f(n.TEXTURE_2D)}t.unbindTexture()}else{let ve=n.TEXTURE_2D;if((I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)&&(ve=I.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ve,J.__webglTexture),We(ve,E),E.mipmaps&&E.mipmaps.length>0)for(let we=0;we<E.mipmaps.length;we++)Ue(H.__webglFramebuffer[we],I,E,n.COLOR_ATTACHMENT0,ve,we);else Ue(H.__webglFramebuffer,I,E,n.COLOR_ATTACHMENT0,ve,0);m(E)&&f(ve),t.unbindTexture()}I.depthBuffer&&pe(I)}function ne(I){let E=I.textures;for(let H=0,J=E.length;H<J;H++){let re=E[H];if(m(re)){let j=v(I),Oe=i.get(re).__webglTexture;t.bindTexture(j,Oe),f(j),t.unbindTexture()}}}let ue=[],N=[];function He(I){if(I.samples>0){if(Re(I)===!1){let E=I.textures,H=I.width,J=I.height,re=n.COLOR_BUFFER_BIT,j=I.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Oe=i.get(I),ve=E.length>1;if(ve)for(let we=0;we<E.length;we++)t.bindFramebuffer(n.FRAMEBUFFER,Oe.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+we,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Oe.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+we,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Oe.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Oe.__webglFramebuffer);for(let we=0;we<E.length;we++){if(I.resolveDepthBuffer&&(I.depthBuffer&&(re|=n.DEPTH_BUFFER_BIT),I.stencilBuffer&&I.resolveStencilBuffer&&(re|=n.STENCIL_BUFFER_BIT)),ve){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Oe.__webglColorRenderbuffer[we]);let rt=i.get(E[we]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,rt,0)}n.blitFramebuffer(0,0,H,J,0,0,H,J,re,n.NEAREST),l===!0&&(ue.length=0,N.length=0,ue.push(n.COLOR_ATTACHMENT0+we),I.depthBuffer&&I.resolveDepthBuffer===!1&&(ue.push(j),N.push(j),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,N)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,ue))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ve)for(let we=0;we<E.length;we++){t.bindFramebuffer(n.FRAMEBUFFER,Oe.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+we,n.RENDERBUFFER,Oe.__webglColorRenderbuffer[we]);let rt=i.get(E[we]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Oe.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+we,n.TEXTURE_2D,rt,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Oe.__webglMultisampledFramebuffer)}else if(I.depthBuffer&&I.resolveDepthBuffer===!1&&l){let E=I.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[E])}}}function le(I){return Math.min(s.maxSamples,I.samples)}function Re(I){let E=i.get(I);return I.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function me(I){let E=a.render.frame;h.get(I)!==E&&(h.set(I,E),I.update())}function Ye(I,E){let H=I.colorSpace,J=I.format,re=I.type;return I.isCompressedTexture===!0||I.isVideoTexture===!0||H!==Os&&H!==Bn&&(at.getTransfer(H)===yt?(J!==Ln||re!==ii)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),E}function Ae(I){return typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement?(c.width=I.naturalWidth||I.width,c.height=I.naturalHeight||I.height):typeof VideoFrame<"u"&&I instanceof VideoFrame?(c.width=I.displayWidth,c.height=I.displayHeight):(c.width=I.width,c.height=I.height),c}this.allocateTextureUnit=z,this.resetTextureUnits=k,this.setTexture2D=Q,this.setTexture2DArray=Y,this.setTexture3D=se,this.setTextureCube=q,this.rebindTextures=ye,this.setupRenderTarget=nt,this.updateRenderTargetMipmap=ne,this.updateMultisampleRenderTarget=He,this.setupDepthRenderbuffer=pe,this.setupFrameBufferTexture=Ue,this.useMultisampledRTT=Re}function d1(n,e){function t(i,s=Bn){let r,a=at.getTransfer(s);if(i===ii)return n.UNSIGNED_BYTE;if(i===pc)return n.UNSIGNED_SHORT_4_4_4_4;if(i===mc)return n.UNSIGNED_SHORT_5_5_5_1;if(i===uf)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===hf)return n.BYTE;if(i===ff)return n.SHORT;if(i===or)return n.UNSIGNED_SHORT;if(i===dc)return n.INT;if(i===Xi)return n.UNSIGNED_INT;if(i===kn)return n.FLOAT;if(i===br)return n.HALF_FLOAT;if(i===df)return n.ALPHA;if(i===pf)return n.RGB;if(i===Ln)return n.RGBA;if(i===mf)return n.LUMINANCE;if(i===gf)return n.LUMINANCE_ALPHA;if(i===vs)return n.DEPTH_COMPONENT;if(i===As)return n.DEPTH_STENCIL;if(i===Tr)return n.RED;if(i===gc)return n.RED_INTEGER;if(i===_f)return n.RG;if(i===_c)return n.RG_INTEGER;if(i===yc)return n.RGBA_INTEGER;if(i===ra||i===aa||i===oa||i===la)if(a===yt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===ra)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===aa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===oa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===la)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===ra)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===aa)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===oa)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===la)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===jo||i===Qo||i===el||i===tl)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===jo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Qo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===el)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===tl)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===nl||i===il||i===sl)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===nl||i===il)return a===yt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===sl)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===rl||i===al||i===ol||i===ll||i===cl||i===hl||i===fl||i===ul||i===dl||i===pl||i===ml||i===gl||i===_l||i===yl)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===rl)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===al)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===ol)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===ll)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===cl)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===hl)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===fl)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===ul)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===dl)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===pl)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ml)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===gl)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===_l)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===yl)return a===yt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===ca||i===vl||i===xl)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===ca)return a===yt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===vl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===xl)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===yf||i===Sl||i===Ml||i===bl)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===ca)return r.COMPRESSED_RED_RGTC1_EXT;if(i===Sl)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ml)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===bl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Es?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var zl=class extends Zt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},Fe=class extends Gt{constructor(){super(),this.isGroup=!0,this.type="Group"}},p1={type:"move"},ir=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Fe,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Fe,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Fe,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let _ of e.hand.values()){let m=t.getJointPose(_,i),f=this._getHandJoint(c,_);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),p=.02,y=.005;c.inputState.pinching&&d>p+y?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=p-y&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(p1)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new Fe;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},m1=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,g1=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,kl=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){let s=new rn,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!=i.depthNear||t.depthFar!=i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new on({vertexShader:m1,fragmentShader:g1,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Pe(new Qt(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Hl=class extends si{constructor(e,t){super();let i=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,p=null,y=null,_=new kl,m=t.getContextAttributes(),f=null,v=null,S=[],g=[],L=new ee,R=null,C=new Zt;C.viewport=new vt;let A=new Zt;A.viewport=new vt;let x=[C,A],M=new zl,U=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let fe=S[K];return fe===void 0&&(fe=new ir,S[K]=fe),fe.getTargetRaySpace()},this.getControllerGrip=function(K){let fe=S[K];return fe===void 0&&(fe=new ir,S[K]=fe),fe.getGripSpace()},this.getHand=function(K){let fe=S[K];return fe===void 0&&(fe=new ir,S[K]=fe),fe.getHandSpace()};function z(K){let fe=g.indexOf(K.inputSource);if(fe===-1)return;let Ue=S[fe];Ue!==void 0&&(Ue.update(K.inputSource,K.frame,c||a),Ue.dispatchEvent({type:K.type,data:K.inputSource}))}function G(){s.removeEventListener("select",z),s.removeEventListener("selectstart",z),s.removeEventListener("selectend",z),s.removeEventListener("squeeze",z),s.removeEventListener("squeezestart",z),s.removeEventListener("squeezeend",z),s.removeEventListener("end",G),s.removeEventListener("inputsourceschange",Q);for(let K=0;K<S.length;K++){let fe=g[K];fe!==null&&(g[K]=null,S[K].disconnect(fe))}U=null,k=null,_.reset(),e.setRenderTarget(f),p=null,d=null,u=null,s=null,v=null,ct.stop(),i.isPresenting=!1,e.setPixelRatio(R),e.setSize(L.width,L.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){o=K,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return u},this.getFrame=function(){return y},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(f=e.getRenderTarget(),s.addEventListener("select",z),s.addEventListener("selectstart",z),s.addEventListener("selectend",z),s.addEventListener("squeeze",z),s.addEventListener("squeezestart",z),s.addEventListener("squeezeend",z),s.addEventListener("end",G),s.addEventListener("inputsourceschange",Q),m.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(L),s.renderState.layers===void 0){let fe={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,t,fe),s.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),v=new ri(p.framebufferWidth,p.framebufferHeight,{format:Ln,type:ii,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil})}else{let fe=null,Ue=null,P=null;m.depth&&(P=m.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,fe=m.stencil?As:vs,Ue=m.stencil?Es:Xi);let Z={colorFormat:t.RGBA8,depthFormat:P,scaleFactor:r};u=new XRWebGLBinding(s,t),d=u.createProjectionLayer(Z),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),v=new ri(d.textureWidth,d.textureHeight,{format:Ln,type:ii,depthTexture:new Sa(d.textureWidth,d.textureHeight,Ue,void 0,void 0,void 0,void 0,void 0,void 0,fe),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),ct.setContext(s),ct.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function Q(K){for(let fe=0;fe<K.removed.length;fe++){let Ue=K.removed[fe],P=g.indexOf(Ue);P>=0&&(g[P]=null,S[P].disconnect(Ue))}for(let fe=0;fe<K.added.length;fe++){let Ue=K.added[fe],P=g.indexOf(Ue);if(P===-1){for(let pe=0;pe<S.length;pe++)if(pe>=g.length){g.push(Ue),P=pe;break}else if(g[pe]===null){g[pe]=Ue,P=pe;break}if(P===-1)break}let Z=S[P];Z&&Z.connect(Ue)}}let Y=new D,se=new D;function q(K,fe,Ue){Y.setFromMatrixPosition(fe.matrixWorld),se.setFromMatrixPosition(Ue.matrixWorld);let P=Y.distanceTo(se),Z=fe.projectionMatrix.elements,pe=Ue.projectionMatrix.elements,ye=Z[14]/(Z[10]-1),nt=Z[14]/(Z[10]+1),ne=(Z[9]+1)/Z[5],ue=(Z[9]-1)/Z[5],N=(Z[8]-1)/Z[0],He=(pe[8]+1)/pe[0],le=ye*N,Re=ye*He,me=P/(-N+He),Ye=me*-N;if(fe.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(Ye),K.translateZ(me),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),Z[10]===-1)K.projectionMatrix.copy(fe.projectionMatrix),K.projectionMatrixInverse.copy(fe.projectionMatrixInverse);else{let Ae=ye+me,I=nt+me,E=le-Ye,H=Re+(P-Ye),J=ne*nt/I*Ae,re=ue*nt/I*Ae;K.projectionMatrix.makePerspective(E,H,J,re,Ae,I),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function ge(K,fe){fe===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(fe.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let fe=K.near,Ue=K.far;_.texture!==null&&(_.depthNear>0&&(fe=_.depthNear),_.depthFar>0&&(Ue=_.depthFar)),M.near=A.near=C.near=fe,M.far=A.far=C.far=Ue,(U!==M.near||k!==M.far)&&(s.updateRenderState({depthNear:M.near,depthFar:M.far}),U=M.near,k=M.far),C.layers.mask=K.layers.mask|2,A.layers.mask=K.layers.mask|4,M.layers.mask=C.layers.mask|A.layers.mask;let P=K.parent,Z=M.cameras;ge(M,P);for(let pe=0;pe<Z.length;pe++)ge(Z[pe],P);Z.length===2?q(M,C,A):M.projectionMatrix.copy(C.projectionMatrix),Me(K,M,P)};function Me(K,fe,Ue){Ue===null?K.matrix.copy(fe.matrixWorld):(K.matrix.copy(Ue.matrixWorld),K.matrix.invert(),K.matrix.multiply(fe.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(fe.projectionMatrix),K.projectionMatrixInverse.copy(fe.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=lr*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(d===null&&p===null))return l},this.setFoveation=function(K){l=K,d!==null&&(d.fixedFoveation=K),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=K)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(M)};let Ce=null;function We(K,fe){if(h=fe.getViewerPose(c||a),y=fe,h!==null){let Ue=h.views;p!==null&&(e.setRenderTargetFramebuffer(v,p.framebuffer),e.setRenderTarget(v));let P=!1;Ue.length!==M.cameras.length&&(M.cameras.length=0,P=!0);for(let pe=0;pe<Ue.length;pe++){let ye=Ue[pe],nt=null;if(p!==null)nt=p.getViewport(ye);else{let ue=u.getViewSubImage(d,ye);nt=ue.viewport,pe===0&&(e.setRenderTargetTextures(v,ue.colorTexture,d.ignoreDepthValues?void 0:ue.depthStencilTexture),e.setRenderTarget(v))}let ne=x[pe];ne===void 0&&(ne=new Zt,ne.layers.enable(pe),ne.viewport=new vt,x[pe]=ne),ne.matrix.fromArray(ye.transform.matrix),ne.matrix.decompose(ne.position,ne.quaternion,ne.scale),ne.projectionMatrix.fromArray(ye.projectionMatrix),ne.projectionMatrixInverse.copy(ne.projectionMatrix).invert(),ne.viewport.set(nt.x,nt.y,nt.width,nt.height),pe===0&&(M.matrix.copy(ne.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),P===!0&&M.cameras.push(ne)}let Z=s.enabledFeatures;if(Z&&Z.includes("depth-sensing")){let pe=u.getDepthInformation(Ue[0]);pe&&pe.isValid&&pe.texture&&_.init(e,pe,s.renderState)}}for(let Ue=0;Ue<S.length;Ue++){let P=g[Ue],Z=S[Ue];P!==null&&Z!==void 0&&Z.update(P,fe,c||a)}Ce&&Ce(K,fe),fe.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:fe}),y=null}let ct=new Tf;ct.setAnimationLoop(We),this.setAnimationLoop=function(K){Ce=K},this.dispose=function(){}}},zi=new vn,_1=new ut;function y1(n,e){function t(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function i(m,f){f.color.getRGB(m.fogColor.value,bf(n)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function s(m,f,v,S,g){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(m,f):f.isMeshToonMaterial?(r(m,f),u(m,f)):f.isMeshPhongMaterial?(r(m,f),h(m,f)):f.isMeshStandardMaterial?(r(m,f),d(m,f),f.isMeshPhysicalMaterial&&p(m,f,g)):f.isMeshMatcapMaterial?(r(m,f),y(m,f)):f.isMeshDepthMaterial?r(m,f):f.isMeshDistanceMaterial?(r(m,f),_(m,f)):f.isMeshNormalMaterial?r(m,f):f.isLineBasicMaterial?(a(m,f),f.isLineDashedMaterial&&o(m,f)):f.isPointsMaterial?l(m,f,v,S):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,t(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===Jt&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,t(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===Jt&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,t(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,t(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);let v=e.get(f),S=v.envMap,g=v.envMapRotation;S&&(m.envMap.value=S,zi.copy(g),zi.x*=-1,zi.y*=-1,zi.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(zi.y*=-1,zi.z*=-1),m.envMapRotation.value.setFromMatrix4(_1.makeRotationFromEuler(zi)),m.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap&&(m.lightMap.value=f.lightMap,m.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,m.lightMapTransform)),f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,m.aoMapTransform))}function a(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform))}function o(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function l(m,f,v,S){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*v,m.scale.value=S*.5,f.map&&(m.map.value=f.map,t(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,t(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,t(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function h(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function u(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function d(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,m.roughnessMapTransform)),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,v){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Jt&&m.clearcoatNormalScale.value.negate())),f.dispersion>0&&(m.dispersion.value=f.dispersion),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=v.texture,m.transmissionSamplerSize.value.set(v.width,v.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,m.specularIntensityMapTransform))}function y(m,f){f.matcap&&(m.matcap.value=f.matcap)}function _(m,f){let v=e.get(f).light;m.referencePosition.value.setFromMatrixPosition(v.matrixWorld),m.nearDistance.value=v.shadow.camera.near,m.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function v1(n,e,t,i){let s={},r={},a=[],o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,S){let g=S.program;i.uniformBlockBinding(v,g)}function c(v,S){let g=s[v.id];g===void 0&&(y(v),g=h(v),s[v.id]=g,v.addEventListener("dispose",m));let L=S.program;i.updateUBOMapping(v,L);let R=e.render.frame;r[v.id]!==R&&(d(v),r[v.id]=R)}function h(v){let S=u();v.__bindingPointIndex=S;let g=n.createBuffer(),L=v.__size,R=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,g),n.bufferData(n.UNIFORM_BUFFER,L,R),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,S,g),g}function u(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(v){let S=s[v.id],g=v.uniforms,L=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,S);for(let R=0,C=g.length;R<C;R++){let A=Array.isArray(g[R])?g[R]:[g[R]];for(let x=0,M=A.length;x<M;x++){let U=A[x];if(p(U,R,x,L)===!0){let k=U.__offset,z=Array.isArray(U.value)?U.value:[U.value],G=0;for(let Q=0;Q<z.length;Q++){let Y=z[Q],se=_(Y);typeof Y=="number"||typeof Y=="boolean"?(U.__data[0]=Y,n.bufferSubData(n.UNIFORM_BUFFER,k+G,U.__data)):Y.isMatrix3?(U.__data[0]=Y.elements[0],U.__data[1]=Y.elements[1],U.__data[2]=Y.elements[2],U.__data[3]=0,U.__data[4]=Y.elements[3],U.__data[5]=Y.elements[4],U.__data[6]=Y.elements[5],U.__data[7]=0,U.__data[8]=Y.elements[6],U.__data[9]=Y.elements[7],U.__data[10]=Y.elements[8],U.__data[11]=0):(Y.toArray(U.__data,G),G+=se.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,k,U.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(v,S,g,L){let R=v.value,C=S+"_"+g;if(L[C]===void 0)return typeof R=="number"||typeof R=="boolean"?L[C]=R:L[C]=R.clone(),!0;{let A=L[C];if(typeof R=="number"||typeof R=="boolean"){if(A!==R)return L[C]=R,!0}else if(A.equals(R)===!1)return A.copy(R),!0}return!1}function y(v){let S=v.uniforms,g=0,L=16;for(let C=0,A=S.length;C<A;C++){let x=Array.isArray(S[C])?S[C]:[S[C]];for(let M=0,U=x.length;M<U;M++){let k=x[M],z=Array.isArray(k.value)?k.value:[k.value];for(let G=0,Q=z.length;G<Q;G++){let Y=z[G],se=_(Y),q=g%L,ge=q%se.boundary,Me=q+ge;g+=ge,Me!==0&&L-Me<se.storage&&(g+=L-Me),k.__data=new Float32Array(se.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=g,g+=se.storage}}}let R=g%L;return R>0&&(g+=L-R),v.__size=g,v.__cache={},this}function _(v){let S={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(S.boundary=4,S.storage=4):v.isVector2?(S.boundary=8,S.storage=8):v.isVector3||v.isColor?(S.boundary=16,S.storage=12):v.isVector4?(S.boundary=16,S.storage=16):v.isMatrix3?(S.boundary=48,S.storage=48):v.isMatrix4?(S.boundary=64,S.storage=64):v.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",v),S}function m(v){let S=v.target;S.removeEventListener("dispose",m);let g=a.indexOf(S.__bindingPointIndex);a.splice(g,1),n.deleteBuffer(s[S.id]),delete s[S.id],delete r[S.id]}function f(){for(let v in s)n.deleteBuffer(s[v]);a=[],s={},r={}}return{bind:l,update:c,dispose:f}}var Ma=class{constructor(e={}){let{canvas:t=Td(),context:i=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=a;let y=new Uint32Array(4),_=new Int32Array(4),m=null,f=null,v=[],S=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Vt,this.toneMapping=Mi,this.toneMappingExposure=1;let g=this,L=!1,R=0,C=0,A=null,x=-1,M=null,U=new vt,k=new vt,z=null,G=new Xe(0),Q=0,Y=t.width,se=t.height,q=1,ge=null,Me=null,Ce=new vt(0,0,Y,se),We=new vt(0,0,Y,se),ct=!1,K=new cr,fe=!1,Ue=!1,P=new ut,Z=new ut,pe=new D,ye=new vt,nt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ne=!1;function ue(){return A===null?q:1}let N=i;function He(w,F){return t.getContext(w,F)}try{let w={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${hc}`),t.addEventListener("webglcontextlost",te,!1),t.addEventListener("webglcontextrestored",Ee,!1),t.addEventListener("webglcontextcreationerror",be,!1),N===null){let F="webgl2";if(N=He(F,w),N===null)throw He(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(w){throw console.error("THREE.WebGLRenderer: "+w.message),w}let le,Re,me,Ye,Ae,I,E,H,J,re,j,Oe,ve,we,rt,ce,Le,qe,$e,De,lt,et,St,O;function xe(){le=new Nm(N),le.init(),et=new d1(N,le),Re=new Cm(N,le,e,et),me=new h1(N,le),Re.reverseDepthBuffer&&d&&me.buffers.depth.setReversed(!0),Ye=new Bm(N),Ae=new Kg,I=new u1(N,le,me,Ae,Re,et,Ye),E=new Im(g),H=new Um(g),J=new Xd(N),St=new wm(N,J),re=new Om(N,J,Ye,St),j=new km(N,re,J,Ye),$e=new zm(N,Re,I),ce=new Pm(Ae),Oe=new Jg(g,E,H,le,Re,St,ce),ve=new y1(g,Ae),we=new Qg,rt=new r1(le),qe=new Am(g,E,H,me,j,p,l),Le=new l1(g,j,Re),O=new v1(N,Ye,Re,me),De=new Rm(N,le,Ye),lt=new Fm(N,le,Ye),Ye.programs=Oe.programs,g.capabilities=Re,g.extensions=le,g.properties=Ae,g.renderLists=we,g.shadowMap=Le,g.state=me,g.info=Ye}xe();let $=new Hl(g,N);this.xr=$,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){let w=le.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){let w=le.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return q},this.setPixelRatio=function(w){w!==void 0&&(q=w,this.setSize(Y,se,!1))},this.getSize=function(w){return w.set(Y,se)},this.setSize=function(w,F,W=!0){if($.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Y=w,se=F,t.width=Math.floor(w*q),t.height=Math.floor(F*q),W===!0&&(t.style.width=w+"px",t.style.height=F+"px"),this.setViewport(0,0,w,F)},this.getDrawingBufferSize=function(w){return w.set(Y*q,se*q).floor()},this.setDrawingBufferSize=function(w,F,W){Y=w,se=F,q=W,t.width=Math.floor(w*W),t.height=Math.floor(F*W),this.setViewport(0,0,w,F)},this.getCurrentViewport=function(w){return w.copy(U)},this.getViewport=function(w){return w.copy(Ce)},this.setViewport=function(w,F,W,X){w.isVector4?Ce.set(w.x,w.y,w.z,w.w):Ce.set(w,F,W,X),me.viewport(U.copy(Ce).multiplyScalar(q).round())},this.getScissor=function(w){return w.copy(We)},this.setScissor=function(w,F,W,X){w.isVector4?We.set(w.x,w.y,w.z,w.w):We.set(w,F,W,X),me.scissor(k.copy(We).multiplyScalar(q).round())},this.getScissorTest=function(){return ct},this.setScissorTest=function(w){me.setScissorTest(ct=w)},this.setOpaqueSort=function(w){ge=w},this.setTransparentSort=function(w){Me=w},this.getClearColor=function(w){return w.copy(qe.getClearColor())},this.setClearColor=function(){qe.setClearColor.apply(qe,arguments)},this.getClearAlpha=function(){return qe.getClearAlpha()},this.setClearAlpha=function(){qe.setClearAlpha.apply(qe,arguments)},this.clear=function(w=!0,F=!0,W=!0){let X=0;if(w){let B=!1;if(A!==null){let de=A.texture.format;B=de===yc||de===_c||de===gc}if(B){let de=A.texture.type,Te=de===ii||de===Xi||de===or||de===Es||de===pc||de===mc,Be=qe.getClearColor(),ze=qe.getClearAlpha(),Ze=Be.r,je=Be.g,ke=Be.b;Te?(y[0]=Ze,y[1]=je,y[2]=ke,y[3]=ze,N.clearBufferuiv(N.COLOR,0,y)):(_[0]=Ze,_[1]=je,_[2]=ke,_[3]=ze,N.clearBufferiv(N.COLOR,0,_))}else X|=N.COLOR_BUFFER_BIT}F&&(X|=N.DEPTH_BUFFER_BIT),W&&(X|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N.clear(X)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",te,!1),t.removeEventListener("webglcontextrestored",Ee,!1),t.removeEventListener("webglcontextcreationerror",be,!1),we.dispose(),rt.dispose(),Ae.dispose(),E.dispose(),H.dispose(),j.dispose(),St.dispose(),O.dispose(),Oe.dispose(),$.dispose(),$.removeEventListener("sessionstart",zc),$.removeEventListener("sessionend",kc),Di.stop()};function te(w){w.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),L=!0}function Ee(){console.log("THREE.WebGLRenderer: Context Restored."),L=!1;let w=Ye.autoReset,F=Le.enabled,W=Le.autoUpdate,X=Le.needsUpdate,B=Le.type;xe(),Ye.autoReset=w,Le.enabled=F,Le.autoUpdate=W,Le.needsUpdate=X,Le.type=B}function be(w){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function Ke(w){let F=w.target;F.removeEventListener("dispose",Ke),It(F)}function It(w){Yt(w),Ae.remove(w)}function Yt(w){let F=Ae.get(w).programs;F!==void 0&&(F.forEach(function(W){Oe.releaseProgram(W)}),w.isShaderMaterial&&Oe.releaseShaderCache(w))}this.renderBufferDirect=function(w,F,W,X,B,de){F===null&&(F=nt);let Te=B.isMesh&&B.matrixWorld.determinant()<0,Be=xu(w,F,W,X,B);me.setMaterial(X,Te);let ze=W.index,Ze=1;if(X.wireframe===!0){if(ze=re.getWireframeAttribute(W),ze===void 0)return;Ze=2}let je=W.drawRange,ke=W.attributes.position,ht=je.start*Ze,Mt=(je.start+je.count)*Ze;de!==null&&(ht=Math.max(ht,de.start*Ze),Mt=Math.min(Mt,(de.start+de.count)*Ze)),ze!==null?(ht=Math.max(ht,0),Mt=Math.min(Mt,ze.count)):ke!=null&&(ht=Math.max(ht,0),Mt=Math.min(Mt,ke.count));let Tt=Mt-ht;if(Tt<0||Tt===1/0)return;St.setup(B,X,Be,W,ze);let nn,dt=De;if(ze!==null&&(nn=J.get(ze),dt=lt,dt.setIndex(nn)),B.isMesh)X.wireframe===!0?(me.setLineWidth(X.wireframeLinewidth*ue()),dt.setMode(N.LINES)):dt.setMode(N.TRIANGLES);else if(B.isLine){let Ve=X.linewidth;Ve===void 0&&(Ve=1),me.setLineWidth(Ve*ue()),B.isLineSegments?dt.setMode(N.LINES):B.isLineLoop?dt.setMode(N.LINE_LOOP):dt.setMode(N.LINE_STRIP)}else B.isPoints?dt.setMode(N.POINTS):B.isSprite&&dt.setMode(N.TRIANGLES);if(B.isBatchedMesh)if(B._multiDrawInstances!==null)dt.renderMultiDrawInstances(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount,B._multiDrawInstances);else if(le.get("WEBGL_multi_draw"))dt.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{let Ve=B._multiDrawStarts,Yn=B._multiDrawCounts,pt=B._multiDrawCount,An=ze?J.get(ze).bytesPerElement:1,Ki=Ae.get(X).currentProgram.getUniforms();for(let un=0;un<pt;un++)Ki.setValue(N,"_gl_DrawID",un),dt.render(Ve[un]/An,Yn[un])}else if(B.isInstancedMesh)dt.renderInstances(ht,Tt,B.count);else if(W.isInstancedBufferGeometry){let Ve=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Yn=Math.min(W.instanceCount,Ve);dt.renderInstances(ht,Tt,Yn)}else dt.render(ht,Tt)};function mt(w,F,W){w.transparent===!0&&w.side===Je&&w.forceSinglePass===!1?(w.side=Jt,w.needsUpdate=!0,wr(w,F,W),w.side=sn,w.needsUpdate=!0,wr(w,F,W),w.side=Je):wr(w,F,W)}this.compile=function(w,F,W=null){W===null&&(W=w),f=rt.get(W),f.init(F),S.push(f),W.traverseVisible(function(B){B.isLight&&B.layers.test(F.layers)&&(f.pushLight(B),B.castShadow&&f.pushShadow(B))}),w!==W&&w.traverseVisible(function(B){B.isLight&&B.layers.test(F.layers)&&(f.pushLight(B),B.castShadow&&f.pushShadow(B))}),f.setupLights();let X=new Set;return w.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;let de=B.material;if(de)if(Array.isArray(de))for(let Te=0;Te<de.length;Te++){let Be=de[Te];mt(Be,W,B),X.add(Be)}else mt(de,W,B),X.add(de)}),S.pop(),f=null,X},this.compileAsync=function(w,F,W=null){let X=this.compile(w,F,W);return new Promise(B=>{function de(){if(X.forEach(function(Te){Ae.get(Te).currentProgram.isReady()&&X.delete(Te)}),X.size===0){B(w);return}setTimeout(de,10)}le.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let En=null;function Xn(w){En&&En(w)}function zc(){Di.stop()}function kc(){Di.start()}let Di=new Tf;Di.setAnimationLoop(Xn),typeof self<"u"&&Di.setContext(self),this.setAnimationLoop=function(w){En=w,$.setAnimationLoop(w),w===null?Di.stop():Di.start()},$.addEventListener("sessionstart",zc),$.addEventListener("sessionend",kc),this.render=function(w,F){if(F!==void 0&&F.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(L===!0)return;if(w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),$.enabled===!0&&$.isPresenting===!0&&($.cameraAutoUpdate===!0&&$.updateCamera(F),F=$.getCamera()),w.isScene===!0&&w.onBeforeRender(g,w,F,A),f=rt.get(w,S.length),f.init(F),S.push(f),Z.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),K.setFromProjectionMatrix(Z),Ue=this.localClippingEnabled,fe=ce.init(this.clippingPlanes,Ue),m=we.get(w,v.length),m.init(),v.push(m),$.enabled===!0&&$.isPresenting===!0){let de=g.xr.getDepthSensingMesh();de!==null&&ro(de,F,-1/0,g.sortObjects)}ro(w,F,0,g.sortObjects),m.finish(),g.sortObjects===!0&&m.sort(ge,Me),ne=$.enabled===!1||$.isPresenting===!1||$.hasDepthSensing()===!1,ne&&qe.addToRenderList(m,w),this.info.render.frame++,fe===!0&&ce.beginShadows();let W=f.state.shadowsArray;Le.render(W,w,F),fe===!0&&ce.endShadows(),this.info.autoReset===!0&&this.info.reset();let X=m.opaque,B=m.transmissive;if(f.setupLights(),F.isArrayCamera){let de=F.cameras;if(B.length>0)for(let Te=0,Be=de.length;Te<Be;Te++){let ze=de[Te];Vc(X,B,w,ze)}ne&&qe.render(w);for(let Te=0,Be=de.length;Te<Be;Te++){let ze=de[Te];Hc(m,w,ze,ze.viewport)}}else B.length>0&&Vc(X,B,w,F),ne&&qe.render(w),Hc(m,w,F);A!==null&&(I.updateMultisampleRenderTarget(A),I.updateRenderTargetMipmap(A)),w.isScene===!0&&w.onAfterRender(g,w,F),St.resetDefaultState(),x=-1,M=null,S.pop(),S.length>0?(f=S[S.length-1],fe===!0&&ce.setGlobalState(g.clippingPlanes,f.state.camera)):f=null,v.pop(),v.length>0?m=v[v.length-1]:m=null};function ro(w,F,W,X){if(w.visible===!1)return;if(w.layers.test(F.layers)){if(w.isGroup)W=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(F);else if(w.isLight)f.pushLight(w),w.castShadow&&f.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||K.intersectsSprite(w)){X&&ye.setFromMatrixPosition(w.matrixWorld).applyMatrix4(Z);let Te=j.update(w),Be=w.material;Be.visible&&m.push(w,Te,Be,W,ye.z,null)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||K.intersectsObject(w))){let Te=j.update(w),Be=w.material;if(X&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),ye.copy(w.boundingSphere.center)):(Te.boundingSphere===null&&Te.computeBoundingSphere(),ye.copy(Te.boundingSphere.center)),ye.applyMatrix4(w.matrixWorld).applyMatrix4(Z)),Array.isArray(Be)){let ze=Te.groups;for(let Ze=0,je=ze.length;Ze<je;Ze++){let ke=ze[Ze],ht=Be[ke.materialIndex];ht&&ht.visible&&m.push(w,Te,ht,W,ye.z,ke)}}else Be.visible&&m.push(w,Te,Be,W,ye.z,null)}}let de=w.children;for(let Te=0,Be=de.length;Te<Be;Te++)ro(de[Te],F,W,X)}function Hc(w,F,W,X){let B=w.opaque,de=w.transmissive,Te=w.transparent;f.setupLightsView(W),fe===!0&&ce.setGlobalState(g.clippingPlanes,W),X&&me.viewport(U.copy(X)),B.length>0&&Ar(B,F,W),de.length>0&&Ar(de,F,W),Te.length>0&&Ar(Te,F,W),me.buffers.depth.setTest(!0),me.buffers.depth.setMask(!0),me.buffers.color.setMask(!0),me.setPolygonOffset(!1)}function Vc(w,F,W,X){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[X.id]===void 0&&(f.state.transmissionRenderTarget[X.id]=new ri(1,1,{generateMipmaps:!0,type:le.has("EXT_color_buffer_half_float")||le.has("EXT_color_buffer_float")?br:ii,minFilter:Wi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:at.workingColorSpace}));let de=f.state.transmissionRenderTarget[X.id],Te=X.viewport||U;de.setSize(Te.z,Te.w);let Be=g.getRenderTarget();g.setRenderTarget(de),g.getClearColor(G),Q=g.getClearAlpha(),Q<1&&g.setClearColor(16777215,.5),g.clear(),ne&&qe.render(W);let ze=g.toneMapping;g.toneMapping=Mi;let Ze=X.viewport;if(X.viewport!==void 0&&(X.viewport=void 0),f.setupLightsView(X),fe===!0&&ce.setGlobalState(g.clippingPlanes,X),Ar(w,W,X),I.updateMultisampleRenderTarget(de),I.updateRenderTargetMipmap(de),le.has("WEBGL_multisampled_render_to_texture")===!1){let je=!1;for(let ke=0,ht=F.length;ke<ht;ke++){let Mt=F[ke],Tt=Mt.object,nn=Mt.geometry,dt=Mt.material,Ve=Mt.group;if(dt.side===Je&&Tt.layers.test(X.layers)){let Yn=dt.side;dt.side=Jt,dt.needsUpdate=!0,Gc(Tt,W,X,nn,dt,Ve),dt.side=Yn,dt.needsUpdate=!0,je=!0}}je===!0&&(I.updateMultisampleRenderTarget(de),I.updateRenderTargetMipmap(de))}g.setRenderTarget(Be),g.setClearColor(G,Q),Ze!==void 0&&(X.viewport=Ze),g.toneMapping=ze}function Ar(w,F,W){let X=F.isScene===!0?F.overrideMaterial:null;for(let B=0,de=w.length;B<de;B++){let Te=w[B],Be=Te.object,ze=Te.geometry,Ze=X===null?Te.material:X,je=Te.group;Be.layers.test(W.layers)&&Gc(Be,F,W,ze,Ze,je)}}function Gc(w,F,W,X,B,de){w.onBeforeRender(g,F,W,X,B,de),w.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),B.onBeforeRender(g,F,W,X,w,de),B.transparent===!0&&B.side===Je&&B.forceSinglePass===!1?(B.side=Jt,B.needsUpdate=!0,g.renderBufferDirect(W,F,X,B,w,de),B.side=sn,B.needsUpdate=!0,g.renderBufferDirect(W,F,X,B,w,de),B.side=Je):g.renderBufferDirect(W,F,X,B,w,de),w.onAfterRender(g,F,W,X,B,de)}function wr(w,F,W){F.isScene!==!0&&(F=nt);let X=Ae.get(w),B=f.state.lights,de=f.state.shadowsArray,Te=B.state.version,Be=Oe.getParameters(w,B.state,de,F,W),ze=Oe.getProgramCacheKey(Be),Ze=X.programs;X.environment=w.isMeshStandardMaterial?F.environment:null,X.fog=F.fog,X.envMap=(w.isMeshStandardMaterial?H:E).get(w.envMap||X.environment),X.envMapRotation=X.environment!==null&&w.envMap===null?F.environmentRotation:w.envMapRotation,Ze===void 0&&(w.addEventListener("dispose",Ke),Ze=new Map,X.programs=Ze);let je=Ze.get(ze);if(je!==void 0){if(X.currentProgram===je&&X.lightsStateVersion===Te)return Xc(w,Be),je}else Be.uniforms=Oe.getUniforms(w),w.onBeforeCompile(Be,g),je=Oe.acquireProgram(Be,ze),Ze.set(ze,je),X.uniforms=Be.uniforms;let ke=X.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(ke.clippingPlanes=ce.uniform),Xc(w,Be),X.needsLights=Mu(w),X.lightsStateVersion=Te,X.needsLights&&(ke.ambientLightColor.value=B.state.ambient,ke.lightProbe.value=B.state.probe,ke.directionalLights.value=B.state.directional,ke.directionalLightShadows.value=B.state.directionalShadow,ke.spotLights.value=B.state.spot,ke.spotLightShadows.value=B.state.spotShadow,ke.rectAreaLights.value=B.state.rectArea,ke.ltc_1.value=B.state.rectAreaLTC1,ke.ltc_2.value=B.state.rectAreaLTC2,ke.pointLights.value=B.state.point,ke.pointLightShadows.value=B.state.pointShadow,ke.hemisphereLights.value=B.state.hemi,ke.directionalShadowMap.value=B.state.directionalShadowMap,ke.directionalShadowMatrix.value=B.state.directionalShadowMatrix,ke.spotShadowMap.value=B.state.spotShadowMap,ke.spotLightMatrix.value=B.state.spotLightMatrix,ke.spotLightMap.value=B.state.spotLightMap,ke.pointShadowMap.value=B.state.pointShadowMap,ke.pointShadowMatrix.value=B.state.pointShadowMatrix),X.currentProgram=je,X.uniformsList=null,je}function Wc(w){if(w.uniformsList===null){let F=w.currentProgram.getUniforms();w.uniformsList=Ss.seqWithValue(F.seq,w.uniforms)}return w.uniformsList}function Xc(w,F){let W=Ae.get(w);W.outputColorSpace=F.outputColorSpace,W.batching=F.batching,W.batchingColor=F.batchingColor,W.instancing=F.instancing,W.instancingColor=F.instancingColor,W.instancingMorph=F.instancingMorph,W.skinning=F.skinning,W.morphTargets=F.morphTargets,W.morphNormals=F.morphNormals,W.morphColors=F.morphColors,W.morphTargetsCount=F.morphTargetsCount,W.numClippingPlanes=F.numClippingPlanes,W.numIntersection=F.numClipIntersection,W.vertexAlphas=F.vertexAlphas,W.vertexTangents=F.vertexTangents,W.toneMapping=F.toneMapping}function xu(w,F,W,X,B){F.isScene!==!0&&(F=nt),I.resetTextureUnits();let de=F.fog,Te=X.isMeshStandardMaterial?F.environment:null,Be=A===null?g.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Os,ze=(X.isMeshStandardMaterial?H:E).get(X.envMap||Te),Ze=X.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,je=!!W.attributes.tangent&&(!!X.normalMap||X.anisotropy>0),ke=!!W.morphAttributes.position,ht=!!W.morphAttributes.normal,Mt=!!W.morphAttributes.color,Tt=Mi;X.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Tt=g.toneMapping);let nn=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,dt=nn!==void 0?nn.length:0,Ve=Ae.get(X),Yn=f.state.lights;if(fe===!0&&(Ue===!0||w!==M)){let _n=w===M&&X.id===x;ce.setState(X,w,_n)}let pt=!1;X.version===Ve.__version?(Ve.needsLights&&Ve.lightsStateVersion!==Yn.state.version||Ve.outputColorSpace!==Be||B.isBatchedMesh&&Ve.batching===!1||!B.isBatchedMesh&&Ve.batching===!0||B.isBatchedMesh&&Ve.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&Ve.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&Ve.instancing===!1||!B.isInstancedMesh&&Ve.instancing===!0||B.isSkinnedMesh&&Ve.skinning===!1||!B.isSkinnedMesh&&Ve.skinning===!0||B.isInstancedMesh&&Ve.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&Ve.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&Ve.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&Ve.instancingMorph===!1&&B.morphTexture!==null||Ve.envMap!==ze||X.fog===!0&&Ve.fog!==de||Ve.numClippingPlanes!==void 0&&(Ve.numClippingPlanes!==ce.numPlanes||Ve.numIntersection!==ce.numIntersection)||Ve.vertexAlphas!==Ze||Ve.vertexTangents!==je||Ve.morphTargets!==ke||Ve.morphNormals!==ht||Ve.morphColors!==Mt||Ve.toneMapping!==Tt||Ve.morphTargetsCount!==dt)&&(pt=!0):(pt=!0,Ve.__version=X.version);let An=Ve.currentProgram;pt===!0&&(An=wr(X,F,B));let Ki=!1,un=!1,Hs=!1,Et=An.getUniforms(),On=Ve.uniforms;if(me.useProgram(An.program)&&(Ki=!0,un=!0,Hs=!0),X.id!==x&&(x=X.id,un=!0),Ki||M!==w){me.buffers.depth.getReversed()?(P.copy(w.projectionMatrix),Ad(P),wd(P),Et.setValue(N,"projectionMatrix",P)):Et.setValue(N,"projectionMatrix",w.projectionMatrix),Et.setValue(N,"viewMatrix",w.matrixWorldInverse);let ui=Et.map.cameraPosition;ui!==void 0&&ui.setValue(N,pe.setFromMatrixPosition(w.matrixWorld)),Re.logarithmicDepthBuffer&&Et.setValue(N,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(X.isMeshPhongMaterial||X.isMeshToonMaterial||X.isMeshLambertMaterial||X.isMeshBasicMaterial||X.isMeshStandardMaterial||X.isShaderMaterial)&&Et.setValue(N,"isOrthographic",w.isOrthographicCamera===!0),M!==w&&(M=w,un=!0,Hs=!0)}if(B.isSkinnedMesh){Et.setOptional(N,B,"bindMatrix"),Et.setOptional(N,B,"bindMatrixInverse");let _n=B.skeleton;_n&&(_n.boneTexture===null&&_n.computeBoneTexture(),Et.setValue(N,"boneTexture",_n.boneTexture,I))}B.isBatchedMesh&&(Et.setOptional(N,B,"batchingTexture"),Et.setValue(N,"batchingTexture",B._matricesTexture,I),Et.setOptional(N,B,"batchingIdTexture"),Et.setValue(N,"batchingIdTexture",B._indirectTexture,I),Et.setOptional(N,B,"batchingColorTexture"),B._colorsTexture!==null&&Et.setValue(N,"batchingColorTexture",B._colorsTexture,I));let Vs=W.morphAttributes;if((Vs.position!==void 0||Vs.normal!==void 0||Vs.color!==void 0)&&$e.update(B,W,An),(un||Ve.receiveShadow!==B.receiveShadow)&&(Ve.receiveShadow=B.receiveShadow,Et.setValue(N,"receiveShadow",B.receiveShadow)),X.isMeshGouraudMaterial&&X.envMap!==null&&(On.envMap.value=ze,On.flipEnvMap.value=ze.isCubeTexture&&ze.isRenderTargetTexture===!1?-1:1),X.isMeshStandardMaterial&&X.envMap===null&&F.environment!==null&&(On.envMapIntensity.value=F.environmentIntensity),un&&(Et.setValue(N,"toneMappingExposure",g.toneMappingExposure),Ve.needsLights&&Su(On,Hs),de&&X.fog===!0&&ve.refreshFogUniforms(On,de),ve.refreshMaterialUniforms(On,X,q,se,f.state.transmissionRenderTarget[w.id]),Ss.upload(N,Wc(Ve),On,I)),X.isShaderMaterial&&X.uniformsNeedUpdate===!0&&(Ss.upload(N,Wc(Ve),On,I),X.uniformsNeedUpdate=!1),X.isSpriteMaterial&&Et.setValue(N,"center",B.center),Et.setValue(N,"modelViewMatrix",B.modelViewMatrix),Et.setValue(N,"normalMatrix",B.normalMatrix),Et.setValue(N,"modelMatrix",B.matrixWorld),X.isShaderMaterial||X.isRawShaderMaterial){let _n=X.uniformsGroups;for(let ui=0,di=_n.length;ui<di;ui++){let Yc=_n[ui];O.update(Yc,An),O.bind(Yc,An)}}return An}function Su(w,F){w.ambientLightColor.needsUpdate=F,w.lightProbe.needsUpdate=F,w.directionalLights.needsUpdate=F,w.directionalLightShadows.needsUpdate=F,w.pointLights.needsUpdate=F,w.pointLightShadows.needsUpdate=F,w.spotLights.needsUpdate=F,w.spotLightShadows.needsUpdate=F,w.rectAreaLights.needsUpdate=F,w.hemisphereLights.needsUpdate=F}function Mu(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(w,F,W){Ae.get(w.texture).__webglTexture=F,Ae.get(w.depthTexture).__webglTexture=W;let X=Ae.get(w);X.__hasExternalTextures=!0,X.__autoAllocateDepthBuffer=W===void 0,X.__autoAllocateDepthBuffer||le.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),X.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(w,F){let W=Ae.get(w);W.__webglFramebuffer=F,W.__useDefaultFramebuffer=F===void 0},this.setRenderTarget=function(w,F=0,W=0){A=w,R=F,C=W;let X=!0,B=null,de=!1,Te=!1;if(w){let ze=Ae.get(w);if(ze.__useDefaultFramebuffer!==void 0)me.bindFramebuffer(N.FRAMEBUFFER,null),X=!1;else if(ze.__webglFramebuffer===void 0)I.setupRenderTarget(w);else if(ze.__hasExternalTextures)I.rebindTextures(w,Ae.get(w.texture).__webglTexture,Ae.get(w.depthTexture).__webglTexture);else if(w.depthBuffer){let ke=w.depthTexture;if(ze.__boundDepthTexture!==ke){if(ke!==null&&Ae.has(ke)&&(w.width!==ke.image.width||w.height!==ke.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");I.setupDepthRenderbuffer(w)}}let Ze=w.texture;(Ze.isData3DTexture||Ze.isDataArrayTexture||Ze.isCompressedArrayTexture)&&(Te=!0);let je=Ae.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(je[F])?B=je[F][W]:B=je[F],de=!0):w.samples>0&&I.useMultisampledRTT(w)===!1?B=Ae.get(w).__webglMultisampledFramebuffer:Array.isArray(je)?B=je[W]:B=je,U.copy(w.viewport),k.copy(w.scissor),z=w.scissorTest}else U.copy(Ce).multiplyScalar(q).floor(),k.copy(We).multiplyScalar(q).floor(),z=ct;if(me.bindFramebuffer(N.FRAMEBUFFER,B)&&X&&me.drawBuffers(w,B),me.viewport(U),me.scissor(k),me.setScissorTest(z),de){let ze=Ae.get(w.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+F,ze.__webglTexture,W)}else if(Te){let ze=Ae.get(w.texture),Ze=F||0;N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,ze.__webglTexture,W||0,Ze)}x=-1},this.readRenderTargetPixels=function(w,F,W,X,B,de,Te){if(!(w&&w.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Be=Ae.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&Te!==void 0&&(Be=Be[Te]),Be){me.bindFramebuffer(N.FRAMEBUFFER,Be);try{let ze=w.texture,Ze=ze.format,je=ze.type;if(!Re.textureFormatReadable(Ze)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Re.textureTypeReadable(je)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=w.width-X&&W>=0&&W<=w.height-B&&N.readPixels(F,W,X,B,et.convert(Ze),et.convert(je),de)}finally{let ze=A!==null?Ae.get(A).__webglFramebuffer:null;me.bindFramebuffer(N.FRAMEBUFFER,ze)}}},this.readRenderTargetPixelsAsync=async function(w,F,W,X,B,de,Te){if(!(w&&w.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Be=Ae.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&Te!==void 0&&(Be=Be[Te]),Be){let ze=w.texture,Ze=ze.format,je=ze.type;if(!Re.textureFormatReadable(Ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Re.textureTypeReadable(je))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(F>=0&&F<=w.width-X&&W>=0&&W<=w.height-B){me.bindFramebuffer(N.FRAMEBUFFER,Be);let ke=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,ke),N.bufferData(N.PIXEL_PACK_BUFFER,de.byteLength,N.STREAM_READ),N.readPixels(F,W,X,B,et.convert(Ze),et.convert(je),0);let ht=A!==null?Ae.get(A).__webglFramebuffer:null;me.bindFramebuffer(N.FRAMEBUFFER,ht);let Mt=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await Ed(N,Mt,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,ke),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,de),N.deleteBuffer(ke),N.deleteSync(Mt),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(w,F=null,W=0){w.isTexture!==!0&&(Qs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),F=arguments[0]||null,w=arguments[1]);let X=Math.pow(2,-W),B=Math.floor(w.image.width*X),de=Math.floor(w.image.height*X),Te=F!==null?F.x:0,Be=F!==null?F.y:0;I.setTexture2D(w,0),N.copyTexSubImage2D(N.TEXTURE_2D,W,0,0,Te,Be,B,de),me.unbindTexture()},this.copyTextureToTexture=function(w,F,W=null,X=null,B=0){w.isTexture!==!0&&(Qs("WebGLRenderer: copyTextureToTexture function signature has changed."),X=arguments[0]||null,w=arguments[1],F=arguments[2],B=arguments[3]||0,W=null);let de,Te,Be,ze,Ze,je,ke,ht,Mt,Tt=w.isCompressedTexture?w.mipmaps[B]:w.image;W!==null?(de=W.max.x-W.min.x,Te=W.max.y-W.min.y,Be=W.isBox3?W.max.z-W.min.z:1,ze=W.min.x,Ze=W.min.y,je=W.isBox3?W.min.z:0):(de=Tt.width,Te=Tt.height,Be=Tt.depth||1,ze=0,Ze=0,je=0),X!==null?(ke=X.x,ht=X.y,Mt=X.z):(ke=0,ht=0,Mt=0);let nn=et.convert(F.format),dt=et.convert(F.type),Ve;F.isData3DTexture?(I.setTexture3D(F,0),Ve=N.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(I.setTexture2DArray(F,0),Ve=N.TEXTURE_2D_ARRAY):(I.setTexture2D(F,0),Ve=N.TEXTURE_2D),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,F.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,F.unpackAlignment);let Yn=N.getParameter(N.UNPACK_ROW_LENGTH),pt=N.getParameter(N.UNPACK_IMAGE_HEIGHT),An=N.getParameter(N.UNPACK_SKIP_PIXELS),Ki=N.getParameter(N.UNPACK_SKIP_ROWS),un=N.getParameter(N.UNPACK_SKIP_IMAGES);N.pixelStorei(N.UNPACK_ROW_LENGTH,Tt.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,Tt.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,ze),N.pixelStorei(N.UNPACK_SKIP_ROWS,Ze),N.pixelStorei(N.UNPACK_SKIP_IMAGES,je);let Hs=w.isDataArrayTexture||w.isData3DTexture,Et=F.isDataArrayTexture||F.isData3DTexture;if(w.isRenderTargetTexture||w.isDepthTexture){let On=Ae.get(w),Vs=Ae.get(F),_n=Ae.get(On.__renderTarget),ui=Ae.get(Vs.__renderTarget);me.bindFramebuffer(N.READ_FRAMEBUFFER,_n.__webglFramebuffer),me.bindFramebuffer(N.DRAW_FRAMEBUFFER,ui.__webglFramebuffer);for(let di=0;di<Be;di++)Hs&&N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,Ae.get(w).__webglTexture,B,je+di),w.isDepthTexture?(Et&&N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,Ae.get(F).__webglTexture,B,Mt+di),N.blitFramebuffer(ze,Ze,de,Te,ke,ht,de,Te,N.DEPTH_BUFFER_BIT,N.NEAREST)):Et?N.copyTexSubImage3D(Ve,B,ke,ht,Mt+di,ze,Ze,de,Te):N.copyTexSubImage2D(Ve,B,ke,ht,Mt+di,ze,Ze,de,Te);me.bindFramebuffer(N.READ_FRAMEBUFFER,null),me.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else Et?w.isDataTexture||w.isData3DTexture?N.texSubImage3D(Ve,B,ke,ht,Mt,de,Te,Be,nn,dt,Tt.data):F.isCompressedArrayTexture?N.compressedTexSubImage3D(Ve,B,ke,ht,Mt,de,Te,Be,nn,Tt.data):N.texSubImage3D(Ve,B,ke,ht,Mt,de,Te,Be,nn,dt,Tt):w.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,B,ke,ht,de,Te,nn,dt,Tt.data):w.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,B,ke,ht,Tt.width,Tt.height,nn,Tt.data):N.texSubImage2D(N.TEXTURE_2D,B,ke,ht,de,Te,nn,dt,Tt);N.pixelStorei(N.UNPACK_ROW_LENGTH,Yn),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,pt),N.pixelStorei(N.UNPACK_SKIP_PIXELS,An),N.pixelStorei(N.UNPACK_SKIP_ROWS,Ki),N.pixelStorei(N.UNPACK_SKIP_IMAGES,un),B===0&&F.generateMipmaps&&N.generateMipmap(Ve),me.unbindTexture()},this.copyTextureToTexture3D=function(w,F,W=null,X=null,B=0){return w.isTexture!==!0&&(Qs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),W=arguments[0]||null,X=arguments[1]||null,w=arguments[2],F=arguments[3],B=arguments[4]||0),Qs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(w,F,W,X,B)},this.initRenderTarget=function(w){Ae.get(w).__webglFramebuffer===void 0&&I.setupRenderTarget(w)},this.initTexture=function(w){w.isCubeTexture?I.setTextureCube(w,0):w.isData3DTexture?I.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?I.setTexture2DArray(w,0):I.setTexture2D(w,0),me.unbindTexture()},this.resetState=function(){R=0,C=0,A=null,me.reset(),St.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Qn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=at._getDrawingBufferColorSpace(e),t.unpackColorSpace=at._getUnpackColorSpace()}},ba=class n{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new Xe(e),this.density=t}clone(){return new n(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Ta=class extends Gt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new vn,this.environmentIntensity=1,this.environmentRotation=new vn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},Vl=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=El,this.updateRanges=[],this.version=0,this.uuid=Hn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let s=0,r=this.stride;s<r;s++)this.array[e+s]=t.array[i+s];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Hn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},en=new D,Ea=class n{constructor(e,t,i,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)en.fromBufferAttribute(this,t),en.applyMatrix4(e),this.setXYZ(t,en.x,en.y,en.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)en.fromBufferAttribute(this,t),en.applyNormalMatrix(e),this.setXYZ(t,en.x,en.y,en.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)en.fromBufferAttribute(this,t),en.transformDirection(e),this.setXYZ(t,en.x,en.y,en.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=In(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=gt(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=gt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=gt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=gt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=gt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=In(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=In(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=In(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=In(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=gt(t,this.array),i=gt(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=gt(t,this.array),i=gt(i,this.array),s=gt(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=gt(t,this.array),i=gt(i,this.array),s=gt(s,this.array),r=gt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=s,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return new jt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new n(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Gn=class extends Vn{static get type(){return"SpriteMaterial"}constructor(e){super(),this.isSpriteMaterial=!0,this.color=new Xe(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},us,qs=new D,ds=new D,ps=new D,ms=new ee,$s=new ee,Cf=new ut,Zr=new D,Zs=new D,Jr=new D,Yh=new ee,No=new ee,qh=new ee,oi=class extends Gt{constructor(e=new Gn){if(super(),this.isSprite=!0,this.type="Sprite",us===void 0){us=new Lt;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new Vl(t,5);us.setIndex([0,1,2,0,2,3]),us.setAttribute("position",new Ea(i,3,0,!1)),us.setAttribute("uv",new Ea(i,2,3,!1))}this.geometry=us,this.material=e,this.center=new ee(.5,.5)}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ds.setFromMatrixScale(this.matrixWorld),Cf.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),ps.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ds.multiplyScalar(-ps.z);let i=this.material.rotation,s,r;i!==0&&(r=Math.cos(i),s=Math.sin(i));let a=this.center;Kr(Zr.set(-.5,-.5,0),ps,a,ds,s,r),Kr(Zs.set(.5,-.5,0),ps,a,ds,s,r),Kr(Jr.set(.5,.5,0),ps,a,ds,s,r),Yh.set(0,0),No.set(1,0),qh.set(1,1);let o=e.ray.intersectTriangle(Zr,Zs,Jr,!1,qs);if(o===null&&(Kr(Zs.set(-.5,.5,0),ps,a,ds,s,r),No.set(0,1),o=e.ray.intersectTriangle(Zr,Jr,Zs,!1,qs),o===null))return;let l=e.ray.origin.distanceTo(qs);l<e.near||l>e.far||t.push({distance:l,point:qs.clone(),uv:xi.getInterpolation(qs,Zr,Zs,Jr,Yh,No,qh,new ee),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function Kr(n,e,t,i,s,r){ms.subVectors(n,t).addScalar(.5).multiply(i),s!==void 0?($s.x=r*ms.x-s*ms.y,$s.y=s*ms.x+r*ms.y):$s.copy(ms),n.copy(e),n.x+=$s.x,n.y+=$s.y,n.applyMatrix4(Cf)}var hr=class extends rn{constructor(e=null,t=1,i=1,s,r,a,o,l,c=Kt,h=Kt,u,d){super(null,a,o,l,c,h,s,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Ei=class extends jt{constructor(e,t,i,s=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},gs=new ut,$h=new ut,jr=[],Zh=new ai,x1=new ut,Js=new Pe,Ks=new Ti,Ps=class extends Pe{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ei(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<i;s++)this.setMatrixAt(s,x1)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new ai),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,gs),Zh.copy(e.boundingBox).applyMatrix4(gs),this.boundingBox.union(Zh)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Ti),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,gs),Ks.copy(e.boundingSphere).applyMatrix4(gs),this.boundingSphere.union(Ks)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let i=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=i.length+1,a=e*r+1;for(let o=0;o<i.length;o++)i[o]=s[a+o]}raycast(e,t){let i=this.matrixWorld,s=this.count;if(Js.geometry=this.geometry,Js.material=this.material,Js.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ks.copy(this.boundingSphere),Ks.applyMatrix4(i),e.ray.intersectsSphere(Ks)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,gs),$h.multiplyMatrices(i,gs),Js.matrixWorld=$h,Js.raycast(e,jr);for(let a=0,o=jr.length;a<o;a++){let l=jr[a];l.instanceId=r,l.object=this,t.push(l)}jr.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Ei(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let i=t.morphTargetInfluences,s=i.length+1;this.morphTexture===null&&(this.morphTexture=new hr(new Float32Array(s*this.count),s,this.count,Tr,kn));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<i.length;c++)a+=i[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*e;r[l]=o,r.set(i,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var fr=class extends Vn{static get type(){return"PointsMaterial"}constructor(e){super(),this.isPointsMaterial=!0,this.color=new Xe(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Jh=new ut,Gl=new ws,Qr=new Ti,ea=new D,Aa=class extends Gt{constructor(e=new Lt,t=new fr){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let i=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Qr.copy(i.boundingSphere),Qr.applyMatrix4(s),Qr.radius+=r,e.ray.intersectsSphere(Qr)===!1)return;Jh.copy(s).invert(),Gl.copy(e.ray).applyMatrix4(Jh);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,u=i.attributes.position;if(c!==null){let d=Math.max(0,a.start),p=Math.min(c.count,a.start+a.count);for(let y=d,_=p;y<_;y++){let m=c.getX(y);ea.fromBufferAttribute(u,m),Kh(ea,m,l,s,e,t,this)}}else{let d=Math.max(0,a.start),p=Math.min(u.count,a.start+a.count);for(let y=d,_=p;y<_;y++)ea.fromBufferAttribute(u,y),Kh(ea,y,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function Kh(n,e,t,i,s,r,a){let o=Gl.distanceSqToPoint(n);if(o<t){let l=new D;Gl.closestPointToPoint(n,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}var Is=class extends rn{constructor(e,t,i,s,r,a,o,l,c){super(e,t,i,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Sn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,s=this.getPoint(0),r=0;t.push(0);for(let a=1;a<=e;a++)i=this.getPoint(a/e),r+=i.distanceTo(s),t.push(r),s=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){let i=this.getLengths(),s=0,r=i.length,a;t?a=t:a=e*i[r-1];let o=0,l=r-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=i[s]-a,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===a)return s/(r-1);let h=i[s],d=i[s+1]-h,p=(a-h)/d;return(s+p)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let a=this.getPoint(s),o=this.getPoint(r),l=t||(a.isVector2?new ee:new D);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t){let i=new D,s=[],r=[],a=[],o=new D,l=new ut;for(let p=0;p<=e;p++){let y=p/e;s[p]=this.getTangentAt(y,new D)}r[0]=new D,a[0]=new D;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),u=Math.abs(s[0].y),d=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),d<=c&&i.set(0,0,1),o.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let p=1;p<=e;p++){if(r[p]=r[p-1].clone(),a[p]=a[p-1].clone(),o.crossVectors(s[p-1],s[p]),o.length()>Number.EPSILON){o.normalize();let y=Math.acos(Ot(s[p-1].dot(s[p]),-1,1));r[p].applyMatrix4(l.makeRotationAxis(o,y))}a[p].crossVectors(s[p],r[p])}if(t===!0){let p=Math.acos(Ot(r[0].dot(r[e]),-1,1));p/=e,s[0].dot(o.crossVectors(r[0],r[e]))>0&&(p=-p);for(let y=1;y<=e;y++)r[y].applyMatrix4(l.makeRotationAxis(s[y],p*y)),a[y].crossVectors(s[y],r[y])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},ur=class extends Sn{constructor(e=0,t=0,i=1,s=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new ee){let i=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);let o=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,p=c-this.aY;l=d*h-p*u+this.aX,c=d*u+p*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Wl=class extends ur{constructor(e,t,i,s,r,a){super(e,t,i,i,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};function bc(){let n=0,e=0,t=0,i=0;function s(r,a,o,l){n=r,e=o,t=-3*r+3*a-2*o-l,i=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){s(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,u){let d=(a-r)/c-(o-r)/(c+h)+(o-a)/h,p=(o-a)/h-(l-a)/(h+u)+(l-o)/u;d*=h,p*=h,s(a,o,d,p)},calc:function(r){let a=r*r,o=a*r;return n+e*r+t*a+i*o}}}var ta=new D,Oo=new bc,Fo=new bc,Bo=new bc,dr=class extends Sn{constructor(e=[],t=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=s}getPoint(e,t=new D){let i=t,s=this.points,r=s.length,a=(r-(this.closed?0:1))*e,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=s[(o-1)%r]:(ta.subVectors(s[0],s[1]).add(s[0]),c=ta);let u=s[o%r],d=s[(o+1)%r];if(this.closed||o+2<r?h=s[(o+2)%r]:(ta.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=ta),this.curveType==="centripetal"||this.curveType==="chordal"){let p=this.curveType==="chordal"?.5:.25,y=Math.pow(c.distanceToSquared(u),p),_=Math.pow(u.distanceToSquared(d),p),m=Math.pow(d.distanceToSquared(h),p);_<1e-4&&(_=1),y<1e-4&&(y=_),m<1e-4&&(m=_),Oo.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,y,_,m),Fo.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,y,_,m),Bo.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,y,_,m)}else this.curveType==="catmullrom"&&(Oo.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),Fo.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),Bo.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return i.set(Oo.calc(l),Fo.calc(l),Bo.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new D().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function jh(n,e,t,i,s){let r=(i-e)*.5,a=(s-t)*.5,o=n*n,l=n*o;return(2*t-2*i+r+a)*l+(-3*t+3*i-2*r-a)*o+r*n+t}function S1(n,e){let t=1-n;return t*t*e}function M1(n,e){return 2*(1-n)*n*e}function b1(n,e){return n*n*e}function sr(n,e,t,i){return S1(n,e)+M1(n,t)+b1(n,i)}function T1(n,e){let t=1-n;return t*t*t*e}function E1(n,e){let t=1-n;return 3*t*t*n*e}function A1(n,e){return 3*(1-n)*n*n*e}function w1(n,e){return n*n*n*e}function rr(n,e,t,i,s){return T1(n,e)+E1(n,t)+A1(n,i)+w1(n,s)}var wa=class extends Sn{constructor(e=new ee,t=new ee,i=new ee,s=new ee){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new ee){let i=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return i.set(rr(e,s.x,r.x,a.x,o.x),rr(e,s.y,r.y,a.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Xl=class extends Sn{constructor(e=new D,t=new D,i=new D,s=new D){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new D){let i=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return i.set(rr(e,s.x,r.x,a.x,o.x),rr(e,s.y,r.y,a.y,o.y),rr(e,s.z,r.z,a.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Ra=class extends Sn{constructor(e=new ee,t=new ee){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ee){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ee){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Yl=class extends Sn{constructor(e=new D,t=new D){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new D){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new D){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ca=class extends Sn{constructor(e=new ee,t=new ee,i=new ee){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new ee){let i=t,s=this.v0,r=this.v1,a=this.v2;return i.set(sr(e,s.x,r.x,a.x),sr(e,s.y,r.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Pa=class extends Sn{constructor(e=new D,t=new D,i=new D){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new D){let i=t,s=this.v0,r=this.v1,a=this.v2;return i.set(sr(e,s.x,r.x,a.x),sr(e,s.y,r.y,a.y),sr(e,s.z,r.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ia=class extends Sn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ee){let i=t,s=this.points,r=(s.length-1)*e,a=Math.floor(r),o=r-a,l=s[a===0?a:a-1],c=s[a],h=s[a>s.length-2?s.length-1:a+1],u=s[a>s.length-3?s.length-1:a+2];return i.set(jh(o,l.x,c.x,h.x,u.x),jh(o,l.y,c.y,h.y,u.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new ee().fromArray(s))}return this}},La=Object.freeze({__proto__:null,ArcCurve:Wl,CatmullRomCurve3:dr,CubicBezierCurve:wa,CubicBezierCurve3:Xl,EllipseCurve:ur,LineCurve:Ra,LineCurve3:Yl,QuadraticBezierCurve:Ca,QuadraticBezierCurve3:Pa,SplineCurve:Ia}),ql=class extends Sn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new La[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let a=s[r]-i,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,s=this.curves.length;i<s;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let s=0,r=this.curves;s<r.length;s++){let a=r[s],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(new La[s.type]().fromJSON(s))}return this}},pr=class extends ql{constructor(e){super(),this.type="Path",this.currentPoint=new ee,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new Ra(this.currentPoint.clone(),new ee(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,s){let r=new Ca(this.currentPoint.clone(),new ee(e,t),new ee(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(e,t,i,s,r,a){let o=new wa(this.currentPoint.clone(),new ee(e,t),new ee(i,s),new ee(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new Ia(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,s,r,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,i,s,r,a),this}absarc(e,t,i,s,r,a){return this.absellipse(e,t,i,i,s,r,a),this}ellipse(e,t,i,s,r,a,o,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,s,r,a,o,l),this}absellipse(e,t,i,s,r,a,o,l){let c=new ur(e,t,i,s,r,a,o,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},$l=class n extends Lt{constructor(e=[new ee(0,-.5),new ee(.5,0),new ee(0,.5)],t=12,i=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:s},t=Math.floor(t),s=Ot(s,0,Math.PI*2);let r=[],a=[],o=[],l=[],c=[],h=1/t,u=new D,d=new ee,p=new D,y=new D,_=new D,m=0,f=0;for(let v=0;v<=e.length-1;v++)switch(v){case 0:m=e[v+1].x-e[v].x,f=e[v+1].y-e[v].y,p.x=f*1,p.y=-m,p.z=f*0,_.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case e.length-1:l.push(_.x,_.y,_.z);break;default:m=e[v+1].x-e[v].x,f=e[v+1].y-e[v].y,p.x=f*1,p.y=-m,p.z=f*0,y.copy(p),p.x+=_.x,p.y+=_.y,p.z+=_.z,p.normalize(),l.push(p.x,p.y,p.z),_.copy(y)}for(let v=0;v<=t;v++){let S=i+v*h*s,g=Math.sin(S),L=Math.cos(S);for(let R=0;R<=e.length-1;R++){u.x=e[R].x*g,u.y=e[R].y,u.z=e[R].x*L,a.push(u.x,u.y,u.z),d.x=v/t,d.y=R/(e.length-1),o.push(d.x,d.y);let C=l[3*R+0]*g,A=l[3*R+1],x=l[3*R+0]*L;c.push(C,A,x)}}for(let v=0;v<t;v++)for(let S=0;S<e.length-1;S++){let g=S+v*e.length,L=g,R=g+e.length,C=g+e.length+1,A=g+1;r.push(L,R,A),r.push(C,A,R)}this.setIndex(r),this.setAttribute("position",new it(a,3)),this.setAttribute("uv",new it(o,2)),this.setAttribute("normal",new it(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.points,e.segments,e.phiStart,e.phiLength)}},Da=class n extends $l{constructor(e=1,t=1,i=4,s=8){let r=new pr;r.absarc(0,-t/2,e,Math.PI*1.5,0),r.absarc(0,t/2,e,0,Math.PI*.5),super(r.getPoints(i),s),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:i,radialSegments:s}}static fromJSON(e){return new n(e.radius,e.length,e.capSegments,e.radialSegments)}},gn=class n extends Lt{constructor(e=1,t=32,i=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:s},t=Math.max(3,t);let r=[],a=[],o=[],l=[],c=new D,h=new ee;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let p=i+u/t*s;c.x=e*Math.cos(p),c.y=e*Math.sin(p),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/e+1)/2,h.y=(a[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new it(a,3)),this.setAttribute("normal",new it(o,3)),this.setAttribute("uv",new it(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},li=class n extends Lt{constructor(e=1,t=1,i=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],u=[],d=[],p=[],y=0,_=[],m=i/2,f=0;v(),a===!1&&(e>0&&S(!0),t>0&&S(!1)),this.setIndex(h),this.setAttribute("position",new it(u,3)),this.setAttribute("normal",new it(d,3)),this.setAttribute("uv",new it(p,2));function v(){let g=new D,L=new D,R=0,C=(t-e)/i;for(let A=0;A<=r;A++){let x=[],M=A/r,U=M*(t-e)+e;for(let k=0;k<=s;k++){let z=k/s,G=z*l+o,Q=Math.sin(G),Y=Math.cos(G);L.x=U*Q,L.y=-M*i+m,L.z=U*Y,u.push(L.x,L.y,L.z),g.set(Q,C,Y).normalize(),d.push(g.x,g.y,g.z),p.push(z,1-M),x.push(y++)}_.push(x)}for(let A=0;A<s;A++)for(let x=0;x<r;x++){let M=_[x][A],U=_[x+1][A],k=_[x+1][A+1],z=_[x][A+1];(e>0||x!==0)&&(h.push(M,U,z),R+=3),(t>0||x!==r-1)&&(h.push(U,k,z),R+=3)}c.addGroup(f,R,0),f+=R}function S(g){let L=y,R=new ee,C=new D,A=0,x=g===!0?e:t,M=g===!0?1:-1;for(let k=1;k<=s;k++)u.push(0,m*M,0),d.push(0,M,0),p.push(.5,.5),y++;let U=y;for(let k=0;k<=s;k++){let G=k/s*l+o,Q=Math.cos(G),Y=Math.sin(G);C.x=x*Y,C.y=m*M,C.z=x*Q,u.push(C.x,C.y,C.z),d.push(0,M,0),R.x=Q*.5+.5,R.y=Y*.5*M+.5,p.push(R.x,R.y),y++}for(let k=0;k<s;k++){let z=L+k,G=U+k;g===!0?h.push(G,G+1,z):h.push(G+1,G,z),A+=3}c.addGroup(f,A,g===!0?1:2),f+=A}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},mr=class n extends li{constructor(e=1,t=1,i=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,e,t,i,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Zl=class n extends Lt{constructor(e=[],t=[],i=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:s};let r=[],a=[];o(s),c(i),h(),this.setAttribute("position",new it(r,3)),this.setAttribute("normal",new it(r.slice(),3)),this.setAttribute("uv",new it(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(v){let S=new D,g=new D,L=new D;for(let R=0;R<t.length;R+=3)p(t[R+0],S),p(t[R+1],g),p(t[R+2],L),l(S,g,L,v)}function l(v,S,g,L){let R=L+1,C=[];for(let A=0;A<=R;A++){C[A]=[];let x=v.clone().lerp(g,A/R),M=S.clone().lerp(g,A/R),U=R-A;for(let k=0;k<=U;k++)k===0&&A===R?C[A][k]=x:C[A][k]=x.clone().lerp(M,k/U)}for(let A=0;A<R;A++)for(let x=0;x<2*(R-A)-1;x++){let M=Math.floor(x/2);x%2===0?(d(C[A][M+1]),d(C[A+1][M]),d(C[A][M])):(d(C[A][M+1]),d(C[A+1][M+1]),d(C[A+1][M]))}}function c(v){let S=new D;for(let g=0;g<r.length;g+=3)S.x=r[g+0],S.y=r[g+1],S.z=r[g+2],S.normalize().multiplyScalar(v),r[g+0]=S.x,r[g+1]=S.y,r[g+2]=S.z}function h(){let v=new D;for(let S=0;S<r.length;S+=3){v.x=r[S+0],v.y=r[S+1],v.z=r[S+2];let g=m(v)/2/Math.PI+.5,L=f(v)/Math.PI+.5;a.push(g,1-L)}y(),u()}function u(){for(let v=0;v<a.length;v+=6){let S=a[v+0],g=a[v+2],L=a[v+4],R=Math.max(S,g,L),C=Math.min(S,g,L);R>.9&&C<.1&&(S<.2&&(a[v+0]+=1),g<.2&&(a[v+2]+=1),L<.2&&(a[v+4]+=1))}}function d(v){r.push(v.x,v.y,v.z)}function p(v,S){let g=v*3;S.x=e[g+0],S.y=e[g+1],S.z=e[g+2]}function y(){let v=new D,S=new D,g=new D,L=new D,R=new ee,C=new ee,A=new ee;for(let x=0,M=0;x<r.length;x+=9,M+=6){v.set(r[x+0],r[x+1],r[x+2]),S.set(r[x+3],r[x+4],r[x+5]),g.set(r[x+6],r[x+7],r[x+8]),R.set(a[M+0],a[M+1]),C.set(a[M+2],a[M+3]),A.set(a[M+4],a[M+5]),L.copy(v).add(S).add(g).divideScalar(3);let U=m(L);_(R,M+0,v,U),_(C,M+2,S,U),_(A,M+4,g,U)}}function _(v,S,g,L){L<0&&v.x===1&&(a[S]=v.x-1),g.x===0&&g.z===0&&(a[S]=L/2/Math.PI+.5)}function m(v){return Math.atan2(v.z,-v.x)}function f(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.details)}};var Wn=class extends pr{constructor(e){super(e),this.uuid=Hn(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,s=this.holes.length;i<s;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let s=e.holes[t];this.holes.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let s=this.holes[t];e.holes.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let s=e.holes[t];this.holes.push(new pr().fromJSON(s))}return this}},R1={triangulate:function(n,e,t=2){let i=e&&e.length,s=i?e[0]*t:n.length,r=Pf(n,0,s,t,!0),a=[];if(!r||r.next===r.prev)return a;let o,l,c,h,u,d,p;if(i&&(r=D1(n,e,r,t)),n.length>80*t){o=c=n[0],l=h=n[1];for(let y=t;y<s;y+=t)u=n[y],d=n[y+1],u<o&&(o=u),d<l&&(l=d),u>c&&(c=u),d>h&&(h=d);p=Math.max(c-o,h-l),p=p!==0?32767/p:0}return gr(r,a,t,o,l,p,0),a}};function Pf(n,e,t,i,s){let r,a;if(s===W1(n,e,t,i)>0)for(r=e;r<t;r+=i)a=Qh(r,n[r],n[r+1],a);else for(r=t-i;r>=e;r-=i)a=Qh(r,n[r],n[r+1],a);return a&&Za(a,a.next)&&(yr(a),a=a.next),a}function Yi(n,e){if(!n)return n;e||(e=n);let t=n,i;do if(i=!1,!t.steiner&&(Za(t,t.next)||Pt(t.prev,t,t.next)===0)){if(yr(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function gr(n,e,t,i,s,r,a){if(!n)return;!a&&r&&B1(n,i,s,r);let o=n,l,c;for(;n.prev!==n.next;){if(l=n.prev,c=n.next,r?P1(n,i,s,r):C1(n)){e.push(l.i/t|0),e.push(n.i/t|0),e.push(c.i/t|0),yr(n),n=c.next,o=c.next;continue}if(n=c,n===o){a?a===1?(n=I1(Yi(n),e,t),gr(n,e,t,i,s,r,2)):a===2&&L1(n,e,t,i,s,r):gr(Yi(n),e,t,i,s,r,1);break}}}function C1(n){let e=n.prev,t=n,i=n.next;if(Pt(e,t,i)>=0)return!1;let s=e.x,r=t.x,a=i.x,o=e.y,l=t.y,c=i.y,h=s<r?s<a?s:a:r<a?r:a,u=o<l?o<c?o:c:l<c?l:c,d=s>r?s>a?s:a:r>a?r:a,p=o>l?o>c?o:c:l>c?l:c,y=i.next;for(;y!==e;){if(y.x>=h&&y.x<=d&&y.y>=u&&y.y<=p&&ys(s,o,r,l,a,c,y.x,y.y)&&Pt(y.prev,y,y.next)>=0)return!1;y=y.next}return!0}function P1(n,e,t,i){let s=n.prev,r=n,a=n.next;if(Pt(s,r,a)>=0)return!1;let o=s.x,l=r.x,c=a.x,h=s.y,u=r.y,d=a.y,p=o<l?o<c?o:c:l<c?l:c,y=h<u?h<d?h:d:u<d?u:d,_=o>l?o>c?o:c:l>c?l:c,m=h>u?h>d?h:d:u>d?u:d,f=Jl(p,y,e,t,i),v=Jl(_,m,e,t,i),S=n.prevZ,g=n.nextZ;for(;S&&S.z>=f&&g&&g.z<=v;){if(S.x>=p&&S.x<=_&&S.y>=y&&S.y<=m&&S!==s&&S!==a&&ys(o,h,l,u,c,d,S.x,S.y)&&Pt(S.prev,S,S.next)>=0||(S=S.prevZ,g.x>=p&&g.x<=_&&g.y>=y&&g.y<=m&&g!==s&&g!==a&&ys(o,h,l,u,c,d,g.x,g.y)&&Pt(g.prev,g,g.next)>=0))return!1;g=g.nextZ}for(;S&&S.z>=f;){if(S.x>=p&&S.x<=_&&S.y>=y&&S.y<=m&&S!==s&&S!==a&&ys(o,h,l,u,c,d,S.x,S.y)&&Pt(S.prev,S,S.next)>=0)return!1;S=S.prevZ}for(;g&&g.z<=v;){if(g.x>=p&&g.x<=_&&g.y>=y&&g.y<=m&&g!==s&&g!==a&&ys(o,h,l,u,c,d,g.x,g.y)&&Pt(g.prev,g,g.next)>=0)return!1;g=g.nextZ}return!0}function I1(n,e,t){let i=n;do{let s=i.prev,r=i.next.next;!Za(s,r)&&If(s,i,i.next,r)&&_r(s,r)&&_r(r,s)&&(e.push(s.i/t|0),e.push(i.i/t|0),e.push(r.i/t|0),yr(i),yr(i.next),i=n=r),i=i.next}while(i!==n);return Yi(i)}function L1(n,e,t,i,s,r){let a=n;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&H1(a,o)){let l=Lf(a,o);a=Yi(a,a.next),l=Yi(l,l.next),gr(a,e,t,i,s,r,0),gr(l,e,t,i,s,r,0);return}o=o.next}a=a.next}while(a!==n)}function D1(n,e,t,i){let s=[],r,a,o,l,c;for(r=0,a=e.length;r<a;r++)o=e[r]*i,l=r<a-1?e[r+1]*i:n.length,c=Pf(n,o,l,i,!1),c===c.next&&(c.steiner=!0),s.push(k1(c));for(s.sort(U1),r=0;r<s.length;r++)t=N1(s[r],t);return t}function U1(n,e){return n.x-e.x}function N1(n,e){let t=O1(n,e);if(!t)return e;let i=Lf(t,n);return Yi(i,i.next),Yi(t,t.next)}function O1(n,e){let t=e,i=-1/0,s,r=n.x,a=n.y;do{if(a<=t.y&&a>=t.next.y&&t.next.y!==t.y){let d=t.x+(a-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(d<=r&&d>i&&(i=d,s=t.x<t.next.x?t:t.next,d===r))return s}t=t.next}while(t!==e);if(!s)return null;let o=s,l=s.x,c=s.y,h=1/0,u;t=s;do r>=t.x&&t.x>=l&&r!==t.x&&ys(a<c?r:i,a,l,c,a<c?i:r,a,t.x,t.y)&&(u=Math.abs(a-t.y)/(r-t.x),_r(t,n)&&(u<h||u===h&&(t.x>s.x||t.x===s.x&&F1(s,t)))&&(s=t,h=u)),t=t.next;while(t!==o);return s}function F1(n,e){return Pt(n.prev,n,e.prev)<0&&Pt(e.next,n,n.next)<0}function B1(n,e,t,i){let s=n;do s.z===0&&(s.z=Jl(s.x,s.y,e,t,i)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==n);s.prevZ.nextZ=null,s.prevZ=null,z1(s)}function z1(n){let e,t,i,s,r,a,o,l,c=1;do{for(t=n,n=null,r=null,a=0;t;){for(a++,i=t,o=0,e=0;e<c&&(o++,i=i.nextZ,!!i);e++);for(l=c;o>0||l>0&&i;)o!==0&&(l===0||!i||t.z<=i.z)?(s=t,t=t.nextZ,o--):(s=i,i=i.nextZ,l--),r?r.nextZ=s:n=s,s.prevZ=r,r=s;t=i}r.nextZ=null,c*=2}while(a>1);return n}function Jl(n,e,t,i,s){return n=(n-t)*s|0,e=(e-i)*s|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function k1(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function ys(n,e,t,i,s,r,a,o){return(s-a)*(e-o)>=(n-a)*(r-o)&&(n-a)*(i-o)>=(t-a)*(e-o)&&(t-a)*(r-o)>=(s-a)*(i-o)}function H1(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!V1(n,e)&&(_r(n,e)&&_r(e,n)&&G1(n,e)&&(Pt(n.prev,n,e.prev)||Pt(n,e.prev,e))||Za(n,e)&&Pt(n.prev,n,n.next)>0&&Pt(e.prev,e,e.next)>0)}function Pt(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function Za(n,e){return n.x===e.x&&n.y===e.y}function If(n,e,t,i){let s=ia(Pt(n,e,t)),r=ia(Pt(n,e,i)),a=ia(Pt(t,i,n)),o=ia(Pt(t,i,e));return!!(s!==r&&a!==o||s===0&&na(n,t,e)||r===0&&na(n,i,e)||a===0&&na(t,n,i)||o===0&&na(t,e,i))}function na(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function ia(n){return n>0?1:n<0?-1:0}function V1(n,e){let t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&If(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function _r(n,e){return Pt(n.prev,n,n.next)<0?Pt(n,e,n.next)>=0&&Pt(n,n.prev,e)>=0:Pt(n,e,n.prev)<0||Pt(n,n.next,e)<0}function G1(n,e){let t=n,i=!1,s=(n.x+e.x)/2,r=(n.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&s<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function Lf(n,e){let t=new Kl(n.i,n.x,n.y),i=new Kl(e.i,e.x,e.y),s=n.next,r=e.prev;return n.next=e,e.prev=n,t.next=s,s.prev=t,i.next=t,t.prev=i,r.next=i,i.prev=r,i}function Qh(n,e,t,i){let s=new Kl(n,e,t);return i?(s.next=i.next,s.prev=i,i.next.prev=s,i.next=s):(s.prev=s,s.next=s),s}function yr(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function Kl(n,e,t){this.i=n,this.x=e,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function W1(n,e,t,i){let s=0;for(let r=e,a=t-i;r<t;r+=i)s+=(n[a]-n[r])*(n[r+1]+n[a+1]),a=r;return s}var bi=class n{static area(e){let t=e.length,i=0;for(let s=t-1,r=0;r<t;s=r++)i+=e[s].x*e[r].y-e[r].x*e[s].y;return i*.5}static isClockWise(e){return n.area(e)<0}static triangulateShape(e,t){let i=[],s=[],r=[];ef(e),tf(i,e);let a=e.length;t.forEach(ef);for(let l=0;l<t.length;l++)s.push(a),a+=t[l].length,tf(i,t[l]);let o=R1.triangulate(i,s);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}};function ef(n){let e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function tf(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}var Ua=class n extends Lt{constructor(e=new Wn([new ee(.5,.5),new ee(-.5,.5),new ee(-.5,-.5),new ee(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let i=this,s=[],r=[];for(let o=0,l=e.length;o<l;o++){let c=e[o];a(c)}this.setAttribute("position",new it(s,3)),this.setAttribute("uv",new it(r,2)),this.computeVertexNormals();function a(o){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1,d=t.bevelEnabled!==void 0?t.bevelEnabled:!0,p=t.bevelThickness!==void 0?t.bevelThickness:.2,y=t.bevelSize!==void 0?t.bevelSize:p-.1,_=t.bevelOffset!==void 0?t.bevelOffset:0,m=t.bevelSegments!==void 0?t.bevelSegments:3,f=t.extrudePath,v=t.UVGenerator!==void 0?t.UVGenerator:X1,S,g=!1,L,R,C,A;f&&(S=f.getSpacedPoints(h),g=!0,d=!1,L=f.computeFrenetFrames(h,!1),R=new D,C=new D,A=new D),d||(m=0,p=0,y=0,_=0);let x=o.extractPoints(c),M=x.shape,U=x.holes;if(!bi.isClockWise(M)){M=M.reverse();for(let ne=0,ue=U.length;ne<ue;ne++){let N=U[ne];bi.isClockWise(N)&&(U[ne]=N.reverse())}}let z=bi.triangulateShape(M,U),G=M;for(let ne=0,ue=U.length;ne<ue;ne++){let N=U[ne];M=M.concat(N)}function Q(ne,ue,N){return ue||console.error("THREE.ExtrudeGeometry: vec does not exist"),ne.clone().addScaledVector(ue,N)}let Y=M.length,se=z.length;function q(ne,ue,N){let He,le,Re,me=ne.x-ue.x,Ye=ne.y-ue.y,Ae=N.x-ne.x,I=N.y-ne.y,E=me*me+Ye*Ye,H=me*I-Ye*Ae;if(Math.abs(H)>Number.EPSILON){let J=Math.sqrt(E),re=Math.sqrt(Ae*Ae+I*I),j=ue.x-Ye/J,Oe=ue.y+me/J,ve=N.x-I/re,we=N.y+Ae/re,rt=((ve-j)*I-(we-Oe)*Ae)/(me*I-Ye*Ae);He=j+me*rt-ne.x,le=Oe+Ye*rt-ne.y;let ce=He*He+le*le;if(ce<=2)return new ee(He,le);Re=Math.sqrt(ce/2)}else{let J=!1;me>Number.EPSILON?Ae>Number.EPSILON&&(J=!0):me<-Number.EPSILON?Ae<-Number.EPSILON&&(J=!0):Math.sign(Ye)===Math.sign(I)&&(J=!0),J?(He=-Ye,le=me,Re=Math.sqrt(E)):(He=me,le=Ye,Re=Math.sqrt(E/2))}return new ee(He/Re,le/Re)}let ge=[];for(let ne=0,ue=G.length,N=ue-1,He=ne+1;ne<ue;ne++,N++,He++)N===ue&&(N=0),He===ue&&(He=0),ge[ne]=q(G[ne],G[N],G[He]);let Me=[],Ce,We=ge.concat();for(let ne=0,ue=U.length;ne<ue;ne++){let N=U[ne];Ce=[];for(let He=0,le=N.length,Re=le-1,me=He+1;He<le;He++,Re++,me++)Re===le&&(Re=0),me===le&&(me=0),Ce[He]=q(N[He],N[Re],N[me]);Me.push(Ce),We=We.concat(Ce)}for(let ne=0;ne<m;ne++){let ue=ne/m,N=p*Math.cos(ue*Math.PI/2),He=y*Math.sin(ue*Math.PI/2)+_;for(let le=0,Re=G.length;le<Re;le++){let me=Q(G[le],ge[le],He);P(me.x,me.y,-N)}for(let le=0,Re=U.length;le<Re;le++){let me=U[le];Ce=Me[le];for(let Ye=0,Ae=me.length;Ye<Ae;Ye++){let I=Q(me[Ye],Ce[Ye],He);P(I.x,I.y,-N)}}}let ct=y+_;for(let ne=0;ne<Y;ne++){let ue=d?Q(M[ne],We[ne],ct):M[ne];g?(C.copy(L.normals[0]).multiplyScalar(ue.x),R.copy(L.binormals[0]).multiplyScalar(ue.y),A.copy(S[0]).add(C).add(R),P(A.x,A.y,A.z)):P(ue.x,ue.y,0)}for(let ne=1;ne<=h;ne++)for(let ue=0;ue<Y;ue++){let N=d?Q(M[ue],We[ue],ct):M[ue];g?(C.copy(L.normals[ne]).multiplyScalar(N.x),R.copy(L.binormals[ne]).multiplyScalar(N.y),A.copy(S[ne]).add(C).add(R),P(A.x,A.y,A.z)):P(N.x,N.y,u/h*ne)}for(let ne=m-1;ne>=0;ne--){let ue=ne/m,N=p*Math.cos(ue*Math.PI/2),He=y*Math.sin(ue*Math.PI/2)+_;for(let le=0,Re=G.length;le<Re;le++){let me=Q(G[le],ge[le],He);P(me.x,me.y,u+N)}for(let le=0,Re=U.length;le<Re;le++){let me=U[le];Ce=Me[le];for(let Ye=0,Ae=me.length;Ye<Ae;Ye++){let I=Q(me[Ye],Ce[Ye],He);g?P(I.x,I.y+S[h-1].y,S[h-1].x+N):P(I.x,I.y,u+N)}}}K(),fe();function K(){let ne=s.length/3;if(d){let ue=0,N=Y*ue;for(let He=0;He<se;He++){let le=z[He];Z(le[2]+N,le[1]+N,le[0]+N)}ue=h+m*2,N=Y*ue;for(let He=0;He<se;He++){let le=z[He];Z(le[0]+N,le[1]+N,le[2]+N)}}else{for(let ue=0;ue<se;ue++){let N=z[ue];Z(N[2],N[1],N[0])}for(let ue=0;ue<se;ue++){let N=z[ue];Z(N[0]+Y*h,N[1]+Y*h,N[2]+Y*h)}}i.addGroup(ne,s.length/3-ne,0)}function fe(){let ne=s.length/3,ue=0;Ue(G,ue),ue+=G.length;for(let N=0,He=U.length;N<He;N++){let le=U[N];Ue(le,ue),ue+=le.length}i.addGroup(ne,s.length/3-ne,1)}function Ue(ne,ue){let N=ne.length;for(;--N>=0;){let He=N,le=N-1;le<0&&(le=ne.length-1);for(let Re=0,me=h+m*2;Re<me;Re++){let Ye=Y*Re,Ae=Y*(Re+1),I=ue+He+Ye,E=ue+le+Ye,H=ue+le+Ae,J=ue+He+Ae;pe(I,E,H,J)}}}function P(ne,ue,N){l.push(ne),l.push(ue),l.push(N)}function Z(ne,ue,N){ye(ne),ye(ue),ye(N);let He=s.length/3,le=v.generateTopUV(i,s,He-3,He-2,He-1);nt(le[0]),nt(le[1]),nt(le[2])}function pe(ne,ue,N,He){ye(ne),ye(ue),ye(He),ye(ue),ye(N),ye(He);let le=s.length/3,Re=v.generateSideWallUV(i,s,le-6,le-3,le-2,le-1);nt(Re[0]),nt(Re[1]),nt(Re[3]),nt(Re[1]),nt(Re[2]),nt(Re[3])}function ye(ne){s.push(l[ne*3+0]),s.push(l[ne*3+1]),s.push(l[ne*3+2])}function nt(ne){r.push(ne.x),r.push(ne.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,i=this.parameters.options;return Y1(t,i,e)}static fromJSON(e,t){let i=[];for(let r=0,a=e.shapes.length;r<a;r++){let o=t[e.shapes[r]];i.push(o)}let s=e.options.extrudePath;return s!==void 0&&(e.options.extrudePath=new La[s.type]().fromJSON(s)),new n(i,e.options)}},X1={generateTopUV:function(n,e,t,i,s){let r=e[t*3],a=e[t*3+1],o=e[i*3],l=e[i*3+1],c=e[s*3],h=e[s*3+1];return[new ee(r,a),new ee(o,l),new ee(c,h)]},generateSideWallUV:function(n,e,t,i,s,r){let a=e[t*3],o=e[t*3+1],l=e[t*3+2],c=e[i*3],h=e[i*3+1],u=e[i*3+2],d=e[s*3],p=e[s*3+1],y=e[s*3+2],_=e[r*3],m=e[r*3+1],f=e[r*3+2];return Math.abs(o-h)<Math.abs(a-c)?[new ee(a,1-l),new ee(c,1-u),new ee(d,1-y),new ee(_,1-f)]:[new ee(o,1-l),new ee(h,1-u),new ee(p,1-y),new ee(m,1-f)]}};function Y1(n,e,t){if(t.shapes=[],Array.isArray(n))for(let i=0,s=n.length;i<s;i++){let r=n[i];t.shapes.push(r.uuid)}else t.shapes.push(n.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var Na=class n extends Zl{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}};var vr=class n extends Lt{constructor(e=.5,t=1,i=32,s=1,r=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:s,thetaStart:r,thetaLength:a},i=Math.max(3,i),s=Math.max(1,s);let o=[],l=[],c=[],h=[],u=e,d=(t-e)/s,p=new D,y=new ee;for(let _=0;_<=s;_++){for(let m=0;m<=i;m++){let f=r+m/i*a;p.x=u*Math.cos(f),p.y=u*Math.sin(f),l.push(p.x,p.y,p.z),c.push(0,0,1),y.x=(p.x/t+1)/2,y.y=(p.y/t+1)/2,h.push(y.x,y.y)}u+=d}for(let _=0;_<s;_++){let m=_*(i+1);for(let f=0;f<i;f++){let v=f+m,S=v,g=v+i+1,L=v+i+2,R=v+1;o.push(S,g,R),o.push(g,L,R)}}this.setIndex(o),this.setAttribute("position",new it(l,3)),this.setAttribute("normal",new it(c,3)),this.setAttribute("uv",new it(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}},Ls=class n extends Lt{constructor(e=new Wn([new ee(0,.5),new ee(-.5,-.5),new ee(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],s=[],r=[],a=[],o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,l,h),o+=l,l=0;this.setIndex(i),this.setAttribute("position",new it(s,3)),this.setAttribute("normal",new it(r,3)),this.setAttribute("uv",new it(a,2));function c(h){let u=s.length/3,d=h.extractPoints(t),p=d.shape,y=d.holes;bi.isClockWise(p)===!1&&(p=p.reverse());for(let m=0,f=y.length;m<f;m++){let v=y[m];bi.isClockWise(v)===!0&&(y[m]=v.reverse())}let _=bi.triangulateShape(p,y);for(let m=0,f=y.length;m<f;m++){let v=y[m];p=p.concat(v)}for(let m=0,f=p.length;m<f;m++){let v=p[m];s.push(v.x,v.y,0),r.push(0,0,1),a.push(v.x,v.y)}for(let m=0,f=_.length;m<f;m++){let v=_[m],S=v[0]+u,g=v[1]+u,L=v[2]+u;i.push(S,g,L),l+=3}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes;return q1(t,e)}static fromJSON(e,t){let i=[];for(let s=0,r=e.shapes.length;s<r;s++){let a=t[e.shapes[s]];i.push(a)}return new n(i,e.curveSegments)}};function q1(n,e){if(e.shapes=[],Array.isArray(n))for(let t=0,i=n.length;t<i;t++){let s=n[t];e.shapes.push(s.uuid)}else e.shapes.push(n.uuid);return e}var Dn=class n extends Lt{constructor(e=1,t=32,i=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(a+o,Math.PI),c=0,h=[],u=new D,d=new D,p=[],y=[],_=[],m=[];for(let f=0;f<=i;f++){let v=[],S=f/i,g=0;f===0&&a===0?g=.5/t:f===i&&l===Math.PI&&(g=-.5/t);for(let L=0;L<=t;L++){let R=L/t;u.x=-e*Math.cos(s+R*r)*Math.sin(a+S*o),u.y=e*Math.cos(a+S*o),u.z=e*Math.sin(s+R*r)*Math.sin(a+S*o),y.push(u.x,u.y,u.z),d.copy(u).normalize(),_.push(d.x,d.y,d.z),m.push(R+g,1-S),v.push(c++)}h.push(v)}for(let f=0;f<i;f++)for(let v=0;v<t;v++){let S=h[f][v+1],g=h[f][v],L=h[f+1][v],R=h[f+1][v+1];(f!==0||a>0)&&p.push(S,g,R),(f!==i-1||l<Math.PI)&&p.push(g,L,R)}this.setIndex(p),this.setAttribute("position",new it(y,3)),this.setAttribute("normal",new it(_,3)),this.setAttribute("uv",new it(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Un=class n extends Lt{constructor(e=1,t=.4,i=12,s=48,r=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:s,arc:r},i=Math.floor(i),s=Math.floor(s);let a=[],o=[],l=[],c=[],h=new D,u=new D,d=new D;for(let p=0;p<=i;p++)for(let y=0;y<=s;y++){let _=y/s*r,m=p/i*Math.PI*2;u.x=(e+t*Math.cos(m))*Math.cos(_),u.y=(e+t*Math.cos(m))*Math.sin(_),u.z=t*Math.sin(m),o.push(u.x,u.y,u.z),h.x=e*Math.cos(_),h.y=e*Math.sin(_),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(y/s),c.push(p/i)}for(let p=1;p<=i;p++)for(let y=1;y<=s;y++){let _=(s+1)*p+y-1,m=(s+1)*(p-1)+y-1,f=(s+1)*(p-1)+y,v=(s+1)*p+y;a.push(_,m,v),a.push(m,f,v)}this.setIndex(a),this.setAttribute("position",new it(o,3)),this.setAttribute("normal",new it(l,3)),this.setAttribute("uv",new it(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var Oa=class n extends Lt{constructor(e=new Pa(new D(-1,-1,0),new D(-1,1,0),new D(1,1,0)),t=64,i=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:s,closed:r};let a=e.computeFrenetFrames(t,r);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new D,l=new D,c=new ee,h=new D,u=[],d=[],p=[],y=[];_(),this.setIndex(y),this.setAttribute("position",new it(u,3)),this.setAttribute("normal",new it(d,3)),this.setAttribute("uv",new it(p,2));function _(){for(let S=0;S<t;S++)m(S);m(r===!1?t:0),v(),f()}function m(S){h=e.getPointAt(S/t,h);let g=a.normals[S],L=a.binormals[S];for(let R=0;R<=s;R++){let C=R/s*Math.PI*2,A=Math.sin(C),x=-Math.cos(C);l.x=x*g.x+A*L.x,l.y=x*g.y+A*L.y,l.z=x*g.z+A*L.z,l.normalize(),d.push(l.x,l.y,l.z),o.x=h.x+i*l.x,o.y=h.y+i*l.y,o.z=h.z+i*l.z,u.push(o.x,o.y,o.z)}}function f(){for(let S=1;S<=t;S++)for(let g=1;g<=s;g++){let L=(s+1)*(S-1)+(g-1),R=(s+1)*S+(g-1),C=(s+1)*S+g,A=(s+1)*(S-1)+g;y.push(L,R,A),y.push(R,C,A)}}function v(){for(let S=0;S<=t;S++)for(let g=0;g<=s;g++)c.x=S/t,c.y=g/s,p.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new n(new La[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};var xr=class extends Vn{static get type(){return"MeshStandardMaterial"}constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new Xe(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Xe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=vc,this.normalScale=new ee(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new vn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Fa=class extends xr{static get type(){return"MeshPhysicalMaterial"}constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ee(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Ot(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Xe(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Xe(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Xe(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var Ba=class extends Vn{static get type(){return"MeshToonMaterial"}constructor(e){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.color=new Xe(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Xe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=vc,this.normalScale=new ee(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.gradientMap=e.gradientMap,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};function sa(n,e,t){return!n||!t&&n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function $1(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}var Ds=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(r=s,s=t[++i],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(i=2,r=o);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=t[--i-1],e>=r)break e}a=i,i=0;break t}break n}for(;i<a;){let o=i+a>>>1;e<t[o]?a=o:i=o+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=i[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},jl=class extends Ds{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Jc,endingEnd:Jc}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Kc:r=e,o=2*t-i;break;case jc:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Kc:a=e,l=2*i-t;break;case jc:a=1,l=i+s[1]-s[0];break;default:a=e-1,l=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-i),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,p=this._weightNext,y=(i-t)/(s-t),_=y*y,m=_*y,f=-d*m+2*d*_-d*y,v=(1+d)*m+(-1.5-2*d)*_+(-.5+d)*y+1,S=(-1-p)*m+(1.5+p)*_+.5*y,g=p*m-p*_;for(let L=0;L!==o;++L)r[L]=f*a[h+L]+v*a[c+L]+S*a[l+L]+g*a[u+L];return r}},Ql=class extends Ds{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(i-t)/(s-t),u=1-h;for(let d=0;d!==o;++d)r[d]=a[c+d]*u+a[l+d]*h;return r}},ec=class extends Ds{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},Nn=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=sa(t,this.TimeBufferType),this.values=sa(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:sa(e.times,Array),values:sa(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new ec(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ql(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new jl(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case ha:t=this.InterpolantFactoryMethodDiscrete;break;case Tl:t=this.InterpolantFactoryMethodLinear;break;case oo:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ha;case this.InterpolantFactoryMethodLinear:return Tl;case this.InterpolantFactoryMethodSmooth:return oo}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e}return this}trim(e,t){let i=this.times,s=i.length,r=0,a=s-1;for(;r!==s&&i[r]<e;)++r;for(;a!==-1&&i[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=i.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&$1(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===oo,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(s)l=!0;else{let u=o*i,d=u-i,p=u+i;for(let y=0;y!==i;++y){let _=t[u+y];if(_!==t[d+y]||_!==t[p+y]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let u=o*i,d=a*i;for(let p=0;p!==i;++p)t[d+p]=t[u+p]}++a}}if(r>0){e[a]=e[r];for(let o=r*i,l=a*i,c=0;c!==i;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};Nn.prototype.TimeBufferType=Float32Array;Nn.prototype.ValueBufferType=Float32Array;Nn.prototype.DefaultInterpolation=Tl;var qi=class extends Nn{constructor(e,t,i){super(e,t,i)}};qi.prototype.ValueTypeName="bool";qi.prototype.ValueBufferType=Array;qi.prototype.DefaultInterpolation=ha;qi.prototype.InterpolantFactoryMethodLinear=void 0;qi.prototype.InterpolantFactoryMethodSmooth=void 0;var tc=class extends Nn{};tc.prototype.ValueTypeName="color";var nc=class extends Nn{};nc.prototype.ValueTypeName="number";var ic=class extends Ds{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(i-t)/(s-t),c=e*o;for(let h=c+o;c!==h;c+=4)mn.slerpFlat(r,0,a,c-o,a,c,l);return r}},za=class extends Nn{InterpolantFactoryMethodLinear(e){return new ic(this.times,this.values,this.getValueSize(),e)}};za.prototype.ValueTypeName="quaternion";za.prototype.InterpolantFactoryMethodSmooth=void 0;var $i=class extends Nn{constructor(e,t,i){super(e,t,i)}};$i.prototype.ValueTypeName="string";$i.prototype.ValueBufferType=Array;$i.prototype.DefaultInterpolation=ha;$i.prototype.InterpolantFactoryMethodLinear=void 0;$i.prototype.InterpolantFactoryMethodSmooth=void 0;var sc=class extends Nn{};sc.prototype.ValueTypeName="vector";var rc=class{constructor(e,t,i){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let p=c[u],y=c[u+1];if(p.global&&(p.lastIndex=0),p.test(h))return y}return null}}},Z1=new rc,ac=class{constructor(e){this.manager=e!==void 0?e:Z1,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};ac.DEFAULT_MATERIAL_NAME="__DEFAULT";var Us=class extends Gt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Xe(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},ka=class extends Us{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Gt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Xe(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},zo=new ut,nf=new D,sf=new D,Ha=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ee(512,512),this.map=null,this.mapPass=null,this.matrix=new ut,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new cr,this._frameExtents=new ee(1,1),this._viewportCount=1,this._viewports=[new vt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;nf.setFromMatrixPosition(e.matrixWorld),t.position.copy(nf),sf.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(sf),t.updateMatrixWorld(),zo.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(zo),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(zo)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var rf=new ut,js=new D,ko=new D,oc=class extends Ha{constructor(){super(new Zt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ee(4,2),this._viewportCount=6,this._viewports=[new vt(2,1,1,1),new vt(0,1,1,1),new vt(3,1,1,1),new vt(1,1,1,1),new vt(3,0,1,1),new vt(1,0,1,1)],this._cubeDirections=[new D(1,0,0),new D(-1,0,0),new D(0,0,1),new D(0,0,-1),new D(0,1,0),new D(0,-1,0)],this._cubeUps=[new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,1,0),new D(0,0,1),new D(0,0,-1)]}updateMatrices(e,t=0){let i=this.camera,s=this.matrix,r=e.distance||i.far;r!==i.far&&(i.far=r,i.updateProjectionMatrix()),js.setFromMatrixPosition(e.matrixWorld),i.position.copy(js),ko.copy(i.position),ko.add(this._cubeDirections[t]),i.up.copy(this._cubeUps[t]),i.lookAt(ko),i.updateMatrixWorld(),s.makeTranslation(-js.x,-js.y,-js.z),rf.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),this._frustum.setFromProjectionMatrix(rf)}},Sr=class extends Us{constructor(e,t,i=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=s,this.shadow=new oc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},lc=class extends Ha{constructor(){super(new xa(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ns=class extends Us{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Gt.DEFAULT_UP),this.updateMatrix(),this.target=new Gt,this.shadow=new lc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Va=class extends Us{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var Ga=class extends Lt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}};var Wa=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=af(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=af();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};function af(){return performance.now()}var Tc="\\[\\]\\.:\\/",J1=new RegExp("["+Tc+"]","g"),Ec="[^"+Tc+"]",K1="[^"+Tc.replace("\\.","")+"]",j1=/((?:WC+[\/:])*)/.source.replace("WC",Ec),Q1=/(WCOD+)?/.source.replace("WCOD",K1),e_=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Ec),t_=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Ec),n_=new RegExp("^"+j1+Q1+e_+t_+"$"),i_=["material","materials","bones","map"],cc=class{constructor(e,t,i){let s=i||wt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},wt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(J1,"")}static parseTrackName(e){let t=n_.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);i_.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=i(o.children);if(l)return l}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[s];if(a===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};wt.Composite=cc;wt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};wt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};wt.prototype.GetterByBindingType=[wt.prototype._getValue_direct,wt.prototype._getValue_array,wt.prototype._getValue_arrayElement,wt.prototype._getValue_toArray];wt.prototype.SetterByBindingTypeAndVersioning=[[wt.prototype._setValue_direct,wt.prototype._setValue_direct_setNeedsUpdate,wt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[wt.prototype._setValue_array,wt.prototype._setValue_array_setNeedsUpdate,wt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[wt.prototype._setValue_arrayElement,wt.prototype._setValue_arrayElement_setNeedsUpdate,wt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[wt.prototype._setValue_fromArray,wt.prototype._setValue_fromArray_setNeedsUpdate,wt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var wy=new Float32Array(1);var Mr=class{constructor(e=1,t=0,i=0){return this.radius=e,this.phi=t,this.theta=i,this}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(Ot(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Xa=class extends si{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:hc}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=hc);var Df={type:"change"},wc={type:"start"},Nf={type:"end"},Ja=new ws,Uf=new Pn,s_=Math.cos(70*xf.DEG2RAD),zt=new D,ln=2*Math.PI,xt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Ac=1e-6,Ka=class extends Xa{constructor(e,t=null){super(e,t),this.state=xt.NONE,this.enabled=!0,this.target=new D,this.cursor=new D,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Zi.ROTATE,MIDDLE:Zi.DOLLY,RIGHT:Zi.PAN},this.touches={ONE:Ji.ROTATE,TWO:Ji.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new D,this._lastQuaternion=new mn,this._lastTargetPosition=new D,this._quat=new mn().setFromUnitVectors(e.up,new D(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Mr,this._sphericalDelta=new Mr,this._scale=1,this._panOffset=new D,this._rotateStart=new ee,this._rotateEnd=new ee,this._rotateDelta=new ee,this._panStart=new ee,this._panEnd=new ee,this._panDelta=new ee,this._dollyStart=new ee,this._dollyEnd=new ee,this._dollyDelta=new ee,this._dollyDirection=new D,this._mouse=new ee,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=a_.bind(this),this._onPointerDown=r_.bind(this),this._onPointerUp=o_.bind(this),this._onContextMenu=p_.bind(this),this._onMouseWheel=h_.bind(this),this._onKeyDown=f_.bind(this),this._onTouchStart=u_.bind(this),this._onTouchMove=d_.bind(this),this._onMouseDown=l_.bind(this),this._onMouseMove=c_.bind(this),this._interceptControlDown=m_.bind(this),this._interceptControlUp=g_.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Df),this.update(),this.state=xt.NONE}update(e=null){let t=this.object.position;zt.copy(t).sub(this.target),zt.applyQuaternion(this._quat),this._spherical.setFromVector3(zt),this.autoRotate&&this.state===xt.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(i)&&isFinite(s)&&(i<-Math.PI?i+=ln:i>Math.PI&&(i-=ln),s<-Math.PI?s+=ln:s>Math.PI&&(s-=ln),i<=s?this._spherical.theta=Math.max(i,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+s)/2?Math.max(i,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(zt.setFromSpherical(this._spherical),zt.applyQuaternion(this._quatInverse),t.copy(this.target).add(zt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){let o=zt.length();a=this._clampDistance(o*this._scale);let l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let o=new D(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new D(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=zt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(Ja.origin.copy(this.object.position),Ja.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Ja.direction))<s_?this.object.lookAt(this.target):(Uf.setFromNormalAndCoplanarPoint(this.object.up,this.target),Ja.intersectPlane(Uf,this.target))))}else if(this.object.isOrthographicCamera){let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Ac||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Ac||this._lastTargetPosition.distanceToSquared(this.target)>Ac?(this.dispatchEvent(Df),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?ln/60*this.autoRotateSpeed*e:ln/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){zt.setFromMatrixColumn(t,0),zt.multiplyScalar(-e),this._panOffset.add(zt)}_panUp(e,t){this.screenSpacePanning===!0?zt.setFromMatrixColumn(t,1):(zt.setFromMatrixColumn(t,0),zt.crossVectors(this.object.up,zt)),zt.multiplyScalar(e),this._panOffset.add(zt)}_pan(e,t){let i=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;zt.copy(s).sub(this.target);let r=zt.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/i.clientHeight,this.object.matrix),this._panUp(2*t*r/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),s=e-i.left,r=t-i.top,a=i.width,o=i.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(ln*this._rotateDelta.x/t.clientHeight),this._rotateUp(ln*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateUp(ln*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateUp(-ln*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateLeft(ln*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateLeft(-ln*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._rotateStart.set(i,s)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panStart.set(i,s)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(i*i+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let i=this._getSecondPointerPosition(e),s=.5*(e.pageX+i.x),r=.5*(e.pageY+i.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(ln*this._rotateDelta.x/t.clientHeight),this._rotateUp(ln*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panEnd.set(i,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(i*i+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new ee,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function r_(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n)))}function a_(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function o_(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Nf),this.state=xt.NONE;break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function l_(n){let e;switch(n.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Zi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=xt.DOLLY;break;case Zi.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=xt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=xt.ROTATE}break;case Zi.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=xt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=xt.PAN}break;default:this.state=xt.NONE}this.state!==xt.NONE&&this.dispatchEvent(wc)}function c_(n){switch(this.state){case xt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case xt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case xt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function h_(n){this.enabled===!1||this.enableZoom===!1||this.state!==xt.NONE||(n.preventDefault(),this.dispatchEvent(wc),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(Nf))}function f_(n){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(n)}function u_(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case Ji.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=xt.TOUCH_ROTATE;break;case Ji.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=xt.TOUCH_PAN;break;default:this.state=xt.NONE}break;case 2:switch(this.touches.TWO){case Ji.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=xt.TOUCH_DOLLY_PAN;break;case Ji.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=xt.TOUCH_DOLLY_ROTATE;break;default:this.state=xt.NONE}break;default:this.state=xt.NONE}this.state!==xt.NONE&&this.dispatchEvent(wc)}function d_(n){switch(this._trackPointer(n),this.state){case xt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case xt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case xt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case xt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=xt.NONE}}function p_(n){this.enabled!==!1&&n.preventDefault()}function m_(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function g_(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var ja=class{constructor(e,t={}){this.enabled=!0;let i=t.defaultThickness!==void 0?t.defaultThickness:.003,s=new Xe().fromArray(t.defaultColor!==void 0?t.defaultColor:[0,0,0]),r=t.defaultAlpha!==void 0?t.defaultAlpha:1,a=t.defaultKeepAlive!==void 0?t.defaultKeepAlive:!1,o={},l=60,c={},h={},u={outlineThickness:{value:i},outlineColor:{value:s},outlineAlpha:{value:r}},d=["#include <common>","#include <uv_pars_vertex>","#include <displacementmap_pars_vertex>","#include <fog_pars_vertex>","#include <morphtarget_pars_vertex>","#include <skinning_pars_vertex>","#include <logdepthbuf_pars_vertex>","#include <clipping_planes_pars_vertex>","uniform float outlineThickness;","vec4 calculateOutline( vec4 pos, vec3 normal, vec4 skinned ) {","	float thickness = outlineThickness;","	const float ratio = 1.0;","	vec4 pos2 = projectionMatrix * modelViewMatrix * vec4( skinned.xyz + normal, 1.0 );","	vec4 norm = normalize( pos - pos2 );","	return pos + norm * thickness * pos.w * ratio;","}","void main() {","	#include <uv_vertex>","	#include <beginnormal_vertex>","	#include <morphnormal_vertex>","	#include <skinbase_vertex>","	#include <skinnormal_vertex>","	#include <begin_vertex>","	#include <morphtarget_vertex>","	#include <skinning_vertex>","	#include <displacementmap_vertex>","	#include <project_vertex>","	vec3 outlineNormal = - objectNormal;","	gl_Position = calculateOutline( gl_Position, outlineNormal, vec4( transformed, 1.0 ) );","	#include <logdepthbuf_vertex>","	#include <clipping_planes_vertex>","	#include <fog_vertex>","}"].join(`
`),p=["#include <common>","#include <fog_pars_fragment>","#include <logdepthbuf_pars_fragment>","#include <clipping_planes_pars_fragment>","uniform vec3 outlineColor;","uniform float outlineAlpha;","void main() {","	#include <clipping_planes_fragment>","	#include <logdepthbuf_fragment>","	gl_FragColor = vec4( outlineColor, outlineAlpha );","	#include <tonemapping_fragment>","	#include <colorspace_fragment>","	#include <fog_fragment>","	#include <premultiplied_alpha_fragment>","}"].join(`
`);function y(){return new on({type:"OutlineEffect",uniforms:Sc.merge([_e.fog,_e.displacementmap,u]),vertexShader:d,fragmentShader:p,side:Jt})}function _(A){let x=o[A.uuid];return x===void 0&&(x={material:y(),used:!0,keepAlive:a,count:0},o[A.uuid]=x),x.used=!0,x.material}function m(A){let x=_(A);return c[x.uuid]=A,R(x,A),x}function f(A){let x=A.geometry,M=x!==void 0&&x.attributes.normal!==void 0;return A.isMesh===!0&&A.material!==void 0&&M===!0}function v(A){if(f(A)!==!1){if(Array.isArray(A.material))for(let x=0,M=A.material.length;x<M;x++)A.material[x]=m(A.material[x]);else A.material=m(A.material);h[A.uuid]=A.onBeforeRender,A.onBeforeRender=g}}function S(A){if(f(A)!==!1){if(Array.isArray(A.material))for(let x=0,M=A.material.length;x<M;x++)A.material[x]=c[A.material[x].uuid];else A.material=c[A.material.uuid];A.onBeforeRender=h[A.uuid]}}function g(A,x,M,U,k){let z=c[k.uuid];z!==void 0&&L(k,z)}function L(A,x){let M=x.userData.outlineParameters;A.uniforms.outlineAlpha.value=x.opacity,M!==void 0&&(M.thickness!==void 0&&(A.uniforms.outlineThickness.value=M.thickness),M.color!==void 0&&A.uniforms.outlineColor.value.fromArray(M.color),M.alpha!==void 0&&(A.uniforms.outlineAlpha.value=M.alpha)),x.displacementMap&&(A.uniforms.displacementMap.value=x.displacementMap,A.uniforms.displacementScale.value=x.displacementScale,A.uniforms.displacementBias.value=x.displacementBias)}function R(A,x){if(A.name==="invisible")return;let M=x.userData.outlineParameters;A.fog=x.fog,A.toneMapped=x.toneMapped,A.premultipliedAlpha=x.premultipliedAlpha,A.displacementMap=x.displacementMap,M!==void 0?(x.visible===!1?A.visible=!1:A.visible=M.visible!==void 0?M.visible:!0,A.transparent=M.alpha!==void 0&&M.alpha<1?!0:x.transparent,M.keepAlive!==void 0&&(o[x.uuid].keepAlive=M.keepAlive)):(A.transparent=x.transparent,A.visible=x.visible),(x.wireframe===!0||x.depthTest===!1)&&(A.visible=!1),x.clippingPlanes&&(A.clipping=!0,A.clippingPlanes=x.clippingPlanes,A.clipIntersection=x.clipIntersection,A.clipShadows=x.clipShadows),A.version=x.version}function C(){let A;A=Object.keys(c);for(let x=0,M=A.length;x<M;x++)c[A[x]]=void 0;A=Object.keys(h);for(let x=0,M=A.length;x<M;x++)h[A[x]]=void 0;A=Object.keys(o);for(let x=0,M=A.length;x<M;x++){let U=A[x];o[U].used===!1?(o[U].count++,o[U].keepAlive===!1&&o[U].count>l&&delete o[U]):(o[U].used=!1,o[U].count=0)}}this.render=function(A,x){if(this.enabled===!1){e.render(A,x);return}let M=e.autoClear;e.autoClear=this.autoClear,e.render(A,x),e.autoClear=M,this.renderOutline(A,x)},this.renderOutline=function(A,x){let M=e.autoClear,U=A.matrixWorldAutoUpdate,k=A.background,z=e.shadowMap.enabled;A.matrixWorldAutoUpdate=!1,A.background=null,e.autoClear=!1,e.shadowMap.enabled=!1,A.traverse(v),e.render(A,x),A.traverse(S),C(),A.matrixWorldAutoUpdate=U,A.background=k,e.autoClear=M,e.shadowMap.enabled=z},this.autoClear=e.autoClear,this.domElement=e.domElement,this.shadowMap=e.shadowMap,this.clear=function(A,x,M){e.clear(A,x,M)},this.getPixelRatio=function(){return e.getPixelRatio()},this.setPixelRatio=function(A){e.setPixelRatio(A)},this.getSize=function(A){return e.getSize(A)},this.setSize=function(A,x,M){e.setSize(A,x,M)},this.setViewport=function(A,x,M,U){e.setViewport(A,x,M,U)},this.setScissor=function(A,x,M,U){e.setScissor(A,x,M,U)},this.setScissorTest=function(A){e.setScissorTest(A)},this.setRenderTarget=function(A){e.setRenderTarget(A)}}};var V={left:-4.05,right:2.16,front:1.76,back:-4.62,floorY:.16,glassBottom:.31,glassTop:2.92,fasciaBottom:3.04,fasciaTop:4.06,doorLeft:.55,doorRight:1.9,doorCenter:1.225},Rc={shopWalkRight:3.12,shopWalkFront:2.9,mainRoadFront:5.55,sideRoadFar:5.55,curbHeight:.14},wi={ink:462877,outline:462875,asphalt:1317415,pavement:6648193,pavementLight:9279394,concrete:6122104,curb:9345185,storeWall:15786952,storeTrim:1588290,storeTrimDeep:862513,storeCream:16181449,mint:7657152,orange:15895127,coral:16741982,warm:16759672,warmBright:16769710,pink:16748456,cool:10409983,metal:8885155,darkMetal:2569284,wood:11565904,woodLight:13933416,leaf:4028253,leafLight:6726780,indigo:1713984,tealGlow:6874064,magentaGlow:16742578};var Er=new D;function Mn(n,e,t,i,s,r){let a=2*Math.PI*s/4,o=Math.max(r-2*s,0),l=Math.PI/4;Er.copy(e),Er[i]=0,Er.normalize();let c=.5*a/(a+o),h=1-Er.angleTo(n)/l;return Math.sign(Er[t])===1?h*c:o/(a+o)+c+c*(1-h)}var Qa=class extends an{constructor(e=1,t=1,i=1,s=2,r=.1){if(s=s*2+1,r=Math.min(e/2,t/2,i/2,r),super(1,1,1,s,s,s),s===1)return;let a=this.toNonIndexed();this.index=null,this.attributes.position=a.attributes.position,this.attributes.normal=a.attributes.normal,this.attributes.uv=a.attributes.uv;let o=new D,l=new D,c=new D(e,t,i).divideScalar(2).subScalar(r),h=this.attributes.position.array,u=this.attributes.normal.array,d=this.attributes.uv.array,p=h.length/6,y=new D,_=.5/s;for(let m=0,f=0;m<h.length;m+=3,f+=2)switch(o.fromArray(h,m),l.copy(o),l.x-=Math.sign(l.x)*_,l.y-=Math.sign(l.y)*_,l.z-=Math.sign(l.z)*_,l.normalize(),h[m+0]=c.x*Math.sign(o.x)+l.x*r,h[m+1]=c.y*Math.sign(o.y)+l.y*r,h[m+2]=c.z*Math.sign(o.z)+l.z*r,u[m+0]=l.x,u[m+1]=l.y,u[m+2]=l.z,Math.floor(m/p)){case 0:y.set(1,0,0),d[f+0]=Mn(y,l,"z","y",r,i),d[f+1]=1-Mn(y,l,"y","z",r,t);break;case 1:y.set(-1,0,0),d[f+0]=1-Mn(y,l,"z","y",r,i),d[f+1]=1-Mn(y,l,"y","z",r,t);break;case 2:y.set(0,1,0),d[f+0]=1-Mn(y,l,"x","z",r,e),d[f+1]=Mn(y,l,"z","x",r,i);break;case 3:y.set(0,-1,0),d[f+0]=1-Mn(y,l,"x","z",r,e),d[f+1]=1-Mn(y,l,"z","x",r,i);break;case 4:y.set(0,0,1),d[f+0]=1-Mn(y,l,"x","y",r,e),d[f+1]=1-Mn(y,l,"y","x",r,t);break;case 5:y.set(0,0,-1),d[f+0]=Mn(y,l,"x","y",r,e),d[f+1]=1-Mn(y,l,"y","x",r,t);break}}};var ae='"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif',__='"Hiragino Mincho ProN", "Yu Mincho", "Times New Roman", serif',Ne='"Avenir Next", "Futura", "Helvetica Neue", sans-serif',Ri=null;function y_(){if(Ri)return Ri;let n=new Uint8Array([32,52,84,122,180,228,255]);return Ri=new hr(n,n.length,1,Tr),Ri.minFilter=Kt,Ri.magFilter=Kt,Ri.generateMipmaps=!1,Ri.needsUpdate=!0,Ri}function Bs(n){return n.userData.outlineParameters={visible:!1},n}function T(n,e={}){let t=new Ba({color:n,gradientMap:y_(),side:e.side??sn,transparent:e.transparent??!1,opacity:e.opacity??1,map:e.map??null,alphaMap:e.alphaMap??null,vertexColors:e.vertexColors??!1,emissive:e.emissive??0,emissiveIntensity:e.emissiveIntensity??1,depthWrite:e.depthWrite??!0,fog:e.fog??!0});return e.outline===!1&&Bs(t),e.name&&(t.name=e.name),t}function ie(n,e={}){let t=new xn({color:n,map:e.map??null,transparent:e.transparent??!!e.map,opacity:e.opacity??1,alphaTest:e.alphaTest??0,side:e.side??sn,depthWrite:e.depthWrite??!0,depthTest:e.depthTest??!0,blending:e.blending??ei,toneMapped:e.toneMapped??!1,fog:e.fog??!1});return t.userData.outlineParameters={visible:!1},t}function _t(n,e={}){let t=new Fa({color:n,roughness:e.roughness??.22,metalness:e.metalness??.18,clearcoat:e.clearcoat??1,clearcoatRoughness:e.clearcoatRoughness??.08,envMapIntensity:e.envMapIntensity??1,transparent:e.transparent??!1,opacity:e.opacity??1,map:e.map??null,side:e.side??sn,depthWrite:e.depthWrite??!0,emissive:e.emissive??0,emissiveIntensity:e.emissiveIntensity??1});return e.outline===!1&&Bs(t),t}function to(n,e={}){let t=new xr({color:n,roughness:e.roughness??.55,metalness:e.metalness??0,map:e.map??null,transparent:e.transparent??!1,opacity:e.opacity??1,side:e.side??sn,depthWrite:e.depthWrite??!0,envMapIntensity:e.envMapIntensity??.5,emissive:e.emissive??0,emissiveIntensity:e.emissiveIntensity??1});return e.outline===!1&&Bs(t),t}function Se(n,e,t,i={}){let s=document.createElement("canvas");s.width=n,s.height=e;let r=s.getContext("2d");t(r,n,e);let a=new Is(s);return a.colorSpace=i.linear?Bn:Vt,a.anisotropy=i.anisotropy??8,i.repeat&&(a.wrapS=ni,a.wrapT=ni,a.repeat.set(i.repeat[0],i.repeat[1])),a}function Rt(n,e,t,i,s,r){let a=Math.min(r,i/2,s/2);n.beginPath(),n.moveTo(e+a,t),n.arcTo(e+i,t,e+i,t+s,a),n.arcTo(e+i,t+s,e,t+s,a),n.arcTo(e,t+s,e,t,a),n.arcTo(e,t,e+i,t,a),n.closePath()}function v_(n,e,t,i,s,r=4){n.beginPath();for(let a=0;a<r*2;a++){let o=a%2===0?i:s,l=-Math.PI/2+Math.PI*a/r,c=e+Math.cos(l)*o,h=t+Math.sin(l)*o;a===0?n.moveTo(c,h):n.lineTo(c,h)}n.closePath()}function bt(n,e,t,i,s,r,a=4){v_(n,e,t,i,s,a),n.fillStyle=r,n.fill()}function eo(n,e,t,i,s){n.save(),n.translate(e,t),n.fillStyle=s;for(let r=0;r<4;r++)n.rotate(Math.PI/2),n.beginPath(),n.moveTo(0,-i),n.quadraticCurveTo(i*.12,-i*.15,0,0),n.quadraticCurveTo(-i*.12,-i*.15,0,-i),n.fill();n.restore()}function Cc(n="front"){let e=n==="side",t=e?960:1280,i=256;return Se(t,i,s=>{let r=s.createLinearGradient(0,0,t,i);r.addColorStop(0,"#0a3037"),r.addColorStop(.45,"#0e3c40"),r.addColorStop(1,"#082a35"),s.fillStyle=r,s.fillRect(0,0,t,i),s.globalAlpha=.09,s.strokeStyle="#b9fff2",s.lineWidth=2;for(let c=-200;c<t+200;c+=36)s.beginPath(),s.moveTo(c,i),s.lineTo(c+190,0),s.stroke();s.globalAlpha=1,s.fillStyle="#f08758",s.beginPath(),s.arc(124,125,77,0,Math.PI*2),s.fill(),s.fillStyle="rgba(255,255,255,0.16)",s.beginPath(),s.arc(112,108,60,0,Math.PI*2),s.fill(),s.strokeStyle="#fff0cc",s.lineWidth=4,s.beginPath(),s.arc(124,125,66,-.5,2.2),s.stroke(),bt(s,129,120,44,10,"#fff4d6",4),eo(s,69,77,14,"#fff4d6");let a=e?230:236;s.textBaseline="middle",s.textAlign="left",s.fillStyle="#fff7e4",s.shadowColor="rgba(255,193,120,0.38)",s.shadowBlur=16,s.font=`700 ${e?78:80}px ${ae}`,s.fillText("ほしぞらマート",a,100),s.shadowBlur=0,s.fillStyle="#a9e8d6",s.font=`700 ${e?26:28}px ${Ne}`,s.letterSpacing="4px",s.fillText("HOSHIZORA  MART",a+3,161),s.letterSpacing="0px",s.fillStyle="rgba(255,247,228,0.72)",s.font=`500 22px ${ae}`,s.fillText(e?"星見町店  /  24 HOURS":"星見町二丁目店  /  OPEN 24 HOURS",a+3,197);let o=t-112;s.fillStyle="#ffd28a",s.beginPath(),s.arc(o,122,63,0,Math.PI*2),s.fill(),s.fillStyle="#12373b",s.font=`800 44px ${Ne}`,s.textAlign="center",s.fillText("24H",o,113),s.font=`700 17px ${ae}`,s.fillText("年中無休",o,150),s.fillStyle="#f08a57",s.fillRect(0,i-18,t,8),s.fillStyle="#75d8c3",s.fillRect(0,i-8,t,8);let l=s.createLinearGradient(0,0,t*.85,i);l.addColorStop(0,"rgba(255,255,255,0.0)"),l.addColorStop(.45,"rgba(255,255,255,0.07)"),l.addColorStop(.55,"rgba(255,255,255,0.0)"),s.fillStyle=l,s.fillRect(0,0,t,i),s.strokeStyle="rgba(255,246,218,0.35)",s.lineWidth=3,s.strokeRect(8,8,t-16,i-16)})}function Hf(){return Se(1024,160,(n,e,t)=>{let i=n.createLinearGradient(0,0,0,t);i.addColorStop(0,"#b29562"),i.addColorStop(.32,"#ddc38f"),i.addColorStop(.7,"#9c7e4e"),i.addColorStop(1,"#6e5535"),n.fillStyle=i,n.fillRect(0,0,e,t),n.strokeStyle="rgba(58,41,21,0.7)",n.lineWidth=6,n.strokeRect(9,9,e-18,t-18),n.strokeStyle="rgba(255,245,211,0.35)",n.lineWidth=2,n.strokeRect(19,19,e-38,t-38),bt(n,95,80,27,7,"#4c3820",4),n.textAlign="left",n.textBaseline="middle",n.fillStyle="#3b2b18",n.font=`700 37px ${__}`,n.fillText("星見町 ・ 雨の交差点",146,64),n.font=`600 20px ${Ne}`,n.letterSpacing="4px",n.fillStyle="rgba(58,42,23,0.85)",n.fillText("HOSHIZORA-MACHI  /  A RAINY NIGHT",149,108),n.textAlign="right",n.font=`600 22px ${Ne}`,n.fillText("No. 0412",e-54,82)})}function Vf(){return Se(512,960,(n,e,t)=>{n.fillStyle="#132e37",n.fillRect(0,0,e,t);let i=n.createLinearGradient(0,0,0,t);i.addColorStop(0,"#1a4048"),i.addColorStop(.45,"#0b252f"),i.addColorStop(1,"#122e39"),n.fillStyle=i,n.fillRect(20,20,e-40,t-40),n.strokeStyle="#5fe6d3",n.lineWidth=4,Rt(n,20,20,e-40,t-40,24),n.stroke(),n.fillStyle="#e9fff7",n.textAlign="center",n.font=`800 37px ${Ne}`,n.letterSpacing="5px",n.fillText("DRINK  STAND",e/2,82),n.letterSpacing="0px",n.fillStyle="#73dfd0",n.font=`600 18px ${ae}`,n.fillText("つめた〜い  /  ICE COLD",e/2,113);let s=47,r=142,a=e-94,o=500,l=n.createLinearGradient(0,r,0,r+o);l.addColorStop(0,"#eafff9"),l.addColorStop(.5,"#c9f5ee"),l.addColorStop(1,"#aee8e4"),n.fillStyle=l,Rt(n,s,r,a,o,12),n.fill();let c=[["#ff775e","#ffd18d","CITRUS"],["#71c8ff","#e9fbff","AQUA"],["#71d9a6","#efffd5","TEA"],["#ff97ba","#ffe4ee","PEACH"],["#f4d15a","#fff5c1","LEMON"],["#8b7bff","#e7e0ff","SODA"]],h=[166,292,418,544];for(let d=0;d<4;d++){n.fillStyle="rgba(22,84,88,0.16)",n.fillRect(s+8,h[d]+100,a-16,2);for(let p=0;p<6;p++){let y=c[(d*2+p)%c.length],_=s+21+p*62,m=h[d]+(d===3?4:0),f=d===3?80:92;n.fillStyle="rgba(16,40,47,0.22)",Rt(n,_+3,m+6,48,f,8),n.fill();let v=n.createLinearGradient(_,m,_+48,m+f);v.addColorStop(0,y[1]),v.addColorStop(.25,y[0]),v.addColorStop(1,y[0]),n.fillStyle=v,Rt(n,_,m,48,f,8),n.fill(),n.fillStyle="rgba(255,255,255,0.62)",Rt(n,_+7,m+7,8,f-16,4),n.fill(),n.fillStyle="rgba(255,255,255,0.9)",Rt(n,_+4,m+33,40,25,4),n.fill(),n.fillStyle=y[0],n.font=`800 11px ${Ne}`,n.textAlign="center",n.fillText(y[2],_+24,m+50),n.fillStyle="#19444a",n.font=`700 10px ${ae}`,n.fillText("¥130",_+24,m+f-8)}}let u=680;n.fillStyle="#0a1d24",Rt(n,47,u,e-94,110,10),n.fill();for(let d=0;d<2;d++)for(let p=0;p<6;p++)n.fillStyle=p===2&&d===0?"#ff9b79":"rgba(105,227,210,0.8)",n.beginPath(),n.arc(81+p*58,714+d*39,6,0,Math.PI*2),n.fill(),n.fillStyle="rgba(233,255,248,0.78)",n.font=`600 10px ${Ne}`,n.textAlign="center",n.fillText(String(d*6+p+1).padStart(2,"0"),81+p*58,736+d*39);n.fillStyle="#e7f8ec",Rt(n,47,815,e-94,80,9),n.fill(),n.fillStyle="#17343b",n.fillRect(66,836,96,10),n.fillRect(66,858,72,7),n.fillStyle="#ff8c68",Rt(n,320,830,116,45,7),n.fill(),n.fillStyle="#fff7e6",n.font=`800 20px ${Ne}`,n.textAlign="center",n.fillText("IC",378,861),n.fillStyle="rgba(255,255,255,0.12)",n.fillRect(30,30,12,t-60),n.fillStyle="#8ff2de",n.font=`700 14px ${ae}`,n.fillText("雨の日も、ひんやり。",e/2,930)})}function Gf(){return Se(900,420,(n,e,t)=>{let i=n.createLinearGradient(0,0,0,t);i.addColorStop(0,"#fff6df"),i.addColorStop(1,"#efd9b4"),n.fillStyle=i,n.fillRect(0,0,e,t),n.fillStyle="#173d3e",n.fillRect(0,0,e,78),n.fillStyle="#fff6df",n.font=`700 38px ${ae}`,n.textAlign="left",n.fillText("こだわりコーヒー",38,53),n.fillStyle="#7adbc6",n.font=`700 19px ${Ne}`,n.letterSpacing="4px",n.fillText("FRESHLY BREWED",440,50),n.letterSpacing="0px";let s=[{x:130,label:"HOT",price:"¥100",color:"#8b4f2e",accent:"#e3a26f"},{x:402,label:"ICE",price:"¥120",color:"#356975",accent:"#9bd9d0"},{x:674,label:"LATTE",price:"¥160",color:"#b57a4a",accent:"#ffd4a1"}];for(let r of s){let a=r.x;n.fillStyle="rgba(27,58,60,0.1)",n.beginPath(),n.ellipse(a,330,84,18,0,0,Math.PI*2),n.fill(),n.fillStyle="#fdfbf4",Rt(n,a-53,182,106,136,12),n.fill(),n.strokeStyle="#2a5353",n.lineWidth=4,Rt(n,a-53,182,106,136,12),n.stroke(),n.fillStyle=r.color,Rt(n,a-46,222,92,66,6),n.fill(),n.strokeStyle="rgba(255,247,230,0.7)",n.lineWidth=3,n.beginPath(),n.arc(a,254,24,0,Math.PI*2),n.stroke(),bt(n,a,254,14,4,"#fff6df",4),n.fillStyle="#204748",n.font=`800 25px ${Ne}`,n.textAlign="center",n.fillText(r.label,a,156),n.fillStyle="#e2704f",n.font=`800 40px ${ae}`,n.fillText(r.price,a,366),n.strokeStyle="rgba(190,151,104,0.55)",n.beginPath(),n.moveTo(a-62,384),n.lineTo(a+62,384),n.stroke()}n.strokeStyle="rgba(255,255,255,0.8)",n.lineWidth=4;for(let r of[101,375,647])n.beginPath(),n.moveTo(r,178),n.bezierCurveTo(r-16,156,r+14,140,r-4,118),n.stroke()})}function Ci(n="coffee"){return Se(512,720,(e,t,i)=>{if(e.textBaseline="alphabetic",n==="coffee"){let s=e.createLinearGradient(0,0,0,i);s.addColorStop(0,"#f8dfb1"),s.addColorStop(1,"#dc995f"),e.fillStyle=s,e.fillRect(0,0,t,i),e.fillStyle="#183f40",e.font=`800 76px ${ae}`,e.textAlign="left",e.fillText("あったかい",42,112),e.fillText("コーヒー",42,190),e.fillStyle="#bb5438",e.font=`700 28px ${Ne}`,e.letterSpacing="5px",e.fillText("HOT COFFEE",44,238),e.letterSpacing="0px",e.fillStyle="#fbf6e9",Rt(e,112,322,274,254,30),e.fill(),e.strokeStyle="#244948",e.lineWidth=8,Rt(e,112,322,274,254,30),e.stroke(),e.fillStyle="#7f5034",e.fillRect(112,390,274,116),e.fillStyle="#f4dfc5",e.font=`700 34px ${ae}`,e.textAlign="center",e.fillText("ほしぞらブレンド",249,455),e.strokeStyle="#f6ead4",e.lineWidth=8,e.beginPath(),e.arc(438,412,41,-1.2,1.2),e.stroke(),e.strokeStyle="rgba(255,255,255,0.72)",e.lineWidth=8;for(let r=0;r<3;r++)e.beginPath(),e.moveTo(202+r*48,306),e.bezierCurveTo(188+r*48,265,224+r*48,245,203+r*48,206),e.stroke();e.fillStyle="#f7f0dc",e.beginPath(),e.arc(411,196,86,0,Math.PI*2),e.fill(),e.fillStyle="#e06b48",e.font=`800 66px ${ae}`,e.textAlign="center",e.fillText("100",411,209),e.font=`700 24px ${ae}`,e.fillText("円",411,250),bt(e,410,126,23,6,"#f4ce87",4),e.fillStyle="#153d40",e.font=`600 22px ${ae}`,e.textAlign="left",e.fillText("朝も夜も、いい香り。",44,655),e.strokeStyle="rgba(24,63,64,0.4)",e.lineWidth=3,e.beginPath(),e.moveTo(44,681),e.lineTo(468,681),e.stroke()}else if(n==="onigiri")e.fillStyle="#f2f0d8",e.fillRect(0,0,t,i),e.fillStyle="#65b7a7",e.fillRect(0,0,t,262),e.fillStyle="#fff9e7",e.font=`800 67px ${ae}`,e.textAlign="center",e.fillText("おにぎり",256,116),e.font=`800 100px ${ae}`,e.fillText("100円",256,222),e.font=`700 25px ${ae}`,e.fillText("毎日炊きたて  /  新米",256,310),e.fillStyle="#fffdf6",e.strokeStyle="#28534f",e.lineWidth=7,e.beginPath(),e.moveTo(256,348),e.quadraticCurveTo(290,402,402,578),e.quadraticCurveTo(256,626,108,578),e.quadraticCurveTo(218,403,256,348),e.closePath(),e.fill(),e.stroke(),e.fillStyle="#1d3534",Rt(e,201,462,110,146,12),e.fill(),e.fillStyle="#f3a976",e.beginPath(),e.arc(251,420,18,0,Math.PI*2),e.fill(),e.fillStyle="#224543",e.font=`700 24px ${ae}`,e.textAlign="left",e.fillText("鮭・ツナ・梅 あります。",45,663),eo(e,435,345,20,"#f0b25e");else if(n==="milk"){let s=e.createLinearGradient(0,0,0,i);s.addColorStop(0,"#ffd9df"),s.addColorStop(1,"#e69cac"),e.fillStyle=s,e.fillRect(0,0,t,i),e.fillStyle="#fff3e6",e.font=`800 78px ${ae}`,e.textAlign="left",e.fillText("いちご",45,115),e.fillText("ミルク",45,206),e.fillStyle="#b54e67",e.font=`700 26px ${Ne}`,e.letterSpacing="5px",e.fillText("NEW  /  LIMITED",48,254),e.fillStyle="#fff9f0",e.strokeStyle="#803f4f",e.lineWidth=6,e.beginPath(),e.moveTo(144,315),e.lineTo(349,290),e.lineTo(349,603),e.lineTo(144,624),e.closePath(),e.fill(),e.stroke(),e.fillStyle="#f38a9c",e.fillRect(144,426,205,112),e.fillStyle="#fff8e8",e.font=`700 25px ${ae}`,e.textAlign="center",e.fillText("星空いちご",247,479),e.fillStyle="#c34f65",e.beginPath(),e.arc(247,394,34,0,Math.PI*2),e.fill(),e.fillStyle="#5f9c5d",e.beginPath(),e.ellipse(247,358,18,8,-.3,0,Math.PI*2),e.fill(),bt(e,427,349,31,9,"#fff2d7",4),e.fillStyle="#a5445a",e.font=`700 33px ${ae}`,e.textAlign="left",e.fillText("いちごの季節。",46,664)}else if(n==="bento")e.fillStyle="#f3b86a",e.fillRect(0,0,t,i),e.fillStyle="#173d3e",e.fillRect(0,0,t,58),e.fillStyle="#fff2d5",e.font=`700 23px ${ae}`,e.textAlign="left",e.fillText("星見町 深夜食堂",37,39),e.fillStyle="#254747",e.font=`800 76px ${ae}`,e.fillText("のり弁",42,169),e.fillText("全部",42,255),e.fillText("のせ",42,341),e.fillStyle="#2d2923",Rt(e,175,360,301,222,20),e.fill(),e.fillStyle="#f5edcf",Rt(e,190,374,271,196,12),e.fill(),e.fillStyle="#fff9e8",Rt(e,202,386,131,137,8),e.fill(),e.fillStyle="#3b3e2e",Rt(e,208,454,118,63,5),e.fill(),e.fillStyle="#d86b47",e.beginPath(),e.arc(377,431,34,0,Math.PI*2),e.fill(),e.fillStyle="#edb86e",e.beginPath(),e.arc(386,469,24,0,Math.PI*2),e.fill(),e.fillStyle="#50865e",e.beginPath(),e.arc(352,480,18,0,Math.PI*2),e.fill(),e.fillStyle="#e06a48",e.font=`800 60px ${ae}`,e.textAlign="center",e.fillText("¥398",255,651),bt(e,431,273,27,8,"#fff0cf",4);else{let s=e.createLinearGradient(0,0,0,i);s.addColorStop(0,"#173e44"),s.addColorStop(1,"#0b2731"),e.fillStyle=s,e.fillRect(0,0,t,i),e.strokeStyle="#75ddc9",e.lineWidth=5,Rt(e,26,26,t-52,i-52,18),e.stroke(),e.fillStyle="#75ddc9",e.font=`700 24px ${Ne}`,e.letterSpacing="5px",e.textAlign="center",e.fillText("HOSHIZORA MART",256,100),e.letterSpacing="0px",e.fillStyle="#fff5dd",e.font=`800 72px ${ae}`,e.fillText("おでん",256,227),e.font=`700 40px ${ae}`,e.fillText("はじめました",256,291),e.strokeStyle="#e8b06b",e.lineWidth=7,e.beginPath(),e.arc(256,438,105,0,Math.PI*2),e.stroke(),e.fillStyle="#e8b06b",e.beginPath(),e.arc(256,438,79,0,Math.PI*2),e.fill(),e.fillStyle="#58452e",e.beginPath(),e.arc(229,420,23,0,Math.PI*2),e.fill(),e.fillStyle="#f4e8ca",e.beginPath(),e.arc(286,464,21,0,Math.PI*2),e.fill(),e.strokeStyle="#e5d3ac",e.lineWidth=5,e.beginPath(),e.moveTo(222,494),e.lineTo(290,445),e.stroke(),e.fillStyle="#fff3d2",e.font=`700 22px ${ae}`,e.fillText("だいこん・たまご・こんにゃく",256,594),eo(e,411,196,19,"#ffe5b8"),eo(e,100,548,13,"#ffe5b8")}})}function Pi(n="open"){return Se(512,256,(e,t,i)=>{e.clearRect(0,0,t,i),e.textAlign="center",e.textBaseline="middle",n==="open"?(e.strokeStyle="#f4f1dc",e.lineWidth=8,e.beginPath(),e.arc(256,125,98,0,Math.PI*2),e.stroke(),e.fillStyle="#f4f1dc",e.font=`800 52px ${Ne}`,e.fillText("24 HOURS",256,110),e.font=`700 27px ${ae}`,e.fillText("年中無休",256,162)):n==="welcome"?(e.fillStyle="rgba(248,243,225,0.9)",e.font=`700 47px ${ae}`,e.fillText("いらっしゃいませ",256,118),e.strokeStyle="#f4f1dc",e.lineWidth=4,Rt(e,32,34,448,158,18),e.stroke()):n==="auto"?(e.fillStyle="#bfe9dc",e.font=`700 33px ${ae}`,e.fillText("自動ドア",256,80),e.fillStyle="#f6f0db",e.font=`800 32px ${Ne}`,e.fillText("AUTOMATIC DOOR",256,130),e.strokeStyle="#bdebd9",e.lineWidth=5,e.beginPath(),e.moveTo(146,187),e.lineTo(256,187),e.stroke(),e.beginPath(),e.moveTo(230,165),e.lineTo(258,187),e.lineTo(230,209),e.stroke()):n==="payment"?(e.fillStyle="#f5f3e5",e.font=`700 28px ${Ne}`,e.fillText("CASH  /  IC  /  QR",256,90),e.fillStyle="#88e5d2",e.font=`700 25px ${ae}`,e.fillText("各種キャッシュレス",256,144)):(e.fillStyle="#f5f1dd",e.font=`700 31px ${ae}`,e.fillText("コーヒー",256,92),e.font=`700 20px ${Ne}`,e.fillText("HOT & ICE",256,138))})}function Wf(n="snack"){return Se(1024,256,(e,t,i)=>{n==="snack"?(e.fillStyle="#f0d088",e.fillRect(0,0,t,i),e.fillStyle="#4a3330",e.font=`800 74px ${ae}`,e.textAlign="center",e.textBaseline="middle",e.fillText("お菓子  ／  SNACKS",t/2,i/2),e.fillStyle="#d9674e",e.fillRect(0,0,t,16),e.fillStyle="#66b8a1",e.fillRect(0,i-14,t,14)):n==="bento"?(e.fillStyle="#e6efe2",e.fillRect(0,0,t,i),e.fillStyle="#28554f",e.font=`800 72px ${ae}`,e.textAlign="center",e.textBaseline="middle",e.fillText("おにぎり・お弁当",t/2,i/2+2),e.fillStyle="#e18a52",e.fillRect(0,i-17,t,17)):n==="drink"?(e.fillStyle="#dff4f0",e.fillRect(0,0,t,i),e.fillStyle="#2b6766",e.font=`800 70px ${ae}`,e.textAlign="center",e.textBaseline="middle",e.fillText("つめたい 飲みもの",t/2,i/2),e.fillStyle="#6abaac",e.fillRect(0,0,t,14)):(e.fillStyle="#f0e4c4",e.fillRect(0,0,t,i),e.fillStyle="#294b47",e.font=`800 64px ${ae}`,e.textAlign="center",e.textBaseline="middle",e.fillText("日用品・雑貨",t/2,i/2),e.fillStyle="#e3a15e",e.fillRect(0,0,18,i))})}function Xf(){return Se(480,640,(n,e,t)=>{n.fillStyle="#4e3a2d",n.fillRect(0,0,e,t),n.fillStyle="#bcaa86",n.fillRect(18,18,e-36,t-36);let i=[[45,58,176,236,"#f5e7c9","#bd5741","星見町<br>夏祭り"],[245,70,178,190,"#e6ede1","#3f7061","防災訓練<br>のお知らせ"],[58,325,160,220,"#f0dbb2","#9d6e43","猫の<br>里親募集"],[244,288,180,260,"#f7edda","#405f72","商店街<br>売出し"]];for(let[s,r,a,o,l,c]of i){n.save(),n.translate(s+a/2,r+o/2),n.rotate((Math.random()-.5)*.05),n.fillStyle="rgba(54,38,25,0.22)",n.fillRect(-a/2+5,-o/2+6,a,o),n.fillStyle=l,n.fillRect(-a/2,-o/2,a,o),n.fillStyle="rgba(83,63,44,0.24)";for(let h=0;h<7;h++)n.fillRect(-a/2+16,20+h*18,a*(.35+Math.random()*.4),5);n.fillStyle=c,n.font=`700 ${a>170?27:21}px ${ae}`,n.textAlign="center",n.fillText(["まちの","おしらせ"][s%2],0,-o/2+49),n.fillStyle="rgba(255,255,255,0.38)",n.fillRect(-a/2+15,66,a-30,76),n.strokeStyle=c,n.lineWidth=8,n.beginPath(),n.moveTo(-a/2+20,100),n.bezierCurveTo(-20,40,20,150,a/2-18,94),n.stroke(),n.fillStyle="#4f3d2c";for(let h=0;h<5;h++)n.fillRect(-a/2+18,o/2-78+h*13,a*(.52+Math.random()*.3),4);n.fillStyle="#d26d50",n.beginPath(),n.arc(a/2-23,o/2-23,6,0,Math.PI*2),n.fill(),n.restore()}n.fillStyle="rgba(38,28,20,0.2)",n.fillRect(0,0,e,8)})}function Yf(n=0){let e=[["#e86969","#ffe7c2","#fff6dd","CITY"],["#4e8ccf","#e5f4ff","#ffffff","WEEK"],["#e8b65a","#3e3a30","#fff6da","POP"],["#65ad93","#f1f0d6","#ffffff","LIFE"],["#b17db5","#f5e4f1","#ffffff","STYLE"],["#dd8761","#f9e9cd","#ffffff","COOK"]],t=e[n%e.length];return Se(300,400,(i,s,r)=>{i.fillStyle=t[0],i.fillRect(0,0,s,r),i.fillStyle="rgba(255,255,255,0.22)",i.beginPath(),i.arc(60,85,95,0,Math.PI*2),i.fill(),i.save(),i.translate(s/2,170+n*19),i.rotate(.11),i.fillStyle=t[1],Rt(i,-88,-60,176,174,12),i.fill(),i.strokeStyle="rgba(40,39,34,0.25)",i.lineWidth=5,Rt(i,-88,-60,176,174,12),i.stroke(),i.fillStyle=t[0],i.beginPath(),i.arc(-20,5,47,0,Math.PI*2),i.fill(),i.fillStyle=t[2],i.beginPath(),i.arc(28,34,31,0,Math.PI*2),i.fill(),i.restore(),i.fillStyle="#202c31",i.font=`800 42px ${Ne}`,i.textAlign="left",i.fillText(t[3],22,48),i.fillStyle="#fff8e9",i.font=`700 20px ${ae}`,i.textAlign="center",i.fillText(["特集 雨の日の過ごし方","今月の小さな幸せ","おうちカフェ","静かな夜の音楽","私の好きな街","深夜ごはん"][n%6],s/2,r-36),i.fillStyle="rgba(255,255,255,0.5)",i.fillRect(21,65,110,7),i.fillRect(21,80,77,6)})}function ci(n,e=7,t=22){let i=e*1973,s=()=>(i=i*1664525+1013904223>>>0,i/4294967295);return Se(512,768,(r,a,o)=>{r.clearRect(0,0,a,o);let l=r.createLinearGradient(0,0,0,o);l.addColorStop(0,"rgba(255,255,255,0.11)"),l.addColorStop(.4,"rgba(255,255,255,0.04)"),l.addColorStop(1,"rgba(255,255,255,0)"),r.fillStyle=l,r.fillRect(0,0,a,o),r.filter="blur(3px)";for(let c=0;c<t;c++){let h=s()*a,u=n[Math.floor(s()*n.length)],d=4+s()*26,p=16+s()*100,y=200+s()*(o*.82),_=r.createLinearGradient(0,p,0,p+y);_.addColorStop(0,u),_.addColorStop(.28,u),_.addColorStop(.72,"rgba(0,0,0,0)"),r.globalAlpha=.12+s()*.46,r.fillStyle=_,r.fillRect(h-d/2,p,d,y),s()>.54&&(r.globalAlpha=.09+s()*.22,r.fillRect(h-d*.9,p+14,d*.7,y*.7))}r.filter="blur(1px)";for(let c=0;c<28;c++){r.globalAlpha=.15+s()*.35,r.fillStyle=n[Math.floor(s()*n.length)];let h=s()*a,u=s()*o*.55;r.fillRect(h,u,2+s()*15,2+s()*6)}r.globalAlpha=1,r.filter="none"})}function x_(){return Se(256,256,(n,e,t)=>{let i=n.createRadialGradient(e/2,t/2,0,e/2,t/2,e/2);i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.15,"rgba(255,255,255,0.72)"),i.addColorStop(.42,"rgba(255,255,255,0.17)"),i.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=i,n.fillRect(0,0,e,t)})}function S_(){return Se(512,512,(n,e,t)=>{let i=n.createRadialGradient(e/2,t/2,0,e/2,t/2,e/2);i.addColorStop(0,"rgba(255,255,255,0.7)"),i.addColorStop(.35,"rgba(255,255,255,0.24)"),i.addColorStop(.7,"rgba(255,255,255,0.04)"),i.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=i,n.fillRect(0,0,e,t)})}function M_(){return Se(64,512,(n,e,t)=>{n.clearRect(0,0,e,t);let i=n.createLinearGradient(0,0,0,t);i.addColorStop(0,"rgba(220,246,255,0)"),i.addColorStop(.15,"rgba(220,246,255,0.2)"),i.addColorStop(.62,"rgba(220,246,255,0.55)"),i.addColorStop(.9,"rgba(240,253,255,0.9)"),i.addColorStop(.94,"rgba(255,255,255,0.95)"),i.addColorStop(1,"rgba(220,246,255,0)"),n.fillStyle=i,n.beginPath(),n.ellipse(e/2,t*.7,e*.19,t*.28,0,0,Math.PI*2),n.fill(),n.fillRect(e*.4,t*.1,e*.2,t*.78),n.fillStyle="rgba(255,255,255,0.95)",n.beginPath(),n.ellipse(e/2,t*.72,e*.23,t*.07,0,0,Math.PI*2),n.fill()})}function qf(){return Se(256,256,(n,e,t)=>{n.fillStyle="#d1ae5f",n.fillRect(0,0,e,t),n.fillStyle="rgba(255,235,173,0.55)";for(let i=18;i<t;i+=34)for(let s=18;s<e;s+=34)n.beginPath(),n.arc(s,i,8,0,Math.PI*2),n.fill();n.strokeStyle="rgba(115,80,32,0.28)",n.lineWidth=2;for(let i=0;i<t;i+=34)n.beginPath(),n.moveTo(0,i),n.lineTo(e,i),n.stroke()},{repeat:[1,1]})}function $f(){return Se(512,512,(n,e,t)=>{n.clearRect(0,0,e,t),n.fillStyle="#27313e",n.beginPath(),n.arc(e/2,t/2,244,0,Math.PI*2),n.fill(),n.strokeStyle="#667181",n.lineWidth=12,n.beginPath(),n.arc(e/2,t/2,230,0,Math.PI*2),n.stroke(),n.strokeStyle="rgba(120,133,150,0.65)",n.lineWidth=4;for(let i=60;i<218;i+=26)n.beginPath(),n.arc(e/2,t/2,i,0,Math.PI*2),n.stroke();for(let i=0;i<20;i++){let s=i/20*Math.PI*2;n.beginPath(),n.moveTo(e/2+Math.cos(s)*58,t/2+Math.sin(s)*58),n.lineTo(e/2+Math.cos(s)*208,t/2+Math.sin(s)*208),n.stroke()}n.fillStyle="#394553",n.beginPath(),n.arc(e/2,t/2,64,0,Math.PI*2),n.fill(),bt(n,e/2,t/2,42,11,"#9aa5b3",4),n.strokeStyle="rgba(255,255,255,0.2)",n.lineWidth=3,n.beginPath(),n.arc(e/2,t/2,246,-2.2,.2),n.stroke()})}function Zf(){return Se(512,512,(n,e,t)=>{n.clearRect(0,0,e,t),n.fillStyle="rgba(243,244,225,0.9)",n.font=`800 170px ${ae}`,n.textAlign="center",n.textBaseline="middle",n.fillText("止まれ",e/2,t/2),n.globalCompositeOperation="destination-out",n.globalAlpha=.1;for(let i=0;i<80;i++)n.fillRect(Math.random()*e,Math.random()*t,20+Math.random()*40,2+Math.random()*5)})}function Jf(){let n=89,e=()=>(n=n*16807%2147483647,n/2147483647);return Se(1024,1024,(t,i,s)=>{t.fillStyle="#151a25",t.fillRect(0,0,i,s);let r=t.createRadialGradient(i*.3,s*.35,0,i*.3,s*.35,i*.7);r.addColorStop(0,"rgba(70,83,102,0.12)"),r.addColorStop(1,"rgba(0,0,0,0)"),t.fillStyle=r,t.fillRect(0,0,i,s);for(let a=0;a<6500;a++){let o=Math.floor(24+e()*26);t.fillStyle=`rgba(${o},${o+5},${o+12},${.12+e()*.18})`;let l=e()*2.2+.4;t.fillRect(e()*i,e()*s,l,l)}for(let a=0;a<18;a++){t.strokeStyle=`rgba(5,8,13,${.18+e()*.28})`,t.lineWidth=1+e()*2,t.beginPath();let o=e()*i,l=e()*s;t.moveTo(o,l),t.bezierCurveTo(o+e()*120,l+e()*60,o+e()*240,l-e()*30,o+260,l+e()*140),t.stroke()}for(let a=0;a<30;a++)t.strokeStyle="rgba(160,177,196,0.06)",t.lineWidth=1+e()*3,t.beginPath(),t.moveTo(e()*i,0),t.lineTo(e()*i,s),t.stroke()},{repeat:[3,3]})}function Kf(){let n=23,e=()=>(n=n*16807%2147483647,n/2147483647);return Se(1024,1024,(t,i,s)=>{t.fillStyle="#626d7a",t.fillRect(0,0,i,s);let r=8,a=6,o=i/a,l=s/r;for(let h=0;h<r;h++)for(let u=0;u<a;u++){let d=h%2===0?0:o*.5,p=(u*o+d)%i,y=h*l,_=91+e()*26;if(t.fillStyle=`rgba(${_-4},${_+2},${_+15},1)`,t.fillRect(p+3,y+3,o-6,l-6),p+o>i&&t.fillRect(p-i+3,y+3,o-6,l-6),t.fillStyle="rgba(255,255,255,0.05)",t.fillRect(p+3,y+3,o-6,4),t.fillStyle="rgba(28,36,48,0.18)",t.fillRect(p+3,y+l-10,o-6,7),e()>.78){t.strokeStyle="rgba(39,47,57,0.4)",t.lineWidth=1.4,t.beginPath();let m=p+o*(.2+e()*.6),f=y+l*.3;t.moveTo(m,f),t.lineTo(m+e()*22-11,f+20+e()*25),t.lineTo(m+e()*40-20,f+48),t.stroke()}}t.strokeStyle="rgba(26,32,42,0.8)",t.lineWidth=5;for(let h=0;h<=r;h++)t.beginPath(),t.moveTo(0,h*l),t.lineTo(i,h*l),t.stroke();for(let h=0;h<a;h++)for(let u=0;u<r;u++){let d=u%2===0?0:o*.5,p=(h*o+d)%i;t.beginPath(),t.moveTo(p,u*l),t.lineTo(p,(u+1)*l),t.stroke()}let c=t.createLinearGradient(0,0,i,s);c.addColorStop(0,"rgba(10,20,34,0.05)"),c.addColorStop(.45,"rgba(20,42,58,0.26)"),c.addColorStop(1,"rgba(7,13,22,0.1)"),t.fillStyle=c,t.fillRect(0,0,i,s);for(let h=0;h<60;h++)t.fillStyle=`rgba(177,205,216,${.02+e()*.05})`,t.fillRect(e()*i,e()*s,18+e()*60,2+e()*4)},{repeat:[4,4]})}function jf(){return Se(1024,1024,(n,e,t)=>{n.fillStyle="#d7d0bd",n.fillRect(0,0,e,t);for(let i=0;i<8;i++)for(let s=0;s<8;s++){let r=(i+s)%2===0;n.fillStyle=r?"#ded6c2":"#d2c9b5",n.fillRect(s*128+3,i*128+3,122,122),n.fillStyle="rgba(255,255,255,0.15)",n.fillRect(s*128+3,i*128+3,122,3)}n.strokeStyle="rgba(86,88,78,0.34)",n.lineWidth=2;for(let i=0;i<=8;i++)n.beginPath(),n.moveTo(0,i*128),n.lineTo(e,i*128),n.stroke(),n.beginPath(),n.moveTo(i*128,0),n.lineTo(i*128,t),n.stroke();n.fillStyle="rgba(124,176,158,0.18)",n.fillRect(0,420,e,14),n.fillStyle="rgba(216,150,88,0.16)",n.fillRect(0,456,e,9)},{repeat:[1.6,1.6]})}function Pc(n="#e36f4f"){return Se(256,128,(e,t,i)=>{e.fillStyle="#f8f1db",e.fillRect(0,0,t,i),e.strokeStyle="rgba(83,75,54,0.25)",e.lineWidth=3,e.strokeRect(2,2,t-4,i-4),e.fillStyle=n,Rt(e,10,16,68,38,6),e.fill(),e.fillStyle="#fffaf0",e.font=`700 23px ${ae}`,e.textAlign="center",e.fillText("NEW",44,44),e.fillStyle="#313731",e.textAlign="left",e.font=`700 29px ${ae}`,e.fillText("¥138",94,48),e.fillStyle="rgba(55,59,49,0.55)",e.font=`600 15px ${ae}`,e.fillText("税込 / おすすめ",95,81),e.fillStyle="rgba(35,41,36,0.18)";for(let s=0;s<5;s++)e.fillRect(10,94+s*5,100+s*21,2);e.fillStyle=n,e.fillRect(0,i-8,t,8)})}var Of=new Map,Ff=new Map;function b_(n,e,t){let i=`${n.toFixed(3)}:${e.toFixed(3)}:${t.toFixed(3)}`,s=Of.get(i);return s||(s=new an(n,e,t),Of.set(i,s)),s}function b(n,e,t,i,s,r=0,a=0,o=0,l={}){let c=new Pe(b_(e,t,i),s);return c.position.set(r,a,o),l.rx&&(c.rotation.x=l.rx),l.ry&&(c.rotation.y=l.ry),l.rz&&(c.rotation.z=l.rz),c.castShadow=l.cast??!0,c.receiveShadow=l.receive??!0,l.name&&(c.name=l.name),n.add(c),c}function bn(n,e,t,i,s,r,a=0,o=0,l=0,c={}){let h=c.segments??2,u=new Qa(e,t,i,h,s),d=new Pe(u,r);return d.position.set(a,o,l),d.castShadow=c.cast??!0,d.receiveShadow=c.receive??!0,n.add(d),d}function oe(n,e,t,i,s,r=0,a=0,o=0,l={}){let c=l.segments??10,h=`${e.toFixed(3)}:${t.toFixed(3)}:${i.toFixed(3)}:${c}`,u=Ff.get(h);u||(u=new li(e,t,i,c),Ff.set(h,u));let d=new Pe(u,s);return d.position.set(r,a,o),l.rx&&(d.rotation.x=l.rx),l.ry&&(d.rotation.y=l.ry),l.rz&&(d.rotation.z=l.rz),d.castShadow=l.cast??!0,d.receiveShadow=l.receive??!0,n.add(d),d}function he(n,e,t,i,s=0,r=0,a=0,o={}){let l=new Pe(new Qt(e,t),i);return l.position.set(s,r,a),o.rx!==void 0&&(l.rotation.x=o.rx),o.ry!==void 0&&(l.rotation.y=o.ry),o.rz!==void 0&&(l.rotation.z=o.rz),l.castShadow=o.cast??!1,l.receiveShadow=o.receive??!1,o.name&&(l.name=o.name),n.add(l),l}function st(n,e,t,i,s=0,r=0,a=0,o={}){let l=new Pe(new Qt(e,t),i);return l.rotation.x=-Math.PI/2,l.rotation.z=o.rotation??0,l.position.set(s,r,a),l.receiveShadow=o.receive??!0,l.castShadow=!1,l.renderOrder=o.renderOrder??0,n.add(l),l}function ft(n,e,t,i,s,r={}){let a=new D(...e),o=new D(...t),l=o.clone().sub(a),c=l.length(),h=new li(i,i,c,r.segments??6),u=new Pe(h,s);return u.position.copy(a).add(o).multiplyScalar(.5),u.quaternion.setFromUnitVectors(new D(0,1,0),l.normalize()),u.castShadow=r.cast??!0,u.receiveShadow=r.receive??!0,n.add(u),u}function Wt(n,e,t,i,s={}){let r=new dr(e.map(l=>new D(...l))),a=new Oa(r,s.segments??24,t,s.radialSegments??4,!1),o=new Pe(a,i);return o.castShadow=s.cast??!1,o.receiveShadow=s.receive??!1,n.add(o),o}function Ge(n,e,t,i,s,r,a=.38){let o=zs(),l=new Gn({map:o,color:e,transparent:!0,opacity:a,depthWrite:!1,depthTest:!0,blending:ot,toneMapped:!1}),c=new oi(l);return c.position.set(i,s,r),c.scale.set(t,t,1),c.renderOrder=8,n.add(c),c}var Bf=null;function At(n,e,t,i,s,r,a=.3,o=.03){Bf??=S_();let l=new xn({map:Bf,color:e,transparent:!0,opacity:a,depthWrite:!1,blending:ot,toneMapped:!1});l.userData.outlineParameters={visible:!1};let c=new Pe(new Qt(t,i),l);return c.rotation.x=-Math.PI/2,c.position.set(s,o,r),c.renderOrder=3,n.add(c),c}var zf=null;function zs(){return zf??=x_(),zf}var kf=null;function Qf(){return kf??=M_(),kf}function Ie(n,e={}){return ie(16777215,{map:n,transparent:e.transparent??!1,opacity:e.opacity??1,alphaTest:e.alphaTest??0,depthWrite:e.depthWrite??!0,side:e.side??sn,blending:e.blending??ei})}function Ic(n,e,t=3,i=.18,s=26){let r=t*6521,a=()=>(r=r*1664525+1013904223>>>0,r/4294967295),o=new Wn;for(let l=0;l<s;l++){let c=l/s*Math.PI*2,h=1+(a()-.5)*i*2+Math.sin(c*3+t)*i*.4,u=Math.cos(c)*n*h,d=Math.sin(c)*e*h;l===0?o.moveTo(u,d):o.lineTo(u,d)}return o.closePath(),new Ls(o,2)}function Lc(n){return n<.5?2*n*n:1-Math.pow(-2*n+2,2)/2}function Ht(n){let e=n;return function(){e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}var E_=Rc.shopWalkRight,A_=Rc.shopWalkFront,Dc=.14+.004,Xt=.018+.005;function ks(n,e,t){let i=n.clone();return i.needsUpdate=!0,i.wrapS=ni,i.wrapT=ni,i.repeat.set(e,t),i}function cn(n,e,t,i,s,r,a,o){let l=Ic(i,s,r),c=_t(726816,{roughness:.055,metalness:.72,clearcoat:1,clearcoatRoughness:.035,transparent:!0,opacity:.8,envMapIntensity:1.65,side:Je,outline:!1}),h=new Pe(l,c);h.rotation.x=-Math.PI/2,h.position.set(e,a,t),h.receiveShadow=!0,h.renderOrder=1,n.add(h);let u=Ic(i*1.015,s*1.015,r+9),d=ie(7247785,{transparent:!0,opacity:.1,side:Je,depthWrite:!1,blending:ot}),p=new Pe(u,d);return p.rotation.x=-Math.PI/2,p.position.set(e,a+.001,t),p.renderOrder=2,n.add(p),o.push({x:e,z:t,rx:i,rz:s,y:a+.006,seed:r}),h}function hi(n,e,t,i,s,r,a=0,o=Xt,l=1){let c=st(n,i,s,r,e,o,t,{rotation:a});return c.receiveShadow=!0,c}function w_(n,e){let t=T(659740),i=T(2962752),s=T(9337173,{emissive:2958360,emissiveIntensity:.25}),r=bn(n,12+.05,.6,12+.05,.1,t,0,-.3,0,{segments:3,cast:!0,receive:!0});r.name="diorama-base",bn(n,12+.09,.095,12+.09,.085,i,0,-.607,0,{segments:2,cast:!0,receive:!0}),bn(n,12+.075,.062,12+.075,.07,s,0,-.032,0,{segments:2,cast:!0,receive:!0});for(let k of[-1,1])for(let z of[-1,1])b(n,.16,.17,.06,s,k*5.81,-.25,z*6.015,{cast:!1,receive:!1});let a=Hf();he(n,3.55,.52,Ie(a,{}),1.8,-.31,12/2+.028);for(let k of[-1.61,1.61])oe(n,.036,.036,.018,s,1.8+k,-.31,12/2+.045,{rx:Math.PI/2,segments:12,cast:!1});let o=E_+6,l=A_+6,c=b(n,o,.14,l,to(6516860,{roughness:.72}),-6+o/2,.14/2,-6+l/2,{cast:!1,receive:!0});c.name="shop-sidewalk";let h=Kf(),u=_t(16777215,{map:ks(h,5.8,5.6),roughness:.38,metalness:.12,clearcoat:.75,clearcoatRoughness:.18,envMapIntensity:.7,outline:!1}),d=st(n,o,l,u,-6+o/2,Dc,-6+l/2);d.receiveShadow=!0;let p=_t(16777215,{map:ks(h,6,.37),roughness:.41,metalness:.08,clearcoat:.55,clearcoatRoughness:.22,envMapIntensity:.55,outline:!1}),y=b(n,12,.14,.45,to(6582653,{roughness:.75}),0,.14/2,5.775,{cast:!1,receive:!0});y.receiveShadow=!0,st(n,12,.44,p,0,Dc,5.775);let _=b(n,.45,.14,8.9,to(6582653,{roughness:.75}),5.775,.14/2,-1.55,{cast:!1,receive:!0});_.receiveShadow=!0,st(n,.44,8.9,ks(h,.4,4.8)&&_t(16777215,{map:ks(h,.4,4.6),roughness:.42,metalness:.1,clearcoat:.5,envMapIntensity:.6,outline:!1}),5.775,Dc,-1.55);let m=Jf(),f=_t(16777215,{map:ks(m,4,1.3),roughness:.31,metalness:.23,clearcoat:1,clearcoatRoughness:.1,envMapIntensity:1.15,outline:!1}),v=st(n,12,2.65,f,0,Xt,4.225);v.name="main-road",v.receiveShadow=!0;let S=_t(16777215,{map:ks(m,.9,3.1),roughness:.3,metalness:.24,clearcoat:1,clearcoatRoughness:.09,envMapIntensity:1.2,outline:!1}),g=st(n,2.43,8.9,S,4.335,Xt,-1.55);g.name="side-road",g.receiveShadow=!0;let L=_t(2108213,{roughness:.12,metalness:.45,clearcoat:1,envMapIntensity:1.3,outline:!1});b(n,9.1,.02,.15,L,-1.44,.148,2.96,{cast:!1,receive:!0}),b(n,.15,.02,8.8,L,3.2,.148,-1.47,{cast:!1,receive:!0});let R=T(wi.curb);b(n,9.18,.14,.16,R,-1.41,.07,2.98,{cast:!0,receive:!0}),b(n,.16,.14,8.8,R,3.19,.07,-1.48,{cast:!0,receive:!0}),b(n,12,.14,.15,R,0,.07,5.55,{cast:!0,receive:!0}),b(n,.15,.14,8.75,R,5.55,.07,-1.44,{cast:!0,receive:!0});let C=ie(12043461,{transparent:!0,opacity:.38});b(n,9.18,.012,.08,C,-1.41,.143,2.98,{cast:!1,receive:!1}),b(n,.08,.012,8.8,C,3.19,.143,-1.48,{cast:!1,receive:!1});let A=_t(16777215,{map:qf(),roughness:.4,metalness:.04,clearcoat:.3,outline:!1});st(n,1.5,.3,A,2.17,.154,2.79),st(n,1.5,.26,A,2.17,.154,5.61),st(n,.68,.28,A,2.12,.154,2.48),st(n,.35,.36,A,1.58,.154,2.25);let x=T(3161158),M=ie(461584);function U(k,z,G=.72,Q=.28,Y=0){let se=new Fe;se.position.set(k,.153,z),se.rotation.y=Y,b(se,G,.03,Q,x,0,0,0,{cast:!1,receive:!0});for(let q=0;q<8;q++)b(se,G/10,.012,Q*.78,M,-G*.39+q*G*.11,.02,0,{cast:!1,receive:!1});n.add(se)}return U(-.2,2.91),U(2.82,2.91,.55,.26),U(3.12,-1.6,.26,.72,Math.PI/2),U(4.8,5.48,.62,.25),U(-4.9,2.76,.55,.25),st(n,.06,2.65,ie(395791,{transparent:!0,opacity:.6}),5.15,Xt+.002,4.2),{shopWalk:c,walkTop:d,mainRoad:v,sideRoad:g}}function R_(n){let e=_t(15001047,{roughness:.38,metalness:.02,clearcoat:.7,clearcoatRoughness:.2,envMapIntensity:.7,outline:!1}),t=_t(13882825,{roughness:.5,metalness:.02,clearcoat:.4,envMapIntensity:.45,outline:!1});e.color.multiplyScalar(.92);for(let h=0;h<4;h++)hi(n,2.18,3.2+h*.6,1.62,.36,e,0,Xt+.004);hi(n,4.32,2.58,2.12,.18,t,0,Xt+.004),hi(n,5.28,1.45,2,.08,t,0,Xt+.004);for(let h=0;h<3;h++)hi(n,-5.25+h*1.22,4.09,.7,.055,t,0,Xt+.003);hi(n,-1.18,3.11,1.8,.055,t,0,Xt+.003);let i=.08;hi(n,4.48,-2,2.35,i,t,0,Xt+.003),hi(n,3.36,-.88,i,2.22,t,0,Xt+.003),hi(n,5.52,-.88,i,2.22,t,0,Xt+.003),hi(n,4.45,.22,2.15,i,t,0,Xt+.003);let s=Se(384,512,(h,u,d)=>{h.clearRect(0,0,u,d),h.fillStyle="rgba(225,228,211,0.72)",h.font='800 350px "Arial Narrow", "Helvetica Neue", sans-serif',h.textAlign="center",h.textBaseline="middle",h.fillText("P",u/2,225),h.font='700 40px "Hiragino Sans", sans-serif',h.fillText("駐車場",u/2,448),h.globalCompositeOperation="destination-out";for(let p=0;p<110;p++)h.globalAlpha=.25,h.fillRect(Math.random()*u,Math.random()*d,Math.random()*50,2+Math.random()*4)});st(n,1.05,1.4,ie(16777215,{map:s,transparent:!0,depthWrite:!1,opacity:.8}),4.45,Xt+.007,-1),b(n,1.6,.1,.14,T(10987930),4.48,.07,-2.06,{cast:!1,receive:!0});let r=Zf();st(n,1.7,1.05,ie(16777215,{map:r,transparent:!0,opacity:.8,depthWrite:!1}),4.34,Xt+.008,1.55);let a=$f(),o=_t(16777215,{map:a,transparent:!0,roughness:.22,metalness:.45,clearcoat:1,envMapIntensity:1.15,outline:!1,side:Je}),l=new Pe(new gn(.46,32),o);l.rotation.x=-Math.PI/2,l.position.set(4.42,Xt+.006,4.42),l.receiveShadow=!0,n.add(l);let c=new Pe(new Un(.47,.025,6,32),T(9343371));c.rotation.x=-Math.PI/2,c.position.set(4.42,Xt+.004,4.42),n.add(c)}function C_(n,e){let t=T(3422529),i=T(2107184),s=T(7303014),r=T(3884366),a=T(7294524),o=new Fe;o.position.set(-5.62,.14,-1.77),n.add(o),b(o,.78,6.05,7.25,t,0,3.025,0,{cast:!0,receive:!0}),b(o,.9,.18,7.4,i,-.02,6.12,0,{cast:!0,receive:!0}),b(o,.02,6,.12,i,.4,3,3.63,{cast:!1}),b(o,.86,.14,.22,i,0,4.84,3.64,{cast:!0}),b(o,.86,.12,.22,i,0,2.85,3.64,{cast:!0});let l=Se(512,512,(g,L,R)=>{g.fillStyle="#3c4448",g.fillRect(0,0,L,R);for(let C=0;C<R;C+=28)g.fillStyle=C%56===0?"#4b5458":"#333b40",g.fillRect(0,C,L,15),g.fillStyle="rgba(255,255,255,0.05)",g.fillRect(0,C+1,L,2);g.strokeStyle="rgba(16,22,25,0.6)",g.lineWidth=4;for(let C=0;C<L;C+=28)g.beginPath(),g.moveTo(C,0),g.lineTo(C,R),g.stroke();g.fillStyle="rgba(114,91,66,0.24)";for(let C=0;C<45;C++)g.fillRect(Math.random()*L,Math.random()*R,6+Math.random()*25,3+Math.random()*50)});he(o,.7,1.75,Ie(l),.01,.94,3.63,{ry:0}),b(o,.76,.08,.16,i,0,1.87,3.6,{cast:!0}),b(o,.7,.12,.18,T(9206366),0,1.91,3.52,{cast:!0}),b(o,.035,1.02,1.8,T(1514789),.4,4.75,1.38,{cast:!1});let c=Se(512,320,(g,L,R)=>{let C=g.createLinearGradient(0,0,0,R);C.addColorStop(0,"#f5c580"),C.addColorStop(.55,"#e49255"),C.addColorStop(1,"#9b5436"),g.fillStyle=C,g.fillRect(0,0,L,R),g.fillStyle="rgba(255,248,218,0.65)";for(let A=20;A<L;A+=34)g.beginPath(),g.arc(A,0,48,0,Math.PI*2),g.fill();g.fillStyle="rgba(66,44,35,0.42)",g.fillRect(0,R*.56,L,R*.44),g.fillStyle="rgba(255,225,171,0.34)",g.fillRect(L*.14,R*.6,L*.2,R*.3),g.strokeStyle="#3e302b",g.lineWidth=10,g.beginPath(),g.moveTo(L/2,0),g.lineTo(L/2,R),g.stroke()});he(o,.62,.96,Ie(c),.406,4.76,1.38,{ry:Math.PI/2}),b(o,.018,.52,1.68,ie(16113594,{transparent:!0,opacity:.26}),.42,4.59,1.38,{cast:!1,receive:!1}),b(o,.35,.38,.62,T(12170661),.56,3.32,1.52,{cast:!0});for(let g=0;g<4;g++)b(o,.02,.02,.5,T(6581098),.745,3.2+g*.055,1.52,{cast:!1});Wt(o,[[.35,3.12,1.6],[.48,2.9,1.6],[.5,2.4,1.61],[.49,1.9,1.6]],.022,r,{segments:16,radialSegments:5}),b(o,.03,2.8,.035,a,.36,2.1,3.55,{cast:!1});let h=Se(256,1024,(g,L,R)=>{g.fillStyle="#281e2b",g.fillRect(0,0,L,R),g.strokeStyle="#ff9fbe",g.lineWidth=6,g.strokeRect(12,12,L-24,R-24),g.save(),g.translate(L/2,120),g.fillStyle="#ff9fbe",g.font='700 88px "Hiragino Mincho ProN", "Yu Mincho", serif',g.textAlign="center",g.fillText("ス",0,0),g.fillText("ナ",0,100),g.fillText("ッ",0,200),g.fillText("ク",0,300),g.restore(),g.strokeStyle="rgba(255,159,190,0.55)",g.lineWidth=3,g.beginPath(),g.arc(L/2,520,58,0,Math.PI*2),g.stroke(),P_(g,L/2,520,31,9,"#ffd8a6"),g.save(),g.translate(L/2,650),g.fillStyle="#f6e7bb",g.font='700 66px "Hiragino Mincho ProN", serif',g.textAlign="center",g.fillText("星",0,0),g.restore(),g.fillStyle="rgba(255,159,190,0.8)",g.font='700 24px "Avenir Next", sans-serif',g.textAlign="center",g.letterSpacing="4px",g.fillText("SNACK BAR",L/2,910),g.fillStyle="#ff9fbe",g.fillRect(34,954,L-68,4)});b(o,.46,1.52,.16,T(2169640),.08,3.96,3.64,{cast:!0}),he(o,.4,1.42,Ie(h),.08,3.96,3.728,{renderOrder:6}),Ge(o,16751552,2.4,.08,3.96,3.84,.12),b(o,.16,.2,.16,T(4601645),.08,3.02,3.78,{cast:!0}),b(o,.1,.13,.1,ie(16766619),.08,3,3.82,{cast:!1}),Ge(o,16763537,.7,.08,3,3.9,.1),b(o,.18,1.55,.47,T(2367019),.55,3.58,2.48,{cast:!0}),he(o,.39,1.43,Ie(h),.646,3.58,2.48,{ry:Math.PI/2}),he(o,.39,1.43,Ie(h),.46,3.58,2.48,{ry:-Math.PI/2});let u=Se(1300,920,(g,L,R)=>{g.fillStyle="#e7dcc3",g.fillRect(0,0,L,R),g.fillStyle="#22494a",g.fillRect(0,R*.68,L,R*.32),g.fillStyle="#cf7e55",g.beginPath(),g.arc(L*.2,R*.3,110,0,Math.PI*2),g.fill(),g.fillStyle="#f3e6c9",g.beginPath(),g.arc(L*.2,R*.3,82,0,Math.PI*2),g.fill(),g.fillStyle="#2a4e4d",g.font=`700 94px ${ae}`,g.textAlign="left",g.fillText("雨の日も",430,220),g.fillText("いつもの店で。",430,330),g.fillStyle="#936d48",g.font=`700 35px ${Ne}`,g.letterSpacing="6px",g.fillText("HOSHIZORA MART",436,406),g.letterSpacing="0px",g.fillStyle="#52746a",g.font=`600 28px ${ae}`,g.fillText("星見町二丁目  /  24 HOURS  /  SINCE 1998",436,462),g.fillStyle="#3d6f65",g.fillRect(824,120,300,360),g.fillStyle="#f5dca8",g.fillRect(844,140,260,320),g.fillStyle="#4c735d",g.fillRect(844,315,260,145),g.fillStyle="#d98659",g.beginPath(),g.arc(1110,236,42,0,Math.PI*2),g.fill(),g.fillStyle="#f0e6ce",g.fillRect(960,302,26,24),g.fillStyle="rgba(37,75,71,0.3)";for(let C=0;C<8;C++)g.fillRect(120,610+C*24,1060-C*42,4);g.globalCompositeOperation="destination-out";for(let C=0;C<220;C++)g.fillStyle=`rgba(0,0,0,${.04+Math.random()*.13})`,g.beginPath(),g.ellipse(Math.random()*L,Math.random()*R,2+Math.random()*16,1+Math.random()*7,Math.random()*Math.PI,0,Math.PI*2),g.fill();g.globalCompositeOperation="source-over",g.strokeStyle="rgba(30,50,48,0.6)",g.lineWidth=7,g.strokeRect(12,12,L-24,R-24),g.fillStyle="#f1e5cc",g.font=`700 26px ${Ne}`,g.textAlign="right",g.fillText("星見町商店街",L-52,R-67)});b(o,.03,2.18,3.54,T(2764851),-.398,3.12,-.55,{cast:!1}),he(o,3.4,2.06,Ie(u),-.418,3.12,-.55,{ry:-Math.PI/2,renderOrder:2}),oe(o,.035,.035,3.5,r,-.42,2.2,-3.5,{segments:6,cast:!0});let d=Se(560,420,(g,L,R)=>{let C=g.createLinearGradient(0,0,0,R);C.addColorStop(0,"#ebc987"),C.addColorStop(1,"#b9784f"),g.fillStyle=C,g.fillRect(0,0,L,R),g.fillStyle="rgba(56,45,39,0.65)",g.fillRect(0,R*.6,L,R*.4),g.fillStyle="rgba(252,238,198,0.4)",g.fillRect(60,40,130,R-80),g.fillStyle="rgba(69,50,43,0.55)",g.beginPath(),g.arc(L*.7,R*.6,80,0,Math.PI*2),g.fill(),g.strokeStyle="#3f3a31",g.lineWidth=12,g.beginPath(),g.moveTo(L/2,0),g.lineTo(L/2,R),g.stroke()});for(let[g,L]of[[2.75,!0],[-4.55,!1]])b(o,.035,1.2,1.08,T(2436400),-.42,4.46,g,{cast:!1}),he(o,.94,1.04,L?Ie(d):T(3884357),-.44,4.46,g,{ry:-Math.PI/2}),b(o,.12,.07,.3,T(7238e3),-.5,3.82,g,{cast:!0}),L&&Ge(o,16766108,1.6,-.55,4.45,g,.08);b(o,.28,.36,.48,T(10987672),-.58,3.37,2.75,{cast:!0});for(let g=0;g<4;g++)b(o,.02,.02,.4,T(6581094),-.72,3.27+g*.05,2.75,{cast:!1});b(o,.02,.5,.36,T(3820361),-.404,2.12,3.25,{cast:!1}),b(o,.02,.04,.3,T(9407867),-.418,2.3,3.25,{cast:!1}),oe(o,.025,.025,2.8,T(5003864),-.43,1.6,3.55,{segments:6,cast:!1}),Ge(o,16763531,1.4,-.58,2.95,3.1,.055),b(o,.34,.06,.24,T(2173740),-.52,2.95,3.1,{cast:!0}),b(o,.26,.025,.18,ie(16767393),-.52,2.91,3.1,{rx:Math.PI/2}),b(o,.035,1.15,1.05,T(1514789),.4,4.46,-1.55,{cast:!1}),he(o,.83,1,Ie(c),.425,4.46,-1.55,{ry:Math.PI/2}),b(o,.05,.05,1.13,T(7890509),.42,3.94,-1.55,{cast:!0});for(let g=0;g<4;g++)ft(o,[.48,3.95,-2.08+g*.35],[.48,4.36,-2.08+g*.35],.008,T(3950153),{cast:!1});ft(o,[.48,4.3,-2.08],[.48,4.3,-1.03],.01,T(3950153),{cast:!1}),ft(o,[.48,3.98,-2.08],[.48,3.98,-1.03],.008,T(3950153),{cast:!1}),oe(o,.13,.11,.2,T(9205080),.55,3.99,-1.8,{segments:9,cast:!0});for(let g=0;g<5;g++){let L=new Pe(new Dn(.1,4,4),T(g%2?4090706:6458728));L.position.set(.55+g%2*.05,4.13+g%3*.04,-1.8+(g-2)*.035),L.scale.set(1.2,.6,.8),o.add(L)}b(o,.34,.32,.52,T(11186338),.58,3.42,-2.3,{cast:!0});for(let g=0;g<4;g++)b(o,.02,.02,.42,T(6581608),.76,3.32+g*.05,-2.3,{cast:!1});Wt(o,[[.38,3.58,-2.3],[.5,3.3,-2.3],[.52,2.8,-2.25],[.52,2.2,-2.1]],.018,r,{segments:14,radialSegments:4});for(let g=0;g<5;g++)oe(o,.018,.018,.52,T(4739924),.32,6.44,-3+g*1.55,{segments:5,cast:!1});ft(o,[.32,6.68,-3.05],[.32,6.68,3.25],.018,T(4739924),{cast:!1}),ft(o,[.32,6.45,-3.05],[.32,6.45,3.25],.012,T(4739924),{cast:!1}),oe(o,.32,.32,.65,T(8752515),-.05,6.55,.9,{segments:12,cast:!0}),oe(o,.35,.35,.04,T(6121056),-.05,6.89,.9,{segments:12,cast:!1}),Ge(o,16766618,1.45,.58,4.45,-1.55,.11),Ge(o,16766618,.8,.55,3.95,-1.8,.05);let p=_t(2434089,{roughness:.24,metalness:.32,clearcoat:.9,envMapIntensity:.7,transparent:!0,opacity:.76,outline:!1});st(n,1.17,6.45,p,-4.64,.151,-1.45);let y=T(4015175);b(n,.08,3.2,6.4,y,-5.24,1.74,-1.45,{cast:!0});for(let[g,L]of[[-5.17,1.1],[-5.17,-.6],[-4.14,-.25]])oe(n,.035,.035,3,r,g,1.63,L,{segments:7,cast:!0}),oe(n,.052,.052,.08,a,g,.1,L,{segments:8,cast:!1});b(n,.6,.5,.25,T(4934469),-4.75,1.08,.72,{cast:!0}),oe(n,.16,.16,.04,T(6448991),-4.75,1.1,.853,{rx:Math.PI/2,segments:16,cast:!1});for(let g=0;g<5;g++)b(n,.24,.016,.018,T(8619386),-4.75,1+g*.05,.86,{cast:!1});b(n,.88,2.02,.08,T(2899523),-4.6,1.15,-4.5,{cast:!0}),b(n,.66,.96,.025,T(1779245),-4.6,1.16,-4.46,{cast:!1}),b(n,.76,.05,.03,T(9211264),-4.6,2.15,-4.45,{cast:!1}),oe(n,.035,.035,.15,T(10263949),-4.28,1.11,-4.4,{segments:8,cast:!1}),b(n,.2,.06,.2,T(2107950),-4.4,2.35,-4.43,{cast:!0}),b(n,.17,.025,.17,ie(16766624),-4.4,2.315,-4.43,{rx:Math.PI/2}),e.lights.push({type:"point",color:16762503,intensity:5.5,distance:4.2,pos:[-4.35,2.15,-3.95]});let _=T(9198658);b(n,.43,.22,.34,_,-4.82,.25,-2.58,{cast:!0}),b(n,.37,.18,.3,T(7688767),-4.82,.46,-2.58,{cast:!0,rx:.03}),b(n,.38,.18,.3,T(9529931),-4.36,.25,-3.25,{cast:!0,ry:.1});let m=T(3952464);for(let g=0;g<3;g++)oe(n,.24,.28,.45,m,-4.45+g*.14,.38+g*.03,1.05-g*.08,{segments:7,cast:!0,rz:g*.2}),oe(n,.045,.06,.1,T(3029821),-4.45+g*.14,.64+g*.03,1.05-g*.08,{segments:6,cast:!1});oe(n,.018,.018,1.5,T(8086601),-5,.87,-2.2,{segments:5,cast:!1,rz:-.07}),b(n,.3,.04,.12,T(4865836),-5.05,1.63,-2.2,{cast:!1,rz:-.07});let f=new Fe;f.position.set(-4.23,2.38,1.55),n.add(f),oe(f,.17,.13,.18,T(8547412),0,0,0,{segments:9});for(let g=0;g<8;g++){let L=T(g%2?5996632:7443816),R=b(f,.045,.45+g%3*.14,.06,L,0,-.2,0,{rz:-.8+g*.24,ry:g*1.1,cast:!0});R.position.x+=Math.cos(g*1.7)*.12,R.position.z+=Math.sin(g*1.3)*.12}ft(n,[-4.23,2.58,1.55],[-4.23,3,1.55],.012,r,{cast:!1}),b(n,7.9,.84,.12,T(3489090),-1.45,.56,-5.72,{cast:!0,receive:!0});for(let g=0;g<13;g++)b(n,.08,.8,.13,T(4542034),-5.4+g*.63,.55,-5.71,{cast:!1});b(n,7.95,.08,.18,T(7634043),-1.45,1.02,-5.72,{cast:!0});let v=Ht(12);for(let g=0;g<22;g++){let L=-5.1+v()*7.7,R=new Na(.22+v()*.22,0),C=new Pe(R,T(g%3?3102536:3630676));C.position.set(L,1.16+v()*.22,-5.66+(v()-.5)*.18),C.scale.set(1.3,.8,1),C.castShadow=!0,n.add(C)}b(n,.95,2.05,.08,T(3492944),-3.2,1.19,-4.62,{cast:!0}),b(n,.66,.75,.03,T(2504508),-3.2,1.1,-4.57,{cast:!1}),b(n,.1,.07,.04,T(10395277),-3.55,1.15,-4.56,{cast:!1}),b(n,.3,.06,.28,T(2239277),-2.7,2.38,-4.56,{cast:!0}),b(n,.24,.02,.22,ie(12970204),-2.7,2.345,-4.56,{rx:Math.PI/2}),e.lights.push({type:"point",color:10806482,intensity:3.5,distance:3.6,pos:[-2.7,2.1,-4.1]}),Wt(n,[[-4,.2,-4.54],[-4,2.2,-4.54],[-3.96,3,-4.54]],.03,r,{segments:12,radialSegments:5});let S=new Fe;S.position.set(.3,.84,-5.3),n.add(S),b(S,.75,.58,.42,T(12827816),0,0,0,{cast:!0}),oe(S,.2,.2,.015,T(5857630),-.12,.02,.215,{rx:Math.PI/2,segments:14,cast:!1});for(let g=0;g<4;g++)b(S,.35,.018,.015,T(7239024),.02,-.19+g*.11,.222,{cast:!1});b(S,.8,.05,.5,T(5594461),.02,-.33,0,{cast:!1}),Wt(n,[[.65,1.13,-5.3],[.72,1.6,-5.3],[.72,2.05,-5.18],[.6,2.1,-4.7]],.022,r,{segments:16,radialSegments:4}),b(n,.56,.9,.5,T(4812131),1.2,.58,-5.3,{cast:!0}),b(n,.5,.06,.44,T(2637368),1.2,1.05,-5.3,{cast:!1}),he(n,.36,.2,ie(14543311,{map:Se(256,128,(g,L,R)=>{g.fillStyle="#dce7d2",g.fillRect(0,0,L,R),g.fillStyle="#3b6254",g.font='700 36px "Hiragino Sans", sans-serif',g.textAlign="center",g.fillText("資源回収",L/2,72)})}),1.2,.72,-5.04),e.buildRearBicycle?.(n),oe(n,.08,.08,.75,T(11047789),-3.85,.5,-5.05,{rx:.1,segments:8,cast:!0,rz:.6})}function P_(n,e,t,i,s,r,a=4){n.beginPath();for(let o=0;o<a*2;o++){let l=o%2===0?i:s,c=-Math.PI/2+Math.PI*o/a;n.lineTo(e+Math.cos(c)*l,t+Math.sin(c)*l)}n.closePath(),n.fillStyle=r,n.fill()}function I_(n,e){let t=[];cn(n,-2.9,2.36,1.15,.38,7,.155,t),cn(n,1.5,2.52,.8,.3,13,.155,t),cn(n,-4.63,.3,.3,.85,22,.155,t),cn(n,2.62,-1.2,.24,1.2,31,.155,t),cn(n,-1.4,1.9,.42,.22,41,.155,t),cn(n,4.8,5.76,.75,.16,5,.155,t),cn(n,5.76,.65,.12,1.1,27,.155,t),cn(n,1.2,-5.3,.9,.2,11,.155,t),cn(n,.8,4.85,1.25,.36,19,.035,t),cn(n,4.16,3.85,.46,.22,33,.035,t),cn(n,3.7,.98,.7,.2,8,.035,t),cn(n,5.1,1.75,.35,.17,12,.035,t),cn(n,4.78,-3.2,.22,.8,15,.035,t),cn(n,3.55,5.12,.42,.2,24,.035,t);let i=ci(["rgba(255,171,89,0.95)","rgba(255,231,163,0.8)","rgba(83,232,199,0.65)","rgba(255,110,135,0.5)"],5,32),s=ie(16777215,{map:i,transparent:!0,opacity:.7,depthWrite:!1,blending:ot,side:Je}),r=st(n,6.2,2.42,s,-.53,.039,4.15);r.renderOrder=3;let a=ie(16777215,{map:ci(["rgba(255,193,120,0.8)","rgba(255,228,174,0.55)","rgba(112,221,189,0.35)"],9,18),transparent:!0,opacity:.56,depthWrite:!1,blending:ot,side:Je});st(n,5.8,1.02,a,-.45,.159,2.36);let o=st(n,1.25,2.3,ie(16777215,{map:ci(["rgba(91,233,224,0.9)","rgba(255,121,177,0.8)","rgba(255,206,132,0.6)"],13,12),transparent:!0,opacity:.8,depthWrite:!1,blending:ot,side:Je}),-4.35,.041,2.95);o.renderOrder=3;let l=st(n,6.9,2.55,ie(16777215,{map:ci(["rgba(255,168,92,0.76)","rgba(255,228,157,0.5)","rgba(93,229,203,0.42)","rgba(255,111,159,0.3)"],31,34),transparent:!0,opacity:.54,depthWrite:!1,blending:ot,side:Je}),-.45,.046,4.33);l.renderOrder=3,st(n,1.5,2.1,ie(16777215,{map:ci(["rgba(96,241,229,0.92)","rgba(255,130,177,0.8)","rgba(255,236,172,0.6)"],43,15),transparent:!0,opacity:.62,depthWrite:!1,blending:ot,side:Je}),-4.35,.156,3.18),At(n,16742578,3.6,2.1,-4.6,2.8,.16,.157),At(n,16768686,2,1,-3.8,2.2,.14,.157),st(n,.85,3,ie(16777215,{map:ci(["rgba(164,221,255,0.9)","rgba(255,225,162,0.55)","rgba(120,194,197,0.4)"],21,10),transparent:!0,opacity:.56,depthWrite:!1,blending:ot,side:Je}),2.92,.038,4.48);for(let c=0;c<4;c++)At(n,c%2?16766885:10283490,1.8,.9,2.15,3.18+c*.6,.09,.042);return At(n,16760190,5.9,1.4,-.7,3.55,.12,.043),At(n,10478847,1.9,2.6,3.15,3.95,.13,.044),At(n,16748985,1.2,1.8,-4.55,2.95,.12,.048),At(n,16763015,4.6,1.35,.1,2.2,.27,.16),At(n,7528397,1.6,1,2.45,2.55,.17,.16),e.puddles=t,t}function L_(n){let e=Ht(52),t=new Lt,i=240,s=new Float32Array(i*3);for(let o=0;o<i;o++)s[o*3]=(e()-.5)*12,s[o*3+1]=.2+e()*3.6,s[o*3+2]=(e()-.5)*12;t.setAttribute("position",new jt(s,3));let r=new fr({color:9812172,size:.018,transparent:!0,opacity:.28,depthWrite:!1,blending:ot,sizeAttenuation:!0}),a=new Aa(t,r);a.frustumCulled=!1,n.add(a)}function eu(n){let e=new Fe;return e.name="street-and-diorama-base",n.scene.add(e),w_(e,n),R_(e),C_(e,n),I_(e,n),L_(e),{group:e,puddles:n.puddles??[]}}function D_(){return Se(1024,220,(n,e,t)=>{let i=n.createLinearGradient(0,0,e,t);i.addColorStop(0,"#e5fff9"),i.addColorStop(.5,"#f7fffb"),i.addColorStop(1,"#d8fbf2"),n.fillStyle=i,n.fillRect(0,0,e,t),n.fillStyle="#245d5e",n.font=`700 78px ${Ne}`,n.textAlign="left",n.letterSpacing="3px",n.fillText("DRINKS",38,100),n.letterSpacing="0px",n.font=`700 39px ${ae}`,n.fillStyle="#3a7674",n.fillText("つめたい飲みもの",46,160);let s=e-105;n.fillStyle="#77cdbd",n.beginPath(),n.arc(s,104,64,0,Math.PI*2),n.fill(),n.fillStyle="#fff9e8",n.beginPath(),n.arc(s,91,36,0,Math.PI*2),n.fill(),n.fillRect(s-23,85,46,62),n.fillStyle="#83d8c9",n.beginPath(),n.arc(s,92,25,0,Math.PI*2),n.fill(),bt(n,s,92,18,5,"#fffcfa",4)})}function U_(){return Se(900,240,(n,e,t)=>{n.fillStyle="#fff1d1",n.fillRect(0,0,e,t),n.fillStyle="#2f5f54",n.font=`700 74px ${ae}`,n.textAlign="left",n.fillText("お弁当・おにぎり",46,108),n.fillStyle="#bc7950",n.font=`700 27px ${Ne}`,n.letterSpacing="4px",n.fillText("FRESH  EVERY  MORNING",52,168),n.letterSpacing="0px",n.fillStyle="#fdf8e9",n.beginPath(),n.moveTo(e-122,55),n.lineTo(e-44,188),n.lineTo(e-200,188),n.closePath(),n.fill(),n.fillStyle="#263d3a",n.fillRect(e-144,136,44,56),n.fillStyle="#d97451",n.beginPath(),n.arc(e-120,112,8,0,Math.PI*2),n.fill(),n.fillStyle="#6db8a4",n.fillRect(0,t-16,e,16)})}function N_(){return Se(640,400,(n,e,t)=>{n.fillStyle="#1b4446",n.fillRect(0,0,e,t),n.fillStyle="#c9f1df",n.font=`700 29px ${ae}`,n.fillText("ほしぞらマート",28,48),n.fillStyle="rgba(151,227,206,0.18)",n.fillRect(22,70,e-44,2);let i=[["おにぎり 鮭","¥138"],["ホットコーヒー","¥100"],["おでん 盛合せ","¥260"]];for(let s=0;s<3;s++)n.fillStyle=s===2?"#bff4df":"rgba(206,240,225,0.78)",n.font=`500 25px ${ae}`,n.textAlign="left",n.fillText(i[s][0],26,124+s*40),n.textAlign="right",n.font=`600 24px ${Ne}`,n.fillText(i[s][1],e-30,124+s*40);n.fillStyle="#89e1c9",n.fillRect(20,276,e-40,1),n.textAlign="left",n.font=`700 34px ${ae}`,n.fillStyle="#ffedc2",n.fillText("合計",28,332),n.textAlign="right",n.font=`800 54px ${Ne}`,n.fillText("¥498",e-32,338),n.textAlign="center",n.fillStyle="#74d4bd",n.font=`600 17px ${Ne}`,n.fillText("THANK YOU  /  またお越しください",e/2,380)})}function O_(n){let a=T(2181190),o=T(3496534),l=new xn({color:15334648,toneMapped:!1});l.userData.outlineParameters={visible:!1},b(n,3.62+.1,.14,.5,a,-2.07,.28,-4.22,{cast:!0}),b(n,3.62+.1,.14,.55,a,-2.07,2.38,-4.22,{cast:!0}),b(n,.1,2.15,.54,o,-3.88-.02,1.34,-4.22,{cast:!0}),b(n,.1,2.15,.54,o,-.26+.02,1.34,-4.22,{cast:!0}),he(n,3.62-.02,2.03,l,-2.07,1.33,-4.415);let c=[.46,.91,1.36,1.81];for(let C of c)b(n,3.62-.06,.035,.4,T(14606545),-2.07,C,-4.22,{cast:!1}),b(n,3.62-.06,.018,.025,T(7314836),-2.07,C+.02,-3.98+.2,{cast:!1}),b(n,3.62-.08,.018,.28,ie(14086891,{transparent:!0,opacity:.4}),-2.07,C-.01,-4.2,{cast:!1});let h=Ht(37),u=new li(.052,.052,.19,8),d=T(16777215,{outline:!1});Bs(d);let p=[15826019,7391701,15848567,9160587,15704246,8101332,14064480,10212546,15134434,12220576,13131079,7508591,16049339,5814180],y=4*18,_=new Ps(u,d,y);_.castShadow=!1,_.receiveShadow=!1;let m=new ut,f=0;for(let C=0;C<4;C++)for(let A=0;A<18;A++){let x=-3.7199999999999998+A*.19529411764705884,M=c[C]+.12,U=-4.17+(h()-.5)*.025,k=.19+h()*.09;m.makeScale(1,k/.19,1),m.setPosition(x,M+(k-.19)*.5,U),_.setMatrixAt(f,m),_.setColorAt(f,new Xe(p[(C*5+A)%p.length])),f++}_.instanceMatrix.needsUpdate=!0,_.instanceColor&&(_.instanceColor.needsUpdate=!0),n.add(_);let v=new li(.053,.053,.045,8),S=ie(16315359,{transparent:!0,opacity:.72}),g=new Ps(v,S,y);g.castShadow=!1,f=0;for(let C=0;C<4;C++)for(let A=0;A<18;A++){let x=-3.7199999999999998+A*.19529411764705884,M=c[C]+.13;m.makeScale(1,1,1),m.setPosition(x,M+.015,-4.17),g.setMatrixAt(f,m),f++}g.instanceMatrix.needsUpdate=!0,n.add(g);let L=3.62/4;for(let C=0;C<4;C++){let A=-3.88+L*(C+.5);b(n,L-.035,2.03,.03,_t(10410964,{transparent:!0,opacity:.16,roughness:.06,metalness:.1,clearcoat:1,side:Je,depthWrite:!1,outline:!1}),A,1.34,-3.98,{cast:!1}),b(n,.045,2.06,.05,o,A-L/2+.01,1.34,-3.98+.01,{cast:!0}),b(n,.03,.67,.035,T(11910313),A+L/2-.12,1.37,-3.98+.055,{cast:!1}),C<3&&b(n,.035,2.06,.06,o,A+L/2,1.34,-3.98+.02,{cast:!0})}b(n,3.62+.15,.3,.08,a,-2.07,2.55,-3.98-.04,{cast:!0}),he(n,3.62+.02,.28,Ie(D_()),-2.07,2.55,-3.98+.005),Ge(n,12449775,3.9,-2.07,1.5,-4.3,.11),At(n,12711919,3.5,1.3,-2.07,-3.3,.13,.178),b(n,.55,.06,.24,T(4745824),-.26+.24,.92,-3.98+.08,{cast:!1});let R=Se(384,200,(C,A,x)=>{C.fillStyle="#f3ead3",C.fillRect(0,0,A,x),C.fillStyle="#335d59",C.font=`700 44px ${ae}`,C.textAlign="center",C.fillText("冷たいお茶",A/2,76),C.fillStyle="#c46d4d",C.font=`700 31px ${Ne}`,C.fillText("NEW  ¥108",A/2,132)});he(n,.42,.22,Ie(R),-.26+.5,1.14,-4.2,{ry:Math.PI/2,renderOrder:3})}function tu(n,e){let{x:t,z:i,width:s,depth:r,color:a=4418917}=e,o=T(2834235),l=T(a),c=T(8019008),h=T(3033927),u=1.26;b(n,s+.06,.11,r+.06,o,t,.27,i,{cast:!0}),b(n,s,1.1,.055,l,t,.82,i-r/2+.025,{cast:!0}),b(n,.055,1.1,r,h,t-s/2+.025,.82,i,{cast:!0}),b(n,.055,1.1,r,h,t+s/2-.025,.82,i,{cast:!0}),b(n,s-.05,.1,.045,l,t,.22,i+r/2-.025,{cast:!0}),b(n,s,.035,.035,c,t,u-.03,i+r/2-.021,{cast:!0});for(let d of[.32,.62,.92,1.22])b(n,s-.1,.035,r-.06,c,t,d,i,{cast:!1,receive:!0}),b(n,s-.11,.045,.025,l,t,d+.032,i+r/2-.03,{cast:!1}),b(n,s-.1,.018,.028,ie(7250573,{transparent:!0,opacity:.55}),t,d+.033,i+r/2+.005,{cast:!1}),d>.35&&b(n,s-.16,.009,.014,ie(16769197,{transparent:!0,opacity:.8}),t,d-.012,i+r/2+.006,{cast:!1});return b(n,s-.14,.11,r-.1,T(1980469),t,.165,i,{cast:!1}),{x:t,z:i,width:s,depth:r,tiers:[.355,.655,.955,1.25]}}function nu(n,e,t){let i=[15752005,16760645,4367236,4034480,14700419,16770985,5599169,13658929,7319119,15637307,15128756,3116934],s=[],r=[],a=[],o=160;for(let f=0;f<4;f++){let v=e.tiers[f],S=-e.width/2+.16;for(;S<e.width/2-.12;){if(t()>.92){S+=.18;continue}let g=.1+t()*.13,L=.13+t()*.14,R=.07+t()*.08,C=e.x+S+g/2,A=e.z+e.depth*.16+t()*.08;if(s.push([C,v+L/2,A]),r.push([g,L,R]),a.push(new Xe(i[Math.floor(t()*i.length)])),S+=g+.035+t()*.055,s.length>=o)break}if(s.length>=o)break}let l=new an(1,1,1),c=T(16777215,{outline:!1});Bs(c);let h=new Ps(l,c,s.length);h.castShadow=!1,h.receiveShadow=!0;let u=new ut,d=new mn,p=new D,y=new D;for(let f=0;f<s.length;f++)y.set(...s[f]),p.set(...r[f]),d.setFromEuler(new vn(0,(t()-.5)*.06,0)),u.compose(y,d,p),h.setMatrixAt(f,u),h.setColorAt(f,a[f]);h.instanceMatrix.needsUpdate=!0,h.instanceColor&&(h.instanceColor.needsUpdate=!0),n.add(h);for(let f=0;f<2;f++){let S=Ie(Pc(f?"#68a88e":"#df7653"));for(let g=0;g<2;g++)he(n,.15,.075,S,e.x-e.width*.3+g*e.width*.55,e.tiers[2]+.09,e.z+e.depth/2+.045,{renderOrder:3})}let _=Se(256,320,(f,v,S)=>{f.fillStyle="#f5df91",f.fillRect(0,0,v,S),f.fillStyle="#be4d36",f.font=`700 44px ${ae}`,f.textAlign="center",f.fillText("新発売",v/2,80),f.fillStyle="#294c44",f.font=`800 68px ${Ne}`,f.fillText("NEW",v/2,168),f.fillStyle="#d4774f",f.beginPath(),f.arc(v/2,248,38,0,Math.PI*2),f.fill(),bt(f,v/2,248,21,6,"#fff2cc",4)}),m=Ie(_,{side:Je,transparent:!0});for(let f=0;f<4;f++){let v=e.x-e.width*.36+f*e.width*.23;he(n,.115,.145,m,v,e.tiers[1]+.22,e.z+e.depth/2+.06,{renderOrder:4})}return h}function iu(n,e,t,i,s,r){b(n,s,.24,.04,T(3100233),e,t,i,{cast:!0}),he(n,s-.025,.205,Ie(Wf(r)),e,t,i+.026),b(n,s,.02,.05,ie(15851445),e,t+.125,i+.005,{cast:!1})}function F_(n,e){let t=tu(n,{x:-2.08,z:-.34,width:1.9,depth:.68}),i=tu(n,{x:-2.08,z:-1.57,width:1.9,depth:.68,color:4877147});nu(n,t,e),nu(n,i,e),iu(n,-2.08,1.48,.03,1.45,"snack"),iu(n,-2.08,1.48,-1.2,1.35,"daily");for(let l of[-2.72,-1.44])oe(n,.012,.012,.23,T(5137502),l,1.34,.03,{segments:5,cast:!1});let s=[14184529,14923102,6792847,6586267,14650528];for(let l=0;l<7;l++)b(n,.19+l%3*.04,.2+l%2*.08,.15,T(s[l%s.length]),-2.8+l*.23,1.38,.04,{cast:!0,ry:(l%3-1)*.07}),b(n,.1,.065,.012,ie(16314582,{transparent:!0,opacity:.85}),-2.8+l*.23,1.36,.12,{cast:!1});for(let l=0;l<5;l++)oe(n,.075,.075,.2,T(l%2?14251612:15321474),-1.75+l*.19,1.38,-1.2,{segments:9,cast:!0});let r=Ie(Pc("#e17251"));for(let l of[-2.88,-1.23])he(n,.14,.07,r,l,1.1,.345,{renderOrder:3});let a=new Fe;a.position.set(-1.13,.17,.34),a.rotation.y=-.24,n.add(a),b(a,.52,.36,.4,T(12950107),0,.18,0,{cast:!0}),b(a,.48,.31,.02,T(14399355),0,.2,.21,{cast:!1});for(let l=0;l<6;l++)oe(a,.06,.055,.16,T(15983807),-.18+l%3*.16,.36+Math.floor(l/3)*.02,-.05+l%2*.1,{segments:8,cast:!0}),oe(a,.061,.061,.035,T(l%2?12737859:14722142),-.18+l%3*.16,.44,-.05+l%2*.1,{segments:8,cast:!1});let o=Se(512,256,(l,c,h)=>{l.fillStyle="#f0d9a7",l.fillRect(0,0,c,h),l.fillStyle="#b2563d",l.font=`700 52px ${ae}`,l.textAlign="center",l.fillText("カップ麺",c/2,95),l.fillStyle="#3d5950",l.font=`700 27px ${Ne}`,l.fillText("HOT & READY  /  ¥198",c/2,152),bt(l,c/2,199,22,6,"#dd9860",4)});he(a,.47,.23,Ie(o),0,.21,.218,{renderOrder:3})}function B_(n){let e=new Fe;e.position.set(-3.27,.17,1.1),n.add(e);let t=T(3955284),i=T(9268046);b(e,1.55,.08,.46,t,0,.32,0,{cast:!0}),b(e,1.55,.07,.4,i,0,.87,.03,{cast:!0}),b(e,1.55,.05,.32,i,0,.57,.001,{cast:!0}),b(e,1.55,.05,.26,i,0,.36,-.03,{cast:!0}),b(e,.06,.62,.45,t,-.78,.6,0,{cast:!0}),b(e,.06,.62,.45,t,.78,.6,0,{cast:!0});for(let r=0;r<3;r++){let a=.39+r*.24;for(let o=0;o<4;o++){let l=-.57+o*.38;he(e,.285,.37,Ie(Yf((r*4+o)%6)),l,a+.18,.05+r*.035,{rx:-.28,renderOrder:3}),b(e,.29,.02,.03,T(15261640),l,a+.015,.08+r*.035,{cast:!1})}}b(e,1.44,.03,.06,ie(15920860,{transparent:!0,opacity:.65}),0,.905,.22,{cast:!1});for(let r=0;r<3;r++)b(e,.43,.015,.27,T(14012861),.33,.915+r*.018,.02-r*.01,{cast:!1,ry:.04*r});let s=Se(768,128,(r,a,o)=>{r.fillStyle="#e9dfc6",r.fillRect(0,0,a,o),r.fillStyle="#385952",r.font=`700 48px ${ae}`,r.textAlign="center",r.fillText("雑誌 ・ コミック ・ 新聞",a/2,83),r.fillStyle="#d47b54",r.fillRect(20,0,5,o)});b(e,1.56,.17,.055,T(2968392),0,1.06,.04,{cast:!0}),he(e,1.51,.14,Ie(s),0,1.06,.071),Ge(e,16766884,.9,0,1.16,.1,.06)}function z_(n){let e=new Fe;e.position.set(-3.15,.17,.18),n.add(e);let t=T(14541783),i=T(4159345);bn(e,.98,.7,.62,.04,t,0,.35,0,{segments:2,cast:!0}),b(e,.99,.11,.64,i,0,.14,0,{cast:!0}),b(e,.96,.03,.57,T(1387569),0,.74,0,{cast:!1});for(let o of[-.17,.17])b(e,.48,.015,.52,_t(11264480,{transparent:!0,opacity:.32,roughness:.03,metalness:.1,clearcoat:1,depthWrite:!1,outline:!1}),o,.79,0,{cast:!1}),b(e,.44,.02,.05,T(12240313),o,.8,.2,{cast:!1});let s=Ht(51),r=[16048048,14449807,7514562,6986365,15775070];for(let o=0;o<8;o++)b(e,.18,.12,.16,T(r[o%r.length]),-.34+o%4*.22,.81+Math.floor(o/4)*.08,-.11+o%2*.2,{cast:!1,ry:s()*.4});let a=Se(512,300,(o,l,c)=>{o.fillStyle="#f2f0e2",o.fillRect(0,0,l,c),o.fillStyle="#497f78",o.font=`700 68px ${Ne}`,o.textAlign="center",o.fillText("ICE CREAM",l/2,112),o.fillStyle="#d5845a",o.font=`700 39px ${ae}`,o.fillText("つめたくて、しあわせ。",l/2,175),o.strokeStyle="#7bb2a6",o.lineWidth=4;for(let h=0;h<6;h++){let u=h/6*Math.PI*2;o.beginPath(),o.moveTo(l/2+Math.cos(u)*24,242+Math.sin(u)*24),o.lineTo(l/2+Math.cos(u)*42,242+Math.sin(u)*42),o.stroke()}o.fillStyle="#4f8078",o.font=`700 21px ${ae}`,o.fillText("雨の夜も ひんやり",l/2,286)});he(e,.72,.42,Ie(a),0,.45,.313),Ge(e,12511463,.95,0,.84,.1,.08)}function k_(n,e,t,i,s,r=0){let a=new Fe;a.position.set(e,t,i),a.rotation.y=r,n.add(a);let o=new Wn;o.moveTo(0,.12),o.quadraticCurveTo(.065,.04,.11,-.075),o.quadraticCurveTo(0,-.115,-.11,-.075),o.quadraticCurveTo(-.065,.04,0,.12);let l=new Ua(o,{depth:.065,bevelEnabled:!0,bevelSegments:2,steps:1,bevelSize:.008,bevelThickness:.006}),c=new Pe(l,T(16776691));return c.castShadow=!0,a.add(c),he(a,.1,.105,T(2372659,{side:Je}),0,-.042,.039),b(a,.035,.032,.012,T(s),0,.02,.038,{cast:!1}).rotation.z=.2,a}function H_(n){let e=new Fe;e.position.set(-3.5,.17,-2.15),n.add(e);let t=T(3695966),i=T(15655624),s=T(10135199);b(e,.52,.62,1.5,i,0,.34,0,{cast:!0}),b(e,.54,.09,1.53,t,0,.72,0,{cast:!0}),b(e,.46,.02,1.42,T(12244169),0,.76,0,{cast:!1}),b(e,.4,.025,1.35,ie(14679282,{transparent:!0,opacity:.42}),.02,.63,0,{cast:!1}),b(e,.025,.78,1.43,_t(11133149,{transparent:!0,opacity:.2,roughness:.04,metalness:.05,clearcoat:1,depthWrite:!1,outline:!1}),.29,1.16,0,{cast:!1}),b(e,.035,.05,1.45,s,.29,1.56,0,{cast:!0}),b(e,.035,.05,1.45,s,.29,.75,0,{cast:!0});let r=[12016965,6725496,14201180,8163158,14386786],a=Ht(61);for(let c=0;c<5;c++){let h=-.57+c*.27,u=new Fe;u.position.set(.03,.79,h),e.add(u),b(u,.18,.055,.23,T(2568236),0,.03,0,{cast:!0,ry:(a()-.5)*.06}),b(u,.16,.02,.21,T(16776174),0,.064,0,{cast:!1}),b(u,.08,.02,.095,T(r[c%r.length]),-.025,.076,-.03,{cast:!1}),b(u,.055,.025,.06,T(15976043),.04,.078,.03,{cast:!1}),b(u,.045,.02,.045,T(5406293),.04,.075,-.045,{cast:!1})}let o=[14186840,8498548,14069599,13065071];for(let c=0;c<4;c++)k_(e,.02,.93,-.49+c*.28,o[c],Math.PI/2+(a()-.5)*.18);[["おにぎり","¥138"],["のり弁","¥398"],["から揚げ","¥348"]].forEach((c,h)=>{let u=Se(256,128,(d,p,y)=>{d.fillStyle="#f8f0d7",d.fillRect(0,0,p,y),d.fillStyle="#39615a",d.font=`700 30px ${ae}`,d.textAlign="center",d.fillText(c[0],p/2,46),d.fillStyle="#d36f50",d.font=`700 38px ${Ne}`,d.fillText(c[1],p/2,95)});he(e,.18,.09,Ie(u),.293,1.3-h*.13,-.44+h*.28,{ry:Math.PI/2,renderOrder:4})}),b(e,.06,.48,1.53,T(3232588),.24,1.92,0,{cast:!0}),he(e,1.48,.42,Ie(U_()),.274,1.92,0,{ry:Math.PI/2,renderOrder:5}),Ge(e,16769717,1.15,.34,1.75,.1,.08),At(n,16770227,.85,1.65,-2.98,-2.1,.12,.179)}function Uc(n,e,t,i,s,r,a,o,l){let c=new Fe;c.position.copy(t),n.add(c);let h=[];for(let u=0;u<i;u++){let d=new Gn({map:zs(),color:o,transparent:!0,opacity:l,depthWrite:!1,blending:ot,toneMapped:!1}),p=new oi(d);p.scale.set(.06,.14,1),c.add(p),h.push({sprite:p,phase:u/i,drift:(u%2?1:-1)*.08})}e.updaters.push({update(u){for(let d of h){let p=(u*a+d.phase)%1;d.sprite.position.set(d.drift*Math.sin(p*4+d.phase*9)+p*.12,p*s,Math.cos(p*5+d.phase)*r*.3),d.sprite.material.opacity=Math.max(0,(1-p)*l*Math.min(1,p*7));let y=.05+p*r*2.2;d.sprite.scale.set(y,y*1.8,1)}}})}function V_(n,e){let t=new Fe;t.position.set(.3,.17,-2.56),n.add(t);let i=T(11041101),s=T(8345144),r=T(3103317),a=T(14931903),o=T(10267042);b(t,2.2,.84,.68,i,0,.45,0,{cast:!0}),b(t,2.24,.075,.72,a,0,.9,0,{cast:!0}),b(t,2.25,.035,.03,r,0,.86,.36,{cast:!1}),b(t,2.08,.06,.02,r,0,.24,.345,{cast:!1}),b(t,2.14,.05,.64,T(6244663),0,.05,0,{cast:!1});for(let f of[-.72,0,.72])b(t,.025,.67,.025,s,f,.5,.345,{cast:!1});b(t,.36,.2,.26,T(2571837),-.04,1.04,-.07,{cast:!0}),b(t,.35,.035,.24,T(5464926),-.04,1.15,-.07,{cast:!0});let l=new Pe(new Qt(.3,.2),ie(16777215,{map:N_()}));l.position.set(-.04,1.47,-.01),l.rotation.x=-.28,t.add(l),b(t,.05,.28,.05,T(3689031),-.04,1.29,-.06,{cast:!1}),b(t,.23,.035,.17,T(4477774),-.04,1.24,.13,{cast:!0}),b(t,.16,.05,.12,T(2702395),.43,.96,.18,{cast:!0}),b(t,.03,.01,.1,ie(16741480),.43,.99,.18,{cast:!1}),b(t,.16,.12,.03,T(2374200),.8,1.08,.22,{cast:!0});let c=Se(384,256,(f,v,S)=>{f.fillStyle="#204341",f.fillRect(0,0,v,S),f.fillStyle="#83e4c8",f.font=`700 30px ${ae}`,f.textAlign="center",f.fillText("いらっしゃいませ",v/2,50),f.fillStyle="#f6eacd",f.font=`800 65px ${Ne}`,f.fillText("¥498",v/2,130),f.fillStyle="#7dcfba",f.font=`600 20px ${ae}`,f.fillText("ポイント 12P",v/2,180),f.fillStyle="#dec590",f.font=`600 17px ${Ne}`,f.fillText("THANK YOU",v/2,218)}),h=new Pe(new Qt(.14,.1),ie(16777215,{map:c}));h.position.set(.8,1.08,.238),t.add(h),b(t,1.12,.5,.015,_t(11592155,{transparent:!0,opacity:.18,roughness:.05,metalness:.04,clearcoat:1,depthWrite:!1,outline:!1}),.43,1.28,.25,{cast:!1}),b(t,.015,.52,.02,o,-.13,1.28,.25,{cast:!1}),b(t,.015,.52,.02,o,.99,1.28,.25,{cast:!1});let u=new Fe;u.position.set(-.73,.94,-.02),t.add(u),b(u,.58,.46,.48,T(3496789),0,.23,0,{cast:!0}),b(u,.52,.02,.42,ie(16763516),0,.37,0,{cast:!1}),b(u,.54,.02,.44,ie(16768416),0,.18,0,{cast:!1});let d=[15049544,14123846,15908451];for(let f=0;f<7;f++)b(u,.1,.07,.08,T(d[f%3]),-.19+f%4*.12,.39+Math.floor(f/4)*.02,-.08+f%2*.13,{cast:!1,ry:f*.4});b(u,.54,.27,.4,_t(12445919,{transparent:!0,opacity:.22,roughness:.02,metalness:.05,clearcoat:1,depthWrite:!1,outline:!1}),0,.46,0,{cast:!1});let p=Se(512,180,(f,v,S)=>{f.fillStyle="#f7e4b6",f.fillRect(0,0,v,S),f.fillStyle="#a85039",f.font=`700 46px ${Ne}`,f.textAlign="center",f.fillText("HOT SNACK",v/2,74),f.fillStyle="#496a5e",f.font=`700 25px ${ae}`,f.fillText("揚げたて ・ からあげ",v/2,120),f.fillStyle="#e4a45a",f.fillRect(60,144,v-120,3)});he(u,.4,.14,Ie(p),0,.33,.244,{renderOrder:4}),Ge(u,16761981,.65,0,.54,.1,.16);let y=new Fe;y.position.set(.88,.94,-.02),t.add(y),bn(y,.64,.16,.46,.025,T(9079932),0,.09,0,{segments:2,cast:!0}),b(y,.58,.045,.4,T(12683087),0,.155,0,{cast:!1});for(let f=1;f<3;f++)b(y,.012,.12,.39,T(8813927),-.31+f*.205,.09,0,{cast:!1});b(y,.58,.012,.012,T(8813927),0,.09,-.12,{cast:!1}),oe(y,.075,.075,.05,T(14140044),-.18,.18,.02,{segments:10,cast:!1}),oe(y,.065,.07,.065,T(15916461),.02,.19,-.07,{segments:9,cast:!1}),oe(y,.075,.075,.04,T(9333835),.16,.18,.04,{segments:8,cast:!1}),oe(y,.05,.05,.16,T(13673070),-.12,.2,-.1,{segments:8,cast:!1,rz:.1}),oe(y,.06,.06,.06,T(15325613),.13,.19,-.1,{segments:8,cast:!1}),b(y,.35,.09,.3,_t(12114643,{transparent:!0,opacity:.22,roughness:.03,metalness:.04,clearcoat:1,depthWrite:!1,outline:!1}),0,.25,0,{cast:!1});let _=Se(512,160,(f,v,S)=>{f.fillStyle="#f5e9c9",f.fillRect(0,0,v,S),f.fillStyle="#a9583e",f.font=`700 47px ${ae}`,f.textAlign="center",f.fillText("おでん",v/2,67),f.fillStyle="#59726a",f.font=`700 22px ${ae}`,f.fillText("だいこん・たまご・こんにゃく",v/2,108),f.fillStyle="#d18d4f",f.font=`700 20px ${Ne}`,f.fillText("WARM & READY",v/2,137)});he(y,.37,.12,Ie(_),0,.52,.22,{renderOrder:3}),b(y,.02,.22,.02,o,-.28,.39,.18,{cast:!1}),b(y,.02,.22,.02,o,.28,.39,.18,{cast:!1}),Uc(n,e,new D(.3+.88,1.37,-2.56),8,.8,.16,.19,16773850,.13),Uc(n,e,new D(.3-.73,1.4,-2.56),5,.55,.2,.13,16773072,.08),b(t,.3,.18,.22,T(13090214),.3,1,-.3,{cast:!1}),b(t,.1,.009,.16,ie(15919826),.3,1.096,-.3,{cast:!1}),oe(t,.07,.07,.2,T(15328469),.64,1.05,-.4,{segments:9,cast:!1});let m=T(12085077);for(let f=0;f<4;f++)b(n,.38,.15,.3,m,1.94,.26+f*.145,1.48,{cast:!0,ry:.08}),b(n,.32,.03,.24,T(8208952),1.94,.33+f*.145,1.48,{cast:!1});At(n,16767902,2.5,1.4,.7,-1.9,.1,.181)}function G_(n,e){let t=new Fe;t.position.set(1.58,.17,-4.1),n.add(t);let i=T(10317894),s=T(3234645),r=T(2505531),a=T(10135196);b(t,.92,.84,.6,i,0,.43,0,{cast:!0}),b(t,.96,.06,.64,T(14800314),0,.87,0,{cast:!0}),b(t,.88,.035,.03,s,0,.83,.32,{cast:!1}),bn(t,.42,.62,.38,.035,r,.04,1.21,.04,{segments:2,cast:!0}),b(t,.34,.25,.025,ie(2573130),.04,1.33,.24,{cast:!1}),b(t,.29,.2,.018,ie(10284768),.04,1.34,.255,{cast:!1}),b(t,.21,.014,.012,ie(16251887),.04,1.36,.266,{cast:!1}),b(t,.16,.012,.012,ie(16251887),.04,1.32,.266,{cast:!1}),b(t,.07,.14,.025,a,.04,1.13,.24,{cast:!1}),b(t,.09,.04,.09,r,.04,1.11,.24,{cast:!0}),b(t,.23,.02,.17,T(5594969),.04,1.04,.22,{cast:!1}),oe(t,.047,.04,.08,T(16050904),.04,1,.26,{segments:8,cast:!1}),oe(t,.047,.04,.08,T(16050904),.04,1.075,.26,{segments:8,cast:!1}),Ge(t,8253660,.45,.04,1.35,.3,.09);for(let l=0;l<4;l++)oe(t,.04,.036,.07,T(15525333),.3,1.02+l*.07,.12,{segments:8,cast:!1});b(t,.14,.13,.14,ie(6708300,{transparent:!0,opacity:.7}),-.26,1,.2,{cast:!1}),oe(t,.03,.03,.05,T(3161144),-.26,1.09,.2,{segments:8,cast:!1}),b(t,1.06,.5,.05,T(2903369),.04,1.84,-.2,{cast:!0}),he(t,1.01,.45,Ie(Gf()),.04,1.84,-.17),Ge(t,16768171,.8,.04,1.82,-.15,.07),b(t,.94,.04,.16,T(9399369),0,1.58,.1,{cast:!0});let o=[15063489,7770021,12150864,13808746,8363146,13017779];for(let l=0;l<8;l++)b(t,.075,.12,.08,T(o[l%o.length]),-.35+l*.1,1.66,.08,{cast:!1});Uc(n,e,new D(1.62,1.67,-3.72),5,.7,.12,.18,16773852,.075),st(n,.9,.6,T(4152660),1.55,.181,-3.35)}function su(n,e){O_(n),H_(n),B_(n),F_(n,Ht(31)),z_(n),V_(n,e),G_(n,e)}function ru(n,e){let t=T(4939100),i=T(14206888),s=T(3358528),r=[],a=[[-2.35,2.72,-.45,1.55],[-2.25,2.72,-2.2,1.55],[.35,2.72,-2.75,1.2],[.55,2.72,-.55,1.1]];for(let[o,l,c,h]of a){b(n,h,.075,.22,i,o,l,c,{cast:!1});let u=new Pe(new an(h-.09,.015,.17),ie(16771779));u.position.set(o,l-.045,c),n.add(u),r.push(u.material),Ge(n,16767393,h*1.15,o,l-.12,c,.09);for(let d of[-h*.36,h*.36])oe(n,.006,.006,1.25,s,o+d,l+.65,c,{segments:4,cast:!1})}for(let o of[-3.55,-1.7,.1])b(n,5.8,.06,.06,t,-.95,3.88,o,{cast:!1});for(let o of[-3.5,-1.5,.6,1.9])b(n,.06,.06,5.95,t,o,3.92,-1.35,{cast:!1});e.lights.push({type:"point",color:16766106,intensity:26,distance:8.2,pos:[-1.9,2.46,-1.15]}),e.lights.push({type:"point",color:16760188,intensity:20,distance:7.2,pos:[.9,2.38,-2.65]}),e.lights.push({type:"point",color:16766362,intensity:11,distance:4.8,pos:[1.1,2.15,.75]}),e.lights.push({type:"point",color:16761727,intensity:22,distance:6.8,pos:[1.25,2.25,2.35]}),e.lights.push({type:"point",color:16769981,intensity:7,distance:3.8,pos:[1.55,1.95,-3.95]}),e.updaters.push({update(o){let l=.985+Math.sin(o*.36)*.012+Math.sin(o*2.1)*.004;for(let c of r)c.color.setRGB(1*l,.916*l,.76*l)}})}function W_(){return Se(512,512,(n,e,t)=>{n.fillStyle="#f6edda",n.beginPath(),n.arc(e/2,t/2,238,0,Math.PI*2),n.fill(),n.strokeStyle="#2d5150",n.lineWidth=15,n.stroke(),n.fillStyle="#345756";for(let i=0;i<12;i++){let s=i/12*Math.PI*2-Math.PI/2;n.save(),n.translate(e/2+Math.cos(s)*196,t/2+Math.sin(s)*196),n.rotate(s+Math.PI/2),n.fillRect(-5,-15,10,30),n.restore()}n.font=`700 29px ${Ne}`,n.fillStyle="#57706c",n.textAlign="center",n.fillText("HOSHIZORA",e/2,172),n.save(),n.translate(e/2,t/2),n.rotate((1+47/60)/12*Math.PI*2),n.fillStyle="#294642",n.fillRect(-8,-106,16,120),n.restore(),n.save(),n.translate(e/2,t/2),n.rotate(47/60*Math.PI*2),n.fillStyle="#2d4b48",n.fillRect(-5,-188,10,202),n.fillStyle="#ce7957",n.fillRect(-2,-196,4,210),n.restore(),n.fillStyle="#d9855e",n.beginPath(),n.arc(e/2,t/2,13,0,Math.PI*2),n.fill(),n.fillStyle="rgba(45,75,73,0.28)",n.font=`600 16px ${Ne}`,n.fillText("2:17 AM",e/2,382)})}function X_(n){let e={coffee:{bg:"#f2e6cc",fg:"#2d5150",accent:"#cf7b52",big:"COFFEE",jp:"あったか〜い",price:"¥100"},oden:{bg:"#2e5653",fg:"#fff3dc",accent:"#e7a464",big:"ODEN",jp:"おでん",price:"はじめました"},fresh:{bg:"#f6e4d0",fg:"#3d4d46",accent:"#6fb7a3",big:"FRESH",jp:"おにぎり",price:"毎日炊きたて"}},t=e[n]??e.coffee;return Se(320,900,(i,s,r)=>{i.fillStyle=t.bg,i.fillRect(0,0,s,r),i.fillStyle=t.accent,i.fillRect(0,0,s,22),i.fillRect(0,r-22,s,22),i.textAlign="center",i.textBaseline="middle",i.fillStyle=t.fg,i.font=`800 56px ${Ne}`,i.fillText(t.big,s/2,120),i.strokeStyle=t.accent,i.lineWidth=3,i.beginPath(),i.moveTo(46,165),i.lineTo(s-46,165),i.stroke(),i.font=`700 40px ${ae}`,i.fillText(t.jp,s/2,238),i.font=`800 64px ${ae}`,i.fillStyle=t.accent,i.fillText(t.price,s/2,360),i.strokeStyle=t.fg,i.lineWidth=5,i.fillStyle="rgba(255,255,255,0.55)",i.beginPath(),i.roundRect(80,430,160,134,12),i.fill(),i.stroke(),i.fillStyle=t.accent,i.fillRect(80,478,160,38),i.fillStyle=t.fg,i.font=`700 18px ${ae}`,i.fillText("ほしぞらマート",s/2,520),i.beginPath(),i.arc(249,464,28,-1.3,1.3),i.stroke(),i.fillStyle=t.fg,i.font=`600 20px ${ae}`,i.fillText("星見町二丁目店",s/2,660),bt(i,s/2,760,37,10,t.accent,4),i.fillStyle="rgba(255,255,255,0.15)";for(let a=0;a<5;a++)i.fillRect(48,815+a*8,s-96,2)})}function Y_(){return Se(512,768,(n,e,t)=>{n.fillStyle="#2e5c5a",n.fillRect(0,0,e,t),n.strokeStyle="rgba(255,248,227,0.32)",n.lineWidth=5,n.strokeRect(30,30,e-60,t-60),n.fillStyle="#1d3d3e",n.fillRect(66,72,e-132,252),n.fillStyle="rgba(164,223,208,0.26)",n.fillRect(78,84,e-156,228),n.fillStyle="#fff4da",n.font=`700 36px ${Ne}`,n.textAlign="center",n.fillText("STAFF ONLY",e/2,408),n.fillStyle="#b8dfd1",n.font=`700 23px ${ae}`,n.fillText("関係者以外立入禁止",e/2,452),n.strokeStyle="#7db4a5",n.lineWidth=3,n.beginPath(),n.moveTo(102,492),n.lineTo(e-102,492),n.stroke(),n.fillStyle="rgba(255,246,222,0.68)",n.font=`700 19px ${ae}`,n.fillText("HOSHIZORA MART  /  BACK ROOM",e/2,535),n.fillStyle="#b9a676",n.fillRect(e-94,380,24,96)})}function q_(n,e){b(n,1.02,2.25,.08,T(2377796),.42,1.27,e+.045,{cast:!0}),he(n,.9,2.12,Ie(Y_()),.42,1.28,e+.09),b(n,1.12,.06,.12,T(12168593),.42,2.37,e+.06,{cast:!0}),b(n,.08,2.22,.12,T(12168593),-.11,1.29,e+.06,{cast:!0}),b(n,.08,2.22,.12,T(12168593),.95,1.29,e+.06,{cast:!0}),b(n,.045,.12,.04,ie(16115650),.82,1.16,e+.14,{cast:!1});let t=Se(512,128,(l,c,h)=>{l.fillStyle="#204b45",l.fillRect(0,0,c,h),l.strokeStyle="#83d6bf",l.lineWidth=4,l.strokeRect(8,8,c-16,h-16),l.fillStyle="#f1f1df",l.font=`700 35px ${Ne}`,l.textAlign="center",l.fillText("STAFF ONLY",c/2,54),l.fillStyle="#9cdcc8",l.font=`700 23px ${ae}`,l.fillText("関係者以外立入禁止",c/2,92)});b(n,.78,.19,.06,T(1584685),.42,2.58,e+.09,{cast:!0}),he(n,.72,.16,Ie(t),.42,2.58,e+.125),Ge(n,9430993,.65,.42,2.5,e+.16,.08);let i=new Pe(new gn(.27,36),ie(16777215,{map:W_()}));i.position.set(-2.62,3.48,e+.09),n.add(i);let s=new Pe(new Un(.28,.02,5,32),T(3562328));s.position.copy(i.position),n.add(s),b(n,5.9,1.35,.045,T(1523521),-.02,3.36,e+.018,{cast:!1}),b(n,5.9,.028,.055,T(13147237),-.02,2.7,e+.026,{cast:!1}),b(n,5.9,.025,.055,T(7248775),-.02,4.02,e+.026,{cast:!1});let r=Se(1400,220,(l,c,h)=>{l.clearRect(0,0,c,h),l.fillStyle="rgba(255,242,213,0.9)",l.font=`700 64px ${ae}`,l.textAlign="center",l.fillText("今日も、おつかれさま。",c/2,92),l.fillStyle="rgba(154,218,198,0.85)",l.font=`600 22px ${Ne}`,l.letterSpacing="6px",l.fillText("A  LITTLE  LIGHT  FOR  THE  RAINY  NIGHT",c/2,139),l.letterSpacing="0px",l.fillStyle="rgba(232,174,112,0.55)",l.fillRect(c/2-180,166,360,2),bt(l,c-120,84,28,8,"#e8bb7b",4)});he(n,3,.46,ie(16777215,{map:r,transparent:!0,depthWrite:!1}),-.98,3.5,e+.055);let a=Se(760,280,(l,c,h)=>{let u=l.createLinearGradient(0,0,c,h);u.addColorStop(0,"#203d3e"),u.addColorStop(1,"#102d32"),l.fillStyle=u,l.fillRect(0,0,c,h),l.strokeStyle="#d4ac72",l.lineWidth=5,l.strokeRect(12,12,c-24,h-24),l.fillStyle="#f5e7c7",l.font=`700 40px ${ae}`,l.textAlign="left",l.fillText("ホットスナック",36,82),l.fillStyle="#eeb679",l.font=`700 27px ${Ne}`,l.fillText("FRIED CHICKEN  /  CROQUETTE",38,125),l.fillStyle="#9edac4",l.font=`700 34px ${ae}`,l.fillText("できたて  ¥198〜",38,192),l.strokeStyle="rgba(200,151,99,0.7)",l.lineWidth=2,l.beginPath(),l.moveTo(38,215),l.lineTo(c-38,215),l.stroke(),bt(l,c-91,130,34,9,"#dba66e",4),l.fillStyle="rgba(255,242,210,0.52)",l.font=`600 17px ${ae}`,l.fillText("22:00 まで 揚げたてをお届けします",38,246)});b(n,1.92,.73,.055,T(1454386),1,3,e+.06,{cast:!0}),he(n,1.82,.65,Ie(a),1,3,e+.098),Ge(n,16766881,1.4,1,3,e+.15,.04);let o=Se(1120,220,(l,c,h)=>{l.fillStyle="#f4e5c5",l.fillRect(0,0,c,h),l.fillStyle="#2d5a50",l.font=`700 56px ${ae}`,l.textAlign="left",l.fillText("できたて ホットスナック",38,86),l.fillStyle="#bf6549",l.font=`700 35px ${ae}`,l.fillText("からあげ  ¥198  /  コロッケ  ¥128  /  フランク  ¥158",40,144),l.fillStyle="#547f74",l.font=`600 20px ${Ne}`,l.letterSpacing="3px",l.fillText("FRESHLY FRIED  /  HOSHIZORA MART",42,184),l.letterSpacing="0px",l.fillStyle="#e4a260",l.fillRect(0,h-15,c,15),bt(l,c-78,82,28,8,"#db9354",4)});b(n,2.75,.58,.045,T(2310718),-2.22,3.05,e+.055,{cast:!0}),he(n,2.67,.51,Ie(o),-2.22,3.05,e+.082),Ge(n,16766880,1.4,-2.22,3.05,e+.12,.03);for(let l=0;l<14;l++)b(n,.28,.12,.025,T(l%3===0?15052400:l%3===1?6793363:14118744),-3.25+l*.34,2.78,e+.028,{cast:!1})}function $_(n,e){let t=[],i=[{x:-2.05,z:-.52,y:2.38,text:"お菓子・スナック",sub:"SNACKS & SWEETS"},{x:-2,z:-1.78,y:2.38,text:"日用品・雑貨",sub:"DAILY GOODS"},{x:.56,z:-2.9,y:2.22,text:"レジ",sub:"CHECKOUT"}];for(let r=0;r<i.length;r++){let a=i[r],o=new Fe;o.position.set(a.x,a.y+.52,a.z),n.add(o);let l=Se(960,260,(c,h,u)=>{c.fillStyle=r===2?"#2e5c55":"#f3ead4",c.fillRect(0,0,h,u),c.strokeStyle=r===2?"#8ce0c8":"#557f72",c.lineWidth=6,c.strokeRect(8,8,h-16,u-16),c.fillStyle=r===2?"#f5ecd7":"#315b51",c.font=`700 68px ${ae}`,c.textAlign="center",c.fillText(a.text,h/2,107),c.fillStyle=r===2?"#9ce7d2":"#8b7058",c.font=`700 27px ${Ne}`,c.letterSpacing="3px",c.fillText(a.sub,h/2,165),c.letterSpacing="0px",bt(c,h/2,213,15,4,r===2?"#f0c37d":"#d8895b",4)});b(o,1.14,.33,.04,T(2903369),0,-.29,0,{cast:!1}),he(o,1.08,.28,Ie(l),0,-.29,.021),he(o,1.08,.28,Ie(l),0,-.29,-.021,{ry:Math.PI}),oe(o,.007,.007,.55,T(3819076),-.47,.02,0,{segments:4,cast:!1}),oe(o,.007,.007,.55,T(3819076),.47,.02,0,{segments:4,cast:!1}),t.push({pivot:o,phase:r*1.7})}e.updaters.push({update(r){for(let a of t)a.pivot.rotation.y=Math.sin(r*.55+a.phase)*.018,a.pivot.rotation.z=Math.sin(r*.7+a.phase)*.012}});let s=[];for(let r=0;r<2;r++){let a=r===0?-3.16:1.88,o=1.47,l=new Fe;l.position.set(a,2.62,o),n.add(l),oe(l,.006,.006,.23,T(4082247),0,.03,0,{segments:4,cast:!1});let c=X_(r===0?"coffee":"fresh");he(l,.31,.78,Ie(c),0,-.38,.002,{renderOrder:3}),he(l,.31,.78,Ie(c),0,-.38,-.002,{ry:Math.PI,renderOrder:3}),oe(l,.008,.008,.32,T(6180155),0,-.79,0,{rz:Math.PI/2,cast:!1}),s.push({pivot:l,phase:r*2.2})}e.updaters.push({update(r){for(let a of s)a.pivot.rotation.z=Math.sin(r*1.1+a.phase)*.03,a.pivot.rotation.y=Math.sin(r*.7+a.phase)*.02}})}function Z_(n,e,t,i){$_(n,e),he(n,.44,.61,Ie(Ci("oden")),-.05,3.26,i+.09),he(n,.46,.64,Ie(Ci("bento")),1.04,3.28,i+.12),he(n,.44,.61,Ie(Ci("milk")),-2.65,2.94,i+.07),oe(n,.16,.13,.5,T(6716016),1.62,t+.25,-3.2,{segments:10,cast:!0}),oe(n,.17,.17,.04,T(4017479),1.62,t+.52,-3.2,{segments:10,cast:!0}),b(n,.3,.02,.3,ie(10475465,{transparent:!0,opacity:.4}),1.62,t+.54,-3.2,{cast:!1}),oe(n,.17,.17,.03,T(3954516),1.86,3.22,i+.07,{rx:Math.PI/2,segments:18,cast:!1}),oe(n,.14,.14,.01,ie(15919830),1.86,3.22,i+.085,{rx:Math.PI/2,segments:18,cast:!1});let s=ie(9422509,{transparent:!0,opacity:.55});st(n,.12,2.4,s,1.42,t+.007,.28),st(n,.08,2.4,ie(15050088,{transparent:!0,opacity:.4}),1.25,t+.008,.28),st(n,2,.06,ie(8374706,{transparent:!0,opacity:.28}),-2.05,t+.007,.4),st(n,.07,1.3,ie(13869930,{transparent:!0,opacity:.3}),-.82,t+.007,-1.36);let r=Se(512,512,(_,m,f)=>{_.clearRect(0,0,m,f),_.fillStyle="rgba(245,239,218,0.72)",_.beginPath(),_.moveTo(m/2,42),_.lineTo(m-74,205),_.lineTo(m/2+44,190),_.lineTo(m/2+44,460),_.lineTo(m/2-44,460),_.lineTo(m/2-44,190),_.lineTo(74,205),_.closePath(),_.fill()});st(n,.42,.42,ie(16777215,{map:r,transparent:!0,depthWrite:!1,opacity:.75}),1.42,t+.009,.86),st(n,.4,.4,ie(16777215,{map:r,transparent:!0,depthWrite:!1,opacity:.62}),1.42,t+.009,-1.53,{rotation:Math.PI}),b(n,.65,1.65,.34,T(6912624),1.76,t+.825,-3.55,{cast:!0});for(let _=0;_<2;_++)b(n,.54,.04,.02,T(4478543),1.76,t+.56+_*.55,-3.37,{cast:!1});b(n,.03,.09,.02,T(2440762),1.85,t+.9,-3.37,{cast:!1}),b(n,.56,.12,.02,T(4152660),1.76,t+1.76,-3.37,{cast:!1}),b(n,.32,.38,.04,T(4681060),1.72,t+.88,-3.36,{cast:!1,rz:-.05});let a=new Fe;a.position.set(-.98,t,-2.14),n.add(a),oe(a,.09,.075,.17,T(7824976),0,.085,0,{segments:8,cast:!0});for(let _=0;_<5;_++){let m=new Pe(new Dn(.09,5,4),T(_%2?5208158:6983790));m.scale.set(1,1.4,.5),m.position.set((_-2)*.04,.23+_%3*.05,(_%2-.5)*.08),m.rotation.z=(_-2)*.35,m.castShadow=!0,a.add(m)}st(n,.8,.28,ie(16777215,{map:Pi("welcome"),transparent:!0,depthWrite:!1,opacity:.2}),1.22,t+.009,1.23);let o=Se(1200,720,(_,m,f)=>{let v=_.createLinearGradient(0,0,0,f);v.addColorStop(0,"#eedfc1"),v.addColorStop(1,"#d9c39d"),_.fillStyle=v,_.fillRect(0,0,m,f),_.fillStyle="#1e4b49",_.beginPath(),_.moveTo(0,f*.72),_.quadraticCurveTo(m*.26,f*.4,m*.52,f*.7),_.quadraticCurveTo(m*.76,f*.93,m,f*.62),_.lineTo(m,f),_.lineTo(0,f),_.closePath(),_.fill(),_.fillStyle="#6db7a1",_.beginPath(),_.moveTo(0,f*.83),_.quadraticCurveTo(m*.3,f*.58,m*.58,f*.84),_.quadraticCurveTo(m*.8,f*1.02,m,f*.76),_.lineTo(m,f),_.lineTo(0,f),_.closePath(),_.fill(),_.fillStyle="#df8358",_.beginPath(),_.arc(m*.17,f*.25,82,0,Math.PI*2),_.fill(),_.fillStyle="#f1e5c7",_.beginPath(),_.arc(m*.17,f*.25,59,0,Math.PI*2),_.fill(),_.fillStyle="#32534e",_.font=`700 72px ${ae}`,_.textAlign="left",_.fillText("雨の日も、",280,170),_.fillText("いつもの場所で。",280,260),_.fillStyle="#a36f4e",_.font=`600 25px ${Ne}`,_.letterSpacing="5px",_.fillText("HOSHIZORA MART  /  星見町",286,318),_.letterSpacing="0px";for(let S=0;S<4;S++)_.fillStyle="rgba(255,244,220,0.62)",_.fillRect(282,366+S*16,380-S*35,3);bt(_,1020,112,44,12,"#e6b56e",4);for(let S=0;S<3;S++){let g=860+S*85;_.strokeStyle="rgba(255,244,219,0.48)",_.lineWidth=6,_.beginPath(),_.arc(g,470,62,Math.PI,Math.PI*2),_.stroke(),_.beginPath(),_.moveTo(g,470),_.lineTo(g,610),_.stroke(),_.strokeStyle="rgba(255,244,219,0.32)",_.beginPath(),_.arc(g-30,610,30,0,Math.PI*.5),_.stroke()}});b(n,.055,1.2,3.25,T(2706504),-3.9,3.22,-.5,{cast:!1}),he(n,3.14,1.12,Ie(o),-3.865,3.22,-.5,{ry:Math.PI/2,renderOrder:2}),b(n,.075,.035,3.3,T(9137739),-3.9,3.83,-.5,{cast:!1}),Ge(n,16766882,2,-3.77,3.18,-.5,.035),b(n,.05,.035,2.65,ie(16766363,{transparent:!0,opacity:.8}),-3.88,2.58,-.3,{cast:!1}),Ge(n,16762755,2.7,-3.8,2.55,-.3,.07);let l=new Fe;n.add(l);let c=[];for(let _=0;_<=24;_++){let m=_/24;c.push([-3.55+m*5.3,3.54+Math.sin(Math.PI*m)*.18,-2.75])}Wt(l,c,.006,T(6181185),{segments:30,radialSegments:4,cast:!1});let h=[14249552,15782282,7057563,16050122,5734290,14126239],u=new Ls((()=>{let _=new Wn;return _.moveTo(-.075,0),_.lineTo(.075,0),_.lineTo(0,-.16),_.closePath(),_})()),d=h.map(_=>ie(_,{side:Je})),p=[];for(let _=0;_<15;_++){let m=(_+.5)/15,f=-3.55+m*5.3,v=3.54+Math.sin(Math.PI*m)*.18-.025,S=new Fe;S.position.set(f,v,-2.745),n.add(S);let g=new Pe(u,d[_%d.length]);g.position.y=0,S.add(g);let L=new Pe(new an(.002,.04,.002),T(7101771));L.position.y=.012,S.add(L),p.push({pivot:S,phase:_*.8})}for(let _=0;_<8;_++){let m=(_+.4)/8,f=-3.55+m*5.3,v=3.54+Math.sin(Math.PI*m)*.18-.02;Ge(l,16766879,.16,f,v,-2.74,.08)}e.updaters.push({update(_){for(let m of p)m.pivot.rotation.z=Math.sin(_*1.35+m.phase)*.055,m.pivot.rotation.x=Math.cos(_*.9+m.phase*.7)*.025}});let y=Se(512,300,(_,m,f)=>{_.fillStyle="#f2ead4",_.fillRect(0,0,m,f),_.strokeStyle="#88b5a5",_.lineWidth=4,_.strokeRect(14,14,m-28,f-28),_.fillStyle="#3e675e",_.font=`700 45px ${ae}`,_.textAlign="center",_.fillText("今月の おすすめ",m/2,84),_.fillStyle="#ce7653",_.font=`700 30px ${ae}`,_.fillText("星のクリームパン",m/2,145),_.fillStyle="#53685e",_.font=`700 22px ${ae}`,_.fillText("ほかほか、焼きたて。",m/2,195);for(let v=0;v<3;v++)_.fillStyle="rgba(104,137,122,0.35)",_.fillRect(84,228+v*15,m-168,3);bt(_,m-72,72,22,6,"#dca865",4)});b(n,.43,.27,.035,T(8152912),-3.72,1.33,1.55,{cast:!0,ry:.12}),he(n,.39,.23,Ie(y),-3.72,1.33,1.574,{ry:.12,renderOrder:3}),oe(n,.09,.08,.035,T(11903615),.9,t+.04,1.25,{segments:12,cast:!1})}function au(n,e,t,i){su(n,e),q_(n,i),Z_(n,e,t,i),st(n,1.2,.4,T(5203546),1.225,t+.005,1.5),b(n,1.02,.02,.55,T(4281417),1.225,t+.012,1.52,{cast:!1})}var Nc=V.floorY+.008,Oc=-4.46;function J_(n,e){let t=T(wi.storeWall),i=T(wi.storeTrim),s=T(wi.storeTrimDeep),r=T(wi.mint),a=T(wi.orange),o=V.right-V.left,l=V.front-V.back,c=(V.left+V.right)/2,h=(V.back+V.front)/2;b(n,o,.035,l,s,c,.155,h,{cast:!1,receive:!0}),b(n,o-.22,.025,l-.25,T(12103063),c,.15,h,{cast:!1,receive:!0});let u=_t(11573888,{map:jf(),roughness:.3,metalness:.04,clearcoat:.7,clearcoatRoughness:.16,envMapIntensity:.55,outline:!1});st(n,o-.25,l-.28,u,c,Nc,h),b(n,o,4.72,.16,t,c,2.5,V.back+.08,{cast:!0,receive:!0}),b(n,.16,4.72,l,t,V.left+.08,2.5,h,{cast:!0,receive:!0}),b(n,.16,4.72,1.62,t,V.right-.08,2.5,V.back+.81,{cast:!0,receive:!0}),b(n,o-.2,.5,.045,T(3630432),c,.44,Oc+.022,{cast:!1}),b(n,o-.2,.035,.06,T(10256983),c,.72,Oc+.04,{cast:!1}),b(n,o,.25,.2,i,c,.28,V.front-.03,{cast:!0}),b(n,o,.14,.25,s,c,2.97,V.front-.03,{cast:!0}),b(n,o,.045,.22,r,1.18,2.942,V.front+.007,{cast:!1}),b(n,.2,.25,l-.2,i,V.right-.03,.28,h,{cast:!0}),b(n,.22,.14,l-.2,s,V.right-.03,2.97,h,{cast:!0});let d=[-4.01,-2.35,-.05,.54,1.91,2.06];for(let P of d)b(n,.075,3.47,.1,i,P,2.045,V.front+.005,{cast:!0});let p=[-2.88,-1.35,.2,1.75];for(let P of p)b(n,.1,3.47,.075,i,V.right-.005,2.045,P,{cast:!0});b(n,.1,3.47,.09,i,V.right-.005,2.045,-2.9,{cast:!0}),b(n,o,.075,.09,i,c,3.76,V.front+.01,{cast:!0}),b(n,.09,.075,l-.2,i,V.right-.005,3.76,h,{cast:!0});let y=_t(11066584,{transparent:!0,opacity:.105,roughness:.08,metalness:.08,clearcoat:1,clearcoatRoughness:.03,envMapIntensity:1.25,side:Je,depthWrite:!1,outline:!1}),_=he(n,4.49,3.45,y,-1.735,2.03,V.front+.012);_.renderOrder=5;let m=he(n,.14,3.45,y,1.985,2.03,V.front+.012);m.renderOrder=5;let f=he(n,1.36,.84,y,1.225,3.37,V.front+.012);f.renderOrder=5;let v=he(n,4.6,3.45,y,V.right+.012,2.03,-.57,{ry:Math.PI/2});v.renderOrder=5;let S=Se(512,512,(P,Z,pe)=>{P.clearRect(0,0,Z,pe),P.globalAlpha=.18,P.fillStyle="#d8f8f4",P.beginPath(),P.moveTo(70,512),P.lineTo(114,512),P.lineTo(330,0),P.lineTo(286,0),P.closePath(),P.fill(),P.globalAlpha=.1,P.beginPath(),P.moveTo(350,512),P.lineTo(368,512),P.lineTo(474,0),P.lineTo(456,0),P.closePath(),P.fill(),P.globalAlpha=.08,P.fillStyle="#ffd8a2",P.fillRect(0,160,Z,35)});he(n,4.47,3.4,ie(16777215,{map:S,transparent:!0,opacity:.42,depthWrite:!1}),-1.735,2.03,V.front+.035,{renderOrder:6}),he(n,4.58,3.4,ie(16777215,{map:S,transparent:!0,opacity:.28,depthWrite:!1}),V.right+.035,2.03,-.57,{ry:Math.PI/2,renderOrder:6}),he(n,.49,.245,Ie(Pi("open")),-3.53,2.5,V.front+.055,{renderOrder:7}),he(n,.82,.41,Ie(Pi("payment"),{transparent:!0}),-.8,.54,V.front+.055,{renderOrder:7}),he(n,.7,.35,Ie(Pi("auto"),{transparent:!0}),V.right+.055,.57,.4,{ry:Math.PI/2,renderOrder:7}),he(n,.48,.67,Ie(Ci("milk")),-2.38,1.18,V.front+.058,{renderOrder:7}),he(n,.45,.63,Ie(Ci("onigiri")),.12,1.19,V.front+.058,{renderOrder:7}),he(n,.44,.62,Ie(Ci("coffee")),V.right+.058,1.33,.64,{ry:Math.PI/2,renderOrder:7});let g=Se(320,180,(P,Z,pe)=>{P.fillStyle="#173c3c",P.fillRect(0,0,Z,pe),P.strokeStyle="#ffd28b",P.lineWidth=4,P.strokeRect(8,8,Z-16,pe-16),P.fillStyle="#ffd89a",P.font=`800 74px ${Ne}`,P.textAlign="center",P.fillText("OPEN",Z/2,106),P.fillStyle="#8ee1cd",P.font=`600 25px ${ae}`,P.fillText("24時間 営業中",Z/2,149)});he(n,.46,.26,Ie(g),2.076,2.54,.62,{ry:Math.PI/2,renderOrder:8}),Ge(n,16763267,.8,2.12,2.53,.62,.12),b(n,o+.16,.08,.16,t,c,3.83,V.front+.05,{cast:!0}),b(n,o+.16,.08,.16,t,c,3.83,V.back-.05,{cast:!0}),b(n,.16,.08,l+.16,t,V.left-.05,3.83,h,{cast:!0}),b(n,.16,.08,l+.16,t,V.right+.05,3.83,h,{cast:!0}),b(n,o+.2,1.04,.18,i,c,4.4,V.front+.1,{cast:!0}),b(n,o+.2,1.04,.18,i,c,4.4,V.back-.1,{cast:!0}),b(n,.18,1.04,l,i,V.left-.1,4.4,h,{cast:!0}),b(n,.18,1.04,l,i,V.right+.1,4.4,h,{cast:!0}),b(n,o+.22,.08,.2,t,c,4.94,V.front+.07,{cast:!0}),b(n,o+.22,.08,.2,t,c,4.94,V.back-.07,{cast:!0}),b(n,.2,.08,l+.22,t,V.left-.07,4.94,h,{cast:!0}),b(n,.2,.08,l+.22,t,V.right+.07,4.94,h,{cast:!0}),b(n,o+.25,.12,.22,s,c,5.01,V.front+.08,{cast:!0}),b(n,o+.25,.12,.22,s,c,5.01,V.back-.08,{cast:!0}),b(n,.22,.12,l+.25,s,V.left-.08,5.01,h,{cast:!0}),b(n,.22,.12,l+.25,s,V.right+.08,5.01,h,{cast:!0});for(let P=-3.7;P<2.1;P+=.54)b(n,.018,.85,.03,T(2052178),P,4.4,V.front+.048,{cast:!1});b(n,5.74,1.08,.18,T(730155),-1.08,4.41,V.front+.13,{cast:!0}),b(n,5.86,.045,.22,r,-1.08,4.955,V.front+.14,{cast:!1}),b(n,5.86,.035,.22,a,-1.08,3.87,V.front+.14,{cast:!1});let L=Cc("front"),R=Ie(L);he(n,5.6,1.12,R,-1.08,4.41,V.front+.226,{renderOrder:8}),he(n,5.6,1.12,ie(16777215,{map:L,transparent:!0,opacity:.2,blending:ot,depthWrite:!1}),-1.08,4.41,V.front+.232,{renderOrder:9}),b(n,.18,1.03,4.44,T(730155),V.right+.13,4.4,-1.13,{cast:!0});let C=Cc("side"),A=Ie(C);he(n,4.3,1.05,A,V.right+.228,4.4,-1.13,{ry:Math.PI/2,renderOrder:8}),he(n,4.3,1.05,ie(16777215,{map:C,transparent:!0,opacity:.17,blending:ot,depthWrite:!1}),V.right+.234,4.4,-1.13,{ry:Math.PI/2,renderOrder:9}),b(n,.22,.04,4.44,r,V.right+.14,4.955,-1.13,{cast:!1}),b(n,.22,.035,4.44,a,V.right+.14,3.87,-1.13,{cast:!1});let x=Ge(n,16767136,5.2,-.7,4.35,2.55,.1),M=Ge(n,10286301,4,3.08,4.35,-1.1,.07),U=_t(9881282,{transparent:!0,opacity:.085,roughness:.16,metalness:.02,clearcoat:.5,clearcoatRoughness:.1,envMapIntensity:.45,side:Je,depthWrite:!1,outline:!1}),k=he(n,o+.18,.67,U,c,3.005,V.front+.39);k.rotation.x=-Math.PI/2,k.renderOrder=5,b(n,o+.3,.13,.11,s,c,2.98,V.front+.73,{cast:!0,receive:!0}),b(n,o+.28,.035,.12,t,c,3.05,V.front+.72,{cast:!1});for(let P=-3.72;P<2.05;P+=.6)b(n,.035,.035,.62,T(4415837),P,2.985,V.front+.38,{cast:!1});b(n,o+.12,.035,.035,T(4415837),c,2.985,V.front+.08,{cast:!1});let z=he(n,4.38,.58,U,V.right+.3,3.005,-.68,{ry:Math.PI/2});z.renderOrder=5,b(n,.11,.13,4.45,s,V.right+.59,2.98,-.68,{cast:!0,receive:!0}),b(n,.12,.035,4.47,t,V.right+.58,3.05,-.68,{cast:!1});for(let P=-2.65;P<1.4;P+=.62)b(n,.56,.035,.035,T(4415837),V.right+.3,2.985,P,{cast:!1});b(n,.035,.035,4.36,T(4415837),V.right+.08,2.985,-.68,{cast:!1});for(let P=-3.45;P<1.9;P+=1.1)b(n,.045,.014,.5,T(10260343),P,2.94,V.front+.4,{cast:!1});for(let P=-2.3;P<1.3;P+=1.1)b(n,.46,.014,.045,T(10260343),V.right+.3,2.94,P,{cast:!1});let G=[];for(let P of[-3.35,-1.55,.2,1.55]){oe(n,.07,.08,.035,T(2571584),P,2.878,V.front+.43,{segments:12,cast:!1});let Z=new Pe(new gn(.055,14),ie(16770224));Z.rotation.x=Math.PI/2,Z.position.set(P,2.858,V.front+.43),n.add(Z),G.push(Z),Ge(n,16768940,.64,P,2.83,V.front+.43,.11)}for(let P of[-1.8,.1]){oe(n,.065,.075,.035,T(2571584),V.right+.24,2.878,P,{segments:12,cast:!1});let Z=new Pe(new gn(.05,14),ie(16770224));Z.rotation.x=Math.PI/2,Z.position.set(V.right+.24,2.858,P),n.add(Z),G.push(Z),Ge(n,16768940,.58,V.right+.24,2.83,P,.1)}let Q=_t(11460067,{transparent:!0,opacity:.018,roughness:.25,metalness:0,clearcoat:.7,clearcoatRoughness:.08,side:Je,depthWrite:!1,outline:!1}),Y=he(n,o-.45,l-.45,Q,c,4.98,h-.02);Y.name="store-skylight",Y.rotation.x=-Math.PI/2,Y.renderOrder=4;let se=T(3231053);for(let P of[-1.85,.5])b(n,.025,.045,l-.5,se,P,5.02,h-.01,{cast:!1});for(let P of[-2.45,.15])b(n,o-.45,.045,.025,se,c,5.02,P,{cast:!1});b(n,o-.2,.12,.07,se,c,5.06,V.back+.13,{cast:!1}),b(n,o+.1,.14,.12,se,c,5.02,V.front+.005,{cast:!1}),b(n,.12,.14,l-.1,se,V.left+.06,5.02,h,{cast:!1}),b(n,.12,.14,l-.1,se,V.right-.06,5.02,h,{cast:!1}),b(n,.65,.44,.5,T(12040102),1.45,5.2,-3.55,{cast:!0}),oe(n,.19,.19,.035,T(5200728),1.27,5.21,-3.29,{rx:Math.PI/2,segments:12,cast:!1});for(let P=0;P<4;P++)b(n,.42,.018,.012,T(6845035),1.38,5.08+P*.055,-3.285,{cast:!1});oe(n,.06,.08,1.05,T(7766136),-.25,5.35,-3.2,{segments:8,cast:!0}),oe(n,.13,.06,.15,T(6121056),-.25,5.86,-3.2,{segments:9,cast:!0}),b(n,.45,.3,.34,T(11119517),-3,5.18,-3.7,{cast:!0}),he(n,o,4.72,T(7305589),c,2.5,V.back-.012,{ry:Math.PI}),he(n,l,4.72,T(6384745),V.left-.012,2.5,h,{ry:-Math.PI/2}),b(n,o,.22,.08,T(4149071),c,.14,V.back-.06,{cast:!0}),b(n,.08,.22,l,T(4149071),V.left-.06,.14,h,{cast:!0}),b(n,1.25,.75,.04,T(2505534),0,3.25,V.back-.03,{cast:!1});for(let P=0;P<8;P++)b(n,1.12,.018,.02,T(5137250),0,3+P*.07,V.back-.058,{cast:!1});b(n,2.3,.55,.08,T(3427147),2.55,3.3,-2.94,{ry:Math.PI/2,cast:!0});let q=Se(1100,760,(P,Z,pe)=>{let ye=P.createLinearGradient(0,0,Z,pe);ye.addColorStop(0,"#194347"),ye.addColorStop(1,"#102f34"),P.fillStyle=ye,P.fillRect(0,0,Z,pe),P.strokeStyle="#d5b27b",P.lineWidth=11,P.strokeRect(26,26,Z-52,pe-52),P.fillStyle="#dd7d57",P.beginPath(),P.arc(Z*.22,pe*.34,105,0,Math.PI*2),P.fill(),P.fillStyle="#f1d8a9",P.beginPath(),P.arc(Z*.22,pe*.34,77,0,Math.PI*2),P.fill(),P.strokeStyle="rgba(146,213,193,0.28)",P.lineWidth=3;for(let nt=0;nt<28;nt++)P.beginPath(),P.moveTo(Z*.44+nt*21,62),P.lineTo(Z*.52+nt*21,pe-100),P.stroke();P.fillStyle="#f0dfbb",P.font=`700 72px ${ae}`,P.textAlign="left",P.fillText("星見町で、",420,220),P.fillText("ひとやすみ。",420,305),P.fillStyle="#90d7c4",P.font=`700 27px ${Ne}`,P.letterSpacing="5px",P.fillText("HOSHIZORA MART  /  SINCE 1998",426,360),P.letterSpacing="0px",P.fillStyle="#5ba899",P.beginPath(),P.moveTo(0,pe*.76),P.quadraticCurveTo(Z*.22,pe*.55,Z*.48,pe*.76),P.quadraticCurveTo(Z*.72,pe*.96,Z,pe*.68),P.lineTo(Z,pe),P.lineTo(0,pe),P.closePath(),P.fill(),P.fillStyle="#e3b073",P.beginPath(),P.moveTo(0,pe*.84),P.quadraticCurveTo(Z*.26,pe*.68,Z*.53,pe*.87),P.quadraticCurveTo(Z*.8,pe*1.02,Z,pe*.8),P.lineTo(Z,pe),P.lineTo(0,pe),P.closePath(),P.fill(),bt(P,Z-120,120,48,13,"#e8bb7a",4),P.fillStyle="rgba(255,246,221,0.65)",P.font=`600 18px ${ae}`,P.fillText("営業時間 24時間  /  駐車場あり",426,418)});b(n,.02,2.28,3.38,T(1059888),V.left-.012,2.66,-1.4,{cast:!1}),he(n,3.3,2.2,Ie(q),V.left-.026,2.66,-1.4,{ry:-Math.PI/2,renderOrder:2}),b(n,.03,.035,3.4,T(10060126),V.left-.035,3.77,-1.4,{cast:!1}),oe(n,.042,.042,3.2,T(5069913),V.left-.07,1.72,-3.7,{segments:7,cast:!0}),b(n,.13,.5,.43,T(7042931),V.left-.1,1.55,.55,{cast:!0}),b(n,.17,.065,.6,T(2833726),V.left-.075,1.84,.55,{cast:!0}),Ge(n,9165255,1.7,V.left-.15,2.2,-.9,.028),e.lights.push({type:"point",color:15908223,intensity:4,distance:3.6,pos:[V.left-.6,2.65,-3.8]});let ge=Se(900,620,(P,Z,pe)=>{P.fillStyle="#3f4d4a",P.fillRect(0,0,Z,pe);for(let ye=0;ye<pe;ye+=32)P.fillStyle=ye%64===0?"#50605a":"#43534f",P.fillRect(0,ye,Z,22),P.fillStyle="rgba(220,232,211,0.12)",P.fillRect(0,ye+2,Z,2);P.strokeStyle="rgba(22,32,30,0.7)",P.lineWidth=5;for(let ye=0;ye<Z;ye+=52)P.beginPath(),P.moveTo(ye,0),P.lineTo(ye,pe),P.stroke();P.fillStyle="rgba(152,99,65,0.2)";for(let ye=0;ye<40;ye++)P.fillRect(90+Math.random()*(Z-180),Math.random()*pe,8+Math.random()*32,3+Math.random()*70);P.fillStyle="rgba(244,231,207,0.75)",P.textAlign="center",P.font=`700 38px ${ae}`,P.fillText("納品口  /  DELIVERY",Z/2,72),P.strokeStyle="rgba(244,231,207,0.4)",P.lineWidth=3,P.strokeRect(250,34,Z-500,58)});b(n,1.45,2.22,.06,T(2505531),.5,1.29,V.back-.043,{cast:!0}),he(n,1.3,2.06,Ie(ge),.5,1.27,V.back-.076,{ry:Math.PI,renderOrder:2}),b(n,1.62,.075,.2,T(6056034),.5,2.43,V.back-.11,{cast:!0}),b(n,.08,2.28,.18,T(10325360),-.34,1.3,V.back-.08,{cast:!0}),b(n,.08,2.28,.18,T(10325360),1.34,1.3,V.back-.08,{cast:!0});let Me=Se(640,140,(P,Z,pe)=>{P.fillStyle="#193b39",P.fillRect(0,0,Z,pe),P.fillStyle="#f4e2c1",P.font=`700 47px ${ae}`,P.textAlign="center",P.fillText("納品口 ・ DELIVERY",Z/2,64),P.fillStyle="#82d8c2",P.font=`600 18px ${Ne}`,P.fillText("STAFF & DELIVERIES ONLY",Z/2,102)});b(n,.83,.2,.06,T(1322029),1.85,2.61,V.back-.06,{cast:!0}),he(n,.78,.17,Ie(Me),1.85,2.61,V.back-.095,{ry:Math.PI,renderOrder:3}),b(n,.26,.09,.25,T(2108462),1.72,2.2,V.back-.15,{cast:!0}),b(n,.2,.028,.19,ie(16766619),1.72,2.16,V.back-.15,{rx:Math.PI/2}),Ge(n,16764557,1.3,1.72,2.12,V.back-.2,.1),e.lights.push({type:"point",color:16760186,intensity:4.8,distance:3.7,pos:[1.55,2,V.back-.4]}),oe(n,.06,.075,1.35,T(5069913),-1.2,3.6,V.back-.09,{segments:7,cast:!0}),b(n,.34,.26,.13,T(5464670),-1.2,4.3,V.back-.1,{cast:!0}),b(n,.87,.56,.04,T(3031616),2.1,3.46,V.back-.035,{cast:!1});for(let P=0;P<5;P++)b(n,.76,.018,.02,T(5137504),2.1,3.26+P*.07,V.back-.06,{cast:!1});b(n,.06,2.03,.94,T(2376514),V.right+.03,1.18,-3.75,{cast:!0}),b(n,.028,1.83,.78,T(3431254),V.right+.07,1.17,-3.75,{cast:!1}),b(n,.03,.03,.13,ie(11591630,{transparent:!0,opacity:.8}),V.right+.09,1.2,-3.38,{cast:!1});let Ce=Se(560,720,(P,Z,pe)=>{P.fillStyle="#e9dfc8",P.fillRect(0,0,Z,pe),P.strokeStyle="#54736a",P.lineWidth=8,P.strokeRect(18,18,Z-36,pe-36),P.fillStyle="#335a52",P.font=`700 54px ${ae}`,P.textAlign="center",P.fillText("資源ごみ",Z/2,100),P.fillText("分別のお願い",Z/2,165),P.fillStyle="#d38256",P.font=`700 26px ${ae}`,P.fillText("ペットボトル ・ かん ・ びん",Z/2,225);for(let ye=0;ye<4;ye++)P.fillStyle=["#4d8875","#ce7953","#7898a2","#c3aa64"][ye],P.beginPath(),P.arc(120+ye*105,320,34,0,Math.PI*2),P.fill(),P.fillStyle="#4a6158",P.font=`600 18px ${ae}`,P.fillText(["ペット","かん","びん","紙"][ye],120+ye*105,382);P.fillStyle="#3f6259",P.font=`600 19px ${ae}`,P.fillText("星見町二丁目 クリーンキャンペーン",Z/2,470),P.strokeStyle="#9a805b",P.lineWidth=2,P.beginPath(),P.moveTo(80,505),P.lineTo(Z-80,505),P.stroke(),P.fillStyle="rgba(68,86,78,0.65)";for(let ye=0;ye<5;ye++)P.fillRect(100,535+ye*18,Z-200-ye*12,3);bt(P,Z-80,pe-72,24,6,"#d49a5c",4)});b(n,.04,1.12,.88,T(2308922),V.right+.025,2.43,-3.7,{cast:!0}),he(n,.8,1.04,Ie(Ce),V.right+.052,2.43,-3.7,{ry:Math.PI/2,renderOrder:3});let We=new Fe;We.position.set(2.18,2.82,1.42),n.add(We),oe(We,.09,.11,.12,T(3226942),0,0,0,{rz:Math.PI/2,segments:10,cast:!0}),b(We,.1,.1,.2,T(2503219),-.1,0,.05,{cast:!0}),oe(We,.06,.06,.05,ie(859168),-.11,0,.17,{rx:Math.PI/2,segments:10,cast:!1}),oe(We,.013,.013,.025,ie(16737369),-.07,.065,.15,{segments:6,cast:!1});let ct=Ge(We,16739422,.15,-.07,.07,.16,.18),K=Se(512,160,(P,Z,pe)=>{P.fillStyle="#e9dfc9",P.fillRect(0,0,Z,pe),P.strokeStyle="#526c68",P.lineWidth=5,P.strokeRect(10,10,Z-20,pe-20),P.fillStyle="#394f4c",P.font=`700 44px ${ae}`,P.textAlign="center",P.fillText("星見町二丁目 24-7",Z/2,72),P.font=`600 22px ${Ne}`,P.fillText("HOSHIZORA MART  /  EST. 1998",Z/2,116)});he(n,.9,.28,Ie(K),1,.23,V.front+.075);let fe=Ge(n,16760710,6.4,-1,4.4,2.35,.055),Ue=Ge(n,9236951,4.9,3,4.4,-1.1,.045);return{signMats:[R,A],flicker:{matFront:R,matSide:A,glows:[x,M,fe,Ue],canopyLights:G,camRed:ct},glass:{frontLeft:_,frontRight:m,sideGlass:v,glassMat:y}}}function K_(n,e){let t=T(1784640),i=T(10135457),s=_t(12576738,{transparent:!0,opacity:.16,roughness:.05,metalness:.1,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:1,side:Je,depthWrite:!1,outline:!1});b(n,1.48,.09,.16,t,1.225,2.93,V.front+.12,{cast:!0}),b(n,.52,.05,.1,T(1713707),1.225,2.85,V.front+.14,{cast:!1});let r=b(n,.025,.016,.012,ie(7467706),1.225,2.852,V.front+.198,{cast:!1});b(n,1.46,.035,.16,T(5201757),1.225,.305,V.front+.14,{cast:!1});let a=new Fe,o=new Fe;n.add(a,o);let l=.64,c=2.55,h=.33+c/2,u=Pi("auto"),d=Pi("welcome");function p(_,m){b(_,.035,c,.06,t,-l/2,h,0,{cast:!0}),b(_,.035,c,.06,t,l/2,h,0,{cast:!0}),b(_,.035,c,.06,t,0,h,0,{cast:!0}),b(_,l,.055,.06,t,0,2.88,0,{cast:!0}),b(_,l,.08,.06,t,0,.35,0,{cast:!0});let f=he(_,l-.07,c-.1,s,0,h,.012);f.renderOrder=6,oe(_,.014,.014,.62,i,m*(l/2-.09),1.45,.06,{segments:6,cast:!1}),ft(_,[m*(l/2-.12),1.68,.035],[m*(l/2-.02),1.68,.09],.012,i,{cast:!1}),ft(_,[m*(l/2-.12),1.22,.035],[m*(l/2-.02),1.22,.09],.012,i,{cast:!1});let v=m<0?u:d;he(_,m<0?.3:.42,m<0?.15:.21,Ie(v,{transparent:!0,opacity:.74}),0,m<0?1.65:1.5,.05,{renderOrder:8}),Ge(_,9365458,.2,m*(l/2-.02),1.55,.08,.07)}p(a,-1),p(o,1),a.position.set(.885,0,V.front+.055),o.position.set(1.565,0,V.front+.055),b(n,1.42,.012,.1,ie(9361094,{transparent:!0,opacity:.65}),1.225,.31,V.front+.24,{cast:!1});let y={open:0};return e.updaters.push({update(_){let m=(_+3.3)%15.5,f=0;m>2&&m<3.6?f=Lc((m-2)/1.6):m>=3.6&&m<7?f=1:m>=7&&m<8.6&&(f=1-Lc((m-7)/1.6)),y.open=f,a.position.x=.885-f*.57,o.position.x=1.565+f*.57,r.material.color.setHex(f>.5?8254656:6403218)}}),{doorGroupL:a,doorGroupR:o,state:y}}function ou(n){let e=new Fe;e.name="hoshizora-mart",n.scene.add(e);let t=J_(e,n);ru(e,n);let i=K_(e,n);au(e,n,Nc,Oc),At(e,16759159,5,2.1,1,2.35,.27,.14+.03),At(e,16767915,1.8,1.2,1.22,1.98,.3,.14+.032),At(e,9429970,3.2,1,-2.4,2.33,.1,.14+.03),At(e,16768163,2.2,.85,1.25,1.49,.2,Nc+.006),Ge(e,16761985,4.1,-2.2,1.65,1.94,.032),Ge(e,16767141,3.5,.8,1.75,1.94,.025),Ge(e,16769200,2,1.4,2.2,2.02,.025);let s=Ge(e,16763021,8,-.2,3,1.85,.045),r=Ge(e,9629661,5,1.2,3,1.95,.035);he(e,5.5,.07,ie(16766110,{transparent:!0,opacity:.1,depthWrite:!1,blending:ot}),-.5,2.63,V.front+.06,{renderOrder:9}),he(e,4.6,.045,ie(9431256,{transparent:!0,opacity:.08,depthWrite:!1,blending:ot}),0,2.74,V.front+.062,{renderOrder:9});let a=t.flicker;return n.updaters.push({update(o){let l=(o+7.4)%23,c=.985+Math.sin(o*.9)*.008+Math.sin(o*7.7)*.004;l>17.15&&l<17.48?c=.72+.26*Math.abs(Math.sin(o*83)):l>17.48&&l<17.75&&(c=.51+.08*Math.sin(o*47)),a.matFront.color.setRGB(c,c,c),a.matSide.color.setRGB(c,c,c);for(let h=0;h<a.glows.length;h++){let u=h<2?h===0?.1:.07:h===2?.055:.045;a.glows[h].material.opacity=u*c}a.camRed.material.opacity=.11+.11*(Math.sin(o*2.7)>.72?1:.12);for(let h=0;h<a.canopyLights.length;h++){let u=.93+.07*Math.sin(o*1.2+h*1.6);a.canopyLights[h].material.color.setRGB(u,u*.9,u*.72)}}}),n.updaters.push({update(o){s.material.opacity=.043+Math.sin(o*.6)*.009,r.material.opacity=.033+Math.cos(o*.5)*.007}}),{group:e,door:i,shellInfo:t}}var fi=.14+.02;function lu(n,e,t,i,s,r={}){let a=new Fe;a.position.set(e,.14,t),n.add(a);let o=T(9145733),l=T(3817800),c=T(2436661);oe(a,.075,.14,i,o,0,i/2,0,{segments:8,cast:!0}),oe(a,.135,.155,.22,T(6777960),0,.11,0,{segments:8,cast:!0}),oe(a,.105,.13,.1,l,0,i*.52,0,{segments:8,cast:!0});for(let u=0;u<7;u++)b(a,.19,.018,.018,l,0,1.1+u*.62,.085,{cast:!1}),b(a,.018,.024,.15,l,0,1.14+u*.62,.16,{cast:!1});let h=i-.95;b(a,1.48,.09,.11,c,0,h,0,{cast:!0}),b(a,1,.08,.1,c,.04,h-.7,0,{cast:!0});for(let u of[-.55,0,.55])oe(a,.034,.034,.17,T(14012602),u,h+.13,0,{segments:7,cast:!1}),oe(a,.12,.12,.03,T(8291712),u,h+.04,0,{segments:8,cast:!1});return oe(a,.27,.27,.61,T(8883076),.26,i-2.25,-.02,{segments:12,cast:!0}),oe(a,.3,.3,.035,T(6121576),.26,i-1.93,-.02,{segments:12,cast:!1}),b(a,.31,.46,.22,T(5265492),-.28,i-2.7,.1,{cast:!0}),b(a,.23,.035,.015,ie(3029304),-.28,i-2.58,.216,{cast:!1}),ft(a,[.04,i*.48,0],[.63,i*.48,.1],.022,l,{cast:!1}),b(a,.17,.06,.12,c,.68,i*.48+.03,.1,{cast:!0}),b(a,.2,.29,.018,T(13091759),0,2.35,.132,{cast:!1}),b(a,.15,.04,.006,ie(3489598),0,2.39,.143,{cast:!1}),b(a,.12,.018,.006,ie(5858399),0,2.33,.143,{cast:!1}),Wt(a,[[-.08,i-.78,0],[-.12,i-1.2,.03],[-.3,i-2.1,.08],[-.3,i-2.78,.1],[-.26,i-3.2,.04]],.018,c,{segments:15,radialSegments:4}),Wt(a,[[.05,i-.78,0],[.15,i-1.7,.05],[.22,i-2.5,.03],[.5,i-3.1,.1],[.52,.4,.1]],.018,c,{segments:18,radialSegments:4}),r.withTransformer!==!1&&Ge(a,16767138,.55,.26,i-1.95,.3,.08),a}function no(n,e,t,i=22){let s=[];for(let r=0;r<=i;r++){let a=r/i,o=n[0]+(e[0]-n[0])*a,l=n[2]+(e[2]-n[2])*a,c=n[1]+(e[1]-n[1])*a-Math.sin(Math.PI*a)*t;s.push([o,c,l])}return s}function j_(n,e){let t=lu(n,5.72,-.62,8.25,e),i=lu(n,-5.62,-5.02,7.3,e,{withTransformer:!1}),s=T(1120802,{outline:!1});s.userData.outlineParameters={visible:!1};let r=[[5.34,7.9,-.62],[5.56,7.64,-.55],[5.78,7.38,-.62],[6.02,7.58,-.7]],a=[[-5.39,6.8,-5.02],[-5.19,6.66,-5.08],[-5.59,6.72,-5.15],[-5.42,6.54,-4.88]];for(let l=0;l<r.length;l++){let c=no(r[l],a[l],.55+l*.06,28);Wt(n,c,.012+l*.0015,s,{segments:54,radialSegments:3,cast:!1})}Wt(n,no([5.7,6.25,-.63],[2.25,4.08,.4],.2,18),.01,s,{segments:38,radialSegments:3}),Wt(n,no([5.64,6.08,-.7],[-3.98,3.72,-1.2],.36,18),.009,s,{segments:38,radialSegments:3}),Wt(n,no([-5.6,6.72,-5],[-5.28,5.4,1.55],.16,18),.011,s,{segments:34,radialSegments:3});let o=[];for(let l=0;l<3;l++){let c=b(n,.14,.18,.01,T(l===1?13943131:8433037,{side:Je}),4.9+l*.33,5.75-l*.1,.45+l*.1,{cast:!1,receive:!1});c.rotation.z=.12*(l-1),o.push({mesh:c,phase:l*.8})}e.updaters.push({update(l){for(let c of o)c.mesh.rotation.z=.12+Math.sin(l*1.8+c.phase)*.055}}),Ge(n,16766107,.9,5.16,4.02,-.58,.1)}function cu(){return Se(128,512,(n,e,t)=>{n.clearRect(0,0,e,t);let i=n.createLinearGradient(0,0,0,t);i.addColorStop(0,"rgba(255,255,255,0)"),i.addColorStop(.18,"rgba(255,255,255,0.42)"),i.addColorStop(.8,"rgba(255,255,255,0.12)"),i.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=i,n.fillRect(0,0,e,t)})}function Q_(n,e){let t=new Fe;t.position.set(3.14,fi,2.78),n.add(t);let i=T(2506053),s=T(3558225),r=ie(16773314),a=T(2439744);oe(t,.095,.16,.34,T(4610909),0,.17,0,{segments:10}),oe(t,.055,.085,4.28,i,0,2.42,0,{segments:9,cast:!0}),oe(t,.085,.075,.1,s,0,4.55,0,{segments:9,cast:!0}),b(t,.21,.46,.17,T(4938844),.08,1.72,0,{cast:!0}),b(t,.15,.02,.012,T(1779242),.08,1.81,.09,{cast:!1}),b(t,.05,.05,.03,ie(14922607),.08,1.56,.09,{cast:!1}),Wt(t,[[0,4.43,0],[.18,4.63,.02],[.49,4.72,.08],[.78,4.68,.14],[.92,4.59,.18]],.04,i,{segments:22,radialSegments:6,cast:!0}),Wt(t,[[.1,4.55,0],[.4,4.54,.07],[.72,4.51,.14]],.018,s,{segments:12,radialSegments:4}),bn(t,.62,.09,.24,.045,a,1.04,4.58,.22,{segments:2,cast:!0}),b(t,.48,.025,.16,r,1.05,4.525,.22,{cast:!1}),b(t,.18,.06,.18,a,.8,4.585,.22,{cast:!1});let l=new Pe(new Dn(.145,12,9),ie(16773578));l.position.set(1.05,4.43,.22),t.add(l);let c=new Pe(new Un(.145,.018,4,12),s);c.position.set(1.05,4.52,.22),c.rotation.x=Math.PI/2,t.add(c),Ge(t,16770215,1.5,1.05,4.43,.22,.42),Ge(t,16774098,.62,1.05,4.42,.22,.4);let h=new mr(1.65,3.95,28,1,!0),u=ie(16772292,{map:cu(),transparent:!0,opacity:.105,side:Je,depthWrite:!1,blending:ot}),d=new Pe(h,u);d.position.set(1.05,2.45,.22),t.add(d);let p=new Pe(new mr(.75,3.7,20,1,!0),ie(16770479,{map:cu(),transparent:!0,opacity:.055,side:Je,depthWrite:!1,blending:ot}));p.position.set(1.05,2.5,.22),t.add(p),At(n,16770739,3.1,3.4,4.16,3.04,.22,.052),At(n,16764806,1.5,1.5,4.16,3.04,.16,.053),e.lights.push({type:"point",color:16767643,intensity:13,distance:7.8,pos:[4.19,4.24,3]});let y=Se(1024,280,(m,f,v)=>{m.fillStyle="#24607a",fu(m,0,0,f,v,18),m.strokeStyle="#d8eef1",m.lineWidth=9,m.strokeRect(14,14,f-28,v-28),m.fillStyle="#f0f6e9",m.font=`700 82px ${ae}`,m.textAlign="left",m.fillText("星見町二丁目",62,135),m.font=`700 34px ${Ne}`,m.letterSpacing="4px",m.fillStyle="#bce4e8",m.fillText("HOSHIZORA-MACHI 2",66,206),m.textAlign="right",m.font=`700 31px ${Ne}`,m.fillStyle="#d9edf0",m.fillText("雨 / 夜間",f-58,206),bt(m,f-90,101,44,14,"#f4c27f",4)});b(t,.98,.31,.055,T(3427410),0,2.46,.07,{cast:!0}),he(t,.92,.26,Ie(y),0,2.46,.103);let _=Se(512,340,(m,f,v)=>{m.fillStyle="#ebdfc0",m.fillRect(0,0,f,v),m.strokeStyle="#b24e3d",m.lineWidth=22,m.strokeRect(18,18,f-36,v-36),m.fillStyle="#5f4833",m.font=`700 44px ${ae}`,m.textAlign="center",m.fillText("自転車",f/2,140),m.fillText("注意",f/2,200),m.font=`700 24px ${Ne}`,m.fillText("WATCH FOR BIKES",f/2,268)});return b(t,.46,.32,.03,T(6839368),0,1.55,.085,{cast:!1}),he(t,.42,.27,Ie(_),0,1.55,.105),t}function fu(n,e,t,i,s,r){n.beginPath(),n.moveTo(e+r,t),n.arcTo(e+i,t,e+i,t+s,r),n.arcTo(e+i,t+s,e,t+s,r),n.arcTo(e,t+s,e,t,r),n.arcTo(e,t,e+i,t,r),n.closePath(),n.fill()}function ey(n,e){let t=new Fe;t.position.set(5.74,.14,-5.18),n.add(t);let i=T(4016973);oe(t,.07,.09,3.82,i,0,1.91,0,{segments:8,cast:!0}),oe(t,.1,.12,.18,T(7371123),0,.09,0,{segments:8,cast:!0}),b(t,.94,.35,.22,T(2240306),.32,3.62,0,{cast:!0});for(let m=0;m<3;m++){let f=-.05+m*.37;b(t,.35,.06,.28,T(1713192),f,3.795,.09,{cast:!0,rx:-.1})}let s=[],r=[6235687,6772004,1856840];for(let m=0;m<3;m++){let f=ie(r[m]),v=new Pe(new gn(.105,20),f);v.position.set(-.05+m*.37,3.62,.12),t.add(v),s.push(f)}let a=Ge(t,6943421,1.15,.69,3.62,.2,.36),o=Ge(t,16741733,.75,-.05,3.62,.2,0),l=Ge(t,16765549,.8,.32,3.62,.2,0);b(t,.98,.06,.28,T(1384227),.32,3.84,.06,{cast:!0}),b(t,.22,.22,.2,T(3490115),.32,3.3,.02,{cast:!0}),Ge(t,9828304,.6,.32,3.3,.14,.15),b(t,.28,.46,.2,T(2503734),.04,2.28,0,{cast:!0});let c=ie(16739169),h=ie(5760690),u=new Pe(new Qt(.17,.16),c);u.position.set(.04,2.39,.11),t.add(u);let d=new Pe(new Qt(.17,.16),h);d.position.set(.04,2.18,.11),t.add(d);let p=Ge(t,9237708,.58,.04,2.18,.14,.16);Ge(t,16769704,.9,.32,3.75,.3,.06);let y=[16739168,16765803,6943421],_=[2297874,2366991,529681];e.updaters.push({update(m){let f=(m+4.5)%15,v=2;f>7&&f<9.2?v=1:f>=9.2&&(v=0);for(let g=0;g<3;g++)s[g].color.setHex(g===v?y[g]:_[g]);a.material.opacity=v===2?.34:0,l.material.opacity=v===1?.25:0,o.material.opacity=v===0?.25:0;let S=v===2?Math.sin(m*3.4)>-.5:!1;h.color.setHex(S?5760690:1326389),c.color.setHex(S?5250848:16739169),p.material.opacity=S?.16:.09,p.material.color.setHex(S?9237708:16752013)}}),At(n,7139773,.85,.8,5.35,-4.6,.12,.048)}function ty(n,e,t={}){let i=t.x??2.62,s=t.z??-3.35,r=t.ry??0,a=new Fe;a.position.set(i,fi,s),a.rotation.y=r,n.add(a);let o=T(2046274),l=T(598058);bn(a,.72,1.92,1.03,.055,o,0,.96,0,{segments:2,cast:!0}),b(a,.74,.09,1.05,l,0,1.955,0,{cast:!0}),b(a,.66,.04,.93,l,0,.04,0,{cast:!0});let c=Vf();he(a,1,1.78,Ie(c),.366,1.01,0,{ry:Math.PI/2}),b(a,.015,1.48,.018,ie(7596500,{transparent:!0,opacity:.62}),.372,1.03,.49,{cast:!1}),b(a,.015,1.48,.018,ie(16748468,{transparent:!0,opacity:.46}),.372,1.03,-.49,{cast:!1}),b(a,.055,.16,.15,T(729641),.39,.49,.31,{cast:!1}),b(a,.02,.055,.14,ie(1056032),.424,.5,.31,{cast:!1}),b(a,.08,.15,.27,T(12181461),.39,.2,-.32,{cast:!1}),b(a,.018,.04,.22,ie(1847345),.43,.22,-.32,{cast:!1}),b(a,.05,.05,.05,T(5727330),.27,.17,.48,{cast:!0,ry:.3}),Ge(a,8710625,1.75,.48,1.25,0,.16),Ge(a,16748734,1.2,.57,.84,-.42,.12);let h=i+Math.cos(r)*.48,u=s-Math.sin(r)*.48;e.lights.push({type:"point",color:10285028,intensity:8.5,distance:3.8,pos:[h,1.34,u]}),At(n,7989213,1.7,1.8,i,s+.58,.12,.158),At(n,16748469,.85,1.2,i+.2,s+1,.08,.158),b(a,.34,.28,.42,T(10471871),.48,.14,.66,{cast:!0}),b(a,.28,.06,.36,T(3233871),.48,.21,.66,{cast:!1}),oe(a,.04,.04,.17,T(15199456),.48,.34,.72,{segments:8,cast:!1,rz:.2})}function ny(n){let e=new Fe;e.position.set(2.53,fi,2.3),n.add(e),b(e,.82,.76,.5,T(2706508),0,.38,0,{cast:!0}),b(e,.87,.08,.55,T(1586742),0,.8,0,{cast:!0});let t=[13990738,6666654,6985918],s=["もえる","かん","びん"].map((r,a)=>Se(256,128,(o,l,c)=>{o.fillStyle="rgba(245,243,223,0.92)",o.fillRect(0,0,l,c),o.fillStyle=["#b8513c","#347e64","#456e91"][a],o.font=`700 33px ${ae}`,o.textAlign="center",o.fillText(r,l/2,57),o.font=`700 16px ${Ne}`,o.fillText(["BURN","CAN","BOTTLE"][a],l/2,91)}));for(let r=0;r<3;r++){let a=-.27+r*.27;b(e,.235,.37,.02,T(1059114),a,.47,.255,{cast:!1}),he(e,.22,.115,Ie(s[r]),a,.47,.27),b(e,.055,.15,.02,ie(t[r]),a,.69,.26,{cast:!1})}b(e,.64,.02,.04,T(1453358),0,.19,.26,{cast:!1})}function iy(n,e,t={}){let i=new Fe;i.position.set(t.x??2.58,fi,t.z??-1.1),i.rotation.y=t.ry??.07,i.rotation.z=t.lean??-.075,n.add(i);let s=T(t.color??7904401),r=T(2305328),a=T(11450545),o=T(1778984),l=.53,c=.32,h=.33;for(let y of[-l,l]){let _=new Pe(new Un(c,.023,6,24),o);_.position.set(0,h,y),_.rotation.y=Math.PI/2,_.castShadow=!0,i.add(_);let m=new Pe(new Un(c-.025,.007,4,24),a);m.position.set(0,h,y),m.rotation.y=Math.PI/2,i.add(m);for(let v=0;v<8;v++){let S=v/8*Math.PI*2;ft(i,[0,h,y],[Math.sin(S)*(c-.035),h+Math.cos(S)*(c-.035),y],.0035,a,{cast:!1,segments:4})}oe(i,.027,.027,.075,r,0,h,y,{rx:Math.PI/2,segments:8});let f=new Pe(new Un(c+.027,.02,4,18,Math.PI*1.1),T(6720387));f.position.set(0,h,y),f.rotation.y=Math.PI/2,f.rotation.z=.7,f.castShadow=!0,i.add(f)}let u=[0,.22,0],d=[0,.63,-.16],p=[0,.57,.31];ft(i,[0,h,-l],d,.018,s),ft(i,[0,h,-l],u,.016,s),ft(i,u,d,.017,s),ft(i,u,[0,.58,.37],.018,s),ft(i,[0,.58,.37],p,.02,s),ft(i,[0,.57,.38],[0,h,l],.015,a),ft(i,[0,.58,.37],[0,.92,.3],.017,a),ft(i,[-.23,.9,.3],[.23,.9,.3],.012,a),ft(i,[0,.9,.3],[-.22,1.01,.35],.013,a),ft(i,[0,.9,.3],[.22,1.01,.35],.013,a),oe(i,.018,.018,.1,r,-.23,1.01,.35,{rz:Math.PI/2,segments:6}),oe(i,.018,.018,.1,r,.23,1.01,.35,{rz:Math.PI/2,segments:6}),b(i,.14,.05,.28,T(5323314),0,1.02,-.27,{cast:!0}),oe(i,.018,.018,.22,a,0,.91,-.26,{segments:6,cast:!1}),b(i,.27,.025,.35,a,0,.63,-.58,{cast:!0}),ft(i,[-.12,.63,-.5],[-.12,.31,-.55],.008,a,{cast:!1}),ft(i,[.12,.63,-.5],[.12,.31,-.55],.008,a,{cast:!1}),b(i,.33,.18,.28,T(8360074,{transparent:!0,opacity:.8}),0,.9,.5,{cast:!0}),b(i,.29,.01,.24,T(6451050),0,.82,.5,{cast:!1}),ft(i,[-.16,.82,.5],[-.16,.97,.5],.008,a,{cast:!1}),ft(i,[.16,.82,.5],[.16,.97,.5],.008,a,{cast:!1}),ft(i,[0,.22,-.08],[.15,.06,-.2],.01,r,{cast:!1}),b(i,.06,.08,.38,T(5333084),0,.35,-.3,{cast:!1}),oe(i,.035,.03,.027,T(12763814),.12,1,.36,{segments:8,cast:!1}),oe(i,.032,.05,.06,ie(16769705),0,.86,.58,{rx:Math.PI/2,segments:8,cast:!1}),Ge(i,16770736,.28,0,.86,.64,.12),b(i,.012,.012,.65,ie(12971745,{transparent:!0,opacity:.45}),.028,.56,.02,{rz:.05,cast:!1})}function sy(n,e){let t=new Fe;t.position.set(.4,fi,2.15),n.add(t);let i=T(5401705);oe(t,.19,.17,.36,i,0,.18,0,{segments:14,cast:!0}),oe(t,.195,.195,.045,T(2703167),0,.37,0,{segments:14,cast:!0}),oe(t,.205,.22,.025,ie(2505018),0,.01,0,{segments:14,cast:!1});let s=[8566977,15303538,6662547,3165017];for(let r=0;r<4;r++){let a=r*1.26,o=.11,l=Math.cos(a)*o,c=Math.sin(a)*o,h=Math.cos(a)*.18,u=Math.sin(a)*.18,d=1.4+r%2*.08,p=oe(t,.015,.055,.86,T(s[r]),l+h*.5,.98,c+u*.5,{rx:u*.8,rz:-h*1.05,segments:7,cast:!0});p.rotation.x+=.02;let y=l+h,_=c+u;ft(t,[l,.25,c],[y,d,_],.012,T(5858149),{cast:!1,segments:5}),Wt(t,[[y,d+.03,_],[y+.03,d+.12,_],[y+.12,d+.11,_+.02]],.014,T(4275512),{segments:8,radialSegments:4}),oe(t,.048,.055,.02,T(2962743),l+h*.36,.99,c+u*.36,{rx:u*.8,rz:-h*1.05,segments:7,cast:!1})}At(n,9423042,.75,.55,.4,2.12,.08,.158)}function ry(n){let e=Se(512,256,(t,i,s)=>{t.fillStyle="#1d3b3d",t.fillRect(0,0,i,s),t.strokeStyle="#7acbb7",t.lineWidth=8,t.strokeRect(12,12,i-24,s-24),t.strokeStyle="rgba(255,244,213,0.55)",t.lineWidth=2,t.strokeRect(23,23,i-46,s-46),t.fillStyle="#f5ead2",t.textAlign="center",t.font=`700 46px ${ae}`,t.fillText("WELCOME",i/2,110),t.fillStyle="#8edcc8",t.font=`700 26px ${ae}`,t.fillText("星見町店へ ようこそ",i/2,158),bt(t,74,73,18,5,"#ecbb7a",4),bt(t,i-74,73,18,5,"#ecbb7a",4),t.fillStyle="rgba(255,255,255,0.05)";for(let r=0;r<20;r++)t.fillRect(0,r*13,i,2)});st(n,1.08,.58,ie(16777215,{map:e,depthWrite:!1}),1.225,.157,2.11)}function ay(n,e){let t=new Fe;t.position.set(-5.45,fi,2.42),t.scale.setScalar(.82),n.add(t);let i=T(4799022),s=T(7099965);oe(t,.04,.05,2.1,i,-.52,1.05,0,{segments:8,cast:!0}),oe(t,.04,.05,2.1,i,.52,1.05,0,{segments:8,cast:!0}),b(t,1.24,1.58,.08,s,0,1.53,.02,{cast:!0}),b(t,1.11,1.42,.03,T(6245947),0,1.53,.075,{cast:!1});let r=Xf();he(t,1.02,1.34,Ie(r),0,1.53,.097),b(t,1.35,.08,.38,T(4076329),0,2.36,.12,{rx:-.1,cast:!0}),b(t,1.2,.025,.45,_t(1515811,{roughness:.12,metalness:.4,transparent:!0,opacity:.5,outline:!1}),0,.012,.02,{cast:!1,receive:!0}),Ge(t,16769190,.55,.38,2.23,.17,.08),b(t,.12,.06,.14,T(2964025),.4,2.3,.18,{cast:!0}),b(t,.06,.02,.08,ie(16766619),.4,2.262,.27,{cast:!1})}function oy(n,e){let t=[{x:-2.95,z:2.63,s:.8,pot:8352861,leaf:5208926},{x:3.03,z:2.5,s:.68,pot:7035465,leaf:5998175},{x:-5.05,z:1.94,s:.92,pot:8088664,leaf:4683351}];for(let i of t){let s=new Fe;s.position.set(i.x,fi,i.z),s.scale.setScalar(i.s),n.add(s),oe(s,.21,.16,.35,T(i.pot),0,.18,0,{segments:9,cast:!0}),oe(s,.23,.21,.06,T(3095351),0,.33,0,{segments:9,cast:!0}),oe(s,.18,.2,.03,T(2630945),0,.36,0,{segments:9,cast:!1});let r=ly(i.leaf+i.x);for(let o=0;o<9;o++){let l=new Dn(.13+r()*.08,5,4),c=T(o%3===0?3497805:o%2?i.leaf:7050349),h=new Pe(l,c);h.position.set((r()-.5)*.52,.5+r()*.42,(r()-.5)*.45),h.scale.set(1.2,.55+r()*.4,.8),h.rotation.set(r()*1.2,r()*Math.PI,r()*.6),h.castShadow=!0,s.add(h)}let a=new Fe;s.add(a);for(let o=0;o<4;o++)oe(a,.007,.012,.08,ie(12117731,{transparent:!0,opacity:.7}),(r()-.5)*.4,.85+r()*.2,(r()-.5)*.3,{segments:4,cast:!1})}}function ly(n){let e=Math.abs(Math.floor(n*1e3))+7;return()=>(e=e*16807%2147483647,(e-1)/2147483646)}function cy(n){let e=new Fe;e.position.set(3.29,fi,-2.3),n.add(e),oe(e,.035,.05,2,T(4345424),0,1,0,{segments:8,cast:!0});let t=Se(512,512,(s,r,a)=>{s.fillStyle="#2b5c7b",fu(s,0,0,r,a,12),s.strokeStyle="#eef5ed",s.lineWidth=16,s.strokeRect(20,20,r-40,a-40),s.fillStyle="#f4f6ec",s.font=`800 270px ${Ne}`,s.textAlign="center",s.fillText("P",r/2,310),s.font=`700 32px ${ae}`,s.fillText("星見町 第二駐車場",r/2,406),s.font=`700 26px ${Ne}`,s.fillText("24 HOURS",r/2,448),s.fillStyle="#f5c77c",s.beginPath(),s.moveTo(r/2-20,468),s.lineTo(r/2+20,468),s.lineTo(r/2,490),s.closePath(),s.fill()});he(e,.5,.5,Ie(t,{side:Je}),0,2.02,.005),b(e,.56,.56,.045,T(6121833),0,2.02,-.01,{cast:!0});let i=Se(512,256,(s,r,a)=>{s.fillStyle="#2d627f",s.fillRect(0,0,r,a),s.strokeStyle="#eff3e4",s.lineWidth=8,s.strokeRect(12,12,r-24,a-24),s.fillStyle="#eff3e4",s.font=`700 56px ${ae}`,s.textAlign="center",s.fillText("→ 空車",r/2,104),s.font=`700 28px ${Ne}`,s.fillText("VACANCY",r/2,170)});he(e,.58,.29,Ie(i,{side:Je}),0,1.56,.005),b(e,.64,.32,.04,T(5990504),0,1.56,-.01,{cast:!0})}function Fc(n,e,t,i={}){let s=new D(...e),r=new D(...t),o=r.clone().sub(s).length(),l=Math.max(2,Math.round(o/1.55)),c=T(14278354),h=T(4682341);for(let u=0;u<l;u++){let d=u/(l-1),p=s.clone().lerp(r,d);oe(n,.048,.06,.88,h,p.x,p.y+.44,p.z,{segments:7,cast:!0}),oe(n,.07,.07,.05,T(11977911),p.x,p.y+.88,p.z,{segments:8,cast:!1}),oe(n,.03,.03,.06,ie(u===l-1?16762746:15331558),p.x,p.y+.78,p.z+.055,{rx:Math.PI/2,segments:6,cast:!1})}for(let u of[.48,.82])ft(n,[e[0],e[1]+u,e[2]],[t[0],t[1]+u,t[2]],.034,c,{cast:!1,segments:6});ft(n,[e[0],e[1]+.15,e[2]],[t[0],t[1]+.15,t[2]],.022,h,{cast:!1,segments:6})}function hy(n){Fc(n,[-4.8,.14,5.72],[-2.35,.14,5.72]),Fc(n,[3.12,.14,-4.5],[3.12,.14,-3]),Fc(n,[5.64,.14,1.06],[5.64,.14,2.82])}function hu(n,e,t,i,s=0){let r=new Fe;r.position.set(e,t,i),r.rotation.y=s,n.add(r),bn(r,.58,.48,.34,.03,T(11974311),0,0,0,{segments:2,cast:!0}),oe(r,.155,.155,.012,T(4871764),-.09,.01,.173,{rx:Math.PI/2,segments:18,cast:!1});for(let a=0;a<7;a++)b(r,.26,.014,.012,T(6844779),-.09,-.13+a*.045,.176,{cast:!1});b(r,.25,.18,.015,T(9408899),.13,.03,.175,{cast:!1});for(let a=0;a<3;a++)b(r,.02,.05,.012,T(6516072),-.23+a*.045,-.12,.176,{cast:!1});b(r,.64,.045,.4,T(6843748),0,-.28,0,{cast:!0}),ft(r,[.28,-.25,.1],[.35,-.8,.12],.018,T(5528920),{cast:!1}),Ge(r,10338999,.3,0,.1,.1,.04)}function fy(n){let e=new Fe;e.name="street-props",n.scene.add(e),ry(e),sy(e,n),ny(e),iy(e,n,{x:2.57,z:-1.2,lean:-.07,color:7510416}),ay(e,n),oy(e,n),ty(e,n,{x:-4.38,z:2.34,ry:-Math.PI/2}),hu(e,2.35,2.25,-4.2,Math.PI/2),hu(e,-5.21,1.65,-3.1,Math.PI/2),cy(e),hy(e);let t=new Fe;t.position.set(5.18,.035,-2.52),e.add(t),b(t,.3,.045,.3,T(4144437),0,.022,0,{cast:!0}),oe(t,.045,.14,.54,T(14514512),0,.31,0,{segments:10,cast:!0}),oe(t,.093,.108,.075,T(15787470),0,.31,0,{segments:10,cast:!1}),oe(t,.058,.075,.06,T(15787470),0,.45,0,{segments:10,cast:!1});let i=new Fe;i.position.set(3.03,fi,-2.46),e.add(i),oe(i,.035,.05,2.9,T(5200990),0,1.45,0,{segments:7,cast:!0});let s=new Pe(new gn(.36,24),T(13794127));s.position.set(.08,2.65,.09),s.rotation.y=-.55,i.add(s);let r=new Pe(new gn(.32,24),_t(10468032,{roughness:.08,metalness:.9,outline:!1}));r.position.set(.08,2.65,.095),r.rotation.y=-.55,i.add(r),b(i,.04,.8,.04,T(5989988),0,2.65,0,{rx:.18,cast:!1}),b(e,.55,.34,.4,T(8416081),2.1,.31,-5.35,{cast:!0,ry:.16}),b(e,.43,.25,.33,T(7298117),1.95,.61,-5.34,{cast:!0,ry:-.08});for(let a=0;a<4;a++)b(e,.32,.05,.42,T(a%2?11903617:13483934),-3.55,.19+a*.055,2.69,{cast:!0,ry:.15+a*.04});return b(e,.026,.2,.026,T(6967095),-3.55,.29,2.69,{cast:!1}),e}function uu(n){let e=fy(n);return Q_(e,n),j_(e,n),ey(e,n),e}function uy(){let n=Ht(104),e=1350,t=new Qt(1,1),i=new Ga;i.index=t.index,i.setAttribute("position",t.attributes.position),i.setAttribute("uv",t.attributes.uv);let s=new Float32Array(e*3),r=new Float32Array(e),a=new Float32Array(e);for(let h=0;h<e;h++)s[h*3]=n(),s[h*3+1]=n(),s[h*3+2]=n(),r[h]=3.1+n()*4.3,a[h]=.55+n()*n()*2.6;i.setAttribute("aSeed",new Ei(s,3)),i.setAttribute("aSpeed",new Ei(r,1)),i.setAttribute("aScale",new Ei(a,1)),i.instanceCount=e;let o={uTime:{value:0},uColor:{value:new Xe(13036026)},uOpacity:{value:.3},uPixelRatio:{value:Math.min(window.devicePixelRatio||1,2)}},l=new on({uniforms:o,vertexShader:`
      attribute vec3 aSeed;
      attribute float aSpeed;
      attribute float aScale;
      uniform float uTime;
      varying vec2 vUv;
      varying float vAlpha;

      void main() {
        vUv = uv;
        float span = 10.6;
        float fall = mod(aSeed.y * span + uTime * aSpeed, span);
        vec3 world = vec3((aSeed.x - 0.5) * 14.2, 9.4 - fall, (aSeed.z - 0.5) * 14.2);

        // The shop is warm and dry inside. Hide all rain beneath its roof.
        bool inside = world.x > -4.16 && world.x < 2.28 &&
                      world.z > -4.74 && world.z < 1.88 &&
                      world.y < 5.15;

        vec4 viewPos = viewMatrix * vec4(world, 1.0);
        float len = 0.235 * aScale;
        vec2 corner = vec2(position.x * 0.0115 * aScale, (position.y + 0.5) * len);
        // Slight wind slant and flicker.
        corner.x += corner.y * 0.13 + sin(uTime * 0.5 + aSeed.z * 9.0) * 0.005;
        viewPos.xy += corner;

        float farFade = 1.0 - smoothstep(18.0, 31.0, -viewPos.z);
        float nearFade = smoothstep(2.0, 4.0, -viewPos.z);
        vAlpha = inside ? 0.0 : farFade * nearFade * (0.62 + 0.38 * aSeed.x);
        gl_Position = projectionMatrix * viewPos;
      }
    `,fragmentShader:`
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vAlpha;
      void main() {
        float edge = smoothstep(0.0, 0.32, vUv.x) * (1.0 - smoothstep(0.68, 1.0, vUv.x));
        float tail = smoothstep(0.0, 0.28, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y));
        float alpha = edge * tail * uOpacity * vAlpha;
        if (alpha < 0.008) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,transparent:!0,depthWrite:!1,depthTest:!0,side:Je,blending:ot,toneMapped:!1});l.userData.outlineParameters={visible:!1};let c=new Pe(i,l);return c.frustumCulled=!1,c.renderOrder=12,{rain:c,uniforms:o}}function dy(n,e){let t=Qf(),i=[],s=new Fe;s.name="rain-on-glass",n.add(s);let r=V.front+.095,a=V.right+.095,o=Ht(77);for(let d=0;d<34;d++){let p;d<30?p=-3.72+(d+o()*.8)/30*4.07:p=1.95+o()*.1;let y=.16+o()*.26,_=.018+o()*.025,m=ie(16777215,{map:t,transparent:!0,opacity:.42+o()*.25,depthWrite:!1,blending:ot}),f=he(s,_,y,m,p,.4+o()*2.25,r,{renderOrder:10});i.push({mesh:f,x:p,speed:.08+o()*.15,phase:o(),minY:.37,maxY:2.78,wobble:.4+o()*1.6})}for(let d=0;d<18;d++){let p=-2.63+o()*4.23,y=.15+o()*.23,_=.018+o()*.022,m=ie(16777215,{map:t,transparent:!0,opacity:.31+o()*.22,depthWrite:!1,blending:ot}),f=he(s,_,y,m,a,.4+o()*2.18,p,{ry:Math.PI/2,renderOrder:10});i.push({mesh:f,x:p,speed:.07+o()*.12,phase:o(),minY:.37,maxY:2.72,wobble:.4+o()*1.2,side:!0})}let l=new Dn(.011,5,4),c=ie(14285055,{transparent:!0,opacity:.5}),h=[];for(let d=0;d<54;d++){let p=new Pe(l,c);d<40?p.position.set(-3.8+o()*5.7,.4+o()*2.27,r+.012):p.position.set(a+.012,.4+o()*2.2,-2.7+o()*4.3);let _=.6+o()*1.7;p.scale.set(_,_*(1.2+o()),.6),s.add(p),h.push({bead:p,phase:o()*Math.PI*2})}let u=Se(512,256,(d,p,y)=>{let _=d.createLinearGradient(0,y,0,0);_.addColorStop(0,"rgba(214,243,243,0.22)"),_.addColorStop(.42,"rgba(214,243,243,0.07)"),_.addColorStop(1,"rgba(214,243,243,0)"),d.fillStyle=_,d.fillRect(0,0,p,y),d.fillStyle="rgba(255,255,255,0.1)";for(let m=0;m<40;m++)d.beginPath(),d.arc(Math.random()*p,y*(.55+Math.random()*.45),1+Math.random()*3,0,Math.PI*2),d.fill()});return he(s,5.9,.42,ie(16777215,{map:u,transparent:!0,depthWrite:!1}),-1.02,.49,r+.005,{renderOrder:9}),he(s,4.8,.4,ie(16777215,{map:u,transparent:!0,depthWrite:!1}),a+.005,.49,-.58,{ry:Math.PI/2,renderOrder:9}),{group:s,update(d){for(let p of i){let y=(d*p.speed+p.phase)%1,_=p.maxY-y*(p.maxY-p.minY);p.mesh.position.y=_,p.mesh.position.x=p.side?a+.003+Math.sin(d*.7+p.phase*8)*.003:p.mesh.position.x,p.mesh.material.opacity=(p.side?.22:.36)+Math.sin(y*Math.PI)*.23,p.side?p.mesh.position.z=p.x:p.mesh.position.x=p.x+Math.sin(d*.35+p.phase*13)*.006,p.mesh.scale.y=.7+Math.sin(y*Math.PI)*.6+Math.sin(d*2.2+p.phase*9)*.08}for(let p of h)p.bead.material.opacity=.42+Math.sin(d*1.1+p.phase)*.05}}}function py(n,e){let t=Ht(501),i=new Fe;n.add(i);let s=[],r=new vr(.72,1,28);r.rotateX(-Math.PI/2);let a=e.filter(o=>o.rx>.11&&o.rz>.1);for(let o=0;o<46;o++){let l=a.length?a[Math.floor(t()*a.length)]:{x:0,z:4,rx:1,rz:1,y:.04},c=l.x+(t()-.5)*l.rx*1.35,h=l.z+(t()-.5)*l.rz*1.35,u=new xn({color:o%5===0?16769973:12906236,transparent:!0,opacity:0,depthWrite:!1,blending:ot,side:Je,toneMapped:!1});u.userData.outlineParameters={visible:!1};let d=new Pe(r,u);d.position.set(c,l.y+.008+o*1e-5,h),d.scale.setScalar(.1),d.renderOrder=4,i.add(d),s.push({mesh:d,phase:t(),duration:.7+t()*1.2,delay:t()*3,maxRadius:.11+t()*.28,color:o%5===0?1:0})}for(let o=0;o<12;o++){let l=-3.8+t()*5.8,c=new xn({color:13561855,transparent:!0,opacity:0,depthWrite:!1,blending:ot,side:Je,toneMapped:!1});c.userData.outlineParameters={visible:!1};let h=new Pe(r,c);h.position.set(l,.14+.02,2.55+t()*.2),h.scale.setScalar(.06),i.add(h),s.push({mesh:h,phase:t(),duration:.55+t()*.6,delay:t()*1.5,maxRadius:.035+t()*.08,color:0})}return{group:i,update(o){for(let l of s){let h=((o+l.delay)/l.duration+l.phase)%1;l.mesh.visible=!0,l.mesh.scale.setScalar(l.maxRadius*(.16+h*1.05)),l.mesh.material.opacity=Math.sin(h*Math.PI)*(1-h*.36)*(l.color?.4:.28)}}}}function my(n){let e=Ht(909),t=new Fe;n.add(t);let i=new Da(.014,.15,2,4),s=ie(14349567,{transparent:!0,opacity:.6,blending:ot}),r=new vr(.55,1,18);r.rotateX(-Math.PI/2);let a=[];for(let o=0;o<17;o++){let l=o<12,c=l?-3.8+e()*5.7:V.right+.15+e()*.38,h=l?V.front+.62+e()*.12:-2.5+e()*4,u=new Pe(i,s);u.position.set(c,2.3,h),u.scale.y=.7+e()*.8,t.add(u);let d=ie(13234175,{transparent:!0,opacity:0,depthWrite:!1,blending:ot}),p=new Pe(r,d);p.rotation.x=0,p.position.set(c,.18,h),p.scale.setScalar(.03),t.add(p),a.push({drop:u,ring:p,x:c,z:h,phase:e(),speed:.55+e()*.42,side:!l})}return{group:t,update(o){for(let l of a){let c=(o*l.speed+l.phase)%1,h=.86;if(c<.07)l.drop.visible=!0,l.drop.position.y=2.885,l.drop.scale.y=.25,l.ring.material.opacity=0;else if(c<h){let u=(c-.07)/(h-.07);l.drop.visible=!0,l.drop.position.y=2.87-u*2.73,l.drop.position.x=l.x+Math.sin(o*1.1+l.phase*7)*.006,l.drop.scale.y=.6+u*1.5,l.ring.material.opacity=0}else{l.drop.visible=!1;let u=(c-h)/(1-h);l.ring.position.x=l.x,l.ring.position.z=l.z,l.ring.scale.setScalar(.025+u*.11),l.ring.material.opacity=(1-u)*.18}}}}}function gy(n,e){let t=Ht(818),i=new Fe;n.add(i);let s=[[-.2,.17,2.92],[3.12,.17,-1.65],[4.8,.06,5.48]],r=[];for(let a=0;a<s.length;a++){let[o,l,c]=s[a];for(let h=0;h<4;h++){let u=new Gn({map:zs(),color:12113629,transparent:!0,opacity:.03,depthWrite:!1,blending:ot,toneMapped:!1}),d=new oi(u);d.position.set(o+(t()-.5)*.12,l+.08,c+(t()-.5)*.12),d.scale.set(.18,.36,1),i.add(d),r.push({sp:d,sx:o,sy:l,sz:c,phase:t(),speed:.12+t()*.08,drift:.1+t()*.2})}}return{group:i,update(a){for(let o of r){let l=(a*o.speed+o.phase)%1;o.sp.position.set(o.sx+Math.sin(l*7+o.phase*13)*o.drift+l*o.drift*.5,o.sy+.02+l*.62,o.sz+Math.cos(l*5+o.phase)*o.drift*.3),o.sp.scale.set(.15+l*.42,.25+l*.62,1),o.sp.material.opacity=Math.sin(l*Math.PI)*.055*(1-l*.4)}}}}function _y(n){let e=Ht(404),t=new Fe;n.add(t);let i=zs(),s=[];for(let r=0;r<7;r++){let a=new Gn({map:i,color:11192536,transparent:!0,opacity:.026+e()*.02,depthWrite:!1,blending:ot,toneMapped:!1}),o=new oi(a);o.position.set(-5.5+e()*11,.28+e()*.4,-4.8+e()*10),o.scale.set(3.4+e()*3.4,.8+e()*.7,1),t.add(o),s.push({s:o,phase:e()*8,sx:o.position.x,sz:o.position.z,drift:.1+e()*.3})}return{group:t,update(r){for(let a of s)a.s.position.x=a.sx+Math.sin(r*.04+a.phase)*a.drift,a.s.position.z=a.sz+Math.cos(r*.03+a.phase)*a.drift*.6,a.s.material.opacity=.018+.014*(.5+.5*Math.sin(r*.1+a.phase))}}}function yy(n){let e=Ht(222),t=new Fe;n.add(t);let i=ci(["rgba(255,212,150,0.9)","rgba(113,221,208,0.7)","rgba(255,139,169,0.5)"],11,8),s=[];for(let r=0;r<9;r++){let a=ie(16777215,{map:i,transparent:!0,opacity:.06+e()*.1,depthWrite:!1,blending:ot,side:Je}),o=st(t,.06+e()*.16,.4+e()*.8,a,-4+e()*9,.041+e()*.002,3.1+e()*2.1);o.renderOrder=4,s.push({mesh:o,phase:e()*8,base:a,speed:.45+e()*.4})}return{group:t,update(r){for(let a of s)a.mesh.material.opacity=.02+.11*Math.max(0,Math.sin(r*a.speed+a.phase)),a.mesh.scale.x=.8+Math.sin(r*.33+a.phase)*.16}}}function du(n){let e=new Fe;e.name="rain-and-atmosphere",n.scene.add(e);let t=uy();e.add(t.rain);let i=dy(e,n),s=py(e,n.puddles??[]),r=my(e),a=_y(e),o=gy(e,n),l=yy(e);return n.updaters.push({update(c){t.uniforms.uTime.value=c,t.uniforms.uPixelRatio.value=Math.min(window.devicePixelRatio||1,2),i.update(c),s.update(c),r.update(c),a.update(c),o.update(c),l.update(c)}}),{group:e,rain:t,glass:i,ripples:s,drips:r,mist:a,glints:l}}at.enabled=!0;var vy=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,Dt=new Ma({antialias:!0,alpha:!0,powerPreference:"high-performance"});Dt.setPixelRatio(Math.min(window.devicePixelRatio||1,2));Dt.setSize(window.innerWidth,window.innerHeight);Dt.setClearColor(0,0);Dt.shadowMap.enabled=!0;Dt.shadowMap.type=fc;Dt.outputColorSpace=Vt;Dt.toneMapping=uc;Dt.toneMappingExposure=1.36;Dt.domElement.setAttribute("aria-label","雨夜のコンビニ街角ジオラマ");Dt.domElement.style.cursor="grab";document.getElementById("stage").appendChild(Dt.domElement);var Tn=new Ta;Tn.background=null;Tn.fog=new ba(528669,.0185);var hn=new Zt(38,window.innerWidth/window.innerHeight,.1,80);hn.position.set(11.85,10.2,16.45);var Ut=new Ka(hn,Dt.domElement);Ut.target.set(-.1,1.1,-.2);Ut.enableDamping=!0;Ut.dampingFactor=.055;Ut.enablePan=!1;Ut.rotateSpeed=.52;Ut.zoomSpeed=.7;Ut.minDistance=8.5;Ut.maxDistance=30;Ut.minPolarAngle=.46;Ut.maxPolarAngle=1.36;Ut.update();var gu=new ja(Dt,{defaultThickness:.0029,defaultColor:[.015,.025,.048],defaultAlpha:.88}),xy=new ka(8362951,1119518,1.18);Tn.add(xy);var Sy=new Va(6387865,.55);Tn.add(Sy);var fn=new Ns(10337769,2.12);fn.position.set(-7.5,11.5,-5.5);fn.target.position.set(.2,.3,.2);fn.castShadow=!0;fn.shadow.mapSize.set(2048,2048);fn.shadow.camera.left=-9.5;fn.shadow.camera.right=9.5;fn.shadow.camera.top=9.5;fn.shadow.camera.bottom=-9.5;fn.shadow.camera.near=.5;fn.shadow.camera.far=32;fn.shadow.bias=-6e-4;fn.shadow.normalBias=.022;Tn.add(fn,fn.target);var io=new Ns(6658496,.78);io.position.set(6,4.8,-8.5);io.target.position.set(-.5,1.1,.2);Tn.add(io,io.target);var so=new Ns(12686185,.22);so.position.set(1.5,2,8);so.target.position.set(0,1,0);Tn.add(so,so.target);function My(){let n=document.createElement("canvas");n.width=1024,n.height=512;let e=n.getContext("2d"),t=e.createLinearGradient(0,0,0,512);t.addColorStop(0,"#0b1424"),t.addColorStop(.38,"#1c2c43"),t.addColorStop(.53,"#26374e"),t.addColorStop(.58,"#0e1620"),t.addColorStop(1,"#03060b"),e.fillStyle=t,e.fillRect(0,0,1024,512),e.filter="blur(18px)";let i=e.createLinearGradient(140,240,480,380);i.addColorStop(0,"rgba(255,189,120,0)"),i.addColorStop(.3,"rgba(255,189,120,0.72)"),i.addColorStop(.72,"rgba(255,145,92,0.5)"),i.addColorStop(1,"rgba(255,199,135,0)"),e.fillStyle=i,e.fillRect(80,280,500,90),e.fillStyle="rgba(90,231,210,0.48)",e.fillRect(700,290,200,24),e.fillStyle="rgba(255,140,177,0.34)",e.fillRect(560,318,110,16),e.fillStyle="rgba(164,216,255,0.24)",e.fillRect(230,252,30,140),e.fillStyle="rgba(255,236,195,0.85)",e.fillRect(360,277,18,18),e.fillRect(422,290,13,13),e.filter="blur(5px)",e.fillStyle="rgba(100,223,210,0.7)",e.fillRect(250,323,420,4),e.fillStyle="rgba(255,188,123,0.55)",e.fillRect(160,341,300,3),e.filter="none",e.fillStyle="rgba(2,5,9,0.8)",e.fillRect(0,365,1024,147);let s=new Is(n);s.colorSpace=Vt,s.mapping=ar;let r=new Cs(Dt);r.compileEquirectangularShader();let a=r.fromEquirectangular(s).texture;return s.dispose(),r.dispose(),a}Tn.environment=My();var Li={scene:Tn,lights:[],updaters:[],puddles:[],rng:Ht(412)},by=eu(Li);Li.puddles=by.puddles;var b2=ou(Li),T2=uu(Li),E2=du(Li);for(let n of Li.lights){let e=new Sr(n.color,n.intensity,n.distance,2);e.position.set(...n.pos),Tn.add(e)}var _u=new Sr(16758899,18,8.2,2);_u.position.set(.7,1.55,2.7);Tn.add(_u);function yu(){if(window.innerWidth/Math.max(1,window.innerHeight)>=1.45)return;let e=Ut.target.clone(),t=hn.position.clone().sub(e).normalize(),i=hn.position.distanceTo(e),s=[[-6.02,0,-6.02],[6.02,0,-6.02],[-6.02,0,6.02],[6.02,0,6.02],[-6.02,-.64,6.02],[6.02,-.64,6.02],[V.left,5.08,V.front],[V.right,5.08,V.front],[V.left,5.08,V.back],[V.right,5.08,V.back],[-6.1,6.35,-5.45],[-5.18,6.35,1.93],[5.72,8.4,-.62],[-5.62,7.45,-5.02],[6.5,4.02,-5.22],[-5.4,4.9,-4.9]].map(([a,o,l])=>new D(a,o,l)),r=i*3;for(let a=i;a<=i*3;a+=.22){hn.position.copy(e).addScaledVector(t,a),hn.lookAt(e),hn.updateMatrixWorld(!0);let o=!0;for(let l of s){let c=l.clone().project(hn);if(Math.abs(c.x)>.93||Math.abs(c.y)>.93){o=!1;break}}if(o){r=a;break}}hn.position.copy(e).addScaledVector(t,r),hn.lookAt(e),Ut.maxDistance=Math.max(Ut.maxDistance,r*1.55),Ut.minDistance=Math.max(6,r*.32),Ut.update()}yu();var Bc=!1,vu=!1;Ut.addEventListener("start",()=>{Bc=!0,vu=!0,Dt.domElement.style.cursor="grabbing"});Ut.addEventListener("end",()=>{Bc=!1,Dt.domElement.style.cursor="grab"});Dt.domElement.addEventListener("pointerleave",()=>{Bc||(Dt.domElement.style.cursor="grab")});Dt.domElement.addEventListener("contextmenu",n=>n.preventDefault());function Ty(){let n=window.innerWidth,e=window.innerHeight;hn.aspect=n/e,hn.updateProjectionMatrix(),Dt.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),Dt.setSize(n,e),gu.setSize(n,e),!vu&&n/e<1.45&&yu();for(let t of Li.updaters)t.resize&&t.resize(n,e)}window.addEventListener("resize",Ty);var Ey=new Wa,pu=0,mu=!1;function Ay(){let n=Math.min(Ey.getDelta(),.05);pu+=n*(vy?.16:1);for(let e of Li.updaters)e.update?.(pu,n);Ut.update(),gu.render(Tn,hn),mu||(mu=!0,document.body.classList.add("ready"))}Dt.setAnimationLoop(Ay);window.addEventListener("keydown",n=>{(n.key==="r"||n.key==="R")&&(hn.position.set(11.85,10.2,16.45),Ut.target.set(-.1,1.1,-.2),Ut.update())});})();
