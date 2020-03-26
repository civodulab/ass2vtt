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

_options();

function _options() {
  if (fs.existsSync("./.ass2vttrc")) {
    let srt_config = fs.readFileSync("./.ass2vttrc", "utf8");
    srt_config = srt_config && JSON.parse(srt_config);
    styleOutClassic =
      (srt_config.styleOutClassic && srt_config.styleOutClassic) ||
      styleOutClassic;
    styleItalicClassic =
      (srt_config.styleItalicClassic && srt_config.styleItalicClassic) ||
      styleItalicClassic;
    styleToVtt = (srt_config.styleToVtt && srt_config.styleToVtt) || styleToVtt;
    integrerStyle =
      (srt_config.integrerStyle && srt_config.integrerStyle) || integrerStyle;
    extensionA11Y =
      (srt_config.extensionA11Y && srt_config.extensionA11Y) || extensionA11Y;
    extensionClassic =
      (srt_config.extensionClassic && srt_config.extensionClassic) ||
      extensionClassic;
  }
}

function _toVTTtime(secs) {
  let time = new Date("1995-12-17T00:00:00");
  time.setMilliseconds(secs * 1000);
  let time_tab = [
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds()
  ].map((v, i) => {
    if (i < 3) {
      v = v < 10 ? "0" + v : v;
    } else {
      v = v === 0 ? "000" : v;
      v = v < 100 && v > 10 ? "0" + v : v;
    }
    return v;
  });
  return `${time_tab[0]}:${time_tab[1]}:${time_tab[2]}.${time_tab[3]}`;
}

function _position(tc, tags, TV, multiline = false) {
  // si an
  let an = tags[0] && tags[0].an;
  let pos = tags[0] && tags[0].pos;
  let pos_style = [tc];

  if (an) {
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
  if (pos) {
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
  return pos_style.join(" ");
}

function _ecritureStyle(parse) {
  let style = [];
  if (integrerStyle) {
    parse.styles.style.forEach(s => {
      s[0] = (styleToVtt[s[0]] && styleToVtt[s[0]]) || s[0];
      style.push("STYLE");
      style.push("::cue(." + s[0] + "){");
      style.push("font-size: " + s[2] + ";");
      style.push("color: " + _hexcolor(s[3]) + ";");
      style.push("}");
      style.push("");
    });
  }
  return style;
}

function _hexcolor(color) {
  return (
    "#" + color.substring(8, 10) + color.substring(6, 8) + color.substring(4, 6)
  );
}

module.exports = {
  extensionA11Y: extensionA11Y,
  extensionClassic: extensionClassic,
  writeFile: function(parse) {
    _options();
    const TV = {
      width: parse.info.PlayResX,
      height: parse.info.PlayResY
    };
    let styles = _ecritureStyle(parse);
    let k = 0;
    let file_classic = ["WebVTT\n"].concat(styles),
      file_a11y = ["WebVTT\n"].concat(styles);
    //classic
    parse.events.dialogue.forEach((d, i) => {
      let Style = (styleToVtt[d.Style] && styleToVtt[d.Style]) || d.Style;
      let actor = d.Name && "<v " + d.Name + ">";
      let tc = _toVTTtime(d.Start) + " --> " + _toVTTtime(d.End);
      let multiline = d.Text.parsed[0].text.indexOf("\\N") > -1;
      let txt = d.Text.parsed[0].text.replace(/\\N/g, "\n");
      if (
        styleOutClassic.indexOf(d.Style) === -1 &&
        styleOutClassic.indexOf(Style) === -1
      ) {
        txt =
          (styleItalicClassic &&
            (styleItalicClassic.indexOf(d.Style) !== -1 ||
              styleItalicClassic.indexOf(Style) !== -1) &&
            "<i>" + txt + "</i>") ||
          txt;
        file_classic.push(i + 1 - k);
        file_classic.push(tc);
        file_classic.push(txt);
        file_classic.push("");
      } else {
        k += 1;
      }
      file_a11y.push(i + 1);
      file_a11y.push(_position(tc, d.Text.parsed[0].tags, TV, multiline));
      file_a11y.push(actor + "<c." + Style + ">" + txt + "</c>");
      file_a11y.push("");
    });

    return {
      file_classic: file_classic.join("\n"),
      file_a11y: file_a11y.join("\n")
    };
  },
  init: function() {
    _options();
    let fichierAss = [];
    let chemin = process.cwd();
    const rcPath = path.format({
      dir: chemin,
      base: ".ass2vttrc"
    });
    fs.readdir(chemin, function(err, items) {
      items.forEach(f => {
        path.extname(f) === ".ass" && fichierAss.push(path.join(chemin, f));
      });
       if (fichierAss.length === 0) {
         monLog.error("Vous n'avez pas de fichiers ass dans votre répertoire");
         return;
       }
      fs.writeFileSync(rcPath, JSON.stringify(_writeInit(fichierAss),null,2), "utf8");
      monLog.log("ass2vtt", rcPath, "généré");
    });
  },
  recupProcessArgv: function(argv) {
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
        monLog.error(
          "Vous ne pouvez entrer qu'un seul argument (File_in.ass)."
        );
        erreur = true;
        break;
    }
    return {
      file_in: file_in,
      erreur: erreur
    };
  }
};

function _writeInit(ass) {
  // let styles = [];
  let txt = [];
  ass.forEach(f => {
    const data = fs.readFileSync(f, "utf8");
    const parse = parseASS(data);
    parse.styles.style.forEach(s => {
      !styleToVtt[s[0]] && (styleToVtt[s[0]] = s[0]);
    });
  });
 
return {
  styleToVtt: styleToVtt,
  styleOutClassic: styleOutClassic,
  styleItalicClassic: styleItalicClassic,
  integrerStyle: integrerStyle,
  extensionA11Y: extensionA11Y,
  extensionClassic: extensionClassic
};

}

Object.prototype.join = function(joinCarac) {
  let tab = [];
  Object.keys(this).forEach(k => {
    tab.push('"' + k + '" : "' + this[k] + '"');
  });
  return tab.join(joinCarac);
};
Array.prototype.joinPlus = function(joinCarac) {
  return this.map(x => '"' + x + '"').join(joinCarac);
};

// let styleOutClassic = [];
// let styleItalicClassic = [];
// let styleToVtt = {};
// let integrerStyle = false;
