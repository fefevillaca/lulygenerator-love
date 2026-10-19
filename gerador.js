const L = 1080, A = 1350, MARGEM = 72, UTIL = 936;
const FORMATOS = {
  feed: { altura: 1350, dy: 0 },
  stories: { altura: 1920, dy: (1920 - 1350) / 2 }
};
const QUADROS = {
  feed: { topo: 72, pe: 1278, miolo: 0 },
  stories: { topo: 250, pe: 1670, miolo: (250 - 72 + 1670 - 1278) / 2 }
};
let Q = QUADROS.feed;
const COR = { vermelho: "#e5161d", verde: "#0b7039", amarelo: "#fbb026", branco: "#ffffff", azul: "#1b3e84", preto: "#141414" };
const ESTILOS = [
  { nome: "cartaz", fundo: COR.branco, letra: COR.vermelho, antes: "", depois: "e estou com Lula.", exemplo: "amo pagode", max: 22, montar: cartaz },
  { nome: "cantos", fundo: COR.branco, letra: COR.vermelho, antes: "Sou", depois: "e meu fechamento é o Lula.", exemplo: "mineira", max: 16, montar: cantos, grade: true },
  { nome: "estrela amarela", fundo: COR.branco, letra: COR.verde, antes: "", depois: "por isso voto em Lula.", exemplo: "uso o SUS", max: 42, montar: estrelaAmarela, grade: true },
  { nome: "verde", fundo: COR.verde, letra: COR.branco, antes: "Não preciso", depois: "pra votar em Lula.", exemplo: "concordar com tudo", max: 42, montar: verde, grade: true },
  { nome: "vermelho", fundo: COR.vermelho, letra: COR.branco, antes: "Eu prefiro", depois: "a votar naquele cara.", exemplo: "cair de moto e me ralar toda", max: 64, montar: prefiro, grade: true },
  { nome: "azul", fundo: COR.azul, letra: COR.branco, antes: "Nada a ver", depois: "mas meu voto é Lula.", exemplo: "ser homem", max: 44, montar: azul, grade: true },
  { nome: "cafona", fundo: COR.branco, letra: COR.azul, antes: "", depois: "é cafona... mas votar no Lula é chic demais.", exemplo: "chapéu panamá", max: 44, montar: cafona, grade: true },
  { nome: "estrelas", fundo: COR.amarelo, letra: COR.branco, antes: "Não preciso", depois: "pra votar em Lula.", exemplo: "ser petista desde criancinha", max: 44, montar: estrelas, grade: true },
  { nome: "por isso longo", fundo: COR.verde, letra: COR.branco, antes: "", depois: "por isso voto em Lula.", exemplo: "uso o SUS, minha mãe se aposentou pelo INSS e eu estudei com o ProUni", max: 150, montar: porIssoLongo, grade: true },
  { nome: "prefiro longo", fundo: COR.vermelho, letra: COR.branco, antes: "Eu prefiro", depois: "a votar naquele cara.", exemplo: "pisar descalça num lego, perder o último ônibus e ouvir áudio de três minutos", max: 150, montar: prefiroLongo, grade: true },
  { nome: "google", fundo: COR.branco, letra: COR.preto, antes: "Procurei no Google", depois: "e agora voto em Lula.", exemplo: "quem criou o Bolsa Família", max: 60, montar: google, grade: true },
  { nome: "google var", fundo: COR.branco, letra: COR.preto, antes: "Tá na dúvida? Chama o VAR:", depois: "", exemplo: "quem criou o Bolsa Família", max: 60, montar: (t) => google(t, { topo: ["TÁ NA DÚVIDA?", "CHAMA O VAR:"], fim: false }), grade: true },
  { nome: "google adoro", fundo: COR.branco, letra: COR.azul, antes: "Pesquisa no Google:", depois: "", exemplo: "quem criou o Bolsa Família", max: 60, montar: googleAdoro, grade: true }
];
const $ = (id) => document.getElementById(id);
const tela = $("arte"), palco = $("palco"), lacuna = $("lacuna");
const antes = $("antes"), depois = $("depois");
let atual = 0;
let formato = "feed";
const textos = ESTILOS.map(() => "");
let ensaio = null;
let vazado = false;
const SEM_VAZADO = ["cartaz"];
const semFundo = () => vazado && !SEM_VAZADO.includes(ESTILOS[atual].nome);
const FONTES = {
  serifa: { familia: '"Instrument Serif"', peso: 400 },
  italica: { familia: '"Instrument Serif"', peso: 400, estilo: "italic" },
  bold: { familia: '"Archivo"', peso: 700 },
  extra: { familia: '"Archivo"', peso: 800 },
  estreita: { familia: '"Archivo Narrow"', peso: 700 },
  cursiva: { familia: '"Pinyon Script"', peso: 400 }
};
const ctx = document.createElement("canvas").getContext("2d");
const fonte = (f, corpo) => `${f.estilo || "normal"} ${f.peso} ${corpo}px ${f.familia}`;
function larg(texto2, f, corpo = 100) {
  ctx.font = fonte(f, corpo);
  return ctx.measureText(texto2).width;
}
function tintaDe(texto2, f, corpo = 100) {
  ctx.font = fonte(f, corpo);
  const m = ctx.measureText(texto2);
  return { esq: m.actualBoundingBoxLeft, dir: m.actualBoundingBoxRight };
}
const largTinta = (texto2, f, corpo = 100) => {
  const t = tintaDe(texto2, f, corpo);
  return t.esq + t.dir;
};
function ajustar(texto2, f, w, max = Infinity) {
  return Math.min(max, 100 * w / largTinta(texto2, f));
}
function alturaCaps(f, corpo) {
  ctx.font = fonte(f, corpo);
  return ctx.measureText("H").actualBoundingBoxAscent;
}
function equilibrar(palavras, k, f) {
  if (k > palavras.length) return null;
  let melhor = null;
  const tentar = (ini, resta, linhas) => {
    if (resta === 1) {
      const ls = [...linhas, palavras.slice(ini).join(" ")];
      const max = Math.max(...ls.map((l) => largTinta(l, f)));
      if (!melhor || max < melhor.max) melhor = { linhas: ls, max };
      return;
    }
    for (let fim = ini + 1; fim <= palavras.length - resta + 1; fim++) {
      tentar(fim, resta - 1, [...linhas, palavras.slice(ini, fim).join(" ")]);
    }
  };
  tentar(0, k, []);
  return melhor;
}
let cena, raiz, sangria;
function referencial(m) {
  return { m };
}
function pivo(x, y, graus) {
  return referencial(raiz.m.translate(x, y).rotate(graus));
}
const IMAGENS = {};
function carregar(src) {
  if (!IMAGENS[src]) {
    const img = new Image();
    img.src = src;
    img.decode().then(pedirDesenho, () => {
    });
    IMAGENS[src] = img;
  }
  return IMAGENS[src];
}
function imagem(src, { x, y, w, h, opacidade = 1, pai = raiz, tinta = false }) {
  (tinta ? cena.tinta : cena.base).push({ tipo: "imagem", img: carregar(src), x, y, w, h, opacidade, m: pai.m });
}
function estrela(cor, { x, y, lado, opacidade = 1 }) {
  if (semFundo()) return;
  imagem(`estrela-${cor}.png`, { x, y, w: lado, h: lado, opacidade });
}
function losango({ x, y, w, h }) {
  cena.base.push({ tipo: "losango", x, y, w, h, m: raiz.m });
}
function regua({ x, y, w, h, cor = ESTILOS[atual].letra }) {
  cena.base.push({ tipo: "regua", x, y, w, h, cor, m: raiz.m });
}
function forma(caminho, { espessura, cor = ESTILOS[atual].letra }) {
  cena.base.push({ tipo: "forma", caminho, espessura, cor, m: raiz.m });
}
function texto(conteudo, f, corpo, { x = MARGEM, y, w = UTIL, alinhar = "left", caps = true, entrelinha = 1, cor, vaos, pai = raiz }) {
  const font = fonte(f, corpo);
  ctx.font = font;
  const mH = ctx.measureText("H");
  const lh = corpo * entrelinha;
  const base0 = caps ? y + mH.actualBoundingBoxAscent : y + lh / 2 + (mH.fontBoundingBoxAscent - mH.fontBoundingBoxDescent) / 2;
  const tinta = cor || ESTILOS[atual].letra;
  const linhas = Array.isArray(conteudo) ? [conteudo] : String(conteudo).split("\n");
  linhas.forEach((linha, i) => {
    const base = base0 + i * lh;
    if (Array.isArray(linha) && linha.length > 1) {
      const medidas = linha.map((p) => tintaDe(p, f, corpo));
      const ocupado = medidas.reduce((s2, m) => s2 + m.esq + m.dir, 0);
      const pesos = vaos || linha.slice(1).map(() => 1);
      const total = pesos.reduce((s2, p) => s2 + p, 0);
      let cursor = x;
      linha.forEach((p, k) => {
        cena.tinta.push({ s: p, font, x: cursor + medidas[k].esq, y: base, cor: tinta, m: pai.m });
        cursor += medidas[k].esq + medidas[k].dir + (k < pesos.length ? (w - ocupado) * pesos[k] / total : 0);
      });
      return;
    }
    const s = Array.isArray(linha) ? linha[0] : linha;
    const t = tintaDe(s, f, corpo), largura = t.esq + t.dir;
    const inicio = alinhar === "center" ? x + (w - largura) / 2 : alinhar === "right" ? x + w - largura : x;
    cena.tinta.push({ s, font, x: inicio + t.esq, y: base, cor: tinta, m: pai.m });
  });
}
const maiusculas = (t) => t.toLocaleUpperCase("pt-BR");
function justificar(l, f, corpo) {
  const p = l.split(" "), letras = Array.from(l.normalize("NFC"));
  if (p.length > 1) return p;
  const folga = (UTIL - larg(l, f, corpo)) / (letras.length - 1);
  return letras.length > 1 && folga <= corpo ? letras : l;
}
function cartaz(t) {
  estrela("amarela", { x: 20, y: 155, lado: 1040, opacidade: 0.7 });
  const T = maiusculas(t), APOIO = ["E", "ESTOU", "COM", "LULA"];
  const cL = ajustar(T, FONTES.serifa, UTIL, 300), cA = 86;
  const hL = alturaCaps(FONTES.serifa, cL), hA = alturaCaps(FONTES.extra, cA), vao = 0.155 * cL;
  const passo = hL + hA + 2 * vao;
  const giro = pivo(39.6, 6.7, -2.57);
  const comeco = -Math.ceil(sangria.cima / passo) * passo;
  for (let y = comeco; y < A + sangria.baixo + 300; y += passo) {
    texto(T, FONTES.serifa, cL, { x: 0, y, alinhar: "center", pai: giro });
    texto(APOIO, FONTES.extra, cA, { x: 0, y: y + hL + vao, pai: giro });
  }
}
function cantos(t) {
  const f = FONTES.estreita, T = maiusculas(t);
  const corpo = Math.min(108, 100 * (UTIL - 56) / (largTinta("SOU", f) + largTinta(T, f)));
  const h = alturaCaps(f, corpo);
  const y3 = Q.pe - h, y2 = y3 - 36 - h;
  texto(["SOU", ...T.split(" ")], f, corpo, { y: Q.topo });
  texto(["E", "MEU", "FECHAMENTO"], f, corpo, { y: y2 });
  texto(["É", "O", "LULA"], f, corpo, { y: y3 });
  const cima = Q.topo + h + 48, baixo = y2 - 48, lado = Math.min(1040, baixo - cima);
  estrela("amarela", { x: (L - lado) / 2, y: cima + (baixo - cima - lado) / 2, lado });
}
function estrelaAmarela(t) {
  const T = maiusculas(t);
  const cLula = ajustar("LULA", FONTES.estreita, UTIL);
  const yLula = Q.pe - alturaCaps(FONTES.estreita, cLula);
  texto("LULA", FONTES.estreita, cLula, { y: yLula, alinhar: "center" });
  const cPor = 86;
  const yPor = yLula - 36 - alturaCaps(FONTES.bold, cPor);
  texto(["POR", "ISSO", "VOTO", "EM"], FONTES.bold, cPor, { y: yPor });
  let linhas = [T];
  if (T.length > 16) linhas = equilibrar(T.split(" "), 2, FONTES.bold)?.linhas || linhas;
  let corpo = Math.min(170, ...linhas.map((l) => ajustar(l, FONTES.bold, UTIL)));
  const tres = T.length > 28 && equilibrar(T.split(" "), 3, FONTES.bold);
  if (tres && Math.min(130, 100 * UTIL / tres.max) > corpo) {
    linhas = tres.linhas;
    corpo = Math.min(130, 100 * UTIL / tres.max);
  }
  const h = alturaCaps(FONTES.bold, corpo);
  let y = yPor - 36 - h;
  for (let i = linhas.length - 1; i >= 0; i--) {
    texto(justificar(linhas[i], FONTES.bold, corpo), FONTES.bold, corpo, { y, alinhar: "center" });
    if (i) y -= 36 + h;
  }
  const livre = y - 48 - Q.topo;
  const lado = Math.min(1040, livre * 0.7 / 0.85);
  estrela("amarela", { x: (L - lado) / 2, y: (Q.topo + y - 48) / 2 - 0.48 * lado, lado });
}
function cursivaLinhas(t, { w, alto, kMax, teto, entrelinha }) {
  const f = FONTES.cursiva, palavras = t.split(" ");
  let melhor = null;
  for (let k = 1; k <= Math.min(kMax, palavras.length); k++) {
    const e = k === 1 ? { linhas: [t], max: largTinta(t, f) } : equilibrar(palavras, k, f);
    const corpo = Math.min(teto, 100 * w / e.max, alto / (k * entrelinha));
    if (!melhor || corpo > melhor.corpo) melhor = { linhas: e.linhas, corpo };
  }
  return melhor;
}
function quebrar(palavras, k, f, W) {
  const n = palavras.length;
  if (k > n) return null;
  const novo = () => Array.from({ length: k + 1 }, () => new Array(n + 1).fill(Infinity));
  const M = novo();
  M[0][0] = 0;
  for (let c = 1; c <= k; c++)
    for (let j = c; j <= n; j++)
      for (let i = c - 1; i < j; i++) M[c][j] = Math.min(M[c][j], Math.max(M[c - 1][i], W[i][j]));
  const max = M[k][n];
  const S = novo(), de = novo();
  S[0][0] = 0;
  for (let c = 1; c <= k; c++)
    for (let j = c; j <= n; j++)
      for (let i = c - 1; i < j; i++) {
        if (W[i][j] > max + 0.01 || S[c - 1][i] === Infinity) continue;
        const v = S[c - 1][i] + (max - W[i][j]) ** 2;
        if (v < S[c][j]) {
          S[c][j] = v;
          de[c][j] = i;
        }
      }
  const linhas = [];
  for (let c = k, j = n; c > 0; c--) {
    const i = de[c][j];
    linhas.unshift(palavras.slice(i, j).join(" "));
    j = i;
  }
  return { linhas, max };
}
function blocoLongo(t, { f, w, alto, kMax, teto }) {
  const palavras = t.split(" "), n = palavras.length;
  const W = palavras.map((_, i) => {
    const linha = [];
    for (let j = i + 1; j <= n; j++) linha[j] = largTinta(palavras.slice(i, j).join(" "), f);
    return linha;
  });
  const capa = alturaCaps(f, 100) / 100;
  const vaoDe = (corpo) => Math.min(36, 0.5 * capa * corpo);
  let melhor = null;
  for (let k = 1; k <= Math.min(kMax, n); k++) {
    const e = quebrar(palavras, k, f, W);
    let corpo = Math.min(teto, 100 * w / e.max);
    for (let v = 0; v < 6 && k * capa * corpo + (k - 1) * vaoDe(corpo) > alto; v++)
      corpo = (alto - (k - 1) * vaoDe(corpo)) / (k * capa);
    if (!melhor || corpo > melhor.corpo + 0.5) melhor = { linhas: e.linhas, corpo };
  }
  return { ...melhor, vao: vaoDe(melhor.corpo), h: capa * melhor.corpo };
}
function verde(t) {
  if (formato === "stories") estrela("amarela", { x: 20, y: 155 + Q.miolo, lado: 1040, opacidade: 0.85 });
  else estrela("amarela", { x: (L - 911) / 2, y: 207, lado: 911, opacidade: 0.85 });
  const f = FONTES.extra, hN = alturaCaps(f, 128), hP = alturaCaps(f, 86);
  texto(["NÃO", "PRECISO"], f, 128, { y: Q.topo });
  const yP = Q.pe - hP;
  texto(["PRA", "VOTAR", "EM", "LULA"], f, 86, { y: yP });
  const ySelo = yP - 48 - 131.5;
  imagem("selo-brasil-branco.svg", { x: (L - 180) / 2, y: ySelo, w: 180, h: 131.5, tinta: true });
  const fc = FONTES.cursiva, W = UTIL - 80;
  let linhas = [t], corpo = ajustar(t, fc, W, 230);
  if (corpo < 160) {
    const e = equilibrar(t.split(" "), 2, fc);
    if (e) {
      linhas = e.linhas;
      corpo = Math.min(210, 100 * W / e.max);
    }
  }
  if (corpo < 140) {
    const e = equilibrar(t.split(" "), 3, fc);
    if (e && Math.min(190, 100 * W / e.max) > corpo) {
      linhas = e.linhas;
      corpo = Math.min(190, 100 * W / e.max);
    }
  }
  const cima = Q.topo + hN + 48, baixo = ySelo - 48, alt = linhas.length * 0.96 * corpo;
  texto(linhas.join("\n"), fc, corpo, { y: (cima + baixo - alt) / 2, caps: false, entrelinha: 0.96, alinhar: "center" });
}
function prefiro(t) {
  estrela("branca", { x: 20, y: 155 + Q.miolo, lado: 1040, opacidade: 0.3 });
  estrela("branca", { x: 20, y: 155 + Q.miolo, lado: 1040, opacidade: 0.1 });
  const f = FONTES.extra, h = alturaCaps(f, 70);
  texto(["EU", "PREFIRO"], f, 70, { y: Q.topo });
  const yRegua = Q.pe - 5, yA = yRegua - 12 - h;
  texto(["A", "VOTAR", "NAQUELE", "CARA"], f, 70, { y: yA });
  regua({ x: MARGEM, y: yRegua, w: UTIL, h: 5 });
  const W = 924, livre = yA - 48 - (Q.topo + h + 48);
  const { linhas, corpo } = cursivaLinhas(t, { w: W, alto: livre, kMax: 5, teto: 220, entrelinha: 0.92 });
  const alt = linhas.length * 0.92 * corpo;
  const giro = pivo(L / 2, 687 + Q.miolo, -6);
  texto(linhas.join("\n"), FONTES.cursiva, corpo, { x: -W / 2, y: -alt / 2, w: W, caps: false, entrelinha: 0.92, alinhar: "center", pai: giro });
}
function azul(t) {
  estrela("branca", { x: 20, y: 155 + Q.miolo, lado: 1040, opacidade: 0.2 });
  imagem("selo-brasil-branco.svg", { x: MARGEM, y: Q.topo, w: 180, h: 131.5, tinta: true });
  const f = FONTES.extra, c = 86, hc = alturaCaps(f, c);
  const yNada = Q.topo + 131.5 + 72;
  texto(["NADA", "A", "VER"], f, c, { y: yNada });
  const cLula = ajustar("LULA", FONTES.estreita, UTIL), hLula = alturaCaps(FONTES.estreita, cLula);
  const yLula = Q.pe - hLula;
  texto("LULA", FONTES.estreita, cLula, { x: -UTIL / 2, y: -hLula / 2, alinhar: "center", pai: pivo(L / 2, yLula + hLula / 2, 0.8) });
  const yMas = yLula - 36 - hc;
  texto(["MAS", "MEU", "VOTO", "É"], f, c, { y: yMas - 10 });
  const palavras = maiusculas(t).split(" ");
  let esc;
  for (let k = 1; k <= Math.min(4, palavras.length); k++) {
    const e = k === 1 ? { linhas: [palavras.join(" ")], max: largTinta(palavras.join(" "), f) } : equilibrar(palavras, k, f);
    esc = { linhas: e.linhas, corpo: Math.min(k === 4 ? 100 : 128, 100 * UTIL / e.max) };
    if (esc.corpo >= 100) break;
  }
  const { linhas, corpo } = esc, h = alturaCaps(f, corpo);
  const bloco = linhas.length * h + (linhas.length - 1) * 36;
  const giro = pivo(L / 2, (yNada + hc + yMas) / 2, -2);
  linhas.forEach((l, i) => texto(justificar(l, f, corpo), f, corpo, { x: -UTIL / 2, y: -bloco / 2 + i * (h + 36), alinhar: "center", pai: giro }));
}
function cafona(t) {
  estrela("azul", { x: 20, y: 155 + Q.miolo, lado: 1040, opacidade: 0.3 });
  imagem("selo-brasil-azul.svg", { x: MARGEM, y: Q.pe - 131.5, w: 180, h: 131.5, tinta: true });
  const f = FONTES.extra, palavras = maiusculas(t).split(" ");
  let melhor = null;
  for (let k = 1; k <= Math.min(4, palavras.length); k++) {
    const e = k === 1 ? { linhas: [palavras.join(" ")], max: largTinta(palavras.join(" "), f) } : equilibrar(palavras, k, f);
    const corpo2 = Math.min(k === 4 ? 110 : k === 3 ? 130 : 150, 100 * UTIL / e.max);
    if (!melhor || corpo2 > melhor.corpo) melhor = { linhas: e.linhas, corpo: corpo2 };
  }
  const { linhas, corpo } = melhor;
  const h = alturaCaps(f, corpo);
  let y = Q.topo;
  linhas.forEach((l, i) => {
    texto(justificar(l, f, corpo), f, corpo, { y, alinhar: "center" });
    if (i < linhas.length - 1) y += h + 36;
  });
  const fimLacuna = y + h;
  const cb = 108, hb = alturaCaps(f, cb);
  const y3 = Q.pe - 131.5 - 48 - hb, y2 = y3 - 36 - hb, y1 = y2 - 36 - hb;
  texto(["MAS", "VOTAR", "NO"], f, cb, { y: y1 });
  texto(["LULA", "É"], f, cb, { y: y2 });
  texto(["CHIC", "DEMAIS"], f, cb, { y: y3 });
  const cC = 220, alto = 0.92 * cC, largura = 792;
  const centro = pivo(L / 2, (fimLacuna + y1) / 2, -3.3);
  texto("é cafona...", FONTES.cursiva, cC, { x: -largura / 2, y: -alto / 2, w: largura, caps: false, entrelinha: 0.92, alinhar: "center", pai: centro });
}
function estrelas(t) {
  const passo = (UTIL - 84.6) / 7;
  for (const topo of [Q.topo, Q.pe - 90]) {
    for (let i = 0; i < 8; i++) {
      imagem("estrela-azul.png", { x: -78.1 / 2, y: -84 / 2, w: 78.1, h: 84, pai: pivo(MARGEM + i * passo + 84.6 / 2, topo + 45, 175.4) });
    }
  }
  const fc = FONTES.cursiva, c1 = 210, y1 = 250 + Q.miolo;
  texto("Não preciso", fc, c1, { y: y1, caps: false, entrelinha: 0.96, alinhar: "center" });
  const t1 = tintaDe("Não preciso", fc, c1);
  const origem = MARGEM + (UTIL - (t1.esq + t1.dir)) / 2 + t1.esq;
  regua({ x: origem, y: y1 + 164.2, w: larg("Não", fc, c1), h: 8.1 });
  texto("pra votar em Lula", fc, 140, { y: 973 + Q.miolo, caps: false, entrelinha: 0.96, alinhar: "center" });
  const f = FONTES.extra, palavras = maiusculas(t).split(" ");
  let esc;
  for (let k = 1; k <= Math.min(4, palavras.length); k++) {
    const e = k === 1 ? { linhas: [palavras.join(" ")], max: largTinta(palavras.join(" "), f) } : equilibrar(palavras, k, f);
    esc = { linhas: e.linhas, corpo: Math.min(k === 4 ? 110 : 128, 100 * UTIL / e.max) };
    if (esc.corpo >= 100) break;
  }
  const { linhas, corpo } = esc, h = alturaCaps(f, corpo);
  const bloco = linhas.length * h + (linhas.length - 1) * 36;
  const giro = pivo(L / 2, 713 + Q.miolo, -4.6);
  linhas.forEach((l, i) => texto(justificar(l, f, corpo), f, corpo, { x: -UTIL / 2, y: -bloco / 2 + i * (h + 36), alinhar: "center", pai: giro }));
}
function porIssoLongo(t) {
  const cLula = ajustar("LULA", FONTES.estreita, UTIL);
  const yLula = Q.pe - alturaCaps(FONTES.estreita, cLula);
  const cPor = 86, yPor = yLula - 36 - alturaCaps(FONTES.bold, cPor);
  const alto = yPor - 48 - Q.topo, lado = Math.min(1040, alto);
  estrela("amarela", { x: (L - lado) / 2, y: Q.topo + (alto - lado) / 2, lado, opacidade: 0.4 });
  texto("LULA", FONTES.estreita, cLula, { y: yLula, alinhar: "center" });
  texto(["POR", "ISSO", "VOTO", "EM"], FONTES.bold, cPor, { y: yPor });
  const f = FONTES.bold, { linhas, corpo, vao, h } = blocoLongo(maiusculas(t), { f, w: UTIL, alto: yPor - 36 - Q.topo, kMax: 10, teto: 128 });
  let y = yPor - 36 - h;
  for (let i = linhas.length - 1; i >= 0; i--, y -= h + vao)
    texto(justificar(linhas[i], f, corpo), f, corpo, { y, alinhar: "center" });
}
function prefiroLongo(t) {
  const f = FONTES.extra, h70 = alturaCaps(f, 70);
  const yRegua = Q.pe - 5, yA = yRegua - 12 - h70;
  const cima = Q.topo + h70 + 48, alto = yA - 48 - cima, lado = Math.min(1040, alto);
  estrela("amarela", { x: (L - lado) / 2, y: cima + (alto - lado) / 2, lado, opacidade: 0.4 });
  texto(["EU", "PREFIRO"], f, 70, { y: Q.topo });
  texto(["A", "VOTAR", "NAQUELE", "CARA"], f, 70, { y: yA });
  regua({ x: MARGEM, y: yRegua, w: UTIL, h: 5 });
  const { linhas, corpo, vao, h } = blocoLongo(maiusculas(t), { f, w: UTIL, alto, kMax: 10, teto: 128 });
  const bloco = linhas.length * h + (linhas.length - 1) * vao;
  linhas.forEach((l, i) => texto(justificar(l, f, corpo), f, corpo, { y: cima + (alto - bloco) / 2 + i * (h + vao), alinhar: "center" }));
}
function google(t, { topo = ["PROCUREI NO"], fim = true } = {}) {
  const fb = FONTES.bold, c = 60, hC = alturaCaps(fb, c);
  const b = busca(t);
  const hTopo = topo.length * hC + (topo.length - 1) * 36;
  const bloco = hTopo + 36 + LOGO_H + 48 + b.altura + (fim ? 72 + hC : 0);
  const y0 = Q.topo + Math.max(0, (Q.pe - Q.topo - bloco) / 2);
  topo.forEach((l, i) => texto(l, fb, c, { y: y0 + i * (hC + 36), alinhar: "center" }));
  const yLogo = y0 + hTopo + 36;
  imagem("logo-google.svg", { x: MARGEM, y: yLogo, w: UTIL, h: LOGO_H, tinta: true });
  const yBarra = yLogo + LOGO_H + 48;
  b.desenhar(yBarra);
  if (fim) texto("E AGORA VOTO EM LULA", fb, c, { y: yBarra + b.altura + 72, alinhar: "center" });
}
function googleAdoro(t) {
  const fb = FONTES.bold, c = 86, h86 = alturaCaps(fb, c);
  const cLula = ajustar("LULA", FONTES.estreita, UTIL), hLula = alturaCaps(FONTES.estreita, cLula);
  const bloco = h86 + 36 + LOGO_H + 36 + h86 + 36 + hLula;
  const b = busca(t), yBarra = Q.pe - b.altura;
  b.desenhar(yBarra);
  const y0 = Q.topo + (formato === "stories" ? Math.max(0, (yBarra - 48 - Q.topo - bloco) / 2) : 0);
  texto(["EU", "ADORO", "USAR", "O"], fb, c, { y: y0 });
  const yLogo = y0 + h86 + 36;
  imagem("logo-google.svg", { x: MARGEM, y: yLogo, w: UTIL, h: LOGO_H, tinta: true });
  const yPor = yLogo + LOGO_H + 36;
  texto(["POR", "ISSO", "VOTO", "EM"], fb, c, { y: yPor });
  texto("LULA", FONTES.estreita, cLula, { y: yPor + h86 + 36, alinhar: "center" });
}
const LOGO_H = UTIL * 92 / 272;
function busca(t) {
  const fb = FONTES.bold, ALTURA = 136, ESQ = 124, DIR = 56, interno = UTIL - ESQ - DIR, entre = 1.25;
  let linhas = [t], cb = Math.min(52, 100 * interno / largTinta(t, fb));
  if (cb < 36) {
    const duas = equilibrar(t.split(" "), 2, fb);
    if (duas) {
      linhas = duas.linhas;
      cb = Math.min(52, 100 * interno / duas.max);
    }
  }
  const altura = ALTURA + (linhas.length - 1) * cb * entre;
  return {
    altura,
    desenhar(y) {
      const barra = new Path2D();
      barra.roundRect(MARGEM, y, UTIL, altura, ALTURA / 2);
      forma(barra, { espessura: 5 });
      const cx = MARGEM + 64, cy = y + altura / 2;
      const lupa = new Path2D();
      lupa.arc(cx - 5, cy - 5, 19, 0, 2 * Math.PI);
      lupa.moveTo(cx + 9, cy + 9);
      lupa.lineTo(cx + 24, cy + 24);
      forma(lupa, { espessura: 5 });
      texto(linhas.join("\n"), fb, cb, { x: MARGEM + ESQ, y: cy - linhas.length * cb * entre / 2, w: interno, caps: false, entrelinha: entre });
    }
  };
}
const g = tela.getContext("2d");
const camada = document.createElement("canvas");
const gc = camada.getContext("2d", { willReadFrequently: true });
function pintar() {
  const { altura } = FORMATOS[formato];
  for (const c of [tela, camada]) {
    if (c.width !== L) c.width = L;
    if (c.height !== altura) c.height = altura;
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.clearRect(0, 0, L, altura);
  if (!semFundo()) {
    g.fillStyle = ESTILOS[atual].fundo;
    g.fillRect(0, 0, L, altura);
  }
  for (const p of cena.base) {
    if (p.tipo !== "imagem" || !p.img.complete || !p.img.naturalWidth) continue;
    g.setTransform(p.m);
    g.globalAlpha = p.opacidade;
    g.drawImage(p.img, p.x, p.y, p.w, p.h);
  }
  g.globalAlpha = 1;
  const tracos = cena.base.filter((p) => p.tipo === "losango" || p.tipo === "regua" || p.tipo === "forma");
  if (tracos.length) {
    limpar(gc, altura);
    gc.strokeStyle = COR.branco;
    gc.lineWidth = 2.5;
    for (const p of tracos) {
      gc.setTransform(p.m);
      if (p.tipo === "regua") {
        gc.fillStyle = p.cor;
        gc.fillRect(p.x, p.y, p.w, p.h);
        continue;
      }
      if (p.tipo === "forma") {
        gc.save();
        gc.strokeStyle = p.cor;
        gc.lineWidth = p.espessura;
        gc.lineCap = "round";
        gc.stroke(p.caminho);
        gc.restore();
        continue;
      }
      gc.beginPath();
      gc.moveTo(p.x + p.w / 2, p.y);
      gc.lineTo(p.x + p.w, p.y + p.h / 2);
      gc.lineTo(p.x + p.w / 2, p.y + p.h);
      gc.lineTo(p.x, p.y + p.h / 2);
      gc.closePath();
      gc.stroke();
    }
    desgastar(gc, altura, false);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(camada, 0, 0);
  }
  limpar(gc, altura);
  gc.textBaseline = "alphabetic";
  for (const p of cena.tinta) {
    gc.setTransform(p.m);
    if (p.tipo === "imagem") {
      if (!p.img.complete || !p.img.naturalWidth) continue;
      gc.globalAlpha = p.opacidade;
      gc.drawImage(p.img, p.x, p.y, p.w, p.h);
      gc.globalAlpha = 1;
      continue;
    }
    gc.font = p.font;
    gc.fillStyle = p.cor;
    gc.fillText(p.s, p.x, p.y);
  }
  desgastar(gc, altura, true);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(camada, 0, 0);
}
function limpar(c, altura) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, L, altura);
}
const LADO = 520;
const BORDA = 1.6;
const DENSIDADE = 0.2;
const FALHA = 0.55;
const campo = (() => {
  const aleatorios = (n, semente) => {
    const v = new Float32Array(n * n);
    let s = semente;
    for (let i = 0; i < v.length; i++) {
      s = Math.imul(s, 1664525) + 1013904223 >>> 0;
      v[i] = s / 4294967296;
    }
    return v;
  };
  const suave = (passo, semente) => {
    const n = Math.round(LADO / passo), v = aleatorios(n, semente);
    return (x, y) => {
      const fx = x / LADO * n, fy = y / LADO * n;
      const ix = Math.floor(fx), iy = Math.floor(fy);
      let tx = fx - ix, ty = fy - iy;
      tx = tx * tx * (3 - 2 * tx);
      ty = ty * ty * (3 - 2 * ty);
      const a = v[iy % n * n + ix % n], b = v[iy % n * n + (ix + 1) % n];
      const c = v[(iy + 1) % n * n + ix % n], d = v[(iy + 1) % n * n + (ix + 1) % n];
      return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
    };
  };
  const ondaX = suave(1.6, 7), ondaX2 = suave(0.8, 11), ondaY = suave(1.6, 13), ondaY2 = suave(0.8, 17);
  const nGrao = Math.round(LADO / 1.3), grao = aleatorios(nGrao, 3);
  const dx = new Int8Array(LADO * LADO), dy = new Int8Array(LADO * LADO), furo = new Uint8Array(LADO * LADO);
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const i = y * LADO + x;
      dx[i] = Math.round((0.6 * ondaX(x, y) + 0.4 * ondaX2(x, y) - 0.5) * 2 * BORDA * 16);
      dy[i] = Math.round((0.6 * ondaY(x, y) + 0.4 * ondaY2(x, y) - 0.5) * 2 * BORDA * 16);
      const r = grao[Math.floor(y / LADO * nGrao) * nGrao + Math.floor(x / LADO * nGrao)];
      furo[i] = r < DENSIDADE ? Math.round(255 * (1 - FALHA)) : 255;
    }
  }
  return { dx, dy, furo };
})();
function desgastar(c, altura, comFuros) {
  const img = c.getImageData(0, 0, L, altura);
  const src = img.data, out = new Uint8ClampedArray(src.length);
  const { dx, dy, furo } = campo;
  for (let y = 0; y < altura; y++) {
    const ty = y % LADO * LADO;
    for (let x = 0; x < L; x++) {
      const t = ty + x % LADO;
      const sx = x + (dx[t] + 8 >> 4), sy = y + (dy[t] + 8 >> 4);
      if (sx < 0 || sy < 0 || sx >= L || sy >= altura) continue;
      const i = (sy * L + sx) * 4;
      const a = src[i + 3];
      if (!a) continue;
      const j = (y * L + x) * 4;
      out[j] = src[i];
      out[j + 1] = src[i + 1];
      out[j + 2] = src[i + 2];
      out[j + 3] = comFuros ? a * furo[t] / 255 : a;
    }
  }
  img.data.set(out);
  c.putImageData(img, 0, 0);
}
function limpo(s) {
  return s.replace(/\s+/g, " ").trim();
}
function desenhar() {
  const e = ESTILOS[atual];
  const t = limpo(textos[atual]) || (ensaio ?? e.exemplo);
  const { altura } = FORMATOS[formato];
  const dy = e.grade ? 0 : FORMATOS[formato].dy;
  Q = e.grade ? QUADROS[formato] : QUADROS.feed;
  cena = { base: [], tinta: [] };
  raiz = referencial(new DOMMatrix().translate(0, dy));
  sangria = { cima: dy, baixo: altura - A - dy };
  e.montar(t);
  pintar();
  tela.setAttribute("aria-label", limpo(`${e.antes} ${t} ${e.depois}`));
  escalar();
}
let pedido = 0;
function pedirDesenho() {
  cancelAnimationFrame(pedido);
  pedido = requestAnimationFrame(desenhar);
}
function escalar() {
  const { altura } = FORMATOS[formato];
  const s = Math.min(palco.clientWidth / L, palco.clientHeight / altura);
  tela.style.width = L * s + "px";
  tela.style.height = altura * s + "px";
}
function escolher(i, { foco = false } = {}) {
  pararDica(false);
  atual = i;
  const e = ESTILOS[i];
  document.body.dataset.estilo = i + 1;
  document.body.dataset.letra = e.letra === COR.branco ? "branca" : "cor";
  botaoVazado.hidden = SEM_VAZADO.includes(e.nome);
  marcarVazado();
  document.querySelector('meta[name="theme-color"]').content = e.fundo;
  pontos.forEach((p, k) => p.setAttribute("aria-checked", String(k === i)));
  antes.textContent = e.antes;
  depois.textContent = e.depois;
  lacuna.value = textos[i];
  lacuna.placeholder = e.exemplo;
  lacuna.maxLength = e.max;
  ajustarCampo();
  history.replaceState(null, "", "#" + (i + 1));
  desenhar();
  if (foco) pontos[i].focus();
  if (pronto) dica();
}
function ajustarCampo() {
  const n = Math.max(lacuna.value.length, ESTILOS[atual].exemplo.length, 4);
  lacuna.style.width = n + 1 + "ch";
}
let pronto = false;
let dicaViva = true, dicaRelogio = 0;
const frase = $("frase");
const querDica = () => dicaViva && !textos[atual] && !matchMedia("(prefers-reduced-motion: reduce)").matches;
function esvaziar() {
  ensaio = "";
  lacuna.placeholder = "|";
  frase.classList.add("dica");
  desenhar();
}
function dica() {
  clearTimeout(dicaRelogio);
  if (!querDica()) return;
  const ex = ESTILOS[atual].exemplo;
  const passos = [["", 250]];
  for (let n = 1; n <= ex.length; n++) passos.push([ex.slice(0, n), 65]);
  let k = 0;
  frase.classList.add("dica");
  const passo = () => {
    if (k === passos.length) return pararDica();
    const [s, espera] = passos[k++];
    ensaio = s;
    lacuna.placeholder = s + "|";
    pedirDesenho();
    dicaRelogio = setTimeout(passo, espera);
  };
  passo();
}
function pararDica(redesenhar = true) {
  clearTimeout(dicaRelogio);
  if (ensaio === null) return;
  ensaio = null;
  frase.classList.remove("dica");
  lacuna.placeholder = ESTILOS[atual].exemplo;
  if (redesenhar) {
    cancelAnimationFrame(pedido);
    desenhar();
  }
}
function largarDica() {
  dicaViva = false;
  pararDica();
}
["pointerdown", "focus"].forEach((ev) => lacuna.addEventListener(ev, largarDica));
const pontos = ESTILOS.map((e, i) => {
  const b = document.createElement("button");
  b.className = "ponto";
  b.type = "button";
  b.dataset.i = i + 1;
  b.setAttribute("role", "radio");
  b.setAttribute("aria-label", `estilo ${i + 1}, ${e.nome}`);
  b.addEventListener("click", () => escolher(i));
  $("estilos").append(b);
  return b;
});
$("estilos").addEventListener("keydown", (ev) => {
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
  if (!d) return;
  ev.preventDefault();
  escolher((atual + d + ESTILOS.length) % ESTILOS.length, { foco: true });
});
const escritos = /* @__PURE__ */ new Set();
const rotulo = () => `${atual + 1}-${ESTILOS[atual].nome.replace(/\s+/g, "-")}`;
function contar(nome) {
  window.goatcounter?.count?.({ path: nome, title: nome, event: true });
}
lacuna.addEventListener("input", () => {
  textos[atual] = lacuna.value;
  ajustarCampo();
  pedirDesenho();
  if (limpo(lacuna.value) && !escritos.has(atual)) {
    escritos.add(atual);
    contar(`escreveu/${rotulo()}`);
  }
});
$("frase").addEventListener("submit", (ev) => {
  ev.preventDefault();
  lacuna.blur();
});
const botoesFormato = [...document.querySelectorAll("button[data-formato]")];
function escolherFormato(f) {
  formato = f;
  document.body.dataset.formato = f;
  botoesFormato.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.formato === f)));
  desenhar();
}
botoesFormato.forEach((b) => b.addEventListener("click", () => escolherFormato(b.dataset.formato)));
const botaoVazado = $("vazado");
function marcarVazado() {
  document.body.toggleAttribute("data-vazado", semFundo());
}
botaoVazado.addEventListener("click", () => {
  vazado = !vazado;
  botaoVazado.setAttribute("aria-pressed", String(vazado));
  marcarVazado();
  desenhar();
});
const ANDROID = /Android/i.test(navigator.userAgent);
const NO_APP = /Insta[g]ram|FBAN|FBAV|FB_IAB|musical_ly|Bytedance|TikTok/i.test(navigator.userAgent);
const quadro = $("quadro");
$("baixar").addEventListener("click", () => {
  pararDica();
  cancelAnimationFrame(pedido);
  desenhar();
  const sufixo = semFundo() ? "-sem-fundo" : "";
  contar(`baixou/${rotulo()}/${formato}${semFundo() ? "/sem-fundo" : ""}`);
  if (ANDROID && NO_APP) return mostrarArte();
  tela.toBlob(async (blob) => {
    if (!blob) return;
    const nome = `luly-generator-${ESTILOS[atual].nome.replace(/\s+/g, "-")}-${formato}${sufixo}.png`;
    const arquivo = new File([blob], nome, { type: "image/png" });
    const toque = matchMedia("(pointer: coarse)").matches;
    if (!ANDROID && toque && navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo] });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4e3);
  }, "image/png");
});
function mostrarArte() {
  quadro.querySelector("img").src = tela.toDataURL("image/png");
  const estado = new URLSearchParams({ f: formato, t: limpo(textos[atual]) });
  $("abrir-chrome").href = `intent://${location.host}${location.pathname}#${atual + 1}&${estado}#Intent;scheme=https;package=com.android.chrome;end`;
  quadro.hidden = false;
}
$("fechar-quadro").addEventListener("click", () => {
  quadro.hidden = true;
  quadro.querySelector("img").removeAttribute("src");
});
const BANCO = "https://avpgsuxnevsuocaqpcnc.supabase.co/rest/v1/envios";
const CHAVE = "sb_publishable_12oK4JiZiKhWhDpbN98GeQ_4gM9dEhH";
const enviados = /* @__PURE__ */ new Set();
const aviso = $("aviso");
function avisar(texto2) {
  aviso.textContent = texto2;
  aviso.hidden = false;
  clearTimeout(avisar.relogio);
  avisar.relogio = setTimeout(() => {
    aviso.hidden = true;
  }, 6e3);
}
$("enviar").addEventListener("click", async () => {
  const t = limpo(textos[atual]);
  if (!t) {
    avisar("escreva a sua frase antes de enviar");
    lacuna.focus();
    return;
  }
  const chave = `${atual}|${formato}|${t}`;
  if (enviados.has(chave)) {
    avisar("essa já foi enviada");
    return;
  }
  try {
    const r = await fetch(BANCO, {
      method: "POST",
      headers: { apikey: CHAVE, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ estilo: ESTILOS[atual].nome, formato, texto: t })
    });
    if (!r.ok) throw new Error(r.status);
    enviados.add(chave);
    contar(`enviou/${rotulo()}`);
    avisar("enviada! ela aparece na galeria depois de aprovada");
  } catch {
    avisar("não deu pra enviar agora, tenta de novo daqui a pouco");
  }
});
const galeria = $("galeria"), grade = $("galeria-grade"), estadoGaleria = $("galeria-estado");
function miniatura(e, i) {
  const guardado = { atual, formato, vazado, ensaio, texto: textos[i] };
  atual = i;
  formato = "feed";
  vazado = false;
  ensaio = null;
  textos[i] = e.texto;
  desenhar();
  const c = document.createElement("canvas");
  c.width = 432;
  c.height = 540;
  c.getContext("2d").drawImage(tela, 0, 0, c.width, c.height);
  ({ atual, formato, vazado, ensaio } = guardado);
  textos[i] = guardado.texto;
  return c;
}
async function abrirGaleria() {
  galeria.hidden = false;
  grade.replaceChildren();
  estadoGaleria.textContent = "carregando...";
  contar("abriu-galeria");
  let lista;
  try {
    const r = await fetch(`${BANCO}?select=estilo,formato,texto&order=criado_em.desc&limit=60`, { headers: { apikey: CHAVE } });
    if (!r.ok) throw new Error(r.status);
    lista = (await r.json()).map((e) => ({ ...e, i: ESTILOS.findIndex((s) => s.nome === e.estilo) })).filter((e) => e.i >= 0);
  } catch {
    estadoGaleria.textContent = "não deu pra abrir a galeria agora";
    return;
  }
  if (!lista.length) {
    estadoGaleria.textContent = "ainda não tem arte aprovada aqui. manda a sua!";
    return;
  }
  for (const i of new Set(lista.map((e) => e.i))) miniatura(lista.find((e) => e.i === i), i);
  await Promise.all(Object.values(IMAGENS).map((img) => img.decode().catch(() => {
  })));
  estadoGaleria.textContent = "toque numa arte pra abrir no gerador";
  for (const e of lista) {
    if (galeria.hidden) break;
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", limpo(`${ESTILOS[e.i].antes} ${e.texto} ${ESTILOS[e.i].depois}`));
    b.append(miniatura(e, e.i));
    b.addEventListener("click", () => {
      fecharGaleria();
      dicaViva = false;
      textos[e.i] = e.texto;
      escolher(e.i);
      if (e.formato !== formato) escolherFormato(e.formato);
    });
    grade.append(b);
    await new Promise((ok) => requestAnimationFrame(ok));
  }
  desenhar();
}
function fecharGaleria() {
  galeria.hidden = true;
  desenhar();
}
$("abrir-galeria").addEventListener("click", abrirGaleria);
$("fechar-galeria").addEventListener("click", fecharGaleria);
function medirTela() {
  const alto = window.visualViewport ? visualViewport.height : innerHeight;
  document.documentElement.style.setProperty("--alto", alto + "px");
  scrollTo(0, 0);
  escalar();
}
(window.visualViewport || window).addEventListener("resize", medirTela);
new ResizeObserver(escalar).observe(palco);
function doEndereco() {
  const n = parseInt(location.hash.slice(1), 10);
  return n >= 1 && n <= ESTILOS.length ? n - 1 : 0;
}
const [, resto = ""] = location.hash.slice(1).split(/&(.*)/);
escolher(doEndereco());
if (resto) {
  const p = new URLSearchParams(resto);
  if (p.get("f") in FORMATOS) escolherFormato(p.get("f"));
  const t = (p.get("t") || "").slice(0, ESTILOS[atual].max);
  if (t) {
    textos[atual] = lacuna.value = t;
    ajustarCampo();
    dicaViva = false;
    desenhar();
  }
  history.replaceState(null, "", "#" + (atual + 1));
}
if (querDica()) esvaziar();
medirTela();
addEventListener("hashchange", () => {
  if (doEndereco() !== atual) escolher(doEndereco());
});
Promise.all(Object.values(FONTES).map((f) => document.fonts.load(fonte(f, 100), "AÃÇÉ abc"))).then(desenhar, desenhar).then(() => {
  pronto = true;
  if (document.hidden) document.addEventListener("visibilitychange", dica, { once: true });
  else dica();
});
