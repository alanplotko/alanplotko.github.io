if(!self.define){let e,s={};const i=(i,c)=>(i=new URL(i+".js",c).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(c,a)=>{const n=e||("document"in self?document.currentScript.src:"")||location.href;if(s[n])return;let o={};const t=e=>i(e,n),f={module:{uri:n},exports:o,require:t};s[n]=Promise.all(c.map((e=>f[e]||t(e)))).then((e=>(a(...e),o)))}}define(["./workbox-d270ae14"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/css/style.css",revision:"250d1205f3e27ddef9a4f626c4d89092"},{url:"assets/images/apple-touch-icon.png",revision:"acf4e22a30aa599a82c9b2151982bfe1"},{url:"assets/images/icon-192-maskable.png",revision:"6bfe9e823dc0e3482c79902bf55a85b9"},{url:"assets/images/icon-192.png",revision:"62bd724be8e9c8e13a1a54b4604ad6ec"},{url:"assets/images/icon-512-maskable.png",revision:"693d46eae016ad87e40f2c067ca4cee4"},{url:"assets/images/icon-512.png",revision:"537e8bef80c7a0ebf1e93d753c7a6137"},{url:"assets/json/particlesjs-config.json",revision:"c7c3b4bfa4fcfbbb03ca7730eaa564f8"},{url:"assets/pdf/resume.pdf",revision:"fd14c65c57f1ec77a9772bb2f2e5fe58"},{url:"assets/svg/symbol-defs.svg",revision:"90accc847758491c4966f0af22bf3594"},{url:"favicon.ico",revision:"8e95c6f6a709716d278a5e09d2ebde43"},{url:"index.html",revision:"39425ad5ffa887af65cf3d972f70ab32"},{url:"manifest.json",revision:"a04db1a801c5b7740703cd613a735fdb"}],{}),e.registerRoute(/^https?:\/\/cdnjs.cloudflare.com/,new e.StaleWhileRevalidate,"GET"),e.registerRoute(/^https?:\/\/fonts.googleapis.com/,new e.StaleWhileRevalidate,"GET"),e.registerRoute(/^https?:\/\/fonts.gstatic.com/,new e.StaleWhileRevalidate,"GET")}));
//# sourceMappingURL=sw.js.map
