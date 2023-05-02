# Changelog

All notable changes to this project will be documented in this file.

## [0.2.3] - 01-07-2021

### Added

- tests for interpreter and builders to keep a better overview about breaking the codebase
- waiting for ui build now
- improved entity parsing when printed
- created all required entities

### Changed

- Fixed weird casts between layers
- Fixed setter/getter support in lists
- Fixed memory management when passing args
- Fixed map/list expressions
- Fixed self keyword functionality
- Fixed new keyword functionality
- Fixed list exposed methods
- Fixed string iterator
- Fixed polyfill namespaces

## [0.2.5] - 01-07-2021

### Changed

- npm latest version

## [0.2.6] - 02-07-2021

### Changed

- new ui
- using codemirror now for the ide
- simplified getter/setter logic
- ui is using local storage now, so code will be saved

## [0.2.7] - 03-07-2021

### Changed

- range polyfill fix
- fix negative number recognition
- add obfuscation option in ui

## [0.2.8] - 04-07-2021

### Changed

- add auto restart when vm gets completly shutdown in ui
- add debugger in ui/console
- improve data handling in ui

## [0.2.9] - 12-07-2021

### Changed

- fix unary parsing

## [0.3.0] - 12-07-2021

### Changed

- change 'not' and 'positive/negative number prefix' to unary
- prevent inifite loop when having binary expressions without assignment
- use classID
- remove '++' and '--' shortcuts since those essentialy don't work as intended

## [0.3.1] - 06-08-2021

- add installer feature
- support import_code in builder
- add mkdirp
- fixed issue with default cli builder

## [0.3.2] - 21-10-2021

- add stdin and stdout for ui build for better debugging
- fixed index and slice path resolving in interpreter
- fixed reference operation if value is either executed or not a function
- fixed operation context type inheriting
- added slice testing
- improved test naming for snapshots
- added exclude namespace flag

## [0.3.3] - 21-10-2021

- add dlo and dno flag
- update ui with options

## [0.3.4] - 25-10-2021

- fix issue with object/list init in interpreter
- add popups to show errors when transpiling or using the interpreter in the UI
- changed demo site

## [0.3.5] - 14-12-2021

- parse all files before building to avoid issues with namespaces when optimizing
- use different globals namespace identifier to avoid unintended behavior when optimizing with certain options

## [1.0.0] - 25-01-2022

- major overhaul

## [1.0.1] - 25-01-2022

- update gh mock intrinsics to latest version

## [1.0.2] - 25-01-2022

- update gh mock intrinsics to latest version due to browser support

## [1.0.3] - 25-01-2022

- File('/') should return root folder

## [1.0.4] - 25-01-2022

- metaxploit port 0 uses kernel_router

## [1.0.5] - 26-01-2022

- mock intrinsics generate new entities on the fly now
- bunch of fixes for the interpreter
- parser supports another if-then style
- intrinsics generally got fixes
- metaMail is supported now

## [1.0.6] - 26-01-2022

- fix issue with unexpected behavior on end if

## [1.0.7] - 26-01-2022

- fix minor issue in slice not accepting null values

## [1.0.8] - 27-01-2022

- improve debugger tracking
- fixed minor bugs in intrinsics
- fixed object iteration

## [1.0.9] - 28-01-2022

- remove certain dependencies which required crypto

## [1.1.0] - 28-01-2022

- fix broken boilerplate of bundler

## [1.1.1] - 29-01-2022

- fixed loops not supporting exit request
- added non blocking while iteration via process.nextTick

## [1.1.2] - 29-01-2022

- add pause to UI
- add stop to UI
- add repl to UI
- add next to UI
- change website to be less white, so you don't get flashbanged

## [1.1.3] - 29-01-2022

- minor change in execution handling to support error messages again in the UI

## [1.1.4] - 31-03-2022

- fix issue in parser/lexer which could casue infinite loops

## [1.1.5] - 30-06-2022

