const monLog = require("../src/monLog");
const fs = require("fs");
const path = require("path");
const parseASS = require("ass-compiler").parse;
let styleOutClassic = [];
let styleItalicClassic = [];
let styleToVtt = {};
let integrerStyle = false;
let extensionA11Y = "_a11y";
let extensionClassic = "_classic";

const re_newline = /\\N/g; // replace \N with newline
const re_newline_tiret = /\\N-/g;
const re_accolade_tiret = /\}-/g;
const re_softbreak = /\\n/g; // There's no equivalent function in WebVTT.
const re_hardspace = /\\h/g; // Replace with &nbsp;

// prototype
Number.prototype.toVTTtime = function () {
  let time = new Date("1995-12-17T00:00:00");
  time.setMilliseconds(this * 1000);
  let time_tab = [
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds(),
  ].map((v, i) => {
    if (i < 3) {
      v = v < 10 ? "0" + v : v;
    } else {
      v = v === 0 ? "000" : v;
      v = v < 100 && v >= 10 ? "0" + v : v;
    }
    return v;
  });
  return `${time_tab[0]}:${time_tab[1]}:${time_tab[2]}.${time_tab[3]}`;
};

String.prototype.hexcolor = function () {
  return "#" + this.substring(8, 10) + this.substring(6, 8) + this.substring(4, 6);
};

String.prototype.styleA11Y = function (style) {
  return "<c." + style + ">" + this + "</c>";
};

String.prototype.italique = function () {
  return "<i>" + this + "</i>";
};

String.prototype.nbLigne = function () {
  return this.match(/[\n]/g).length + 1;
};

_options();

function _options() {
  if (fs.existsSync("./.ass2vttrc")) {
    let ass_config = fs.readFileSync("./.ass2vttrc", "utf8");
    ass_config = ass_config && JSON.parse(ass_config);
    styleOutClassic =
      (ass_config.styleOutClassic && ass_config.styleOutClassic) || styleOutClassic;
    styleItalicClassic =
      (ass_config.styleItalicClassic && ass_config.styleItalicClassic) ||
      styleItalicClassic;
    styleToVtt = (ass_config.styleToVtt && ass_config.styleToVtt) || styleToVtt;
    integrerStyle =
      (ass_config.integrerStyle && ass_config.integrerStyle) || integrerStyle;
      if (ass_config.extensionA11Y === "") {
      extensionA11Y = "";
    } else {
      extensionA11Y =
        (ass_config.extensionA11Y && ass_config.extensionA11Y) || extensionA11Y;
    }
    if (ass_config.extensionClassic === "") {
      extensionClassic = "";
    } else
      extensionClassic =
        (ass_config.extensionClassic && ass_config.extensionClassic) || extensionClassic;
  }
}

function _position(tc, tags, TV, multiline = false) {
  // si an
 
  let pos_style = [tc];
  tags.forEach(t=>{
    
     if (t.an) {
       let an=t.an;
       if (Math.floor((an - 1) / 3) == 1) {
         pos_style.push("line:50%");
       } else if (Math.floor((an - 1) / 3) == 2) {
         pos_style.push("line:0");
       }
       if (an % 3 == 1) {
         pos_style.push("align:start");
       } else if (an % 3 == 0) {
         pos_style.push("align:end");
       }
     }
     if (t.pos) {
       let pos=t.pos;
       const posX = pos[0],
         posY = pos[1];
       let left = Math.round((posX / TV.width) * 100) + "%";
       let top = Math.round((posY / TV.height) * 100) + "%";
       if (multiline) {
         top = Math.round((posY / TV.height) * 100 - 5) + "%";
       }
       pos_style.push("position:" + left);
       pos_style.push("line:" + top);
     }
  })
 

  return pos_style.join(" ");
}

function _ecritureStyle(parse) {
  let style = ["STYLE"];
  if (integrerStyle) {
    parse.styles.style.forEach((s) => {
      s[0] = (styleToVtt[s[0]] && styleToVtt[s[0]]) || s[0];
      style.push("::cue(." + s[0] + "){");
      // style.push("font-size: " + s[2] + ";");
      style.push("color: " + s[3].hexcolor() + ";");
      style.push("}");
    });
  }
  return style;
}

function _quadratins(txt) {
  txt = (txt.substring(0, 1) === "-" && txt.replace(/-/, "–")) || txt;
  txt = txt.replace(re_newline_tiret, "\r\n–").replace(re_accolade_tiret, "}–");

  txt = txt
    .replace(re_newline, "\r\n")
    .replace(re_softbreak, " ")
    .replace(re_hardspace, "&nbsp;");
  txt = txt.replace(/\\N/g, "\n");
  return txt;
}
function _Ita(txt) {
  return txt.replace(/{\\i1}/g, "<i>").replace(/{\\i0}/g, "</i>");
}
function _accoladePos(txt) {
  return txt.replace(/{[^}]+}/g, "");
}

