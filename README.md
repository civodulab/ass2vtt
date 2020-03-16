# ass2vtt

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

Options file out:
  -a, --a11y     Output the a11y file
  -c, --classic  Output the classic file
  -b, --both     Output the a11y and classic files (default)
  -d, --dir      Process all the ass files in the directory
```

## Configuration

Si vous voulez paramétrer le fichier ass, créer le fichier `.ass2vttrc` dans le répertoire du fichier.

Ce fichier sert à faire la correspondance :

Exemple `.ass2vttrc`

```json
{
    "styleToVtt": {
      "parle à l'écran":"pae",
      "parle hors champ":"phc",
      "Indication de bruit":"ib",
      "Indication musicale":"im",
      "commentaire":"com",
      "langue étrangère":"le"
    },
     "styleOutClassic": [
        "Indication de bruit",
        "im"
    ],
    "styleItalicClassic": ["com","langue étrangère"],
    "integrerStyle": false
}
```

- `integrerStyle` : ajoute les styles dans le fichier WebVTT
- `styleOUTclassic` : les textes comportant ces styles sont retirés dans le mode classic
- `styleItalicClassic` : les textes comportant ces styles seront en italique en mode classic

