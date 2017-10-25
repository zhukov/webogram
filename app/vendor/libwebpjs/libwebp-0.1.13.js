var WebPZlib = (function WebPZlib() {
    var dd = (function() {
        var o = 32768;
        var r = 0;
        var s = 1;
        var t = 2;
        var u = 6;
        var x = true;
        var y = 32768;
        var z = 64;
        var A = 1024 * 8;
        var B = 2 * o;
        var C = 3;
        var D = 258;
        var E = 16;
        var F = 0x2000;
        var G = 13;
        if (F > y) alert("error: zip_INBUFSIZ is too small");
        if ((o << 1) > (1 << E)) alert("error: zip_WSIZE is too large");
        if (G > E - 1) alert("error: zip_HASH_BITS is too large");
        if (G < 8 || D != 258) alert("error: Code too clever");
        var H = F;
        var I = 1 << G;
        var J = I - 1;
        var K = o - 1;
        var L = 0;
        var M = 4096;
        var N = D + C + 1;
        var O = o - N;
        var P = 1;
        var Q = 15;
        var R = 7;
        var S = 29;
        var T = 256;
        var U = 256;
        var V = T + 1 + S;
        var W = 30;
        var X = 19;
        var Y = 16;
        var Z = 17;
        var de = 18;
        var df = 2 * V + 1;
        var dg = parseInt((G + C - 1) / C, 10);
        var dh;
        var di, zip_qtail;
        var dj;
        var dk = null;
        var dl, zip_outoff;
        var dm;
        var dn;
        var dp;
        var dq;
        var dr;
        var ds;
        var dt;
        var du;
        var dv;
        var dw;
        var dx;
        var dy;
        var dz;
        var dA;
        var dB;
        var dC;
        var dD;
        var dE;
        var dF;
        var dG;
        var dH;
        var dI;
        var dJ;
        var dK;
        var dL;
        var dM;
        var dN;
        var dO;
        var dP;
        var dQ;
        var dR;
        var dS;
        var dT;
        var dU;
        var dV;
        var dW;
        var dX;
        var dY;
        var dZ;
        var ea;
        var eb;
        var ec;
        var ed;
        var ee;
        var ef;
        var eg;
        var eh;
        var ei;
        var ej;
        var ek;
        var el = function() {
            this.fc = 0;
            this.dl = 0
        };
        var em = function() {
            this.dyn_tree = null;
            this.static_tree = null;
            this.extra_bits = null;
            this.extra_base = 0;
            this.elems = 0;
            this.max_length = 0;
            this.max_code = 0
        };
        var en = function(a, b, c, d) {
            this.good_length = a;
            this.max_lazy = b;
            this.nice_length = c;
            this.max_chain = d
        };
        var eo = function() {
            this.next = null;
            this.len = 0;
            this.ptr = new Array(A);
            this.off = 0
        };
        var ep = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
        var eq = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
        var er = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7];
        var es = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
        var et = [new en(0, 0, 0, 0), new en(4, 4, 8, 4), new en(4, 5, 16, 8), new en(4, 6, 32, 32), new en(4, 4, 16, 16), new en(8, 16, 32, 32), new en(8, 16, 128, 128), new en(8, 32, 128, 256), new en(32, 128, 258, 1024), new en(32, 258, 258, 4096)];
        var eu = function(a) {
            var i;
            if (!a) a = u;
            else if (a < 1) a = 1;
            else if (a > 9) a = 9;
            dH = a;
            dj = false;
            dD = false;
            if (dk != null) return;
            dh = di = zip_qtail = null;
            dk = new Array(A);
            dn = new Array(B);
            dp = new Array(H);
            dq = new Array(y + z);
            dr = new Array(1 << E);
            dK = new Array(df);
            for (i = 0; i < df; i++) dK[i] = new el();
            dL = new Array(2 * W + 1);
            for (i = 0; i < 2 * W + 1; i++) dL[i] = new el();
            dM = new Array(V + 2);
            for (i = 0; i < V + 2; i++) dM[i] = new el();
            dN = new Array(W);
            for (i = 0; i < W; i++) dN[i] = new el();
            dO = new Array(2 * X + 1);
            for (i = 0; i < 2 * X + 1; i++) dO[i] = new el();
            dP = new em();
            dQ = new em();
            dR = new em();
            dS = new Array(Q + 1);
            dT = new Array(2 * V + 1);
            dW = new Array(2 * V + 1);
            dX = new Array(D - C + 1);
            dY = new Array(512);
            dZ = new Array(S);
            ea = new Array(W);
            eb = new Array(parseInt(F / 8, 10))
        };
        var ev = function() {
            dh = di = zip_qtail = null;
            dk = null;
            dn = null;
            dp = null;
            dq = null;
            dr = null;
            dK = null;
            dL = null;
            dM = null;
            dN = null;
            dO = null;
            dP = null;
            dQ = null;
            dR = null;
            dS = null;
            dT = null;
            dW = null;
            dX = null;
            dY = null;
            dZ = null;
            ea = null;
            eb = null
        };
        var ew = function(p) {
            p.next = dh;
            dh = p
        };
        var ex = function() {
            var p;
            if (dh != null) {
                p = dh;
                dh = dh.next
            } else p = new eo();
            p.next = null;
            p.len = p.off = 0;
            return p
        };
        var ey = function(i) {
            return dr[o + i]
        };
        var ez = function(i, a) {
            return dr[o + i] = a
        };
        var eA = function(c) {
            dk[zip_outoff + dl++] = c;
            if (zip_outoff + dl == A) fg()
        };
        var eB = function(w) {
            w &= 0xffff;
            if (zip_outoff + dl < A - 2) {
                dk[zip_outoff + dl++] = (w & 0xff);
                dk[zip_outoff + dl++] = (w >>> 8)
            } else {
                eA(w & 0xff);
                eA(w >>> 8)
            }
        };
        var eC = function() {
            dv = ((dv << dg) ^ (dn[dB + C - 1] & 0xff)) & J;
            dw = ey(dv);
            dr[dB & K] = dw;
            ez(dv, dB)
        };
        var eD = function(c, a) {
            fd(a[c].fc, a[c].dl)
        };
        var eE = function(a) {
            return (a < 256 ? dY[a] : dY[256 + (a >> 7)]) & 0xff
        };
        var eF = function(a, n, m) {
            return a[n].fc < a[m].fc || (a[n].fc == a[m].fc && dW[n] <= dW[m])
        };
        var eG = function(a, b, n) {
            var i;
            var l = ej.length;
            for (i = 0; i < n && ek < l; i += 1) {
                a[b + i] = ej[ek++]
            }
            return i
        };
        var eH = function() {
            var j;
            for (j = 0; j < I; j++) dr[o + j] = 0;
            dG = et[dH].max_lazy;
            dI = et[dH].good_length;
            if (!x) dJ = et[dH].nice_length;
            dF = et[dH].max_chain;
            dB = 0;
            du = 0;
            dE = eG(dn, 0, 2 * o);
            if (dE <= 0) {
                dD = true;
                dE = 0;
                return
            }
            dD = false;
            while (dE < N && !dD) eJ();
            dv = 0;
            for (j = 0; j < C - 1; j++) {
                dv = ((dv << dg) ^ (dn[j] & 0xff)) & J
            }
        };
        var eI = function(a) {
            var b = dF;
            var c = dB;
            var d;
            var e;
            var f = dA;
            var g = (dB > O ? dB - O : L);
            var h = dB + D;
            var i = dn[c + f - 1];
            var j = dn[c + f];
            if (dA >= dI) b >>= 2;
            do {
                d = a;
                if (dn[d + f] != j || dn[d + f - 1] != i || dn[d] != dn[c] || dn[++d] != dn[c + 1]) {
                    continue
                }
                c += 2;
                d++;
                do {} while (dn[++c] == dn[++d] && dn[++c] == dn[++d] && dn[++c] == dn[++d] && dn[++c] == dn[++d] && dn[++c] == dn[++d] && dn[++c] == dn[++d] && dn[++c] == dn[++d] && dn[++c] == dn[++d] && c < h);
                e = D - (h - c);
                c = h - D;
                if (e > f) {
                    dC = a;
                    f = e;
                    if (x) {
                        if (e >= D) break
                    } else {
                        if (e >= dJ) break
                    }
                    i = dn[c + f - 1];
                    j = dn[c + f]
                }
            } while ((a = dr[a & K]) > g && --b != 0);
            return f
        };
        var eJ = function() {
            var n, m;
            var a = B - dE - dB;
            if (a == -1) {
                a--
            } else if (dB >= o + O) {
                for (n = 0; n < o; n++) dn[n] = dn[n + o];
                dC -= o;
                dB -= o;
                du -= o;
                for (n = 0; n < I; n++) {
                    m = ey(n);
                    ez(n, m >= o ? m - o : L)
                }
                for (n = 0; n < o; n++) {
                    m = dr[n];
                    dr[n] = (m >= o ? m - o : L)
                }
                a += o
            }
            if (!dD) {
                n = eG(dn, dB + dE, a);
                if (n <= 0) dD = true;
                else dE += n
            }
        };
        var eK = function() {
            while (dE != 0 && di == null) {
                var a;
                eC();
                if (dw != L && dB - dw <= O) {
                    dz = eI(dw);
                    if (dz > dE) dz = dE
                }
                if (dz >= C) {
                    a = fa(dB - dC, dz - C);
                    dE -= dz;
                    if (dz <= dG) {
                        dz--;
                        do {
                            dB++;
                            eC()
                        } while (--dz != 0);
                        dB++
                    } else {
                        dB += dz;
                        dz = 0;
                        dv = dn[dB] & 0xff;
                        dv = ((dv << dg) ^ (dn[dB + 1] & 0xff)) & J
                    }
                } else {
                    a = fa(0, dn[dB] & 0xff);
                    dE--;
                    dB++
                }
                if (a) {
                    eZ(0);
                    du = dB
                }
                while (dE < N && !dD) eJ()
            }
        };
        var eL = function() {
            while (dE != 0 && di == null) {
                eC();
                dA = dz;
                dx = dC;
                dz = C - 1;
                if (dw != L && dA < dG && dB - dw <= O) {
                    dz = eI(dw);
                    if (dz > dE) dz = dE;
                    if (dz == C && dB - dC > M) {
                        dz--
                    }
                }
                if (dA >= C && dz <= dA) {
                    var a;
                    a = fa(dB - 1 - dx, dA - C);
                    dE -= dA - 1;
                    dA -= 2;
                    do {
                        dB++;
                        eC()
                    } while (--dA != 0);
                    dy = 0;
                    dz = C - 1;
                    dB++;
                    if (a) {
                        eZ(0);
                        du = dB
                    }
                } else if (dy != 0) {
                    if (fa(0, dn[dB - 1] & 0xff)) {
                        eZ(0);
                        du = dB
                    }
                    dB++;
                    dE--
                } else {
                    dy = 1;
                    dB++;
                    dE--
                }
                while (dE < N && !dD) eJ()
            }
        };
        var eM = function() {
            if (dD) return;
            ds = 0;
            dt = 0;
            eP();
            eH();
            di = null;
            dl = 0;
            zip_outoff = 0;
            if (dH <= 3) {
                dA = C - 1;
                dz = 0
            } else {
                dz = C - 1;
                dy = 0
            }
            dm = false
        };
        var eN = function(a, b, c) {
            var n;
            if (!dj) {
                eM();
                dj = true;
                if (dE == 0) {
                    dm = true;
                    return 0
                }
            }
            if ((n = eO(a, b, c)) == c) return c;
            if (dm) return n;
            if (dH <= 3) eK();
            else eL();
            if (dE == 0) {
                if (dy != 0) {
                    fa(0, dn[dB - 1] & 0xff)
                }
                eZ(1);
                dm = true
            }
            return n + eO(a, n + b, c - n)
        };
        var eO = function(a, b, c) {
            var n, i, j;
            n = 0;
            while (di != null && n < c) {
                i = c - n;
                if (i > di.len) i = di.len;
                for (j = 0; j < i; j++) {
                    a[b + n + j] = di.ptr[di.off + j]
                }
                di.off += i;
                di.len -= i;
                n += i;
                if (di.len == 0) {
                    var p;
                    p = di;
                    di = di.next;
                    ew(p)
                }
            }
            if (n == c) {
                return n
            }
            if (zip_outoff < dl) {
                i = c - n;
                if (i > dl - zip_outoff) {
                    i = dl - zip_outoff
                }
                for (j = 0; j < i; j++) {
                    a[b + n + j] = dk[zip_outoff + j]
                }
                zip_outoff += i;
                n += i;
                if (dl == zip_outoff) {
                    dl = zip_outoff = 0
                }
            }
            return n
        };
        var eP = function() {
            var n;
            var a;
            var b;
            var c;
            var d;
            if (dN[0].dl != 0) return;
            dP.dyn_tree = dK;
            dP.static_tree = dM;
            dP.extra_bits = ep;
            dP.extra_base = T + 1;
            dP.elems = V;
            dP.max_length = Q;
            dP.max_code = 0;
            dQ.dyn_tree = dL;
            dQ.static_tree = dN;
            dQ.extra_bits = eq;
            dQ.extra_base = 0;
            dQ.elems = W;
            dQ.max_length = Q;
            dQ.max_code = 0;
            dR.dyn_tree = dO;
            dR.static_tree = null;
            dR.extra_bits = er;
            dR.extra_base = 0;
            dR.elems = X;
            dR.max_length = R;
            dR.max_code = 0;
            b = 0;
            for (c = 0; c < S - 1; c++) {
                dZ[c] = b;
                for (n = 0; n < (1 << ep[c]); n++) dX[b++] = c
            }
            dX[b - 1] = c;
            d = 0;
            for (c = 0; c < 16; c++) {
                ea[c] = d;
                for (n = 0; n < (1 << eq[c]); n++) {
                    dY[d++] = c
                }
            }
            d >>= 7;
            for (; c < W; c++) {
                ea[c] = d << 7;
                for (n = 0; n < (1 << (eq[c] - 7)); n++) dY[256 + d++] = c
            }
            for (a = 0; a <= Q; a++) dS[a] = 0;
            n = 0;
            while (n <= 143) {
                dM[n++].dl = 8;
                dS[8]++
            }
            while (n <= 255) {
                dM[n++].dl = 9;
                dS[9]++
            }
            while (n <= 279) {
                dM[n++].dl = 7;
                dS[7]++
            }
            while (n <= 287) {
                dM[n++].dl = 8;
                dS[8]++
            }
            eT(dM, V + 1);
            for (n = 0; n < W; n++) {
                dN[n].dl = 5;
                dN[n].fc = fe(n, 5)
            }
            eQ()
        };
        var eQ = function() {
            var n;
            for (n = 0; n < V; n++) dK[n].fc = 0;
            for (n = 0; n < W; n++) dL[n].fc = 0;
            for (n = 0; n < X; n++) dO[n].fc = 0;
            dK[U].fc = 1;
            eh = ei = 0;
            ec = ed = ee = 0;
            ef = 0;
            eg = 1
        };
        var eR = function(a, k) {
            var v = dT[k];
            var j = k << 1;
            while (j <= dU) {
                if (j < dU && eF(a, dT[j + 1], dT[j])) j++;
                if (eF(a, v, dT[j])) break;
                dT[k] = dT[j];
                k = j;
                j <<= 1
            }
            dT[k] = v
        };
        var eS = function(a) {
            var b = a.dyn_tree;
            var c = a.extra_bits;
            var d = a.extra_base;
            var e = a.max_code;
            var g = a.max_length;
            var i = a.static_tree;
            var h;
            var n, m;
            var j;
            var k;
            var f;
            var l = 0;
            for (j = 0; j <= Q; j++) dS[j] = 0;
            b[dT[dV]].dl = 0;
            for (h = dV + 1; h < df; h++) {
                n = dT[h];
                j = b[b[n].dl].dl + 1;
                if (j > g) {
                    j = g;
                    l++
                }
                b[n].dl = j;
                if (n > e) continue;
                dS[j]++;
                k = 0;
                if (n >= d) k = c[n - d];
                f = b[n].fc;
                eh += f * (j + k);
                if (i != null) ei += f * (i[n].dl + k)
            }
            if (l == 0) return;
            do {
                j = g - 1;
                while (dS[j] == 0) j--;
                dS[j]--;
                dS[j + 1] += 2;
                dS[g]--;
                l -= 2
            } while (l > 0);
            for (j = g; j != 0; j--) {
                n = dS[j];
                while (n != 0) {
                    m = dT[--h];
                    if (m > e) continue;
                    if (b[m].dl != j) {
                        eh += (j - b[m].dl) * b[m].fc;
                        b[m].fc = j
                    }
                    n--
                }
            }
        };
        var eT = function(a, b) {
            var c = new Array(Q + 1);
            var d = 0;
            var e;
            var n;
            for (e = 1; e <= Q; e++) {
                d = ((d + dS[e - 1]) << 1);
                c[e] = d
            }
            for (n = 0; n <= b; n++) {
                var f = a[n].dl;
                if (f == 0) continue;
                a[n].fc = fe(c[f]++, f)
            }
        };
        var eU = function(a) {
            var b = a.dyn_tree;
            var c = a.static_tree;
            var d = a.elems;
            var n, m;
            var e = -1;
            var f = d;
            dU = 0;
            dV = df;
            for (n = 0; n < d; n++) {
                if (b[n].fc != 0) {
                    dT[++dU] = e = n;
                    dW[n] = 0
                } else b[n].dl = 0
            }
            while (dU < 2) {
                var g = dT[++dU] = (e < 2 ? ++e : 0);
                b[g].fc = 1;
                dW[g] = 0;
                eh--;
                if (c != null) ei -= c[g].dl
            }
            a.max_code = e;
            for (n = dU >> 1; n >= 1; n--) eR(b, n);
            do {
                n = dT[P];
                dT[P] = dT[dU--];
                eR(b, P);
                m = dT[P];
                dT[--dV] = n;
                dT[--dV] = m;
                b[f].fc = b[n].fc + b[m].fc;
                if (dW[n] > dW[m] + 1) dW[f] = dW[n];
                else dW[f] = dW[m] + 1;
                b[n].dl = b[m].dl = f;
                dT[P] = f++;
                eR(b, P)
            } while (dU >= 2);
            dT[--dV] = dT[P];
            eS(a);
            eT(b, e)
        };
        var eV = function(a, b) {
            var n;
            var c = -1;
            var d;
            var e = a[0].dl;
            var f = 0;
            var g = 7;
            var h = 4;
            if (e == 0) {
                g = 138;
                h = 3
            }
            a[b + 1].dl = 0xffff;
            for (n = 0; n <= b; n++) {
                d = e;
                e = a[n + 1].dl;
                if (++f < g && d == e) continue;
                else if (f < h) dO[d].fc += f;
                else if (d != 0) {
                    if (d != c) dO[d].fc++;
                    dO[Y].fc++
                } else if (f <= 10) dO[Z].fc++;
                else dO[de].fc++;
                f = 0;
                c = d;
                if (e == 0) {
                    g = 138;
                    h = 3
                } else if (d == e) {
                    g = 6;
                    h = 3
                } else {
                    g = 7;
                    h = 4
                }
            }
        };
        var eW = function(a, b) {
            var n;
            var c = -1;
            var d;
            var e = a[0].dl;
            var f = 0;
            var g = 7;
            var h = 4;
            if (e == 0) {
                g = 138;
                h = 3
            }
            for (n = 0; n <= b; n++) {
                d = e;
                e = a[n + 1].dl;
                if (++f < g && d == e) {
                    continue
                } else if (f < h) {
                    do {
                        eD(d, dO)
                    } while (--f != 0)
                } else if (d != 0) {
                    if (d != c) {
                        eD(d, dO);
                        f--
                    }
                    eD(Y, dO);
                    fd(f - 3, 2)
                } else if (f <= 10) {
                    eD(Z, dO);
                    fd(f - 3, 3)
                } else {
                    eD(de, dO);
                    fd(f - 11, 7)
                }
                f = 0;
                c = d;
                if (e == 0) {
                    g = 138;
                    h = 3
                } else if (d == e) {
                    g = 6;
                    h = 3
                } else {
                    g = 7;
                    h = 4
                }
            }
        };
        var eX = function() {
            var a;
            eV(dK, dP.max_code);
            eV(dL, dQ.max_code);
            eU(dR);
            for (a = X - 1; a >= 3; a--) {
                if (dO[es[a]].dl != 0) break
            }
            eh += 3 * (a + 1) + 5 + 5 + 4;
            return a
        };
        var eY = function(a, b, c) {
            var d;
            fd(a - 257, 5);
            fd(b - 1, 5);
            fd(c - 4, 4);
            for (d = 0; d < c; d++) {
                fd(dO[es[d]].dl, 3)
            }
            eW(dK, a - 1);
            eW(dL, b - 1)
        };
        var eZ = function(a) {
            var b, static_lenb;
            var c;
            var d;
            d = dB - du;
            eb[ee] = ef;
            eU(dP);
            eU(dQ);
            c = eX();
            b = (eh + 3 + 7) >> 3;
            static_lenb = (ei + 3 + 7) >> 3;
            if (static_lenb <= b) b = static_lenb;
            if (d + 4 <= b && du >= 0) {
                var i;
                fd((r << 1) + a, 3);
                ff();
                eB(d);
                eB(~d);
                for (i = 0; i < d; i++) eA(dn[du + i])
            } else if (static_lenb == b) {
                fd((s << 1) + a, 3);
                fb(dM, dN)
            } else {
                fd((t << 1) + a, 3);
                eY(dP.max_code + 1, dQ.max_code + 1, c + 1);
                fb(dK, dL)
            }
            eQ();
            if (a != 0) ff()
        };
        var fa = function(a, b) {
            dq[ec++] = b;
            if (a == 0) {
                dK[b].fc++
            } else {
                a--;
                dK[dX[b] + T + 1].fc++;
                dL[eE(a)].fc++;
                dp[ed++] = a;
                ef |= eg
            }
            eg <<= 1;
            if ((ec & 7) == 0) {
                eb[ee++] = ef;
                ef = 0;
                eg = 1
            }
            if (dH > 2 && (ec & 0xfff) == 0) {
                var c = ec * 8;
                var d = dB - du;
                var e;
                for (e = 0; e < W; e++) {
                    c += dL[e].fc * (5 + eq[e])
                }
                c >>= 3;
                if (ed < parseInt(ec / 2, 10) && c < parseInt(d / 2, 10)) return true
            }
            return (ec == F - 1 || ed == H)
        };
        var fb = function(a, b) {
            var c;
            var d;
            var e = 0;
            var f = 0;
            var g = 0;
            var h = 0;
            var i;
            var j;
            if (ec != 0)
                do {
                    if ((e & 7) == 0) h = eb[g++];
                    d = dq[e++] & 0xff;
                    if ((h & 1) == 0) {
                        eD(d, a)
                    } else {
                        i = dX[d];
                        eD(i + T + 1, a);
                        j = ep[i];
                        if (j != 0) {
                            d -= dZ[i];
                            fd(d, j)
                        }
                        c = dp[f++];
                        i = eE(c);
                        eD(i, b);
                        j = eq[i];
                        if (j != 0) {
                            c -= ea[i];
                            fd(c, j)
                        }
                    }
                    h >>= 1
                } while (e < ec);
            eD(U, a)
        };
        var fc = 16;
        var fd = function(a, b) {
            if (dt > fc - b) {
                ds |= (a << dt);
                eB(ds);
                ds = (a >> (fc - dt));
                dt += b - fc
            } else {
                ds |= a << dt;
                dt += b
            }
        };
        var fe = function(a, b) {
            var c = 0;
            do {
                c |= a & 1;
                a >>= 1;
                c <<= 1
            } while (--b > 0);
            return c >> 1
        };
        var ff = function() {
            if (dt > 8) {
                eB(ds)
            } else if (dt > 0) {
                eA(ds)
            }
            ds = 0;
            dt = 0
        };
        var fg = function() {
            if (dl != 0) {
                var q, i;
                q = ex();
                if (di == null) di = zip_qtail = q;
                else zip_qtail = zip_qtail.next = q;
                q.len = dl - zip_outoff;
                for (i = 0; i < q.len; i++) q.ptr[i] = dk[zip_outoff + i];
                dl = zip_outoff = 0
            }
        };
        var fh = function(a, b) {
            var i, j;
            ej = a;
            ek = 0;
            if (typeof b == "undefined") {
                b = u
            }
            eu(b);
            var c = [0];
            var d = [];
            while ((i = eN(c, 0, c.length)) > 0) {
                d.push(c[0])
            }
            ej = null;
            return d
        };
        return fh
    })();
    var fi = (function() {
        var D = 32768;
        var E = 0;
        var F = 1;
        var G = 2;
        var H = 9;
        var I = 6;
        var J = 32768;
        var K = 64;
        var L;
        var M;
        var N = null;
        var O;
        var P, fixed_bd;
        var Q;
        var R;
        var S;
        var T;
        var U;
        var V;
        var W, zip_td;
        var X, zip_bd;
        var Y;
        var Z;
        var de = new Array(0x0000, 0x0001, 0x0003, 0x0007, 0x000f, 0x001f, 0x003f, 0x007f, 0x00ff, 0x01ff, 0x03ff, 0x07ff, 0x0fff, 0x1fff, 0x3fff, 0x7fff, 0xffff);
        var df = new Array(3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0);
        var dg = new Array(0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 99, 99);
        var dh = new Array(1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577);
        var di = new Array(0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13);
        var dj = new Array(16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15);
        var dk = function() {
            this.next = null;
            this.list = null
        };
        var dl = function() {
            this.e = 0;
            this.b = 0;
            this.n = 0;
            this.t = null
        };
        var dm = function(b, n, s, d, e, l) {
            this.BMAX = 16;
            this.N_MAX = 288;
            this.status = 0;
            this.root = null;
            this.m = 0; {
                var a;
                var c = new Array(this.BMAX + 1);
                var m;
                var f;
                var g;
                var h;
                var i;
                var j;
                var k;
                var t = new Array(this.BMAX + 1);
                var p;
                var A;
                var q;
                var r = new dl();
                var u = new Array(this.BMAX);
                var v = new Array(this.N_MAX);
                var w;
                var x = new Array(this.BMAX + 1);
                var B;
                var y;
                var z;
                var o;
                var C;
                C = this.root = null;
                for (i = 0; i < c.length; i++) c[i] = 0;
                for (i = 0; i < t.length; i++) t[i] = 0;
                for (i = 0; i < u.length; i++) u[i] = null;
                for (i = 0; i < v.length; i++) v[i] = 0;
                for (i = 0; i < x.length; i++) x[i] = 0;
                m = n > 256 ? b[256] : this.BMAX;
                p = b;
                A = 0;
                i = n;
                do {
                    c[p[A]]++;
                    A++
                } while (--i > 0);
                if (c[0] == n) {
                    this.root = null;
                    this.m = 0;
                    this.status = 0;
                    return
                }
                for (j = 1; j <= this.BMAX; j++)
                    if (c[j] != 0) break;
                k = j;
                if (l < j) l = j;
                for (i = this.BMAX; i != 0; i--)
                    if (c[i] != 0) break;
                g = i;
                if (l > i) l = i;
                for (y = 1 << j; j < i; j++, y <<= 1)
                    if ((y -= c[j]) < 0) {
                        this.status = 2;
                        this.m = l;
                        return
                    }
                if ((y -= c[i]) < 0) {
                    this.status = 2;
                    this.m = l;
                    return
                }
                c[i] += y;
                x[1] = j = 0;
                p = c;
                A = 1;
                B = 2;
                while (--i > 0) x[B++] = (j += p[A++]);
                p = b;
                A = 0;
                i = 0;
                do {
                    if ((j = p[A++]) != 0) v[x[j]++] = i
                } while (++i < n);
                n = x[g];
                x[0] = i = 0;
                p = v;
                A = 0;
                h = -1;
                w = t[0] = 0;
                q = null;
                z = 0;
                for (; k <= g; k++) {
                    a = c[k];
                    while (a-- > 0) {
                        while (k > w + t[1 + h]) {
                            w += t[1 + h];
                            h++;
                            z = (z = g - w) > l ? l : z;
                            if ((f = 1 << (j = k - w)) > a + 1) {
                                f -= a + 1;
                                B = k;
                                while (++j < z) {
                                    if ((f <<= 1) <= c[++B]) break;
                                    f -= c[B]
                                }
                            }
                            if (w + j > m && w < m) j = m - w;
                            z = 1 << j;
                            t[1 + h] = j;
                            q = new Array(z);
                            for (o = 0; o < z; o++) {
                                q[o] = new dl()
                            }
                            if (C == null) C = this.root = new dk();
                            else C = C.next = new dk();
                            C.next = null;
                            C.list = q;
                            u[h] = q;
                            if (h > 0) {
                                x[h] = i;
                                r.b = t[h];
                                r.e = 16 + j;
                                r.t = q;
                                j = (i & ((1 << w) - 1)) >> (w - t[h]);
                                u[h - 1][j].e = r.e;
                                u[h - 1][j].b = r.b;
                                u[h - 1][j].n = r.n;
                                u[h - 1][j].t = r.t
                            }
                        }
                        r.b = k - w;
                        if (A >= n) r.e = 99;
                        else if (p[A] < s) {
                            r.e = (p[A] < 256 ? 16 : 15);
                            r.n = p[A++]
                        } else {
                            r.e = e[p[A] - s];
                            r.n = d[p[A++] - s]
                        }
                        f = 1 << (k - w);
                        for (j = i >> w; j < z; j += f) {
                            q[j].e = r.e;
                            q[j].b = r.b;
                            q[j].n = r.n;
                            q[j].t = r.t
                        }
                        for (j = 1 << (k - 1);
                            (i & j) != 0; j >>= 1) i ^= j;
                        i ^= j;
                        while ((i & ((1 << w) - 1)) != x[h]) {
                            w -= t[h];
                            h--
                        }
                    }
                }
                this.m = t[1];
                this.status = ((y != 0 && g != 1) ? 1 : 0)
            }
        };
        var dn = function() {
            if (Y.length == Z) return -1;
            return Y[Z++]
        };
        var dp = function(n) {
            while (R < n) {
                Q |= dn() << R;
                R += 8
            }
        };
        var dq = function(n) {
            return Q & de[n]
        };
        var dr = function(n) {
            Q >>= n;
            R -= n
        };
        var ds = function(a, b, c) {
            var e;
            var t;
            var n;
            if (c == 0) return 0;
            n = 0;
            for (;;) {
                dp(X);
                t = W.list[dq(X)];
                e = t.e;
                while (e > 16) {
                    if (e == 99) return -1;
                    dr(t.b);
                    e -= 16;
                    dp(e);
                    t = t.t[dq(e)];
                    e = t.e
                }
                dr(t.b);
                if (e == 16) {
                    M &= D - 1;
                    a[b + n++] = L[M++] = t.n;
                    if (n == c) return c;
                    continue
                }
                if (e == 15) break;
                dp(e);
                U = t.n + dq(e);
                dr(e);
                dp(zip_bd);
                t = zip_td.list[dq(zip_bd)];
                e = t.e;
                while (e > 16) {
                    if (e == 99) return -1;
                    dr(t.b);
                    e -= 16;
                    dp(e);
                    t = t.t[dq(e)];
                    e = t.e
                }
                dr(t.b);
                dp(e);
                V = M - t.n - dq(e);
                dr(e);
                while (U > 0 && n < c) {
                    U--;
                    V &= D - 1;
                    M &= D - 1;
                    a[b + n++] = L[M++] = L[V++]
                }
                if (n == c) return c
            }
            S = -1;
            return n
        };
        var dt = function(a, b, c) {
            var n;
            n = R & 7;
            dr(n);
            dp(16);
            n = dq(16);
            dr(16);
            dp(16);
            if (n != ((~Q) & 0xffff)) return -1;
            dr(16);
            U = n;
            n = 0;
            while (U > 0 && n < c) {
                U--;
                M &= D - 1;
                dp(8);
                a[b + n++] = L[M++] = dq(8);
                dr(8)
            }
            if (U == 0) S = -1;
            return n
        };
        var du = function(a, b, c) {
            if (N == null) {
                var i;
                var l = new Array(288);
                var h;
                for (i = 0; i < 144; i++) l[i] = 8;
                for (; i < 256; i++) l[i] = 9;
                for (; i < 280; i++) l[i] = 7;
                for (; i < 288; i++) l[i] = 8;
                P = 7;
                h = new dm(l, 288, 257, df, dg, P);
                if (h.status != 0) {
                    alert("HufBuild error: " + h.status);
                    return -1
                }
                N = h.root;
                P = h.m;
                for (i = 0; i < 30; i++) l[i] = 5;
                var d = 5;
                h = new dm(l, 30, 0, dh, di, d);
                if (h.status > 1) {
                    N = null;
                    alert("HufBuild error: " + h.status);
                    return -1
                }
                O = h.root;
                d = h.m
            }
            W = N;
            zip_td = O;
            X = P;
            zip_bd = d;
            return ds(a, b, c)
        };
        var dv = function(a, b, c) {
            var i;
            var j;
            var l;
            var n;
            var t;
            var d;
            var e;
            var f;
            var g = new Array(286 + 30);
            var h;
            for (i = 0; i < g.length; i++) g[i] = 0;
            dp(5);
            e = 257 + dq(5);
            dr(5);
            dp(5);
            f = 1 + dq(5);
            dr(5);
            dp(4);
            d = 4 + dq(4);
            dr(4);
            if (e > 286 || f > 30) return -1;
            for (j = 0; j < d; j++) {
                dp(3);
                g[dj[j]] = dq(3);
                dr(3)
            }
            for (; j < 19; j++) g[dj[j]] = 0;
            X = 7;
            h = new dm(g, 19, 19, null, null, X);
            if (h.status != 0) return -1;
            W = h.root;
            X = h.m;
            n = e + f;
            i = l = 0;
            while (i < n) {
                dp(X);
                t = W.list[dq(X)];
                j = t.b;
                dr(j);
                j = t.n;
                if (j < 16) g[i++] = l = j;
                else if (j == 16) {
                    dp(2);
                    j = 3 + dq(2);
                    dr(2);
                    if (i + j > n) return -1;
                    while (j-- > 0) g[i++] = l
                } else if (j == 17) {
                    dp(3);
                    j = 3 + dq(3);
                    dr(3);
                    if (i + j > n) return -1;
                    while (j-- > 0) g[i++] = 0;
                    l = 0
                } else {
                    dp(7);
                    j = 11 + dq(7);
                    dr(7);
                    if (i + j > n) return -1;
                    while (j-- > 0) g[i++] = 0;
                    l = 0
                }
            }
            X = H;
            h = new dm(g, e, 257, df, dg, X);
            if (X == 0) h.status = 1;
            if (h.status != 0) {
                if (h.status == 1);
                return -1
            }
            W = h.root;
            X = h.m;
            for (i = 0; i < f; i++) g[i] = g[i + e];
            zip_bd = I;
            h = new dm(g, f, 0, dh, di, zip_bd);
            zip_td = h.root;
            zip_bd = h.m;
            if (zip_bd == 0 && e > 257) {
                return -1
            }
            if (h.status == 1) {}
            if (h.status != 0) return -1;
            return ds(a, b, c)
        };
        var dw = function() {
            var i;
            if (L == null) L = new Array(2 * D);
            M = 0;
            Q = 0;
            R = 0;
            S = -1;
            T = false;
            U = V = 0;
            W = null
        };
        var dx = function(a, b, c) {
            var n, i;
            n = 0;
            while (n < c) {
                if (T && S == -1) return n;
                if (U > 0) {
                    if (S != E) {
                        while (U > 0 && n < c) {
                            U--;
                            V &= D - 1;
                            M &= D - 1;
                            a[b + n++] = L[M++] = L[V++]
                        }
                    } else {
                        while (U > 0 && n < c) {
                            U--;
                            M &= D - 1;
                            dp(8);
                            a[b + n++] = L[M++] = dq(8);
                            dr(8)
                        }
                        if (U == 0) S = -1
                    }
                    if (n == c) return n
                }
                if (S == -1) {
                    if (T) break;
                    dp(1);
                    if (dq(1) != 0) T = true;
                    dr(1);
                    dp(2);
                    S = dq(2);
                    dr(2);
                    W = null;
                    U = 0
                }
                switch (S) {
                    case 0:
                        i = dt(a, b + n, c - n);
                        break;
                    case 1:
                        if (W != null) i = ds(a, b + n, c - n);
                        else i = du(a, b + n, c - n);
                        break;
                    case 2:
                        if (W != null) i = ds(a, b + n, c - n);
                        else i = dv(a, b + n, c - n);
                        break;
                    default:
                        i = -1;
                        break
                }
                if (i == -1) {
                    if (T) return 0;
                    return -1
                }
                n += i
            }
            return n
        };
        var dy = function(a) {
            var i, j;
            dw();
            Y = a;
            Z = 0;
            var b = [0];
            var c = [];
            while ((i = dx(b, 0, b.length)) > 0) {
                c.push(b[0])
            }
            Y = null;
            return c
        };
        return dy
    })();
    var fj = function(c) {
        var a = 1,
            b = 0;
        var i;
        var d = c.length;
        var e = 65521;
        for (i = 0; i < d; i += 1) {
            a = (a + c[i]) % e;
            b = (b + a) % e
        }
        return (b << 16) | a
    };
    var fk = function(a, b) {
        var i;
        var c = fj(a);
        var d = dd(a, b);
        a = d;
        a.unshift(0x78, 0xDA);
        for (i = 0; i < 4; ++i) a.push(c >> i * 8 & 25);
        return a
    };
    var fl = function(a) {
        if (a.length < 6) {
            throw "DataError: Not enough input";
        }
        var b = fi(a.slice(2, a.length - 4));
        if (a.length > 6 && b.length === 0) {
            throw "DataError: Unable to inflate the data";
        }
        return b
    };
    return {
        'deflate': dd,
        'inflate': fi,
        'compress': fk,
        'uncompress': fl
    }
})();
var char = 0,
    short = 0,
    int = 0,
    long = 0,
    void_ = 0;
var int8_t = char;
var uint8_t = char;
var int16_t = short;
var uint16_t = short;
var int32_t = int;
var uint32_t = int;
var uint64_t = long;
var int64_t = long;
var float = 0.00;
var size_t = 0;
var double = 0;
var score_t = int64_t;

function cloneObjAttr(a) {
    if (a instanceof Array) {
        return a
    }
    if (a instanceof Object) {
        var b = {};
        for (var c in a) {
            if (a.hasOwnProperty(c) && !(a instanceof Array)) b[c] = (a[c])
        }
        return b
    }
    throw new alert("Unable to copy obj! Its type isn't supported.");
}

function newObjectIt(a) {
    return JSON.parse(JSON.stringify(a))
}

function convertBinaryToArray(a) {
    var b = new Array();
    var c = a.length;
    for (i = 0; i < c; ++i) b.push(a.charCodeAt(i));
    return b
}

function int64BitLeft(a, b) {
    var c = new Array();
    var i;
    for (i = 0; i < b; ++i) c[i] = '0';
    bits = (a.toString(2) + '' + c.join(""));
    return parseInt(bits, 2)
}

function write32BitIn4Bytes(a, b, c) {
    var i;
    for (i = 3; i >= 0; --i) a[b + (3 - i)] = (c >> (8 * i)) & 0xff
}

function write4BytesIn32Bit(a, b) {
    return ((a[b + 0] << 24) | (a[b + 1] << 16) | (a[b + 2] << 8) | a[b + 3])
}

function alert32BitIn4Bytes(a) {
    var i, str = '';
    for (i = 3; i >= 0; --i) str += ' ' + ((a >> (8 * i)) & 0xff);
    alert(str)
}

function Byte2Hex(a) {
    return '0x' + a.toString(16)
}

function memcpy(a, b, c, d, e) {
    if (typeof a != 'string') {
        for (i = 0; i < e; ++i) a[b + i] = c[d + i]
    } else {
        if (b > 0) alert('string offset is over 0');
        a = c.slice(d, e);
        return a
    }
}

function memcpy2(a, b, c, d, e) {
    var f = c.slice(0, d);
    var g = c.slice(d, d + e);
    var h = c.slice(d + e);
    a.splice(0);
    a.concat(f, g, h)
}

function memcpyArrM(b, c, d, e, f) {
    for (i = 0; i < f; ++i) {
        var g = b[c + i].length;
        for (var a = 0; a < g; ++a) b[c + i][a] = d[e + i][a]
    }
}

function ArrCopy(a) {
    var b = new Array();
    var c = a.length;
    for (i = 0; i < c; ++i) {
        b.push(a[i])
    }
    return b
}

function memset_wl(a, b) {
    var c = new Array();
    c.push(newObjectIt(a));
    for (i = 0; i < b; ++i) c.push(newObjectIt(a));
    c.push(0);
    return c
}

function memset(a, b) {
    var c = new Array();
    for (i = 0; i < b; ++i) c.push(a);
    c.push(0);
    return c
}

function membuild_wl(a, b) {
    var c = new Array();
    c.push(newObjectIt(a));
    for (i = 0; i < b; ++i) c.push(newObjectIt(a));
    c.push(0);
    return c
}

function membuild(a, b) {
    var c = new Array();
    for (i = 0; i < b; ++i) c.push(a);
    c.push(0);
    return c
}

function memset_(a, b, c, d) {
    for (i = 0; i < d; ++i) a[b + i] = c
}

function malloc(a, b) {
    var c = new Array();
    for (i = 0; i < a; ++i) c.push(b);
    c.push(0);
    return c
}

function mallocStr(a, b) {
    var c = new Array();
    for (i = 0; i < a; ++i) c.push(' ');
    return c.join("")
}

function sizeof(a) {
    return 1
}

function memcmp(a, b, s, c) {
    var w = '';
    for (i = 0; i < c; ++i) w += String.fromCharCode(a[b + i]);
    if (s == w) return 0;
    else return 1
}

function Arr(a, b) {
    var c = new Array();
    for (i = 0; i < a; ++i) c.push(b);
    return c
}

function Arr_nOI(a, b) {
    var c = new Array();
    for (i = 0; i < a; ++i) c.push(newObjectIt(b));
    return c
}

function ArrM(b, c) {
    var d, resStr = new Array();
    for (a = (b.length - 1); a >= 0; --a) c = newObjectIt(Arr(b[a], c));
    return c
}

function assert(a) {
    if (!a) {
        throw new Error('assert :P');
    }
}

function WebPDecoder() {
    var N = 0x0002;
    var O = 0,
        MODE_RGBA = 1,
        MODE_BGR = 2,
        MODE_BGRA = 3,
        MODE_ARGB = 4,
        MODE_RGBA_4444 = 5,
        MODE_RGB_565 = 6,
        MODE_YUV = 7,
        MODE_YUVA = 8,
        MODE_LAST = 9;
    this.WEBP_CSP_MODE = {
        MODE_RGB: 0,
        MODE_RGBA: 1,
        MODE_BGR: 2,
        MODE_BGRA: 3,
        MODE_ARGB: 4,
        MODE_RGBA_4444: 5,
        MODE_RGB_565: 6,
        MODE_YUV: 7,
        MODE_YUVA: 8,
        MODE_LAST: 9
    };
    var P = {
        rgba: uint8_t,
        rgba_off: 0,
        stride: int,
        size: int
    };
    var Q = {
        y: uint8_t,
        u: uint8_t,
        v: uint8_t,
        a: uint8_t,
        y_off: uint8_t,
        u_off: uint8_t,
        v_off: uint8_t,
        a_off: uint8_t,
        y_stride: int,
        u_stride: int,
        v_stride: int,
        a_stride: int,
        y_size: int,
        u_size: int,
        v_size: int,
        a_size: int
    };
    var R = {
        colorspace: 'WEBP_CSP_MODE',
        width: int,
        height: int,
        is_external_memory: int,
        u: {
            RGBA: P,
            YUVA: Q
        },
        private_memory: null,
        private_memory_off: uint8_t
    };

    function WebPInitDecBuffer(a) {
        return WebPInitDecBufferInternal(a, N)
    }
    var T = 0,
        VP8_STATUS_OUT_OF_MEMORY = 1,
        VP8_STATUS_INVALID_PARAM = 2,
        VP8_STATUS_BITSTREAM_ERROR = 3,
        VP8_STATUS_UNSUPPORTED_FEATURE = 4,
        VP8_STATUS_SUSPENDED = 5,
        VP8_STATUS_USER_ABORT = 6,
        VP8_STATUS_NOT_ENOUGH_DATA = 7;
    this.VP8StatusCode = {
        VP8_STATUS_OK: 0,
        VP8_STATUS_OUT_OF_MEMORY: 1,
        VP8_STATUS_INVALID_PARAM: 2,
        VP8_STATUS_BITSTREAM_ERROR: 3,
        VP8_STATUS_UNSUPPORTED_FEATURE: 4,
        VP8_STATUS_SUSPENDED: 5,
        VP8_STATUS_USER_ABORT: 6,
        VP8_STATUS_NOT_ENOUGH_DATA: 7
    };
    var U = {
        width: {
            value: int
        },
        height: {
            value: int
        },
        has_alpha: {
            value: int
        },
        no_incremental_decoding: int,
        rotate: int,
        uv_sampling: int,
        bitstream_version: int
    };
    this.WebPGetFeatures = function(a, b, c) {
        return WebPGetFeaturesInternal(a, b, c, N)
    };
    var V = {
        bypass_filtering: int,
        no_fancy_upsampling: int,
        use_cropping: int,
        crop_left: int,
        crop_top: int,
        crop_width: int,
        crop_height: int,
        use_scaling: int,
        scaled_width: int,
        scaled_height: int,
        force_rotation: int,
        no_enhancement: int,
        use_threads: int
    };
    this.WebPDecoderConfig = {
        input: newObjectIt(U),
        output: newObjectIt(R),
        options: newObjectIt(V)
    };
    this.WebPInitDecoderConfig = function(a) {
        return WebPInitDecoderConfigInternal(a, N)
    };
    var Y = {
        width: int,
        height: int,
        mb_y: int,
        mb_w: int,
        mb_h: int,
        y: uint8_t,
        u: uint8_t,
        v: uint8_t,
        y_off: 0,
        u_off: 0,
        v_off: 0,
        y_stride: int,
        uv_stride: int,
        opaque: void_,
        put: 0,
        setup: 0,
        teardown: 0,
        fancy_upsampling: int,
        data_size: uint32_t,
        data: uint8_t,
        data_off: 0,
        bypass_filtering: int,
        use_cropping: int,
        crop_left: int,
        crop_right: int,
        crop_top: int,
        crop_bottom: int,
        use_scaling: int,
        scaled_width: int,
        scaled_height: int,
        a: uint8_t,
        a_off: 0
    };

    function VP8InitIo(a) {
        return VP8InitIoInternal(a, N)
    };
    var Z = {
        x_expand: int,
        fy_scale: int,
        fx_scale: int,
        fxy_scale: int64_t,
        y_accum: int,
        y_add: int,
        y_sub: int,
        x_add: int,
        x_sub: int,
        src_width: int,
        src_height: int,
        dst_width: int,
        dst_height: int,
        dst: uint8_t,
        dst_off: 0,
        dst_stride: int,
        irow: int32_t,
        irow_off: 0,
        frow: int32_t,
        frow_off: 0
    };
    var ba = {
        output: newObjectIt(R),
        tmp_y: uint8_t,
        tmp_u: uint8_t,
        tmp_v: uint8_t,
        tmp_y_off: 0,
        tmp_u_off: 0,
        tmp_v_off: 0,
        last_y: int,
        options_: newObjectIt(V),
        scaler_y: newObjectIt(Z),
        scaler_u: newObjectIt(Z),
        scaler_v: newObjectIt(Z),
        scaler_a: newObjectIt(Z),
        memory: void_,
        emit: '(OutputFunc)',
        emit_alpha: '(OutputFunc)'
    };
    var bb = {
        buf_: uint8_t,
        buf_off: null,
        buf_end_: uint8_t,
        eof_: int,
        range_: uint32_t,
        value_: uint32_t,
        missing_: int
    };

    function VP8Get(a) {
        return VP8GetValue(a, 1)
    };

    function VP8GetByte(a) {
        assert(a);
        if (a.buf_off < a.buf_end_) {
            assert(a.buf_);
            return (a.buf_[a.buf_off++])
        }
        a.eof_ = 1;
        return 0xff
    }

    function VP8BitUpdate(a, b) {
        var c = uint32_t;
        var d = (b + 1) << 8;
        if (a.missing_ > 0) {
            a.value_ |= VP8GetByte(a) << a.missing_;
            a.missing_ -= 8
        }
        c = (a.value_ >= d) + 0;
        if (c) {
            a.range_ -= b + 1;
            a.value_ -= d
        } else {
            a.range_ = b
        }
        return c
    }

    function VP8Shift(a) {
        var b = bc[a.range_];
        a.range_ = bd[a.range_];
        a.value_ <<= b;
        a.missing_ += b
    };

    function VP8GetBit(a, b) {
        var c = (a.range_ * b) >> 8;
        var d = VP8BitUpdate(a, c);
        if (a.range_ < 0x7f) {
            VP8Shift(a)
        }
        return d
    };

    function VP8GetSigned(a, v) {
        var b = a.range_ >> 1;
        var c = VP8BitUpdate(a, b);
        VP8Shift(a);
        return c ? -v : v
    };

    function VP8InitBitReader(a, b, c, d) {
        assert(a);
        assert(b);
        assert(d);
        a.range_ = 255 - 1;
        a.buf_ = b;
        a.buf_off = c;
        a.buf_end_ = d;
        a.value_ = 0;
        a.missing_ = 8;
        a.eof_ = 0
    };
    var bc = new Array(7, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0);
    var bd = new Array(127, 127, 191, 127, 159, 191, 223, 127, 143, 159, 175, 191, 207, 223, 239, 127, 135, 143, 151, 159, 167, 175, 183, 191, 199, 207, 215, 223, 231, 239, 247, 127, 131, 135, 139, 143, 147, 151, 155, 159, 163, 167, 171, 175, 179, 183, 187, 191, 195, 199, 203, 207, 211, 215, 219, 223, 227, 231, 235, 239, 243, 247, 251, 127, 129, 131, 133, 135, 137, 139, 141, 143, 145, 147, 149, 151, 153, 155, 157, 159, 161, 163, 165, 167, 169, 171, 173, 175, 177, 179, 181, 183, 185, 187, 189, 191, 193, 195, 197, 199, 201, 203, 205, 207, 209, 211, 213, 215, 217, 219, 221, 223, 225, 227, 229, 231, 233, 235, 237, 239, 241, 243, 245, 247, 249, 251, 253, 127);

    function VP8GetValue(a, b) {
        var v = 0;
        while (b-- > 0) {
            v |= VP8GetBit(a, 0x80) << b
        }
        return v
    };

    function VP8GetSignedValue(a, b) {
        var c = VP8GetValue(a, b);
        return VP8Get(a) ? -c : c
    };
    var be = 0;
    var bf = 1;
    var bg = 2;
    var bh = 0,
        B_TM_PRED = 1,
        B_VE_PRED = 2,
        B_HE_PRED = 3,
        B_RD_PRED = 4,
        B_VR_PRED = 5,
        B_LD_PRED = 6,
        B_VL_PRED = 7,
        B_HD_PRED = 8,
        B_HU_PRED = 9,
        NUM_BMODES = B_HU_PRED + 1 - bh,
        DC_PRED = bh,
        V_PRED = B_VE_PRED,
        H_PRED = B_HE_PRED,
        TM_PRED = B_TM_PRED,
        B_PRED = NUM_BMODES,
        B_DC_PRED_NOTOP = 4,
        B_DC_PRED_NOLEFT = 5,
        B_DC_PRED_NOTOPLEFT = 6,
        NUM_B_DC_MODES = 7;
    var bi = 3,
        NUM_MB_SEGMENTS = 4,
        NUM_REF_LF_DELTAS = 4,
        NUM_MODE_LF_DELTAS = 4,
        MAX_NUM_PARTITIONS = 8,
        NUM_TYPES = 4,
        NUM_BANDS = 8,
        NUM_CTX = 3,
        NUM_PROBAS = 11,
        NUM_MV_PROBAS = 19;
    var bj = 32;
    var bk = (bj * 17 + bj * 9);
    var bl = (bj * 17);
    var bm = (bj * 1 + 8);
    var bn = (bm + bj * 16 + bj);
    var bo = (bn + 16);
    var bp = {
        key_frame_: uint8_t,
        profile_: uint8_t,
        show_: uint8_t,
        partition_length_: uint32_t
    };
    var bq = {
        width_: uint16_t,
        height_: uint16_t,
        xscale_: uint8_t,
        yscale_: uint8_t,
        colorspace_: uint8_t,
        clamp_type_: uint8_t
    };
    var bs = {
        use_segment_: int,
        update_map_: int,
        absolute_delta_: int,
        quantizer_: Arr(NUM_MB_SEGMENTS, int8_t),
        filter_strength_: Arr(NUM_MB_SEGMENTS, int8_t)
    };
    var bt = {
        segments_: Arr(bi, uint8_t),
        coeffs_: ArrM(new Array(NUM_TYPES, NUM_BANDS, NUM_CTX, NUM_PROBAS), uint8_t)
    };
    var bu = {
        simple_: int,
        level_: int,
        sharpness_: int,
        use_lf_delta_: int,
        ref_lf_delta_: Arr(NUM_REF_LF_DELTAS, int),
        mode_lf_delta_: Arr(NUM_REF_LF_DELTAS, int)
    };
    var bv = {
        f_level_: int,
        f_ilevel_: int,
        f_inner_: int
    };
    var bw = {
        nz_: int,
        dc_nz_: int,
        skip_: int
    };
    var bx = {
        y1_mat_: Arr(2, uint16_t),
        y2_mat_: Arr(2, uint16_t),
        uv_mat_: Arr(2, uint16_t)
    };
    var by = {
        id_: int,
        mb_y_: int,
        filter_row_: int,
        f_info_: bv,
        io_: Y
    };
    var bz = {
        status_: 'VP8StatusCode',
        ready_: int,
        error_msg_: char,
        br_: newObjectIt(bb),
        frm_hdr_: newObjectIt(bp),
        pic_hdr_: newObjectIt(bq),
        filter_hdr_: newObjectIt(bu),
        segment_hdr_: newObjectIt(bs),
        worker_: 'WebPWorker',
        use_threads_: int,
        cache_id_: int,
        num_caches_: int,
        thread_ctx_: by,
        mb_w_: int,
        mb_h_: int,
        tl_mb_x_: int,
        tl_mb_y_: int,
        br_mb_x_: int,
        br_mb_y_: int,
        num_parts_: int,
        parts_: Arr_nOI(MAX_NUM_PARTITIONS, bb),
        buffer_flags_: uint32_t,
        dqm_: Arr_nOI(NUM_MB_SEGMENTS, bx),
        proba_: newObjectIt(bt),
        use_skip_proba_: int,
        skip_p_: uint8_t,
        intra_t_: uint8_t,
        intra_l_: Arr(4, uint8_t),
        y_t_: uint8_t,
        u_t_: uint8_t,
        v_t_: uint8_t,
        mb_info_: newObjectIt(bw),
        f_info_: newObjectIt(bv),
        yuv_b_: uint8_t,
        coeffs_: int16_t,
        cache_y_: uint8_t,
        cache_u_: uint8_t,
        cache_v_: uint8_t,
        cache_y_off: int,
        cache_u_off: int,
        cache_v_off: int,
        cache_y_stride_: int,
        cache_uv_stride_: int,
        mem_: void_,
        mem_size_: int,
        mb_x_: int,
        mb_y_: int,
        is_i4x4_: uint8_t,
        imodes_: Arr(16, uint8_t),
        imodes_offset_: 0,
        uvmode_: uint8_t,
        segment_: uint8_t,
        non_zero_: uint32_t,
        non_zero_ac_: uint32_t,
        filter_type_: int,
        filter_row_: int,
        filter_levels_: Arr(NUM_MB_SEGMENTS, uint8_t),
        alpha_data_: uint8_t,
        alpha_data_off: 0,
        alpha_data_size_: size_t,
        alpha_plane_: uint8_t,
        alpha_plane_off: 0,
        layer_colorspace_: int,
        layer_data_: uint8_t,
        layer_data_off: 0,
        layer_data_size_: size_t
    };

    function VP8DecompressAlphaRows(a, b, c) {
        var d = a.alpha_plane_;
        var e = a.pic_hdr_.width_;
        if (b < 0 || b + c > a.pic_hdr_.height_) {
            return null
        }
        if (b == 0) {
            var f = a.alpha_data_;
            var g = a.alpha_data_off;
            var h = a.alpha_data_size_;
            var i = e * a.pic_hdr_.height_;
            d = WebPZlib.uncompress(f.slice(g, g + h))
        }
        return (b == 0 ? d : (+b * e))
    }
    var bA = new Array(3, 4, 3, 4, 4, 2, 2, 1, 1);

    function CheckDecBuffer(a) {
        var b = 1;
        var c = a.colorspace;
        var d = a.width;
        var e = a.height;
        if (c >= MODE_YUV) {
            var f = a.u.YUVA;
            var g = f.y_stride * e;
            var h = f.u_stride * parseInt((e + 1) / 2);
            var i = f.v_stride * parseInt((e + 1) / 2);
            var j = f.a_stride * e;
            b &= (g <= f.y_size);
            b &= (h <= f.u_size);
            b &= (i <= f.v_size);
            b &= (j <= f.a_size);
            b &= (f.y_stride >= d);
            b &= (f.u_stride >= parseInt(d + 1) / 2);
            b &= (f.v_stride >= parseInt(d + 1) / 2);
            if (f.a) {
                b &= (f.a_stride >= d)
            }
        } else {
            var f = a.u.RGBA;
            b &= (f.stride * e <= f.size);
            b &= (f.stride >= d * bA[c])
        }
        return b ? T : VP8_STATUS_INVALID_PARAM
    }

    function AllocateBuffer(a) {
        var w = a.width;
        var h = a.height;
        if (w <= 0 || h <= 0) {
            return VP8_STATUS_INVALID_PARAM
        }
        if (!a.is_external_memory && a.private_memory == null) {
            var b = uint8_t;
            var c = 0;
            var d = a.colorspace;
            var e = int;
            var f = 0,
                a_stride = 0;
            var g = 0;
            var i = uint64_t,
                a_size = 0,
                total_size = uint64_t;
            e = w * bA[d];
            i = e * h;
            if (d >= MODE_YUV) {
                f = parseInt((w + 1) / 2);
                g = f * parseInt((h + 1) / 2);
                if (d == MODE_YUVA) {
                    a_stride = w;
                    a_size = a_stride * h
                }
            }
            total_size = i + 2 * g + a_size;
            if ((total_size != total_size)) {
                return VP8_STATUS_INVALID_PARAM
            }
            a.private_memory = b = malloc(total_size, size_t);
            a.private_memory_off = c = 0;
            if (b == null) {
                return VP8_STATUS_OUT_OF_MEMORY
            }
            if (d >= MODE_YUV) {
                var j = a.u.YUVA;
                j.y = b;
                j.y_off = c;
                j.y_stride = e;
                j.y_size = i;
                j.u = b;
                j.u_off = c + i;
                j.u_stride = f;
                j.u_size = g;
                j.v = b;
                j.v_off = c + i + g;
                j.v_stride = f;
                j.v_size = g;
                if (d == MODE_YUVA) {
                    j.a = b;
                    j.a_off = c + i + 2 * g
                }
                j.a_size = a_size;
                j.a_stride = a_stride
            } else {
                var j = a.u.RGBA;
                j.rgba = b;
                j.rgba_off = c;
                j.stride = e;
                j.size = i
            }
        }
        return CheckDecBuffer(a)
    }

    function WebPAllocateDecBuffer(w, h, a, b) {
        if (b == null || w <= 0 || h <= 0) {
            return VP8_STATUS_INVALID_PARAM
        }
        if (a != null) {
            if (a.use_cropping) {
                var c = a.crop_width;
                var d = a.crop_height;
                var x = a.crop_left & ~1;
                var y = a.crop_top & ~1;
                if (x < 0 || y < 0 || c <= 0 || d <= 0 || x + c > w || y + d > h) {
                    return VP8_STATUS_INVALID_PARAM
                }
                w = c;
                h = d
            }
            if (a.use_scaling) {
                if (a.scaled_width <= 0 || a.scaled_height <= 0) {
                    return VP8_STATUS_INVALID_PARAM
                }
                w = a.scaled_width;
                h = a.scaled_height
            }
        }
        b.width = w;
        b.height = h;
        return AllocateBuffer(b)
    }

    function WebPInitDecBufferInternal(a, b) {
        if (b != N) return 0;
        if (!a) return 0;
        memset_(a, 0, 0, sizeof(a) * a.length);
        return 1
    }
    this.WebPFreeDecBuffer = function(a) {
        if (a) {
            if (!a.is_external_memory) a.private_memory = '';
            a.private_memory_off = 0;
            a.private_memory = a.private_memory_off = null
        }
    };

    function WebPCopyDecBuffer(a, b) {
        alert('todo: WebPCopyDecBuffer')
    }

    function WebPGrabDecBuffer(a, b) {
        alert('todo: WebPGrabDecBuffer')
    }

    function VP8DecodeLayer(a) {
        assert(a);
        assert(a.layer_data_size_ > 0);
        return 1
    }
    var bB = Arr((255 + 255 + 1), uint8_t);
    var bC = Arr((255 + 255 + 1), uint8_t);
    var bD = Arr((1020 + 1020 + 1), int8_t);
    var bE = Arr((112 + 112 + 1), int8_t);
    var bF = Arr((255 + 510 + 1), uint8_t);
    var bG = 0;

    function VP8DspInitTables(a) {
        if (!bG) {
            var i;
            for (i = -255; i <= 255; ++i) {
                bB[255 + i] = (i < 0) ? -i : i;
                bC[255 + i] = bB[255 + i] >> 1
            }
            for (i = -1020; i <= 1020; ++i) {
                bD[1020 + i] = (i < -128) ? -128 : (i > 127) ? 127 : i
            }
            for (i = -112; i <= 112; ++i) {
                bE[112 + i] = (i < -16) ? -16 : (i > 15) ? 15 : i
            }
            for (i = -255; i <= 255 + 255; ++i) {
                bF[255 + i] = (i < 0) ? 0 : (i > 255) ? 255 : i
            }
            bG = 1
        }
    };

    function clip_8b(v) {
        return (!(v & ~0xff)) ? v : (v < 0) ? 0 : 255
    };

    function STORE(x, y, v) {
        dst[dst_off + x + y * bj] = clip_8b(dst_off + dst[x + y * bj] + ((v) >> 3))
    };
    var bH = 20091 + (1 << 16);
    var bI = 35468;

    function MUL(a, b) {
        return (((a) * (b)) >> 16)
    }

    function TransformOne(e, f, g, h) {
        var C = Arr(4 * 4, 0),
            tmp, tmp_off;
        tmp_off = 0;
        var i;
        tmp = C;
        for (i = 0; i < 4; ++i) {
            var a = e[f + 0] + e[f + 8];
            var b = e[f + 0] - e[f + 8];
            var c = MUL(e[f + 4], bI) - MUL(e[f + 12], bH);
            var d = MUL(e[f + 4], bH) + MUL(e[f + 12], bI);
            tmp[tmp_off + 0] = a + d;
            tmp[tmp_off + 1] = b + c;
            tmp[tmp_off + 2] = b - c;
            tmp[tmp_off + 3] = a - d;
            tmp_off += 4;
            f++
        }
        tmp_off = 0;
        for (i = 0; i < 4; ++i) {
            var j = tmp[tmp_off + 0] + 4;
            var a = j + tmp[tmp_off + 8];
            var b = j - tmp[tmp_off + 8];
            var c = MUL(tmp[tmp_off + 4], bI) - MUL(tmp[tmp_off + 12], bH);
            var d = MUL(tmp[tmp_off + 4], bH) + MUL(tmp[tmp_off + 12], bI);
            g[h + 0 + 0 * bj] = clip_8b(g[h + 0 + 0 * bj] + ((a + d) >> 3));
            g[h + 1 + 0 * bj] = clip_8b(g[h + 1 + 0 * bj] + ((b + c) >> 3));
            g[h + 2 + 0 * bj] = clip_8b(g[h + 2 + 0 * bj] + ((b - c) >> 3));
            g[h + 3 + 0 * bj] = clip_8b(g[h + 3 + 0 * bj] + ((a - d) >> 3));
            tmp_off++;
            h += bj
        }
    };

    function TransformTwo(a, b, c, d, e) {
        TransformOne(a, b, c, d);
        if (e) {
            TransformOne(a, b + 16, c, d + 4)
        }
    }

    function TransformUV(a, b, c, d) {
        bM(a, b + 0 * 16, c, d + 0, 1);
        bM(a, b + 2 * 16, c, d + 4 * bj, 1)
    }

    function TransformDC(a, b, c, d) {
        var e = a[b + 0] + 4;
        var i, j;
        for (j = 0; j < 4; ++j) {
            for (i = 0; i < 4; ++i) {
                var f = c[d + i + j * bj];
                c[d + i + j * bj] = clip_8b(c[d + i + j * bj] + ((e) >> 3))
            }
        }
    };

    function TransformDCUV(a, b, c, d) {
        if (a[b + 0 * 16]) TransformDC(a, b + 0 * 16, c, d + 0);
        if (a[b + 1 * 16]) TransformDC(a, b + 1 * 16, c, d + 4);
        if (a[b + 2 * 16]) TransformDC(a, b + 2 * 16, c, d + 4 * bj);
        if (a[b + 3 * 16]) TransformDC(a, b + 3 * 16, c, d + 4 * bj + 4)
    };

    function TransformWHT(a, b) {
        var c = Arr(16, int);
        var i = int;
        for (i = 0; i < 4; ++i) {
            var d = a[0 + i] + a[12 + i];
            var e = a[4 + i] + a[8 + i];
            var f = a[4 + i] - a[8 + i];
            var g = a[0 + i] - a[12 + i];
            c[0 + i] = d + e;
            c[8 + i] = d - e;
            c[4 + i] = g + f;
            c[12 + i] = g - f
        }
        for (i = 0; i < 4; ++i) {
            var h = b[b.length - 1];
            var j = c[0 + i * 4] + 3;
            var d = j + c[3 + i * 4];
            var e = c[1 + i * 4] + c[2 + i * 4];
            var f = c[1 + i * 4] - c[2 + i * 4];
            var g = j - c[3 + i * 4];
            b[h + 0] = (d + e) >> 3;
            b[h + 16] = (g + f) >> 3;
            b[h + 32] = (d - e) >> 3;
            b[h + 48] = (g - f) >> 3;
            b[b.length - 1] += 64
        }
    };

    function VP8TransformWHT(a, b) {
        TransformWHT(a, b)
    };

    function OUT(x, y) {
        dst[(x) + (y) * bj]
    }

    function TrueMotion(a, b, c) {
        var d = a;
        var e = b - bj;
        var f = bF;
        var g = +255 - d[e - 1];
        var y;
        for (y = 0; y < c; ++y) {
            var h = f;
            var i = g + a[b - 1];
            var x;
            for (x = 0; x < c; ++x) {
                a[b + x] = h[i + d[e + x]]
            }
            b += bj
        }
    };

    function TM4(a, b) {
        TrueMotion(a, b, 4)
    }

    function TM8uv(a, b) {
        TrueMotion(a, b, 8)
    }

    function TM16(a, b) {
        TrueMotion(a, b, 16)
    }

    function VE16(a, b) {
        var j;
        for (j = 0; j < 16; ++j) {
            memcpy(a, b + j * bj, a, b - bj, 16)
        }
    };

    function HE16(a, b) {
        var j;
        for (j = 16; j > 0; --j) {
            memset_(a, b + 0, a[b - 1], 16);
            b += bj
        }
    };

    function Put16(v, a, b) {
        var j;
        for (j = 0; j < 16; ++j) {
            for (i = 0; i < (16); ++i) a[b + j * bj + i] = v
        }
    };

    function DC16(a, b) {
        var c = 16;
        var j;
        for (j = 0; j < 16; ++j) {
            c += a[b - 1 + j * bj] + a[b + j - bj]
        }
        Put16(c >> 5, a, b)
    };

    function DC16NoTop(a, b) {
        var c = 8;
        var j;
        for (j = 0; j < 16; ++j) {
            c += a[b - 1 + j * bj]
        }
        Put16(c >> 4, a, b)
    };

    function DC16NoLeft(a, b) {
        var c = 8;
        var i;
        for (i = 0; i < 16; ++i) {
            c += a[b + i - bj]
        }
        Put16(c >> 4, a, b)
    };

    function DC16NoTopLeft(a, b) {
        Put16(0x80, a, b)
    };

    function AVG3(a, b, c) {
        return (((a) + 2 * (b) + (c) + 2) >> 2)
    };

    function AVG2(a, b) {
        return (((a) + (b) + 1) >> 1)
    };

    function VE4(a, b) {
        var c = a;
        var d = b - bj;
        var e = new Array();
        e.push(AVG3(c[d - 1], c[d + 0], c[d + 1]));
        e.push(AVG3(c[d + 0], c[d + 1], c[d + 2]));
        e.push(AVG3(c[d + 1], c[d + 2], c[d + 3]));
        e.push(AVG3(c[d + 2], c[d + 3], c[d + 4]));
        var i;
        for (i = 0; i < 4; ++i) {
            memcpy(a, b + i * bj, e, 0, 4 * sizeof(e))
        }
    };

    function HE4(a, b) {
        var A = a[b - 1 - bj];
        var B = a[b - 1];
        var C = a[b - 1 + bj];
        var D = a[b - 1 + 2 * bj];
        var E = a[b - 1 + 3 * bj];
        a[b + 0 + 0 * bj] = a[b + 1 + 0 * bj] = a[b + 2 + 0 * bj] = a[b + 3 + 0 * bj] = AVG3(A, B, C);
        a[b + 0 + 1 * bj] = a[b + 1 + 1 * bj] = a[b + 2 + 1 * bj] = a[b + 3 + 1 * bj] = AVG3(B, C, D);
        a[b + 0 + 2 * bj] = a[b + 1 + 2 * bj] = a[b + 2 + 2 * bj] = a[b + 3 + 2 * bj] = AVG3(C, D, E);
        a[b + 0 + 3 * bj] = a[b + 1 + 3 * bj] = a[b + 2 + 3 * bj] = a[b + 3 + 3 * bj] = AVG3(D, E, E)
    };

    function DC4(a, b) {
        var c = 4;
        var i;
        for (i = 0; i < 4; ++i) c += a[b + i - bj] + a[b - 1 + i * bj];
        c >>= 3;
        for (i = 0; i < 4; ++i) {
            memset_(a, b + i * bj, c, 4)
        }
    };

    function RD4(a, b) {
        var I = a[b - 1 + 0 * bj];
        var J = a[b - 1 + 1 * bj];
        var K = a[b - 1 + 2 * bj];
        var L = a[b - 1 + 3 * bj];
        var X = a[b - 1 - bj];
        var A = a[b + 0 - bj];
        var B = a[b + 1 - bj];
        var C = a[b + 2 - bj];
        var D = a[b + 3 - bj];
        a[b + (0) + (3) * bj] = AVG3(J, K, L);
        a[b + (0) + (2) * bj] = a[b + (1) + (3) * bj] = AVG3(I, J, K);
        a[b + (0) + (1) * bj] = a[b + (1) + (2) * bj] = a[b + (2) + (3) * bj] = AVG3(X, I, J);
        a[b + (0) + (0) * bj] = a[b + (1) + (1) * bj] = a[b + (2) + (2) * bj] = a[b + (3) + (3) * bj] = AVG3(A, X, I);
        a[b + (1) + (0) * bj] = a[b + (2) + (1) * bj] = a[b + (3) + (2) * bj] = AVG3(B, A, X);
        a[b + (2) + (0) * bj] = a[b + (3) + (1) * bj] = AVG3(C, B, A);
        a[b + (3) + (0) * bj] = AVG3(D, C, B)
    };

    function LD4(a, b) {
        var A = a[b + 0 - bj];
        var B = a[b + 1 - bj];
        var C = a[b + 2 - bj];
        var D = a[b + 3 - bj];
        var E = a[b + 4 - bj];
        var F = a[b + 5 - bj];
        var G = a[b + 6 - bj];
        var H = a[b + 7 - bj];
        a[b + (0) + (0) * bj] = AVG3(A, B, C);
        a[b + (1) + (0) * bj] = a[b + (0) + (1) * bj] = AVG3(B, C, D);
        a[b + (2) + (0) * bj] = a[b + (1) + (1) * bj] = a[b + (0) + (2) * bj] = AVG3(C, D, E);
        a[b + (3) + (0) * bj] = a[b + (2) + (1) * bj] = a[b + (1) + (2) * bj] = a[b + (0) + (3) * bj] = AVG3(D, E, F);
        a[b + (3) + (1) * bj] = a[b + (2) + (2) * bj] = a[b + (1) + (3) * bj] = AVG3(E, F, G);
        a[b + (3) + (2) * bj] = a[b + (2) + (3) * bj] = AVG3(F, G, H);
        a[b + (3) + (3) * bj] = AVG3(G, H, H)
    };

    function VR4(a, b) {
        var I = a[b - 1 + 0 * bj];
        var J = a[b - 1 + 1 * bj];
        var K = a[b - 1 + 2 * bj];
        var X = a[b - 1 - bj];
        var A = a[b + 0 - bj];
        var B = a[b + 1 - bj];
        var C = a[b + 2 - bj];
        var D = a[b + 3 - bj];
        a[b + (0) + (0) * bj] = a[b + (1) + (2) * bj] = AVG2(X, A);
        a[b + (1) + (0) * bj] = a[b + (2) + (2) * bj] = AVG2(A, B);
        a[b + (2) + (0) * bj] = a[b + (3) + (2) * bj] = AVG2(B, C);
        a[b + (3) + (0) * bj] = AVG2(C, D);
        a[b + (0) + (3) * bj] = AVG3(K, J, I);
        a[b + (0) + (2) * bj] = AVG3(J, I, X);
        a[b + (0) + (1) * bj] = a[b + (1) + (3) * bj] = AVG3(I, X, A);
        a[b + (1) + (1) * bj] = a[b + (2) + (3) * bj] = AVG3(X, A, B);
        a[b + (2) + (1) * bj] = a[b + (3) + (3) * bj] = AVG3(A, B, C);
        a[b + (3) + (1) * bj] = AVG3(B, C, D)
    };

    function VL4(a, b) {
        var A = a[b + 0 - bj];
        var B = a[b + 1 - bj];
        var C = a[b + 2 - bj];
        var D = a[b + 3 - bj];
        var E = a[b + 4 - bj];
        var F = a[b + 5 - bj];
        var G = a[b + 6 - bj];
        var H = a[b + 7 - bj];
        a[b + (0) + (0) * bj] = AVG2(A, B);
        a[b + (1) + (0) * bj] = a[b + (0) + (2) * bj] = AVG2(B, C);
        a[b + (2) + (0) * bj] = a[b + (1) + (2) * bj] = AVG2(C, D);
        a[b + (3) + (0) * bj] = a[b + (2) + (2) * bj] = AVG2(D, E);
        a[b + (0) + (1) * bj] = AVG3(A, B, C);
        a[b + (1) + (1) * bj] = a[b + (0) + (3) * bj] = AVG3(B, C, D);
        a[b + (2) + (1) * bj] = a[b + (1) + (3) * bj] = AVG3(C, D, E);
        a[b + (3) + (1) * bj] = a[b + (2) + (3) * bj] = AVG3(D, E, F);
        a[b + (3) + (2) * bj] = AVG3(E, F, G);
        a[b + (3) + (3) * bj] = AVG3(F, G, H)
    };

    function HU4(a, b) {
        var I = a[b - 1 + 0 * bj];
        var J = a[b - 1 + 1 * bj];
        var K = a[b - 1 + 2 * bj];
        var L = a[b - 1 + 3 * bj];
        a[b + (0) + (0) * bj] = AVG2(I, J);
        a[b + (2) + (0) * bj] = a[b + (0) + (1) * bj] = AVG2(J, K);
        a[b + (2) + (1) * bj] = a[b + (0) + (2) * bj] = AVG2(K, L);
        a[b + (1) + (0) * bj] = AVG3(I, J, K);
        a[b + (3) + (0) * bj] = a[b + (1) + (1) * bj] = AVG3(J, K, L);
        a[b + (3) + (1) * bj] = a[b + (1) + (2) * bj] = AVG3(K, L, L);
        a[b + (3) + (2) * bj] = a[b + (2) + (2) * bj] = a[b + (0) + (3) * bj] = a[b + (1) + (3) * bj] = a[b + (2) + (3) * bj] = a[b + (3) + (3) * bj] = L
    };

    function HD4(a, b) {
        var I = a[b - 1 + 0 * bj];
        var J = a[b - 1 + 1 * bj];
        var K = a[b - 1 + 2 * bj];
        var L = a[b - 1 + 3 * bj];
        var X = a[b - 1 - bj];
        var A = a[b + 0 - bj];
        var B = a[b + 1 - bj];
        var C = a[b + 2 - bj];
        a[b + (0) + (0) * bj] = a[b + (2) + (1) * bj] = AVG2(I, X);
        a[b + (0) + (1) * bj] = a[b + (2) + (2) * bj] = AVG2(J, I);
        a[b + (0) + (2) * bj] = a[b + (2) + (3) * bj] = AVG2(K, J);
        a[b + (0) + (3) * bj] = AVG2(L, K);
        a[b + (3) + (0) * bj] = AVG3(A, B, C);
        a[b + (2) + (0) * bj] = AVG3(X, A, B);
        a[b + (1) + (0) * bj] = a[b + (3) + (1) * bj] = AVG3(I, X, A);
        a[b + (1) + (1) * bj] = a[b + (3) + (2) * bj] = AVG3(J, I, X);
        a[b + (1) + (2) * bj] = a[b + (3) + (3) * bj] = AVG3(K, J, I);
        a[b + (1) + (3) * bj] = AVG3(L, K, J)
    };

    function VE8uv(a, b) {
        var j;
        for (j = 0; j < 8; ++j) {
            memcpy(a, b + j * bj, a, b - bj, 8)
        }
    };

    function HE8uv(a, b) {
        var j;
        for (j = 0; j < 8; ++j) {
            memset_(a, b + 0, a[b - 1], 8);
            b += bj
        }
    };

    function Put8x8uv(v, a, b) {
        var j, k;
        for (j = 0; j < 8; ++j) {
            for (k = 0; k < 8; ++k) a[b + k + j * bj] = v
        }
    };

    function DC8uv(a, b) {
        var c = 8;
        var i;
        for (i = 0; i < 8; ++i) {
            c += a[b + i - bj] + a[b - 1 + i * bj]
        }
        Put8x8uv(((c >> 4) * 0x01), a, b)
    };

    function DC8uvNoLeft(a, b) {
        var c = 4;
        var i;
        for (i = 0; i < 8; ++i) {
            c += a[b + i - bj]
        }
        Put8x8uv(((c >> 3) * 0x01), a, b)
    };

    function DC8uvNoTop(a, b) {
        var c = 4;
        var i;
        for (i = 0; i < 8; ++i) {
            c += a[b - 1 + i * bj]
        }
        Put8x8uv(((c >> 3) * 0x01), a, b)
    };

    function DC8uvNoTopLeft(a, b) {
        Put8x8uv(0x80, a, b)
    };
    var bJ = new Array(function(v, o) {
        DC4(v, o)
    }, function(v, o) {
        TM4(v, o)
    }, function(v, o) {
        VE4(v, o)
    }, function(v, o) {
        HE4(v, o)
    }, function(v, o) {
        RD4(v, o)
    }, function(v, o) {
        VR4(v, o)
    }, function(v, o) {
        LD4(v, o)
    }, function(v, o) {
        VL4(v, o)
    }, function(v, o) {
        HD4(v, o)
    }, function(v, o) {
        HU4(v, o)
    });
    var bK = new Array(function(v, o) {
        DC16(v, o)
    }, function(v, o) {
        TM16(v, o)
    }, function(v, o) {
        VE16(v, o)
    }, function(v, o) {
        HE16(v, o)
    }, function(v, o) {
        DC16NoTop(v, o)
    }, function(v, o) {
        DC16NoLeft(v, o)
    }, function(v, o) {
        DC16NoTopLeft(v, o)
    });
    var bL = new Array(function(v, o) {
        DC8uv(v, o)
    }, function(v, o) {
        TM8uv(v, o)
    }, function(v, o) {
        VE8uv(v, o)
    }, function(v, o) {
        HE8uv(v, o)
    }, function(v, o) {
        DC8uvNoTop(v, o)
    }, function(v, o) {
        DC8uvNoLeft(v, o)
    }, function(v, o) {
        DC8uvNoTopLeft(v, o)
    });

    function do_filter2(p, b, c) {
        var d = p[b - 2 * c],
            p0 = p[b - c],
            q0 = p[b + 0],
            q1 = p[b + c];
        var a = 3 * (q0 - p0) + bD[1020 + d - q1];
        var e = bE[112 + ((a + 4) >> 3)];
        var f = bE[112 + ((a + 3) >> 3)];
        p[b - c] = bF[255 + p0 + f];
        p[b + 0] = bF[255 + q0 - e]
    };

    function do_filter4(p, b, c) {
        var d = p[b - 2 * c],
            p0 = p[b - c],
            q0 = p[b + 0],
            q1 = p[b + c];
        var a = 3 * (q0 - p0);
        var e = bE[112 + ((a + 4) >> 3)];
        var f = bE[112 + ((a + 3) >> 3)];
        var g = (e + 1) >> 1;
        p[b - 2 * c] = bF[255 + d + g];
        p[b - c] = bF[255 + p0 + f];
        p[b + 0] = bF[255 + q0 - e];
        p[b + c] = bF[255 + q1 - g]
    };

    function do_filter6(p, b, c) {
        var d = p[b - 3 * c],
            p1 = p[b - 2 * c],
            p0 = p[b - c];
        var e = p[b + 0],
            q1 = p[b + c],
            q2 = p[b + 2 * c];
        var a = bD[1020 + 3 * (e - p0) + bD[1020 + p1 - q1]];
        var f = (27 * a + 63) >> 7;
        var g = (18 * a + 63) >> 7;
        var h = (9 * a + 63) >> 7;
        p[b - 3 * c] = bF[255 + d + h];
        p[b - 2 * c] = bF[255 + p1 + g];
        p[b - c] = bF[255 + p0 + f];
        p[b + 0] = bF[255 + e - f];
        p[b + c] = bF[255 + q1 - g];
        p[b + 2 * c] = bF[255 + q2 - h]
    };

    function hev(p, a, b, c) {
        var d = p[a - 2 * b],
            p0 = p[a - b],
            q0 = p[a + 0],
            q1 = p[a + b];
        return (bB[255 + d - p0] > c) || (bB[255 + q1 - q0] > c)
    };

    function needs_filter(p, a, b, c) {
        var d = p[a - 2 * b],
            p0 = p[a - b],
            q0 = p[a + 0],
            q1 = p[a + b];
        return (2 * bB[255 + p0 - q0] + bC[255 + d - q1]) <= c
    };

    function needs_filter2(p, a, b, t, c) {
        var d = p[a - 4 * b],
            p2 = p[a - 3 * b],
            p1 = p[a - 2 * b],
            p0 = p[a - b];
        var e = p[a + 0],
            q1 = p[a + b],
            q2 = p[a + 2 * b],
            q3 = p[a + 3 * b];
        if ((2 * bB[255 + p0 - e] + bC[255 + p1 - q1]) > t) return 0;
        return bB[255 + d - p2] <= c && bB[255 + p2 - p1] <= c && bB[255 + p1 - p0] <= c && bB[255 + q3 - q2] <= c && bB[255 + q2 - q1] <= c && bB[255 + q1 - e] <= c
    };

    function SimpleVFilter16(p, a, b, c) {
        var i;
        for (i = 0; i < 16; ++i) {
            if (needs_filter(p, a + i, b, c)) {
                do_filter2(p, a + i, b)
            }
        }
    };

    function SimpleHFilter16(p, a, b, c) {
        var i;
        for (i = 0; i < 16; ++i) {
            if (needs_filter(p, a + i * b, 1, c)) {
                do_filter2(p, a + i * b, 1)
            }
        }
    };

    function SimpleVFilter16i(p, a, b, c) {
        var k;
        for (k = 3; k > 0; --k) {
            a += 4 * b;
            SimpleVFilter16(p, a + 0, b, c)
        }
    };

    function SimpleHFilter16i(p, a, b, c) {
        var k;
        for (k = 3; k > 0; --k) {
            a += 4;
            SimpleHFilter16(p, a + 0, b, c)
        }
    };

    function FilterLoop26(p, a, b, c, d, e, f, g) {
        while (d-- > 0) {
            if (needs_filter2(p, a + 0, b, e, f)) {
                if (hev(p, a + 0, b, g)) {
                    do_filter2(p, a + 0, b)
                } else {
                    do_filter6(p, a + 0, b)
                }
            }
            a += c
        }
    };

    function FilterLoop24(p, a, b, c, d, e, f, g) {
        while (d-- > 0) {
            if (needs_filter2(p, a + 0, b, e, f)) {
                if (hev(p, a + 0, b, g)) {
                    do_filter2(p, a + 0, b)
                } else {
                    do_filter4(p, a + 0, b)
                }
            }
            a += c
        }
    };

    function VFilter16(p, a, b, c, d, e) {
        FilterLoop26(p, a + 0, b, 1, 16, c, d, e)
    }

    function HFilter16(p, a, b, c, d, e) {
        FilterLoop26(p, a + 0, 1, b, 16, c, d, e)
    };

    function VFilter16i(p, a, b, c, d, e) {
        var k;
        for (k = 3; k > 0; --k) {
            a += 4 * b;
            FilterLoop24(p, a + 0, b, 1, 16, c, d, e)
        }
    };

    function HFilter16i(p, a, b, c, d, e) {
        var k;
        for (k = 3; k > 0; --k) {
            a += 4;
            FilterLoop24(p, a + 0, 1, b, 16, c, d, e)
        }
    };

    function VFilter8(u, a, v, b, c, d, e, f) {
        FilterLoop26(u, a, c, 1, 8, d, e, f);
        FilterLoop26(v, b, c, 1, 8, d, e, f)
    };

    function HFilter8(u, a, v, b, c, d, e, f) {
        FilterLoop26(u, a, 1, c, 8, d, e, f);
        FilterLoop26(v, b, 1, c, 8, d, e, f)
    };

    function VFilter8i(u, a, v, b, c, d, e, f) {
        FilterLoop24(u, a + 4 * c, c, 1, 8, d, e, f);
        FilterLoop24(v, b + 4 * c, c, 1, 8, d, e, f)
    };

    function HFilter8i(u, a, v, b, c, d, e, f) {
        FilterLoop24(u, a + 4, 1, c, 8, d, e, f);
        FilterLoop24(v, b + 4, 1, c, 8, d, e, f)
    };
    var bM;
    var bN;
    var bO;
    var bP;
    var bQ;
    var bR;
    var bS;
    var bT;
    var bU;
    var bV;
    var bW;
    var bX;
    var bY;
    var bZ;
    var ca;
    var cb;

    function VP8DspInit(a) {
        bM = TransformTwo;
        bN = TransformUV;
        bO = TransformDC;
        bP = TransformDCUV;
        bQ = VFilter16;
        bR = HFilter16;
        bS = VFilter8;
        bT = HFilter8;
        bU = VFilter16i;
        bV = HFilter16i;
        bW = VFilter8i;
        bX = HFilter8i;
        bY = SimpleVFilter16;
        bZ = SimpleHFilter16;
        ca = SimpleVFilter16i;
        cb = SimpleHFilter16i
    };
    var cc = (32 - 1);
    var cd = 3;
    var ce = 1;

    function InitThreadContext(a) {
        a.cache_id_ = 0;
        if (a.use_threads_) {
            var b = a.worker_;
            if (!WebPWorkerReset(b)) {
                return VP8SetError(a, VP8_STATUS_OUT_OF_MEMORY, "thread initialization failed.")
            }
            b.data1 = a;
            b.data2 = a.thread_ctx_.io_;
            b.hook = VP8FinishRow;
            a.num_caches_ = (a.filter_type_ > 0) ? cd : cd - 1
        } else {
            a.num_caches_ = ce
        }
        return 1
    }
    var cf = new Array(0, 2, 8);

    function AllocateMemory(a) {
        var b = a.num_caches_;
        var c = a.mb_w_;
        var d = 4 * c * sizeof(uint8_t);
        var e = (16 + 8 + 8) * c;
        var f = (c + 1) * sizeof(bw);
        var g = (a.filter_type_ > 0) ? c * (a.use_threads_ ? 2 : 1) * sizeof(bv) : 0;
        var h = bk * sizeof(a.yuv_b_);
        var i = 384 * sizeof(a.coeffs_);
        var j = (16 * b + parseInt(cf[a.filter_type_]) * 3 / 2);
        var k = e * j;
        var l = a.alpha_data_ ? (a.pic_hdr_.width_ * a.pic_hdr_.height_) : 0;
        var m = d + e + f + g + h + i + k + l + cc;
        var n = uint8_t,
            mem_offset = 0;
        if (m > a.mem_size_) {
            a.mem_ = 0;
            a.mem_size_ = 0;
            if (a.mem_ == null) {
                return VP8SetError(a, 'VP8_STATUS_OUT_OF_MEMORY', "no memory during frame initialization.")
            }
            a.mem_size_ = m
        }
        n = a.mem_;
        a.intra_t_ = 205;
        a.y_t_ = memset(205, (16 * c) * sizeof(a.y_t_));
        a.u_t_ = memset(205, (8 * c) * sizeof(a.u_t_));
        a.v_t_ = memset(205, (8 * c) * sizeof(a.v_t_));
        a.f_info_ = g ? memset_wl(bv, g) : null;
        a.f_info_off = g ? 0 : null;
        a.thread_ctx_.id_ = 0;
        a.thread_ctx_.f_info_ = a.f_info_;
        if (a.use_threads_) {
            a.thread_ctx_.f_info_off += c
        }
        assert((h & cc) == 0);
        a.yuv_b_ = memset(205, h * sizeof(a.yuv_b_));
        a.coeffs_ = -12851;
        a.cache_y_stride_ = 16 * c;
        a.cache_uv_stride_ = 8 * c; {
            var o = cf[a.filter_type_];
            var p = o * a.cache_y_stride_;
            var q = (o / 2) * a.cache_uv_stride_;
            a.cache_y_ = Arr(k, 205);
            a.cache_y_off = +p;
            a.cache_u_ = a.cache_y_;
            a.cache_u_off = a.cache_y_off + 16 * b * a.cache_y_stride_ + q;
            a.cache_v_ = a.cache_u_;
            a.cache_v_off = a.cache_u_off + 8 * b * a.cache_uv_stride_ + q
        }
        a.alpha_plane_ = l ? Arr(l, uint8_t) : null;
        a.mb_info_ = memset_wl(bw, f);
        a.intra_t_ = memset(bh, d);
        return 1
    }

    function InitIo(a, b) {
        b.width = a.pic_hdr_.width_;
        b.height = a.pic_hdr_.height_;
        b.mb_y = 0;
        b.y = a.cache_y_;
        b.y_off = a.cache_y_off;
        b.u = a.cache_u_;
        b.u_off = a.cache_u_off;
        b.v = a.cache_v_;
        b.v_off = a.cache_v_off;
        b.y_stride = a.cache_y_stride_;
        b.uv_stride = a.cache_uv_stride_;
        b.fancy_upsampling = 0;
        b.a = null;
        b.a_off = null
    }

    function VP8InitFrame(a, b) {
        if (!InitThreadContext(a)) return 0;
        if (!AllocateMemory(a)) return 0;
        InitIo(a, b);
        VP8DspInitTables();
        VP8DspInit();
        return 1
    }

    function hev_thresh_from_level(a, b) {
        if (b) {
            return (a >= 40) ? 2 : (a >= 15) ? 1 : 0
        } else {
            return (a >= 40) ? 3 : (a >= 20) ? 2 : (a >= 15) ? 1 : 0
        }
    }

    function DoFilter(a, b, c) {
        var d = a.thread_ctx_;
        var e = a.cache_y_stride_;
        var f = d.f_info_[1 + b];
        var g = a.cache_y_;
        var h = a.cache_y_off + d.id_ * 16 * e + b * 16;
        var i = f.f_level_;
        var j = f.f_ilevel_;
        var k = 2 * i + j;
        if (i == 0) {
            return
        }
        if (a.filter_type_ == 1) {
            if (b > 0) {
                bZ(g, h, e, k + 4)
            }
            if (f.f_inner_) {
                cb(g, h, e, k)
            }
            if (c > 0) {
                bY(g, h, e, k + 4)
            }
            if (f.f_inner_) {
                ca(g, h, e, k)
            }
        } else {
            var l = a.cache_uv_stride_;
            var m = a.cache_u_;
            var n = a.cache_u_off + d.id_ * 8 * l + b * 8;
            var o = a.cache_v_;
            var p = a.cache_v_off + d.id_ * 8 * l + b * 8;
            var q = hev_thresh_from_level(i, a.frm_hdr_.key_frame_);
            if (b > 0) {
                bR(g, h, e, k + 4, j, q);
                bT(m, n, o, p, l, k + 4, j, q)
            }
            if (f.f_inner_) {
                bV(g, h, e, k, j, q);
                bX(m, n, o, p, l, k, j, q)
            }
            if (c > 0) {
                bQ(g, h, e, k + 4, j, q);
                bS(m, n, o, p, l, k + 4, j, q)
            }
            if (f.f_inner_) {
                bU(g, h, e, k, j, q);
                bW(m, n, o, p, l, k, j, q)
            }
        }
    }

    function FilterRow(a) {
        var b = int;
        var c = a.thread_ctx_.mb_y_;
        assert(a.thread_ctx_.filter_row_);
        for (b = a.tl_mb_x_; b < a.br_mb_x_; ++b) {
            DoFilter(a, b, c)
        }
    }

    function VP8StoreBlock(a) {
        if (a.filter_type_ > 0) {
            var b = a.f_info_[1 + a.mb_x_];
            var c = a.mb_info_[1 + a.mb_x_].skip_;
            var d = a.filter_levels_[a.segment_];
            if (a.filter_hdr_.use_lf_delta_) {
                d += a.filter_hdr_.ref_lf_delta_[0];
                if (a.is_i4x4_) {
                    d += a.filter_hdr_.mode_lf_delta_[0]
                }
            }
            d = (d < 0) ? 0 : (d > 63) ? 63 : d;
            b.f_level_ = d;
            if (a.filter_hdr_.sharpness_ > 0) {
                if (a.filter_hdr_.sharpness_ > 4) {
                    d >>= 2
                } else {
                    d >>= 1
                }
                if (d > 9 - a.filter_hdr_.sharpness_) {
                    d = 9 - a.filter_hdr_.sharpness_
                }
            }
            b.f_ilevel_ = (d < 1) ? 1 : d;
            b.f_inner_ = (!c || a.is_i4x4_) + 0
        } {
            var y;
            var e = a.cache_id_ * 16 * a.cache_y_stride_;
            var f = a.cache_id_ * 8 * a.cache_uv_stride_;
            var g = a.cache_y_;
            var h = a.cache_y_off + a.mb_x_ * 16 + e;
            var i = a.cache_u_;
            var j = a.cache_u_off + a.mb_x_ * 8 + f;
            var k = a.cache_v_;
            var l = a.cache_v_off + a.mb_x_ * 8 + f;
            for (y = 0; y < 16; ++y) {
                memcpy(g, h + y * a.cache_y_stride_, a.yuv_b_, +bm + y * bj, 16)
            }
            for (y = 0; y < 8; ++y) {
                memcpy(i, j + y * a.cache_uv_stride_, a.yuv_b_, +bn + y * bj, 8);
                memcpy(k, l + y * a.cache_uv_stride_, a.yuv_b_, +bo + y * bj, 8)
            }
        }
    }

    function MACROBLOCK_VPOS(a) {
        return ((a) * 16)
    }

    function VP8FinishRow(a, b) {
        var c = 1;
        var d = a.thread_ctx_;
        var e = cf[a.filter_type_];
        var f = e * a.cache_y_stride_;
        var g = parseInt(e / 2) * a.cache_uv_stride_;
        var h = d.id_ * 16 * a.cache_y_stride_;
        var i = d.id_ * 8 * a.cache_uv_stride_;
        var j = a.cache_y_;
        var k = a.cache_y_off - f + h;
        var l = a.cache_u_;
        var m = a.cache_u_off - g + i;
        var n = a.cache_v_;
        var o = a.cache_v_off - g + i;
        var p = (d.mb_y_ == 0);
        var q = (d.mb_y_ >= a.mb_h_ - 1) + 0;
        var r = MACROBLOCK_VPOS(d.mb_y_);
        var s = MACROBLOCK_VPOS(d.mb_y_ + 1);
        if (d.filter_row_) {
            FilterRow(a)
        }
        if (b.put) {
            if (!p) {
                r -= e;
                b.y = j;
                b.y_off = k;
                b.u = l;
                b.u_off = m;
                b.v = n;
                b.v_off = o
            } else {
                b.y = a.cache_y_;
                b.y_off = a.cache_y_off + h;
                b.u = a.cache_u_;
                b.u_off = a.cache_u_off + i;
                b.v = a.cache_v_;
                b.v_off = a.cache_v_off + i
            }
            if (!q) {
                s -= e
            }
            if (s > b.crop_bottom) {
                s = b.crop_bottom
            }
            if (a.alpha_data_) {
                if (r == 0) {
                    b.a = VP8DecompressAlphaRows(a, r, s - r);
                    b.a_off = 0
                } else {
                    b.a_off = VP8DecompressAlphaRows(a, r, s - r)
                }
                if (b.a == null) {
                    return VP8SetError(a, VP8_STATUS_BITSTREAM_ERROR, "Could not decode alpha data.")
                }
            }
            if (r < b.crop_top) {
                var t = b.crop_top - r;
                r = b.crop_top;
                assert(!(t & 1));
                b.y_off += a.cache_y_stride_ * t;
                b.u_off += a.cache_uv_stride_ * (t >> 1);
                b.v_off += a.cache_uv_stride_ * (t >> 1);
                if (b.a) {
                    b.a_off += b.width * t
                }
            }
            if (r < s) {
                b.y_off += b.crop_left;
                b.u_off += b.crop_left >> 1;
                b.v_off += b.crop_left >> 1;
                if (b.a) {
                    b.a_off += b.crop_left
                }
                b.mb_y = r - b.crop_top;
                b.mb_w = b.crop_right - b.crop_left;
                b.mb_h = s - r;
                c = b.put(b)
            }
        }
        if (d.id_ + 1 == a.num_caches_) {
            if (!q) {
                memcpy(a.cache_y_, a.cache_y_off - f, j, k + 16 * a.cache_y_stride_, f);
                memcpy(a.cache_u_, a.cache_u_off - g, l, m + 8 * a.cache_uv_stride_, g);
                memcpy(a.cache_v_, a.cache_v_off - g, n, o + 8 * a.cache_uv_stride_, g)
            }
        }
        return c
    }

    function VP8ProcessRow(a, b) {
        var c = 1;
        var d = a.thread_ctx_;
        if (!a.use_threads_) {
            d.mb_y_ = a.mb_y_;
            d.filter_row_ = a.filter_row_;
            c = VP8FinishRow(a, b)
        } else {
            var e = a.worker_;
            c &= WebPWorkerSync(e);
            assert(e.status_ == OK);
            if (c) {
                d.io_ = b;
                d.id_ = a.cache_id_;
                d.mb_y_ = a.mb_y_;
                d.filter_row_ = a.filter_row_;
                if (d.filter_row_) {
                    var f = d.f_info_;
                    d.f_info_ = a.f_info_;
                    a.f_info_ = f
                }
                WebPWorkerLaunch(e);
                if (++a.cache_id_ == a.num_caches_) {
                    a.cache_id_ = 0
                }
            }
        }
        return c
    }

    function VP8EnterCritical(a, b) {
        if (b.setup && !b.setup(b)) {
            VP8SetError(a, VP8_STATUS_USER_ABORT, "Frame setup failed");
            return a.status_
        }
        if (b.bypass_filtering) {
            a.filter_type_ = 0
        } {
            var c = cf[a.filter_type_];
            if (a.filter_type_ == 2) {
                a.tl_mb_x_ = 0;
                a.tl_mb_y_ = 0
            } else {
                a.tl_mb_y_ = b.crop_top >> 4;
                a.tl_mb_x_ = b.crop_left >> 4
            }
            a.br_mb_y_ = (b.crop_bottom + 15 + c) >> 4;
            a.br_mb_x_ = (b.crop_right + 15 + c) >> 4;
            if (a.br_mb_x_ > a.mb_w_) {
                a.br_mb_x_ = a.mb_w_
            }
            if (a.br_mb_y_ > a.mb_h_) {
                a.br_mb_y_ = a.mb_h_
            }
        }
        return T
    }

    function VP8ExitCritical(a, b) {
        var c = 1;
        if (a.use_threads_) {
            c = WebPWorkerSync(a.worker_)
        }
        if (b.teardown) {
            b.teardown(b)
        }
        return c
    }
    var cg = new Array(0 + 0 * bj, 4 + 0 * bj, 8 + 0 * bj, 12 + 0 * bj, 0 + 4 * bj, 4 + 4 * bj, 8 + 4 * bj, 12 + 4 * bj, 0 + 8 * bj, 4 + 8 * bj, 8 + 8 * bj, 12 + 8 * bj, 0 + 12 * bj, 4 + 12 * bj, 8 + 12 * bj, 12 + 12 * bj);

    function CheckMode(a, b) {
        if (b == bh) {
            if (a.mb_x_ == 0) {
                return (a.mb_y_ == 0) ? B_DC_PRED_NOTOPLEFT : B_DC_PRED_NOLEFT
            } else {
                return (a.mb_y_ == 0) ? B_DC_PRED_NOTOP : bh
            }
        }
        return b
    }

    function Copy32b(a, b, c, d) {
        for (i = 0; i < 4; ++i) a[b + i] = c[d + i]
    }

    function VP8ReconstructBlock(a) {
        var b = a.yuv_b_;
        var c = bm;
        var d = a.yuv_b_;
        var e = bn;
        var f = a.yuv_b_;
        var g = bo;
        if (a.mb_x_ > 0) {
            var j;
            for (j = -1; j < 16; ++j) {
                Copy32b(b, (c + j * bj - 4), b, (c + j * bj + 12))
            }
            for (j = -1; j < 8; ++j) {
                Copy32b(d, (e + j * bj - 4), d, (e + j * bj + 4));
                Copy32b(f, (g + j * bj - 4), f, (g + j * bj + 4))
            }
        } else {
            var j;
            for (j = 0; j < 16; ++j) {
                b[c + j * bj - 1] = 129
            }
            for (j = 0; j < 8; ++j) {
                d[e + j * bj - 1] = 129;
                f[g + j * bj - 1] = 129
            }
            if (a.mb_y_ > 0) {
                b[c - 1 - bj] = d[e - 1 - bj] = f[g - 1 - bj] = 129
            }
        } {
            var h = a.y_t_;
            var k = +a.mb_x_ * 16;
            var l = a.u_t_;
            var m = +a.mb_x_ * 8;
            var o = a.v_t_;
            var p = +a.mb_x_ * 8;
            var q = a.coeffs_;
            var n;
            if (a.mb_y_ > 0) {
                memcpy(b, c - bj, h, k, 16);
                memcpy(d, e - bj, l, m, 8);
                memcpy(f, g - bj, o, p, 8)
            } else if (a.mb_x_ == 0) {
                for (i = 0; i < (16 + 4 + 1); ++i) b[c - bj - 1 + i] = 127;
                for (i = 0; i < (8 + 1); ++i) d[e - bj - 1 + i] = 127;
                for (i = 0; i < (8 + 1); ++i) f[g - bj - 1 + i] = 127
            }
            if (a.is_i4x4_) {
                var r = b;
                var s = c - bj + 16;
                if (a.mb_y_ > 0) {
                    if (a.mb_x_ >= a.mb_w_ - 1) {
                        r[s + 0] = r[s + 1] = r[s + 2] = r[s + 3] = h[k + 15]
                    } else {
                        memcpy(r, s + 0, h, k + 16, 4)
                    }
                }
                for (ii = 0; ii < 4; ++ii) r[ii + s + bj * 4] = r[ii + s + 1 * bj * 4] = r[ii + s + 2 * bj * 4] = r[ii + s + 3 * bj * 4] = r[ii + s + 0 * 4];
                for (n = 0; n < 16; n++) {
                    var t = b;
                    var u = c + cg[n];
                    bJ[a.imodes_[n]](t, u);
                    if (a.non_zero_ac_ & (1 << n)) {
                        bM(q, +n * 16, t, u, 0)
                    } else if (a.non_zero_ & (1 << n)) {
                        bO(q, +n * 16, t, u)
                    }
                }
            } else {
                var v = CheckMode(a, a.imodes_[0]);
                bK[v](b, c);
                if (a.non_zero_) {
                    for (n = 0; n < 16; n++) {
                        var t = b;
                        var u = c + cg[n];
                        if (a.non_zero_ac_ & (1 << n)) {
                            bM(q, +n * 16, t, u, 0)
                        } else if (a.non_zero_ & (1 << n)) {
                            bO(q, +n * 16, t, u)
                        }
                    }
                }
            } {
                var v = CheckMode(a, a.uvmode_);
                bL[v](d, e);
                bL[v](f, g);
                if (a.non_zero_ & 0x0f0000) {
                    var w = a.coeffs_;
                    var x = 16 * 16;
                    if (a.non_zero_ac_ & 0x0f0000) {
                        bN(w, x, d, e)
                    } else {
                        bP(w, x, d, e)
                    }
                }
                if (a.non_zero_ & 0xf00000) {
                    var y = a.coeffs_;
                    var x = 20 * 16;
                    if (a.non_zero_ac_ & 0xf00000) {
                        bN(y, x, f, g)
                    } else {
                        bP(y, x, f, g)
                    }
                }
                if (a.mb_y_ < (a.mb_h_ - 1)) {
                    memcpy(h, k, b, c + 15 * bj, 16);
                    memcpy(l, m, d, e + 7 * bj, 8);
                    memcpy(o, p, f, g + 7 * bj, 8)
                }
            }
        }
    }

    function clip(v, M) {
        return v < 0 ? 0 : v > M ? M : v
    }
    var ci = new Array(4, 5, 6, 7, 8, 9, 10, 10, 11, 12, 13, 14, 15, 16, 17, 17, 18, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 25, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 93, 95, 96, 98, 100, 101, 102, 104, 106, 108, 110, 112, 114, 116, 118, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 143, 145, 148, 151, 154, 157);
    var cj = new Array(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 119, 122, 125, 128, 131, 134, 137, 140, 143, 146, 149, 152, 155, 158, 161, 164, 167, 170, 173, 177, 181, 185, 189, 193, 197, 201, 205, 209, 213, 217, 221, 225, 229, 234, 239, 245, 249, 254, 259, 264, 269, 274, 279, 284);

    function VP8ParseQuant(a) {
        var b = a.br_;
        var c = VP8GetValue(b, 7);
        var d = VP8Get(b) ? VP8GetSignedValue(b, 4) : 0;
        var e = VP8Get(b) ? VP8GetSignedValue(b, 4) : 0;
        var f = VP8Get(b) ? VP8GetSignedValue(b, 4) : 0;
        var g = VP8Get(b) ? VP8GetSignedValue(b, 4) : 0;
        var h = VP8Get(b) ? VP8GetSignedValue(b, 4) : 0;
        var j = a.segment_hdr_;
        var i = int;
        for (i = 0; i < NUM_MB_SEGMENTS; ++i) {
            var q = int;
            if (j.use_segment_) {
                q = j.quantizer_[i];
                if (!j.absolute_delta_) {
                    q += c
                }
            } else {
                if (i > 0) {
                    a.dqm_[i] = a.dqm_[0];
                    continue
                } else {
                    q = c
                }
            } {
                var m = a.dqm_[i];
                m.y1_mat_[0] = ci[clip(q + d, 127)];
                m.y1_mat_[1] = cj[clip(q + 0, 127)];
                m.y2_mat_[0] = ci[clip(q + e, 127)] * 2;
                m.y2_mat_[1] = parseInt(cj[clip(q + f, 127)] * 155 / 100);
                if (m.y2_mat_[1] < 8) m.y2_mat_[1] = 8;
                m.uv_mat_[0] = ci[clip(q + g, 117)];
                m.uv_mat_[1] = cj[clip(q + h, 127)]
            }
        }
    }
    var ck = new Array(-bh, 1, -B_TM_PRED, 2, -B_VE_PRED, 3, 4, 6, -B_HE_PRED, 5, -B_RD_PRED, -B_VR_PRED, -B_LD_PRED, 7, -B_VL_PRED, 8, -B_HD_PRED, -B_HU_PRED);
    var cl = new Array(new Array(new Array(new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128), new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128), new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128)), new Array(new Array(253, 136, 254, 255, 228, 219, 128, 128, 128, 128, 128), new Array(189, 129, 242, 255, 227, 213, 255, 219, 128, 128, 128), new Array(106, 126, 227, 252, 214, 209, 255, 255, 128, 128, 128)), new Array(new Array(1, 98, 248, 255, 236, 226, 255, 255, 128, 128, 128), new Array(181, 133, 238, 254, 221, 234, 255, 154, 128, 128, 128), new Array(78, 134, 202, 247, 198, 180, 255, 219, 128, 128, 128)), new Array(new Array(1, 185, 249, 255, 243, 255, 128, 128, 128, 128, 128), new Array(184, 150, 247, 255, 236, 224, 128, 128, 128, 128, 128), new Array(77, 110, 216, 255, 236, 230, 128, 128, 128, 128, 128)), new Array(new Array(1, 101, 251, 255, 241, 255, 128, 128, 128, 128, 128), new Array(170, 139, 241, 252, 236, 209, 255, 255, 128, 128, 128), new Array(37, 116, 196, 243, 228, 255, 255, 255, 128, 128, 128)), new Array(new Array(1, 204, 254, 255, 245, 255, 128, 128, 128, 128, 128), new Array(207, 160, 250, 255, 238, 128, 128, 128, 128, 128, 128), new Array(102, 103, 231, 255, 211, 171, 128, 128, 128, 128, 128)), new Array(new Array(1, 152, 252, 255, 240, 255, 128, 128, 128, 128, 128), new Array(177, 135, 243, 255, 234, 225, 128, 128, 128, 128, 128), new Array(80, 129, 211, 255, 194, 224, 128, 128, 128, 128, 128)), new Array(new Array(1, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(246, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(255, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128))), new Array(new Array(new Array(198, 35, 237, 223, 193, 187, 162, 160, 145, 155, 62), new Array(131, 45, 198, 221, 172, 176, 220, 157, 252, 221, 1), new Array(68, 47, 146, 208, 149, 167, 221, 162, 255, 223, 128)), new Array(new Array(1, 149, 241, 255, 221, 224, 255, 255, 128, 128, 128), new Array(184, 141, 234, 253, 222, 220, 255, 199, 128, 128, 128), new Array(81, 99, 181, 242, 176, 190, 249, 202, 255, 255, 128)), new Array(new Array(1, 129, 232, 253, 214, 197, 242, 196, 255, 255, 128), new Array(99, 121, 210, 250, 201, 198, 255, 202, 128, 128, 128), new Array(23, 91, 163, 242, 170, 187, 247, 210, 255, 255, 128)), new Array(new Array(1, 200, 246, 255, 234, 255, 128, 128, 128, 128, 128), new Array(109, 178, 241, 255, 231, 245, 255, 255, 128, 128, 128), new Array(44, 130, 201, 253, 205, 192, 255, 255, 128, 128, 128)), new Array(new Array(1, 132, 239, 251, 219, 209, 255, 165, 128, 128, 128), new Array(94, 136, 225, 251, 218, 190, 255, 255, 128, 128, 128), new Array(22, 100, 174, 245, 186, 161, 255, 199, 128, 128, 128)), new Array(new Array(1, 182, 249, 255, 232, 235, 128, 128, 128, 128, 128), new Array(124, 143, 241, 255, 227, 234, 128, 128, 128, 128, 128), new Array(35, 77, 181, 251, 193, 211, 255, 205, 128, 128, 128)), new Array(new Array(1, 157, 247, 255, 236, 231, 255, 255, 128, 128, 128), new Array(121, 141, 235, 255, 225, 227, 255, 255, 128, 128, 128), new Array(45, 99, 188, 251, 195, 217, 255, 224, 128, 128, 128)), new Array(new Array(1, 1, 251, 255, 213, 255, 128, 128, 128, 128, 128), new Array(203, 1, 248, 255, 255, 128, 128, 128, 128, 128, 128), new Array(137, 1, 177, 255, 224, 255, 128, 128, 128, 128, 128))), new Array(new Array(new Array(253, 9, 248, 251, 207, 208, 255, 192, 128, 128, 128), new Array(175, 13, 224, 243, 193, 185, 249, 198, 255, 255, 128), new Array(73, 17, 171, 221, 161, 179, 236, 167, 255, 234, 128)), new Array(new Array(1, 95, 247, 253, 212, 183, 255, 255, 128, 128, 128), new Array(239, 90, 244, 250, 211, 209, 255, 255, 128, 128, 128), new Array(155, 77, 195, 248, 188, 195, 255, 255, 128, 128, 128)), new Array(new Array(1, 24, 239, 251, 218, 219, 255, 205, 128, 128, 128), new Array(201, 51, 219, 255, 196, 186, 128, 128, 128, 128, 128), new Array(69, 46, 190, 239, 201, 218, 255, 228, 128, 128, 128)), new Array(new Array(1, 191, 251, 255, 255, 128, 128, 128, 128, 128, 128), new Array(223, 165, 249, 255, 213, 255, 128, 128, 128, 128, 128), new Array(141, 124, 248, 255, 255, 128, 128, 128, 128, 128, 128)), new Array(new Array(1, 16, 248, 255, 255, 128, 128, 128, 128, 128, 128), new Array(190, 36, 230, 255, 236, 255, 128, 128, 128, 128, 128), new Array(149, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128)), new Array(new Array(1, 226, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(247, 192, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(240, 128, 255, 128, 128, 128, 128, 128, 128, 128, 128)), new Array(new Array(1, 134, 252, 255, 255, 128, 128, 128, 128, 128, 128), new Array(213, 62, 250, 255, 255, 128, 128, 128, 128, 128, 128), new Array(55, 93, 255, 128, 128, 128, 128, 128, 128, 128, 128)), new Array(new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128), new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128), new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128))), new Array(new Array(new Array(202, 24, 213, 235, 186, 191, 220, 160, 240, 175, 255), new Array(126, 38, 182, 232, 169, 184, 228, 174, 255, 187, 128), new Array(61, 46, 138, 219, 151, 178, 240, 170, 255, 216, 128)), new Array(new Array(1, 112, 230, 250, 199, 191, 247, 159, 255, 255, 128), new Array(166, 109, 228, 252, 211, 215, 255, 174, 128, 128, 128), new Array(39, 77, 162, 232, 172, 180, 245, 178, 255, 255, 128)), new Array(new Array(1, 52, 220, 246, 198, 199, 249, 220, 255, 255, 128), new Array(124, 74, 191, 243, 183, 193, 250, 221, 255, 255, 128), new Array(24, 71, 130, 219, 154, 170, 243, 182, 255, 255, 128)), new Array(new Array(1, 182, 225, 249, 219, 240, 255, 224, 128, 128, 128), new Array(149, 150, 226, 252, 216, 205, 255, 171, 128, 128, 128), new Array(28, 108, 170, 242, 183, 194, 254, 223, 255, 255, 128)), new Array(new Array(1, 81, 230, 252, 204, 203, 255, 192, 128, 128, 128), new Array(123, 102, 209, 247, 188, 196, 255, 233, 128, 128, 128), new Array(20, 95, 153, 243, 164, 173, 255, 203, 128, 128, 128)), new Array(new Array(1, 222, 248, 255, 216, 213, 128, 128, 128, 128, 128), new Array(168, 175, 246, 252, 235, 205, 255, 255, 128, 128, 128), new Array(47, 116, 215, 255, 211, 212, 255, 255, 128, 128, 128)), new Array(new Array(1, 121, 236, 253, 212, 214, 255, 255, 128, 128, 128), new Array(141, 84, 213, 252, 201, 202, 255, 219, 128, 128, 128), new Array(42, 80, 160, 240, 162, 185, 255, 205, 128, 128, 128)), new Array(new Array(1, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(244, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(238, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128))));
    var cm = new Array(new Array(new Array(231, 120, 48, 89, 115, 113, 120, 152, 112), new Array(152, 179, 64, 126, 170, 118, 46, 70, 95), new Array(175, 69, 143, 80, 85, 82, 72, 155, 103), new Array(56, 58, 10, 171, 218, 189, 17, 13, 152), new Array(114, 26, 17, 163, 44, 195, 21, 10, 173), new Array(121, 24, 80, 195, 26, 62, 44, 64, 85), new Array(144, 71, 10, 38, 171, 213, 144, 34, 26), new Array(170, 46, 55, 19, 136, 160, 33, 206, 71), new Array(63, 20, 8, 114, 114, 208, 12, 9, 226), new Array(81, 40, 11, 96, 182, 84, 29, 16, 36)), new Array(new Array(134, 183, 89, 137, 98, 101, 106, 165, 148), new Array(72, 187, 100, 130, 157, 111, 32, 75, 80), new Array(66, 102, 167, 99, 74, 62, 40, 234, 128), new Array(41, 53, 9, 178, 241, 141, 26, 8, 107), new Array(74, 43, 26, 146, 73, 166, 49, 23, 157), new Array(65, 38, 105, 160, 51, 52, 31, 115, 128), new Array(104, 79, 12, 27, 217, 255, 87, 17, 7), new Array(87, 68, 71, 44, 114, 51, 15, 186, 23), new Array(47, 41, 14, 110, 182, 183, 21, 17, 194), new Array(66, 45, 25, 102, 197, 189, 23, 18, 22)), new Array(new Array(88, 88, 147, 150, 42, 46, 45, 196, 205), new Array(43, 97, 183, 117, 85, 38, 35, 179, 61), new Array(39, 53, 200, 87, 26, 21, 43, 232, 171), new Array(56, 34, 51, 104, 114, 102, 29, 93, 77), new Array(39, 28, 85, 171, 58, 165, 90, 98, 64), new Array(34, 22, 116, 206, 23, 34, 43, 166, 73), new Array(107, 54, 32, 26, 51, 1, 81, 43, 31), new Array(68, 25, 106, 22, 64, 171, 36, 225, 114), new Array(34, 19, 21, 102, 132, 188, 16, 76, 124), new Array(62, 18, 78, 95, 85, 57, 50, 48, 51)), new Array(new Array(193, 101, 35, 159, 215, 111, 89, 46, 111), new Array(60, 148, 31, 172, 219, 228, 21, 18, 111), new Array(112, 113, 77, 85, 179, 255, 38, 120, 114), new Array(40, 42, 1, 196, 245, 209, 10, 25, 109), new Array(88, 43, 29, 140, 166, 213, 37, 43, 154), new Array(61, 63, 30, 155, 67, 45, 68, 1, 209), new Array(100, 80, 8, 43, 154, 1, 51, 26, 71), new Array(142, 78, 78, 16, 255, 128, 34, 197, 171), new Array(41, 40, 5, 102, 211, 183, 4, 1, 221), new Array(51, 50, 17, 168, 209, 192, 23, 25, 82)), new Array(new Array(138, 31, 36, 171, 27, 166, 38, 44, 229), new Array(67, 87, 58, 169, 82, 115, 26, 59, 179), new Array(63, 59, 90, 180, 59, 166, 93, 73, 154), new Array(40, 40, 21, 116, 143, 209, 34, 39, 175), new Array(47, 15, 16, 183, 34, 223, 49, 45, 183), new Array(46, 17, 33, 183, 6, 98, 15, 32, 183), new Array(57, 46, 22, 24, 128, 1, 54, 17, 37), new Array(65, 32, 73, 115, 28, 128, 23, 128, 205), new Array(40, 3, 9, 115, 51, 192, 18, 6, 223), new Array(87, 37, 9, 115, 59, 77, 64, 21, 47)), new Array(new Array(104, 55, 44, 218, 9, 54, 53, 130, 226), new Array(64, 90, 70, 205, 40, 41, 23, 26, 57), new Array(54, 57, 112, 184, 5, 41, 38, 166, 213), new Array(30, 34, 26, 133, 152, 116, 10, 32, 134), new Array(39, 19, 53, 221, 26, 114, 32, 73, 255), new Array(31, 9, 65, 234, 2, 15, 1, 118, 73), new Array(75, 32, 12, 51, 192, 255, 160, 43, 51), new Array(88, 31, 35, 67, 102, 85, 55, 186, 85), new Array(56, 21, 23, 111, 59, 205, 45, 37, 192), new Array(55, 38, 70, 124, 73, 102, 1, 34, 98)), new Array(new Array(125, 98, 42, 88, 104, 85, 117, 175, 82), new Array(95, 84, 53, 89, 128, 100, 113, 101, 45), new Array(75, 79, 123, 47, 51, 128, 81, 171, 1), new Array(57, 17, 5, 71, 102, 57, 53, 41, 49), new Array(38, 33, 13, 121, 57, 73, 26, 1, 85), new Array(41, 10, 67, 138, 77, 110, 90, 47, 114), new Array(115, 21, 2, 10, 102, 255, 166, 23, 6), new Array(101, 29, 16, 10, 85, 128, 101, 196, 26), new Array(57, 18, 10, 102, 102, 213, 34, 20, 43), new Array(117, 20, 15, 36, 163, 128, 68, 1, 26)), new Array(new Array(102, 61, 71, 37, 34, 53, 31, 243, 192), new Array(69, 60, 71, 38, 73, 119, 28, 222, 37), new Array(68, 45, 128, 34, 1, 47, 11, 245, 171), new Array(62, 17, 19, 70, 146, 85, 55, 62, 70), new Array(37, 43, 37, 154, 100, 163, 85, 160, 1), new Array(63, 9, 92, 136, 28, 64, 32, 201, 85), new Array(75, 15, 9, 9, 64, 255, 184, 119, 16), new Array(86, 6, 28, 5, 64, 255, 25, 248, 1), new Array(56, 8, 17, 132, 137, 255, 55, 116, 128), new Array(58, 15, 20, 82, 135, 57, 26, 121, 40)), new Array(new Array(164, 50, 31, 137, 154, 133, 25, 35, 218), new Array(51, 103, 44, 131, 131, 123, 31, 6, 158), new Array(86, 40, 64, 135, 148, 224, 45, 183, 128), new Array(22, 26, 17, 131, 240, 154, 14, 1, 209), new Array(45, 16, 21, 91, 64, 222, 7, 1, 197), new Array(56, 21, 39, 155, 60, 138, 23, 102, 213), new Array(83, 12, 13, 54, 192, 255, 68, 47, 28), new Array(85, 26, 85, 85, 128, 128, 32, 146, 171), new Array(18, 11, 7, 63, 144, 171, 4, 4, 246), new Array(35, 27, 10, 146, 174, 171, 12, 26, 128)), new Array(new Array(190, 80, 35, 99, 180, 80, 126, 54, 45), new Array(85, 126, 47, 87, 176, 51, 41, 20, 32), new Array(101, 75, 128, 139, 118, 146, 116, 128, 85), new Array(56, 41, 15, 176, 236, 85, 37, 9, 62), new Array(71, 30, 17, 119, 118, 255, 17, 18, 138), new Array(101, 38, 60, 138, 55, 70, 43, 26, 142), new Array(146, 36, 19, 30, 171, 255, 97, 27, 20), new Array(138, 45, 61, 62, 219, 1, 81, 188, 64), new Array(32, 41, 20, 117, 151, 142, 20, 21, 163), new Array(112, 19, 12, 61, 195, 128, 48, 4, 24)));

    function VP8ResetProba(a) {
        for (i = 0; i < a.segments_.length; ++i) a.segments_[i] = 255;
        a.coeffs_ = newObjectIt(cl)
    }

    function VP8ParseIntraMode(a, b) {
        var c = b.intra_t_;
        c[c.length - 1] = 0 + 4 * b.mb_x_;
        var d = b.intra_l_;
        b.is_i4x4_ = !VP8GetBit(a, 145);
        if (!b.is_i4x4_) {
            var e = VP8GetBit(a, 156) ? (VP8GetBit(a, 128) ? TM_PRED : H_PRED) : (VP8GetBit(a, 163) ? V_PRED : DC_PRED);
            b.imodes_[0] = e;
            for (i = 0; i < 4; ++i) c[i + c[c.length - 1]] = e;
            for (i = 0; i < 4; ++i) d[i] = e
        } else {
            var f = b.imodes_;
            var g = 0;
            var y;
            for (y = 0; y < 4; ++y) {
                var e = d[y];
                var x;
                for (x = 0; x < 4; ++x) {
                    var h = cm[c[c[c.length - 1] + x]][e];
                    var i = 0;
                    do {
                        i = ck[2 * i + VP8GetBit(a, h[i])]
                    } while (i > 0);
                    e = -i;
                    c[c[c.length - 1] + x] = e;
                    f[g] = e;
                    g++
                }
                d[y] = e
            }
        }
        b.uvmode_ = !VP8GetBit(a, 142) ? DC_PRED : !VP8GetBit(a, 114) ? V_PRED : VP8GetBit(a, 183) ? TM_PRED : H_PRED
    }
    var cn = new Array(new Array(new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(176, 246, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(223, 241, 252, 255, 255, 255, 255, 255, 255, 255, 255), new Array(249, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 244, 252, 255, 255, 255, 255, 255, 255, 255, 255), new Array(234, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(253, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 246, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(239, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 248, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(251, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(251, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 253, 255, 254, 255, 255, 255, 255, 255, 255), new Array(250, 255, 254, 255, 254, 255, 255, 255, 255, 255, 255), new Array(254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255))), new Array(new Array(new Array(217, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(225, 252, 241, 253, 255, 255, 254, 255, 255, 255, 255), new Array(234, 250, 241, 250, 253, 255, 253, 254, 255, 255, 255)), new Array(new Array(255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(223, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(238, 253, 254, 254, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 248, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(249, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 253, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(247, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(253, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(250, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255))), new Array(new Array(new Array(186, 251, 250, 255, 255, 255, 255, 255, 255, 255, 255), new Array(234, 251, 244, 254, 255, 255, 255, 255, 255, 255, 255), new Array(251, 251, 243, 253, 254, 255, 254, 255, 255, 255, 255)), new Array(new Array(255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(236, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(251, 253, 253, 254, 254, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255))), new Array(new Array(new Array(248, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(250, 254, 252, 254, 255, 255, 255, 255, 255, 255, 255), new Array(248, 254, 249, 253, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(246, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(252, 254, 251, 254, 254, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 252, 255, 255, 255, 255, 255, 255, 255, 255), new Array(248, 254, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(253, 255, 254, 254, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 251, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(245, 251, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(253, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 251, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(252, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 252, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(249, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(250, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255))));

    function VP8ParseProba(a, d) {
        var e = d.proba_;
        var t, b, c, p;
        for (t = 0; t < NUM_TYPES; ++t) {
            for (b = 0; b < NUM_BANDS; ++b) {
                for (c = 0; c < NUM_CTX; ++c) {
                    for (p = 0; p < NUM_PROBAS; ++p) {
                        if (VP8GetBit(a, cn[t][b][c][p])) {
                            e.coeffs_[t][b][c][p] = VP8GetValue(a, 8)
                        }
                    }
                }
            }
        }
        d.use_skip_proba_ = VP8Get(a);
        if (d.use_skip_proba_) {
            d.skip_p_ = VP8GetValue(a, 8)
        }
    }
    var co = 12;
    var cp = 20;
    this.WebPGetDecoderVersion = function(a) {
        return (be << 16) | (bf << 8) | bg
    };

    function SetOk(a) {
        a.status_ = 'VP8_STATUS_OK';
        a.error_msg_ = "OK"
    }
    var cq;

    function VP8InitIoInternal(a, b) {
        if (b != N) {
            alert('mismatch error');
            return 0
        }
        if (a) {}
        return 1
    }
    var cr;

    function VP8New(a) {
        var b = newObjectIt(bz);
        if (b) {
            SetOk(b);
            b.ready_ = 0
        }
        return b
    }

    function VP8Delete(a) {
        if (a) {
            VP8Clear(a);
            a = 0
        }
    }

    function VP8SetError(a, b, c) {
        a.status_ = b;
        a.error_msg_ = c;
        a.ready_ = 0;
        alert(b + ': ' + c);
        return 0
    }

    function get_le32(a, b) {
        return a[b + 0] | (a[b + 1] << 8) | (a[b + 2] << 16) | (a[b + 3] << 24)
    }

    function VP8CheckAndSkipHeader(a, b, c, d, e, f) {
        if (!a || !c || !d || !e) {
            return 0
        }
        if (c.value >= 8) {
            if (!memcmp(a, b.value, "VP8 ", 4)) {
                d.value = 1;
                e.value = get_le32(a, b.value + 4);
                if ((f.value >= co) && (e.value > f.value - co)) {
                    return 0
                }
                b.value += 8;
                c.value -= 8
            } else {
                d.value = 0;
                e.value = 0
            }
        } else {
            d.value = -1;
            e.value = 0
        }
        return 1
    }

    function VP8GetInfo(a, b, c, d, e, f, g) {
        if (c.value < 10) {
            return 0
        }
        if (a[b.value + 3] != 0x9d || a[b.value + 4] != 0x01 || a[b.value + 5] != 0x2a) {
            return 0
        } else {
            var i = a[b.value + 0] | (a[b.value + 1] << 8) | (a[b.value + 2] << 16);
            var j = !(i & 1) + 0;
            var w = ((a[b.value + 7] << 8) | a[b.value + 6]) & 0x3fff;
            var h = ((a[b.value + 9] << 8) | a[b.value + 8]) & 0x3fff;
            if (g) {
                if (c.value < 11) return 0;
                g.value = !!(a[b.value + 10] & 0x80)
            }
            if (!j) {
                return 0
            }
            if (((i >> 1) & 7) > 3) {
                return 0
            }
            if (!((i >> 4) & 1)) {
                return 0
            }
            if (((i >> 5)) >= d) {
                return 0
            }
            if (e) {
                e.value = w
            }
            if (f) {
                f.value = h
            }
            return 1
        }
    }

    function VP8XGetInfo(a, b, c, d, e, f, g) {
        if (!a || !c || !d) {
            return 0
        }
        if (c.value >= cp) {
            if (!memcmp(a, b.value, "VP8X", 4)) {
                var h = get_le32(a, b.value + 4);
                d.value = 1;
                if (h.value != (cp - 8)) {
                    return 0
                }
                if (g) {
                    g.value = get_le32(a, b.value + 8)
                }
                if (e) {
                    e.value = get_le32(a, b.value + 12)
                }
                if (f) {
                    f.value = get_le32(a, b.value + 16)
                }
                b.value += cp;
                c.value -= cp
            } else {
                d.value = 0
            }
        } else {
            d.value = -1
        }
        return 1
    }

    function ResetSegmentHeader(a) {
        assert(a);
        a.use_segment_ = 0;
        a.update_map_ = 0;
        a.absolute_delta_ = 1;
        for (i = 0; i < a.quantizer_.length; ++i) a.quantizer_[i] = 0;
        for (i = 0; i < a.filter_strength_.length; ++i) a.filter_strength_[i] = 0
    }

    function ParseSegmentHeader(a, b, c) {
        assert(a);
        assert(b);
        b.use_segment_ = VP8Get(a);
        if (b.use_segment_) {
            b.update_map_ = VP8Get(a);
            if (VP8Get(a)) {
                var s;
                b.absolute_delta_ = VP8Get(a);
                for (s = 0; s < NUM_MB_SEGMENTS; ++s) {
                    b.quantizer_[s] = VP8Get(a) ? VP8GetSignedValue(a, 7) : 0
                }
                for (s = 0; s < NUM_MB_SEGMENTS; ++s) {
                    b.filter_strength_[s] = VP8Get(a) ? VP8GetSignedValue(a, 6) : 0
                }
            }
            if (b.update_map_) {
                var s;
                for (s = 0; s < bi; ++s) {
                    c.segments_[s] = VP8Get(a) ? VP8GetValue(a, 8) : 255
                }
            }
        } else {
            b.update_map_ = 0
        }
        return !a.eof_
    }

    function ParsePartitions(a, b, c, d) {
        var e = a.br_;
        var f = b;
        var g = c;
        var h = b,
            buf_end_off = c + d;
        var i;
        var j = 0;
        var k = int;
        var p = int;
        a.num_parts_ = 1 << VP8GetValue(e, 2);
        k = a.num_parts_ - 1;
        i = b;
        var j = c + k * 3;
        if (buf_end_off < j) {
            return 'VP8_STATUS_NOT_ENOUGH_DATA'
        }
        for (p = 0; p < k; ++p) {
            var l = f[g + 0] | (f[g + 1] << 8) | (f[g + 2] << 16);
            var m = i;
            var n = j + l;
            if (n > buf_end_off) m = h;
            VP8InitBitReader(a.parts_[+p], i, j, n);
            i = m;
            j = n;
            g += 3
        }
        VP8InitBitReader(a.parts_[+k], i, j, buf_end_off);
        return (j < buf_end_off) ? 'VP8_STATUS_OK' : 'VP8_STATUS_SUSPENDED'
    }

    function ParseFilterHeader(a, b) {
        var c = b.filter_hdr_;
        c.simple_ = VP8Get(a);
        c.level_ = VP8GetValue(a, 6);
        c.sharpness_ = VP8GetValue(a, 3);
        c.use_lf_delta_ = VP8Get(a);
        if (c.use_lf_delta_) {
            if (VP8Get(a)) {
                var i;
                for (i = 0; i < NUM_REF_LF_DELTAS; ++i) {
                    if (VP8Get(a)) {
                        c.ref_lf_delta_[i] = VP8GetSignedValue(a, 6)
                    }
                }
                for (i = 0; i < NUM_MODE_LF_DELTAS; ++i) {
                    if (VP8Get(a)) {
                        c.mode_lf_delta_[i] = VP8GetSignedValue(a, 6)
                    }
                }
            }
        }
        b.filter_type_ = (c.level_ == 0) ? 0 : c.simple_ ? 1 : 2;
        if (b.filter_type_ > 0) {
            if (b.segment_hdr_.use_segment_) {
                var s;
                for (s = 0; s < NUM_MB_SEGMENTS; ++s) {
                    var d = b.segment_hdr_.filter_strength_[s];
                    if (!b.segment_hdr_.absolute_delta_) {
                        d += c.level_
                    }
                    b.filter_levels_[s] = d
                }
            } else {
                b.filter_levels_[0] = c.level_
            }
        }
        return !a.eof_
    }
    var cs, buf, buf_size;
    var ct;

    function VP8GetHeaders(a, b) {
        var c = {
            value: 0
        };
        var d = uint8_t;
        var e = {
            value: uint32_t
        };
        var f = {
            value: uint32_t
        };
        var g = {
            value: uint32_t
        };
        var h = {
            value: 0
        };
        var i = {
            value: 0
        };
        var j = newObjectIt(bp);
        var k = newObjectIt(bq);
        var l = newObjectIt(bb);
        var m = 'VP8StatusCode';
        if (a == null) {
            alert('(dec == null)');
            return 0
        }
        SetOk(a);
        if (b == null) {
            return VP8SetError(a, 'VP8_STATUS_INVALID_PARAM', "null VP8Io passed to VP8GetHeaders()")
        }
        d = b.data;
        c.value = b.data_off;
        e.value = b.data_size;
        if (d == null || e.value <= 4) {
            return VP8SetError(a, 'VP8_STATUS_NOT_ENOUGH_DATA', "Not enough data to parse frame header")
        }
        if (!WebPCheckAndSkipRIFFHeader(d, c, e, f)) {
            return VP8SetError(a, VP8_STATUS_BITSTREAM_ERROR, "RIFF: Invalid RIFF container")
        }
        if (!VP8XGetInfo(d, c, e, h, null, null, null)) {
            return VP8SetError(a, VP8_STATUS_BITSTREAM_ERROR, "RIFF: Invalid VP8X container")
        }
        if (!VP8CheckAndSkipHeader(d, c, e, i, g, f)) {
            return VP8SetError(a, VP8_STATUS_BITSTREAM_ERROR, "RIFF: Inconsistent size information.")
        }
        if (i.value == -1) {
            return VP8SetError(a, 'VP8_STATUS_BITSTREAM_ERROR', "RIFF: Inconsistent size information.")
        }
        if (e.value < 4) {
            return VP8SetError(a, VP8_STATUS_NOT_ENOUGH_DATA, "RIFF: Truncated header.")
        }
        c = c.value;
        e = e.value; {
            var n = d[c + 0] | (d[c + 1] << 8) | (d[c + 2] << 16);
            j = a.frm_hdr_;
            j.key_frame_ = !(n & 1) + 0;
            j.profile_ = (n >> 1) & 7;
            j.show_ = (n >> 4) & 1;
            j.partition_length_ = (n >> 5);
            if (j.profile_ > 3) return VP8SetError(a, 'VP8_STATUS_BITSTREAM_ERROR', "Incorrect keyframe parameters.");
            if (!j.show_) return VP8SetError(a, 'VP8_STATUS_UNSUPPORTED_FEATURE', "Frame not displayable.");
            c += 3;
            e -= 3
        }
        k = a.pic_hdr_;
        if (j.key_frame_) {
            if (e < 7) {
                return VP8SetError(a, 'VP8_STATUS_NOT_ENOUGH_DATA', "cannot parse picture header")
            }
            if (Byte2Hex(d[c + 0]) != 0x9d || Byte2Hex(d[c + 1]) != 0x01 || Byte2Hex(d[c + 2]) != 0x2a) {
                return VP8SetError(a, 'VP8_STATUS_BITSTREAM_ERROR', "Bad code word")
            }
            k.width_ = ((d[c + 4] << 8) | d[c + 3]) & 0x3fff;
            k.xscale_ = d[c + 4] >> 6;
            k.height_ = ((d[c + 6] << 8) | d[c + 5]) & 0x3fff;
            k.yscale_ = d[c + 6] >> 6;
            c += 7;
            e -= 7;
            a.mb_w_ = (k.width_ + 15) >> 4;
            a.mb_h_ = (k.height_ + 15) >> 4;
            b.width = k.width_;
            b.height = k.height_;
            b.use_scaling = 0;
            b.use_cropping = 0;
            b.crop_top = 0;
            b.crop_left = 0;
            b.crop_right = b.width;
            b.crop_bottom = b.height;
            b.mb_w = b.width;
            b.mb_h = b.height;
            VP8ResetProba(a.proba_);
            ResetSegmentHeader(a.segment_hdr_);
            a.segment_ = 0
        }
        if (j.partition_length_ > e) {
            return VP8SetError(a, 'VP8_STATUS_NOT_ENOUGH_DATA', "bad partition length")
        }
        a.alpha_data_ = null;
        a.alpha_data_size_ = 0;
        var l = a.br_;
        VP8InitBitReader(l, d, c, c + j.partition_length_);
        c += j.partition_length_;
        e -= j.partition_length_;
        if (j.key_frame_) {
            k.colorspace_ = VP8Get(l);
            k.clamp_type_ = VP8Get(l)
        }
        if (!ParseSegmentHeader(l, a.segment_hdr_, a.proba_)) {
            return VP8SetError(a, 'VP8_STATUS_BITSTREAM_ERROR', "cannot parse segment header")
        }
        if (!ParseFilterHeader(l, a)) {
            return VP8SetError(a, 'VP8_STATUS_BITSTREAM_ERROR', "cannot parse filter header")
        }
        m = ParsePartitions(a, d, c, e);
        if (m != 'VP8_STATUS_OK') {
            return VP8SetError(a, 'VP8_STATUS_BITSTREAM_ERROR', "cannot parse partitions")
        }
        VP8ParseQuant(a);
        if (!j.key_frame_) {
            return VP8SetError(a, VP8_STATUS_UNSUPPORTED_FEATURE, "Not a key frame.")
        } else {
            a.buffer_flags_ = 0x003 | 0x100
        }
        VP8Get(l);
        VP8ParseProba(l, a);
        if (a.pic_hdr_.colorspace_) {
            var o = 8;
            var p = 0x01;
            var q = d;
            ext_buf_off = c - o;
            var r = size_t;
            if (j.partition_length_ < o || q[ext_buf_off + o - 1] != p) {}
            r = (q[ext_buf_off + 4] << 0) | (q[ext_buf_off + 5] << 8) | (q[ext_buf_off + 6] << 16);
            if (j.partition_length_ < r + o) {
                return VP8SetError(a, VP8_STATUS_BITSTREAM_ERROR, "RIFF: Inconsistent extra information.")
            }
            a.alpha_data_ = (r > 0) ? q : null;
            a.alpha_data_off = (r > 0) ? ext_buf_off - r : null;
            a.alpha_data_size_ = r;
            r = (q[ext_buf_off + 0] << 0) | (q[ext_buf_off + 1] << 8) | (q[ext_buf_off + 2] << 16);
            a.layer_data_size_ = r;
            a.layer_data_ = null;
            a.layer_colorspace_ = q[ext_buf_off + 3]
        }
        a.ready_ = 1;
        return 1
    }
    var cu = new Array(0, 1, 2, 3, 6, 4, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0);
    var cv = new Array(173, 148, 140, 0);
    var cw = new Array(176, 155, 140, 135, 0);
    var cx = new Array(180, 157, 141, 134, 130, 0);
    var cy = new Array(254, 254, 243, 230, 196, 177, 153, 140, 133, 130, 129, 0);
    var cz = new Array(cv, cw, cx, cy);
    var cA = new Array(0, 1, 4, 8, 5, 2, 3, 6, 9, 12, 13, 10, 7, 11, 14, 15);
    var cB = ArrM(new Array(NUM_CTX, NUM_PROBAS), '');

    function GetCoeffs(a, b, c, d, n, e) {
        var p = b[cu[n]][c];
        if (!VP8GetBit(a, p[0])) {
            return 0
        }
        while (1) {
            ++n;
            if (!VP8GetBit(a, p[1])) {
                p = b[cu[n]][0]
            } else {
                var v, j;
                if (!VP8GetBit(a, p[2])) {
                    p = b[cu[n]][1];
                    v = 1
                } else {
                    if (!VP8GetBit(a, p[3])) {
                        if (!VP8GetBit(a, p[4])) {
                            v = 2
                        } else {
                            v = 3 + VP8GetBit(a, p[5])
                        }
                    } else {
                        if (!VP8GetBit(a, p[6])) {
                            if (!VP8GetBit(a, p[7])) {
                                v = 5 + VP8GetBit(a, 159)
                            } else {
                                v = 7 + 2 * VP8GetBit(a, 165);
                                v += VP8GetBit(a, 145)
                            }
                        } else {
                            var f = uint8_t;
                            var g = VP8GetBit(a, p[8]);
                            var h = VP8GetBit(a, p[9 + g]);
                            var k = 2 * g + h;
                            v = 0;
                            f = cz[k];
                            var l;
                            for (i = 0; i < (f.length - 1); ++i) {
                                v += v + VP8GetBit(a, f[i])
                            }
                            v += 3 + (8 << k)
                        }
                    }
                    p = b[cu[n]][2]
                }
                j = cA[n - 1];
                e[e[e.length - 1] + j] = VP8GetSigned(a, v) * d[((j > 0) + 0)];
                if (n == 16 || !VP8GetBit(a, p[0])) {
                    return n
                }
            }
            if (n == 16) {
                return 16
            }
        }
    }
    var cC = {
        i8: Arr(4, uint8_t),
        i32: uint32_t
    };
    var cD = new Array(new Array(0, 0, 0, 0), new Array(1, 0, 0, 0), new Array(0, 1, 0, 0), new Array(1, 1, 0, 0), new Array(0, 0, 1, 0), new Array(1, 0, 1, 0), new Array(0, 1, 1, 0), new Array(1, 1, 1, 0), new Array(0, 0, 0, 1), new Array(1, 0, 0, 1), new Array(0, 1, 0, 1), new Array(1, 1, 0, 1), new Array(0, 0, 1, 1), new Array(1, 0, 1, 1), new Array(0, 1, 1, 1), new Array(1, 1, 1, 1));
    var cE = 0x08040201;

    function PACK(X, S) {
        return ((((X[0] * 0x1000000 + X[1] * 0x10000 + X[2] * 0x100 + X[3] * 0x1) * cE) & 0xff000000) >> (S))
    }

    function ParseResiduals(a, b, c) {
        var d, out_l_nz, first;
        var e = cB;
        var q = a.dqm_[a.segment_];
        var f = a.coeffs_;
        var g = a.mb_info_[1 - 1];
        var h = Arr(4, 0),
            nz_dc = Arr(4, 0);
        var i = Arr(4, 0),
            lnz = Arr(4, 0);
        var j = 0;
        var k = 0;
        var x, y, ch;
        f = memset(0, 384 * sizeof(f));
        if (!a.is_i4x4_) {
            var m = Arr(16, 0);
            var n = b.dc_nz_ + g.dc_nz_;
            b.dc_nz_ = g.dc_nz_ = (GetCoeffs(c, a.proba_.coeffs_[1], n, q.y2_mat_, 0, m) > 0) + 0;
            first = 1;
            e = a.proba_.coeffs_[0];
            VP8TransformWHT(m, f);
            f[f.length - 1] = 0
        } else {
            first = 0;
            e = a.proba_.coeffs_[3]
        }
        i = ArrCopy(cD[b.nz_ & 0xf]);
        lnz = ArrCopy(cD[g.nz_ & 0xf]);
        for (y = 0; y < 4; ++y) {
            var l = lnz[y];
            for (x = 0; x < 4; ++x) {
                var n = l + i[x];
                var o = GetCoeffs(c, e, n, q.y1_mat_, first, f);
                i[x] = l = (o > 0) + 0;
                nz_dc[x] = ((f[f[f.length - 1] + 0] != 0) + 0);
                h[x] = (o > 1) + 0;
                f[f.length - 1] += 16
            }
            lnz[y] = l;
            k |= PACK(nz_dc, 24 - y * 4);
            j |= PACK(h, 24 - y * 4)
        }
        d = PACK(i, 24);
        out_l_nz = PACK(lnz, 24);
        i = ArrCopy(cD[b.nz_ >> 4]);
        lnz = ArrCopy(cD[g.nz_ >> 4]);
        for (ch = 0; ch < 4; ch += 2) {
            for (y = 0; y < 2; ++y) {
                var l = lnz[ch + y];
                for (x = 0; x < 2; ++x) {
                    var n = l + i[ch + x];
                    var o = GetCoeffs(c, a.proba_.coeffs_[2], n, q.uv_mat_, 0, f);
                    i[ch + x] = l = (o > 0) + 0;
                    nz_dc[y * 2 + x] = ((f[f[f.length - 1] + 0] != 0) + 0);
                    h[y * 2 + x] = (o > 1) + 0;
                    f[f.length - 1] += 16
                }
                lnz[ch + y] = l
            }
            k |= PACK(nz_dc, 8 - ch * 2);
            j |= PACK(h, 8 - ch * 2)
        }
        d |= PACK(i, 20);
        out_l_nz |= PACK(lnz, 20);
        b.nz_ = d;
        g.nz_ = out_l_nz;
        a.coeffs_ = f;
        a.non_zero_ac_ = j + 0;
        a.non_zero_ = j | k;
        b.skip_ = (!a.non_zero_) + 0
    }
    var cF;

    function VP8DecodeMB(a, b) {
        var c = a.br_;
        var d = a.mb_info_[1 - 1];
        var e = a.mb_info_[1 + a.mb_x_];
        if (a.segment_hdr_.update_map_) {
            a.segment_ = !VP8GetBit(c, a.proba_.segments_[0]) ? 0 + VP8GetBit(c, a.proba_.segments_[1]) : 2 + VP8GetBit(c, a.proba_.segments_[2])
        }
        e.skip_ = a.use_skip_proba_ ? VP8GetBit(c, a.skip_p_) : 0;
        VP8ParseIntraMode(c, a);
        if (c.eof_) {
            return 0
        }
        if (!e.skip_) {
            ParseResiduals(a, e, b)
        } else {
            d.nz_ = e.nz_ = 0;
            if (!a.is_i4x4_) {
                d.dc_nz_ = e.dc_nz_ = 0
            }
            a.non_zero_ = 0;
            a.non_zero_ac_ = 0
        }
        return (!b.eof_)
    }

    function VP8InitScanline(a) {
        var b = a.mb_info_[1 - 1];
        b.nz_ = 0;
        b.dc_nz_ = 0;
        memset_(a.intra_l_, 0, bh, a.intra_l_.length);
        a.filter_row_ = ((a.filter_type_ > 0) && (a.mb_y_ >= a.tl_mb_y_) && (a.mb_y_ <= a.br_mb_y_)) + 0
    }
    var cG;

    function ParseFrame(a, b) {
        for (a.mb_y_ = 0; a.mb_y_ < a.br_mb_y_; ++a.mb_y_) {
            cG = a.parts_[a.mb_y_ & (a.num_parts_ - 1)];
            VP8InitScanline(a);
            for (a.mb_x_ = 0; a.mb_x_ < a.mb_w_; a.mb_x_++) {
                if (!VP8DecodeMB(a, cG)) {
                    return VP8SetError(a, 'VP8_STATUS_NOT_ENOUGH_DATA', "Premature end-of-file encountered." + a.mb_x_ + ' ' + a.mb_y_)
                }
                VP8ReconstructBlock(a);
                VP8StoreBlock(a)
            }
            if (!VP8ProcessRow(a, b)) {
                return VP8SetError(a, 'VP8_STATUS_USER_ABORT', "Output aborted.")
            }
        }
        if (a.use_threads_ && !WebPWorkerSync(a.worker_)) {
            return 0
        }
        if (a.layer_data_size_ > 0) {
            if (!VP8DecodeLayer(a)) {
                return 0
            }
        }
        return 1
    }

    function VP8Decode(a, b) {
        var c = 0;
        if (a == null) {
            return 0
        }
        if (b == null) {
            return VP8SetError(a, 'VP8_STATUS_INVALID_PARAM', "NULL VP8Io parameter in VP8Decode().")
        }
        if (!a.ready_) {
            if (!VP8GetHeaders(a, b)) {
                return 0
            }
        }
        assert(a.ready_);
        c = (VP8EnterCritical(a, b) == T);
        if (c) {
            if (c) c = VP8InitFrame(a, b);
            if (c) c = ParseFrame(a, b);
            c &= VP8ExitCritical(a, b)
        }
        if (!c) {
            VP8Clear(a);
            return 0
        }
        a.ready_ = 0;
        return 1
    }

    function VP8Clear(a) {
        if (a == null) {
            return
        }
        if (a.use_threads_) {
            WebPWorkerEnd(a.worker_)
        }
        if (a.mem_) {
            a.mem_ = 0
        }
        a.mem_ = null;
        a.mem_size_ = 0;
        a.ready_ = 0
    }
    var cH = 16,
        YUV_RANGE_MIN = -227,
        YUV_RANGE_MAX = 256 + 226;

    function VP8YuvToRgb(y, u, v, a, b) {
        var c = cJ[v];
        var d = (cK[v] + VP8kUToG[u]) >> cH;
        var e = VP8kUToB[u];
        a[b + 0] = cL[y + c - YUV_RANGE_MIN];
        a[b + 1] = cL[y + d - YUV_RANGE_MIN];
        a[b + 2] = cL[y + e - YUV_RANGE_MIN]
    }

    function VP8YuvToRgb565(y, u, v, a, b) {
        var c = cJ[v];
        var d = (cK[v] + VP8kUToG[u]) >> cH;
        var e = VP8kUToB[u];
        a[b + 0] = ((cL[y + c - YUV_RANGE_MIN] & 0xf8) | (cL[y + d - YUV_RANGE_MIN] >> 5));
        a[b + 1] = (((cL[y + d - YUV_RANGE_MIN] << 3) & 0xe0) | (cL[y + e - YUV_RANGE_MIN] >> 3))
    }

    function VP8YuvToArgbKeepA(y, u, v, a, b) {
        VP8YuvToRgb(y, u, v, a, b + 1)
    }

    function VP8YuvToArgb(y, u, v, a, b) {
        a[b + 0] = 0xff;
        VP8YuvToArgbKeepA(y, u, v, a, b)
    }

    function VP8YuvToRgba4444KeepA(y, u, v, a, b) {
        var c = cJ[v];
        var d = (cK[v] + VP8kUToG[u]) >> cH;
        var e = VP8kUToB[u];
        a[b + 0] = ((cM[y + c - YUV_RANGE_MIN] << 4) | cM[y + d - YUV_RANGE_MIN]);
        a[b + 1] = ((a[b + 1] << 44) | (cM[y + e - YUV_RANGE_MIN] << 4))
    }

    function VP8YuvToRgba4444(y, u, v, a, b) {
        a[b + 1] = 0x0f;
        VP8YuvToRgba4444KeepA(y, u, v, a, b)
    }

    function VP8YuvToBgr(y, u, v, a, b) {
        var c = cJ[v];
        var d = (cK[v] + VP8kUToG[u]) >> cH;
        var e = VP8kUToB[u];
        a[b + 0] = cL[y + e - YUV_RANGE_MIN];
        a[b + 1] = cL[y + d - YUV_RANGE_MIN];
        a[b + 2] = cL[y + c - YUV_RANGE_MIN]
    }

    function VP8YuvToBgra(y, u, v, a, b) {
        VP8YuvToBgr(y, u, v, a, b);
        a[b + 3] = 0xff
    }

    function VP8YuvToRgba(y, u, v, a, b) {
        VP8YuvToRgb(y, u, v, a, b);
        a[b + 3] = 0xff
    }
    var cI = (1 << (cH - 1));
    var cJ = Arr(256, int16_t),
        VP8kUToB = Arr(256, int16_t);
    var cK = Arr(256, int32_t),
        VP8kUToG = Arr(256, int32_t);
    var cL = Arr(YUV_RANGE_MAX - YUV_RANGE_MIN, uint8_t);
    var cM = Arr(YUV_RANGE_MAX - YUV_RANGE_MIN, uint8_t);
    var cN = 0;

    function clip(v, a) {
        return v < 0 ? 0 : v > a ? a : v
    }

    function VP8YUVInit(a) {
        var i;
        if (cN) {
            return
        }
        for (i = 0; i < 256; ++i) {
            cJ[i] = (89858 * (i - 128) + cI) >> cH;
            VP8kUToG[i] = -22014 * (i - 128) + cI;
            cK[i] = -45773 * (i - 128);
            VP8kUToB[i] = (113618 * (i - 128) + cI) >> cH
        }
        for (i = YUV_RANGE_MIN; i < YUV_RANGE_MAX; ++i) {
            var k = ((i - 16) * 76283 + cI) >> cH;
            cL[i - YUV_RANGE_MIN] = clip(k, 255);
            cM[i - YUV_RANGE_MIN] = clip((k + 8) >> 4, 15)
        }
        cN = 1
    }

    function LOAD_UV(u, v) {
        return ((u) | ((v) << 16))
    }

    function FUNC_NAME(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s) {
        var x;
        var t = (q - 1) >> 1;
        var u = LOAD_UV(e[f + 0], g[h + 0]);
        var v = LOAD_UV(i[j + 0], k[l + 0]);
        if (a) {
            var w = (3 * u + v + 0x00020002) >> 2;
            r(a[b + 0], w & 0xff, (w >> 16), m, n)
        }
        if (c) {
            var w = (3 * v + u + 0x00020002) >> 2;
            r(c[d + 0], w & 0xff, (w >> 16), o, p)
        }
        for (x = 1; x <= t; ++x) {
            var y = LOAD_UV(e[f + x], g[h + x]);
            var z = LOAD_UV(i[j + x], k[l + x]);
            var A = u + y + v + z + 0x00080008;
            var B = (A + 2 * (y + v)) >> 3;
            var C = (A + 2 * (u + z)) >> 3;
            if (a) {
                var w = (B + u) >> 1;
                var D = (C + y) >> 1;
                r(a[b + 2 * x - 1], w & 0xff, (w >> 16), m, n + (2 * x - 1) * s);
                r(a[b + 2 * x - 0], D & 0xff, (D >> 16), m, n + (2 * x - 0) * s)
            }
            if (c) {
                var w = (C + v) >> 1;
                var D = (B + z) >> 1;
                r(c[d + 2 * x - 1], w & 0xff, (w >> 16), o, p + (2 * x - 1) * s);
                r(c[d + 2 * x + 0], D & 0xff, (D >> 16), o, p + (2 * x + 0) * s)
            }
            u = y;
            v = z
        }
        if (!(q & 1)) {
            if (a) {
                var w = (3 * u + v + 0x00020002) >> 2;
                r(a[b + q - 1], w & 0xff, (w >> 16), m, n + (q - 1) * s)
            }
            if (c) {
                var w = (3 * v + u + 0x00020002) >> 2;
                r(c[d + q - 1], w & 0xff, (w >> 16), o, p + (q - 1) * s)
            }
        }
    }

    function UpsampleRgbLinePair(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l) {
        FUNC_NAME(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l, VP8YuvToRgb, 3)
    }

    function UpsampleBgrLinePair(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l) {
        FUNC_NAME(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l, VP8YuvToBgr, 3)
    }

    function UpsampleRgbaLinePair(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l) {
        FUNC_NAME(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l, VP8YuvToRgba, 4)
    }

    function UpsampleBgraLinePair(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l) {
        FUNC_NAME(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l, VP8YuvToBgra, 4)
    }

    function UpsampleArgbLinePair(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l) {
        FUNC_NAME(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l, VP8YuvToArgb, 4)
    }

    function UpsampleRgba4444LinePair(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l) {
        FUNC_NAME(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l, VP8YuvToRgba4444, 2)
    }

    function UpsampleRgb565LinePair(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l) {
        FUNC_NAME(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l, VP8YuvToRgb565, 2)
    }

    function UpsampleRgbKeepAlphaLinePair(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l) {
        FUNC_NAME(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l, VP8YuvToRgb, 4)
    }

    function UpsampleBgrKeepAlphaLinePair(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l) {
        FUNC_NAME(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l, VP8YuvToBgr, 4)
    }

    function UpsampleArgbKeepAlphaLinePair(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l) {
        FUNC_NAME(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l, VP8YuvToArgbKeepA, 4)
    }

    function UpsampleRgba4444KeepAlphaLinePair(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l) {
        FUNC_NAME(A, a, B, b, C, c, D, d, E, e, F, f, G, g, H, h, l, VP8YuvToRgba4444KeepA, 2)
    }
    var cO = new Array(MODE_LAST);
    var cP = new Array(MODE_LAST);

    function InitUpsamplers(a) {
        cO[O] = UpsampleRgbLinePair;
        cO[MODE_RGBA] = UpsampleRgbaLinePair;
        cO[MODE_BGR] = UpsampleBgrLinePair;
        cO[MODE_BGRA] = UpsampleBgraLinePair;
        cO[MODE_ARGB] = UpsampleArgbLinePair;
        cO[MODE_RGBA_4444] = UpsampleRgba4444LinePair;
        cO[MODE_RGB_565] = UpsampleRgb565LinePair;
        cP[O] = UpsampleRgbLinePair;
        cP[MODE_RGBA] = UpsampleRgbKeepAlphaLinePair;
        cP[MODE_BGR] = UpsampleBgrLinePair;
        cP[MODE_BGRA] = UpsampleBgrKeepAlphaLinePair;
        cP[MODE_ARGB] = UpsampleArgbKeepAlphaLinePair;
        cP[MODE_RGBA_4444] = UpsampleRgba4444KeepAlphaLinePair;
        cP[MODE_RGB_565] = UpsampleRgb565LinePair
    }

    function FUNC_NAME_SAMPLE(a, b, c, d, u, e, v, f, g, h, j, k, l, m, n) {
        var i;
        for (i = 0; i < l - 1; i += 2) {
            m(a[b + 0], u[e + 0], v[f + 0], g, h);
            m(a[b + 1], u[e + 0], v[f + 0], g, h + n);
            m(c[d + 0], u[e + 0], v[f + 0], j, k);
            m(c[d + 1], u[e + 0], v[f + 0], j, k + n);
            b += 2;
            d += 2;
            e++;
            f++;
            h += 2 * n;
            k += 2 * n
        }
        if (i == l - 1) {
            m(a[b + 0], u[e + 0], v[f + 0], g, h);
            m(c[d + 0], u[e + 0], v[f + 0], j, k)
        }
    }

    function SampleRgbLinePair(A, a, B, b, C, c, D, d, E, e, F, f, l) {
        FUNC_NAME_SAMPLE(A, a, B, b, C, c, D, d, E, e, F, f, l, VP8YuvToRgb, 3)
    }

    function SampleBgrLinePair(A, a, B, b, C, c, D, d, E, e, F, f, l) {
        FUNC_NAME_SAMPLE(A, a, B, b, C, c, D, d, E, e, F, f, l, VP8YuvToBgr, 3)
    }

    function SampleRgbaLinePair(A, a, B, b, C, c, D, d, E, e, F, f, l) {
        FUNC_NAME_SAMPLE(A, a, B, b, C, c, D, d, E, e, F, f, l, VP8YuvToRgba, 4)
    }

    function SampleBgraLinePair(A, a, B, b, C, c, D, d, E, e, F, f, l) {
        FUNC_NAME_SAMPLE(A, a, B, b, C, c, D, d, E, e, F, f, l, VP8YuvToBgra, 4)
    }

    function SampleArgbLinePair(A, a, B, b, C, c, D, d, E, e, F, f, l) {
        FUNC_NAME_SAMPLE(A, a, B, b, C, c, D, d, E, e, F, f, l, VP8YuvToArgb, 4)
    }

    function SampleRgba4444LinePair(A, a, B, b, C, c, D, d, E, e, F, f, l) {
        FUNC_NAME_SAMPLE(A, a, B, b, C, c, D, d, E, e, F, f, l, VP8YuvToRgba4444, 2)
    }

    function SampleRgb565LinePair(A, a, B, b, C, c, D, d, E, e, F, f, l) {
        FUNC_NAME_SAMPLE(A, a, B, b, C, c, D, d, E, e, F, f, l, VP8YuvToRgb565, 2)
    }
    var cQ = new Array(SampleRgbLinePair, SampleRgbaLinePair, SampleBgrLinePair, SampleBgraLinePair, SampleArgbLinePair, SampleRgba4444LinePair, SampleRgb565LinePair);

    function FUNC_NAME_YUV444(y, a, u, b, v, c, d, e, f, g, h) {
        var i;
        for (i = 0; i < f; ++i) g(y[a + i], u[b + i], v[c + i], d[e + i * h], 0)
    }

    function Yuv444ToRgb(A, a, B, b, C, c, D, d, l) {
        FUNC_NAME_YUV444(A, a, B, b, C, c, D, d, l, VP8YuvToRgb, 3)
    }

    function Yuv444ToBgr(A, a, B, b, C, c, D, d, l) {
        FUNC_NAME_YUV444(A, a, B, b, C, c, D, d, l, VP8YuvToBgr, 3)
    }

    function Yuv444ToRgba(A, a, B, b, C, c, D, d, l) {
        FUNC_NAME_YUV444(A, a, B, b, C, c, D, d, l, VP8YuvToRgba, 4)
    }

    function Yuv444ToBgra(A, a, B, b, C, c, D, d, l) {
        FUNC_NAME_YUV444(A, a, B, b, C, c, D, d, l, VP8YuvToBgra, 4)
    }

    function Yuv444ToArgb(A, a, B, b, C, c, D, d, l) {
        FUNC_NAME_YUV444(A, a, B, b, C, c, D, d, l, VP8YuvToArgb, 4)
    }

    function Yuv444ToRgba4444(A, a, B, b, C, c, D, d, l) {
        FUNC_NAME_YUV444(A, a, B, b, C, c, D, d, l, VP8YuvToRgba4444, 2)
    }

    function Yuv444ToRgb565(A, a, B, b, C, c, D, d, l) {
        FUNC_NAME_YUV444(A, a, B, b, C, c, D, d, l, VP8YuvToRgb565, 2)
    }
    var cR = new Array(Yuv444ToRgb, Yuv444ToRgba, Yuv444ToBgr, Yuv444ToBgra, Yuv444ToArgb, Yuv444ToRgba4444, Yuv444ToRgb565);

    function EmitYUV(a, p) {
        var b = p.output;
        var c = b.u.YUVA;
        var d = c.y;
        var e = c.y_off + a.mb_y * c.y_stride;
        var f = c.u;
        var g = c.u_off + (a.mb_y >> 1) * c.u_stride;
        var h = c.v;
        var i = c.v_off + (a.mb_y >> 1) * c.v_stride;
        var k = a.mb_w;
        var l = a.mb_h;
        var m = parseInt((k + 1) / 2);
        var j;
        for (j = 0; j < l; ++j) {
            memcpy(d, e + j * c.y_stride, a.y, a.y_off + j * a.y_stride, k)
        }
        for (j = 0; j < (l + 1) / 2; ++j) {
            memcpy(f, g + j * c.u_stride, a.u, a.u_off + j * a.uv_stride, m);
            memcpy(h, i + j * c.v_stride, a.v, a.v_off + j * a.uv_stride, m)
        }
        return a.mb_h
    }

    function EmitSampledRGB(a, p) {
        var b = p.output;
        var c = b.u.RGBA;
        var d = c.rgba;
        var e = c.rgba_off + a.mb_y * c.stride;
        var f = a.y;
        var g = a.y_off;
        var h = a.u;
        var i = a.u_off;
        var k = a.v;
        var l = a.v_off;
        var m = cQ[b.colorspace];
        var n = a.mb_w;
        var o = a.mb_h - 1;
        var j;
        for (j = 0; j < o; j += 2) {
            m(f, g, f, g + a.y_stride, h, i, k, l, d, e, d, e + c.stride, n);
            g += 2 * a.y_stride;
            i += a.uv_stride;
            l += a.uv_stride;
            e += 2 * c.stride
        }
        if (j == o) {
            m(f, g, f, g, h, i, k, l, d, e, d, e, n)
        }
        return a.mb_h
    }

    function EmitFancyRGB(a, p) {
        var b = a.mb_h;
        var c = p.output.u.RGBA;
        var d = c.rgba;
        var e = c.rgba_off + a.mb_y * c.stride;
        var f = a.a ? cP[p.output.colorspace] : cO[p.output.colorspace];
        var g = a.y;
        var h = a.y_off;
        var i = a.u;
        var j = a.u_off;
        var k = a.v;
        var l = a.v_off;
        var m = p.tmp_u;
        var n = p.tmp_u_off;
        var o = p.tmp_v;
        var q = p.tmp_v_off;
        var y = a.mb_y;
        var r = a.mb_y + a.mb_h;
        var s = a.mb_w;
        var t = parseInt((s + 1) / 2);
        if (y == 0) {
            f(null, null, g, h, i, j, k, l, i, j, k, l, null, null, d, e, s)
        } else {
            f(p.tmp_y, p.tmp_y_off, g, h, m, n, o, q, i, j, k, l, d, e - c.stride, d, e, s);
            b++
        }
        for (; y + 2 < r; y += 2) {
            m = i;
            n = j;
            o = k;
            q = l;
            j += a.uv_stride;
            l += a.uv_stride;
            e += 2 * c.stride;
            h += 2 * a.y_stride;
            f(g, h - a.y_stride, g, h, m, n, o, q, i, j, k, l, d, e - c.stride, d, e, s)
        }
        h += a.y_stride;
        if (a.crop_top + r < a.crop_bottom) {
            memcpy(p.tmp_y, p.tmp_y_off, g, h, s * sizeof(p.tmp_y));
            memcpy(p.tmp_u, p.tmp_u_off, i, j, t * sizeof(p.tmp_u));
            memcpy(p.tmp_v, p.tmp_v_off, k, l, t * sizeof(p.tmp_v));
            b--
        } else {
            if (!(r & 1)) {
                f(g, h, null, null, i, j, k, l, i, j, k, l, d, e + c.stride, null, null, s)
            }
        }
        return b
    }

    function EmitAlphaYUV(a, p) {
        var b = a.mb_w;
        var c = a.mb_h;
        var j;
        var d = p.output.u.YUVA;
        var e = d.a;
        var f = d.a_off + a.mb_y * d.a_stride;
        var g = a.a;
        var h = a.a_off;
        if (g != null) {
            for (j = 0; j < c; ++j) {
                memcpy(e, f, g, h, b * sizeof(e));
                h += a.width;
                f += d.a_stride
            }
        }
        return 0
    }

    function EmitAlphaRGB(a, p) {
        var b = p.output.colorspace;
        var c = b == MODE_ARGB ? 0 : (b == MODE_RGBA_4444 ? 1 : 3);
        var d = b == MODE_RGBA_4444 ? 2 : 4;
        var e = a.mb_w;
        var f = a.mb_h;
        var i, j;
        var g = p.output.u.RGBA;
        var h = g.rgba;
        var k = g.rgba_off + a.mb_y * g.stride;
        var l = a.a;
        var m = a.a_off;
        if (l != null) {
            for (j = 0; j < f; ++j) {
                for (i = 0; i < e; ++i) {
                    h[k + d * i + c] = l[m + i]
                }
                m += a.width;
                k += g.stride
            }
        }
        return 0
    }
    var cS = 30;

    function MULT(x, y) {
        return (((x) * (y) + (1 << (cS - 1))) >> cS)
    }

    function InitRescaler(a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
        a.x_expand = (b < f) + 0;
        a.src_width = b;
        a.src_height = c;
        a.dst_width = f;
        a.dst_height = g;
        a.dst = d;
        a.dst_off = e;
        a.dst_stride = h;
        a.x_add = a.x_expand ? (j - 1) : i - j;
        a.x_sub = a.x_expand ? (i - 1) : j;
        a.y_accum = k;
        a.y_add = k;
        a.y_sub = l;
        a.fx_scale = parseInt((1 << cS) / j);
        a.fy_scale = parseInt((1 << cS) / l);
        a.fxy_scale = a.x_expand ? parseInt(int64BitLeft(g, cS)) / (j * c) : parseInt(int64BitLeft(g, cS)) / (i * c);
        a.irow = m;
        a.irow_off = 0 * 4;
        a.frow = m;
        a.frow_off = n + f * 4
    }

    function ImportRow(a, b, c) {
        var d = 0;
        var e = int;
        var f = 0;
        if (!c.x_expand) {
            var g = 0;
            for (e = 0; e < c.dst_width; ++e) {
                f += c.x_add;
                for (; f > 0; f -= c.x_sub) {
                    g += a[b + (d++)]
                } {
                    var h = a[b + (d++)];
                    var i = h * (-f);
                    write32BitIn4Bytes(c.frow, c.frow_off + e * 4, ((g + h) * c.x_sub - i));
                    g = MULT(i, c.fx_scale)
                }
            }
        } else {
            var j = a[b + 0],
                right = a[b + 0];
            for (e = 0; e < c.dst_width; ++e) {
                if (f < 0) {
                    j = right;
                    right = a[b + (++d)];
                    f += c.x_add
                }
                write32BitIn4Bytes(c.frow, c.frow_off + e * 4, (right * c.x_add + (j - right) * f));
                f -= c.x_sub
            }
        }
        for (e = 0; e < c.dst_width; ++e) {
            write32BitIn4Bytes(c.irow, c.irow_off + e * 4, (write4BytesIn32Bit(c.frow, c.frow_off + e * 4) + write4BytesIn32Bit(c.irow, c.irow_off + e * 4)))
        }
    }

    function ExportRow(a) {
        var b = int;
        var c = a.fy_scale * (-a.y_accum);
        assert(a.y_accum <= 0);
        for (b = 0; b < a.dst_width; ++b) {
            var d = MULT(write4BytesIn32Bit(a.frow, a.frow_off + b * 4), c);
            var v = MULT(write4BytesIn32Bit(a.irow, a.irow_off + b * 4) - d, a.fxy_scale);
            a.dst[a.dst_off + b] = (!(v & ~0xff)) ? v : (v < 0) ? 0 : 255;
            write32BitIn4Bytes(a.irow, a.irow_off + b * 4, d)
        }
        a.y_accum += a.y_add;
        a.dst_off += a.dst_stride
    }

    function Rescale(a, b, c, d, e) {
        var f = 0;
        while (d-- > 0) {
            ImportRow(a, e);
            b += c;
            e.y_accum -= e.y_sub;
            while (e.y_accum <= 0) {
                ExportRow(e);
                f++
            }
        }
        return f
    }

    function EmitRescaledYUV(a, p) {
        var b = a.mb_h;
        var c = (b + 1) >> 1;
        var d = Rescale(a.y, a.y_off, a.y_stride, b, p.scaler_y);
        Rescale(a.u, a.u_off, a.uv_stride, c, p.scaler_u);
        Rescale(a.v, a.v_off, a.uv_stride, c, p.scaler_v);
        return d
    }

    function EmitRescaledAlphaYUV(a, p) {
        if (a.a != null) {
            Rescale(a.a, a.a_off, a.width, a.mb_h, p.scaler_a)
        }
        return 0
    }

    function IsAlphaMode(a) {
        return (a == MODE_RGBA || a == MODE_BGRA || a == MODE_ARGB || a == MODE_RGBA_4444 || a == MODE_YUVA)
    }

    function InitYUVRescaler(a, p) {
        var b = IsAlphaMode(p.output.colorspace);
        var c = p.output.u.YUVA;
        var d = a.scaled_width;
        var e = a.scaled_height;
        var f = (d + 1) >> 1;
        var g = (e + 1) >> 1;
        var h = (a.mb_w + 1) >> 1;
        var i = (a.mb_h + 1) >> 1;
        var j = 2 * d;
        var k = 2 * f;
        var l = size_t;
        var m = int32_t;
        var n = 0;
        l = j + 2 * k;
        if (b) {
            l += j
        }
        p.memory = malloc(l * sizeof(m) * 4, 0);
        if (p.memory == null) {
            return 0
        }
        m = p.memory;
        n = 0;
        InitRescaler(p.scaler_y, a.mb_w, a.mb_h, c.y, c.y_off, d, e, c.y_stride, a.mb_w, d, a.mb_h, e, m, n);
        InitRescaler(p.scaler_u, h, i, c.u, c.u_off, f, g, c.u_stride, h, f, i, g, m, n + j);
        InitRescaler(p.scaler_v, h, i, c.v, c.v_off, f, g, c.v_stride, h, f, i, g, m, n + j + k);
        p.emit = EmitRescaledYUV;
        if (b) {
            InitRescaler(p.scaler_a, a.mb_w, a.mb_h, c.a, c.a_off, d, e, c.a_stride, a.mb_w, d, a.mb_h, e, m, n + j + 2 * k);
            p.emit_alpha = EmitRescaledAlphaYUV
        }
        return 1
    }

    function Import(a, b, c, d, e) {
        var f = 0;
        while (f < d && e.y_accum > 0) {
            ImportRow(a, b, e);
            b += c;
            ++f;
            e.y_accum -= e.y_sub
        }
        return f
    }

    function ExportRGB(p, a) {
        var b = cR[p.output.colorspace];
        var c = p.output.u.RGBA;
        var d = c.rgba;
        var e = c.rgba_off + (p.last_y + a) * c.stride;
        var f = 0;
        while (p.scaler_y.y_accum <= 0 && p.scaler_u.y_accum <= 0) {
            assert(p.last_y + a + f < p.output.height);
            assert(p.scaler_u.y_accum == p.scaler_v.y_accum);
            ExportRow(p.scaler_y);
            ExportRow(p.scaler_u);
            ExportRow(p.scaler_v);
            b(p.scaler_y.dst, p.scaler_y.dst_off, p.scaler_u.dst, p.scaler_u.dst_off, p.scaler_v.dst, p.scaler_v.dst_off, d, e, p.scaler_y.dst_width);
            e += c.stride;
            f++
        }
        return f
    }

    function EmitRescaledRGB(a, p) {
        var b = a.mb_h;
        var c = (b + 1) >> 1;
        var j = 0,
            uv_j = 0;
        var d = 0;
        while (j < b) {
            var e = Import(a.y, a.y_off + j * a.y_stride, a.y_stride, b - j, p.scaler_y);
            var f = Import(a.u, a.u_off + uv_j * a.uv_stride, a.uv_stride, c - uv_j, p.scaler_u);
            var g = Import(a.v, a.v_off + uv_j * a.uv_stride, a.uv_stride, c - uv_j, p.scaler_v);
            assert(f == g);
            j += e;
            uv_j += f;
            d += ExportRGB(p, d)
        }
        return d
    }

    function ExportAlpha(p, a) {
        var b = p.output.u.RGBA;
        var c = b.rgba;
        var d = b.rgba_off + (p.last_y + a) * b.stride;
        var e = 0;
        while (p.scaler_a.y_accum <= 0) {
            var i;
            assert(p.last_y + a + e < p.output.height);
            ExportRow(p.scaler_a);
            for (i = 0; i < p.scaler_a.dst_width; ++i) {
                c[d + 4 * i + 3] = p.scaler_a.dst[p.scaler_a.dst_off + i]
            }
            d += b.stride;
            e++
        }
        return e
    }

    function EmitRescaledAlphaRGB(a, p) {
        if (a.a != null) {
            var j = 0,
                pos = 0;
            while (j < a.mb_h) {
                j += Import(a.a, a.a_off + j * a.width, a.width, a.mb_h - j, p.scaler_a);
                pos += ExportAlpha(p, pos)
            }
        }
        return 0
    }

    function InitRGBRescaler(a, p) {
        var b = IsAlphaMode(p.output.colorspace);
        var c = a.scaled_width;
        var d = a.scaled_height;
        var e = (a.mb_w + 1) >> 1;
        var f = (a.mb_h + 1) >> 1;
        var g = 2 * c;
        var h = int32_t;
        var i = 0;
        var j = uint8_t;
        var k = 0;
        var l = size_t,
            tmp_size2 = size_t;
        l = 3 * g;
        tmp_size2 = 3 * c;
        if (b) {
            l += g;
            tmp_size2 += c
        }
        p.memory = malloc(l * sizeof(h) * 4 + tmp_size2 * sizeof(j) * 1, 0);
        p.memory_off = 0;
        if (p.memory == null) {
            slert('memory error');
            return 0
        }
        h = p.memory;
        i = p.memory_off;
        j = h;
        k = i + l * 1;
        InitRescaler(p.scaler_y, a.mb_w, a.mb_h, j, k + 0 * c * 1, c, d, 0, a.mb_w, c, a.mb_h, d, h, i + 0 * g * 4);
        InitRescaler(p.scaler_u, e, f, j, k + 1 * c * 1, c, d, 0, a.mb_w, 2 * c, a.mb_h, 2 * d, h, i + 1 * g * 4);
        InitRescaler(p.scaler_v, e, f, j, k + 2 * c * 1, c, d, 0, a.mb_w, 2 * c, a.mb_h, 2 * d, h, i + 2 * g * 4);
        p.emit = EmitRescaledRGB;
        if (b) {
            InitRescaler(p.scaler_a, a.mb_w, a.mb_h, j, k + 3 * c * 1, c, d, 0, a.mb_w, c, a.mb_h, d, h, i + 3 * g * 4);
            p.emit_alpha = EmitRescaledAlphaRGB
        }
        return 1
    }

    function InitFromOptions(a, b) {
        var W = b.width;
        var H = b.height;
        var x = 0,
            y = 0,
            w = W,
            h = H;
        b.use_cropping = (a != null) && (a.use_cropping > 0);
        if (b.use_cropping) {
            w = a.crop_width;
            h = a.crop_height;
            x = a.crop_left & ~1;
            y = a.crop_top & ~1;
            if (x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > W || y + h > H) {
                return 0
            }
        }
        b.crop_left = x;
        b.crop_top = y;
        b.crop_right = x + w;
        b.crop_bottom = y + h;
        b.mb_w = w;
        b.mb_h = h;
        b.use_scaling = ((a != null) && (a.use_scaling > 0)) + 0;
        if (b.use_scaling) {
            if (a.scaled_width <= 0 || a.scaled_height <= 0) {
                return 0
            }
            b.scaled_width = a.scaled_width;
            b.scaled_height = a.scaled_height
        }
        b.bypass_filtering = a && a.bypass_filtering;
        b.fancy_upsampling = ((a == null) || (!a.no_fancy_upsampling)) + 0;
        if (b.use_scaling) {
            b.bypass_filtering = (b.scaled_width < parseInt(W * 3 / 4)) + 0 && (b.scaled_height < parseInt(H * 3 / 4)) + 0;
            b.fancy_upsampling = 0
        }
        return 1
    }

    function CustomSetup(a) {
        var p = a.opaque;
        var b = (p.output.colorspace < MODE_YUV);
        p.memory = null;
        p.emit = null;
        p.emit_alpha = null;
        if (!InitFromOptions(p.options_, a)) {
            return 0
        }
        if (a.use_scaling) {
            var c = b ? InitRGBRescaler(a, p) : InitYUVRescaler(a, p);
            if (!c) {
                alert('memory error #1');
                return 0
            }
        } else {
            if (b) {
                p.emit = EmitSampledRGB;
                if (a.fancy_upsampling) {
                    var d = (a.mb_w + 1) >> 1;
                    p.memory = malloc(a.mb_w + 2 * d, 205);
                    if (p.memory == null) {
                        alert('memory error #2');
                        return 0
                    }
                    p.tmp_y = p.memory;
                    p.tmp_y_off = 0;
                    p.tmp_u = p.tmp_y;
                    p.tmp_u_off = p.tmp_y_off + a.mb_w;
                    p.tmp_v = p.tmp_u;
                    p.tmp_v_off = p.tmp_u_off + d;
                    p.emit = EmitFancyRGB;
                    InitUpsamplers()
                }
            } else {
                p.emit = EmitYUV
            }
            if (IsAlphaMode(p.output.colorspace)) {
                p.emit_alpha = b ? EmitAlphaRGB : EmitAlphaYUV
            }
        }
        if (b) {
            VP8YUVInit()
        }
        return 1
    }

    function CustomPut(a) {
        var p = a.opaque;
        var b = a.mb_w;
        var c = a.mb_h;
        var d;
        assert(!(a.mb_y & 1));
        if (b <= 0 || c <= 0) {
            return 0
        }
        d = p.emit(a, p);
        p.last_y += d;
        if (p.emit_alpha) {
            p.emit_alpha(a, p)
        }
        return 1
    }

    function CustomTeardown(a) {
        var p = a.opaque;
        p.memory = '';
        p.memory = null
    }

    function WebPInitCustomIo(b, c) {
        c.put = function(a) {
            return CustomPut(a)
        };
        c.setup = function(a) {
            return CustomSetup(a)
        };
        c.teardown = function(a) {
            return CustomTeardown(a)
        };
        c.opaque = b
    }
    var co = 12;
    var cT = 10;
    var cU = 4096;
    var cV = 4096;
    var cW = 0,
        STATE_PARTS0 = 1,
        STATE_DATA = 2,
        STATE_DONE = 3,
        STATE_ERROR = 4;
    var cX = 0,
        MEM_MODE_APPEND = 1,
        MEM_MODE_MAP = 2;
    var cY = {
        mode_: 'MemBufferMode',
        start_: uint32_t,
        end_: uint32_t,
        buf_size_: size_t,
        buf_: uint8_t,
        buf_off: 0,
        part0_size_: size_t,
        part0_buf_: uint8_t,
        part0_buf_off: 0
    };
    var cZ = {
        state_: "DecState",
        params_: newObjectIt(ba),
        dec_: newObjectIt(bz),
        io_: newObjectIt(Y),
        mem_: newObjectIt(cY),
        output_: newObjectIt(R)
    };
    var da = {
        left_: newObjectIt(bw),
        info_: newObjectIt(bw),
        intra_t_: Arr(4, uint8_t),
        intra_l_: Arr(4, uint8_t),
        br_: newObjectIt(bb),
        token_br_: newObjectIt(bb)
    };

    function MemDataSize(a) {
        return (a.end_ - a.start_)
    }

    function AppendToMemBuffer(a, b, c) {
        var d = a.mem_;
        var e = a.dec_;
        var f = e.num_parts_ - 1;
        assert(d.mode_ == MEM_MODE_APPEND);
        if (d.end_ + c > d.buf_size_) {
            var p;
            var g = null;
            var h = 0;
            var i = parseInt((MemDataSize(d) + c + cU - 1) / cU);
            var j = i * cU;
            var k = d.buf_;
            var l = d.buf_off + d.start_;
            var g = malloc(j - 1, 205);
            var h = 0;
            if (!g) return 0;
            memcpy(g, h, k, l, MemDataSize(d));
            for (p = 0; p <= f; ++p) {
                if (e.parts_[p].buf_off != null) {
                    e.parts_[p].buf_ = g;
                    e.parts_[p].buf_off = h + ((e.parts_[p].buf_off) - l);
                    e.parts_[p].buf_end_ = h + ((e.parts_[p].buf_end_) - l)
                }
            }
            d.buf_ = '';
            d.buf_ = g;
            d.buf_off = h;
            d.buf_size_ = j;
            d.end_ = MemDataSize(d);
            d.start_ = 0
        }
        memcpy(d.buf_, d.buf_off + d.end_, b, 0, c);
        d.end_ += c;
        assert(d.end_ <= d.buf_size_);
        if (f >= 0) {
            e.parts_[f].buf_end_ = d.buf_off + d.end_
        }
        a.io_.data = d.buf_;
        a.io_.data_off = d.buf_off;
        a.io_.data_size = MemDataSize(d);
        return 1
    }

    function RemapMemBuffer(a, b, c, d) {
        var p;
        var e = a.mem_;
        var f = a.dec_;
        var g = f.num_parts_ - 1;
        var h = e.buf_;
        var i = e.buf_off;
        assert(e.mode_ == MEM_MODE_MAP);
        if (d < e.buf_size_) {
            alert('we cannot remap to a shorter buffer!');
            return 0
        }
        for (p = 0; p <= g; ++p) {
            if (f.parts_[p].buf_off != null) {
                f.parts_[p].buf_ = b;
                f.parts_[p].buf_off = c + ((f.parts_[p].buf_off) - i);
                f.parts_[p].buf_end_ = c + ((f.parts_[p].buf_end_) - i)
            }
        }
        if (g >= 0) {
            f.parts_[g].buf_end_ = c + d
        }
        if (f.br_.buf_) {
            f.br_.buf_ = b;
            f.br_.buf_off = c + ((f.br_.buf_off) - i);
            f.br_.buf_end_ = c + ((f.br_.buf_end_) - i)
        }
        e.buf_ = b;
        e.buf_off = c;
        e.end_ = e.buf_size_ = d;
        a.io_.data = b;
        a.io_.data_off = c;
        a.io_.data_size = d;
        return 1
    }

    function InitMemBuffer(a) {
        a.mode_ = cX;
        a.buf_ = 0;
        a.buf_size_ = 0;
        a.part0_buf_ = 0;
        a.part0_size_ = 0
    }

    function ClearMemBuffer(a) {
        assert(a);
        if (a.mode_ == MEM_MODE_APPEND) {
            a.buf_ = '';
            a.buf_off = 0;
            a.part0_buf_ = '';
            a.part0_buf_off = ''
        }
    }

    function CheckMemBufferMode(a, b) {
        if (a.mode_ == cX) {
            a.mode_ = b
        } else if (a.mode_ != b) {
            alert('we mixed the modes => error');
            return 0
        }
        assert(a.mode_ == b);
        return 1
    }

    function SaveContext(a, b, c) {
        var d = a.br_;
        var e = a.mb_info_[1 - 1];
        var f = a.mb_info_[1 + a.mb_x_];
        c.left_ = newObjectIt(e);
        c.info_ = newObjectIt(f);
        c.br_ = newObjectIt(d);
        c.token_br_ = newObjectIt(b);
        memcpy(c.intra_t_, 0, a.intra_t_, +4 * a.mb_x_, 4);
        memcpy(c.intra_l_, 0, a.intra_l_, 0, 4)
    }

    function RestoreContext(a, b, c) {
        var d = b.br_;
        var e = b.mb_info_[1 - 1];
        var f = b.mb_info_[1 + b.mb_x_];
        e.dc_nz_ = a.left_.dc_nz_;
        e.f_ilevel_ = a.left_.f_ilevel_;
        e.f_inner_ = a.left_.f_inner_;
        e.f_level_ = a.left_.f_level_;
        e.nz_ = a.left_.nz_;
        e.skip_ = a.left_.skip_;
        f.dc_nz_ = a.info_.dc_nz_;
        f.f_ilevel_ = a.info_.f_ilevel_;
        f.f_inner_ = a.info_.f_inner_;
        f.f_level_ = a.info_.f_level_;
        f.nz_ = a.info_.nz_;
        f.skip_ = a.info_.skip_;
        b.br_.buf_end_ = a.br_.buf_end_;
        b.br_.buf_off = a.br_.buf_off;
        b.br_.eof_ = a.br_.eof_;
        b.br_.missing_ = a.br_.missing_;
        b.br_.range_ = a.br_.range_;
        b.br_.value_ = a.br_.value_;
        c.buf_end_ = (a.token_br_.buf_end_);
        c.buf_off = (a.token_br_.buf_off);
        c.eof_ = (a.token_br_.eof_);
        c.missing_ = (a.token_br_.missing_);
        c.range_ = (a.token_br_.range_);
        c.value_ = (a.token_br_.value_);
        memcpy(b.intra_t_, +4 * b.mb_x_, a.intra_t_, 0, 4);
        memcpy(b.intra_l_, 0, a.intra_l_, 0, 4)
    }

    function IDecError(a, b) {
        if (a.state_ == STATE_DATA) {
            var c = a.io_;
            if (c.teardown) {
                c.teardown(c)
            }
        }
        a.state_ = STATE_ERROR;
        return b
    }

    function DecodeHeader(a) {
        var b = uint32_t,
            bits = uint32_t;
        var c = a.mem_.buf_;
        var d = {
            value: (a.mem_.buf_off + a.mem_.start_)
        };
        var e = {
            value: MemDataSize(a.mem_)
        };
        var f = {
            value: uint32_t
        };
        var g = {
            value: uint32_t
        };
        var h = {
            value: 0
        };
        var i = {
            value: 0
        };
        if (e.value < co) {
            return VP8_STATUS_SUSPENDED
        }
        if (!WebPCheckAndSkipRIFFHeader(c, d, e, g)) {
            return IDecError(a, VP8_STATUS_BITSTREAM_ERROR)
        }
        if (!VP8XGetInfo(c, d, e, h, null, null, null)) {
            return IDecError(a, VP8_STATUS_BITSTREAM_ERROR)
        }
        if (h.value == -1) {
            return VP8_STATUS_SUSPENDED
        }
        if (!VP8CheckAndSkipHeader(c, d, e, i, f, g)) {
            return IDecError(a, VP8_STATUS_BITSTREAM_ERROR)
        }
        if ((i.value == -1) && (f.value == 0)) {
            return VP8_STATUS_SUSPENDED
        }
        if (e.value < cT) {
            return VP8_STATUS_SUSPENDED
        }
        if (!VP8GetInfo(c, d, e, f, null, null, null)) {
            return IDecError(a, VP8_STATUS_BITSTREAM_ERROR)
        }
        e = e.value;
        d = d.value;
        b = a.mem_.end_ - e;
        bits = c[d + 0] | (c[d + 1] << 8) | (c[d + 2] << 16);
        a.mem_.part0_size_ = (bits >> 5) + cT;
        a.mem_.start_ += b;
        assert(a.mem_.start_ <= a.mem_.end_);
        a.io_.data_size -= b;
        a.io_.data = c;
        a.io_.data_off = d;
        a.state_ = STATE_PARTS0;
        return T
    }

    function CopyParts0Data(a) {
        var b = a.dec_.br_;
        var c = b.buf_end_ - b.buf_off;
        var d = a.mem_;
        assert(c > 0);
        assert(c <= d.part0_size_);
        if (d.mode_ == MEM_MODE_APPEND) {
            var e = malloc(c, uint8_t);
            var f = 0;
            if (!e) {
                return 0
            }
            memcpy(e, f, b.buf_, b.buf_off, c);
            d.part0_buf_ = e;
            d.part0_buf_off = f;
            d.start_ += c;
            b.buf_ = e;
            b.buf_off = f;
            b.buf_end_ = f + c
        } else {}
        return 1
    }

    function DecodePartition0(a) {
        var b = a.dec_;
        var c = a.io_;
        var d = a.params_;
        var e = d.output;
        if (MemDataSize(a.mem_) < a.mem_.part0_size_) {
            return VP8_STATUS_SUSPENDED
        }
        if (!VP8GetHeaders(b, c)) {
            var f = b.status_;
            if (f == VP8_STATUS_SUSPENDED || f == VP8_STATUS_NOT_ENOUGH_DATA) {
                return VP8_STATUS_SUSPENDED
            }
            return IDecError(a, f)
        }
        b.status_ = WebPAllocateDecBuffer(c.width, c.height, d.options_, e);
        if (b.status_ != T) {
            return IDecError(a, b.status_)
        }
        if (!CopyParts0Data(a)) {
            return IDecError(a, VP8_STATUS_OUT_OF_MEMORY)
        }
        if (VP8EnterCritical(b, c) != T) {
            return IDecError(a, b.status_)
        }
        a.state_ = STATE_DATA;
        if (!VP8InitFrame(b, c)) {
            return IDecError(a, b.status_)
        }
        return T
    }

    function DecodeRemaining(a) {
        var b = newObjectIt(bb);
        var c = a.dec_;
        var d = a.io_;
        assert(c.ready_);
        b = c.br_;
        for (; c.mb_y_ < c.mb_h_; ++c.mb_y_) {
            var e = c.parts_[c.mb_y_ & (c.num_parts_ - 1)];
            if (c.mb_x_ == 0) {
                VP8InitScanline(c)
            }
            for (; c.mb_x_ < c.mb_w_; c.mb_x_++) {
                var f = (da);
                SaveContext(c, e, f);
                if (!VP8DecodeMB(c, e)) {
                    RestoreContext(f, c, e);
                    if (c.num_parts_ == 1 && MemDataSize(a.mem_) > cV) {
                        return IDecError(a, VP8_STATUS_BITSTREAM_ERROR)
                    }
                    return VP8_STATUS_SUSPENDED
                }
                VP8ReconstructBlock(c);
                VP8StoreBlock(c);
                if (c.num_parts_ == 1) {
                    a.mem_.start_ = e.buf_off - a.mem_.buf_off;
                    assert(a.mem_.start_ <= a.mem_.end_)
                }
            }
            if (!VP8ProcessRow(c, d)) {
                return IDecError(a, VP8_STATUS_USER_ABORT)
            }
            c.mb_x_ = 0
        }
        if (!VP8ExitCritical(c, d)) {
            return IDecError(a, VP8_STATUS_USER_ABORT)
        }
        c.ready_ = 0;
        a.state_ = STATE_DONE;
        return T
    }

    function IDecode(a) {
        var b = VP8_STATUS_SUSPENDED;
        assert(a.dec_);
        if (a.state_ == cW) {
            b = DecodeHeader(a)
        }
        if (a.state_ == STATE_PARTS0) {
            b = DecodePartition0(a)
        }
        if (a.state_ == STATE_DATA) {
            b = DecodeRemaining(a)
        }
        return b
    }

    function WebPINewDecoder(a) {
        var b = newObjectIt(cZ);
        if (b == null) {
            return null
        }
        b.dec_ = VP8New();
        if (b.dec_ == null) {
            b = '';
            return null
        }
        b.state_ = cW;
        InitMemBuffer(b.mem_);
        WebPInitDecBuffer(b.output_);
        VP8InitIo(b.io_);
        WebPResetDecParams(b.params_);
        b.params_.output = a ? a : b.output_;
        WebPInitCustomIo(b.params_, b.io_);
        b.dec_.use_threads_ = 0;
        return b
    }
    this.WebPIDecode = function(a, b, c) {
        var d = newObjectIt(cZ);
        if (a != null && b > 0 && c != null) {
            if (this.WebPGetFeatures(a, b, c.input) != T) {
                return null
            }
        }
        d = WebPINewDecoder(c ? c.output : null);
        if (!d) {
            return null
        }
        if (c != null) {
            d.params_.options_ = c.options_
        }
        return d
    };
    this.WebPIDelete = function(a) {
        if (!a) return;
        VP8Delete(a.dec_);
        ClearMemBuffer(a.mem_);
        this.WebPFreeDecBuffer(a.output_);
        a = ''
    };
    this.WebPINew = function(a) {
        a = a == 'MODE_RGB' ? O : a;
        a = a == 'MODE_RGBA' ? MODE_RGBA : a;
        a = a == 'MODE_BGR' ? MODE_BGR : a;
        a = a == 'MODE_BGRA' ? MODE_BGRA : a;
        a = a == 'MODE_YUV' ? MODE_YUV : a;
        var b = WebPINewDecoder(null);
        if (!b) return null;
        b.output_.colorspace = a;
        return b
    };
    this.WebPINewRGB = function(a, b, c, d) {
        var e = newObjectIt(cZ);
        if (a >= MODE_YUV) return null;
        e = WebPINewDecoder(null);
        if (e) return null;
        e.output_.colorspace = a;
        e.output_.is_external_memory = 1;
        e.output_.u.RGBA.rgba = b;
        e.output_.u.RGBA.stride = d;
        e.output_.u.RGBA.size = c;
        return e
    };
    this.WebPINewYUV = function(a, b, c, d, u, e, f, g, v, h, i, j) {
        var k = WebPINewDecoder(null);
        if (k) return null;
        k.output_.colorspace = MODE_YUV;
        k.output_.is_external_memory = 1;
        k.output_.u.YUVA.y = a;
        k.output_.u.YUVA.y = b;
        k.output_.u.YUVA.y_stride = d;
        k.output_.u.YUVA.y_size = c;
        k.output_.u.YUVA.u = u;
        k.output_.u.YUVA.u = e;
        k.output_.u.YUVA.u_stride = g;
        k.output_.u.YUVA.u_size = f;
        k.output_.u.YUVA.v = v;
        k.output_.u.YUVA.v = h;
        k.output_.u.YUVA.v_stride = j;
        k.output_.u.YUVA.v_size = i;
        return k
    };

    function IDecCheckStatus(a) {
        assert(a);
        if (a.dec_ == null) {
            return VP8_STATUS_USER_ABORT
        }
        if (a.state_ == STATE_ERROR) {
            return VP8_STATUS_BITSTREAM_ERROR
        }
        if (a.state_ == STATE_DONE) {
            return T
        }
        return VP8_STATUS_SUSPENDED
    }
    this.WebPIAppend = function(a, b, c) {
        var d = 0;
        if (a == null || b == null) {
            return VP8_STATUS_INVALID_PARAM
        }
        d = IDecCheckStatus(a);
        if (d != VP8_STATUS_SUSPENDED) {
            return d
        }
        if (!CheckMemBufferMode(a.mem_, MEM_MODE_APPEND)) {
            return VP8_STATUS_INVALID_PARAM
        }
        if (!AppendToMemBuffer(a, b, c)) {
            return VP8_STATUS_OUT_OF_MEMORY
        }
        return IDecode(a)
    };
    this.WebPIUpdate = function(a, b, c) {
        var d = 0;
        if (a == null || b == null) {
            return VP8_STATUS_INVALID_PARAM
        }
        d = IDecCheckStatus(a);
        if (d != VP8_STATUS_SUSPENDED) {
            return d
        }
        if (!CheckMemBufferMode(a.mem_, MEM_MODE_MAP)) {
            return VP8_STATUS_INVALID_PARAM
        }
        if (!RemapMemBuffer(a, b, 0, c)) {
            return VP8_STATUS_INVALID_PARAM
        }
        return IDecode(a)
    };

    function GetOutputBuffer(a) {
        if (!a || !a.dec_ || a.state_ <= STATE_PARTS0) {
            return null
        }
        return a.params_.output
    }
    this.WebPIDecodedArea = function(a, b, c, d, e) {
        var f = GetOutputBuffer(a);
        if (b) b.value = 0;
        if (c) c.value = 0;
        if (f) {
            if (d) d.value = f.width;
            if (e) e.value = a.params_.last_y
        } else {
            if (d) d.value = 0;
            if (e) e.value = 0
        }
        return f
    };
    this.WebPIDecGetRGB = function(a, b, c, d, e) {
        var f = GetOutputBuffer(a);
        if (!f) return null;
        if (f.colorspace >= MODE_YUV) {
            return null
        }
        if (typeof b.value !== "undefined") b.value = a.params_.last_y;
        if (typeof c.value !== "undefined") c.value = f.width;
        if (typeof d.value !== "undefined") d.value = f.height;
        if (typeof e.value !== "undefined") e.value = f.u.RGBA.stride;
        return f.u.RGBA.rgba
    };
    this.WebPIDecGetYUV = function(a, b, u, v, c, d, e, f) {
        var g = GetOutputBuffer(a);
        if (!g) return null;
        if (g.colorspace < MODE_YUV) {
            return null
        }
        if (typeof b.value !== "undefined") b.value = g.u.YUVA.u;
        if (typeof u.value !== "undefined") u.value = g.u.YUVA.u;
        if (typeof v.value !== "undefined") v.value = g.u.YUVA.v;
        if (typeof c.value !== "undefined") c.value = g.width;
        if (typeof d.value !== "undefined") d.value = g.height;
        if (typeof e.value !== "undefined") e.value = g.u.YUVA.y_stride;
        if (typeof f.value !== "undefined") f.value = g.u.YUVA.u_stride;
        return g.u.YUVA.y
    };

    function WebPISetIOHooks(a, b, c, d, e) {
        if (!a || !a.dec_ || a.state_ > cW) {
            return 0
        }
        a.io_.put = b;
        a.io_.setup = c;
        a.io_.teardown = d;
        a.io_.opaque = e;
        return 1
    }
    var co = 12;

    function WebPCheckAndSkipRIFFHeader(a, b, c, d) {
        if (c.value >= co && !memcmp(a, b.value, "RIFF", 4)) {
            if (memcmp(a, b.value + 8, "WEBP", 4)) {
                return 0
            } else {
                d.value = get_le32(a, b.value + 4);
                if (d.value < co) {
                    return 0
                }
                b.value += co;
                c.value -= co
            }
        } else {
            d.value = 0
        }
        return 1
    }

    function WebPResetDecParams(a) {
        if (a) {}
    }
    var cq = '',
        cr = '';

    function DecodeInto(a, b, c, d) {
        cr = new VP8New();
        var e = T;
        cq = newObjectIt(Y);
        var f = 1;
        assert(d);
        if (cr == null) {
            return VP8_STATUS_INVALID_PARAM
        }
        VP8InitIo(cq);
        cq.data = a;
        cq.data_off = b;
        cq.data_size = c;
        WebPInitCustomIo(d, cq);
        cr.use_threads_ = 0;
        if (!VP8GetHeaders(cr, cq)) {
            e = VP8_STATUS_BITSTREAM_ERROR
        } else {
            e = WebPAllocateDecBuffer(cq.width, cq.height, d.options_, d.output);
            if (e == T) {
                if (!VP8Decode(cr, cq)) {
                    e = cr.status_
                }
            }
        }
        VP8Delete(cr);
        if (e != T) {
            this.WebPFreeDecBuffer(d.output)
        }
        return e
    };

    function DecodeIntoRGBABuffer(a, b, c, d, e, f) {
        var g = newObjectIt(ba);
        var h = newObjectIt(R);
        if (d == null) {
            return null
        }
        WebPInitDecBuffer(h);
        WebPResetDecParams(g);
        g.output = h;
        h.colorspace = a;
        h.u.RGBA.rgba = d;
        h.u.RGBA.rgba_off = 0;
        h.u.RGBA.stride = e;
        h.u.RGBA.size = f;
        h.is_external_memory = 1;
        if (DecodeInto(b, 0, c, g) != T) {
            return null
        }
        return d
    }

    function WebPDecodeRGBInto(a, b, c, d, e) {
        return DecodeIntoRGBABuffer(O, a, b, c, e, d)
    }

    function WebPDecodeRGBAInto(a, b, c, d, e) {
        return DecodeIntoRGBABuffer(MODE_RGBA, a, b, c, e, d)
    }

    function WebPDecodeARGBInto(a, b, c, d, e) {
        return DecodeIntoRGBABuffer(MODE_ARGB, a, b, c, e, d)
    }

    function WebPDecodeBGRInto(a, b, c, d, e) {
        return DecodeIntoRGBABuffer(MODE_BGR, a, b, c, e, d)
    }

    function WebPDecodeBGRAInto(a, b, c, d, e) {
        return DecodeIntoRGBABuffer(MODE_BGRA, a, b, c, e, d)
    }

    function WebPDecodeYUVInto(a, b, c, d, e, f, u, g, h, i, v, j, k, l) {
        var m = newObjectIt(ba);
        var n = newObjectIt(R);
        if (c == null) return null;
        WebPInitDecBuffer(n);
        WebPResetDecParams(m);
        m.output = n;
        n.colorspace = MODE_YUV;
        n.u.YUVA.y = c;
        n.u.YUVA.y_off = d;
        n.u.YUVA.y_stride = f;
        n.u.YUVA.y_size = e;
        n.u.YUVA.u = u;
        n.u.YUVA.u_off = g;
        n.u.YUVA.u_stride = i;
        n.u.YUVA.u_size = h;
        n.u.YUVA.v = v;
        n.u.YUVA.v_off = j;
        n.u.YUVA.v_stride = l;
        n.u.YUVA.v_size = k;
        n.is_external_memory = 1;
        if (DecodeInto(a, 0, b, m) != T) {
            return null
        }
        return c
    }
    var db = -1,
        data_size = -1,
        params_out = -1;
    var dc = -1;

    function Decode(a, b, c, d, e, f) {
        data_off = {
            value: 0
        };
        c = {
            value: c
        };
        var g = newObjectIt(ba);
        var h = newObjectIt(R);
        WebPInitDecBuffer(h);
        WebPResetDecParams(g);
        g.output = h;
        h.colorspace = a;
        var o = {
            data_off: {
                value: 0
            },
            width: {
                value: h.width
            },
            height: {
                value: h.height
            }
        };
        if (!WebPGetInfo(b, data_off, c, o.width, o.height)) {
            return null
        }
        h.width = o.width.value;
        h.height = o.height.value;
        if (d) d.value = h.width.value;
        if (e) e.value = h.height.value;
        if (DecodeInto(b, data_off.value, c.value, g) != T) {
            return null
        }
        if (f) {
            WebPCopyDecBuffer(h, f)
        }
        return (a >= MODE_YUV) ? h.u.YUVA.y : h.u.RGBA.rgba
    }
    this.WebPDecodeRGB = function(a, b, c, d) {
        return Decode(O, a, b, c, d, null)
    };
    this.WebPDecodeRGBA = function(a, b, c, d) {
        return Decode(MODE_RGBA, a, b, c, d, null)
    };
    this.WebPDecodeRGBA_4444 = function(a, b, c, d) {
        return Decode(MODE_RGBA_4444, a, b, c, d, null)
    };
    this.WebPDecodeARGB = function(a, b, c, d) {
        return Decode(MODE_ARGB, a, b, c, d, null)
    };
    this.WebPDecodeBGR = function(a, b, c, d) {
        return Decode(MODE_BGR, a, b, c, d, null)
    };
    this.WebPDecodeBGRA = function(a, b, c, d) {
        return Decode(MODE_BGRA, a, b, c, d, null)
    };

    function DefaultFeatures(a) {
        assert(a);
        a.bitstream_version = 0
    }

    function GetFeatures(a, b, c, d) {
        var e = {
            value: 0
        };
        var f = {
            value: 0
        };
        var g = {
            value: 0
        };
        var h = {
            value: 0
        };
        var i = {
            value: 0
        };
        if (d == null) {
            return VP8_STATUS_INVALID_PARAM
        }
        DefaultFeatures(d);
        if (a == null || b == null || c.value == 0) {
            return VP8_STATUS_INVALID_PARAM
        }
        if (!WebPCheckAndSkipRIFFHeader(a, b, c, f)) {
            return VP8_STATUS_BITSTREAM_ERROR
        }
        if (!VP8XGetInfo(a, b, c, h, d.width, d.height, g)) {
            return VP8_STATUS_BITSTREAM_ERROR
        }
        if (h.value > 0) {
            return T
        }
        if (!VP8CheckAndSkipHeader(a, b, c, i, e, f)) {
            return VP8_STATUS_BITSTREAM_ERROR
        }
        if (i.value == -1) {
            return VP8_STATUS_BITSTREAM_ERROR
        }
        if (!i.value) {
            e.value = c.value
        }
        if (!VP8GetInfo(a, b, c, e, d.width, d.height, d.has_alpha)) {
            return VP8_STATUS_BITSTREAM_ERROR
        }
        return T
    }

    function WebPGetInfo(a, b, c, d, e) {
        var f = newObjectIt(U);
        if (GetFeatures(a, b, c, f) != T) {
            return 0
        }
        if (d) {
            d.value = f.width
        }
        if (e) {
            e.value = f.height
        }
        return 1
    }

    function WebPInitDecoderConfigInternal(a, b) {
        if (b != N) {
            return 0
        }
        if (a == null) {
            return 0
        }
        DefaultFeatures(a.input);
        WebPInitDecBuffer(a.output);
        return 1
    }

    function WebPGetFeaturesInternal(a, b, c, d) {
        if (d != N) {
            return VP8_STATUS_INVALID_PARAM
        }
        if (c == null) {
            return VP8_STATUS_INVALID_PARAM
        }
        var e = {
            value: 0
        };
        var b = {
            value: b
        };
        return GetFeatures(a, e, b, c)
    }
    this.WebPDecode = function(a, b, c) {
        var d = newObjectIt(ba);
        var e = 'VP8StatusCode';
        if (!c) {
            return VP8_STATUS_INVALID_PARAM
        }
        var f = {
            value: 0
        };
        b = {
            value: b
        };
        e = GetFeatures(a, f, b, c.input);
        if (e != T) {
            return e
        }
        WebPResetDecParams(d);
        d.output = c.output;
        d.options_ = c.options;
        e = DecodeInto(a, f.value, b.value, d);
        return e
    };
    var dd, height;
    var db = -1,
        data_size = -1,
        dd = -1,
        height = -1,
        params_out = -1;
    var dc = -1
}

function WebPEncoder() {
    var N = 0x0002;
    var O = {
        quality: float,
        target_size: int,
        target_PSNR: float,
        method: int,
        segments: int,
        sns_strength: int,
        filter_strength: int,
        filter_sharpness: int,
        filter_type: int,
        autofilter: int,
        pass: int,
        show_compressed: int,
        preprocessing: int,
        partitions: int,
        partition_limit: int,
        alpha_compression: int
    };
    var P = {
        WEBP_PRESET_DEFAULT: 0,
        WEBP_PRESET_PICTURE: 1,
        WEBP_PRESET_PHOTO: 2,
        WEBP_PRESET_DRAWING: 3,
        WEBP_PRESET_ICON: 4,
        WEBP_PRESET_TEXT: 5
    };

    function WebPConfigPreset(a, b, c) {
        return WebPConfigInitInternal(a, b, c, N)
    }
    var S = {
        PSNR: Arr(4, float),
        coded_size: int,
        block_count: Arr(3, int),
        header_bytes: Arr(2, int),
        residual_bytes: ArrM(new Array(3, 4), int),
        segment_size: Arr(4, int),
        segment_quant: Arr(4, int),
        segment_level: Arr(4, int),
        alpha_data_size: int,
        layer_data_size: int
    };
    var T = 0,
        WEBP_YUV422 = 1,
        WEBP_YUV444 = 2,
        WEBP_YUV400 = 3,
        WEBP_CSP_UV_MASK = 3,
        WEBP_YUV420A = 4,
        WEBP_YUV422A = 5,
        WEBP_YUV444A = 6,
        WEBP_YUV400A = 7,
        WEBP_CSP_ALPHA_BIT = 4;
    var U = 0,
        VP8_ENC_ERROR_OUT_OF_MEMORY = 1,
        VP8_ENC_ERROR_BITSTREAM_OUT_OF_MEMORY = 2,
        VP8_ENC_ERROR_NULL_PARAMETER = 3,
        VP8_ENC_ERROR_INVALID_CONFIGURATION = 4,
        VP8_ENC_ERROR_BAD_DIMENSION = 5,
        VP8_ENC_ERROR_PARTITION0_OVERFLOW = 6,
        VP8_ENC_ERROR_PARTITION_OVERFLOW = 7,
        VP8_ENC_ERROR_BAD_WRITE = 8;
    var V = {
        colorspace: 'WebPEncCSP',
        width: int,
        height: int,
        y: uint8_t,
        u: uint8_t,
        v: uint8_t,
        y_off: 0,
        u_off: 0,
        v_off: 0,
        y_stride: int,
        uv_stride: int,
        a: uint8_t,
        a_off: 0,
        a_stride: int,
        writer: function WebPWriterFunction() {},
        custom_ptr: void_,
        extra_info_type: int,
        extra_info: uint8_t,
        stats: newObjectIt(S),
        stats_nozero: 1,
        u0: uint8_t,
        v0: uint8_t,
        u0_off: 0,
        v0_off: 0,
        uv0_stride: int,
        error_code: 'WebPEncodingError'
    };

    function WebPPictureInit(a) {
        return WebPPictureInitInternal(a, N)
    }
    var Y = {
        range_: int32_t,
        value_: int32_t,
        run_: int,
        nb_bits_: int,
        buf_: uint8_t,
        buf_off: 0,
        pos_: size_t,
        max_pos_: size_t,
        error_: int
    };

    function VP8BitWriterPos(a) {
        return (a.pos_ + a.run_) * 8 + 8 + a.nb_bits_
    }

    function VP8BitWriterBuf(a) {
        return a.buf_
    }

    function VP8BitWriterSize(a) {
        return a.pos_
    }
    var Z = 0;
    var ba = 1;
    var bb = 2;
    var bc = 64;
    var bd = 0,
        B_TM_PRED = 1,
        B_VE_PRED = 2,
        B_HE_PRED = 3,
        B_RD_PRED = 4,
        B_VR_PRED = 5,
        B_LD_PRED = 6,
        B_VL_PRED = 7,
        B_HD_PRED = 8,
        B_HU_PRED = 9,
        NUM_BMODES = (B_HU_PRED + 1 - bd),
        DC_PRED = bd,
        V_PRED = B_VE_PRED,
        H_PRED = B_HE_PRED,
        TM_PRED = B_TM_PRED;
    var be = 4,
        MAX_NUM_PARTITIONS = 8,
        NUM_TYPES = 4,
        NUM_BANDS = 8,
        NUM_CTX = 3,
        NUM_PROBAS = 11,
        MAX_LF_LEVELS = 64,
        MAX_VARIABLE_LEVEL = 67;
    var bf = 16;
    var bg = (bf * 16);
    var bh = (bf * 8);
    var bi = (bg + bh);
    var bj = (6 * 16 * bf + 12 * bf);
    var bk = (0);
    var bl = (bg);
    var bm = (bl + 8);
    var bn = 15;
    var bo = (0 * 16 * bf);
    var bp = (1 * 16 * bf);
    var bq = (2 * 16 * bf);
    var br = (3 * 16 * bf);
    var bs = (4 * 16 * bf);
    var bt = (4 * 16 * bf + 8 * bf);
    var bu = (5 * 16 * bf);
    var bv = (5 * 16 * bf + 8 * bf);
    var bw = (6 * 16 * bf + 0);
    var bx = (6 * 16 * bf + 4);
    var by = (6 * 16 * bf + 8);
    var bz = (6 * 16 * bf + 12);
    var bA = (6 * 16 * bf + 4 * bf + 0);
    var bB = (6 * 16 * bf + 4 * bf + 4);
    var bC = (6 * 16 * bf + 4 * bf + 8);
    var bD = (6 * 16 * bf + 4 * bf + 12);
    var bE = (6 * 16 * bf + 8 * bf + 0);
    var bF = (6 * 16 * bf + 8 * bf + 4);
    var bG = (6 * 16 * bf + 8 * bf + 8);
    var bH = 0x7fffffffffffff;
    var bI = 17;

    function BIAS(b) {
        return ((b) << (bI - 8))
    }

    function QUANTDIV(n, a, B) {
        return ((n * a + B) >> bI)
    }
    var bJ = ArrM(new Array(NUM_CTX, NUM_PROBAS), uint8_t);
    var bK = ArrM(new Array(NUM_CTX, NUM_PROBAS, 2), uint64_t);
    var bL = ArrM(new Array(NUM_CTX, (MAX_VARIABLE_LEVEL + 1)), uint16_t);
    var bM = ArrM(new Array(be, MAX_LF_LEVELS), double);
    var bN = {
        num_segments_: int,
        update_map_: int,
        size_: int
    };
    var bO = {
        segments_: Arr(3, uint8_t),
        skip_proba_: uint8_t,
        coeffs_: ArrM(new Array(NUM_TYPES, NUM_BANDS), bJ),
        stats_: ArrM(new Array(NUM_TYPES, NUM_BANDS), bK),
        level_cost_: ArrM(new Array(NUM_TYPES, NUM_BANDS), bL),
        use_skip_proba_: int,
        nb_skip_: int
    };
    var bP = {
        simple_: int,
        level_: int,
        sharpness_: int,
        i4x4_lf_delta_: int
    };
    var bQ = {
        type_: 0,
        uv_mode_: 0,
        skip_: 0,
        segment_: 0,
        alpha_: uint8_t
    };
    var bR = {
        q_: Arr(16, uint16_t),
        iq_: Arr(16, uint16_t),
        bias_: Arr(16, uint16_t),
        zthresh_: Arr(16, uint16_t),
        sharpen_: Arr(16, uint16_t)
    };
    var bS = {
        y1_: newObjectIt(bR),
        y2_: newObjectIt(bR),
        uv_: newObjectIt(bR),
        alpha_: int,
        beta_: int,
        quant_: int,
        fstrength_: int,
        lambda_i16_: int,
        lambda_i4_: int,
        lambda_uv_: int,
        lambda_mode_: int,
        lambda_trellis_: int,
        tlambda_: int,
        lambda_trellis_i16_: int,
        lambda_trellis_i4_: int,
        lambda_trellis_uv_: int
    };
    var bT = {
        config_: newObjectIt(O),
        pic_: newObjectIt(V),
        filter_hdr_: newObjectIt(bP),
        segment_hdr_: newObjectIt(bN),
        profile_: int,
        mb_w_: int,
        mb_h_: int,
        preds_w_: int,
        num_parts_: int,
        bw_: newObjectIt(Y),
        parts_: Arr_nOI(MAX_NUM_PARTITIONS, Y),
        has_alpha_: int,
        alpha_data_: uint8_t,
        alpha_data_off: 0,
        alpha_data_size_: size_t,
        use_layer_: int,
        layer_bw_: Y,
        layer_data_: uint8_t,
        layer_data_off: 0,
        layer_data_size_: size_t,
        dqm_: Arr_nOI(be, bS),
        base_quant_: int,
        uv_alpha_: int,
        dq_y1_dc_: int,
        dq_y2_dc_: int,
        dq_y2_ac_: int,
        dq_uv_dc_: int,
        dq_uv_ac_: int,
        proba_: newObjectIt(bO),
        proba_off: 0,
        sse_: Arr(3, uint64_t),
        sse_count_: uint64_t,
        coded_size_: int,
        residual_bytes_: ArrM(new Array(3, 4), int),
        block_count_: Arr(3, int),
        method_: int,
        rd_opt_level_: int,
        max_i4_header_bits_: int,
        mb_info_: newObjectIt(bQ),
        mb_info_off: 0,
        preds_: uint8_t,
        preds_off: 0,
        nz_: uint32_t,
        nz_off: 0,
        yuv_in_: uint8_t,
        yuv_in_off: 0,
        yuv_out_: uint8_t,
        yuv_out_off: 0,
        yuv_out2_: uint8_t,
        yuv_out2_off: 0,
        yuv_p_: uint8_t,
        yuv_p_off: 0,
        y_top_: uint8_t,
        y_top_off: 0,
        uv_top_: uint8_t,
        uv_top_off: 0,
        y_left_: uint8_t,
        y_left_off: 0,
        u_left_: uint8_t,
        u_left_off: 0,
        v_left_: uint8_t,
        v_left_off: 0,
        lf_stats_: newObjectIt(bM)
    };
    var bU = {
        D: score_t,
        SD: score_t,
        R: score_t,
        score: score_t,
        y_dc_levels: Arr(16, int16_t),
        y_ac_levels: ArrM(new Array(16, 16), int16_t),
        uv_levels: ArrM(new Array(4 + 4, 16), int16_t),
        mode_i16: int,
        modes_i4: Arr(16, int),
        mode_uv: int,
        nz: uint32_t
    };
    var bV = {
        x_: int,
        y_: int,
        y_offset_: int,
        uv_offset_: int,
        y_stride_: int,
        uv_stride_: int,
        yuv_in_: uint8_t,
        yuv_in_off: 0,
        yuv_out_: uint8_t,
        yuv_out_off: 0,
        yuv_out2_: uint8_t,
        yuv_out2_off: 0,
        yuv_p_: uint8_t,
        yuv_p_off: 0,
        enc_: newObjectIt(bT),
        mb_: newObjectIt(bQ),
        mb_off: 0,
        bw_: newObjectIt(Y),
        preds_: uint8_t,
        preds_off: 0,
        nz_: uint32_t,
        nz_off: 0,
        i4_boundary_: Arr(37, uint8_t),
        i4_boundary_off: 0,
        i4_top_: uint8_t,
        i4_top_off: 0,
        i4_: int,
        top_nz_: Arr(9, int),
        left_nz_: Arr(9, int),
        bit_count_: ArrM(Array(4, 3), uint64_t),
        luma_bits_: uint64_t,
        uv_bits_: uint64_t,
        lf_stats_: newObjectIt(bM),
        do_trellis_: int,
        done_: int
    };
    var bW = 8192;

    function CompressAlpha(a, b, c, d, e, f) {
        var g = WebPZlib.compress(a.slice(b, b + c), (f ? 3 : 6));
        d.val = g;
        e.val = g.length;
        return 1
    }

    function VP8EncInitAlpha(a) {
        a.has_alpha_ = (a.pic_.a != null) + 0;
        a.alpha_data_ = null;
        a.alpha_data_size_ = 0
    }

    function VP8EncCodeAlphaBlock(a) {}

    function VP8EncFinishAlpha(a) {
        if (a.has_alpha_) {
            var b = a.pic_;
            assert(b.a);
            a.alpha_data_ = {
                val: a.alpha_data_
            };
            a.alpha_data_size_ = {
                val: a.alpha_data_size
            };
            if (!CompressAlpha(b.a, 0, b.width * b.height, a.alpha_data_, a.alpha_data_size_, a.config_.alpha_compression)) {
                return 0
            }
            a.alpha_data_ = a.alpha_data_.val;
            a.alpha_data_size_ = a.alpha_data_size_.val
        }
        return 1
    }

    function VP8EncDeleteAlpha(a) {
        a.alpha_data_ = '';
        a.alpha_data_ = null;
        a.alpha_data_size_ = 0;
        a.has_alpha_ = 0
    }

    function VP8EncInitLayer(a) {
        a.use_layer_ = (a.pic_.u0 != null) + 0;
        a.layer_data_size_ = 0;
        a.layer_data_ = null;
        if (a.use_layer_) {
            VP8BitWriterInit(a.layer_bw_, a.mb_w_ * a.mb_h_ * 3)
        }
    }

    function VP8EncCodeLayerBlock(a) {}

    function VP8EncFinishLayer(a) {
        if (a.use_layer_) {
            a.layer_data_ = VP8BitWriterFinish(a.layer_bw_);
            a.layer_data_size_ = VP8BitWriterSize(a.layer_bw_)
        }
        return 1
    }

    function VP8EncDeleteLayer(a) {
        a.layer_data_ = ''
    }
    var bX = 0x9d012a;
    var bY = 10;
    var bZ = 20;
    var ca = (bZ - 8);
    var cb = (1 << 19);
    var cc = (1 << 24);

    function PutLE32(a, b, c) {
        a[b + 0] = (c >> 0) & 0xff;
        a[b + 1] = (c >> 8) & 0xff;
        a[b + 2] = (c >> 16) & 0xff;
        a[b + 3] = (c >> 24) & 0xff
    }

    function PutHeader(a, b, c, d) {
        var e = Arr(bY, uint8_t);
        var f = new Array('R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P', 'V', 'P', '8', ' ');
        var g = uint32_t;
        if (b >= cb) {
            return WebPEncodingSetError(d, VP8_ENC_ERROR_PARTITION0_OVERFLOW)
        }
        for (var i = 0; i < f.length; ++i) {
            f[i] = f[i] != '0' ? String(f[i]).charCodeAt(0) : 0
        }
        PutLE32(f, +4, c + ca);
        PutLE32(f, +16, c);
        if (!d.writer(f, sizeof(f) * f.length, d)) {
            return WebPEncodingSetError(d, VP8_ENC_ERROR_BAD_WRITE)
        }
        g = 0 | (a << 1) | (1 << 4) | (b << 5);
        e[0] = g & 0xff;
        e[1] = (g >> 8) & 0xff;
        e[2] = (g >> 16) & 0xff;
        e[3] = (bX >> 16) & 0xff;
        e[4] = (bX >> 8) & 0xff;
        e[5] = (bX >> 0) & 0xff;
        e[6] = d.width & 0xff;
        e[7] = d.width >> 8;
        e[8] = d.height & 0xff;
        e[9] = d.height >> 8;
        return d.writer(e, sizeof(e) * e.length, d)
    }

    function PutSegmentHeader(a, b) {
        var c = b.segment_hdr_;
        var d = b.proba_;
        if (VP8PutBitUniform(a, (c.num_segments_ > 1))) {
            var e = 1;
            var s;
            VP8PutBitUniform(a, c.update_map_);
            if (VP8PutBitUniform(a, e)) {
                VP8PutBitUniform(a, 1);
                for (s = 0; s < be; ++s) {
                    VP8PutSignedValue(a, b.dqm_[s].quant_, 7)
                }
                for (s = 0; s < be; ++s) {
                    VP8PutSignedValue(a, b.dqm_[s].fstrength_, 6)
                }
            }
            if (c.update_map_) {
                for (s = 0; s < 3; ++s) {
                    if (VP8PutBitUniform(a, (d.segments_[s] != 255))) {
                        VP8PutValue(a, d.segments_[s], 8)
                    }
                }
            }
        }
    }

    function PutFilterHeader(a, b) {
        var c = (b.i4x4_lf_delta_ != 0) + 0;
        VP8PutBitUniform(a, b.simple_);
        VP8PutValue(a, b.level_, 6);
        VP8PutValue(a, b.sharpness_, 3);
        if (VP8PutBitUniform(a, c)) {
            var d = (b.i4x4_lf_delta_ != 0);
            if (VP8PutBitUniform(a, d)) {
                VP8PutValue(a, 0, 4);
                VP8PutSignedValue(a, b.i4x4_lf_delta_, 6);
                VP8PutValue(a, 0, 3)
            }
        }
    }

    function PutQuant(a, b) {
        VP8PutValue(a, b.base_quant_, 7);
        VP8PutSignedValue(a, b.dq_y1_dc_, 4);
        VP8PutSignedValue(a, b.dq_y2_dc_, 4);
        VP8PutSignedValue(a, b.dq_y2_ac_, 4);
        VP8PutSignedValue(a, b.dq_uv_dc_, 4);
        VP8PutSignedValue(a, b.dq_uv_ac_, 4)
    }

    function EmitPartitionsSize(a, b) {
        var c = Arr(3 * (MAX_NUM_PARTITIONS - 1), uint8_t);
        var p;
        for (p = 0; p < a.num_parts_ - 1; ++p) {
            var d = VP8BitWriterSize(a.parts_[p]);
            if (d >= cc) {
                return WebPEncodingSetError(b, VP8_ENC_ERROR_PARTITION_OVERFLOW)
            }
            c[3 * p + 0] = (d >> 0) & 0xff;
            c[3 * p + 1] = (d >> 8) & 0xff;
            c[3 * p + 2] = (d >> 16) & 0xff
        }
        return p ? b.writer(c, 3 * p, b) : 1
    }
    var cd = 8;

    function PutLE24(a, b, c) {
        a[b + 0] = (c >> 0) & 0xff;
        a[b + 1] = (c >> 8) & 0xff;
        a[b + 2] = (c >> 16) & 0xff
    }

    function WriteExtensions(a) {
        var b = Arr(cd, uint8_t);
        var c = a.bw_;
        var d = a.pic_;
        PutLE24(b, +0, a.layer_data_size_);
        b[3] = a.pic_.colorspace & WEBP_CSP_UV_MASK;
        if (a.layer_data_size_ > 0) {
            assert(a.use_layer_);
            if (!VP8BitWriterAppend(a.parts_[a.num_parts_ - 1], a.layer_data_, a.layer_data_off, a.layer_data_size_)) {
                return WebPEncodingSetError(d, VP8_ENC_ERROR_BITSTREAM_OUT_OF_MEMORY)
            }
        }
        PutLE24(b, +4, a.alpha_data_size_);
        if (a.alpha_data_size_ > 0) {
            assert(a.has_alpha_);
            if (!VP8BitWriterAppend(c, a.alpha_data_, a.alpha_data_off, a.alpha_data_size_)) {
                return WebPEncodingSetError(d, VP8_ENC_ERROR_BITSTREAM_OUT_OF_MEMORY)
            }
        }
        b[cd - 1] = 0x01;
        if (!VP8BitWriterAppend(c, b, 0, cd)) {
            return WebPEncodingSetError(d, VP8_ENC_ERROR_BITSTREAM_OUT_OF_MEMORY)
        }
        return 1
    }

    function GeneratePartition0(a) {
        var b = a.bw_;
        var c = a.mb_w_ * a.mb_h_;
        var d = uint64_t,
            pos2 = uint64_t,
            pos3 = uint64_t;
        var e = a.has_alpha_ || a.use_layer_;
        d = VP8BitWriterPos(b);
        VP8BitWriterInit(b, parseInt(c * 7 / 8));
        VP8PutBitUniform(b, e);
        VP8PutBitUniform(b, 0);
        PutSegmentHeader(b, a);
        PutFilterHeader(b, a.filter_hdr_);
        VP8PutValue(b, a.config_.partitions, 2);
        PutQuant(b, a);
        VP8PutBitUniform(b, 0);
        VP8WriteProbas(b, a.proba_);
        pos2 = VP8BitWriterPos(b);
        VP8CodeIntraModes(a);
        VP8BitWriterFinish(b);
        if (e && !WriteExtensions(a)) {
            return 0
        }
        pos3 = VP8BitWriterPos(b);
        if (a.pic_.stats_nozero) {
            a.pic_.stats.header_bytes[0] = parseInt((pos2 - d + 7) >> 3);
            a.pic_.stats.header_bytes[1] = parseInt((pos3 - pos2 + 7) >> 3);
            a.pic_.stats.alpha_data_size = a.alpha_data_size_;
            a.pic_.stats.layer_data_size = a.layer_data_size_
        }
        return !b.error_
    }

    function VP8EncWrite(a) {
        var b = a.pic_;
        var c = a.bw_;
        var d = 0;
        var e = size_t,
            pad = size_t;
        var p;
        d = GeneratePartition0(a);
        e = bY + VP8BitWriterSize(c) + 3 * (a.num_parts_ - 1);
        for (p = 0; p < a.num_parts_; ++p) {
            e += VP8BitWriterSize(a.parts_[p])
        }
        pad = e & 1;
        e += pad; {
            var f = VP8BitWriterBuf(c);
            var g = VP8BitWriterSize(c);
            d = d && PutHeader(a.profile_, g, e, b) && b.writer(f, g, b) && EmitPartitionsSize(a, b);
            f = ''
        }
        for (p = 0; p < a.num_parts_; ++p) {
            var h = VP8BitWriterBuf(a.parts_[p]);
            var i = VP8BitWriterSize(a.parts_[p]);
            if (i) d = d && b.writer(h, i, b);
            h = ''
        }
        if (d && pad) {
            var j = new Array(0);
            d = b.writer(j, 1, b)
        }
        a.coded_size_ = e + bZ;
        return d
    }
    var ce = Arr(255 + 255 + 1, uint8_t);
    var cf = Arr(255 + 255 + 1, uint8_t);
    var cg = Arr(1020 + 1020 + 1, int8_t);
    var ci = Arr(112 + 112 + 1, int8_t);
    var cj = Arr(255 + 510 + 1, uint8_t);
    var ck = 0;

    function InitTables(a) {
        if (!ck) {
            var i;
            for (i = -255; i <= 255; ++i) {
                ce[255 + i] = (i < 0) ? -i : i;
                cf[255 + i] = ce[255 + i] >> 1
            }
            for (i = -1020; i <= 1020; ++i) {
                cg[1020 + i] = (i < -128) ? -128 : (i > 127) ? 127 : i
            }
            for (i = -112; i <= 112; ++i) {
                ci[112 + i] = (i < -16) ? -16 : (i > 15) ? 15 : i
            }
            for (i = -255; i <= 255 + 255; ++i) {
                cj[255 + i] = (i < 0) ? 0 : (i > 255) ? 255 : i
            }
            ck = 1
        }
    }

    function do_filter2(p, b, c) {
        var d = p[b - 2 * c],
            p0 = p[b - c],
            q0 = p[b + 0],
            q1 = p[b + c];
        var a = 3 * (q0 - p0) + cg[1020 + d - q1];
        var e = ci[112 + ((a + 4) >> 3)];
        var f = ci[112 + ((a + 3) >> 3)];
        p[b - c] = cj[255 + p0 + f];
        p[b + 0] = cj[255 + q0 - e]
    }

    function do_filter4(p, b, c) {
        var d = p[b - 2 * c],
            p0 = p[b - c],
            q0 = p[b + 0],
            q1 = p[b + c];
        var a = 3 * (q0 - p0);
        var e = ci[112 + ((a + 4) >> 3)];
        var f = ci[112 + ((a + 3) >> 3)];
        var g = (e + 1) >> 1;
        p[b - 2 * c] = cj[255 + d + g];
        p[b - c] = cj[255 + p0 + f];
        p[b + 0] = cj[255 + q0 - e];
        p[b + c] = cj[255 + q1 - g]
    }

    function hev(p, a, b, c) {
        var d = p[a - 2 * b],
            p0 = p[a - b],
            q0 = p[a + 0],
            q1 = p[a + b];
        return (ce[255 + d - p0] > c) || (ce[255 + q1 - q0] > c)
    }

    function needs_filter(p, a, b, c) {
        var d = p[a - 2 * b],
            p0 = p[a - b],
            q0 = p[a + 0],
            q1 = p[a + b];
        return (2 * ce[255 + p0 - q0] + cf[255 + d - q1]) <= c
    }

    function needs_filter2(p, a, b, t, c) {
        var d = p[a - 4 * b],
            p2 = p[a - 3 * b],
            p1 = p[a - 2 * b],
            p0 = p[a - b];
        var e = p[a + 0],
            q1 = p[a + b],
            q2 = p[a + 2 * b],
            q3 = p[a + 3 * b];
        if ((2 * ce[255 + p0 - e] + cf[255 + p1 - q1]) > t) return 0;
        return ce[255 + d - p2] <= c && ce[255 + p2 - p1] <= c && ce[255 + p1 - p0] <= c && ce[255 + q3 - q2] <= c && ce[255 + q2 - q1] <= c && ce[255 + q1 - e] <= c
    }

    function SimpleVFilter16(p, a, b, c) {
        var i;
        for (i = 0; i < 16; ++i) {
            if (needs_filter(p, a + i, b, c)) {
                do_filter2(p, a + i, b)
            }
        }
    }

    function SimpleHFilter16(p, a, b, c) {
        var i;
        for (i = 0; i < 16; ++i) {
            if (needs_filter(p, a + i * b, 1, c)) {
                do_filter2(p, a + i * b, 1)
            }
        }
    }

    function SimpleVFilter16i(p, a, b, c) {
        var k;
        for (k = 3; k > 0; --k) {
            a += 4 * b;
            SimpleVFilter16(p, a, b, c)
        }
    }

    function SimpleHFilter16i(p, a, b, c) {
        var k;
        for (k = 3; k > 0; --k) {
            a += 4;
            SimpleHFilter16(p, a, b, c)
        }
    }

    function FilterLoop24(p, a, b, c, d, e, f, g) {
        while (d-- > 0) {
            if (needs_filter2(p, a, b, e, f)) {
                if (hev(p, a, b, g)) {
                    do_filter2(p, a, b)
                } else {
                    do_filter4(p, a, b)
                }
            }
            a += c
        }
    }

    function VFilter16i(p, a, b, c, d, e) {
        var k;
        for (k = 3; k > 0; --k) {
            a += 4 * b;
            FilterLoop24(p, a, b, 1, 16, c, d, e)
        }
    }

    function HFilter16i(p, a, b, c, d, e) {
        var k;
        for (k = 3; k > 0; --k) {
            a += 4;
            FilterLoop24(p, a, 1, b, 16, c, d, e)
        }
    }

    function VFilter8i(u, a, v, b, c, d, e, f) {
        FilterLoop24(u, a + 4 * c, c, 1, 8, d, e, f);
        FilterLoop24(v, b + 4 * c, c, 1, 8, d, e, f)
    }

    function HFilter8i(u, a, v, b, c, d, e, f) {
        FilterLoop24(u, a + 4, 1, c, 8, d, e, f);
        FilterLoop24(v, b + 4, 1, c, 8, d, e, f)
    }

    function VP8EncVFilter16i(p, a, b, c, d, e) {
        VFilter16i(p, a, b, c, d, e)
    };

    function VP8EncHFilter16i(p, a, b, c, d, e) {
        HFilter16i(p, a, b, c, d, e)
    };

    function VP8EncVFilter8i(u, a, v, b, c, d, e, f) {
        VFilter8i(u, a, v, b, c, d, e, f)
    };

    function VP8EncHFilter8i(u, a, v, b, c, d, e, f) {
        HFilter8i(u, a, v, b, c, d, e, f)
    };

    function VP8EncSimpleVFilter16i(p, a, b, c) {
        SimpleVFilter16i(p, a, b, c)
    };

    function VP8EncSimpleHFilter16i(p, a, b, c) {
        SimpleHFilter16i(p, a, b, c)
    };

    function GetILevel(a, b) {
        if (a > 0) {
            if (a > 4) {
                b >>= 2
            } else {
                b >>= 1
            }
            if (b > 9 - a) {
                b = 9 - a
            }
        }
        if (b < 1) b = 1;
        return b
    }

    function DoFilter(a, b) {
        var c = a.enc_;
        var d = GetILevel(c.config_.filter_sharpness, b);
        var e = 2 * b + d;
        var f = a.yuv_out2_;
        var g = a.yuv_out2_off + bk;
        var h = a.yuv_out2_;
        var i = a.yuv_out2_off + bl;
        var j = a.yuv_out2_;
        var k = a.yuv_out2_off + bm;
        memcpy(f, g, a.yuv_out_, a.yuv_out_off, bi * sizeof(uint8_t));
        if (c.filter_hdr_.simple_ == 1) {
            VP8EncSimpleHFilter16i(f, g, bf, e);
            VP8EncSimpleVFilter16i(f, g, bf, e)
        } else {
            var l = (b >= 40) ? 2 : (b >= 15) ? 1 : 0;
            VP8EncHFilter16i(f, g, bf, e, d, l);
            VP8EncHFilter8i(h, i, j, k, bf, e, d, l);
            VP8EncVFilter16i(f, g, bf, e, d, l);
            VP8EncVFilter8i(h, i, j, k, bf, e, d, l)
        }
    }
    var cl = 3;
    var cm = {
        w: double,
        xm: double,
        ym: double,
        xxm: double,
        xym: double,
        yym: double
    };

    function Accumulate(a, b, c, d, e, f, g, h, W, H, i) {
        var j = (h - cl < 0) ? 0 : h - cl;
        var k = (h + cl > H - 1) ? H - 1 : h + cl;
        var l = (g - cl < 0) ? 0 : g - cl;
        var m = (g + cl > W - 1) ? W - 1 : g + cl;
        var x, y;
        b += j * c;
        e += j * f;
        for (y = j; y <= k; ++y, b += c, e += f) {
            for (x = l; x <= m; ++x) {
                var n = a[b + x];
                var o = d[e + x];
                i.w += 1;
                i.xm += n;
                i.ym += o;
                i.xxm += n * n;
                i.xym += n * o;
                i.yym += o * o
            }
        }
    }

    function GetSSIM(a) {
        var b = a.xm * a.xm;
        var c = a.ym * a.ym;
        var d = a.xm * a.ym;
        var e = a.w * a.w;
        var f = a.xxm * a.w - b;
        var g = a.yym * a.w - c;
        var h = a.xym * a.w - d;
        var i = double,
            C2 = double;
        var j = double;
        var k = double;
        if (f < 0.) f = 0.;
        if (g < 0.) g = 0.;
        i = 6.5025 * e;
        C2 = 58.5225 * e;
        j = (2 * d + i) * (2 * h + C2);
        k = (b + c + i) * (f + g + C2);
        return (k != 0) ? j / k : 0.
    }

    function GetMBSSIM(a, b, c, d) {
        var x, y;
        var s = {
            w: double,
            xm: double,
            ym: double,
            xxm: double,
            xym: double,
            yym: double
        };
        for (x = 3; x < 13; x++) {
            for (y = 3; y < 13; y++) {
                Accumulate(a, b + bk, bf, c, d + bk, bf, x, y, 16, 16, s)
            }
        }
        for (x = 1; x < 7; x++) {
            for (y = 1; y < 7; y++) {
                Accumulate(a, b + bl, bf, c, d + bl, bf, x, y, 8, 8, s);
                Accumulate(a, b + bm, bf, c, d + bm, bf, x, y, 8, 8, s)
            }
        }
        return GetSSIM(s)
    }

    function VP8InitFilter(a) {
        var s, i;
        if (!a.lf_stats_) return;
        InitTables();
        for (s = 0; s < be; s++) {
            for (i = 0; i < MAX_LF_LEVELS; i++) {
                a.lf_stats_[s][i] = 0
            }
        }
    }

    function VP8StoreFilterStats(a) {
        var d = int;
        var s = a.mb_[a.mb_off].segment_;
        var b = a.enc_.dqm_[s].fstrength_;
        var c = -a.enc_.dqm_[s].quant_;
        var e = a.enc_.dqm_[s].quant_;
        var f = (e - c >= 4) ? 4 : 1;
        if (!a.lf_stats_) return;
        if (a.mb_[a.mb_off].type_ == 1 && a.mb_[a.mb_off].skip_) return;
        a.lf_stats_[s][0] += GetMBSSIM(a.yuv_in_, a.yuv_in_off, a.yuv_out_, a.yuv_out_off);
        for (d = c; d <= e; d += f) {
            var g = b + d;
            if (g <= 0 || g >= MAX_LF_LEVELS) {
                continue
            }
            DoFilter(a, g);
            a.lf_stats_[s][g] += GetMBSSIM(a.yuv_in_, a.yuv_in_off, a.yuv_out2_, a.yuv_out2_off)
        }
    }

    function VP8AdjustFilterStrength(a) {
        var s;
        var b = a.enc_;
        if (!a.lf_stats_) {
            return
        }
        for (s = 0; s < be; s++) {
            var i, best_level = 0;
            var c = 1.00001 * a.lf_stats_[s][0];
            for (i = 1; i < MAX_LF_LEVELS; i++) {
                var v = a.lf_stats_[s][i];
                if (v > c) {
                    c = v;
                    best_level = i
                }
            }
            b.dqm_[s].fstrength_ = best_level
        }
    }

    function BitWriterResize(a, b) {
        var c = uint8_t;
        var d = 0;
        var e = size_t;
        var f = a.pos_ + b;
        if (f <= a.max_pos_) return 1;
        e = 2 * a.max_pos_;
        if (e < f) e = f;
        if (e < 1024) e = 1024;
        c = malloc(e, uint8_t);
        if (c == null) {
            a.error_ = 1;
            return 0
        }
        if (a.pos_ > 0) memcpy(c, d, a.buf_, a.buf_off, a.pos_);
        a.buf_ = '';
        a.buf_ = c;
        a.buf_off = d;
        a.max_pos_ = e;
        return 1
    }

    function kFlush(a) {
        var s = 8 + a.nb_bits_;
        var b = a.value_ >> s;
        assert(a.nb_bits_ >= 0);
        a.value_ -= b << s;
        a.nb_bits_ -= 8;
        if ((b & 0xff) != 0xff) {
            var c = a.pos_;
            if (c + a.run_ >= a.max_pos_) {
                if (!BitWriterResize(a, a.run_ + 1)) {
                    return
                }
            }
            if (b & 0x100) {
                if (c > 0) a.buf_[c - 1]++
            }
            if (a.run_ > 0) {
                var d = (b & 0x100) ? 0x00 : 0xff;
                for (; a.run_ > 0; --a.run_) a.buf_[c++] = d
            }
            a.buf_[c++] = (b > 255 ? b - 256 : b);
            a.pos_ = c
        } else {
            a.run_++
        }
    }
    var cn = new Array(7, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0);
    var co = new Array(127, 127, 191, 127, 159, 191, 223, 127, 143, 159, 175, 191, 207, 223, 239, 127, 135, 143, 151, 159, 167, 175, 183, 191, 199, 207, 215, 223, 231, 239, 247, 127, 131, 135, 139, 143, 147, 151, 155, 159, 163, 167, 171, 175, 179, 183, 187, 191, 195, 199, 203, 207, 211, 215, 219, 223, 227, 231, 235, 239, 243, 247, 251, 127, 129, 131, 133, 135, 137, 139, 141, 143, 145, 147, 149, 151, 153, 155, 157, 159, 161, 163, 165, 167, 169, 171, 173, 175, 177, 179, 181, 183, 185, 187, 189, 191, 193, 195, 197, 199, 201, 203, 205, 207, 209, 211, 213, 215, 217, 219, 221, 223, 225, 227, 229, 231, 233, 235, 237, 239, 241, 243, 245, 247, 249, 251, 253, 127);

    function VP8PutBit(a, b, c) {
        b = b ? 1 : 0;
        var d = (a.range_ * c) >> 8;
        if (b) {
            a.value_ += d + 1;
            a.range_ -= d + 1
        } else {
            a.range_ = d
        }
        if (a.range_ < 127) {
            var e = cn[a.range_];
            a.range_ = co[a.range_];
            a.value_ <<= e;
            a.nb_bits_ += e;
            if (a.nb_bits_ > 0) kFlush(a)
        }
        return b
    }

    function VP8PutBitUniform(a, b) {
        b = b ? 1 : 0;
        var c = a.range_ >> 1;
        if (b) {
            a.value_ += c + 1;
            a.range_ -= c + 1
        } else {
            a.range_ = c
        }
        if (a.range_ < 127) {
            a.range_ = co[a.range_];
            a.value_ <<= 1;
            a.nb_bits_ += 1;
            if (a.nb_bits_ > 0) kFlush(a)
        }
        return b
    }

    function VP8PutValue(a, b, c) {
        var d;
        for (d = 1 << (c - 1); d; d >>= 1) VP8PutBitUniform(a, b & d)
    }

    function VP8PutSignedValue(a, b, c) {
        if (!VP8PutBitUniform(a, b != 0)) return;
        if (b < 0) {
            VP8PutValue(a, ((-b) << 1) | 1, c + 1)
        } else {
            VP8PutValue(a, b << 1, c + 1)
        }
    }

    function VP8BitWriterInit(a, b) {
        a.range_ = 255 - 1;
        a.value_ = 0;
        a.run_ = 0;
        a.nb_bits_ = -8;
        a.pos_ = 0;
        a.max_pos_ = 0;
        a.error_ = 0;
        a.buf_ = null;
        return (b > 0) ? BitWriterResize(a, b) : 1
    }

    function VP8BitWriterFinish(a) {
        VP8PutValue(a, 0, 9 - a.nb_bits_);
        a.nb_bits_ = 0;
        kFlush(a);
        return a.buf_
    }

    function VP8BitWriterAppend(a, b, c, d) {
        assert(b);
        if (a.nb_bits_ != -8) return 0;
        if (!BitWriterResize(a, d)) return 0;
        memcpy(a.buf_, a.buf_off + a.pos_, b, c, d);
        a.pos_ += d;
        return 1
    }

    function VP8BitCost(a, b) {
        return !a ? cp[b] : cp[255 - b]
    }

    function VP8BranchCost(a, b, c) {
        return a * VP8BitCost(1, c) + (b - a) * VP8BitCost(0, c)
    }

    function VP8LevelCost(a, b) {
        return cr[b] + a[b > MAX_VARIABLE_LEVEL ? MAX_VARIABLE_LEVEL : b]
    }
    var cp = new Array(1792, 1792, 1792, 1536, 1536, 1408, 1366, 1280, 1280, 1216, 1178, 1152, 1110, 1076, 1061, 1024, 1024, 992, 968, 951, 939, 911, 896, 878, 871, 854, 838, 820, 811, 794, 786, 768, 768, 752, 740, 732, 720, 709, 704, 690, 683, 672, 666, 655, 647, 640, 631, 622, 615, 607, 598, 592, 586, 576, 572, 564, 559, 555, 547, 541, 534, 528, 522, 512, 512, 504, 500, 494, 488, 483, 477, 473, 467, 461, 458, 452, 448, 443, 438, 434, 427, 424, 419, 415, 410, 406, 403, 399, 394, 390, 384, 384, 377, 374, 370, 366, 362, 359, 355, 351, 347, 342, 342, 336, 333, 330, 326, 323, 320, 316, 312, 308, 305, 302, 299, 296, 293, 288, 287, 283, 280, 277, 274, 272, 268, 266, 262, 256, 256, 256, 251, 248, 245, 242, 240, 237, 234, 232, 228, 226, 223, 221, 218, 216, 214, 211, 208, 205, 203, 201, 198, 196, 192, 191, 188, 187, 183, 181, 179, 176, 175, 171, 171, 168, 165, 163, 160, 159, 156, 154, 152, 150, 148, 146, 144, 142, 139, 138, 135, 133, 131, 128, 128, 125, 123, 121, 119, 117, 115, 113, 111, 110, 107, 105, 103, 102, 100, 98, 96, 94, 92, 91, 89, 86, 86, 83, 82, 80, 77, 76, 74, 73, 71, 69, 67, 66, 64, 63, 61, 59, 57, 55, 54, 52, 51, 49, 47, 46, 44, 43, 41, 40, 38, 36, 35, 33, 32, 30, 29, 27, 25, 24, 22, 21, 19, 18, 16, 15, 13, 12, 10, 9, 7, 6, 4, 3);
    var cq = new Array(new Array(0x001, 0x000), new Array(0x007, 0x001), new Array(0x00f, 0x005), new Array(0x00f, 0x00d), new Array(0x033, 0x003), new Array(0x033, 0x003), new Array(0x033, 0x023), new Array(0x033, 0x023), new Array(0x033, 0x023), new Array(0x033, 0x023), new Array(0x0d3, 0x013), new Array(0x0d3, 0x013), new Array(0x0d3, 0x013), new Array(0x0d3, 0x013), new Array(0x0d3, 0x013), new Array(0x0d3, 0x013), new Array(0x0d3, 0x013), new Array(0x0d3, 0x013), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x0d3, 0x093), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x053), new Array(0x153, 0x153));
    var cr = new Array(0, 256, 256, 256, 256, 432, 618, 630, 731, 640, 640, 828, 901, 948, 1021, 1101, 1174, 1221, 1294, 1042, 1085, 1115, 1158, 1202, 1245, 1275, 1318, 1337, 1380, 1410, 1453, 1497, 1540, 1570, 1613, 1280, 1295, 1317, 1332, 1358, 1373, 1395, 1410, 1454, 1469, 1491, 1506, 1532, 1547, 1569, 1584, 1601, 1616, 1638, 1653, 1679, 1694, 1716, 1731, 1775, 1790, 1812, 1827, 1853, 1868, 1890, 1905, 1727, 1733, 1742, 1748, 1759, 1765, 1774, 1780, 1800, 1806, 1815, 1821, 1832, 1838, 1847, 1853, 1878, 1884, 1893, 1899, 1910, 1916, 1925, 1931, 1951, 1957, 1966, 1972, 1983, 1989, 1998, 2004, 2027, 2033, 2042, 2048, 2059, 2065, 2074, 2080, 2100, 2106, 2115, 2121, 2132, 2138, 2147, 2153, 2178, 2184, 2193, 2199, 2210, 2216, 2225, 2231, 2251, 2257, 2266, 2272, 2283, 2289, 2298, 2304, 2168, 2174, 2183, 2189, 2200, 2206, 2215, 2221, 2241, 2247, 2256, 2262, 2273, 2279, 2288, 2294, 2319, 2325, 2334, 2340, 2351, 2357, 2366, 2372, 2392, 2398, 2407, 2413, 2424, 2430, 2439, 2445, 2468, 2474, 2483, 2489, 2500, 2506, 2515, 2521, 2541, 2547, 2556, 2562, 2573, 2579, 2588, 2594, 2619, 2625, 2634, 2640, 2651, 2657, 2666, 2672, 2692, 2698, 2707, 2713, 2724, 2730, 2739, 2745, 2540, 2546, 2555, 2561, 2572, 2578, 2587, 2593, 2613, 2619, 2628, 2634, 2645, 2651, 2660, 2666, 2691, 2697, 2706, 2712, 2723, 2729, 2738, 2744, 2764, 2770, 2779, 2785, 2796, 2802, 2811, 2817, 2840, 2846, 2855, 2861, 2872, 2878, 2887, 2893, 2913, 2919, 2928, 2934, 2945, 2951, 2960, 2966, 2991, 2997, 3006, 3012, 3023, 3029, 3038, 3044, 3064, 3070, 3079, 3085, 3096, 3102, 3111, 3117, 2981, 2987, 2996, 3002, 3013, 3019, 3028, 3034, 3054, 3060, 3069, 3075, 3086, 3092, 3101, 3107, 3132, 3138, 3147, 3153, 3164, 3170, 3179, 3185, 3205, 3211, 3220, 3226, 3237, 3243, 3252, 3258, 3281, 3287, 3296, 3302, 3313, 3319, 3328, 3334, 3354, 3360, 3369, 3375, 3386, 3392, 3401, 3407, 3432, 3438, 3447, 3453, 3464, 3470, 3479, 3485, 3505, 3511, 3520, 3526, 3537, 3543, 3552, 3558, 2816, 2822, 2831, 2837, 2848, 2854, 2863, 2869, 2889, 2895, 2904, 2910, 2921, 2927, 2936, 2942, 2967, 2973, 2982, 2988, 2999, 3005, 3014, 3020, 3040, 3046, 3055, 3061, 3072, 3078, 3087, 3093, 3116, 3122, 3131, 3137, 3148, 3154, 3163, 3169, 3189, 3195, 3204, 3210, 3221, 3227, 3236, 3242, 3267, 3273, 3282, 3288, 3299, 3305, 3314, 3320, 3340, 3346, 3355, 3361, 3372, 3378, 3387, 3393, 3257, 3263, 3272, 3278, 3289, 3295, 3304, 3310, 3330, 3336, 3345, 3351, 3362, 3368, 3377, 3383, 3408, 3414, 3423, 3429, 3440, 3446, 3455, 3461, 3481, 3487, 3496, 3502, 3513, 3519, 3528, 3534, 3557, 3563, 3572, 3578, 3589, 3595, 3604, 3610, 3630, 3636, 3645, 3651, 3662, 3668, 3677, 3683, 3708, 3714, 3723, 3729, 3740, 3746, 3755, 3761, 3781, 3787, 3796, 3802, 3813, 3819, 3828, 3834, 3629, 3635, 3644, 3650, 3661, 3667, 3676, 3682, 3702, 3708, 3717, 3723, 3734, 3740, 3749, 3755, 3780, 3786, 3795, 3801, 3812, 3818, 3827, 3833, 3853, 3859, 3868, 3874, 3885, 3891, 3900, 3906, 3929, 3935, 3944, 3950, 3961, 3967, 3976, 3982, 4002, 4008, 4017, 4023, 4034, 4040, 4049, 4055, 4080, 4086, 4095, 4101, 4112, 4118, 4127, 4133, 4153, 4159, 4168, 4174, 4185, 4191, 4200, 4206, 4070, 4076, 4085, 4091, 4102, 4108, 4117, 4123, 4143, 4149, 4158, 4164, 4175, 4181, 4190, 4196, 4221, 4227, 4236, 4242, 4253, 4259, 4268, 4274, 4294, 4300, 4309, 4315, 4326, 4332, 4341, 4347, 4370, 4376, 4385, 4391, 4402, 4408, 4417, 4423, 4443, 4449, 4458, 4464, 4475, 4481, 4490, 4496, 4521, 4527, 4536, 4542, 4553, 4559, 4568, 4574, 4594, 4600, 4609, 4615, 4626, 4632, 4641, 4647, 3515, 3521, 3530, 3536, 3547, 3553, 3562, 3568, 3588, 3594, 3603, 3609, 3620, 3626, 3635, 3641, 3666, 3672, 3681, 3687, 3698, 3704, 3713, 3719, 3739, 3745, 3754, 3760, 3771, 3777, 3786, 3792, 3815, 3821, 3830, 3836, 3847, 3853, 3862, 3868, 3888, 3894, 3903, 3909, 3920, 3926, 3935, 3941, 3966, 3972, 3981, 3987, 3998, 4004, 4013, 4019, 4039, 4045, 4054, 4060, 4071, 4077, 4086, 4092, 3956, 3962, 3971, 3977, 3988, 3994, 4003, 4009, 4029, 4035, 4044, 4050, 4061, 4067, 4076, 4082, 4107, 4113, 4122, 4128, 4139, 4145, 4154, 4160, 4180, 4186, 4195, 4201, 4212, 4218, 4227, 4233, 4256, 4262, 4271, 4277, 4288, 4294, 4303, 4309, 4329, 4335, 4344, 4350, 4361, 4367, 4376, 4382, 4407, 4413, 4422, 4428, 4439, 4445, 4454, 4460, 4480, 4486, 4495, 4501, 4512, 4518, 4527, 4533, 4328, 4334, 4343, 4349, 4360, 4366, 4375, 4381, 4401, 4407, 4416, 4422, 4433, 4439, 4448, 4454, 4479, 4485, 4494, 4500, 4511, 4517, 4526, 4532, 4552, 4558, 4567, 4573, 4584, 4590, 4599, 4605, 4628, 4634, 4643, 4649, 4660, 4666, 4675, 4681, 4701, 4707, 4716, 4722, 4733, 4739, 4748, 4754, 4779, 4785, 4794, 4800, 4811, 4817, 4826, 4832, 4852, 4858, 4867, 4873, 4884, 4890, 4899, 4905, 4769, 4775, 4784, 4790, 4801, 4807, 4816, 4822, 4842, 4848, 4857, 4863, 4874, 4880, 4889, 4895, 4920, 4926, 4935, 4941, 4952, 4958, 4967, 4973, 4993, 4999, 5008, 5014, 5025, 5031, 5040, 5046, 5069, 5075, 5084, 5090, 5101, 5107, 5116, 5122, 5142, 5148, 5157, 5163, 5174, 5180, 5189, 5195, 5220, 5226, 5235, 5241, 5252, 5258, 5267, 5273, 5293, 5299, 5308, 5314, 5325, 5331, 5340, 5346, 4604, 4610, 4619, 4625, 4636, 4642, 4651, 4657, 4677, 4683, 4692, 4698, 4709, 4715, 4724, 4730, 4755, 4761, 4770, 4776, 4787, 4793, 4802, 4808, 4828, 4834, 4843, 4849, 4860, 4866, 4875, 4881, 4904, 4910, 4919, 4925, 4936, 4942, 4951, 4957, 4977, 4983, 4992, 4998, 5009, 5015, 5024, 5030, 5055, 5061, 5070, 5076, 5087, 5093, 5102, 5108, 5128, 5134, 5143, 5149, 5160, 5166, 5175, 5181, 5045, 5051, 5060, 5066, 5077, 5083, 5092, 5098, 5118, 5124, 5133, 5139, 5150, 5156, 5165, 5171, 5196, 5202, 5211, 5217, 5228, 5234, 5243, 5249, 5269, 5275, 5284, 5290, 5301, 5307, 5316, 5322, 5345, 5351, 5360, 5366, 5377, 5383, 5392, 5398, 5418, 5424, 5433, 5439, 5450, 5456, 5465, 5471, 5496, 5502, 5511, 5517, 5528, 5534, 5543, 5549, 5569, 5575, 5584, 5590, 5601, 5607, 5616, 5622, 5417, 5423, 5432, 5438, 5449, 5455, 5464, 5470, 5490, 5496, 5505, 5511, 5522, 5528, 5537, 5543, 5568, 5574, 5583, 5589, 5600, 5606, 5615, 5621, 5641, 5647, 5656, 5662, 5673, 5679, 5688, 5694, 5717, 5723, 5732, 5738, 5749, 5755, 5764, 5770, 5790, 5796, 5805, 5811, 5822, 5828, 5837, 5843, 5868, 5874, 5883, 5889, 5900, 5906, 5915, 5921, 5941, 5947, 5956, 5962, 5973, 5979, 5988, 5994, 5858, 5864, 5873, 5879, 5890, 5896, 5905, 5911, 5931, 5937, 5946, 5952, 5963, 5969, 5978, 5984, 6009, 6015, 6024, 6030, 6041, 6047, 6056, 6062, 6082, 6088, 6097, 6103, 6114, 6120, 6129, 6135, 6158, 6164, 6173, 6179, 6190, 6196, 6205, 6211, 6231, 6237, 6246, 6252, 6263, 6269, 6278, 6284, 6309, 6315, 6324, 6330, 6341, 6347, 6356, 6362, 6382, 6388, 6397, 6403, 6414, 6420, 6429, 6435, 3515, 3521, 3530, 3536, 3547, 3553, 3562, 3568, 3588, 3594, 3603, 3609, 3620, 3626, 3635, 3641, 3666, 3672, 3681, 3687, 3698, 3704, 3713, 3719, 3739, 3745, 3754, 3760, 3771, 3777, 3786, 3792, 3815, 3821, 3830, 3836, 3847, 3853, 3862, 3868, 3888, 3894, 3903, 3909, 3920, 3926, 3935, 3941, 3966, 3972, 3981, 3987, 3998, 4004, 4013, 4019, 4039, 4045, 4054, 4060, 4071, 4077, 4086, 4092, 3956, 3962, 3971, 3977, 3988, 3994, 4003, 4009, 4029, 4035, 4044, 4050, 4061, 4067, 4076, 4082, 4107, 4113, 4122, 4128, 4139, 4145, 4154, 4160, 4180, 4186, 4195, 4201, 4212, 4218, 4227, 4233, 4256, 4262, 4271, 4277, 4288, 4294, 4303, 4309, 4329, 4335, 4344, 4350, 4361, 4367, 4376, 4382, 4407, 4413, 4422, 4428, 4439, 4445, 4454, 4460, 4480, 4486, 4495, 4501, 4512, 4518, 4527, 4533, 4328, 4334, 4343, 4349, 4360, 4366, 4375, 4381, 4401, 4407, 4416, 4422, 4433, 4439, 4448, 4454, 4479, 4485, 4494, 4500, 4511, 4517, 4526, 4532, 4552, 4558, 4567, 4573, 4584, 4590, 4599, 4605, 4628, 4634, 4643, 4649, 4660, 4666, 4675, 4681, 4701, 4707, 4716, 4722, 4733, 4739, 4748, 4754, 4779, 4785, 4794, 4800, 4811, 4817, 4826, 4832, 4852, 4858, 4867, 4873, 4884, 4890, 4899, 4905, 4769, 4775, 4784, 4790, 4801, 4807, 4816, 4822, 4842, 4848, 4857, 4863, 4874, 4880, 4889, 4895, 4920, 4926, 4935, 4941, 4952, 4958, 4967, 4973, 4993, 4999, 5008, 5014, 5025, 5031, 5040, 5046, 5069, 5075, 5084, 5090, 5101, 5107, 5116, 5122, 5142, 5148, 5157, 5163, 5174, 5180, 5189, 5195, 5220, 5226, 5235, 5241, 5252, 5258, 5267, 5273, 5293, 5299, 5308, 5314, 5325, 5331, 5340, 5346, 4604, 4610, 4619, 4625, 4636, 4642, 4651, 4657, 4677, 4683, 4692, 4698, 4709, 4715, 4724, 4730, 4755, 4761, 4770, 4776, 4787, 4793, 4802, 4808, 4828, 4834, 4843, 4849, 4860, 4866, 4875, 4881, 4904, 4910, 4919, 4925, 4936, 4942, 4951, 4957, 4977, 4983, 4992, 4998, 5009, 5015, 5024, 5030, 5055, 5061, 5070, 5076, 5087, 5093, 5102, 5108, 5128, 5134, 5143, 5149, 5160, 5166, 5175, 5181, 5045, 5051, 5060, 5066, 5077, 5083, 5092, 5098, 5118, 5124, 5133, 5139, 5150, 5156, 5165, 5171, 5196, 5202, 5211, 5217, 5228, 5234, 5243, 5249, 5269, 5275, 5284, 5290, 5301, 5307, 5316, 5322, 5345, 5351, 5360, 5366, 5377, 5383, 5392, 5398, 5418, 5424, 5433, 5439, 5450, 5456, 5465, 5471, 5496, 5502, 5511, 5517, 5528, 5534, 5543, 5549, 5569, 5575, 5584, 5590, 5601, 5607, 5616, 5622, 5417, 5423, 5432, 5438, 5449, 5455, 5464, 5470, 5490, 5496, 5505, 5511, 5522, 5528, 5537, 5543, 5568, 5574, 5583, 5589, 5600, 5606, 5615, 5621, 5641, 5647, 5656, 5662, 5673, 5679, 5688, 5694, 5717, 5723, 5732, 5738, 5749, 5755, 5764, 5770, 5790, 5796, 5805, 5811, 5822, 5828, 5837, 5843, 5868, 5874, 5883, 5889, 5900, 5906, 5915, 5921, 5941, 5947, 5956, 5962, 5973, 5979, 5988, 5994, 5858, 5864, 5873, 5879, 5890, 5896, 5905, 5911, 5931, 5937, 5946, 5952, 5963, 5969, 5978, 5984, 6009, 6015, 6024, 6030, 6041, 6047, 6056, 6062, 6082, 6088, 6097, 6103, 6114, 6120, 6129, 6135, 6158, 6164, 6173, 6179, 6190, 6196, 6205, 6211, 6231, 6237, 6246, 6252, 6263, 6269, 6278, 6284, 6309, 6315, 6324, 6330, 6341, 6347, 6356, 6362, 6382, 6388, 6397, 6403, 6414, 6420, 6429, 6435, 5303, 5309, 5318, 5324, 5335, 5341, 5350, 5356, 5376, 5382, 5391, 5397, 5408, 5414, 5423, 5429, 5454, 5460, 5469, 5475, 5486, 5492, 5501, 5507, 5527, 5533, 5542, 5548, 5559, 5565, 5574, 5580, 5603, 5609, 5618, 5624, 5635, 5641, 5650, 5656, 5676, 5682, 5691, 5697, 5708, 5714, 5723, 5729, 5754, 5760, 5769, 5775, 5786, 5792, 5801, 5807, 5827, 5833, 5842, 5848, 5859, 5865, 5874, 5880, 5744, 5750, 5759, 5765, 5776, 5782, 5791, 5797, 5817, 5823, 5832, 5838, 5849, 5855, 5864, 5870, 5895, 5901, 5910, 5916, 5927, 5933, 5942, 5948, 5968, 5974, 5983, 5989, 6000, 6006, 6015, 6021, 6044, 6050, 6059, 6065, 6076, 6082, 6091, 6097, 6117, 6123, 6132, 6138, 6149, 6155, 6164, 6170, 6195, 6201, 6210, 6216, 6227, 6233, 6242, 6248, 6268, 6274, 6283, 6289, 6300, 6306, 6315, 6321, 6116, 6122, 6131, 6137, 6148, 6154, 6163, 6169, 6189, 6195, 6204, 6210, 6221, 6227, 6236, 6242, 6267, 6273, 6282, 6288, 6299, 6305, 6314, 6320, 6340, 6346, 6355, 6361, 6372, 6378, 6387, 6393, 6416, 6422, 6431, 6437, 6448, 6454, 6463, 6469, 6489, 6495, 6504, 6510, 6521, 6527, 6536, 6542, 6567, 6573, 6582, 6588, 6599, 6605, 6614, 6620, 6640, 6646, 6655, 6661, 6672, 6678, 6687, 6693, 6557, 6563, 6572, 6578, 6589, 6595, 6604, 6610, 6630, 6636, 6645, 6651, 6662, 6668, 6677, 6683, 6708, 6714, 6723, 6729, 6740, 6746, 6755, 6761, 6781, 6787, 6796, 6802, 6813, 6819, 6828, 6834, 6857, 6863, 6872, 6878, 6889, 6895, 6904, 6910, 6930, 6936, 6945, 6951, 6962, 6968, 6977, 6983, 7008, 7014, 7023, 7029, 7040, 7046, 7055, 7061, 7081, 7087, 7096, 7102, 7113, 7119, 7128, 7134, 6392, 6398, 6407, 6413, 6424, 6430, 6439, 6445, 6465, 6471, 6480, 6486, 6497, 6503, 6512, 6518, 6543, 6549, 6558, 6564, 6575, 6581, 6590, 6596, 6616, 6622, 6631, 6637, 6648, 6654, 6663, 6669, 6692, 6698, 6707, 6713, 6724, 6730, 6739, 6745, 6765, 6771, 6780, 6786, 6797, 6803, 6812, 6818, 6843, 6849, 6858, 6864, 6875, 6881, 6890, 6896, 6916, 6922, 6931, 6937, 6948, 6954, 6963, 6969, 6833, 6839, 6848, 6854, 6865, 6871, 6880, 6886, 6906, 6912, 6921, 6927, 6938, 6944, 6953, 6959, 6984, 6990, 6999, 7005, 7016, 7022, 7031, 7037, 7057, 7063, 7072, 7078, 7089, 7095, 7104, 7110, 7133, 7139, 7148, 7154, 7165, 7171, 7180, 7186, 7206, 7212, 7221, 7227, 7238, 7244, 7253, 7259, 7284, 7290, 7299, 7305, 7316, 7322, 7331, 7337, 7357, 7363, 7372, 7378, 7389, 7395, 7404, 7410, 7205, 7211, 7220, 7226, 7237, 7243, 7252, 7258, 7278, 7284, 7293, 7299, 7310, 7316, 7325, 7331, 7356, 7362, 7371, 7377, 7388, 7394, 7403, 7409, 7429, 7435, 7444, 7450, 7461, 7467, 7476, 7482, 7505, 7511, 7520, 7526, 7537, 7543, 7552, 7558, 7578, 7584, 7593, 7599, 7610, 7616, 7625, 7631, 7656, 7662, 7671, 7677, 7688, 7694, 7703, 7709, 7729, 7735, 7744, 7750, 7761);

    function VariableLevelCost(a, b) {
        var c = cq[a - 1][0];
        var d = cq[a - 1][1];
        var e = 0;
        var i = int;
        for (i = 2; c; ++i) {
            if (c & 1) {
                e += VP8BitCost(d & 1, b[i])
            }
            d >>= 1;
            c >>= 1
        }
        return e
    }

    function VP8CalculateLevelCosts(a) {
        var b, band, ctx;
        for (b = 0; b < NUM_TYPES; ++b) {
            for (band = 0; band < NUM_BANDS; ++band) {
                for (ctx = 0; ctx < NUM_CTX; ++ctx) {
                    var p = a.coeffs_[b][band][ctx];
                    var c = a.level_cost_[b][band][ctx];
                    var d = VP8BitCost(1, p[1]);
                    var v;
                    c[0] = VP8BitCost(0, p[1]);
                    for (v = 1; v <= MAX_VARIABLE_LEVEL; ++v) {
                        c[v] = d + VariableLevelCost(v, p)
                    }
                }
            }
        }
    }
    var cs = new Array(302, 984, 439, 642);
    var ct = new Array(663, 919, 872, 919);
    var cu = new Array(new Array(new Array(251, 1362, 1934, 2085, 2314, 2230, 1839, 1988, 2437, 2348), new Array(403, 680, 1507, 1519, 2060, 2005, 1992, 1914, 1924, 1733), new Array(353, 1121, 973, 1895, 2060, 1787, 1671, 1516, 2012, 1868), new Array(770, 852, 1581, 632, 1393, 1780, 1823, 1936, 1074, 1218), new Array(510, 1270, 1467, 1319, 847, 1279, 1792, 2094, 1080, 1353), new Array(488, 1322, 918, 1573, 1300, 883, 1814, 1752, 1756, 1502), new Array(425, 992, 1820, 1514, 1843, 2440, 937, 1771, 1924, 1129), new Array(363, 1248, 1257, 1970, 2194, 2385, 1569, 953, 1951, 1601), new Array(723, 1257, 1631, 964, 963, 1508, 1697, 1824, 671, 1418), new Array(635, 1038, 1573, 930, 1673, 1413, 1410, 1687, 1410, 749)), new Array(new Array(451, 613, 1345, 1702, 1870, 1716, 1728, 1766, 2190, 2310), new Array(678, 453, 1171, 1443, 1925, 1831, 2045, 1781, 1887, 1602), new Array(711, 666, 674, 1718, 1910, 1493, 1775, 1193, 2325, 2325), new Array(883, 854, 1583, 542, 1800, 1878, 1664, 2149, 1207, 1087), new Array(669, 994, 1248, 1122, 949, 1179, 1376, 1729, 1070, 1244), new Array(715, 1026, 715, 1350, 1430, 930, 1717, 1296, 1479, 1479), new Array(544, 841, 1656, 1450, 2094, 3883, 1010, 1759, 2076, 809), new Array(610, 855, 957, 1553, 2067, 1561, 1704, 824, 2066, 1226), new Array(833, 960, 1416, 819, 1277, 1619, 1501, 1617, 757, 1182), new Array(711, 964, 1252, 879, 1441, 1828, 1508, 1636, 1594, 734)), new Array(new Array(605, 764, 734, 1713, 1747, 1192, 1819, 1353, 1877, 2392), new Array(866, 641, 586, 1622, 2072, 1431, 1888, 1346, 2189, 1764), new Array(901, 851, 456, 2165, 2281, 1405, 1739, 1193, 2183, 2443), new Array(770, 1045, 952, 1078, 1342, 1191, 1436, 1063, 1303, 995), new Array(901, 1086, 727, 1170, 884, 1105, 1267, 1401, 1739, 1337), new Array(951, 1162, 595, 1488, 1388, 703, 1790, 1366, 2057, 1724), new Array(534, 986, 1273, 1987, 3273, 1485, 1024, 1399, 1583, 866), new Array(699, 1182, 695, 1978, 1726, 1986, 1326, 714, 1750, 1672), new Array(951, 1217, 1209, 920, 1062, 1441, 1548, 999, 952, 932), new Array(733, 1284, 784, 1256, 1557, 1098, 1257, 1357, 1414, 908)), new Array(new Array(316, 1075, 1653, 1220, 2145, 2051, 1730, 2131, 1884, 1790), new Array(745, 516, 1404, 894, 1599, 2375, 2013, 2105, 1475, 1381), new Array(516, 729, 1088, 1319, 1637, 3426, 1636, 1275, 1531, 1453), new Array(894, 943, 2138, 468, 1704, 2259, 2069, 1763, 1266, 1158), new Array(605, 1025, 1235, 871, 1170, 1767, 1493, 1500, 1104, 1258), new Array(739, 826, 1207, 1151, 1412, 846, 1305, 2726, 1014, 1569), new Array(558, 825, 1820, 1398, 3344, 1556, 1218, 1550, 1228, 878), new Array(429, 951, 1089, 1816, 3861, 3861, 1556, 969, 1568, 1828), new Array(883, 961, 1752, 769, 1468, 1810, 2081, 2346, 613, 1298), new Array(803, 895, 1372, 641, 1303, 1708, 1686, 1700, 1306, 1033)), new Array(new Array(439, 1267, 1270, 1579, 963, 1193, 1723, 1729, 1198, 1993), new Array(705, 725, 1029, 1153, 1176, 1103, 1821, 1567, 1259, 1574), new Array(723, 859, 802, 1253, 972, 1202, 1407, 1665, 1520, 1674), new Array(894, 960, 1254, 887, 1052, 1607, 1344, 1349, 865, 1150), new Array(833, 1312, 1337, 1205, 572, 1288, 1414, 1529, 1088, 1430), new Array(842, 1279, 1068, 1861, 862, 688, 1861, 1630, 1039, 1381), new Array(766, 938, 1279, 1546, 3338, 1550, 1031, 1542, 1288, 640), new Array(715, 1090, 835, 1609, 1100, 1100, 1603, 1019, 1102, 1617), new Array(894, 1813, 1500, 1188, 789, 1194, 1491, 1919, 617, 1333), new Array(610, 1076, 1644, 1281, 1283, 975, 1179, 1688, 1434, 889)), new Array(new Array(544, 971, 1146, 1849, 1221, 740, 1857, 1621, 1683, 2430), new Array(723, 705, 961, 1371, 1426, 821, 2081, 2079, 1839, 1380), new Array(783, 857, 703, 2145, 1419, 814, 1791, 1310, 1609, 2206), new Array(997, 1000, 1153, 792, 1229, 1162, 1810, 1418, 942, 979), new Array(901, 1226, 883, 1289, 793, 715, 1904, 1649, 1319, 3108), new Array(979, 1478, 782, 2216, 1454, 455, 3092, 1591, 1997, 1664), new Array(663, 1110, 1504, 1114, 1522, 3311, 676, 1522, 1530, 1024), new Array(605, 1138, 1153, 1314, 1569, 1315, 1157, 804, 1574, 1320), new Array(770, 1216, 1218, 1227, 869, 1384, 1232, 1375, 834, 1239), new Array(775, 1007, 843, 1216, 1225, 1074, 2527, 1479, 1149, 975)), new Array(new Array(477, 817, 1309, 1439, 1708, 1454, 1159, 1241, 1945, 1672), new Array(577, 796, 1112, 1271, 1618, 1458, 1087, 1345, 1831, 1265), new Array(663, 776, 753, 1940, 1690, 1690, 1227, 1097, 3149, 1361), new Array(766, 1299, 1744, 1161, 1565, 1106, 1045, 1230, 1232, 707), new Array(915, 1026, 1404, 1182, 1184, 851, 1428, 2425, 1043, 789), new Array(883, 1456, 790, 1082, 1086, 985, 1083, 1484, 1238, 1160), new Array(507, 1345, 2261, 1995, 1847, 3636, 653, 1761, 2287, 933), new Array(553, 1193, 1470, 2057, 2059, 2059, 833, 779, 2058, 1263), new Array(766, 1275, 1515, 1039, 957, 1554, 1286, 1540, 1289, 705), new Array(499, 1378, 1496, 1385, 1850, 1850, 1044, 2465, 1515, 720)), new Array(new Array(553, 930, 978, 2077, 1968, 1481, 1457, 761, 1957, 2362), new Array(694, 864, 905, 1720, 1670, 1621, 1429, 718, 2125, 1477), new Array(699, 968, 658, 3190, 2024, 1479, 1865, 750, 2060, 2320), new Array(733, 1308, 1296, 1062, 1576, 1322, 1062, 1112, 1172, 816), new Array(920, 927, 1052, 939, 947, 1156, 1152, 1073, 3056, 1268), new Array(723, 1534, 711, 1547, 1294, 892, 1553, 928, 1815, 1561), new Array(663, 1366, 1583, 2111, 1712, 3501, 522, 1155, 2130, 1133), new Array(614, 1731, 1188, 2343, 1944, 3733, 1287, 487, 3546, 1758), new Array(770, 1585, 1312, 826, 884, 2673, 1185, 1006, 1195, 1195), new Array(758, 1333, 1273, 1023, 1621, 1162, 1351, 833, 1479, 862)), new Array(new Array(376, 1193, 1446, 1149, 1545, 1577, 1870, 1789, 1175, 1823), new Array(803, 633, 1136, 1058, 1350, 1323, 1598, 2247, 1072, 1252), new Array(614, 1048, 943, 981, 1152, 1869, 1461, 1020, 1618, 1618), new Array(1107, 1085, 1282, 592, 1779, 1933, 1648, 2403, 691, 1246), new Array(851, 1309, 1223, 1243, 895, 1593, 1792, 2317, 627, 1076), new Array(770, 1216, 1030, 1125, 921, 981, 1629, 1131, 1049, 1646), new Array(626, 1469, 1456, 1081, 1489, 3278, 981, 1232, 1498, 733), new Array(617, 1201, 812, 1220, 1476, 1476, 1478, 970, 1228, 1488), new Array(1179, 1393, 1540, 999, 1243, 1503, 1916, 1925, 414, 1614), new Array(943, 1088, 1490, 682, 1112, 1372, 1756, 1505, 966, 966)), new Array(new Array(322, 1142, 1589, 1396, 2144, 1859, 1359, 1925, 2084, 1518), new Array(617, 625, 1241, 1234, 2121, 1615, 1524, 1858, 1720, 1004), new Array(553, 851, 786, 1299, 1452, 1560, 1372, 1561, 1967, 1713), new Array(770, 977, 1396, 568, 1893, 1639, 1540, 2108, 1430, 1013), new Array(684, 1120, 1375, 982, 930, 2719, 1638, 1643, 933, 993), new Array(553, 1103, 996, 1356, 1361, 1005, 1507, 1761, 1184, 1268), new Array(419, 1247, 1537, 1554, 1817, 3606, 1026, 1666, 1829, 923), new Array(439, 1139, 1101, 1257, 3710, 1922, 1205, 1040, 1931, 1529), new Array(979, 935, 1269, 847, 1202, 1286, 1530, 1535, 827, 1036), new Array(516, 1378, 1569, 1110, 1798, 1798, 1198, 2199, 1543, 712)));
    var cv = {
        first: int,
        last: int,
        coeffs: int16_t,
        coeffs_off: 0,
        coeff_type: int,
        prob: newObjectIt(bJ),
        stats: newObjectIt(bK),
        cost: newObjectIt(bL)
    };
    var cw = new Array(0, 1, 2, 3, 6, 4, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0);
    var cx = new Array(173, 148, 140);
    var cy = new Array(176, 155, 140, 135);
    var cz = new Array(180, 157, 141, 134, 130);
    var cA = new Array(254, 254, 243, 230, 196, 177, 153, 140, 133, 130, 129);

    function ResetStats(a, b) {
        var c = a.proba_;
        if (b) VP8CalculateLevelCosts(c);
        c.nb_skip_ = 0
    }

    function CalcSkipProba(a, b) {
        return parseInt(b ? (b - a) * 255 / b : 255)
    }

    function FinalizeSkipProba(a) {
        var b = a.proba_;
        var c = a.mb_w_ * a.mb_h_;
        var d = b.nb_skip_;
        var e = int;
        b.skip_proba_ = CalcSkipProba(d, c);
        b.use_skip_proba_ = (b.skip_proba_ < 250) + 0;
        e = 256;
        if (b.use_skip_proba_) {
            e += d * VP8BitCost(1, b.skip_proba_) + (c - d) * VP8BitCost(0, b.skip_proba_);
            e += 8 * 256
        }
        return e
    }

    function ResetTokenStats(a) {
        var b = a.proba_;
        b.stats = newObjectIt(bK)
    }

    function Record(a, b) {
        b[0] += parseInt(a + 0);
        b[1] += 1;
        return a
    }

    function RecordCoeffs(a, b) {
        var n = b.first;
        var s = b.stats[cw[n]][a];
        if (!Record(b.last >= 0, s[0])) {
            return 0
        }
        while (1) {
            var v = b.coeffs[n++];
            if (!Record(v != 0, s[1])) {
                s = b.stats[cw[n]][0];
                continue
            }
            if (!Record(2 < (v + 1), s[2])) {
                s = b.stats[cw[n]][1]
            } else {
                v = Math.abs(v);
                if (v > MAX_VARIABLE_LEVEL) v = MAX_VARIABLE_LEVEL; {
                    var c = cq[v - 1][1];
                    var d = cq[v - 1][0];
                    var i;
                    for (i = 0;
                        (d >>= 1) != 0; ++i) {
                        var e = 2 << i;
                        if (d & 1) Record(!!(c & e), s[3 + i])
                    }
                }
                s = b.stats[cw[n]][2]
            }
            if (n == 16 || !Record(n <= b.last, s[0])) {
                return 1
            }
        }
    }

    function CalcTokenProba(a, b) {
        return a ? parseInt(((b - a) * 255 + b / 2) / b) : 255
    }

    function FinalizeTokenProbas(a) {
        var d = a.proba_;
        var e = 0;
        var t, b, c, p;
        for (t = 0; t < NUM_TYPES; ++t) {
            for (b = 0; b < NUM_BANDS; ++b) {
                for (c = 0; c < NUM_CTX; ++c) {
                    for (p = 0; p < NUM_PROBAS; ++p) {
                        var f = d.stats_[t][b][c][p];
                        var g = dz[t][b][c][p];
                        var h = dw[t][b][c][p];
                        var i = CalcTokenProba(f[0], f[1]);
                        var j = VP8BranchCost(f[0], f[1], h) + VP8BitCost(0, g);
                        var k = VP8BranchCost(f[0], f[1], i) + VP8BitCost(1, g) + 8 * 256;
                        var l = (j > k) + 0;
                        e += VP8BitCost(l, g);
                        if (l) {
                            d.coeffs_[t][b][c][p] = i;
                            e += 8 * 256
                        } else {
                            d.coeffs_[t][b][c][p] = h
                        }
                    }
                }
            }
        }
        return e
    }

    function InitResidual(a, b, c, d) {
        d.coeff_type = b;
        d.prob = c.proba_.coeffs_[b];
        d.stats = c.proba_.stats_[b];
        d.cost = c.proba_.level_cost_[b];
        d.first = a
    }

    function SetResidualCoeffs(a, b) {
        var n;
        b.last = -1;
        for (n = 15; n >= b.first; --n) {
            if (a[n]) {
                b.last = n;
                break
            }
        }
        b.coeffs = a
    }

    function GetResidualCost(a, b) {
        var n = b.first;
        var p = b.prob[cw[n]][a];
        var t = b.cost[cw[n]][a];
        var c = int;
        c = VP8BitCost(b.last >= 0, p[0]);
        if (b.last < 0) {
            return c
        }
        while (n <= b.last) {
            var v = b.coeffs[n++];
            if (v == 0) {
                p = b.prob[cw[n]][0];
                t = b.cost[cw[n]][0];
                continue
            } else if (2 >= (v + 1)) {
                c += VP8LevelCost(t, 1);
                p = b.prob[cw[n]][1];
                t = b.cost[cw[n]][1]
            } else {
                c += VP8LevelCost(t, Math.abs(v));
                p = b.prob[cw[n]][2];
                t = b.cost[cw[n]][2]
            }
            if (n < 16) {
                c += VP8BitCost(n <= b.last, p[0])
            }
        }
        return c
    }
    var cB = newObjectIt(cv);

    function VP8GetCostLuma4(a, b) {
        var x = (a.i4_ & 3) + 0,
            y = (a.i4_ >> 2) + 0;
        var c = (cB);
        var R = 0;
        var d = int;
        InitResidual(0, 3, a.enc_, c);
        d = a.top_nz_[x] + a.left_nz_[y];
        SetResidualCoeffs(b, c);
        R += GetResidualCost(d, c);
        return R
    }
    var cC = newObjectIt(cv);

    function VP8GetCostLuma16(a, b) {
        var c = (cC);
        var x, y = int;
        var R = 0;
        VP8IteratorNzToBytes(a);
        InitResidual(0, 1, a.enc_, c);
        SetResidualCoeffs(b.y_dc_levels, c);
        R += GetResidualCost(a.top_nz_[8] + a.left_nz_[8], c);
        InitResidual(1, 0, a.enc_, c);
        for (y = 0; y < 4; ++y) {
            for (x = 0; x < 4; ++x) {
                var d = a.top_nz_[x] + a.left_nz_[y];
                SetResidualCoeffs(b.y_ac_levels[x + y * 4], c);
                R += GetResidualCost(d, c);
                a.top_nz_[x] = a.left_nz_[y] = (c.last >= 0) + 0
            }
        }
        return R
    }
    var cD = newObjectIt(cv);

    function VP8GetCostUV(a, b) {
        var c = (cD);
        var d, x, y;
        var R = 0;
        VP8IteratorNzToBytes(a);
        InitResidual(0, 2, a.enc_, c);
        for (d = 0; d <= 2; d += 2) {
            for (y = 0; y < 2; ++y) {
                for (x = 0; x < 2; ++x) {
                    var e = a.top_nz_[4 + d + x] + a.left_nz_[4 + d + y];
                    SetResidualCoeffs(b.uv_levels[d * 2 + x + y * 2], c);
                    R += GetResidualCost(e, c);
                    a.top_nz_[4 + d + x] = a.left_nz_[4 + d + y] = (c.last >= 0) + 0
                }
            }
        }
        return R
    }

    function PutCoeffs(a, b, d) {
        var n = d.first;
        var p = d.prob[cw[n]][b];
        if (!VP8PutBit(a, d.last >= 0, p[0])) {
            return 0
        }
        while (n < 16) {
            var c = d.coeffs[n++];
            var e = (c < 0) + 0;
            var v = e ? -c : c;
            if (!VP8PutBit(a, v != 0, p[1])) {
                p = d.prob[cw[n]][0];
                continue
            }
            if (!VP8PutBit(a, v > 1, p[2])) {
                p = d.prob[cw[n]][1]
            } else {
                if (!VP8PutBit(a, v > 4, p[3])) {
                    if (VP8PutBit(a, v != 2, p[4])) VP8PutBit(a, v == 4, p[5])
                } else if (!VP8PutBit(a, v > 10, p[6])) {
                    if (!VP8PutBit(a, v > 6, p[7])) {
                        VP8PutBit(a, v == 6, 159)
                    } else {
                        VP8PutBit(a, v >= 9, 165);
                        VP8PutBit(a, !(v & 1), 145)
                    }
                } else {
                    var f = int;
                    var g;
                    var h = 0;
                    if (v < 3 + (8 << 1)) {
                        VP8PutBit(a, 0, p[8]);
                        VP8PutBit(a, 0, p[9]);
                        v -= 3 + (8 << 0);
                        f = 1 << 2;
                        g = cx;
                        h = 0
                    } else if (v < 3 + (8 << 2)) {
                        VP8PutBit(a, 0, p[8]);
                        VP8PutBit(a, 1, p[9]);
                        v -= 3 + (8 << 1);
                        f = 1 << 3;
                        g = cy;
                        h = 0
                    } else if (v < 3 + (8 << 3)) {
                        VP8PutBit(a, 1, p[8]);
                        VP8PutBit(a, 0, p[10]);
                        v -= 3 + (8 << 2);
                        f = 1 << 4;
                        g = cz;
                        h = 0
                    } else {
                        VP8PutBit(a, 1, p[8]);
                        VP8PutBit(a, 1, p[10]);
                        v -= 3 + (8 << 3);
                        f = 1 << 10;
                        g = cA;
                        h = 0
                    }
                    while (f) {
                        VP8PutBit(a, !!(v & f), g[h++]);
                        f >>= 1
                    }
                }
                p = d.prob[cw[n]][2]
            }
            VP8PutBitUniform(a, e);
            if (n == 16 || !VP8PutBit(a, n <= d.last, p[0])) {
                return 1
            }
        }
        return 1
    }
    var cE = newObjectIt(cv);

    function CodeResiduals(a, b, c) {
        var x, y, ch;
        var d = (cE);
        var e = uint64_t,
            pos2 = uint64_t,
            pos3 = uint64_t;
        var f = (b.mb_[b.mb_off].type_ == 1) + 0;
        var g = b.mb_[b.mb_off].segment_;
        VP8IteratorNzToBytes(b);
        e = VP8BitWriterPos(a);
        if (f) {
            InitResidual(0, 1, b.enc_, d);
            SetResidualCoeffs(c.y_dc_levels, d);
            b.top_nz_[8] = b.left_nz_[8] = PutCoeffs(a, b.top_nz_[8] + b.left_nz_[8], d);
            InitResidual(1, 0, b.enc_, d)
        } else {
            InitResidual(0, 3, b.enc_, d)
        }
        for (y = 0; y < 4; ++y) {
            for (x = 0; x < 4; ++x) {
                var h = b.top_nz_[x] + b.left_nz_[y];
                SetResidualCoeffs(c.y_ac_levels[x + y * 4], d);
                b.top_nz_[x] = b.left_nz_[y] = PutCoeffs(a, h, d)
            }
        }
        pos2 = VP8BitWriterPos(a);
        InitResidual(0, 2, b.enc_, d);
        for (ch = 0; ch <= 2; ch += 2) {
            for (y = 0; y < 2; ++y) {
                for (x = 0; x < 2; ++x) {
                    var h = b.top_nz_[4 + ch + x] + b.left_nz_[4 + ch + y];
                    SetResidualCoeffs(c.uv_levels[ch * 2 + x + y * 2], d);
                    b.top_nz_[4 + ch + x] = b.left_nz_[4 + ch + y] = PutCoeffs(a, h, d)
                }
            }
        }
        pos3 = VP8BitWriterPos(a);
        b.luma_bits_ = pos2 - e;
        b.uv_bits_ = pos3 - pos2;
        b.bit_count_[g][f] += b.luma_bits_;
        b.bit_count_[g][2] += b.uv_bits_;
        VP8IteratorBytesToNz(b)
    }
    var cF = newObjectIt(cv);

    function RecordResiduals(a, b) {
        var x, y, ch;
        var c = (cF);
        VP8IteratorNzToBytes(a);
        if (a.mb_[a.mb_off].type_ == 1) {
            InitResidual(0, 1, a.enc_, c);
            SetResidualCoeffs(b.y_dc_levels, c);
            a.top_nz_[8] = a.left_nz_[8] = RecordCoeffs(a.top_nz_[8] + a.left_nz_[8], c);
            InitResidual(1, 0, a.enc_, c)
        } else {
            InitResidual(0, 3, a.enc_, c)
        }
        for (y = 0; y < 4; ++y) {
            for (x = 0; x < 4; ++x) {
                var d = a.top_nz_[x] + a.left_nz_[y];
                SetResidualCoeffs(b.y_ac_levels[x + y * 4], c);
                a.top_nz_[x] = a.left_nz_[y] = RecordCoeffs(d, c)
            }
        }
        InitResidual(0, 2, a.enc_, c);
        for (ch = 0; ch <= 2; ch += 2) {
            for (y = 0; y < 2; ++y) {
                for (x = 0; x < 2; ++x) {
                    var d = a.top_nz_[4 + ch + x] + a.left_nz_[4 + ch + y];
                    SetResidualCoeffs(b.uv_levels[ch * 2 + x + y * 2], c);
                    a.top_nz_[4 + ch + x] = a.left_nz_[4 + ch + y] = RecordCoeffs(d, c)
                }
            }
        }
        VP8IteratorBytesToNz(a)
    }

    function ResetSSE(a) {
        memset_(a.sse_, 0, 0, sizeof(a.sse_) * 3);
        a.sse_count_ = 0
    }

    function StoreSSE(a) {
        var b = a.enc_;
        var c = a.yuv_in_;
        var d = a.yuv_in_off;
        var e = a.yuv_out_;
        var f = a.yuv_out_off;
        b.sse_[0] += dM(c, d + bk, e, f + bk);
        b.sse_[1] += dN(c, d + bl, e, f + bl);
        b.sse_[2] += dN(c, d + bm, e, f + bm);
        b.sse_count_ += 16 * 16
    }

    function StoreSideInfo(a) {
        var c = a.enc_;
        var d = a.mb_[a.mb_off];
        var e = c.pic_;
        if (e.stats_nozero) {
            StoreSSE(a);
            c.block_count_[0] += (d.type_ == 0) + 0;
            c.block_count_[1] += (d.type_ == 1) + 0;
            c.block_count_[2] += (d.skip_ != 0) + 0
        }
        if (e.extra_info) {
            switch (e.extra_info_type) {
                case 1:
                    e.extra_info[a.x_ + a.y_ * c.mb_w_] = d.type_;
                    break;
                case 2:
                    e.extra_info[a.x_ + a.y_ * c.mb_w_] = d.segment_;
                    break;
                case 3:
                    e.extra_info[a.x_ + a.y_ * c.mb_w_] = c.dqm_[d.segment_].quant_;
                    break;
                case 4:
                    e.extra_info[a.x_ + a.y_ * c.mb_w_] = (d.type_ == 1) ? a.preds_[a.preds_off + 0] : 0xff;
                    break;
                case 5:
                    e.extra_info[a.x_ + a.y_ * c.mb_w_] = d.uv_mode_;
                    break;
                case 6:
                    {
                        var b = parseInt((a.luma_bits_ + a.uv_bits_ + 7) >> 3);
                        e.extra_info[a.x_ + a.y_ * c.mb_w_] = (b > 255) ? 255 : b;
                        break
                    }
                default:
                    info = 0;
                    break
            }
        }
    }

    function ResetAfterSkip(a) {
        if (a.mb_[a.mb_off].type_ == 1) {
            a.nz_[a.nz_off] = 0;
            a.left_nz_[8] = 0
        } else {
            a.nz_[a.nz_off] &= (1 << 24)
        }
    }

    function VP8EncLoop(a) {
        var i, s, p;
        var b = newObjectIt(bV);
        var c = newObjectIt(bU);
        var d = (!a.proba_.use_skip_proba_) + 0;
        var e = a.rd_opt_level_;
        var f = 5;
        var g = parseInt(a.mb_w_ * a.mb_h_ * f / a.num_parts_);
        for (p = 0; p < a.num_parts_; ++p) {
            VP8BitWriterInit(a.parts_[+p], g)
        }
        ResetStats(a, (e != 0));
        ResetSSE(a);
        VP8IteratorInit(a, b);
        VP8InitFilter(b);
        do {
            VP8IteratorImport(b);
            if (!VP8Decimate(b, c, e) || (!a.proba_.use_skip_proba_)) {
                CodeResiduals(b.bw_, b, c)
            } else {
                ResetAfterSkip(b)
            }
            if (a.has_alpha_) {
                VP8EncCodeAlphaBlock(b)
            }
            if (a.use_layer_) {
                VP8EncCodeLayerBlock(b)
            }
            StoreSideInfo(b);
            VP8StoreFilterStats(b);
            VP8IteratorExport(b)
        } while (VP8IteratorNext(b, b.yuv_out_, b.yuv_out_off));
        VP8AdjustFilterStrength(b);
        for (p = 0; p < a.num_parts_; ++p) {
            VP8BitWriterFinish(a.parts_[+p])
        }
        if (a.pic_.stats_nozero) {
            for (i = 0; i <= 2; ++i) {
                for (s = 0; s < be; ++s) {
                    a.residual_bytes_[i][s] = parseInt((b.bit_count_[s][i] + 7) >> 3)
                }
            }
        }
        return 1
    }
    var cG = (15 + 20 + 10);

    function OneStatPass(a, q, b, c, d) {
        var e = newObjectIt(bV);
        var f = 0;
        var g = 0;
        var h = c * 384;
        if (q < 0.) {
            q = 0
        } else if (q > 100.) {
            q = 100
        }
        VP8SetSegmentParams(a, q);
        ResetStats(a, b != 0);
        ResetTokenStats(a);
        VP8IteratorInit(a, e);
        var i = newObjectIt(bU);
        do {
            var j = (i);
            VP8IteratorImport(e);
            if (VP8Decimate(e, j, b)) {
                a.proba_.nb_skip_++
            }
            RecordResiduals(e, j);
            f += j.R;
            g += j.D
        } while (VP8IteratorNext(e, e.yuv_out_, e.yuv_out_off) && --c > 0);
        f += FinalizeSkipProba(a);
        f += FinalizeTokenProbas(a);
        f += a.segment_hdr_.size_;
        f = ((f + 1024) >> 11) + cG;
        if (d) {
            d.f = parseFloat(10. * (Math.LOG10E * Math.log(255. * 255. * h / g)))
        }
        return parseInt(f)
    }
    var cH = new Array(20, 15, 10, 8, 6, 4, 2, 1, 0);

    function VP8StatLoop(a) {
        var b = (a.config_.target_size > 0 || a.config_.target_PSNR > 0) + 0;
        var c = (a.method_ < 2 && !b) + 0;
        var q = parseFloat(a.config_.quality);
        var d = int;
        var e = int;
        e = a.mb_w_ * a.mb_h_;
        if (c && e > 100) e = 100;
        if (!b) {
            for (d = 0; d < a.config_.pass; ++d) {
                var f = (a.method_ > 2) + 0;
                OneStatPass(a, q, f, e, null)
            }
            return 1
        }
        for (d = 0; d < a.config_.pass && (cH[d] > 0); ++d) {
            var f = 1;
            var g = {
                f: float
            };
            var h = int;
            var i = OneStatPass(a, q, f, e, g);
            if (a.config_.target_PSNR > 0) {
                h = (g.f < a.config_.target_PSNR)
            } else {
                h = (i < a.config_.target_size)
            }
            if (h) {
                q += cH[d]
            } else {
                q -= cH[d]
            }
        }
        return 1
    }

    function InitLeft(a) {
        var b = a.enc_;
        b.y_left_[b.y_left_off - 1] = b.u_left_[b.u_left_off - 1] = b.v_left_[b.v_left_off - 1] = (a.y_) > 0 ? 129 : 127;
        memset_(b.y_left_, b.y_left_off + 0, 129, 16);
        memset_(b.u_left_, b.u_left_off + 0, 129, 8);
        memset_(b.v_left_, b.v_left_off + 0, 129, 8);
        a.left_nz_[8] = 0
    }

    function InitTop(a) {
        var b = a.enc_;
        var c = b.mb_w_ * 16;
        memset_(b.y_top_, 0, 127, 2 * c);
        memset_(b.nz_, b.nz_off + 0, 0, b.mb_w_ * sizeof(b.nz_))
    }

    function VP8IteratorReset(a) {
        var b = a.enc_;
        a.x_ = 0;
        a.y_ = 0;
        a.y_offset_ = 0;
        a.uv_offset_ = 0;
        a.mb_ = b.mb_info_;
        a.mb_off = b.mb_info_off;
        a.preds_ = b.preds_;
        a.preds_off = b.preds_off;
        a.nz_ = b.nz_;
        a.nz_off = b.nz_off;
        a.bw_ = b.parts_[0];
        a.done_ = b.mb_w_ * b.mb_h_;
        InitTop(a);
        InitLeft(a);
        a.bit_count_ = ArrM(Array(4, 3), 0);
        a.do_trellis_ = 0
    }

    function VP8IteratorInit(a, b) {
        b.enc_ = a;
        b.y_stride_ = a.pic_.y_stride;
        b.uv_stride_ = a.pic_.uv_stride;
        b.yuv_in_ = a.yuv_in_;
        b.yuv_out_ = a.yuv_out_;
        b.yuv_out2_ = a.yuv_out2_;
        b.yuv_p_ = a.yuv_p_;
        b.lf_stats_ = a.lf_stats_;
        VP8IteratorReset(b)
    }

    function VP8IteratorImport(a) {
        var b = a.enc_;
        var x = a.x_,
            y = a.y_;
        var c = b.pic_;
        var d = c.y;
        var e = c.y_off + (y * c.y_stride + x) * 16;
        var f = c.u;
        var g = c.u_off + (y * c.uv_stride + x) * 8;
        var j = c.v;
        var k = c.v_off + (y * c.uv_stride + x) * 8;
        var l = a.yuv_in_;
        var m = a.yuv_in_off + bk;
        var n = a.yuv_in_;
        var o = a.yuv_in_off + bl;
        var p = a.yuv_in_;
        var q = a.yuv_in_off + bm;
        var w = (c.width - x * 16);
        var h = (c.height - y * 16);
        var i;
        if (w > 16) w = 16;
        if (h > 16) h = 16;
        for (i = 0; i < h; ++i) {
            memcpy(l, m, d, e, w);
            if (w < 16) memset_(l, m + w, l[m + w - 1], 16 - w);
            m += bf;
            e += c.y_stride
        }
        for (i = h; i < 16; ++i) {
            memcpy(l, m, l, m - bf, 16);
            m += bf
        }
        w = parseInt((w + 1) / 2);
        h = parseInt((h + 1) / 2);
        for (i = 0; i < h; ++i) {
            memcpy(n, o, f, g, w);
            memcpy(p, q, j, k, w);
            if (w < 8) {
                memset_(n, o + w, n[o + w - 1], 8 - w);
                memset_(p, q + w, p[q + w - 1], 8 - w)
            }
            o += bf;
            q += bf;
            g += c.uv_stride;
            k += c.uv_stride
        }
        for (i = h; i < 8; ++i) {
            memcpy(n, o, n, o - bf, 8);
            memcpy(p, q, p, q - bf, 8);
            o += bf;
            q += bf
        }
    }

    function VP8IteratorExport(a) {
        var b = a.enc_;
        if (b.config_.show_compressed) {
            var x = a.x_,
                y = a.y_;
            var c = a.yuv_out_;
            var d = a.yuv_out_off + bk;
            var e = a.yuv_out_;
            var f = a.yuv_out_off + bl;
            var g = a.yuv_out_;
            var j = a.yuv_out_off + bm;
            var k = b.pic_;
            var l = k.y;
            var m = k.y_off + (y * k.y_stride + x) * 16;
            var n = k.u;
            var o = k.u_off + (y * k.uv_stride + x) * 8;
            var p = k.v;
            var q = k.v_off + (y * k.uv_stride + x) * 8;
            var w = (k.width - x * 16);
            var h = (k.height - y * 16);
            var i;
            if (w > 16) w = 16;
            if (h > 16) h = 16;
            for (i = 0; i < h; ++i) {
                memcpy(l, m + i * k.y_stride, c, d + i * bf, w)
            } {
                var r = parseInt((w + 1) / 2);
                var s = parseInt((h + 1) / 2);
                for (i = 0; i < s; ++i) {
                    memcpy(n, o + i * k.uv_stride, e, f + i * bf, r);
                    memcpy(p, q + i * k.uv_stride, g, j + i * bf, r)
                }
            }
        }
    }

    function BIT(a, n) {
        return (!!((a) & (1 << (n)))) + 0
    }

    function VP8IteratorNzToBytes(a) {
        var b = a.nz_[a.nz_off + 0],
            lnz = a.nz_[a.nz_off - 1];
        a.top_nz_[0] = BIT(b, 12);
        a.top_nz_[1] = BIT(b, 13);
        a.top_nz_[2] = BIT(b, 14);
        a.top_nz_[3] = BIT(b, 15);
        a.top_nz_[4] = BIT(b, 18);
        a.top_nz_[5] = BIT(b, 19);
        a.top_nz_[6] = BIT(b, 22);
        a.top_nz_[7] = BIT(b, 23);
        a.top_nz_[8] = BIT(b, 24);
        a.left_nz_[0] = BIT(lnz, 3);
        a.left_nz_[1] = BIT(lnz, 7);
        a.left_nz_[2] = BIT(lnz, 11);
        a.left_nz_[3] = BIT(lnz, 15);
        a.left_nz_[4] = BIT(lnz, 17);
        a.left_nz_[5] = BIT(lnz, 19);
        a.left_nz_[6] = BIT(lnz, 21);
        a.left_nz_[7] = BIT(lnz, 23)
    }

    function VP8IteratorBytesToNz(a) {
        var b = 0;
        b |= (a.top_nz_[0] << 12) | (a.top_nz_[1] << 13);
        b |= (a.top_nz_[2] << 14) | (a.top_nz_[3] << 15);
        b |= (a.top_nz_[4] << 18) | (a.top_nz_[5] << 19);
        b |= (a.top_nz_[6] << 22) | (a.top_nz_[7] << 23);
        b |= (a.top_nz_[8] << 24);
        b |= (a.left_nz_[0] << 3) | (a.left_nz_[1] << 7);
        b |= (a.left_nz_[2] << 11);
        b |= (a.left_nz_[4] << 17) | (a.left_nz_[6] << 21);
        a.nz_[a.nz_off] = b
    }

    function VP8IteratorNext(a, b, c) {
        var d = a.enc_;
        if (b) {
            var x = a.x_,
                y = a.y_;
            var e = b;
            var f = c + bk;
            var g = b;
            var h = c + bl;
            if (x < d.mb_w_ - 1) {
                var i;
                for (i = 0; i < 16; ++i) {
                    d.y_left_[d.y_left_off + i] = e[f + 15 + i * bf]
                }
                for (i = 0; i < 8; ++i) {
                    d.u_left_[d.u_left_off + i] = g[h + 7 + i * bf];
                    d.v_left_[d.v_left_off + i] = g[h + 15 + i * bf]
                }
                d.y_left_[d.y_left_off - 1] = d.y_top_[d.y_top_off + x * 16 + 15];
                d.u_left_[d.u_left_off - 1] = d.uv_top_[d.uv_top_off + x * 16 + 0 + 7];
                d.v_left_[d.v_left_off - 1] = d.uv_top_[d.uv_top_off + x * 16 + 8 + 7]
            }
            if (y < d.mb_h_ - 1) {
                memcpy(d.y_top_, d.y_top_off + x * 16, e, f + 15 * bf, 16);
                memcpy(d.uv_top_, d.uv_top_off + x * 16, g, h + 7 * bf, 8 + 8)
            }
        }
        a.mb_off++;
        a.preds_off += 4;
        a.nz_off++;
        a.x_++;
        if (a.x_ == d.mb_w_) {
            a.x_ = 0;
            a.y_++;
            a.bw_ = d.parts_[a.y_ & (d.num_parts_ - 1)];
            a.preds_ = d.preds_;
            a.preds_off = d.preds_off + a.y_ * 4 * d.preds_w_;
            a.nz_ = d.nz_;
            a.nz_off = d.nz_off;
            InitLeft(a)
        }
        return (0 < --a.done_)
    }

    function VP8SetIntra16Mode(a, b) {
        var y;
        var c = a.preds_;
        var d = a.preds_off;
        for (y = 0; y < 4; ++y) {
            memset_(c, d, b, 4);
            d += a.enc_.preds_w_
        }
        a.mb_[a.mb_off].type_ = 1
    }

    function VP8SetIntra4Mode(a, b) {
        var x, y;
        var c = a.preds_;
        var d = a.preds_off;
        for (y = 0; y < 4; ++y) {
            for (x = 0; x < 4; ++x) {
                c[d + x] = b[x + y * 4]
            }
            d += a.enc_.preds_w_
        }
        a.mb_[a.mb_off].type_ = 0
    }

    function VP8SetIntraUVMode(a, b) {
        a.mb_[a.mb_off].uv_mode_ = b
    }

    function VP8SetSkip(a, b) {
        a.mb_[a.mb_off].skip_ = b
    }

    function VP8SetSegment(a, b) {
        a.mb_[a.mb_off].segment_ = b
    }
    var cI = new Array(17, 21, 25, 29, 13, 17, 21, 25, 9, 13, 17, 21, 5, 9, 13, 17);

    function VP8IteratorStartI4(a) {
        var b = a.enc_;
        var i;
        a.i4_ = 0;
        a.i4_top_ = a.i4_boundary_;
        a.i4_top_off = +cI[0];
        for (i = 0; i < 17; ++i) {
            a.i4_boundary_[i] = b.y_left_[b.y_left_off + 15 - i]
        }
        for (i = 0; i < 16; ++i) {
            a.i4_boundary_[17 + i] = b.y_top_[b.y_top_off + a.x_ * 16 + i]
        }
        if (a.x_ < b.mb_w_ - 1) {
            for (i = 16; i < 16 + 4; ++i) {
                a.i4_boundary_[17 + i] = b.y_top_[b.y_top_off + a.x_ * 16 + i]
            }
        } else {
            for (i = 16; i < 16 + 4; ++i) {
                a.i4_boundary_[17 + i] = a.i4_boundary_[17 + 15]
            }
        }
        VP8IteratorNzToBytes(a)
    }

    function VP8IteratorRotateI4(a, b, c) {
        var d = b;
        var e = c + di[a.i4_];
        var f = a.i4_top_;
        var g = a.i4_top_off;
        var i;
        for (i = 0; i <= 3; ++i) {
            f[g - 4 + i] = d[e + i + 3 * bf]
        }
        if ((a.i4_ & 3) != 3) {
            for (i = 0; i <= 2; ++i) {
                f[g + i] = d[e + 3 + (2 - i) * bf]
            }
        } else {
            for (i = 0; i <= 3; ++i) {
                f[g + i] = f[g + i + 4]
            }
        }
        a.i4_++;
        if (a.i4_ == 16) {
            return 0
        }
        a.i4_top_ = a.i4_boundary_;
        a.i4_top_off = +cI[a.i4_];
        return 1
    }
    var bc = 64;
    var cJ = 6;

    function ClipAlpha(a) {
        return a < 0 ? 0 : a > 255 ? 255 : a
    }

    function SmoothSegmentMap(a) {
        var n, x, y = int;
        var b = 0;
        var w = a.mb_w_;
        var h = a.mb_h_;
        var c = 5;
        var d = malloc(w * h * sizeof(uint8_t), uint8_t);
        var e = a.mb_info_;
        if (d == null) return;
        for (y = 1; y < h - 1; ++y) {
            for (x = 1; x < w - 1; ++x) {
                var f = Arr(be, 0);
                b = (x + w * y);
                var g = e[b].segment_;
                f[e[b - w - 1].segment_]++;
                f[e[b - w + 0].segment_]++;
                f[e[b - w + 1].segment_]++;
                f[e[b - 1].segment_]++;
                f[e[b + 1].segment_]++;
                f[e[b + w - 1].segment_]++;
                f[e[b + w + 0].segment_]++;
                f[e[b + w + 1].segment_]++;
                for (n = 0; n < be; ++n) {
                    if (f[n] >= c) {
                        e[b].segment_ = n
                    }
                }
                d[x + y * w] = g
            }
        }
        for (y = 1; y < h - 1; ++y) {
            for (x = 1; x < w - 1; ++x) {
                var e = a.mb_info_[x + w * y];
                e.segment_ = d[x + y * w]
            }
        }
        d = ''
    }

    function GetProba(a, b) {
        var c = int;
        var d = a + b;
        if (d == 0) return 255;
        c = parseInt((255 * a + d / 2) / d);
        return c
    }

    function SetSegmentProbas(a) {
        var p = Arr(be, 0);
        var n = int;
        for (n = 0; n < a.mb_w_ * a.mb_h_; ++n) {
            var b = a.mb_info_[n];
            p[b.segment_]++
        }
        if (a.pic_.stats_nozero) {
            for (n = 0; n < be; ++n) {
                a.pic_.stats.segment_size[n] = p[n]
            }
        }
        if (a.segment_hdr_.num_segments_ > 1) {
            var c = a.proba_.segments_;
            c[0] = GetProba(p[0] + p[1], p[2] + p[3]);
            c[1] = GetProba(p[0], p[1]);
            c[2] = GetProba(p[2], p[3]);
            a.segment_hdr_.update_map_ = (c[0] != 255) || (c[1] != 255) || (c[2] != 255) + 0;
            a.segment_hdr_.size_ = p[0] * (VP8BitCost(0, c[0]) + VP8BitCost(0, c[1])) + p[1] * (VP8BitCost(0, c[0]) + VP8BitCost(1, c[1])) + p[2] * (VP8BitCost(1, c[0]) + VP8BitCost(0, c[2])) + p[3] * (VP8BitCost(1, c[0]) + VP8BitCost(1, c[2]))
        } else {
            a.segment_hdr_.update_map_ = 0;
            a.segment_hdr_.size_ = 0
        }
    }

    function clip(v, m, M) {
        return v < m ? m : v > M ? M : v
    }

    function SetSegmentAlphas(a, b, c) {
        var d = a.segment_hdr_.num_segments_;
        var e = b[0],
            maxx = b[0];
        var n = int;
        if (d > 1) {
            for (n = 0; n < d; ++n) {
                if (e > b[n]) e = b[n];
                if (maxx < b[n]) maxx = b[n]
            }
        }
        if (maxx == e) maxx = e + 1;
        assert(c <= maxx && c >= e);
        for (n = 0; n < d; ++n) {
            var f = parseInt(255 * (b[n] - c) / (maxx - e));
            var g = parseInt(255 * (b[n] - e) / (maxx - e));
            a.dqm_[n].alpha_ = clip(f, -127, 127);
            a.dqm_[n].beta_ = clip(g, 0, 255)
        }
    }

    function AssignSegments(b, c) {
        var d = b.segment_hdr_.num_segments_;
        var e = Arr(be, int);
        var f = int;
        var g = Arr(256, int);
        var a, n, k;
        var h = 0,
            max_a = 255,
            range_a = int;
        var i = Arr(be, int),
            dist_accum = Arr(be, int);
        for (n = 0; n < 256 && c[n] == 0; ++n) {}
        h = n;
        for (n = 255; n > h && c[n] == 0; --n) {}
        max_a = n;
        range_a = max_a - h;
        for (n = 1, k = 0; n < 2 * d; n += 2) {
            e[k++] = parseInt(h + (n * range_a) / (2 * d))
        }
        for (k = 0; k < cJ; ++k) {
            var j = int;
            var l = int;
            for (n = 0; n < d; ++n) {
                i[n] = 0;
                dist_accum[n] = 0
            }
            var n = 0;
            for (a = h; a <= max_a; ++a) {
                if (c[a]) {
                    while (n < d - 1 && Math.abs(a - e[n + 1]) < Math.abs(a - e[n])) {
                        n++
                    }
                    g[a] = n;
                    dist_accum[n] += a * c[a];
                    i[n] += c[a]
                }
            }
            l = 0;
            f = 0;
            j = 0;
            for (n = 0; n < d; ++n) {
                if (i[n]) {
                    var m = parseInt((dist_accum[n] + i[n] / 2) / i[n]);
                    l += Math.abs(e[n] - m);
                    e[n] = m;
                    f += m * i[n];
                    j += i[n]
                }
            }
            f = parseInt((f + j / 2) / j);
            if (l < 5) break
        }
        for (n = 0; n < b.mb_w_ * b.mb_h_; ++n) {
            var o = b.mb_info_[n];
            var a = o.alpha_;
            o.segment_ = g[a];
            o.alpha_ = e[g[a]]
        }
        if (d > 1) {
            var p = (b.config_.preprocessing & 1);
            if (p) SmoothSegmentMap(b)
        }
        SetSegmentProbas(b);
        SetSegmentAlphas(b, e, f)
    }
    var cK = 2;
    var cL = 2;
    var cM = 2;

    function MBAnalyzeBestIntra16Mode(a) {
        var b = (a.enc_.method_ >= 3) ? cK : 4;
        var c;
        var d = -1;
        var e = 0;
        VP8MakeLuma16Preds(a);
        for (c = 0; c < b; ++c) {
            var f = dE(a.yuv_in_, a.yuv_in_off + bk, a.yuv_p_, a.yuv_p_off + df[c], 0, 16);
            if (f > d) {
                d = f;
                e = c
            }
        }
        VP8SetIntra16Mode(a, e);
        return d
    }

    function MBAnalyzeBestIntra4Mode(a, b) {
        var c = Arr(16, int);
        var d = (a.enc_.method_ >= 3) ? cL : NUM_BMODES;
        var e = 0;
        VP8IteratorStartI4(a);
        do {
            var f;
            var g = -1;
            var h = a.yuv_in_;
            var i = a.yuv_in_off + bk + di[a.i4_];
            VP8MakeIntra4Preds(a);
            for (f = 0; f < d; ++f) {
                var j = dE(h, i, a.yuv_p_, a.yuv_p_off + dh[f], 0, 1);
                if (j > g) {
                    g = j;
                    c[a.i4_] = f
                }
            }
            e += g
        } while (VP8IteratorRotateI4(a, a.yuv_in_, a.yuv_in_off + bk));
        if (e > b) {
            VP8SetIntra4Mode(a, c);
            b = ClipAlpha(e)
        }
        return b
    }

    function MBAnalyzeBestUVMode(a) {
        var b = -1;
        var c = 0;
        var d = (a.enc_.method_ >= 3) ? cM : 4;
        var e;
        VP8MakeChroma8Preds(a);
        for (e = 0; e < d; ++e) {
            var f = dE(a.yuv_in_, a.yuv_in_off + bl, a.yuv_p_, a.yuv_p_off + dg[e], 16, 16 + 4 + 4);
            if (f > b) {
                b = f;
                c = e
            }
        }
        VP8SetIntraUVMode(a, c);
        return b
    }

    function MBAnalyze(a, b, c) {
        var d = a.enc_;
        var e, best_uv_alpha = int;
        VP8SetIntra16Mode(a, 0);
        VP8SetSkip(a, 0);
        VP8SetSegment(a, 0);
        e = MBAnalyzeBestIntra16Mode(a);
        if (d.method_ != 3) {
            e = MBAnalyzeBestIntra4Mode(a, e)
        }
        best_uv_alpha = MBAnalyzeBestUVMode(a);
        e = parseInt((e + best_uv_alpha + 1) / 2);
        b[e]++;
        c += best_uv_alpha;
        a.mb_[a.mb_off].alpha_ = e;
        return c
    }

    function VP8EncAnalyze(a) {
        var b = Arr(256, 0);
        var c = newObjectIt(bV);
        VP8IteratorInit(a, c);
        a.uv_alpha_ = 0;
        do {
            VP8IteratorImport(c);
            a.uv_alpha_ = MBAnalyze(c, b, a.uv_alpha_)
        } while (VP8IteratorNext(c, c.yuv_in_, c.yuv_in_off));
        a.uv_alpha_ /= a.mb_w_ * a.mb_h_;
        a.uv_alpha_ = parseInt(a.uv_alpha_);
        AssignSegments(a, b);
        return 1
    }
    var cN = 1;
    var cO = 1;
    var cP = 0;
    var cQ = 1;
    var cR = 64;
    var cS = 30;
    var cT = 100;
    var cU = 0.9;

    function MULT_8B(a, b) {
        return (((a) * (b) + 128) >> 8)
    }

    function clip(v, m, M) {
        return v < m ? m : v > M ? M : v
    }
    var cV = new Array(0, 1, 4, 8, 5, 2, 3, 6, 9, 12, 13, 10, 7, 11, 14, 15);
    var cW = new Array(4, 5, 6, 7, 8, 9, 10, 10, 11, 12, 13, 14, 15, 16, 17, 17, 18, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 25, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 93, 95, 96, 98, 100, 101, 102, 104, 106, 108, 110, 112, 114, 116, 118, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 143, 145, 148, 151, 154, 157);
    var cX = new Array(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 119, 122, 125, 128, 131, 134, 137, 140, 143, 146, 149, 152, 155, 158, 161, 164, 167, 170, 173, 177, 181, 185, 189, 193, 197, 201, 205, 209, 213, 217, 221, 225, 229, 234, 239, 245, 249, 254, 259, 264, 269, 274, 279, 284);
    var cY = new Array(8, 8, 9, 10, 12, 13, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 31, 32, 34, 35, 37, 38, 40, 41, 43, 44, 46, 48, 49, 51, 52, 54, 55, 57, 58, 60, 62, 63, 65, 66, 68, 69, 71, 72, 74, 75, 77, 79, 80, 82, 83, 85, 86, 88, 89, 93, 96, 99, 102, 105, 108, 111, 114, 117, 120, 124, 127, 130, 133, 136, 139, 142, 145, 148, 151, 155, 158, 161, 164, 167, 170, 173, 176, 179, 184, 189, 193, 198, 203, 207, 212, 217, 221, 226, 230, 235, 240, 244, 249, 254, 258, 263, 268, 274, 280, 286, 292, 299, 305, 311, 317, 323, 330, 336, 342, 348, 354, 362, 370, 379, 385, 393, 401, 409, 416, 424, 432, 440);
    var cZ = new Array(0, 10, 20, 30, 10, 20, 30, 30, 20, 30, 30, 30, 30, 30, 30, 30);
    var da = new Array(new Array(96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96), new Array(96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96), new Array(96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96, 96));
    var db = new Array(0, 30, 60, 90, 30, 60, 90, 90, 60, 90, 90, 90, 90, 90, 90, 90);

    function ExpandMatrix(m, a) {
        var i;
        var b = 0;
        for (i = 2; i < 16; ++i) {
            m.q_[i] = m.q_[1]
        }
        for (i = 0; i < 16; ++i) {
            var j = cV[i];
            var c = da[a][j];
            m.iq_[j] = parseInt((1 << bI) / m.q_[j]);
            m.bias_[j] = BIAS(c);
            m.zthresh_[j] = ((256 - c) * m.q_[j] + 127) >> 8;
            m.sharpen_[j] = (db[j] * m.q_[j]) >> 11;
            b += m.q_[j]
        }
        return (b + 8) >> 4
    }

    function SetupMatrices(a) {
        var i;
        var b = (a.method_ >= 4) ? a.config_.sns_strength : 0;
        var c = a.segment_hdr_.num_segments_;
        for (i = 0; i < c; ++i) {
            var m = a.dqm_[i];
            var q = m.quant_;
            var d = int,
                q16 = int,
                quv = int;
            m.y1_.q_[0] = cW[clip(q + a.dq_y1_dc_, 0, 127)];
            m.y1_.q_[1] = cX[clip(q, 0, 127)];
            m.y2_.q_[0] = cW[clip(q + a.dq_y2_dc_, 0, 127)] * 2;
            m.y2_.q_[1] = cY[clip(q + a.dq_y2_ac_, 0, 127)];
            m.uv_.q_[0] = cW[clip(q + a.dq_uv_dc_, 0, 117)];
            m.uv_.q_[1] = cX[clip(q + a.dq_uv_ac_, 0, 127)];
            d = ExpandMatrix(m.y1_, 0);
            q16 = ExpandMatrix(m.y2_, 1);
            quv = ExpandMatrix(m.uv_, 2); {
                m.lambda_i4_ = (3 * d * d) >> 7;
                m.lambda_i16_ = (3 * q16 * q16);
                m.lambda_uv_ = (3 * quv * quv) >> 6;
                m.lambda_mode_ = (1 * d * d) >> 7;
                m.lambda_trellis_i4_ = (7 * d * d) >> 3;
                m.lambda_trellis_i16_ = (q16 * q16) >> 2;
                m.lambda_trellis_uv_ = (quv * quv) << 1;
                m.tlambda_ = (b * d) >> 5
            }
        }
    }
    var dc = 3;

    function SetupFilterStrength(a) {
        var i;
        var b = a.config_.filter_strength;
        for (i = 0; i < be; ++i) {
            var c = parseInt(b * 256 * a.dqm_[i].quant_ / 128);
            var f = parseInt(c / (256 + a.dqm_[i].beta_));
            a.dqm_[i].fstrength_ = (f < dc) ? 0 : (f > 63) ? 63 : f
        }
        a.filter_hdr_.level_ = a.dqm_[0].fstrength_;
        a.filter_hdr_.simple_ = (a.config_.filter_type == 0) + 0;
        a.filter_hdr_.sharpness_ = a.config_.filter_sharpness
    }
    var dd = (6);
    var de = (-4);

    function QualityToCompression(q) {
        var c = q / 100.;
        return (c < 0.75) ? c * (2. / 3.) : 2. * c - 1.
    }

    function VP8SetSegmentParams(a, b) {
        var i;
        var d, dq_uv_dc = int;
        var e = a.config_.segments;
        var f = cU * a.config_.sns_strength / 100. / 128.;
        var g = QualityToCompression(b);
        for (i = 0; i < e; ++i) {
            var h = (1. - f * a.dqm_[i].alpha_) / 3.;
            var c = Math.pow(g, h);
            var q = parseInt((127. * (1. - c)));
            assert(h > 0.);
            a.dqm_[i].quant_ = clip(q, 0, 127)
        }
        a.base_quant_ = a.dqm_[0].quant_;
        for (i = e; i < be; ++i) {
            a.dqm_[i].quant_ = a.base_quant_
        }
        d = parseInt((a.uv_alpha_ - cR) * (dd - de) / (cT - cS));
        d = parseInt(d * a.config_.sns_strength / 100);
        d = clip(d, de, dd);
        dq_uv_dc = parseInt(-4 * a.config_.sns_strength / 100);
        dq_uv_dc = clip(dq_uv_dc, -15, 15);
        a.dq_y1_dc_ = 0;
        a.dq_y2_dc_ = 0;
        a.dq_y2_ac_ = 0;
        a.dq_uv_dc_ = dq_uv_dc;
        a.dq_uv_ac_ = d;
        SetupMatrices(a);
        SetupFilterStrength(a)
    }
    var df = new Array(bo, bp, bq, br);
    var dg = new Array(bs, bt, bu, bv);
    var dh = new Array(bw, bx, by, bz, bA, bB, bC, bD, bE, bF);

    function VP8MakeLuma16Preds(a) {
        var b = a.enc_;
        var c = a.x_ ? b.y_left_ : null;
        var d = a.x_ ? b.y_left_off : null;
        var e = a.y_ ? b.y_top_ : null;
        var f = a.y_ ? b.y_top_off + a.x_ * 16 : null;
        dK(a.yuv_p_, a.yuv_p_off, c, d, e, f)
    }

    function VP8MakeChroma8Preds(a) {
        var b = a.enc_;
        var c = a.x_ ? b.u_left_ : null;
        var d = a.x_ ? b.u_left_off : null;
        var e = a.y_ ? b.uv_top_ : null;
        var f = a.y_ ? b.uv_top_off + a.x_ * 16 : null;
        dL(a.yuv_p_, a.yuv_p_off, c, d, e, f)
    }

    function VP8MakeIntra4Preds(a) {
        dJ(a.yuv_p_, a.yuv_p_off, a.i4_top_, a.i4_top_off)
    }
    var di = new Array(0 + 0 * bf, 4 + 0 * bf, 8 + 0 * bf, 12 + 0 * bf, 0 + 4 * bf, 4 + 4 * bf, 8 + 4 * bf, 12 + 4 * bf, 0 + 8 * bf, 4 + 8 * bf, 8 + 8 * bf, 12 + 8 * bf, 0 + 12 * bf, 4 + 12 * bf, 8 + 12 * bf, 12 + 12 * bf, 0 + 0 * bf, 4 + 0 * bf, 0 + 4 * bf, 4 + 4 * bf, 8 + 0 * bf, 12 + 0 * bf, 8 + 4 * bf, 12 + 4 * bf);
    var dj = new Array(38, 32, 20, 9, 32, 28, 17, 7, 20, 17, 10, 4, 9, 7, 4, 2);
    var dk = new Array(30, 27, 19, 11, 27, 24, 17, 10, 19, 17, 12, 8, 11, 10, 8, 6);

    function InitScore(a) {
        a.D = 0;
        a.SD = 0;
        a.R = 0;
        a.nz = 0;
        a.score = bH
    }

    function CopyScore(a, b) {
        a.D = (b.D);
        a.SD = (b.SD);
        a.R = (b.R);
        a.nz = (b.nz);
        a.score = (b.score)
    }

    function AddScore(a, b) {
        a.D += b.D;
        a.SD += b.SD;
        a.R += b.R;
        a.nz |= b.nz;
        a.score += b.score
    }
    var dl = {
        prev: int,
        level: int,
        sign: int,
        cost: score_t,
        error: score_t,
        ctx: int
    };
    var dm = 0;
    var dn = 1;
    var dp = (dm + 1 + dn);

    function SetRDScore(a, b) {
        b.score = b.R * a + 256 * (b.D + b.SD)
    }

    function RDScoreTrellis(a, b, c) {
        return b * a + 256 * c
    }

    function TrellisQuantizeBlock(a, b, c, d, e, f, g) {
        var h = a.enc_.proba_.coeffs_[e];
        var i = a.enc_.proba_.level_cost_[e];
        var k = (e == 0) ? 1 : 0;
        var l = ArrM(new Array(17, dp), dl);
        var o = new Array(-1, -1, -1);
        var q = score_t;
        var r;
        var s = k - 1;
        var n = int,
            m = int,
            p = int,
            nz = int; {
            var t = score_t;
            var u = score_t;
            var v = parseInt(f.q_[1] * f.q_[1] / 4);
            var w = h[cw[k]][d][0];
            u = 0;
            for (n = k; n < 16; ++n) {
                var j = cV[n];
                var x = b[j] * b[j];
                u += dk[j] * x;
                if (x > v) s = n
            }
            if (s < 15) ++s;
            t = VP8BitCost(0, w);
            q = RDScoreTrellis(g, t, u);
            n = k - 1;
            for (m = -dm; m <= dn; ++m) {
                l[n + 1][m + dm].cost = 0;
                l[n + 1][m + dm].error = u;
                l[n + 1][m + dm].ctx = d
            }
        }
        for (n = k; n <= s; ++n) {
            var j = cV[n];
            var Q = f.q_[j];
            var y = f.iq_[j];
            var B = BIAS(0x00);
            var z = (b[j] < 0) + 0;
            var A = (z ? -b[j] : b[j]) + f.sharpen_[j];
            var C;
            if (A > 2047) A = 2047;
            C = QUANTDIV(A, y, B);
            for (m = -dm; m <= dn; ++m) {
                var D = l[n + 1][m + dm];
                var E, new_error;
                var F = bH;
                var G = C + m;
                var w;
                D.sign = z;
                D.level = G;
                D.ctx = (G == 0) ? 0 : (G == 1) ? 1 : 2;
                if (G >= 2048 || G < 0) {
                    D.cost = bH;
                    continue
                }
                w = h[cw[n + 1]][D.ctx][0];
                new_error = A - G * Q;
                E = dk[j] * (A * A - new_error * new_error);
                for (p = -dm; p <= dn; ++p) {
                    var H = l[n - 1 + 1][p + dm];
                    var I = H.ctx;
                    var J = i[cw[n]][I];
                    var K = H.error - E;
                    var t = score_t,
                        base_cost = score_t,
                        score = score_t;
                    if (H.cost >= bH) {
                        continue
                    }
                    base_cost = H.cost + VP8LevelCost(J, G);
                    t = base_cost;
                    if (G && n < 15) {
                        t += VP8BitCost(1, w)
                    }
                    score = RDScoreTrellis(g, t, K);
                    if (score < F) {
                        F = score;
                        D.cost = t;
                        D.error = K;
                        D.prev = p
                    }
                    if (G) {
                        t = base_cost;
                        if (n < 15) t += VP8BitCost(0, w);
                        score = RDScoreTrellis(g, t, K);
                        if (score < q) {
                            q = score;
                            o[0] = n;
                            o[1] = m;
                            o[2] = p
                        }
                    }
                }
            }
        }
        memset_(b, +k, 0, (16 - k) * sizeof(b));
        memset_(c, +k, 0, (16 - k) * sizeof(c));
        if (o[0] == -1) {
            return 0
        }
        n = o[0];
        r = o[1];
        l[n + 1][r + dm].prev = o[2];
        nz = 0;
        for (; n >= k; --n) {
            var L = l[n + 1][r + dm];
            var j = cV[n];
            c[n] = L.sign ? -L.level : L.level;
            nz |= (L.level != 0);
            b[j] = c[n] * f.q_[j];
            r = L.prev
        }
        return nz
    }

    function ReconstructIntra16(a, b, c, d, e) {
        var f = a.enc_;
        var g = a.yuv_p_;
        var h = a.yuv_p_off + df[e];
        var i = a.yuv_in_;
        var j = a.yuv_in_off + bk;
        var k = f.dqm_[a.mb_[a.mb_off].segment_];
        var l = 0;
        var n = int;
        var m = ArrM(Array(16, 16), int16_t),
            dc_tmp = Arr(16, int16_t);
        for (n = 0; n < 16; ++n) {
            dG(i, j + di[n], g, h + di[n], m[n])
        }
        dI(m, dc_tmp);
        l |= dS(dc_tmp, b.y_dc_levels, 0, k.y2_) << 24;
        if (cO && a.do_trellis_) {
            var x, y;
            VP8IteratorNzToBytes(a);
            for (y = 0, n = 0; y < 4; ++y) {
                for (x = 0; x < 4; ++x) {
                    var o = a.top_nz_[x] + a.left_nz_[y];
                    var p = TrellisQuantizeBlock(a, m[n], b.y_ac_levels[n], o, 0, k.y1_, k.lambda_trellis_i16_);
                    a.top_nz_[x] = a.left_nz_[y] = p;
                    l |= p << n;
                    ++n
                }
            }
        } else {
            for (n = 0; n < 16; ++n) {
                l |= dS(m[n], b.y_ac_levels[n], 1, k.y1_) << n
            }
        }
        dH(dc_tmp, m);
        for (n = 0; n < 16; n += 2) {
            dF(g, h + di[n], m[n], 0, c, d + di[n], 1)
        }
        return l
    }

    function ReconstructIntra4(a, b, c, d, e, f, g) {
        var h = a.enc_;
        var i = a.yuv_p_;
        var j = a.yuv_p_off + dh[g];
        var k = h.dqm_[a.mb_[a.mb_off].segment_];
        var l = 0;
        var m = Arr(16, int16_t);
        dG(c, d, i, j, m);
        if (cN && a.do_trellis_) {
            var x = a.i4_ & 3,
                y = a.i4_ >> 2;
            var n = a.top_nz_[x] + a.left_nz_[y];
            l = TrellisQuantizeBlock(a, m, b, n, 3, k.y1_, k.lambda_trellis_i4_)
        } else {
            l = dS(m, b, 0, k.y1_)
        }
        dF(i, j, m, 0, e, f, 0);
        return l
    }

    function ReconstructUV(a, b, c, d, e) {
        var f = a.enc_;
        var g = a.yuv_p_;
        var h = a.yuv_p_off + dg[e];
        var i = a.yuv_in_;
        var j = a.yuv_in_off + bl;
        var k = f.dqm_[a.mb_[a.mb_off].segment_];
        var l = 0;
        var n;
        var m = ArrM(new Array(8, 16), int16_t);
        for (n = 0; n < 8; ++n) {
            dG(i, j + di[16 + n], g, h + di[16 + n], m[n])
        }
        if (cP && a.do_trellis_) {
            var o, x, y;
            for (o = 0; o <= 2; o += 2) {
                n = 0;
                for (y = 0; y < 2; ++y) {
                    for (x = 0; x < 2; ++x) {
                        var p = a.top_nz_[4 + o + x] + a.left_nz_[4 + o + y];
                        var q = TrellisQuantizeBlock(a, m[n], b.uv_levels[n], p, 2, k.uv_, k.lambda_trellis_uv_);
                        a.top_nz_[4 + o + x] = a.left_nz_[4 + o + y] = q;
                        l |= q << n;
                        ++n
                    }
                }
            }
        } else {
            for (n = 0; n < 8; ++n) {
                l |= dS(m[n], b.uv_levels[n], 0, k.uv_) << n
            }
        }
        for (n = 0; n < 8; n += 1) {
            dF(g, h + di[16 + n], m[n], 0, c, d + di[16 + n], 0)
        }
        return (l << 16)
    }

    function SwapPtr(a, c, b, d) {}

    function SwapOut(a) {
        var b = (a.yuv_out_);
        var c = (a.yuv_out_off);
        a.yuv_out_ = (a.yuv_out2_);
        a.yuv_out_off = (a.yuv_out2_off);
        a.yuv_out2_ = (b);
        a.yuv_out2_off = (c)
    }
    var dq = newObjectIt(bU);

    function PickBestIntra16(a, b) {
        var c = a.enc_;
        var d = c.dqm_[a.mb_[a.mb_off].segment_];
        var e = d.lambda_i16_;
        var f = d.tlambda_;
        var g = a.yuv_in_;
        var h = a.yuv_in_off + bk;
        var i = (dq);
        var j;
        b.mode_i16 = -1;
        for (j = 0; j < 4; ++j) {
            var k = a.yuv_out2_;
            var l = a.yuv_out2_off + bk;
            var m = int;
            m = ReconstructIntra16(a, i, k, l, j);
            i.D = dM(g, h, k, l);
            i.SD = f ? MULT_8B(f, dR(g, h, k, l, dj)) : 0;
            i.R = VP8GetCostLuma16(a, i);
            i.R += ct[j];
            SetRDScore(e, i);
            if (j == 0 || i.score < b.score) {
                CopyScore(b, i);
                b.mode_i16 = j;
                b.nz = m;
                memcpyArrM(b.y_ac_levels, 0, i.y_ac_levels, 0, i.y_ac_levels.length);
                memcpy(b.y_dc_levels, 0, i.y_dc_levels, 0, i.y_dc_levels.length);
                SwapOut(a)
            }
        }
        SetRDScore(d.lambda_mode_, b);
        VP8SetIntra16Mode(a, b.mode_i16)
    }

    function GetCostModeI4(a, b) {
        var c = a.enc_.preds_w_;
        var x = (a.i4_ & 3),
            y = a.i4_ >> 2;
        var d = (x == 0) ? a.preds_[a.preds_off + y * c - 1] : b[a.i4_ - 1];
        var e = (y == 0) ? a.preds_[a.preds_off - c + x] : b[a.i4_ - 4];
        return cu[e][d]
    }
    var dr = newObjectIt(bU);
    var ds = newObjectIt(bU);
    var dt = newObjectIt(bU);

    function PickBestIntra4(a, b) {
        var c = a.enc_;
        var d = c.dqm_[a.mb_[a.mb_off].segment_];
        var e = d.lambda_i4_;
        var f = d.tlambda_;
        var g = a.yuv_in_;
        var h = a.yuv_in_off + bk;
        var i = a.yuv_out2_;
        var j = a.yuv_out2_off + bk;
        var k = 0;
        var l = (dr);
        if (c.max_i4_header_bits_ == 0) {
            return 0
        }
        InitScore(l);
        l.score = 211;
        VP8IteratorStartI4(a);
        do {
            var m = (ds);
            var n;
            var o = -1;
            var p = g;
            var q = h + di[a.i4_];
            var r = GetCostModeI4(a, b.modes_i4);
            var s = (i);
            var t = (j + di[a.i4_]);
            var u = (a.yuv_p_);
            var v = (a.yuv_p_off + bG);
            InitScore(m);
            VP8MakeIntra4Preds(a);
            for (n = 0; n < NUM_BMODES; ++n) {
                var w = (dt);
                var x = Arr(16, int16_t);
                w.nz = ReconstructIntra4(a, x, p, q, u, v, n) << a.i4_;
                w.D = dP(p, q, u, v);
                w.SD = f ? MULT_8B(f, dQ(p, q, u, v, dj)) : 0;
                w.R = VP8GetCostLuma4(a, x);
                w.R += r[n];
                SetRDScore(e, w);
                if (o < 0 || w.score < m.score) {
                    CopyScore(m, w);
                    o = n;
                    var y = (u);
                    var z = (v);
                    u = (s);
                    v = (t);
                    s = (y);
                    t = (z);
                    memcpy(l.y_ac_levels[a.i4_], 0, x, 0, sizeof(x) * 16)
                }
            }
            SetRDScore(d.lambda_mode_, m);
            AddScore(l, m);
            k += r[o];
            if (l.score >= b.score || k > c.max_i4_header_bits_) {
                return 0
            }
            if (t != j + di[a.i4_]) dT(s, t, i, j + di[a.i4_]);
            b.modes_i4[a.i4_] = o;
            a.top_nz_[a.i4_ & 3] = a.left_nz_[a.i4_ >> 2] = (m.nz ? 1 : 0)
        } while (VP8IteratorRotateI4(a, i, j));
        CopyScore(b, l);
        VP8SetIntra4Mode(a, b.modes_i4);
        SwapOut(a);
        memcpyArrM(b.y_ac_levels, 0, l.y_ac_levels, 0, b.y_ac_levels.length);
        return 1
    }
    var du = newObjectIt(bU);
    var dv = newObjectIt(bU);

    function PickBestUV(a, b) {
        var c = a.enc_;
        var d = c.dqm_[a.mb_[a.mb_off].segment_];
        var e = d.lambda_uv_;
        var f = a.yuv_in_;
        var g = a.yuv_in_off + bl;
        var h = a.yuv_out2_;
        var i = a.yuv_out2_off + bl;
        var j = a.yuv_out_;
        var k = a.yuv_out_off + bl;
        var l = (du);
        var m;
        b.mode_uv = -1;
        InitScore(l);
        for (m = 0; m < 4; ++m) {
            var n = (dv);
            n.nz = ReconstructUV(a, n, h, i, m);
            n.D = dO(f, g, h, i);
            n.SD = 0;
            n.R = VP8GetCostUV(a, n);
            n.R += cs[m];
            SetRDScore(e, n);
            if (m == 0 || n.score < l.score) {
                CopyScore(l, n);
                b.mode_uv = m;
                memcpyArrM(b.uv_levels, 0, n.uv_levels, 0, b.uv_levels.length);
                memcpy(j, k, h, i, bh)
            }
        }
        VP8SetIntraUVMode(a, b.mode_uv);
        AddScore(b, l)
    }

    function SimpleQuantize(a, b) {
        var c = a.enc_;
        var d = (a.mb_[a.mb_off].type_ == 1);
        var e = 0;
        if (d) {
            e = ReconstructIntra16(a, b, a.yuv_out_, a.yuv_out_off + bk, a.preds_[a.preds_off + 0])
        } else {
            VP8IteratorStartI4(a);
            do {
                var f = a.preds_[a.preds_off + (a.i4_ & 3) + (a.i4_ >> 2) * c.preds_w_];
                var g = a.yuv_in_;
                var h = a.yuv_in_off + bk + di[a.i4_];
                var i = a.yuv_out_;
                var j = a.yuv_out_off + bk + di[a.i4_];
                VP8MakeIntra4Preds(a);
                e |= ReconstructIntra4(a, b.y_ac_levels[a.i4_], g, h, i, j, f) << a.i4_
            } while (VP8IteratorRotateI4(a, a.yuv_out_, a.yuv_out_off + bk))
        }
        e |= ReconstructUV(a, b, a.yuv_out_, a.yuv_out_off + bl, a.mb_[a.mb_off].uv_mode_);
        b.nz = e
    }

    function VP8Decimate(a, b, c) {
        var d = int;
        InitScore(b);
        VP8MakeLuma16Preds(a);
        VP8MakeChroma8Preds(a);
        if (c > 0) {
            a.do_trellis_ = (c > 2) + 0;
            PickBestIntra16(a, b);
            if (a.enc_.method_ >= 2) {
                PickBestIntra4(a, b)
            }
            PickBestUV(a, b);
            if (c == 2) {
                a.do_trellis_ = 1;
                SimpleQuantize(a, b)
            }
        } else {
            a.do_trellis_ = (a.enc_.method_ == 2) + 0;
            SimpleQuantize(a, b)
        }
        d = (b.nz == 0) + 0;
        VP8SetSkip(a, d);
        return d
    }
    var dw = new Array(new Array(new Array(new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128), new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128), new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128)), new Array(new Array(253, 136, 254, 255, 228, 219, 128, 128, 128, 128, 128), new Array(189, 129, 242, 255, 227, 213, 255, 219, 128, 128, 128), new Array(106, 126, 227, 252, 214, 209, 255, 255, 128, 128, 128)), new Array(new Array(1, 98, 248, 255, 236, 226, 255, 255, 128, 128, 128), new Array(181, 133, 238, 254, 221, 234, 255, 154, 128, 128, 128), new Array(78, 134, 202, 247, 198, 180, 255, 219, 128, 128, 128)), new Array(new Array(1, 185, 249, 255, 243, 255, 128, 128, 128, 128, 128), new Array(184, 150, 247, 255, 236, 224, 128, 128, 128, 128, 128), new Array(77, 110, 216, 255, 236, 230, 128, 128, 128, 128, 128)), new Array(new Array(1, 101, 251, 255, 241, 255, 128, 128, 128, 128, 128), new Array(170, 139, 241, 252, 236, 209, 255, 255, 128, 128, 128), new Array(37, 116, 196, 243, 228, 255, 255, 255, 128, 128, 128)), new Array(new Array(1, 204, 254, 255, 245, 255, 128, 128, 128, 128, 128), new Array(207, 160, 250, 255, 238, 128, 128, 128, 128, 128, 128), new Array(102, 103, 231, 255, 211, 171, 128, 128, 128, 128, 128)), new Array(new Array(1, 152, 252, 255, 240, 255, 128, 128, 128, 128, 128), new Array(177, 135, 243, 255, 234, 225, 128, 128, 128, 128, 128), new Array(80, 129, 211, 255, 194, 224, 128, 128, 128, 128, 128)), new Array(new Array(1, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(246, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(255, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128))), new Array(new Array(new Array(198, 35, 237, 223, 193, 187, 162, 160, 145, 155, 62), new Array(131, 45, 198, 221, 172, 176, 220, 157, 252, 221, 1), new Array(68, 47, 146, 208, 149, 167, 221, 162, 255, 223, 128)), new Array(new Array(1, 149, 241, 255, 221, 224, 255, 255, 128, 128, 128), new Array(184, 141, 234, 253, 222, 220, 255, 199, 128, 128, 128), new Array(81, 99, 181, 242, 176, 190, 249, 202, 255, 255, 128)), new Array(new Array(1, 129, 232, 253, 214, 197, 242, 196, 255, 255, 128), new Array(99, 121, 210, 250, 201, 198, 255, 202, 128, 128, 128), new Array(23, 91, 163, 242, 170, 187, 247, 210, 255, 255, 128)), new Array(new Array(1, 200, 246, 255, 234, 255, 128, 128, 128, 128, 128), new Array(109, 178, 241, 255, 231, 245, 255, 255, 128, 128, 128), new Array(44, 130, 201, 253, 205, 192, 255, 255, 128, 128, 128)), new Array(new Array(1, 132, 239, 251, 219, 209, 255, 165, 128, 128, 128), new Array(94, 136, 225, 251, 218, 190, 255, 255, 128, 128, 128), new Array(22, 100, 174, 245, 186, 161, 255, 199, 128, 128, 128)), new Array(new Array(1, 182, 249, 255, 232, 235, 128, 128, 128, 128, 128), new Array(124, 143, 241, 255, 227, 234, 128, 128, 128, 128, 128), new Array(35, 77, 181, 251, 193, 211, 255, 205, 128, 128, 128)), new Array(new Array(1, 157, 247, 255, 236, 231, 255, 255, 128, 128, 128), new Array(121, 141, 235, 255, 225, 227, 255, 255, 128, 128, 128), new Array(45, 99, 188, 251, 195, 217, 255, 224, 128, 128, 128)), new Array(new Array(1, 1, 251, 255, 213, 255, 128, 128, 128, 128, 128), new Array(203, 1, 248, 255, 255, 128, 128, 128, 128, 128, 128), new Array(137, 1, 177, 255, 224, 255, 128, 128, 128, 128, 128))), new Array(new Array(new Array(253, 9, 248, 251, 207, 208, 255, 192, 128, 128, 128), new Array(175, 13, 224, 243, 193, 185, 249, 198, 255, 255, 128), new Array(73, 17, 171, 221, 161, 179, 236, 167, 255, 234, 128)), new Array(new Array(1, 95, 247, 253, 212, 183, 255, 255, 128, 128, 128), new Array(239, 90, 244, 250, 211, 209, 255, 255, 128, 128, 128), new Array(155, 77, 195, 248, 188, 195, 255, 255, 128, 128, 128)), new Array(new Array(1, 24, 239, 251, 218, 219, 255, 205, 128, 128, 128), new Array(201, 51, 219, 255, 196, 186, 128, 128, 128, 128, 128), new Array(69, 46, 190, 239, 201, 218, 255, 228, 128, 128, 128)), new Array(new Array(1, 191, 251, 255, 255, 128, 128, 128, 128, 128, 128), new Array(223, 165, 249, 255, 213, 255, 128, 128, 128, 128, 128), new Array(141, 124, 248, 255, 255, 128, 128, 128, 128, 128, 128)), new Array(new Array(1, 16, 248, 255, 255, 128, 128, 128, 128, 128, 128), new Array(190, 36, 230, 255, 236, 255, 128, 128, 128, 128, 128), new Array(149, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128)), new Array(new Array(1, 226, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(247, 192, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(240, 128, 255, 128, 128, 128, 128, 128, 128, 128, 128)), new Array(new Array(1, 134, 252, 255, 255, 128, 128, 128, 128, 128, 128), new Array(213, 62, 250, 255, 255, 128, 128, 128, 128, 128, 128), new Array(55, 93, 255, 128, 128, 128, 128, 128, 128, 128, 128)), new Array(new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128), new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128), new Array(128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128))), new Array(new Array(new Array(202, 24, 213, 235, 186, 191, 220, 160, 240, 175, 255), new Array(126, 38, 182, 232, 169, 184, 228, 174, 255, 187, 128), new Array(61, 46, 138, 219, 151, 178, 240, 170, 255, 216, 128)), new Array(new Array(1, 112, 230, 250, 199, 191, 247, 159, 255, 255, 128), new Array(166, 109, 228, 252, 211, 215, 255, 174, 128, 128, 128), new Array(39, 77, 162, 232, 172, 180, 245, 178, 255, 255, 128)), new Array(new Array(1, 52, 220, 246, 198, 199, 249, 220, 255, 255, 128), new Array(124, 74, 191, 243, 183, 193, 250, 221, 255, 255, 128), new Array(24, 71, 130, 219, 154, 170, 243, 182, 255, 255, 128)), new Array(new Array(1, 182, 225, 249, 219, 240, 255, 224, 128, 128, 128), new Array(149, 150, 226, 252, 216, 205, 255, 171, 128, 128, 128), new Array(28, 108, 170, 242, 183, 194, 254, 223, 255, 255, 128)), new Array(new Array(1, 81, 230, 252, 204, 203, 255, 192, 128, 128, 128), new Array(123, 102, 209, 247, 188, 196, 255, 233, 128, 128, 128), new Array(20, 95, 153, 243, 164, 173, 255, 203, 128, 128, 128)), new Array(new Array(1, 222, 248, 255, 216, 213, 128, 128, 128, 128, 128), new Array(168, 175, 246, 252, 235, 205, 255, 255, 128, 128, 128), new Array(47, 116, 215, 255, 211, 212, 255, 255, 128, 128, 128)), new Array(new Array(1, 121, 236, 253, 212, 214, 255, 255, 128, 128, 128), new Array(141, 84, 213, 252, 201, 202, 255, 219, 128, 128, 128), new Array(42, 80, 160, 240, 162, 185, 255, 205, 128, 128, 128)), new Array(new Array(1, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(244, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128), new Array(238, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128))));

    function VP8DefaultProbas(a) {
        var b = a.proba_;
        for (var i = 0; i < b.segments_.length; ++i) b.segments_[i] = 255;
        b.coeffs_ = newObjectIt(dw);
        b.use_skip_proba_ = 0
    }
    var dx = new Array(new Array(new Array(231, 120, 48, 89, 115, 113, 120, 152, 112), new Array(152, 179, 64, 126, 170, 118, 46, 70, 95), new Array(175, 69, 143, 80, 85, 82, 72, 155, 103), new Array(56, 58, 10, 171, 218, 189, 17, 13, 152), new Array(114, 26, 17, 163, 44, 195, 21, 10, 173), new Array(121, 24, 80, 195, 26, 62, 44, 64, 85), new Array(144, 71, 10, 38, 171, 213, 144, 34, 26), new Array(170, 46, 55, 19, 136, 160, 33, 206, 71), new Array(63, 20, 8, 114, 114, 208, 12, 9, 226), new Array(81, 40, 11, 96, 182, 84, 29, 16, 36)), new Array(new Array(134, 183, 89, 137, 98, 101, 106, 165, 148), new Array(72, 187, 100, 130, 157, 111, 32, 75, 80), new Array(66, 102, 167, 99, 74, 62, 40, 234, 128), new Array(41, 53, 9, 178, 241, 141, 26, 8, 107), new Array(74, 43, 26, 146, 73, 166, 49, 23, 157), new Array(65, 38, 105, 160, 51, 52, 31, 115, 128), new Array(104, 79, 12, 27, 217, 255, 87, 17, 7), new Array(87, 68, 71, 44, 114, 51, 15, 186, 23), new Array(47, 41, 14, 110, 182, 183, 21, 17, 194), new Array(66, 45, 25, 102, 197, 189, 23, 18, 22)), new Array(new Array(88, 88, 147, 150, 42, 46, 45, 196, 205), new Array(43, 97, 183, 117, 85, 38, 35, 179, 61), new Array(39, 53, 200, 87, 26, 21, 43, 232, 171), new Array(56, 34, 51, 104, 114, 102, 29, 93, 77), new Array(39, 28, 85, 171, 58, 165, 90, 98, 64), new Array(34, 22, 116, 206, 23, 34, 43, 166, 73), new Array(107, 54, 32, 26, 51, 1, 81, 43, 31), new Array(68, 25, 106, 22, 64, 171, 36, 225, 114), new Array(34, 19, 21, 102, 132, 188, 16, 76, 124), new Array(62, 18, 78, 95, 85, 57, 50, 48, 51)), new Array(new Array(193, 101, 35, 159, 215, 111, 89, 46, 111), new Array(60, 148, 31, 172, 219, 228, 21, 18, 111), new Array(112, 113, 77, 85, 179, 255, 38, 120, 114), new Array(40, 42, 1, 196, 245, 209, 10, 25, 109), new Array(88, 43, 29, 140, 166, 213, 37, 43, 154), new Array(61, 63, 30, 155, 67, 45, 68, 1, 209), new Array(100, 80, 8, 43, 154, 1, 51, 26, 71), new Array(142, 78, 78, 16, 255, 128, 34, 197, 171), new Array(41, 40, 5, 102, 211, 183, 4, 1, 221), new Array(51, 50, 17, 168, 209, 192, 23, 25, 82)), new Array(new Array(138, 31, 36, 171, 27, 166, 38, 44, 229), new Array(67, 87, 58, 169, 82, 115, 26, 59, 179), new Array(63, 59, 90, 180, 59, 166, 93, 73, 154), new Array(40, 40, 21, 116, 143, 209, 34, 39, 175), new Array(47, 15, 16, 183, 34, 223, 49, 45, 183), new Array(46, 17, 33, 183, 6, 98, 15, 32, 183), new Array(57, 46, 22, 24, 128, 1, 54, 17, 37), new Array(65, 32, 73, 115, 28, 128, 23, 128, 205), new Array(40, 3, 9, 115, 51, 192, 18, 6, 223), new Array(87, 37, 9, 115, 59, 77, 64, 21, 47)), new Array(new Array(104, 55, 44, 218, 9, 54, 53, 130, 226), new Array(64, 90, 70, 205, 40, 41, 23, 26, 57), new Array(54, 57, 112, 184, 5, 41, 38, 166, 213), new Array(30, 34, 26, 133, 152, 116, 10, 32, 134), new Array(39, 19, 53, 221, 26, 114, 32, 73, 255), new Array(31, 9, 65, 234, 2, 15, 1, 118, 73), new Array(75, 32, 12, 51, 192, 255, 160, 43, 51), new Array(88, 31, 35, 67, 102, 85, 55, 186, 85), new Array(56, 21, 23, 111, 59, 205, 45, 37, 192), new Array(55, 38, 70, 124, 73, 102, 1, 34, 98)), new Array(new Array(125, 98, 42, 88, 104, 85, 117, 175, 82), new Array(95, 84, 53, 89, 128, 100, 113, 101, 45), new Array(75, 79, 123, 47, 51, 128, 81, 171, 1), new Array(57, 17, 5, 71, 102, 57, 53, 41, 49), new Array(38, 33, 13, 121, 57, 73, 26, 1, 85), new Array(41, 10, 67, 138, 77, 110, 90, 47, 114), new Array(115, 21, 2, 10, 102, 255, 166, 23, 6), new Array(101, 29, 16, 10, 85, 128, 101, 196, 26), new Array(57, 18, 10, 102, 102, 213, 34, 20, 43), new Array(117, 20, 15, 36, 163, 128, 68, 1, 26)), new Array(new Array(102, 61, 71, 37, 34, 53, 31, 243, 192), new Array(69, 60, 71, 38, 73, 119, 28, 222, 37), new Array(68, 45, 128, 34, 1, 47, 11, 245, 171), new Array(62, 17, 19, 70, 146, 85, 55, 62, 70), new Array(37, 43, 37, 154, 100, 163, 85, 160, 1), new Array(63, 9, 92, 136, 28, 64, 32, 201, 85), new Array(75, 15, 9, 9, 64, 255, 184, 119, 16), new Array(86, 6, 28, 5, 64, 255, 25, 248, 1), new Array(56, 8, 17, 132, 137, 255, 55, 116, 128), new Array(58, 15, 20, 82, 135, 57, 26, 121, 40)), new Array(new Array(164, 50, 31, 137, 154, 133, 25, 35, 218), new Array(51, 103, 44, 131, 131, 123, 31, 6, 158), new Array(86, 40, 64, 135, 148, 224, 45, 183, 128), new Array(22, 26, 17, 131, 240, 154, 14, 1, 209), new Array(45, 16, 21, 91, 64, 222, 7, 1, 197), new Array(56, 21, 39, 155, 60, 138, 23, 102, 213), new Array(83, 12, 13, 54, 192, 255, 68, 47, 28), new Array(85, 26, 85, 85, 128, 128, 32, 146, 171), new Array(18, 11, 7, 63, 144, 171, 4, 4, 246), new Array(35, 27, 10, 146, 174, 171, 12, 26, 128)), new Array(new Array(190, 80, 35, 99, 180, 80, 126, 54, 45), new Array(85, 126, 47, 87, 176, 51, 41, 20, 32), new Array(101, 75, 128, 139, 118, 146, 116, 128, 85), new Array(56, 41, 15, 176, 236, 85, 37, 9, 62), new Array(71, 30, 17, 119, 118, 255, 17, 18, 138), new Array(101, 38, 60, 138, 55, 70, 43, 26, 142), new Array(146, 36, 19, 30, 171, 255, 97, 27, 20), new Array(138, 45, 61, 62, 219, 1, 81, 188, 64), new Array(32, 41, 20, 117, 151, 142, 20, 21, 163), new Array(112, 19, 12, 61, 195, 128, 48, 4, 24)));

    function PutI4Mode(a, b, c) {
        if (VP8PutBit(a, b != bd, c[0])) {
            if (VP8PutBit(a, b != B_TM_PRED, c[1])) {
                if (VP8PutBit(a, b != B_VE_PRED, c[2])) {
                    if (!VP8PutBit(a, b >= B_LD_PRED, c[3])) {
                        if (VP8PutBit(a, b != B_HE_PRED, c[4])) {
                            VP8PutBit(a, b != B_RD_PRED, c[5])
                        }
                    } else {
                        if (VP8PutBit(a, b != B_LD_PRED, c[6])) {
                            if (VP8PutBit(a, b != B_VL_PRED, c[7])) {
                                VP8PutBit(a, b != B_HD_PRED, c[8])
                            }
                        }
                    }
                }
            }
        }
        return b
    }

    function PutI16Mode(a, b) {
        if (VP8PutBit(a, (b == TM_PRED || b == H_PRED), 156)) {
            VP8PutBit(a, b == TM_PRED, 128)
        } else {
            VP8PutBit(a, b == V_PRED, 163)
        }
    }

    function PutUVMode(a, b) {
        if (VP8PutBit(a, b != DC_PRED, 142)) {
            if (VP8PutBit(a, b != V_PRED, 114)) {
                VP8PutBit(a, b != H_PRED, 183)
            }
        }
    }

    function PutSegment(a, s, p, b) {
        if (VP8PutBit(a, s >= 2, p[b + 0])) b += 1;
        VP8PutBit(a, s & 1, p[b + 1])
    }
    var dy = newObjectIt(bV);

    function VP8CodeIntraModes(a) {
        var b = a.bw_;
        var c = (dy);
        VP8IteratorInit(a, c);
        do {
            var d = c.mb_[c.mb_off];
            var e = c.preds_;
            var f = c.preds_off;
            if (a.segment_hdr_.update_map_) {
                PutSegment(b, d.segment_, a.proba_.segments_, 0)
            }
            if (a.proba_.use_skip_proba_) {
                VP8PutBit(b, d.skip_, a.proba_.skip_proba_)
            }
            if (VP8PutBit(b, (d.type_ != 0), 145)) {
                PutI16Mode(b, e[f + 0])
            } else {
                var g = a.preds_w_;
                var h = e;
                var i = f - g;
                var x, y;
                for (y = 0; y < 4; ++y) {
                    var j = e[f - 1];
                    for (x = 0; x < 4; ++x) {
                        var k = dx[h[i + x]][j];
                        j = PutI4Mode(b, e[f + x], k)
                    }
                    i = f;
                    f += g
                }
            }
            PutUVMode(b, d.uv_mode_)
        } while (VP8IteratorNext(c, 0, 0))
    }
    var dz = new Array(new Array(new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(176, 246, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(223, 241, 252, 255, 255, 255, 255, 255, 255, 255, 255), new Array(249, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 244, 252, 255, 255, 255, 255, 255, 255, 255, 255), new Array(234, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(253, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 246, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(239, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 248, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(251, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(251, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 253, 255, 254, 255, 255, 255, 255, 255, 255), new Array(250, 255, 254, 255, 254, 255, 255, 255, 255, 255, 255), new Array(254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255))), new Array(new Array(new Array(217, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(225, 252, 241, 253, 255, 255, 254, 255, 255, 255, 255), new Array(234, 250, 241, 250, 253, 255, 253, 254, 255, 255, 255)), new Array(new Array(255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(223, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(238, 253, 254, 254, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 248, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(249, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 253, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(247, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(253, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(250, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255))), new Array(new Array(new Array(186, 251, 250, 255, 255, 255, 255, 255, 255, 255, 255), new Array(234, 251, 244, 254, 255, 255, 255, 255, 255, 255, 255), new Array(251, 251, 243, 253, 254, 255, 254, 255, 255, 255, 255)), new Array(new Array(255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(236, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(251, 253, 253, 254, 254, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255))), new Array(new Array(new Array(248, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(250, 254, 252, 254, 255, 255, 255, 255, 255, 255, 255), new Array(248, 254, 249, 253, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(246, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(252, 254, 251, 254, 254, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 254, 252, 255, 255, 255, 255, 255, 255, 255, 255), new Array(248, 254, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(253, 255, 254, 254, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 251, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(245, 251, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(253, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 251, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(252, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 252, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(249, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 253, 255, 255, 255, 255, 255, 255, 255, 255), new Array(250, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255)), new Array(new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255), new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255))));

    function VP8WriteProbas(a, d) {
        var t, b, c, p;
        for (t = 0; t < NUM_TYPES; ++t) {
            for (b = 0; b < NUM_BANDS; ++b) {
                for (c = 0; c < NUM_CTX; ++c) {
                    for (p = 0; p < NUM_PROBAS; ++p) {
                        var e = d.coeffs_[t][b][c][p];
                        var f = (e != dw[t][b][c][p]) + 0;
                        if (VP8PutBit(a, f, dz[t][b][c][p])) {
                            VP8PutValue(a, e, 8)
                        }
                    }
                }
            }
        }
        if (VP8PutBitUniform(a, d.use_skip_proba_)) {
            VP8PutValue(a, d.skip_proba_, 8)
        }
    }

    function ClipAlpha(a) {
        return a < 0 ? 0 : a > 255 ? 255 : a
    }

    function VP8GetAlpha(a) {
        var b = 0,
            den = 0,
            val = 0;
        var k;
        var c = int;
        for (k = 0; k < bc; ++k) {
            if (a[k + 1]) {
                val += a[k + 1];
                b += val * (k + 1);
                den += (k + 1) * (k + 1)
            }
        }
        c = den ? parseInt(10 * b / den - 5) : 0;
        return ClipAlpha(c)
    }

    function CollectHistogram(a, b, c, d, e, f) {
        var g = Arr(bc + 1, 0);
        var h = Arr(16, int16_t);
        var j, k;
        for (j = e; j < f; ++j) {
            dG(a, b + di[j], c, d + di[j], h);
            for (k = 0; k < 16; ++k) {
                var v = Math.abs(h[k]) >> 2;
                h[k] = (v > bc) ? bc : v
            }
            for (k = 0; k < 16; ++k) {
                g[h[k]]++
            }
        }
        return VP8GetAlpha(g)
    }
    var cj = Arr((255 + 510 + 1), uint8_t);
    var ck = 0;

    function InitTables(a) {
        if (!ck) {
            var i;
            for (i = -255; i <= 255 + 255; ++i) {
                cj[255 + i] = (i < 0) ? 0 : (i > 255) ? 255 : i
            }
            ck = 1
        }
    }

    function clip_8b(v) {
        return (!(v & ~0xff)) ? v : v < 0 ? 0 : 255
    }
    var dA = 20091 + (1 << 16);
    var dB = 35468;

    function MUL(a, b) {
        return (((a) * (b)) >> 16)
    }
    var C = Arr(4 * 4, int),
        dD, tmp_off;
    tmp_off = 0;

    function ITransformOne(e, f, g, h, j, k) {
        var C = Arr(4 * 4, int),
            dD, tmp_off;
        tmp_off = 0;
        var i;
        dD = C;
        for (i = 0; i < 4; ++i) {
            var a = g[h + 0] + g[h + 8];
            var b = g[h + 0] - g[h + 8];
            var c = ((g[h + 4] * dB) >> 16) - ((g[h + 12] * dA) >> 16);
            var d = ((g[h + 4] * dA) >> 16) + ((g[h + 12] * dB) >> 16);
            dD[tmp_off + 0] = a + d;
            dD[tmp_off + 1] = b + c;
            dD[tmp_off + 2] = b - c;
            dD[tmp_off + 3] = a - d;
            tmp_off += 4;
            h++
        }
        tmp_off = 0;
        for (i = 0; i < 4; ++i) {
            var l = dD[tmp_off + 0] + 4;
            var a = l + dD[tmp_off + 8];
            var b = l - dD[tmp_off + 8];
            var c = ((dD[tmp_off + 4] * dB) >> 16) - ((dD[tmp_off + 12] * dA) >> 16);
            var d = ((dD[tmp_off + 4] * dA) >> 16) + ((dD[tmp_off + 12] * dB) >> 16);
            j[k + 0 + i * bf] = clip_8b(e[f + 0 + i * bf] + ((a + d) >> 3));
            j[k + 1 + i * bf] = clip_8b(e[f + 1 + i * bf] + ((b + c) >> 3));
            j[k + 2 + i * bf] = clip_8b(e[f + 2 + i * bf] + ((b - c) >> 3));
            j[k + 3 + i * bf] = clip_8b(e[f + 3 + i * bf] + ((a - d) >> 3));
            tmp_off++
        }
    }

    function ITransform(a, b, c, d, e, f, g) {
        ITransformOne(a, b, c, d, e, f);
        if (g) {
            ITransformOne(a, b + 4, c, d + 16, e, f + 4)
        }
    }

    function FTransform(a, b, c, d, e) {
        var i;
        for (i = 0; i < 4; ++i) {
            var f = a[b + 0] - c[d + 0];
            var g = a[b + 1] - c[d + 1];
            var h = a[b + 2] - c[d + 2];
            var j = a[b + 3] - c[d + 3];
            var k = (f + j) << 3;
            var l = (g + h) << 3;
            var m = (g - h) << 3;
            var n = (f - j) << 3;
            dD[0 + i * 4] = (k + l) + 0;
            dD[1 + i * 4] = (m * 2217 + n * 5352 + 14500) >> 12;
            dD[2 + i * 4] = (k - l) + 0;
            dD[3 + i * 4] = (n * 2217 - m * 5352 + 7500) >> 12;
            b += bf, d += bf
        }
        for (i = 0; i < 4; ++i) {
            var k = (dD[0 + i] + dD[12 + i]);
            var l = (dD[4 + i] + dD[8 + i]);
            var m = (dD[4 + i] - dD[8 + i]);
            var n = (dD[0 + i] - dD[12 + i]);
            e[0 + i] = (k + l + 7) >> 4;
            e[4 + i] = ((m * 2217 + n * 5352 + 12000) >> 16) + (n != 0) + 0;
            e[8 + i] = (k - l + 7) >> 4;
            e[12 + i] = ((n * 2217 - m * 5352 + 51000) >> 16)
        }
        return e
    }
    var dC = 0;

    function ITransformWHT(a, b) {
        dC = 0;
        var i;
        for (i = 0; i < 4; ++i) {
            var c = a[0 + i] + a[12 + i];
            var d = a[4 + i] + a[8 + i];
            var e = a[4 + i] - a[8 + i];
            var f = a[0 + i] - a[12 + i];
            dD[0 + i] = c + d;
            dD[8 + i] = c - d;
            dD[4 + i] = f + e;
            dD[12 + i] = f - e
        }
        for (i = 0; i < 4; ++i) {
            var g = dD[0 + i * 4] + 3;
            var c = g + dD[3 + i * 4];
            var d = dD[1 + i * 4] + dD[2 + i * 4];
            var e = dD[1 + i * 4] - dD[2 + i * 4];
            var f = g - dD[3 + i * 4];
            b[dC + 0][0] = (c + d) >> 3;
            b[dC + 1][0] = (f + e) >> 3;
            b[dC + 2][0] = (c - d) >> 3;
            b[dC + 3][0] = (f - e) >> 3;
            dC += 4
        }
    }

    function FTransformWHT(a, b) {
        var c = 0;
        var i;
        for (i = 0; i < 4; ++i) {
            var d = (a[c + 0][0] + a[c + 2][0]) << 2;
            var e = (a[c + 1][0] + a[c + 3][0]) << 2;
            var f = (a[c + 1][0] - a[c + 3][0]) << 2;
            var g = (a[c + 0][0] - a[c + 2][0]) << 2;
            dD[0 + i * 4] = (d + e) + (d != 0) + 0;
            dD[1 + i * 4] = g + f;
            dD[2 + i * 4] = g - f;
            dD[3 + i * 4] = d - e;
            c += 4
        }
        for (i = 0; i < 4; ++i) {
            var d = (dD[0 + i] + dD[8 + i]);
            var e = (dD[4 + i] + dD[12 + i]);
            var f = (dD[4 + i] - dD[12 + i]);
            var g = (dD[0 + i] - dD[8 + i]);
            var h = d + e;
            var j = g + f;
            var k = g - f;
            var l = d - e;
            b[0 + i] = (h + (h > 0) + 3) >> 3;
            b[4 + i] = (j + (j > 0) + 3) >> 3;
            b[8 + i] = (k + (k > 0) + 3) >> 3;
            b[12 + i] = (l + (l > 0) + 3) >> 3
        }
    }

    function Fill(a, b, c, d) {
        var j;
        for (j = 0; j < d; ++j) {
            memset_(a, b + j * bf, c, d)
        }
    }

    function VerticalPred(a, b, c, d, e) {
        var j;
        if (c) {
            for (j = 0; j < e; ++j) memcpy(b, a + j * bf, c, d, e)
        } else {
            Fill(b, a, 127, e)
        }
    }

    function HorizontalPred(a, b, c, d, e) {
        if (c) {
            var j;
            for (j = 0; j < e; ++j) {
                memset_(b, a + j * bf, c[d + j], e)
            }
        } else {
            Fill(b, a, 129, e)
        }
    }

    function TrueMotion(a, b, c, d, e, f, g) {
        var y;
        if (c) {
            if (e) {
                var h = cj;
                var i = +255 - c[d - 1];
                for (y = 0; y < g; ++y) {
                    var j = h;
                    var k = i + c[d + y];
                    var x;
                    for (x = 0; x < g; ++x) {
                        b[a + x] = j[k + e[f + x]]
                    }
                    a += bf
                }
            } else {
                HorizontalPred(a, b, c, d, g)
            }
        } else {
            if (e) {
                VerticalPred(a, b, e, f, g)
            } else {
                Fill(b, a, 129, g)
            }
        }
    }

    function DCMode(a, b, c, d, e, f, g, h, i) {
        var k = 0;
        var j;
        if (e) {
            for (j = 0; j < g; ++j) k += e[f + j];
            if (c) {
                for (j = 0; j < g; ++j) k += c[d + j]
            } else {
                k += k
            }
            k = (k + h) >> i
        } else if (c) {
            for (j = 0; j < g; ++j) k += c[d + j];
            k += k;
            k = (k + h) >> i
        } else {
            k = 0x80
        }
        Fill(b, a, k, g)
    }

    function IntraChromaPreds(a, b, c, d, e, f) {
        DCMode(bs + b, a, c, d, e, f, 8, 8, 4);
        VerticalPred(bu + b, a, e, f, 8);
        HorizontalPred(bv + b, a, c, d, 8);
        TrueMotion(bt + b, a, c, d, e, f, 8);
        b += 8;
        if (e) f += 8;
        if (c) d += 16;
        DCMode(bs + b, a, c, d, e, f, 8, 8, 4);
        VerticalPred(bu + b, a, e, f, 8);
        HorizontalPred(bv + b, a, c, d, 8);
        TrueMotion(bt + b, a, c, d, e, f, 8)
    }

    function Intra16Preds(a, b, c, d, e, f) {
        DCMode(bo + b, a, c, d, e, f, 16, 16, 5);
        VerticalPred(bq + b, a, e, f, 16);
        HorizontalPred(br + b, a, c, d, 16);
        TrueMotion(bp + b, a, c, d, e, f, 16)
    }

    function AVG3(a, b, c) {
        return (((a) + 2 * (b) + (c) + 2) >> 2)
    };

    function AVG2(a, b) {
        return (((a) + (b) + 1) >> 1)
    };

    function VE4(a, b, c, d) {
        var e = new Array();
        e.push(AVG3(c[d - 1], c[d + 0], c[d + 1]));
        e.push(AVG3(c[d + 0], c[d + 1], c[d + 2]));
        e.push(AVG3(c[d + 1], c[d + 2], c[d + 3]));
        e.push(AVG3(c[d + 2], c[d + 3], c[d + 4]));
        var i;
        for (i = 0; i < 4; ++i) {
            memcpy(b, a + i * bf, e, 0, 4)
        }
    }

    function HE4(a, b, c, d) {
        var X = c[d - 1];
        var I = c[d - 2];
        var J = c[d - 3];
        var K = c[d - 4];
        var L = c[d - 5];
        b[a + 0 + 0 * bf] = b[a + 1 + 0 * bf] = b[a + 2 + 0 * bf] = b[a + 3 + 0 * bf] = AVG3(X, I, J);
        b[a + 0 + 1 * bf] = b[a + 1 + 1 * bf] = b[a + 2 + 1 * bf] = b[a + 3 + 1 * bf] = AVG3(I, J, K);
        b[a + 0 + 2 * bf] = b[a + 1 + 2 * bf] = b[a + 2 + 2 * bf] = b[a + 3 + 2 * bf] = AVG3(J, K, L);
        b[a + 0 + 3 * bf] = b[a + 1 + 3 * bf] = b[a + 2 + 3 * bf] = b[a + 3 + 3 * bf] = AVG3(K, L, L)
    }

    function DC4(a, b, c, d) {
        var e = 4;
        var i;
        for (i = 0; i < 4; ++i) e += c[d + i] + c[d - 5 + i];
        Fill(b, a, e >> 3, 4)
    }

    function RD4(a, b, c, d) {
        var X = c[d - 1];
        var I = c[d - 2];
        var J = c[d - 3];
        var K = c[d - 4];
        var L = c[d - 5];
        var A = c[d + 0];
        var B = c[d + 1];
        var C = c[d + 2];
        var D = c[d + 3];
        b[a + (0) + (3) * bf] = AVG3(J, K, L);
        b[a + (0) + (2) * bf] = b[a + (1) + (3) * bf] = AVG3(I, J, K);
        b[a + (0) + (1) * bf] = b[a + (1) + (2) * bf] = b[a + (2) + (3) * bf] = AVG3(X, I, J);
        b[a + (0) + (0) * bf] = b[a + (1) + (1) * bf] = b[a + (2) + (2) * bf] = b[a + (3) + (3) * bf] = AVG3(A, X, I);
        b[a + (1) + (0) * bf] = b[a + (2) + (1) * bf] = b[a + (3) + (2) * bf] = AVG3(B, A, X);
        b[a + (2) + (0) * bf] = b[a + (3) + (1) * bf] = AVG3(C, B, A);
        b[a + (3) + (0) * bf] = AVG3(D, C, B)
    }

    function LD4(a, b, c, d) {
        var A = c[d + 0];
        var B = c[d + 1];
        var C = c[d + 2];
        var D = c[d + 3];
        var E = c[d + 4];
        var F = c[d + 5];
        var G = c[d + 6];
        var H = c[d + 7];
        b[a + (0) + (0) * bf] = AVG3(A, B, C);
        b[a + (1) + (0) * bf] = b[a + (0) + (1) * bf] = AVG3(B, C, D);
        b[a + (2) + (0) * bf] = b[a + (1) + (1) * bf] = b[a + (0) + (2) * bf] = AVG3(C, D, E);
        b[a + (3) + (0) * bf] = b[a + (2) + (1) * bf] = b[a + (1) + (2) * bf] = b[a + (0) + (3) * bf] = AVG3(D, E, F);
        b[a + (3) + (1) * bf] = b[a + (2) + (2) * bf] = b[a + (1) + (3) * bf] = AVG3(E, F, G);
        b[a + (3) + (2) * bf] = b[a + (2) + (3) * bf] = AVG3(F, G, H);
        b[a + (3) + (3) * bf] = AVG3(G, H, H)
    }

    function VR4(a, b, c, d) {
        var X = c[d - 1];
        var I = c[d - 2];
        var J = c[d - 3];
        var K = c[d - 4];
        var A = c[d + 0];
        var B = c[d + 1];
        var C = c[d + 2];
        var D = c[d + 3];
        b[a + (0) + (0) * bf] = b[a + (1) + (2) * bf] = AVG2(X, A);
        b[a + (1) + (0) * bf] = b[a + (2) + (2) * bf] = AVG2(A, B);
        b[a + (2) + (0) * bf] = b[a + (3) + (2) * bf] = AVG2(B, C);
        b[a + (3) + (0) * bf] = AVG2(C, D);
        b[a + (0) + (3) * bf] = AVG3(K, J, I);
        b[a + (0) + (2) * bf] = AVG3(J, I, X);
        b[a + (0) + (1) * bf] = b[a + (1) + (3) * bf] = AVG3(I, X, A);
        b[a + (1) + (1) * bf] = b[a + (2) + (3) * bf] = AVG3(X, A, B);
        b[a + (2) + (1) * bf] = b[a + (3) + (3) * bf] = AVG3(A, B, C);
        b[a + (3) + (1) * bf] = AVG3(B, C, D)
    }

    function VL4(a, b, c, d) {
        var A = c[d + 0];
        var B = c[d + 1];
        var C = c[d + 2];
        var D = c[d + 3];
        var E = c[d + 4];
        var F = c[d + 5];
        var G = c[d + 6];
        var H = c[d + 7];
        b[a + (0) + (0) * bf] = AVG2(A, B);
        b[a + (1) + (0) * bf] = b[a + (0) + (2) * bf] = AVG2(B, C);
        b[a + (2) + (0) * bf] = b[a + (1) + (2) * bf] = AVG2(C, D);
        b[a + (3) + (0) * bf] = b[a + (2) + (2) * bf] = AVG2(D, E);
        b[a + (0) + (1) * bf] = AVG3(A, B, C);
        b[a + (1) + (1) * bf] = b[a + (0) + (3) * bf] = AVG3(B, C, D);
        b[a + (2) + (1) * bf] = b[a + (1) + (3) * bf] = AVG3(C, D, E);
        b[a + (3) + (1) * bf] = b[a + (2) + (3) * bf] = AVG3(D, E, F);
        b[a + (3) + (2) * bf] = AVG3(E, F, G);
        b[a + (3) + (3) * bf] = AVG3(F, G, H)
    }

    function HU4(a, b, c, d) {
        var I = c[d - 2];
        var J = c[d - 3];
        var K = c[d - 4];
        var L = c[d - 5];
        b[a + (0) + (0) * bf] = AVG2(I, J);
        b[a + (2) + (0) * bf] = b[a + (0) + (1) * bf] = AVG2(J, K);
        b[a + (2) + (1) * bf] = b[a + (0) + (2) * bf] = AVG2(K, L);
        b[a + (1) + (0) * bf] = AVG3(I, J, K);
        b[a + (3) + (0) * bf] = b[a + (1) + (1) * bf] = AVG3(J, K, L);
        b[a + (3) + (1) * bf] = b[a + (1) + (2) * bf] = AVG3(K, L, L);
        b[a + (3) + (2) * bf] = b[a + (2) + (2) * bf] = b[a + (0) + (3) * bf] = b[a + (1) + (3) * bf] = b[a + (2) + (3) * bf] = b[a + (3) + (3) * bf] = L
    }

    function HD4(a, b, c, d) {
        var X = c[d - 1];
        var I = c[d - 2];
        var J = c[d - 3];
        var K = c[d - 4];
        var L = c[d - 5];
        var A = c[d + 0];
        var B = c[d + 1];
        var C = c[d + 2];
        b[a + (0) + (0) * bf] = b[a + (2) + (1) * bf] = AVG2(I, X);
        b[a + (0) + (1) * bf] = b[a + (2) + (2) * bf] = AVG2(J, I);
        b[a + (0) + (2) * bf] = b[a + (2) + (3) * bf] = AVG2(K, J);
        b[a + (0) + (3) * bf] = AVG2(L, K);
        b[a + (3) + (0) * bf] = AVG3(A, B, C);
        b[a + (2) + (0) * bf] = AVG3(X, A, B);
        b[a + (1) + (0) * bf] = b[a + (3) + (1) * bf] = AVG3(I, X, A);
        b[a + (1) + (1) * bf] = b[a + (3) + (2) * bf] = AVG3(J, I, X);
        b[a + (1) + (2) * bf] = b[a + (3) + (3) * bf] = AVG3(K, J, I);
        b[a + (1) + (3) * bf] = AVG3(L, K, J)
    }

    function TM4(a, b, c, d) {
        var x, y;
        var e = cj;
        var f = +255 - c[d - 1];
        for (y = 0; y < 4; ++y) {
            var g = e;
            var h = f + c[d - 2 - y];
            for (x = 0; x < 4; ++x) {
                b[a + x] = g[h + c[d + x]]
            }
            a += bf
        }
    }

    function Intra4Preds(a, b, c, d) {
        DC4(bw + b, a, c, d);
        TM4(bx + b, a, c, d);
        VE4(by + b, a, c, d);
        HE4(bz + b, a, c, d);
        RD4(bA + b, a, c, d);
        VR4(bB + b, a, c, d);
        LD4(bC + b, a, c, d);
        VL4(bD + b, a, c, d);
        HD4(bE + b, a, c, d);
        HU4(bF + b, a, c, d)
    }

    function GetSSE(a, c, b, d, w, h) {
        var e = 0;
        var y, x;
        for (y = 0; y < h; ++y) {
            for (x = 0; x < w; ++x) {
                var f = a[c + x] - b[d + x];
                e += f * f
            }
            c += bf;
            d += bf
        }
        return e
    }

    function SSE16x16(a, c, b, d) {
        return GetSSE(a, c, b, d, 16, 16)
    }

    function SSE16x8(a, c, b, d) {
        return GetSSE(a, c, b, d, 16, 8)
    }

    function SSE8x8(a, c, b, d) {
        return GetSSE(a, c, b, d, 8, 8)
    }

    function SSE4x4(a, c, b, d) {
        return GetSSE(a, c, b, d, 4, 4)
    }
    var dD = Arr(16, int);

    function TTransform(a, b, w) {
        var c = 0;
        var i;
        var d = 0;
        for (i = 0; i < 4; ++i) {
            var e = (a[b + 0] + a[b + 2]) << 2;
            var f = (a[b + 1] + a[b + 3]) << 2;
            var g = (a[b + 1] - a[b + 3]) << 2;
            var h = (a[b + 0] - a[b + 2]) << 2;
            dD[0 + i * 4] = e + f + (e != 0) + 0;
            dD[1 + i * 4] = h + g;
            dD[2 + i * 4] = h - g;
            dD[3 + i * 4] = e - f;
            b += bf
        }
        for (i = 0; i < 4; ++i) {
            var e = (dD[0 + i] + dD[8 + i]);
            var f = (dD[4 + i] + dD[12 + i]);
            var g = (dD[4 + i] - dD[12 + i]);
            var h = (dD[0 + i] - dD[8 + i]);
            var j = e + f;
            var k = h + g;
            var l = h - g;
            var m = e - f;
            c += w[d + 0] * ((Math.abs(j) + 3) >> 3);
            c += w[d + 4] * ((Math.abs(k) + 3) >> 3);
            c += w[d + 8] * ((Math.abs(l) + 3) >> 3);
            c += w[d + 12] * ((Math.abs(m) + 3) >> 3);
            ++d
        }
        return c
    }

    function Disto4x4(a, c, b, d, w) {
        var e = TTransform(a, c, w);
        var f = TTransform(b, d, w);
        return (Math.abs(f - e) + 8) >> 4
    }

    function Disto16x16(a, c, b, d, w) {
        var D = 0;
        var x, y = int;
        for (y = 0; y < 16 * bf; y += 4 * bf) {
            for (x = 0; x < 16; x += 4) {
                D += Disto4x4(a, c + x + y, b, d + x + y, w)
            }
        }
        return D
    }

    function QuantizeBlock(a, b, n, c) {
        var d = -1;
        for (; n < 16; ++n) {
            var j = cV[n];
            var e = (a[j] < 0);
            var f = (e ? -a[j] : a[j]) + c.sharpen_[j];
            if (f > 2047) f = 2047;
            if (f > c.zthresh_[j]) {
                var Q = c.q_[j];
                var g = c.iq_[j];
                var B = c.bias_[j];
                b[n] = QUANTDIV(f, g, B);
                if (e) b[n] = -b[n];
                a[j] = b[n] * Q;
                if (b[n]) d = n
            } else {
                b[n] = 0;
                a[j] = 0
            }
        }
        return (d >= 0) + 0
    }

    function Copy(a, b, c, d, e) {
        var y;
        for (y = 0; y < e; ++y) {
            memcpy(c, d, a, b, e);
            b += bf;
            d += bf
        }
    }

    function Copy4x4(a, b, c, d) {
        Copy(a, b, c, d, 4)
    }

    function Copy8x8(a, b, c, d) {
        Copy(a, b, c, d, 8)
    }

    function Copy16x16(a, b, c, d) {
        Copy(a, b, c, d, 16)
    }
    var dE;
    var dF;
    var dG;
    var dH;
    var dI;
    var dJ;
    var dK;
    var dL;
    var dM;
    var dN;
    var dO;
    var dP;
    var dQ;
    var dR;
    var dS;
    var dT;
    var dU;
    var dV;

    function VP8EncDspInit(a) {
        InitTables();
        dE = CollectHistogram;
        dF = ITransform;
        dG = FTransform;
        dH = ITransformWHT;
        dI = FTransformWHT;
        dJ = Intra4Preds;
        dK = Intra16Preds;
        dL = IntraChromaPreds;
        dM = SSE16x16;
        dN = SSE8x8;
        dO = SSE16x8;
        dP = SSE4x4;
        dQ = Disto4x4;
        dR = Disto16x16;
        dS = QuantizeBlock;
        dT = Copy4x4;
        dU = Copy8x8;
        dV = Copy16x16
    }

    function WebPConfigInitInternal(a, b, c, d) {
        if (d != N) {
            return 0
        }
        if (a == null) return 0;
        a.quality = c;
        a.target_size = 0;
        a.target_PSNR = 0.;
        a.method = 3;
        a.sns_strength = 50;
        a.filter_strength = 20;
        a.filter_sharpness = 0;
        a.filter_type = 0;
        a.partitions = 0;
        a.segments = 4;
        a.pass = 1;
        a.show_compressed = 0;
        a.preprocessing = 0;
        a.autofilter = 0;
        a.alpha_compression = 0;
        a.partition_limit = 0;
        if (ea) {
            a.quality = ea.quality ? ea.quality : c;
            a.target_size = ea.target_size ? ea.target_size : 0;
            a.target_PSNR = ea.target_PSNR ? ea.target_PSNR : 0.;
            a.method = ea.method ? ea.method : 0;
            a.sns_strength = ea.sns_strength ? ea.sns_strength : 50;
            a.filter_strength = ea.filter_strength ? ea.filter_strength : 20;
            a.filter_sharpness = ea.filter_sharpness ? ea.filter_sharpness : 0;
            a.filter_type = ea.filter_type ? ea.filter_type : 0;
            a.partitions = ea.partitions ? ea.partitions : 0;
            a.segments = ea.segments ? ea.segments : 4;
            a.pass = ea.pass ? ea.pass : 1;
            a.show_compressed = ea.show_compressed ? ea.show_compressed : 0;
            a.preprocessing = ea.preprocessing ? ea.preprocessing : 0;
            a.autofilter = ea.autofilter ? ea.autofilter : 0;
            a.alpha_compression = ea.alpha_compression ? ea.alpha_compression : 0;
            a.partition_limit = ea.partition_limit ? ea.partition_limit : 0;
            b = ea.Preset ? ea.preset : P.WEBP_PRESET_DEFAULT
        }
        switch (b) {
            case P.WEBP_PRESET_PICTURE:
                a.sns_strength = 80;
                a.filter_sharpness = 4;
                a.filter_strength = 35;
                break;
            case P.WEBP_PRESET_PHOTO:
                a.sns_strength = 80;
                a.filter_sharpness = 3;
                a.filter_strength = 30;
                break;
            case P.WEBP_PRESET_DRAWING:
                a.sns_strength = 25;
                a.filter_sharpness = 6;
                a.filter_strength = 10;
                break;
            case P.WEBP_PRESET_ICON:
                a.sns_strength = 0;
                a.filter_strength = 0;
                break;
            case P.WEBP_PRESET_TEXT:
                a.sns_strength = 0;
                a.filter_strength = 0;
                a.segments = 2;
                break;
            case P.WEBP_PRESET_DEFAULT:
            default:
                break
        }
        return WebPValidateConfig(a)
    }

    function WebPValidateConfig(a) {
        if (a == null) return 0;
        if (a.quality < 0 || a.quality > 100) return 0;
        if (a.target_size < 0) return 0;
        if (a.target_PSNR < 0) return 0;
        if (a.method < 0 || a.method > 6) return 0;
        if (a.segments < 1 || a.segments > 4) return 0;
        if (a.sns_strength < 0 || a.sns_strength > 100) return 0;
        if (a.filter_strength < 0 || a.filter_strength > 100) return 0;
        if (a.filter_sharpness < 0 || a.filter_sharpness > 7) return 0;
        if (a.filter_type < 0 || a.filter_type > 1) return 0;
        if (a.autofilter < 0 || a.autofilter > 1) return 0;
        if (a.pass < 1 || a.pass > 10) return 0;
        if (a.show_compressed < 0 || a.show_compressed > 1) return 0;
        if (a.preprocessing < 0 || a.preprocessing > 1) return 0;
        if (a.partitions < 0 || a.partitions > 3) return 0;
        if (a.partition_limit < 0 || a.partition_limit > 100) return 0;
        if (a.alpha_compression < 0) return 0;
        return 1
    }
    var dW = 16384;
    this.WebPGetEncoderVersion = function(a) {
        return (Z << 16) | (ba << 8) | bb
    };

    function DummyWriter(a, b, c) {
        return 1
    }

    function WebPPictureInitInternal(d, e) {
        if (e != N) {
            return 0
        }
        if (d) {
            d = newObjectIt(V);
            d.writer = function DummyWriter(a, b, c) {};
            WebPEncodingSetError(d, U)
        }
        return 1
    }

    function ResetSegmentHeader(a) {
        var b = a.segment_hdr_;
        b.num_segments_ = a.config_.segments;
        b.update_map_ = (b.num_segments_ > 1) + 0;
        b.size_ = 0
    }

    function ResetFilterHeader(a) {
        var b = a.filter_hdr_;
        b.simple_ = 1;
        b.level_ = 0;
        b.sharpness_ = 0;
        b.i4x4_lf_delta_ = 0
    }

    function ResetBoundaryPredictions(a) {
        var i;
        var b = a.preds_;
        var c = a.preds_off - a.preds_w_;
        var d = a.preds_;
        var e = a.preds_off - 1;
        for (i = -1; i < 4 * a.mb_w_; ++i) {
            b[c + i] = bd
        }
        for (i = 0; i < 4 * a.mb_h_; ++i) {
            d[e + i * a.preds_w_] = bd
        }
        a.nz_[1 - 1] = 0
    }

    function MapConfigToTools(a) {
        var b = a.config_.method;
        var c = 100 - a.config_.partition_limit;
        a.method_ = b;
        a.rd_opt_level_ = (b >= 6) ? 3 : (b >= 5) ? 2 : (b >= 3) ? 1 : 0;
        a.max_i4_header_bits_ = parseInt(256 * 16 * 16 * (c * c) / (100 * 100))
    }

    function InitEncoder(a, b) {
        var c = (a.filter_strength > 0) || (a.autofilter > 0);
        var d = (b.width + 15) >> 4;
        var e = (b.height + 15) >> 4;
        var f = 4 * d + 1;
        var g = 4 * e + 1;
        var h = f * g * sizeof(uint8_t);
        var i = d * 16;
        var j = (d + 1) * sizeof(uint32_t);
        var k = (3 * bi + bj) * sizeof(uint8_t);
        var l = d * e * sizeof(bQ);
        var m = (2 * i + 16 + 16 + 16 + 8 + 1 + 2 * bn) * sizeof(uint8_t);
        var n = a.autofilter ? sizeof(bM) + bn : 0;
        var o = newObjectIt(bT);
        var p = uint8_t;
        var q = sizeof(bT) + bn + k + l + h + m + j + n;
        p = malloc(q, uint8_t);
        if (p == null) {
            WebPEncodingSetError(b, VP8_ENC_ERROR_OUT_OF_MEMORY);
            return null
        }
        o.num_parts_ = 1 << a.partitions;
        o.mb_w_ = d;
        o.mb_h_ = e;
        o.preds_w_ = f;
        o.yuv_in_ = membuild(uint8_t, bi);
        o.yuv_out_ = membuild(uint8_t, bi);
        o.yuv_out2_ = membuild(uint8_t, bi);
        o.yuv_p_ = membuild(uint8_t, bj);
        o.mb_info_ = Arr_nOI(l, bQ);
        o.preds_ = Arr((f * g * sizeof(uint8_t) + 1 + o.preds_w_), uint8_t);
        o.preds_off = +1 + o.preds_w_;
        o.nz_ = Arr(1 + j, uint8_t);
        o.nz_off = 1;
        o.lf_stats_ = n ? newObjectIt(bM) : null;
        o.y_top_ = Arr((2 * i + (16) + (16 + 16) + (16) + (8)), uint8_t);
        o.y_top_off = 0;
        o.uv_top_ = o.y_top_;
        o.uv_top_off = o.y_top_off + i;
        o.y_left_ = o.uv_top_;
        o.y_left_off = (2 * i) + (16);
        o.u_left_ = o.y_left_;
        o.u_left_off = o.y_left_off + (16 + 16);
        o.v_left_ = o.u_left_;
        o.v_left_off = o.u_left_off + (16);
        o.config_ = a;
        o.profile_ = c ? ((a.filter_type == 1) ? 0 : 1) : 2;
        o.pic_ = b;
        MapConfigToTools(o);
        VP8EncDspInit();
        VP8DefaultProbas(o);
        ResetSegmentHeader(o);
        ResetFilterHeader(o);
        ResetBoundaryPredictions(o);
        VP8EncInitAlpha(o);
        VP8EncInitLayer(o);
        return o
    }

    function DeleteEncoder(a) {
        if (a) {
            VP8EncDeleteAlpha(a);
            VP8EncDeleteLayer(a);
            a = ''
        }
    }

    function GetPSNR(a, b) {
        return a ? 10. * (Math.LOG10E * Math.log(255. * 255. * b / a)) : 99.
    }

    function FinalizePSNR(a) {
        var b = a.pic_.stats;
        var c = a.sse_count_;
        var d = a.sse_;
        b.PSNR[0] = parseFloat(GetPSNR(d[0], c));
        b.PSNR[1] = parseFloat(GetPSNR(d[1], c / 4));
        b.PSNR[2] = parseFloat(GetPSNR(d[2], c / 4));
        b.PSNR[3] = parseFloat(GetPSNR(d[0] + d[1] + d[2], c * 3 / 2))
    }

    function StoreStats(a) {
        var b = a.pic_.stats;
        var c = a.pic_.stats_nozero;
        if (c) {
            var i, s;
            for (i = 0; i < be; ++i) {
                b.segment_level[i] = a.dqm_[i].fstrength_;
                b.segment_quant[i] = a.dqm_[i].quant_;
                for (s = 0; s <= 2; ++s) {
                    b.residual_bytes[s][i] = a.residual_bytes_[s][i]
                }
            }
            FinalizePSNR(a);
            b.coded_size = a.coded_size_;
            for (i = 0; i < 3; ++i) {
                b.block_count[i] = a.block_count_[i]
            }
        }
    }

    function WebPEncodingSetError(a, b) {
        assert(b <= VP8_ENC_ERROR_BAD_WRITE);
        assert(b >= U);
        a.error_code = b;
        return 0
    }

    function WebPEncode(a, b) {
        var c = newObjectIt(bT);
        var d = int;
        if (b == null) return 0;
        WebPEncodingSetError(b, U);
        if (a == null) return WebPEncodingSetError(b, VP8_ENC_ERROR_NULL_PARAMETER);
        if (!WebPValidateConfig(a)) return WebPEncodingSetError(b, VP8_ENC_ERROR_INVALID_CONFIGURATION);
        if (b.width <= 0 || b.height <= 0) return WebPEncodingSetError(b, VP8_ENC_ERROR_BAD_DIMENSION);
        if (b.y == null || b.u == null || b.v == null) return WebPEncodingSetError(b, VP8_ENC_ERROR_NULL_PARAMETER);
        if (b.width >= dW || b.height >= dW) return WebPEncodingSetError(b, VP8_ENC_ERROR_BAD_DIMENSION);
        c = InitEncoder(a, b);
        if (c == null) return 0;
        d = VP8EncAnalyze(c) && VP8StatLoop(c) && VP8EncLoop(c) && VP8EncFinishAlpha(c) && VP8EncFinishLayer(c) && VP8EncWrite(c);
        StoreStats(c);
        DeleteEncoder(c);
        return d
    }

    function WebPPictureAlloc(a) {
        if (a.extra_info_type) AllocExtraInfo(a);
        if (a) {
            var b = a.colorspace & WEBP_CSP_UV_MASK;
            var c = a.colorspace & WEBP_CSP_ALPHA_BIT;
            var d = a.width;
            var e = a.height;
            var f = d;
            var g = parseInt((d + 1) / 2);
            var h = parseInt((e + 1) / 2);
            var i = g;
            var j = 0;
            var k = int,
                a_stride = int;
            var l = uint64_t,
                uv_size = uint64_t,
                uv0_size = uint64_t,
                a_size = uint64_t,
                total_size = uint64_t;
            var m = uint8_t;
            var n = 0;
            switch (b) {
                case T:
                    break;
                case WEBP_YUV400:
                    break;
                case WEBP_YUV422:
                    j = g;
                    break;
                case WEBP_YUV444:
                    j = d;
                    break;
                default:
                    return 0
            }
            uv0_size = e * j;
            k = c ? d : 0;
            a_stride = k;
            l = f * e;
            uv_size = i * h;
            a_size = a_stride * e;
            total_size = l + a_size + 2 * uv_size + 2 * uv0_size;
            if (d <= 0 || e <= 0 || g < 0 || h < 0 || l >= (64 * 64 * 64 * 16 << 40) || total_size != total_size) {
                return 0
            }
            a.y_stride = f;
            a.uv_stride = i;
            a.a_stride = a_stride;
            a.uv0_stride = j;
            WebPPictureFree(a);
            a.y = malloc(total_size, uint8_t);
            a.y_off = 0;
            if (a.y == null) return 0;
            a.u = a.y;
            a.u_off = a.y_off + l;
            a.v = a.u;
            a.v_off = a.u_off + uv_size;
            m = malloc(total_size, uint8_t);
            if (m == null) return 0;
            a.y = m;
            a.y_off = n;
            n += l;
            a.u = m;
            a.u_off = n;
            n += uv_size;
            a.v = m;
            a.v_off = n;
            n += uv_size;
            if (a_size) {
                a.a = malloc(a_size, uint8_t);
                a.a_off = 0
            }
            if (uv0_size) {
                a.u0 = m;
                a.u0_off = n;
                n += uv0_size;
                a.v0 = m;
                a.v0_off = n;
                n += uv0_size
            }
        }
        return 1
    }

    function WebPPictureGrabSpecs(a, b) {
        if (a) b = a;
        b.y = b.u = b.v = null;
        b.y_off = b.u_off = b.v_off = null;
        b.u0 = b.v0 = null;
        b.u0_off = b.v0_off = null;
        b.a = null;
        b.a_off = null
    }

    function WebPPictureFree(a) {
        if (a) {
            a.y = '';
            a.y = a.u = a.v = null;
            a.y_off = a.u_off = a.v_off = 0;
            WebPPictureGrabSpecs(null, a)
        }
    }
    var dX = {
        mem: uint8_t,
        mem_off: 0,
        max_size: size_t,
        size: size_t,
        size_off: 0
    };

    function InitMemoryWriter(a) {
        a.mem = null;
        a.mem_off = 0;
        a.size = 0;
        a.max_size = 0
    }

    function WebPMemoryWrite(a, b, c) {
        var w = c.custom_ptr;
        var d = size_t;
        if (w == null) {
            alert('w is null');
            return 1
        }
        d = (w.size) + b;
        if (d > w.max_size) {
            var e = uint8_t;
            var f = 0;
            var g = w.max_size * 2;
            if (g < d) g = d;
            if (g < 8192) g = 8192;
            e = malloc(g, uint8_t);
            if (e == null) {
                return 0
            }
            if ((w.size) > 0) {
                memcpy(e, f, w.mem, 0, w.size)
            }
            w.mem = '';
            w.mem = e;
            w.max_size = g
        }
        if (b) {
            memcpy((w.mem), +(w.size), a, 0, b);
            w.size += b
        }
        return 1
    }
    var dY = 16;

    function clip_uv(v) {
        v = (v + (257 << (dY + 2 - 1))) >> (dY + 2);
        return ((v & ~0xff) == 0) ? v : (v < 0) ? 0 : 255
    }

    function rgb_to_y(r, g, b) {
        var a = (1 << (dY - 1)) + (16 << dY);
        var c = 16839 * r + 33059 * g + 6420 * b;
        return (c + a) >> dY
    }

    function rgb_to_u(r, g, b) {
        return clip_uv(-9719 * r - 19081 * g + 28800 * b)
    }

    function rgb_to_v(r, g, b) {
        return clip_uv(+28800 * r - 24116 * g - 4684 * b)
    }

    function MakeGray(a) {
        var y;
        var b = (a.width + 1) >> 1;
        for (y = 0; y < ((a.height + 1) >> 1); ++y) {
            memset_(a.u, a.u_off + y * a.uv_stride, 128, b);
            memset_(a.v, a.v_off + y * a.uv_stride, 128, b)
        }
    }

    function Import(h, i, j, k, l, m) {
        var n = h.colorspace & WEBP_CSP_UV_MASK;
        var x, y = int;
        var o = i;
        var p = +(l ? 2 : 0);
        var q = i;
        var s = +1;
        var t = i;
        var u = +(l ? 0 : 2);
        var v = h.width;
        var w = h.height;

        function SUM4(a, b) {
            return (a[b + 0] + a[b + k] + a[b + j] + a[b + j + k])
        }

        function SUM2H(a, b) {
            return (2 * a[b + 0] + 2 * a[b + k])
        }

        function SUM2V(a, b) {
            return (2 * a[b + 0] + 2 * a[b + j])
        }

        function SUM1(a, b) {
            return (4 * a[b + 0])
        }

        function RGB_TO_UV(x, y, a) {
            var c = (2 * (k * (x) + (y) * j));
            var d = (x) + (y) * h.uv_stride;
            var r = a(o, p + c);
            var g = a(q, s + c);
            var b = a(t, u + c);
            h.u[h.u_off + d] = rgb_to_u(r, g, b);
            h.v[h.v_off + d] = rgb_to_v(r, g, b)
        }

        function RGB_TO_UV0(a, c, y, d) {
            var e = (k * (a) + (y) * j);
            var f = (c) + (y) * h.uv0_stride;
            var r = d(o, p + e);
            var g = d(q, s + e);
            var b = d(t, u + e);
            h.u0[h.u0_off + f] = rgb_to_u(r, g, b);
            h.v0[h.v0_off + f] = rgb_to_v(r, g, b)
        }
        for (y = 0; y < w; ++y) {
            for (x = 0; x < v; ++x) {
                var z = k * x + y * j;
                h.y[h.y_off + x + y * h.y_stride] = rgb_to_y(o[p + z], q[s + z], t[u + z])
            }
        }
        if (n != WEBP_YUV400) {
            for (y = 0; y < (w >> 1); ++y) {
                for (x = 0; x < (v >> 1); ++x) {
                    RGB_TO_UV(x, y, SUM4)
                }
                if (h.width & 1) {
                    RGB_TO_UV(x, y, SUM2V)
                }
            }
            if (w & 1) {
                for (x = 0; x < (v >> 1); ++x) {
                    RGB_TO_UV(x, y, SUM2H)
                }
                if (v & 1) {
                    RGB_TO_UV(x, y, SUM1)
                }
            }
            if (n == WEBP_YUV422) {
                for (y = 0; y < w; ++y) {
                    for (x = 0; x < (v >> 1); ++x) {
                        RGB_TO_UV0(2 * x, x, y, SUM2H)
                    }
                    if (v & 1) {
                        RGB_TO_UV0(2 * x, x, y, SUM1)
                    }
                }
            } else if (n == WEBP_YUV444) {
                for (y = 0; y < w; ++y) {
                    for (x = 0; x < v; ++x) {
                        RGB_TO_UV0(x, x, y, SUM1)
                    }
                }
            }
        } else {
            MakeGray(h)
        }
        if (m) {
            var A = i;
            var B = +3;
            assert(k >= 4);
            for (y = 0; y < w; ++y) {
                for (x = 0; x < v; ++x) {
                    h.a[h.a_off + x + y * h.a_stride] = A[B + k * x + y * j]
                }
            }
        }
        return 1
    }

    function WebPPictureImportRGB(a, b, c) {
        a.colorspace &= ~WEBP_CSP_ALPHA_BIT;
        if (!WebPPictureAlloc(a)) return 0;
        return Import(a, b, c, 3, 0, 0)
    }

    function WebPPictureImportBGR(a, b, c) {
        a.colorspace &= ~WEBP_CSP_ALPHA_BIT;
        if (!WebPPictureAlloc(a)) return 0;
        return Import(a, b, c, 3, 1, 0)
    }

    function WebPPictureImportRGBA(a, b, c) {
        a.colorspace |= WEBP_CSP_ALPHA_BIT;
        if (!WebPPictureAlloc(a)) return 0;
        return Import(a, b, c, 4, 0, 1)
    }

    function WebPPictureImportBGRA(a, b, c) {
        a.colorspace |= WEBP_CSP_ALPHA_BIT;
        if (!WebPPictureAlloc(a)) return 0;
        return Import(a, b, c, 4, 1, 1)
    }
    var dZ, pic_tmp;

    function Encode(e, f, g, h, j, k, l) {
        var m = 0;
        var n = newObjectIt(V);
        var o = newObjectIt(O);
        var p = newObjectIt(dX);
        var q = int;
        n.extra_info_type = ea.extra_info_type ? ea.extra_info_type : 0;
        if (!WebPConfigPreset(o, P.WEBP_PRESET_DEFAULT, k) || !WebPPictureInit(n)) {
            return 0
        }
        n.width = f;
        n.height = g;
        n.writer = function(a, b, c, d) {
            return WebPMemoryWrite(a, b, c, d)
        };
        n.custom_ptr = p;
        p.mem = l.output;
        p.size = m;
        InitMemoryWriter(p);
        q = j(n, e, h) && WebPEncode(o, n);
        if (q) pic_stats = newObjectIt(n.stats);
        else pic_stats = null;
        if (q) pic_tmp = newObjectIt(n);
        else pic_tmp = null;
        WebPPictureFree(n);
        if (!q) {
            l = '';
            l = null;
            return 0
        }
        var r = new Array();
        for (var i = 0; i < p.size; ++i) r.push(String.fromCharCode(p.mem[i]));
        r = r.join("");
        l.output = r;
        m = p.size;
        return m
    }
    this.WebPEncodeRGB = function(a, w, h, b, q, c) {
        return Encode(a, w, h, b, WebPPictureImportRGB, q, c)
    };
    this.WebPEncodeBGR = function(a, w, h, b, q, c) {
        return Encode(a, w, h, b, WebPPictureImportBGR, q, c)
    };
    this.WebPEncodeRGBA = function(a, w, h, b, q, c) {
        return Encode(a, w, h, b, WebPPictureImportRGBA, q, c)
    };
    this.WebPEncodeBGRA = function(a, w, h, b, q, c) {
        return Encode(a, w, h, b, WebPPictureImportBGRA, q, c)
    };
    var ea = null;
    this.WebPEncodeConfig = function(a) {
        ea = a
    };

    function AllocExtraInfo(a) {
        var b = parseInt((a.width + 15) / 16);
        var c = parseInt((a.height + 15) / 16);
        a.extra_info = malloc(b * c * sizeof(a.extra_info), uint8_t)
    }
    this.ReturnExtraInfo = function() {
        function l(b, l) {
            b = b + '';
            var a = '',
                i;
            var c = l - (typeof b.length !== 'undefined' ? b.length : 1);
            c = l < 0 ? 0 : c;
            for (i = 0; i < c; ++i) a += ' ';
            return a + b
        };

        function PrintByteCount(a, b, c) {
            var s, str = '';
            var d = 0;
            for (s = 0; s < 4; ++s) {
                str += "| " + l(a[s], 7) + " ";
                d += a[s];
                if (c) c[s] += a[s]
            }
            return str + "| " + l(d, 7) + "  (" + ((100. * d / b).toFixed(1)) + "%)\n"
        };

        function PrintPercents(a, b) {
            var s, str = '';
            for (s = 0; s < 4; ++s) {
                str += "|     " + l(parseInt(100 * a[s] / b), 3) + "%"
            }
            return str + "| " + l(b, 7) + "\n"
        };

        function PrintValues(a) {
            var s, str = '';
            for (s = 0; s < 4; ++s) {
                str += "| " + l(a[s], 7) + " "
            }
            return str + "|\n"
        };
        if (!pic_stats) return '';
        var e = pic_stats;
        var f = e.block_count[0];
        var g = e.block_count[1];
        var h = e.block_count[2];
        var j = f + g;
        str = "" + l(e.coded_size, 7) + " bytes Y-U-V-All-PSNR " + (e.PSNR[0].toFixed(2)) + " " + (e.PSNR[1].toFixed(2)) + " " + (e.PSNR[2].toFixed(2)) + "   " + (e.PSNR[3].toFixed(2)) + " dB\n";
        if (j > 0) {
            var k = new Array(0, 0, 0, 0);
            str += "block count:  intra4: " + f + "\n" + "              intra16: " + g + "  (-> " + ((100. * g / j).toFixed(2)) + "%)\n" + "              skipped block: " + h + " (" + ((100. * h / j).toFixed(2)) + "%)\n" + "bytes used:  header:         " + l(e.header_bytes[0], 6) + "  (" + ((100. * e.header_bytes[0] / e.coded_size).toFixed(1)) + "%)\n" + "             mode-partition: " + l(e.header_bytes[1], 6) + "  (" + ((100. * e.header_bytes[1] / e.coded_size).toFixed(1)) + "%)\n" + " Residuals bytes  |segment 1|segment 2|segment 3|segment 4|  total\n" + "  intra4-coeffs:  " + PrintByteCount(e.residual_bytes[0], e.coded_size, k) + "" + " intra16-coeffs:  " + PrintByteCount(e.residual_bytes[1], e.coded_size, k) + "" + "  chroma coeffs:  " + PrintByteCount(e.residual_bytes[2], e.coded_size, k) + "" + "    macroblocks:  " + PrintPercents(e.segment_size, j) + "" + "      quantizer:  " + PrintValues(e.segment_quant) + "" + "   filter level:  " + PrintValues(e.segment_level) + "" + "------------------+---------+---------+---------+---------+-----------------\n" + " segments total:  " + PrintByteCount(k, e.coded_size, null) + ""
        }
        str += "";
        if (pic_tmp.extra_info) {
            var m = parseInt((pic_tmp.width + 15) / 16);
            var n = parseInt((pic_tmp.height + 15) / 16);
            var o = pic_tmp.extra_info_type;
            var x, y;
            for (y = 0; y < n; ++y) {
                for (x = 0; x < m; ++x) {
                    var c = pic_tmp.extra_info[x + y * m];
                    if (o == 1) {
                        var p = "+.";
                        str += p[c % 2]
                    } else if (o == 2) {
                        var q = ".-*X";
                        str += q[c % 4]
                    } else if (o == 3) {
                        str += l(c, 2) + " "
                    } else if (o == 6 || o == 7) {
                        str += l(c, 3) + " "
                    } else {
                        str += "0x" + (c < 16 ? "0" : "") + c.toString(16) + " "
                    }
                }
                str += "\n"
            }
        }
        return str
    }
}