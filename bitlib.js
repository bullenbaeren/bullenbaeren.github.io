/* =====================================================================
   bitlib.js – echte Bitcoin-Kryptografie für die Profi-Welten von Satsland
   SHA-256 (mit Runden-Protokoll), RIPEMD-160, secp256k1, ECDSA, Schnorr (BIP340),
   BIP39, BIP32, Base58Check, Bech32/Bech32m. Alles läuft nur im Browser.
   ===================================================================== */
const Bit = (() => {
  "use strict";
  const enc = new TextEncoder();
  const utf8 = s => enc.encode(s);
  const hex = u => Array.from(u, b => b.toString(16).padStart(2, "0")).join("");
  const unhex = h => new Uint8Array((h.match(/../g) || []).map(x => parseInt(x, 16)));
  const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a){ o.set(x, i); i += x.length; } return o; };
  const rand = n => crypto.getRandomValues(new Uint8Array(n));

  // ---------- SHA-256 mit Protokoll jeder Runde ----------
  const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const IV = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const ror = (x, n) => (x >>> n) | (x << (32 - n));
  function pad(m){
    const l = m.length, n = ((l + 9 + 63) >> 6) << 6, p = new Uint8Array(n); p.set(m); p[l] = 0x80;
    const bits = l * 8; for (let i = 0; i < 8; i++) p[n - 1 - i] = Math.floor(bits / 2 ** (8 * i)) & 255;
    return p;
  }
  function sha256(m, trace){
    const p = pad(m), H = IV.slice(), W = new Uint32Array(64), T = trace ? {padded: p, blocks: []} : null;
    for (let o = 0; o < p.length; o += 64){
      for (let i = 0; i < 16; i++) W[i] = (p[o+4*i] << 24 | p[o+4*i+1] << 16 | p[o+4*i+2] << 8 | p[o+4*i+3]) >>> 0;
      for (let i = 16; i < 64; i++){
        const s0 = ror(W[i-15], 7) ^ ror(W[i-15], 18) ^ (W[i-15] >>> 3), s1 = ror(W[i-2], 17) ^ ror(W[i-2], 19) ^ (W[i-2] >>> 10);
        W[i] = (W[i-16] + s0 + W[i-7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H; const R = [];
      for (let i = 0; i < 64; i++){
        const S1 = ror(e, 6) ^ ror(e, 11) ^ ror(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
        const S0 = ror(a, 2) ^ ror(a, 13) ^ ror(a, 22), maj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        if (T) R.push({v: [a, b, c, d, e, f, g, h], S1: S1 >>> 0, ch: ch >>> 0, S0: S0 >>> 0, maj: maj >>> 0, t1, t2});
      }
      const before = H.slice();
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
      if (T) T.blocks.push({W: Array.from(W), R, before, after: H.slice()});
    }
    const out = new Uint8Array(32); H.forEach((x, i) => { out[4*i] = x >>> 24; out[4*i+1] = x >>> 16; out[4*i+2] = x >>> 8; out[4*i+3] = x; });
    if (T){ T.out = out; return T; }
    return out;
  }
  const sha256d = m => sha256(sha256(m));

  // ---------- RIPEMD-160 ----------
  const RL = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13];
  const RR = [5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11];
  const SL = [11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
  const SR = [8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];
  const KL = [0, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e], KR = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0];
  const rol = (x, n) => (x << n) | (x >>> (32 - n));
  const F = (j, x, y, z) => j === 0 ? x ^ y ^ z : j === 1 ? (x & y) | (~x & z) : j === 2 ? (x | ~y) ^ z : j === 3 ? (x & z) | (y & ~z) : x ^ (y | ~z);
  function ripemd160(m){
    const l = m.length, n = ((l + 9 + 63) >> 6) << 6, p = new Uint8Array(n); p.set(m); p[l] = 0x80;
    const bits = l * 8; for (let i = 0; i < 8; i++) p[n - 8 + i] = Math.floor(bits / 2 ** (8 * i)) & 255;
    let h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
    for (let o = 0; o < n; o += 64){
      const X = []; for (let i = 0; i < 16; i++) X[i] = p[o+4*i] | p[o+4*i+1] << 8 | p[o+4*i+2] << 16 | p[o+4*i+3] << 24;
      let [al, bl, cl, dl, el] = h, [ar, br, cr, dr, er] = h;
      for (let j = 0; j < 80; j++){
        const g = j >> 4;
        let t = (rol((al + F(g, bl, cl, dl) + X[RL[j]] + KL[g]) | 0, SL[j]) + el) | 0; al = el; el = dl; dl = rol(cl, 10); cl = bl; bl = t;
        t = (rol((ar + F(4 - g, br, cr, dr) + X[RR[j]] + KR[g]) | 0, SR[j]) + er) | 0; ar = er; er = dr; dr = rol(cr, 10); cr = br; br = t;
      }
      const t = (h[1] + cl + dr) | 0; h[1] = (h[2] + dl + er) | 0; h[2] = (h[3] + el + ar) | 0; h[3] = (h[4] + al + br) | 0; h[4] = (h[0] + bl + cr) | 0; h[0] = t;
    }
    const out = new Uint8Array(20); h.forEach((x, i) => { for (let k = 0; k < 4; k++) out[4*i+k] = x >>> (8*k); });
    return out;
  }
  const hash160 = m => ripemd160(sha256(m));

  // ---------- HMAC-SHA512 und PBKDF2 (Browser-Krypto, asynchron) ----------
  async function hmac512(key, data){
    const k = await crypto.subtle.importKey("raw", key, {name: "HMAC", hash: "SHA-512"}, false, ["sign"]);
    return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
  }
  async function pbkdf2(pass, salt, iter){
    const k = await crypto.subtle.importKey("raw", pass, "PBKDF2", false, ["deriveBits"]);
    return new Uint8Array(await crypto.subtle.deriveBits({name: "PBKDF2", salt, iterations: iter, hash: "SHA-512"}, k, 512));
  }

  // ---------- secp256k1: y² = x³ + 7 über einem riesigen Primzahlkörper ----------
  const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
  const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
  const G = {x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n, y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n};
  const mod = (a, m = P) => { const r = a % m; return r < 0n ? r + m : r; };
  function inv(a, m = P){ let [o, r] = [mod(a, m), m], [s, t] = [1n, 0n]; while (r){ const q = o / r; [o, r] = [r, o - q * r]; [s, t] = [t, s - q * t]; } return mod(s, m); }
  function add(A, B){
    if (!A) return B; if (!B) return A;
    if (A.x === B.x){ if (mod(A.y + B.y) === 0n) return null; const l = mod(3n * A.x * A.x * inv(2n * A.y)), x = mod(l * l - 2n * A.x); return {x, y: mod(l * (A.x - x) - A.y)}; }
    const l = mod((B.y - A.y) * inv(B.x - A.x)), x = mod(l * l - A.x - B.x); return {x, y: mod(l * (A.x - x) - A.y)};
  }
  const neg = A => A && {x: A.x, y: mod(-A.y)};
  function mul(k, A = G){ let R = null, Q = A; k = mod(k, N); while (k > 0n){ if (k & 1n) R = add(R, Q); Q = add(Q, Q); k >>= 1n; } return R; }
  const big = u => u.length ? BigInt("0x" + hex(u)) : 0n;
  const b32 = n => unhex(n.toString(16).padStart(64, "0"));
  const pubC = A => cat(new Uint8Array([A.y & 1n ? 3 : 2]), b32(A.x));
  const pubU = A => cat(new Uint8Array([4]), b32(A.x), b32(A.y));
  function liftX(x){ const c = mod(x ** 3n + 7n); let y = 1n, b = c, e = (P + 1n) / 4n; while (e){ if (e & 1n) y = mod(y * b); b = mod(b * b); e >>= 1n; } if (mod(y * y) !== c) return null; return {x, y: y & 1n ? P - y : y}; }
  const tagged = (tag, ...m) => { const t = sha256(utf8(tag)); return sha256(cat(t, t, ...m)); };

  // ---------- Signaturen ----------
  function ecdsaSign(d, z){
    for (;;){
      const k = mod(big(rand(32)), N); if (!k) continue;
      const r = mod(mul(k).x, N); if (!r) continue;
      let s = mod(inv(k, N) * (z + r * d), N); if (!s) continue;
      if (s > N / 2n) s = N - s;            // „low S“ wie in Bitcoin vorgeschrieben
      return {r, s};
    }
  }
  function ecdsaVerify(Q, z, {r, s}){ const w = inv(s, N), X = add(mul(mod(z * w, N)), mul(mod(r * w, N), Q)); return !!X && mod(X.x, N) === r; }
  function der({r, s}){
    const e = n => { let b = unhex(n.toString(16).padStart(64, "0")); let i = 0; while (i < 31 && b[i] === 0) i++; b = b.slice(i); if (b[0] & 0x80) b = cat(new Uint8Array([0]), b); return cat(new Uint8Array([2, b.length]), b); };
    const body = cat(e(r), e(s)); return cat(new Uint8Array([0x30, body.length]), body);
  }
  function schnorrSign(d0, m, aux = rand(32)){
    const Pt = mul(d0), d = Pt.y & 1n ? N - d0 : d0;
    const t = b32(d ^ big(tagged("BIP0340/aux", aux)));
    const k0 = mod(big(tagged("BIP0340/nonce", t, b32(Pt.x), m)), N), R = mul(k0), k = R.y & 1n ? N - k0 : k0;
    const e = mod(big(tagged("BIP0340/challenge", b32(R.x), b32(Pt.x), m)), N);
    return cat(b32(R.x), b32(mod(k + e * d, N)));
  }
  function schnorrVerify(px, m, sig){
    const Pt = liftX(big(px)); if (!Pt) return false;
    const r = big(sig.slice(0, 32)), s = big(sig.slice(32)); if (r >= P || s >= N) return false;
    const e = mod(big(tagged("BIP0340/challenge", sig.slice(0, 32), px, m)), N);
    const R = add(mul(s), neg(mul(e, Pt))); return !!R && !(R.y & 1n) && R.x === r;
  }

  // ---------- Base58Check ----------
  const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  function b58(u){ let n = big(u), s = ""; while (n > 0n){ s = B58[Number(n % 58n)] + s; n /= 58n; } for (const b of u){ if (b) break; s = "1" + s; } return s; }
  const b58check = u => b58(cat(u, sha256d(u).slice(0, 4)));
  function b58decode(str){
    let n = 0n; for (const c of str){ const i = B58.indexOf(c); if (i < 0) return {ok: false, bad: c}; n = n * 58n + BigInt(i); }
    let h = n.toString(16); if (h.length % 2) h = "0" + h; if (n === 0n) h = "";
    let z = 0; for (const c of str){ if (c !== "1") break; z++; }
    const u = cat(new Uint8Array(z), unhex(h)), body = u.slice(0, -4), sum = u.slice(-4), want = sha256d(body).slice(0, 4);
    return {ok: u.length > 4 && hex(sum) === hex(want), body, sum: hex(sum), want: hex(want)};
  }

  // ---------- Bech32 / Bech32m ----------
  const CH = "qpzry9x8gf2tvdw0s3jn54khce6mua7l", GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  function polymod(v){ let c = 1; for (const x of v){ const t = c >>> 25; c = ((c & 0x1ffffff) << 5) ^ x; for (let i = 0; i < 5; i++) if ((t >>> i) & 1) c ^= GEN[i]; } return c >>> 0; }
  const hrpX = h => [...[...h].map(c => c.charCodeAt(0) >> 5), 0, ...[...h].map(c => c.charCodeAt(0) & 31)];
  function bits(data, from, to, padIt = true){ let acc = 0, b = 0; const out = [], max = (1 << to) - 1; for (const v of data){ acc = (acc << from) | v; b += from; while (b >= to){ b -= to; out.push((acc >> b) & max); } } if (padIt && b) out.push((acc << (to - b)) & max); else if (!padIt && (b >= from || ((acc << (to - b)) & max))) return null; return out; }
  function segwit(hrp, ver, prog){
    const d = [ver, ...bits(prog, 8, 5)], C = ver ? 0x2bc830a3 : 1, pm = polymod([...hrpX(hrp), ...d, 0, 0, 0, 0, 0, 0]) ^ C;
    const sum = []; for (let i = 0; i < 6; i++) sum.push((pm >>> (5 * (5 - i))) & 31);
    return hrp + "1" + [...d, ...sum].map(x => CH[x]).join("");
  }
  function segwitDecode(a){
    const s = a.toLowerCase(), p = s.lastIndexOf("1"); if (p < 1) return {ok: false, err: "Trennzeichen „1“ fehlt"};
    const hrp = s.slice(0, p), d = []; for (const c of s.slice(p + 1)){ const i = CH.indexOf(c); if (i < 0) return {ok: false, err: `Zeichen „${c}“ gibt es in Bech32 nicht`, bad: c}; d.push(i); }
    if (d.length < 7) return {ok: false, err: "zu kurz"};
    const pm = polymod([...hrpX(hrp), ...d]), ver = d[0], want = ver ? 0x2bc830a3 : 1;
    if (pm !== want) return {ok: false, err: "Prüfsumme passt nicht", hrp};
    const prog = bits(d.slice(1, -6), 5, 8, false); return prog ? {ok: true, hrp, ver, prog: new Uint8Array(prog)} : {ok: false, err: "ungültige Daten"};
  }
  // Findet bei einem Tippfehler die Stelle (alle Zeichen durchprobieren, Bech32 entdeckt bis zu 4 Fehler sicher)
  function segwitFix(a){
    const s = a.toLowerCase(), p = s.lastIndexOf("1");
    for (let i = p + 1; i < s.length; i++) for (const c of CH){ if (c === s[i]) continue; const t = s.slice(0, i) + c + s.slice(i + 1); if (segwitDecode(t).ok) return {i, c, fixed: t}; }
    return null;
  }

  // ---------- Adressen ----------
  const p2pkh = pub => b58check(cat(new Uint8Array([0]), hash160(pub)));
  const p2shP2wpkh = pub => b58check(cat(new Uint8Array([5]), hash160(cat(new Uint8Array([0, 20]), hash160(pub)))));
  const p2wpkh = pub => segwit("bc", 0, hash160(pub));
  function p2tr(Pt){
    const I = Pt.y & 1n ? neg(Pt) : Pt, t = big(tagged("TapTweak", b32(I.x))), Q = add(I, mul(t));
    return segwit("bc", 1, b32(Q.x));
  }

  // ---------- BIP39 ----------
  const WORDS = "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety any apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact artist artwork ask aspect assault asset assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis baby bachelor bacon badge bag balance balcony ball bamboo banana banner bar barely bargain barrel base basic basket battle beach bean beauty because become beef before begin behave behind believe below belt bench benefit best betray better between beyond bicycle bid bike bind biology bird birth bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb bone bonus book boost border boring borrow boss bottom bounce box boy bracket brain brand brass brave bread breeze brick bridge brief bright bring brisk broccoli broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp can canal cancel candy cannon canoe canvas canyon capable capital captain car carbon card cargo carpet carry cart case cash casino castle casual cat catalog catch category cattle caught cause caution cave ceiling celery cement census century cereal certain chair chalk champion change chaos chapter charge chase chat cheap check cheese chef cherry chest chicken chief child chimney choice choose chronic chuckle chunk churn cigar cinnamon circle citizen city civil claim clap clarify claw clay clean clerk clever click client cliff climb clinic clip clock clog close cloth cloud clown club clump cluster clutch coach coast coconut code coffee coil coin collect color column combine come comfort comic common company concert conduct confirm congress connect consider control convince cook cool copper copy coral core corn correct cost cotton couch country couple course cousin cover coyote crack cradle craft cram crane crash crater crawl crazy cream credit creek crew cricket crime crisp critic crop cross crouch crowd crucial cruel cruise crumble crunch crush cry crystal cube culture cup cupboard curious current curtain curve cushion custom cute cycle dad damage damp dance danger daring dash daughter dawn day deal debate debris decade december decide decline decorate decrease deer defense define defy degree delay deliver demand demise denial dentist deny depart depend deposit depth deputy derive describe desert design desk despair destroy detail detect develop device devote diagram dial diamond diary dice diesel diet differ digital dignity dilemma dinner dinosaur direct dirt disagree discover disease dish dismiss disorder display distance divert divide divorce dizzy doctor document dog doll dolphin domain donate donkey donor door dose double dove draft dragon drama drastic draw dream dress drift drill drink drip drive drop drum dry duck dumb dune during dust dutch duty dwarf dynamic eager eagle early earn earth easily east easy echo ecology economy edge edit educate effort egg eight either elbow elder electric elegant element elephant elevator elite else embark embody embrace emerge emotion employ empower empty enable enact end endless endorse enemy energy enforce engage engine enhance enjoy enlist enough enrich enroll ensure enter entire entry envelope episode equal equip era erase erode erosion error erupt escape essay essence estate eternal ethics evidence evil evoke evolve exact example excess exchange excite exclude excuse execute exercise exhaust exhibit exile exist exit exotic expand expect expire explain expose express extend extra eye eyebrow fabric face faculty fade faint faith fall false fame family famous fan fancy fantasy farm fashion fat fatal father fatigue fault favorite feature february federal fee feed feel female fence festival fetch fever few fiber fiction field figure file film filter final find fine finger finish fire firm first fiscal fish fit fitness fix flag flame flash flat flavor flee flight flip float flock floor flower fluid flush fly foam focus fog foil fold follow food foot force forest forget fork fortune forum forward fossil foster found fox fragile frame frequent fresh friend fringe frog front frost frown frozen fruit fuel fun funny furnace fury future gadget gain galaxy gallery game gap garage garbage garden garlic garment gas gasp gate gather gauge gaze general genius genre gentle genuine gesture ghost giant gift giggle ginger giraffe girl give glad glance glare glass glide glimpse globe gloom glory glove glow glue goat goddess gold good goose gorilla gospel gossip govern gown grab grace grain grant grape grass gravity great green grid grief grit grocery group grow grunt guard guess guide guilt guitar gun gym habit hair half hammer hamster hand happy harbor hard harsh harvest hat have hawk hazard head health heart heavy hedgehog height hello helmet help hen hero hidden high hill hint hip hire history hobby hockey hold hole holiday hollow home honey hood hope horn horror horse hospital host hotel hour hover hub huge human humble humor hundred hungry hunt hurdle hurry hurt husband hybrid ice icon idea identify idle ignore ill illegal illness image imitate immense immune impact impose improve impulse inch include income increase index indicate indoor industry infant inflict inform inhale inherit initial inject injury inmate inner innocent input inquiry insane insect inside inspire install intact interest into invest invite involve iron island isolate issue item ivory jacket jaguar jar jazz jealous jeans jelly jewel job join joke journey joy judge juice jump jungle junior junk just kangaroo keen keep ketchup key kick kid kidney kind kingdom kiss kit kitchen kite kitten kiwi knee knife knock know lab label labor ladder lady lake lamp language laptop large later latin laugh laundry lava law lawn lawsuit layer lazy leader leaf learn leave lecture left leg legal legend leisure lemon lend length lens leopard lesson letter level liar liberty library license life lift light like limb limit link lion liquid list little live lizard load loan lobster local lock logic lonely long loop lottery loud lounge love loyal lucky luggage lumber lunar lunch luxury lyrics machine mad magic magnet maid mail main major make mammal man manage mandate mango mansion manual maple marble march margin marine market marriage mask mass master match material math matrix matter maximum maze meadow mean measure meat mechanic medal media melody melt member memory mention menu mercy merge merit merry mesh message metal method middle midnight milk million mimic mind minimum minor minute miracle mirror misery miss mistake mix mixed mixture mobile model modify mom moment monitor monkey monster month moon moral more morning mosquito mother motion motor mountain mouse move movie much muffin mule multiply muscle museum mushroom music must mutual myself mystery myth naive name napkin narrow nasty nation nature near neck need negative neglect neither nephew nerve nest net network neutral never news next nice night noble noise nominee noodle normal north nose notable note nothing notice novel now nuclear number nurse nut oak obey object oblige obscure observe obtain obvious occur ocean october odor off offer office often oil okay old olive olympic omit once one onion online only open opera opinion oppose option orange orbit orchard order ordinary organ orient original orphan ostrich other outdoor outer output outside oval oven over own owner oxygen oyster ozone pact paddle page pair palace palm panda panel panic panther paper parade parent park parrot party pass patch path patient patrol pattern pause pave payment peace peanut pear peasant pelican pen penalty pencil people pepper perfect permit person pet phone photo phrase physical piano picnic picture piece pig pigeon pill pilot pink pioneer pipe pistol pitch pizza place planet plastic plate play please pledge pluck plug plunge poem poet point polar pole police pond pony pool popular portion position possible post potato pottery poverty powder power practice praise predict prefer prepare present pretty prevent price pride primary print priority prison private prize problem process produce profit program project promote proof property prosper protect proud provide public pudding pull pulp pulse pumpkin punch pupil puppy purchase purity purpose purse push put puzzle pyramid quality quantum quarter question quick quit quiz quote rabbit raccoon race rack radar radio rail rain raise rally ramp ranch random range rapid rare rate rather raven raw razor ready real reason rebel rebuild recall receive recipe record recycle reduce reflect reform refuse region regret regular reject relax release relief rely remain remember remind remove render renew rent reopen repair repeat replace report require rescue resemble resist resource response result retire retreat return reunion reveal review reward rhythm rib ribbon rice rich ride ridge rifle right rigid ring riot ripple risk ritual rival river road roast robot robust rocket romance roof rookie room rose rotate rough round route royal rubber rude rug rule run runway rural sad saddle sadness safe sail salad salmon salon salt salute same sample sand satisfy satoshi sauce sausage save say scale scan scare scatter scene scheme school science scissors scorpion scout scrap screen script scrub sea search season seat second secret section security seed seek segment select sell seminar senior sense sentence series service session settle setup seven shadow shaft shallow share shed shell sheriff shield shift shine ship shiver shock shoe shoot shop short shoulder shove shrimp shrug shuffle shy sibling sick side siege sight sign silent silk silly silver similar simple since sing siren sister situate six size skate sketch ski skill skin skirt skull slab slam sleep slender slice slide slight slim slogan slot slow slush small smart smile smoke smooth snack snake snap sniff snow soap soccer social sock soda soft solar soldier solid solution solve someone song soon sorry sort soul sound soup source south space spare spatial spawn speak special speed spell spend sphere spice spider spike spin spirit split spoil sponsor spoon sport spot spray spread spring spy square squeeze squirrel stable stadium staff stage stairs stamp stand start state stay steak steel stem step stereo stick still sting stock stomach stone stool story stove strategy street strike strong struggle student stuff stumble style subject submit subway success such sudden suffer sugar suggest suit summer sun sunny sunset super supply supreme sure surface surge surprise surround survey suspect sustain swallow swamp swap swarm swear sweet swift swim swing switch sword symbol symptom syrup system table tackle tag tail talent talk tank tape target task taste tattoo taxi teach team tell ten tenant tennis tent term test text thank that theme then theory there they thing this thought three thrive throw thumb thunder ticket tide tiger tilt timber time tiny tip tired tissue title toast tobacco today toddler toe together toilet token tomato tomorrow tone tongue tonight tool tooth top topic topple torch tornado tortoise toss total tourist toward tower town toy track trade traffic tragic train transfer trap trash travel tray treat tree trend trial tribe trick trigger trim trip trophy trouble truck true truly trumpet trust truth try tube tuition tumble tuna tunnel turkey turn turtle twelve twenty twice twin twist two type typical ugly umbrella unable unaware uncle uncover under undo unfair unfold unhappy uniform unique unit universe unknown unlock until unusual unveil update upgrade uphold upon upper upset urban urge usage use used useful useless usual utility vacant vacuum vague valid valley valve van vanish vapor various vast vault vehicle velvet vendor venture venue verb verify version very vessel veteran viable vibrant vicious victory video view village vintage violin virtual virus visa visit visual vital vivid vocal voice void volcano volume vote voyage wage wagon wait walk wall walnut want warfare warm warrior wash wasp waste water wave way wealth weapon wear weasel weather web wedding weekend weird welcome west wet whale what wheat wheel when where whip whisper wide width wife wild will win window wine wing wink winner winter wire wisdom wise wish witness wolf woman wonder wood wool word work world worry worth wrap wreck wrestle wrist write wrong yard year yellow you young youth zebra zero zone zoo".split(" ");
  function toBits(u){ return Array.from(u, b => b.toString(2).padStart(8, "0")).join(""); }
  function mnemonic(ent){
    const b = toBits(ent) + toBits(sha256(ent)).slice(0, ent.length / 4);
    return b.match(/.{11}/g).map(x => WORDS[parseInt(x, 2)]);
  }
  function checkMnemonic(words){
    const idx = words.map(w => WORDS.indexOf(w)); if (idx.some(i => i < 0)) return {ok: false, err: "unbekanntes Wort", bad: words[idx.indexOf(-1)]};
    if (![12, 15, 18, 21, 24].includes(words.length)) return {ok: false, err: "falsche Wortanzahl"};
    const b = idx.map(i => i.toString(2).padStart(11, "0")).join(""), cs = words.length / 3, eb = b.slice(0, -cs);
    const ent = new Uint8Array(eb.match(/.{8}/g).map(x => parseInt(x, 2)));
    const want = toBits(sha256(ent)).slice(0, cs);
    return {ok: want === b.slice(-cs), ent, have: b.slice(-cs), want};
  }
  const seedOf = (words, pass = "") => pbkdf2(utf8(words.join(" ").normalize("NFKD")), utf8(("mnemonic" + pass).normalize("NFKD")), 2048);

  // ---------- BIP32 ----------
  async function master(seed){ const I = await hmac512(utf8("Bitcoin seed"), seed); return {k: big(I.slice(0, 32)), c: I.slice(32)}; }
  async function child({k, c}, i){
    const hard = i >= 0x80000000, ib = new Uint8Array([i >>> 24, i >>> 16 & 255, i >>> 8 & 255, i & 255]);
    const data = hard ? cat(new Uint8Array([0]), b32(k), ib) : cat(pubC(mul(k)), ib);
    const I = await hmac512(c, data); return {k: mod(big(I.slice(0, 32)) + k, N), c: I.slice(32)};
  }
  async function derive(seed, path){
    let n = await master(seed);
    for (const p of path.split("/").slice(1)){ const h = p.endsWith("'"); n = await child(n, (parseInt(p) + (h ? 0x80000000 : 0)) >>> 0); }
    return n;
  }

  return {utf8, hex, unhex, cat, rand, sha256, sha256d, ripemd160, hash160, hmac512, pbkdf2, P, N, G, mod, inv, add, neg, mul, big, b32, pubC, pubU, liftX, tagged,
    ecdsaSign, ecdsaVerify, der, schnorrSign, schnorrVerify, B58, b58, b58check, b58decode, CH, segwit, segwitDecode, segwitFix, p2pkh, p2shP2wpkh, p2wpkh, p2tr,
    WORDS, mnemonic, checkMnemonic, seedOf, master, child, derive, toBits};
})();
if (typeof module !== "undefined") module.exports = Bit;
