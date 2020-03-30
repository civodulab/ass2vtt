# ass2vtt

![npm](https://img.shields.io/npm/v/ass2vtt)
![npm](https://img.shields.io/npm/dt/ass2vtt)

ass2vtt est un outil permettant de transformer un document ass (Advanced Sub Station) en WebVTT (Web Video Text Tracks).

## Installation and Usage

Prerequisites: [Node.js](https://nodejs.org/en/) (>=6.14), npm version 3+.

### Local Installation and Usage

```
$ npm install ass2vtt
```

### Global Installation and Usage

```
$ npm install -g ass2vtt
```

Utilisation :

```
$ ass2vtt [options] file_in.ass
```

`file_in.ass` optionnel si `--dir`

Options :

```
Basic:
  -h, --help     displays help
  -v, --version  Output the version number

Options:
  --init Creates the config file .ass2vttrc - default: false

Options file out:
  -a, --a11y     Output the a11y file
  -c, --classic  Output the classic file
  -b, --both     Output the a11y and classic files (default)
  -d, --dir      Process all the ass files in the directory
```

## Configuration

Vous pouvez paramétrer `ass2vtt` pour générer un fichier `.vtt` qui correspond à vos attentes.

### --init

`ass2vtt --init` va créer / modifier le fichier `.ass2vttrc` dans le répertoire en cours. Il va se baser sur les fichiers `.ass` de ce répertoire et récupérer les styles de ces fichiers pour générer `styleToVtt`.

Si le fichier `ass2vttrc` existe il n'ajoutera que les nouveaux styles non présents.

### manuellement

Créer le fichier `.ass2vttrc` dans le répertoire du fichier.

Ce fichier sert à faire la correspondance :

Exemple `.ass2vttrc`

```json
{
    "styleToVtt": {
      "styleAssFile1":"saf1",
      "styleAssFile2":"saf2",
      "styleAssFile3":"saf3",
      "styleAssFile3":"saf4"
    },
     "styleOutClassic": [
        "styleAssFile1",
        "saf3"
    ],
    "styleItalicClassic": ["saf4","styleAssFile2"],
    "integrerStyle": false,
    "extensionA11Y": "_a11y",
    "extensionClassic": "_classic"
}
```

- `integrerStyle` : ajoute les styles dans le fichier WebVTT
- `styleOUTclassic` : les textes comportant ces styles sont retirés dans le mode classic
- `styleItalicClassic` : les textes comportant ces styles seront en italique en mode classic
- `extensionA11Y` et `extensionClassic` :
  > Exemple ici  
  > `nameAssFile.ass` => `nameAssFile_a11y.vtt` et  `nameAssFile_classic.vtt`
