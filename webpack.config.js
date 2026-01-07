/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const pkgbuild = require("ollieos_pkgbuild");

// EDIT THIS OBJECT TO ADD MORE PROGRAMS OR CHANGE THE FILE PATHS/NAMES
// key: the name of the program
// value: the path to the entry point
const programs = {
    "lodestard": "./src/daemon/index.ts",
    "lodestar-send": "./src/send/index.ts",
    "lodestar-sub-test": "./src/sub_test/index.ts",
};

// EDIT THIS ARRAY TO ADD DEPENDENCIES FOR THE VERSION CURRENTLY BEING BUILT
// format: name@version
const deps = [];

// EDIT THIS TO CHANGE THE HOMEPAGE URL
const homepage_url = "https://ollieg.codes";

// EDIT THIS OBJECT TO DEFINE ADDITIONAL WEBPACK EXTERNALS
// key: the name of the module
// value: the external name
const externals = {};

// EDIT THIS ARRAY TO DEFINE ADDITIONAL FILES TO BE INCLUDED IN THE PACKAGE
const additional_files = [
    {local_path: "./src/daemon/service.json", pkg_path: "lodestard.service.json"},
];

// EDIT THIS OBJECT TO DEFINE TRIGGERS TO RUN ON INSTALL/REMOVAL
// key: the name of the trigger
// value: any data to pass to the trigger
const triggers = {
    "register_service": "lodestard.service.json",
};

module.exports = pkgbuild(programs, deps, homepage_url, externals, triggers, additional_files);
