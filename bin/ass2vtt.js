#! /usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const parseASS = require("ass-compiler").parse;
const monLog = require("../src/monLog");
var mesFunctions = require("../src/functions");
var optionator = require("../help/options");

// récupère config
var options = optionator.parseArgv(process.argv);

if (options.init) {
  mesFunctions.init();
  return;
}

if (options.help) {
  console.log(optionator.generateHelp());
  return;
}
if (options.version) {
  console.info(`v${require("../package.json").version}`);
  return;
}

if (options.dir) {
  let fichierAss = [];
  let chemin = process.cwd();
  fs.readdir(chemin, function(err, items) {
    items.forEach(f => {
      if (path.extname(f) === ".ssa") {
        monLog.error(
          "Votre fichier " +
            f +
            " est au format ssa. Le convertir en ass pour y avoir la taille de la vidéo."
        );
        return;
      }
      path.extname(f) === ".ass" && fichierAss.push(path.join(chemin, f));
    });
    if (fichierAss.length === 0) {
      monLog.error("Vous n'avez pas de fichiers ass dans votre répertoire");
      return;
    }
    writeFiles(options, fichierAss);
  });
} else {
  const argv = mesFunctions.recupProcessArgv(options);
  if (argv.erreur) {
    console.log(optionator.generateHelp());
    return;
  }
  if (fs.existsSync(argv.file_in)) {
    writeFiles(options, [argv.file_in]);
  } else {
    monLog.error("Le fichier n'existe pas");
    console.log(optionator.generateHelp());
    return;
  }
}

// parse ass
function writeFiles(options, file_in) {
  file_in.forEach(f => {
    const data = fs.readFileSync(f, "utf8");
    const parse = parseASS(data);
    const argv = {
      file_in: f,
      file_out_classic:
        f.split(".")[0] + mesFunctions.extensionClassic + ".vtt",
      file_out_a11y: f.split(".")[0] + mesFunctions.extensionA11Y + ".vtt"
    };
    if (options.both || (!options.classic && !options.a11y)) {
      // classique
      fs.writeFileSync(
        argv.file_out_classic,
        mesFunctions.writeFile(parse).file_classic
      );
      monLog.log("ass2vtt", argv.file_out_classic, "généré");
      // accessible
      fs.writeFileSync(
        argv.file_out_a11y,
        mesFunctions.writeFile(parse).file_a11y
      );
      monLog.log("ass2vtt", argv.file_out_a11y, "généré");
    } else if (options.a11y) {
      // accessible
      fs.writeFileSync(
        argv.file_out_a11y,
        mesFunctions.writeFile(parse).file_a11y
      );
      monLog.log("ass2vtt", argv.file_out_a11y, "généré");
    } else if (options.classic) {
      // classique
      fs.writeFileSync(
        argv.file_out_classic,
        mesFunctions.writeFile(parse).file_classic
      );
      monLog.log("ass2vtt", argv.file_out_classic, "généré");
    }
  });
}