module.exports = {
  extensionA11Y: extensionA11Y,
  extensionClassic: extensionClassic,
  writeFile: function (parse) {
    // _options();
    let erreurLigneClassic = [];

    const TV = {
      width: parse.info.PlayResX,
      height: parse.info.PlayResY,
    };
    let styles = _ecritureStyle(parse);
    let k = 0;
    let file_classic = ["WEBVTT\n"].concat(styles),
      file_a11y = ["WEBVTT\n"].concat(styles);
    let style_avant = "";
    let d_style_avant = "";
    let end_avant = "";
    parse.events.dialogue.forEach((d, i) => {
      let Style = (styleToVtt[d.Style] && styleToVtt[d.Style]) || d.Style;
      let actor = (d.Name && "<v " + d.Name + ">") || "";
      d.Start = Math.round(d.Start * 100) / 100;
      d.End = Math.round(d.End * 100) / 100;
      let start = d.Start.toVTTtime();
      let end = d.End.toVTTtime();
      let tc = start + " --> " + end;

      let multiline = d.Text.parsed[0].text.indexOf("\\N") > -1;
      let TCposition = _position(tc, d.Text.parsed[0].tags, TV, multiline);
      let txt = _quadratins(d.Text.raw);
      txt = _Ita(txt);
      txt = _accoladePos(txt);

      if (
        styleOutClassic.indexOf(d.Style) === -1 &&
        styleOutClassic.indexOf(Style) === -1
      ) {
        // si texte superposé
        if (
          d.Start < end_avant &&
          styleOutClassic.indexOf(Style) === -1 &&
          styleOutClassic.indexOf(d.Style) === -1
        ) {
          let lf = file_classic.length;
          let index_tc = lf - 3;
          let index_txt = lf - 2;
          let tc_classique = file_classic[index_tc].split(" --> ")[0] + " --> " + end;
          let txt_avant = file_classic[index_txt] + "\n" + txt;
          file_classic.splice(index_tc, 1, tc_classique);
          file_classic.splice(index_txt, 1, txt_avant);
          if (txt_avant.nbLigne() > 2) {
            console.log(
              erreurLigneClassic.findIndex(
                (x) => x["sous-titre"] === file_classic[lf - 4]
              )
            );
            if (
              erreurLigneClassic.findIndex(
                (x) => x["sous-titre"] === file_classic[lf - 4]
              ) !== -1
            ) {
              erreurLigneClassic.pop();
            }
            erreurLigneClassic.push({
              "sous-titre": file_classic[lf - 4],
              problème: "Trop de ligne (" + txt_avant.nbLigne() + ")",
            });
          }
          k += 1;
        } else {
          let txt_clas =
            (styleItalicClassic &&
              (styleItalicClassic.indexOf(d.Style) !== -1 ||
                styleItalicClassic.indexOf(Style) !== -1) &&
              txt.italique()) ||
            txt;
          file_classic.push(i + 1 - k);
          file_classic.push(TCposition);
          file_classic.push(txt_clas);
          file_classic.push("");
        }
        end_avant = d.End;
        style_avant = Style;
        d_style_avant = d.Style;
      } else {
        k += 1;
      }
      file_a11y.push(i + 1);
      file_a11y.push(TCposition);
      file_a11y.push(actor + txt.styleA11Y(Style));
      file_a11y.push("");
    });

    return {
      _classic: file_classic.join("\n"),
      _a11y: file_a11y.join("\n"),
      erreurLigneClassic: erreurLigneClassic,
    };
  },
  init: function () {
    _options();
    let fichierAss = [];
    let chemin = process.cwd();
    const rcPath = path.format({
      dir: chemin,
      base: ".ass2vttrc",
    });
    fs.readdir(chemin, function (err, items) {
      items.forEach((f) => {
        path.extname(f) === ".ass" && fichierAss.push(path.join(chemin, f));
      });
      if (fichierAss.length === 0) {
        monLog.error("Vous n'avez pas de fichiers ass dans votre répertoire");
        return;
      }
      fs.writeFileSync(rcPath, JSON.stringify(_writeInit(fichierAss), null, 2), "utf8");
      monLog.log("ass2vtt", rcPath, "généré");
    });
  },
  recupProcessArgv: function (argv) {
    let erreur = false;
    let file_in = "";
    switch (argv._.length) {
      case 0:
        monLog.error("Vous devez entrer au moins le nom du fichier ass.");
        erreur = true;
        break;
      case 1:
        const ext = argv._[0].split(".");
        if (ext.length === 1 || ext[1] !== "ass") {
          erreur = true;
        } else {
          file_in = argv._[0];
        }
        break;

      default:
        monLog.error("Vous ne pouvez entrer qu'un seul argument (File_in.ass).");
        erreur = true;
        break;
    }
    return {
      file_in: file_in,
      erreur: erreur,
    };
  },
};

function _writeInit(ass) {
  ass.forEach((f) => {
    const data = fs.readFileSync(f, "utf8");
    const parse = parseASS(data);
    parse.styles.style.forEach((s) => {
      !styleToVtt[s[0]] && (styleToVtt[s[0]] = s[0]);
    });
  });

  return {
    styleToVtt: styleToVtt,
    styleOutClassic: styleOutClassic,
    styleItalicClassic: styleItalicClassic,
    integrerStyle: integrerStyle,
    extensionA11Y: extensionA11Y,
    extensionClassic: extensionClassic,
  };
}
