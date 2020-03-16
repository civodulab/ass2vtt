"use strict";
var optionator = require('optionator');

module.exports = optionator({
    prepend: 'Usage: ass2vtt [options] file_in.ass',
    defaults: {
        concatRepeatedArrays: true,
        mergeRepeatedObjects: true
    },
    options: [{
            heading: "Basic"
        }, {
            option: 'help',
            alias: 'h',
            type: 'Boolean',
            description: 'displays help'
        }, {
            option: "version",
            alias: "v",
            type: "Boolean",
            description: "Output the version number"
        }, {
            heading: "Options file out"
        }, {
            option: "a11y",
            alias: "a",
            type: "Boolean",
            description: "Output the a11y file"
        }, {
            option: "classic",
            alias: "c",
            type: "Boolean",
            description: "Output the classic file"
        }, {
            option: "both",
            alias: "b",
            type: "Boolean",
            description: "Output the a11y and classic files (default)"
        },
        {
            option: "dir",
            alias: "d",
            type: "Boolean",
            description: "Process all the ass files in the directory"
        }
    ]
});