- fix envar functionality in transpiler - [issue#24](https://github.com/ayecue/greybel-js/issues/24) - thanks to @stevenklar

## [1.1.6] - 02-07-2022

- support envar in includes/imports - [issue#24](https://github.com/ayecue/greybel-js/issues/24) - thanks to @stevenklar

## [1.2.0] - 11-08-2022

- fix lexer behaviour if string literal wasn't closed
- fix parser not passing unsafe value to lexer
- implement new interpreter iteration which features a more consistent typing among other things
- cleaned up code regarding envar implementation
- major improvements on the editor UI
- implemented monaco edtior into UI
- add language config, automcomplete logic and hover logic to UI
- add simple logic to share code; going to be extended
- now passing exclude namespace input and obfuscation checkbox to transpiler in UI

## [1.2.1] - 12-08-2022

- prevent error swallow in interpreter with updating to the latest interpreter version

## [1.2.2] - 16-08-2022

- fix range behavior - [issue#26](https://github.com/ayecue/greybel-js/issues/26) - thanks to @Zeta314

## [1.2.3] - 16-08-2022

- fix debugger resume

## [1.2.4] - 16-08-2022

- use greyscript meta package

## [1.2.5] - 16-08-2022

- fix indexes intrinsic for lists and strings

## [1.2.6] - 21-08-2022

- add idx local during for loop
- add placeholders for blockhain, coin, service, wallet, subWallet
- improved meta information

## [1.2.7] - 22-08-2022

- fix range behavior in case of from > to
- improved meta information

## [1.2.8] - 22-08-2022

- add beautify option

## [1.2.9] - 31-08-2022

- find all identifier now only lookups left side in assignment (WebUI)
- add queue for AST parsing (WebUI)
- add maxChars option to define when the installer should split the file
- update greyscript-meta, includes newest translations
- update parser and interpreter to support any value as map key, thanks for reporting to [@xephael](https://github.com/xephael)
- update parser to improve performance regarding automcompletion and hover, generates map of references per line
- fix compile options, remove merging of options instead just use || fallback pattern

## [1.3.0] - 31-08-2022

- fix installer randomly stopping parsing file, thanks for reporting to [@xephael](https://github.com/xephael)

## [1.3.1] - 31-08-2022

- remove wrapper boilerplate from main, thanks for reporting to [@xephael](https://github.com/xephael)

## [1.3.2] - 31-08-2022

- update greyscript-meta, added missing general functions
- update core, added missing natives

## [1.3.3] - 31-08-2022

- improve automcompletion + hoverdocs after core update
- improve web ui debugger

## [1.3.4] - 08-09-2022

- fix line count inside multiline strings, thanks for reporting to [@xephael](https://github.com/xephael)
- fix slice operator parsing, thanks for reporting to [@xephael](https://github.com/xephael)

## [1.3.5] - 10-09-2022

- update meta package which involves a few fixed return types and two missing methods in the file type
- transpiler won't add the module boilerplate header if there are no actual modules
- globals declaration in header won't be added if there are no literal optimizations
- fix behavior of pop intrinsic for map
- remove meta_info from file intrinsics
- add allow_import polyfill in file intrinsics
- add default value info in hoverdocs
- use react instead of plain html
- fix obfuscation flag getting ignored

## [1.3.6] - 10-09-2022

- fix share feature in web-ui

## [1.3.7] - 29-09-2022

- minor fix for file.get_content, return empty string instead of undefined, thanks for reporting [@TopRoupi](https://github.com/TopRoupi)
- add sort key logic in sort intrinsic, thanks for reporting [@TopRoupi](https://github.com/TopRoupi)
- add missing tan intrinsics
- add same errors in basic intrinsics as in ms
- implement format_columns logic
- improve output handler logic
- user_input supports anyKey now
- add proper router intrinsics
- rework shell intriniscs for connect_service + scp
- add shell intriniscs for launch + build + ping
- add ftpShell intrinsics for put
- add computer intrinsics for connect eth + connect wifi
- update computer intrinsics for touch + create_folder
- update file intrinsics for move + copy + chmod + set_content + get_content + set_owner
- add groups to mock env
- update crypo intrinsics
- update metaxploit intrinsics
- update metalib intrinsics
- update netsession intrinsics
- more realistic usernames, passwords, vulnerability zone names
- loading bars are supported now
- deactivate breakpoint for injection during debugging in cli execution
- keep pending state after injection in interpreter
- update meta version with a few corrections
- update parser with removed ";" checks
- support nested import_code
- support outer imports using ".."
- fix [List can be different even if the same](https://github.com/ayecue/greybel-js/issues/32), thanks for reporting [@brahermoon](https://github.com/brahermoon)
- add __isa logic for maps
- minor TextMesh Pro support for output

## [1.3.8] - 29-09-2022

- use node to execute bins to support win10

## [1.3.9] - 29-09-2022

- revert node execute

## [1.4.0] - 29-09-2022

- use js extension in bins to support win10

## [1.4.1] - 29-09-2022

- add bin header

## [1.4.2] - 29-09-2022

- support line breaks again in ui stdout window

## [1.4.3] - 29-09-2022

- replace whitespaces with `&bnbsp;` in ui
- fix crash in scope inspector in ui
- use other package for scope inspection in ui

## [1.4.4] - 01-10-2022

- fix shuffle intrinsic for maps
- fix possible overflow in core parser
- fix kernel_version intrinsic
- fix nested unary in core parser

## [1.4.5] - 02-10-2022

- fix stdin width in firefox
- update core in env script builder
- improve stdout code in ui

## [1.5.0] - 07-10-2022

- rework parser/lexer to support newest version (might introduced some new bugs, please report if you find anything)
- implement outer, get_custom_object, log, bitXor, bitAnd, bitOr, insert, yield
- optimize transpiler output, removed unnecessary parenthesis
- update meta with new descriptions
- drop support for scuffed if syntax
- drop support for bugged index call

## [1.5.1] - 08-10-2022

- fix outer behavior
- fix token end for hover tooltip in ui
- support multiple statements at same line for hover tooltips

## [1.5.2] - 12-10-2022

- fix parser exception when a combination of block and comment on the same line appears, thanks for reporting to [@xephael](https://github.com/xephael)

## [1.5.3] - 16-10-2022

- filter current connected wifi from list which is presented when looking for close wifis
- minor fix in used_ports intrinsic which caused unwanted behavior
- service ports are closer to ingame service port numbers

## [1.5.4] - 27-10-2022

- implement super + isa logic
- add super + isa keyword
- support super + isa in highlighting
- exclude super and isa from uglify
- improve function declaration uglify
- improve interpreter map __isa logic
- show current file in debugger mode

## [1.5.5] - 28-10-2022

- fix react dependency in ui
- update meta

## [1.5.6] - 01-11-2022

- use proper context in super call

## [1.5.7] - 04-11-2022

- allow empty string in split
- use regexp in split

## [1.5.8] - 05-11-2022

- fix state forwarding in context
- interfaces use maps instead of custom interface
- revert regexp in split

## [1.5.9] - 06-11-2022

- fix router intrinsics in regards of forwarded ports
- fix bug in meta lib overflow

## [1.6.0] - 27-11-2022

### Changed

- implement definitions provider
- use lru cache
- implement document symbol provider
- implement workspace symbol provider
- fix automcomplete not working in certain cases in the ui
- optimized ast document cache in ui

## [1.6.1] - 13-03-2023

- fix autocomplete in call body in UI
- fix error on trailing comma in maps and lists
- add check for metaxploit if file exists to prevent error
- add type-manager for improved type resolving in UI

## [1.6.2] - 26-03-2023

- fix nested #import in interpreter
- proper json output when map/list gets stringified in interpreter
- fix refresh interval sometimes not parsing in UI

## [1.6.3] - 26-03-2023

- fix replace intrinsic

## [1.6.4] - 27-03-2023

- fix deep equal via extending max depth from 2 to 10 in interpreter

## [1.6.5] - 05-04-2023

- fix error message in create_user related to invalid password format
- fix acks condition in aireplay
- fix permission check in get_content
- fix current_date format
- fix nslookup error handling
- use proper max files in same folder
- typeof for MetaMail returns now in the right capitalization
- fix power operator handling
- update meta descriptions

## [1.6.6] - 05-04-2023

- remove key interaction on airplay to prevent issue
- fix wifi networks return value
- minor fixes for meta examples

## [1.6.7] - 07-04-2023

- update meta version

## [1.6.8] - 08-04-2023

- update meta version
- update readme

## [1.6.9] - 09-04-2023

- fix potential crash in debugger

## [1.7.0] - 15-04-2023

- use regex in split intrinsic
- fix list insert behaviour, return mutated list now
- update meta descriptions
- update meta performance

## [1.7.1] - 15-04-2023

- escape dot in split intrinsic

## [1.7.2] - 16-04-2023

- split react components in UI
- add external links in UI

## [1.7.3] - 21-04-2023

- fix output format of show_procs in intrinsics
- fix EOL character in format_columns intrinsics
- update meta descriptions

## [1.7.4] - 24-04-2023

- use mac and wifi name for bssid and essid to emulate ingame intrinsic
- fix potential crash caused by meta due to not using hasOwnProperty
- support customizable seed in interpreter
- support customizable environment variables in interpreter
- support circular dependencies for interpreter
- add circular dependency check for build
- web UI improvements

## [1.7.5] - 28.04.2023

- support gh intrinsic references
- support program to launch itself
- add test-lib for setting up envs and debugging - [read more](https://github.com/ayecue/greybel-js#testlib)

## [1.7.6] - 28.04.2023

- returning proper library type names when using typeof
- time now returns elapsed time in seconds

## [1.7.7] - 30.04.2023

- replace newline in print with actual newline
- use editor inquirer component for repl
- refactor output handler enabling user_input not forcing newline

## [1.7.8] - 01.05.2023

- fix potential crash in device_ports
- fix return value of name intrinsic for top file
- fix bug in regards of return getting swallowed in while/for iteration causing infinite loops
- improved error logging with actual stack trace on failure

## [1.7.9] - 01.05.2023

- fix bug in regards of return getting ignored in wrapping while/for

## [1.8.0] - 02.05.2023

- support behaviour of self in arguments
- expose join, split, to_int and replace functions in general namespace
- support map and list in replace
- update meta