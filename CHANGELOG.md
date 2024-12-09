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

## [1.8.0] - 08.05.2023

- support behaviour of self in arguments
- expose join, split, to_int and replace functions in general namespace
- support map and list in replace
- update meta
- fix faulty mock data which could potentially cause crash
- rework parser to emulate greyscript behaviour more accurate

## [1.8.1] - 08.05.2023

- fix text-mesh transformation render for inner children

## [1.8.2] - 08.05.2023

- fix interactive flag in execute

## [1.8.3] - 09.05.2023

- fix get library type in mock env, potentially fixing crash in netsession intrinsic
- fix paths starting with null resolving to general properties

## [1.8.4] - 10.05.2023

- fix type resolve in UI
- fix firewall_rules intrinsic return value
- fix wait not using seconds but milliseconds
- support refresh in ui

## [1.8.5] - 12.05.2023

- forbid literal optimization in default args

## [1.8.6] - 12.05.2023

- fix isa regarding boolean value, boolean now gets recognized by it as a member of number
- add version check to inform about latest version

## [1.8.7] - 21.05.2023

- fix import_code injection in includes and imports
- add ingame directory option in build command
- simplify import_code logic by removing second custom argument and allowing to create an installer to whatever ingame directory
- improve autocomplete in UI including keywords, constants and operators
- fix hover tooltip for multiline strings in UI
- register control + c in user_input with anyKey enabled
- instant exit on process termination

## [1.8.8] - 06.06.2023

- fix lastIndexOf behaviour, only works with strings now and returns -1 instead of null
- fix return type of indexOf signature in UI
- fix tooltip for lastIndexOf in UI
- remove usage of boolean type in tooltips and signatures to avoid confusion since technically booleans do not exist
- minor improvement to index expression type analyzing in UI
- use modified transformer to get namespace for type in UI
- fix type resolve within slice expression in UI
- improve type resolve for assignments using locals, globals or outer prefix in UI
- extend namespace find method to use assignment instead of namespaces coming from parser in UI
- fix possibly wrong start position of member, index and call expression in UI
- inject map constructor namespaces in UI
- inject list constructor namespaces in UI
- add block comment support
- add comment function description support in UI
- improve build error output

## [1.8.9] - 08.06.2023

- add support for multiply and division on lists

## [1.9.0] - 10.06.2023

- improve support for command_info behavior
- update to latest meta descriptions
- optimize meta package size

## [1.9.1] - 11.06.2023

- fix UI crash on mobile due to meta

## [1.9.2] - 12.06.2023

- add save functionality to online UI

## [1.9.3] - 17.06.2023

- update meta descriptions

## [1.9.4] - 19.06.2023

- cast null to empty string when concatenation
- update meta descriptions
- implement textmate support for UI for better syntax

## [1.9.5] - 20.06.2023

- fix terser

## [1.9.6] - 20.06.2023

- fix function textmate syntax in UI

## [1.9.7] - 22.06.2023

- if any is included in types just display any within UI
- support multiline conditions
- support slice type resolve within UI

## [1.9.8] - 24.06.2023

- add debugger keyword to textmate syntax for UI
- move language + theme provider for UI

## [1.9.9] - 25.06.2023

- fix textmate syntax related to strings within functions and pseudo-types in UI
- fix argument types for to_int and insert in UI
- fix super behavior in regards of accessessing direct __isa
- add launch call stack limit
- support minus operator for strings
- fix binary expression order on same precedence
- fix syntax exception in case call expression without paren was in last line
- fix various binary operations on number, list and map operations
- use ordinal comparison on greater and less than operations for strings
- support division on strings
- add modulo operator to textmate syntax in UI
- fix order in operator textmate syntax in UI

## [1.9.10] - 26.06.2023

- use rnd function factory

## [1.9.11] - 29.06.2023

- fix various evaluation expression output values

## [1.9.12] - 14.07.2023

- fix replaceText behavior of print in UI

## [2.0.0] - 19.07.2023

- add support for indent tag in UI
- add c2 agent to support remote file creation in-game
- add support to cache refreshToken for ingame file creation
- update meta involving create_folder signature fix

## [2.0.1] - 28.07.2023

- add support for funcRef in syntax highlight and code execution
- add funcRef, list, number, string, params, globals, locals, outer and self to autocomplete constants
- update meta

## [2.0.2] - 29.07.2023

- add support to be able to modify idx variables within for iterations
- fix: set computers list at rshell service install
- support color shorthand in text-mesh
- support quotes in text-mesh tags

## [2.0.3] - 30.07.2023

- fix get_router intrinsic when providing lan ip
- allow non literals in function declaration params
- fix issue with call statement without parens
- remove "from" keywords

## [2.0.4] - 30.07.2023

- use setImmediate/setTimeout instead of nextTick to fix stdout issue within iterations

## [2.0.5] - 31.07.2023

- fix issue within import_code dependency management which could cause an invalid order, order should be more accurate now
- improve text mesh transform approach to use queueing instead of recursion preventing exceeding maximum call stack
- adjustments in UI to enable simple drawings via text-mesh

## [2.0.6] - 03.08.2023

- raise node version requirement to latest lts - related to [#97](https://github.com/ayecue/greybel-js/issues/97) - thanks for reporting to [@Crater44](https://github.com/Crater44)
- use static isa objects for grey hack specific intrinsics to enable usage of isa on those types

## [2.0.7] - 04.08.2023

- introduce alternative install via docker by [@Crater44](https://github.com/Crater44) - related PR [#99](https://github.com/ayecue/greybel-js/pull/99)
- check if inside docker when sharing output path by [@Crater44](https://github.com/Crater44)

## [2.0.8] - 13.08.2023

- improve installer logic of generated installer file
- fix issue if line is longer than maxChars allowed in installer - related to [#102](https://github.com/ayecue/greybel-js/issues/102)

## [2.0.9] - 19.08.2023

- implement autocompile feature for installer - thanks for the suggestion to [@stevenklar](https://github.com/stevenklar) - related to [#106](https://github.com/ayecue/greybel-js/issues/106)

## [2.0.10] - 15.10.2023

- fix object value delete (fixes remove intrinsic)
- fix globals lookup - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#108](https://github.com/ayecue/greybel-js/issues/108)

## [2.0.11] - 15.10.2023

- update remove intrinsic to properly work with object value delete

## [2.0.12] - 16.10.2023

- allow // as an alternative to # for import and include statement - thanks to [@Olipro](https://github.com/Olipro) for the suggestion - related to [#85](https://github.com/ayecue/greybel-vs/issues/85)

## [2.0.13] - 17.10.2023

- fix multiply and divide string which mistakenly was using list as a default value when the factor was zero - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#88](https://github.com/ayecue/greybel-vs/issues/88)
- more proper to string for function - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#89](https://github.com/ayecue/greybel-vs/issues/89)
- fix async function argument builder
- fix execution continueing in path resolve even though interpreter is in exit state - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#91](https://github.com/ayecue/greybel-vs/issues/91)
- fix isa not working when assigning __isa manually + when merging two maps - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#92](https://github.com/ayecue/greybel-vs/issues/92)

## [2.0.14] - 17.10.2023

- add IS_GREYBEL property to globals - thanks to [@Olipro](https://github.com/Olipro) for the suggestion - related to [#93](https://github.com/ayecue/greybel-vs/issues/93)
- add access to stacktrace via test lib - thanks to [@Olipro](https://github.com/Olipro) for the suggestion - related to [#93](https://github.com/ayecue/greybel-vs/issues/93)
- fix stacktrace reset in testlib when using try_to_execute
- fix breakpoint reset in testlib when using try_to_execute_with_debug

## [2.0.15] - 17.10.2023

- fix errors related to path resolve when stoping script execution via debugger

## [2.0.16] - 18.10.2023

- fix incorrect scope resolution order - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#97](https://github.com/ayecue/greybel-vs/issues/97)

## [2.1.0] - 20.10.2023

- fix lookup to only include locals, outer and globals to properly replicate MiniScript behavior - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#100](https://github.com/ayecue/greybel-vs/issues/100)
- fix self, locals, globals, outer not being implicit in order to properly replicate MiniScript behavior - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#100](https://github.com/ayecue/greybel-vs/issues/100)
- minor optimization when looking up self, locals, globals, outer
- add error when trying to lookup unknown path on number or string
- add error when calling function with too many arguments
- add new line in scan_address intrinsic to properly replicate GreyScript behavior - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#101](https://github.com/ayecue/greybel-vs/issues/101)
- fix scp intrinsic groups lookup
- add more permissions to generated myprogram file - thanks to [@Olipro](https://github.com/Olipro) for the suggestion
- create object for get_custom_object on each env creation - thanks for reporting to [@Olipro](https://github.com/Olipro)

## [2.1.1] - 21.10.2023

- fix lookup prebuild for locals, outer, globals and self - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#100](https://github.com/ayecue/greybel-vs/issues/100)

## [2.1.2] - 21.10.2023

- fix error on passing non-empty lists on non parenthese call expressions - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#104](https://github.com/ayecue/greybel-vs/issues/104)

## [2.1.3] - 23.10.2023

- fix shorthand doesn't work with self, globals, outer and locals - related to [#106](https://github.com/ayecue/greybel-vs/issues/106)
- update proxy version to latest version - related to [#108](https://github.com/ayecue/greybel-vs/issues/108) and maybe [#107](https://github.com/ayecue/greybel-vs/issues/107)
- reset string, number, function, map and list intrinsics each execution in web - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#110](https://github.com/ayecue/greybel-vs/issues/110)

## [2.1.4] - 23.10.2023

- use maps with actual hashing for objects in order to get faster key lookups
- fix hasIndex looking up __isa entries - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#114](https://github.com/ayecue/greybel-vs/issues/114)
- support same behavior related to anonymous functions and outer scope - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#115](https://github.com/ayecue/greybel-vs/issues/115)
- improve iteration performance by batching async iterations

## [2.1.5] - 25.10.2023

- add intrinsics related to regular expressions - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#117](https://github.com/ayecue/greybel-vs/issues/117)
- add maxCount argument to map/list replace intrinsic
- update greybel-proxy to support new release
- update to latest meta which includes signatures and descriptions related to new regex intrinsics, netsession, computer and ctfevent
- update textmate syntax to include new regex intrinsics
- revert iteration performance improvement
- add new netsession intrinsics
- add get_ctf, will always return null for now
- add computer get_name intrinsic
- add markov generator for more accurate usernames, passwords etc.
- erase all previous lines on print replaceText
- fix return value on enter key press - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#121](https://github.com/ayecue/greybel-vs/issues/121)

## [2.1.6] - 26.10.2023

- use globals if outer is not available
- expose trim, lastIndexOf, replace and reverse intrinsic to global scope
- add trim, lastIndexOf, replace and reverse to generic signatures
- add ascending argument to sort intrinsic
- improve function stringify

## [2.1.7] - 26.10.2023

- update meta text - thanks for the contribution to [@Olipro](https://github.com/Olipro)
- fix hangup related to comparisons - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#119](https://github.com/ayecue/greybel-vs/issues/119)
- only pass target from context in launch when file contains original script
- fix overflow password exploit condition - thanks for the contribution to [@Olipro](https://github.com/Olipro)
- fix process state not getting reset in script executed by shell launch intrinsic - thanks for reporting to [@Olipro](https://github.com/Olipro)

## [2.1.8] - 26.10.2023

- override process state into function scope

## [2.1.9] - 27.10.2023

- bump proxy version due to latest GreyHack update

## [2.1.10] - 28.10.2023

- bump proxy version due to latest GreyHack update

## [2.1.11] - 28.10.2023

- remove lower case transform on key press - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#130](https://github.com/ayecue/greybel-vs/issues/130)

## [2.1.12] - 28.10.2023

- update to latest steam-user version which includes fix for refresh token

## [2.1.13] - 30.10.2023

- fix for user_input, changed switch statement to differentiate between specific chars and other input - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#134](https://github.com/ayecue/greybel-vs/issues/134)

## [2.1.14] - 31.10.2023

- bump proxy version due to latest GreyHack update
- bind context of owning map to super instead of the call context - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#136](https://github.com/ayecue/greybel-vs/issues/136)

## [2.2.0] - 03.11.2023

- expose all GreyHack intrinsics in global scope and also add signatures to meta - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#142](https://github.com/ayecue/greybel-vs/issues/142)
- add aptclient and blockhain vulnerability generation in mock env - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#141](https://github.com/ayecue/greybel-vs/issues/141)

## [2.2.1] - 04.11.2023

- fix super behavior in certain edge cases
- change approach on exposing map, list, number, string and funcRef objects
- bump proxy version due to latest GreyHack update
- pass stacktrace to child interpreter via launch in order to enable to receive the correct stacktrace

## [2.2.2] - 05.11.2023

- fix exit within call args and if condition - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#145](https://github.com/ayecue/greybel-vs/issues/145)

## [2.2.3] - 06.11.2023

- fix shebangs - thanks for the [contribution](https://github.com/ayecue/greybel-js/pull/135) to [@DaniD3v](https://github.com/DaniD3v)

## [2.2.4] - 09.11.2023

- bump proxy version due to latest GreyHack update
- improve file importer feedback when files couldn't be imported

## [3.0.0] - 15.11.2023

- update dependencies to next major version
- add %= and ^= operators
- support else after return in single-line if
- support multiline comparisons
- fix issue with call statement without parentheses and first negative arg
- add missing pull instrinsic from meta info of map
- fix numeric logical expression
- fix failing cases for hasIndex and indexOf (test suite)
- fix failing cases for insert (test suite)
- fix failing cases for remove (test suite)
- fix failing cases for round (test suite)
- fix failing cases for pop (test suite)
- fix failing cases for sort (test suite)
- change hashing and deep equal approach
- fix failing cases for replace (test suite)

## [3.0.1] - 15.11.2023

- fix meta map pull signature
- fix typeof + toString behavior of maps with classID

## [3.0.2] - 16.11.2023

- fix failure when sortKey was not existing

## [3.1.0] - 22.11.2023

- replacing recursive interpreter with bytecode generator + vm to improve performance
- due to the new interpreter the stacktrace should be more accurate - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#109](https://github.com/ayecue/greybel-vs/issues/109)

## [3.1.1] - 23.11.2023

- fix scope browser in ui, displaying hashmaps in the output format now

## [3.1.2] - 23.11.2023

- add support for text mesh tags to close on newline
- fix print output in UI if string is empty

## [3.1.3] - 24.11.2023

- fix prepare error on execute not showing line
- update grey hack output in UI
- do not allow frame pop on global frame

## [3.1.4] - 26.11.2023

- fix for iterations combined with returns causing the iterator stack not to pop

## [3.1.5] - 30.11.2023

- fix self not being reassignable within frame
- bump proxy version due to latest GreyHack update

## [3.1.6] - 13.12.2023

- bump proxy version due to latest GreyHack update
- update meta for minor editor ui fixes

## [3.1.7] - 19.12.2023

- bump proxy version due to latest GreyHack update

## [3.1.8] - 29.12.2023

- minor fixes to meta descriptions
- fix missing fallback value for allow import for file entities in mock environment
- update steam client

## [3.1.9] - 31.12.2023

- minor fixes to meta descriptions
- fix connect_ethernet intrinsic ip check
- fix airmon intrinsic stop option
- fix missing boot folder in generated computers
- minor changes to output

## [3.1.10] - 01.01.2024

- add pointer for current active instruction for stacktrace

## [3.1.11] - 03.01.2024

- bump proxy version due to latest GreyHack update

## [3.1.12] - 04.01.2024

- exclude params from optimization in transpiler

## [3.1.13] - 05.01.2024

- add myprogram as process when script is getting executed
- while minimizing check if hasIndex value exists in namespaces otherwise falls back to not otimized value

## [3.1.14] - 07.01.2024

- bump proxy version due to server change

## [3.2.0] - 27.01.2024

- fix index expression to replicate [#89](https://github.com/JoeStrout/miniscript/issues/89) behavior of MiniScript
- add frame limit to interpreter to prevent crashes due to infinite recursion caused by a script - related to [#172](https://github.com/ayecue/greybel-vs/issues/172)
- register VM exiting while waiting for user input
- add message-hook agent to enable a smoother workflow when importing files in-game

## [3.2.1] - 28.01.2024

- update GreyHackMessageHook.dll version to 0.3 adding an auto close - thanks to [@stevenklar](https://github.com/stevenklar) - related to [#159](https://github.com/ayecue/greybel-js/issues/159)
- add auto compile option for create in-game feature - thanks for the suggestion to [@stevenklar](https://github.com/stevenklar) - related to [#160](https://github.com/ayecue/greybel-js/issues/160)
- add function definition to signature helper - thanks for the suggestion to [@stevenklar](https://github.com/stevenklar)

## [3.2.2] - 29.01.2024

- decrease cooldown between agent messages to speed up building process

## [3.2.3] - 30.01.2024

- add jsdoc syntax parser to comment to modify signatures that are shown - thanks for the suggestion to [@stevenklar](https://github.com/stevenklar)

## [3.2.4] - 31.01.2024

- fix bytecode generator passing noInvoke flag to sub nodes causing issues when using addressOf on expression with more than two members

## [3.2.5] - 01.02.2024

- improve error logs for user when in-game import feature fails to import
- update GreyHackMessageHook.dll version to 0.4 to use unity thread for closing terminal

## [3.2.6] - 03.01.2024

- fix message handling in headless agent causing connection to get dropped under certain conditions - thanks for reporting [SkidMall](https://github.com/cantemizyurek)
- fix general sort description
- fix list sort signature

## [3.2.7] - 03.01.2024

- change window handle for agents to prevent partial import error - thanks for reporting [@gatekeeper258](https://github.com/gatekeeper258)

## [3.2.8] - 04.01.2024

- improve file removal step on auto-compile to instant

## [3.2.9] - 07.01.2024

- allow super being reassigned
- fix super not using proper origin when calling a function of parent - thanks for reporting apparatusdeus
- set super to null if there is no parent class

## [3.2.10] - 10.01.2024

- fix shell.launch layer counter to decrease on nested script end - thanks for reporting [@stevenklar](https://github.com/stevenklar)

## [3.2.11] - 13.01.2024

- add highlighting, signature and description for new reset_password_coin and reset_ctf_password
- add missing descriptions for reverse, lastIndexOf and trim in general
- add placeholders for new intrinsics
- update headless agent to work with latest version

## [3.2.12] - 19.01.2024

- improve parser recovery from invalid syntax
- use backpatching to enable similar MiniScript parsing of blocks, this may cause previous valid greybel syntax to be invalid especially when it comes to function blocks

## [3.2.13] - 23.01.2024

- use proper parser package for UI to prevent possible syntax errors which are related to MiniScript but not to GreyScript

## [3.2.14] - 01.03.2024

- introduce #line and #filename keyword for debugging
- fix import_code behaviour in interpreter so it's content is only executed once

## [3.2.15] - 02.03.2024

- add @description and @example tag to comment docs
- fix an issue with scp where the function would try to get the groups via the wrong property potentially causing a crash - thanks for reporting [@stevenklar](https://github.com/stevenklar)

## [3.2.16] - 10.03.2024

- add --disable-build-folder option to build command
- add logic to automatically clean up after auto-compile (including folders)
- add --auto-compile-purge option to build command - thanks for the contribution [@Arc8ne](https://github.com/Arc8ne)
- remove planetscale integration due to contract changes, using a custom app now instead - any scripts saved in the web editor within the past 24h may got lost during migration

## [3.2.17] - 13.03.2024

- add --auto-compile-name option to build command - thanks for the suggestion [@Arc8ne](https://github.com/Arc8ne)
- update monaco-textmate-provider package which fixes potential issue with textmate in web UI
- update meta package which contains fix for rename description regarding return value on failure
- fix issue with headless agent when refreshToken was expired causing the follow up queries to timeout
- update steam client

## [3.2.18] - 16.03.2024

- fix certain cases of open blocks causing errors in unsafe parsing mode

## [3.2.19] - 30.03.2024

- fix format of library version
- fix build not setting allow_import
- fix permissions when assigned them via chmod intrinsic
- fix typeof intrinsic to not check for parent classID
- fix matches regexp intrinsic causing infinite loop
- fix binary getting deleted if default build output name has the same value as auto compile name

## [3.2.20] - 02.04.2024

- add NaN check for numeric literal scan in order to show syntax errors on invalid numbers - thanks for reporting c1ph3r
- add diagnostics to web editor

## [3.2.21] - 05.04.2024

- ignore return statement when it's not within function scope

## [3.3.0] - 21.04.2024

- still execute method which is called in return statement within global scope
- major improvement of interpreter in regards of performance by rewriting and optimizing parts of the bytecode-generator, internal hash-map, hashing and more
- fix parsing of add sub expression while being a command
- fix connect_service intrinsic - thanks for reporting to Zicore

## [3.3.1] - 25.04.2024

- when building files automatically transform CRLF to LF - thanks for reporting to Zicore and [@Stiffi136](https://github.com/Stiffi136)
- fix bytecode generator source assignment which caused the interpreter to show the wrong file when using imports - thanks for reporting to [@Stiffi136](https://github.com/Stiffi136)

## [3.3.2] - 03.05.2024

- update headless client due to latest Grey Hack update
- improve tcp client stability

## [3.3.3] - 11.05.2024

- add link to BepInEx 5.x.x plugin
- updated description for BepInEx

## [3.3.4] - 21.05.2024

- fix is_valid_ip description example - thanks for the contribution to [@Wombynator](https://github.com/Wombynator)
- add unity terminal to web view
- update rnd method to only return the first generated value of a seed and not continuously generate new values of one seed to properly resemble the original MiniScript behaviour
- fix matches logic which caused skipping of results

## [3.3.5] - 26.05.2024

- fix z-index of collapse related to debug overlay
- show proper scopes in debug view, rather than all scope of all previous frames
- fix behaviour of to_int intrinsic, only parses integers instead of floating numbers
- fix behaviour of val intrinsic, properly parse strings which have commas prior to dot

## [3.3.6] - 27.05.2024

- fix lexer which could for certain character under certain conditions cause inifinite loops

## [3.3.7] - 18.06.2024

- improve beautifier formatting - related to [#176](https://github.com/ayecue/greybel-vs/issues/176)
- separate webview from greyscript-meta
- fix behavior of val intrinsic on leading comma
- support funcRef intrinsic
- add repeat keyword - related to [#213](https://github.com/ayecue/greybel-vs/issues/213) - thanks for reporting to [@sornii](https://github.com/sornii)
- implement new type manager which keeps better track of types and properties
- fix and improve documentation regarding intrinsics
- support defining argument and return types for functions through comments to which the hover and auto complete features will react accordingly

## [3.3.8] - 20.06.2024

- add parenthesis for compound assignment - related to [#197](https://github.com/ayecue/greybel-js/issues/197) - thanks for reporting to [@sornii](https://github.com/sornii)
- add transpiler beautifier option to keep parentheses - thanks for the suggestion to [@stevenklar](https://github.com/stevenklar)
- add transpiler beautifier option to set indendation by either tab or whitespace
- add transpiler beautifier option to set amount of whitespaces for indentation

## [3.3.9] - 20.06.2024

- add dev mode for web transpiler so that it won't transpile code into production ready code, meaning that for example includes or imports won't be transpiled via formatter but rather by build command of cli

## [3.3.10] - 26.06.2024

- minor optimizations regarding type resolver such as resolving types through parentheses, keeping api definitions apart from custom definitions preventing unwanted merged definitions, using a proxy container for signature definitions and fixing line overriding for identifier causing to use wrong start lines

## [3.3.11] - 01.07.2024

- add super keyword to type-analyzer
- fix member expression containing new unary when resolving type
- only use shallow copy when copying entity to avoid memory exhaustion for type-analyzer
- properly resolve members of scope variables and api definitions for type-analyzer

## [3.3.12] - 14.07.2024

- fix resolving of namespaces
- optimize deep-hash and deep-equal
- improve error message when path not found in type
- fix typo in len meta description
- use gs instead of ms interpreter in launch intrinsic
- improve definition provider

## [3.3.13] - 15.07.2024

- add missing map intrinsic description
- fix autocomplete including map related intrinsics in general

## [3.3.14] - 15.07.2024

- properly check in type-analyzer if string in index is valid identifier
- let type-analyzer resolve isa expressions as number

## [3.3.15] - 17.07.2024

- let type-analyzer resolve logical expressions as number
- let type-analyzer set proper label for binary expression

## [3.3.16] - 18.07.2024

- keep multiline comments in devMode when beautifying
- fix beautify regarding multiline comments
- fix beautify when having multiple commands in one line via semicolon
- fix signature parser for multiline comments
- add support for envar, file and line in type-analyzer

## [3.3.17] - 18.07.2024

- fix launch_path meta example
- improve launch_path, program_path and launch meta descriptions

## [3.3.18] - 20.07.2024

- optimize build size

## [3.3.19] - 22.07.2024

- optimize interpreter task schedule, resulting in faster execution

## [3.4.0] - 24.07.2024

- fix beautify indent on shorthand if else
- make installer code more verbose, including more error messages
- update message-hook agent to version 0.5, being able to properly sync windows between the two clients (NOTE: you'll need download the newest dll manually)
- add postCommand option to build - thanks for the suggestion [@midsubspace](https://github.com/midsubspace)
- only expose one executable greybel command and instead use nested commands for different functionalities
- add inject expression - related to [#218](https://github.com/ayecue/greybel-vs/issues/218) - thanks for the suggestion [@midsubspace](https://github.com/midsubspace)

## [3.4.1] - 27.07.2024

- remove uneccessary file to decrease package size

## [3.4.2] - 01.08.2024

- show proper error message when trying to call propery from null value instead of throwing ".getWithOrigin is not a function"

## [3.4.3] - 05.08.2024

- fix "Unexpected identifier 'assert'" error on newer node versions - related to [#212](https://github.com/ayecue/greybel-js/issues/212) - thanks for reporting Pungent Bonfire

## [3.4.4] - 10.08.2024

- fix bytecode generator to properly add negative numbers as default parameters, `function myFunc(index = -1)` works now
- fix handling of non literal comparisons such as biggerThan, biggerThanOrEqual, lessThan or lessThanEqual, `"23" < [42]` now correctly returns null
- properly support grouped comparisons, `"0" <= numberStr <= "9"` works now
- properly parse shorthands if those are containing a block
- fix metaxploit load not checking if returned entity is actually a file
- fix beautify not handling multiline expressions in block openers correctly resulting in unwanted new lines
- fix beautify not properly appending comment if keepParentheses option is active
- fix beautify not handling if shorthands with function blocks in them correctly resulting in unwanted new lines
- minor performance improvements in parser


## [3.4.5] - 10.08.2024

- fix beautify not properly appending comment to index expression

## [3.4.6] - 11.08.2024

- fix beautify for if shorthand clause with comment
- fix beautify adding an unwanted new line to empty blocks
- fix beautify adding unwanted new lines for if shorthands with multiline expression towards end of block

## [3.4.7] - 17.08.2024

- fix beautify causing misbehaviour when list/map one-liners had comment at end

## [3.4.8] - 19.08.2024

- allow binary expression to be executed as statement
- cleanup open handles of binary/logical expression that are statements

## [3.4.9] - 29.08.2024

- update set_content tooltip to include lacking permissions as reason to return 0

## [3.4.10] - 02.09.2024

- fix error related to type analyzer that could cause "Cannot read properties of undefined (reading 'start')" in lsp

## [3.4.11] - 03.09.2024

- fix beautify for parentheses and comments where a comment would be right after closing parenthese
- fix function argument recovery if invalid syntax was provided in function arguments

## [3.5.0] - 13.09.2024

- refactor transformer in transpiler to improve transformations
- fix conflict with comments on beautify - related to [#53](https://github.com/ayecue/miniscript-vs/issues/53) - thanks for reporting to [@Xisec](https://github.com/Xisec)
- fix edge cases for variable optimizations on uglify
- fix edge cases for literal optimizations on uglify

## [3.5.1] - 16.09.2024

- fix globals shorthand identifier not getting injected when no literal optimization were happening - related to [#157](https://github.com/ayecue/greybel-js/issues/157) - thanks for reporting to [@smiley8D](https://github.com/smiley8D)
- fix behaviour of import op in runtime which caused it's payload to be called every time it was imported, instead it's only getting executed once now - related to [#222](https://github.com/ayecue/greybel-js/issues/222) - thanks for reporting to [@smiley8D](https://github.com/smiley8D)


## [3.5.2] - 27.10.2024

- properly handle values that cannot be iterated through on for loop
- fix type analyzer failing if slice expression was used after expression - related to [#255](https://github.com/ayecue/greybel-vs/issues/255) - thanks for reporting to [@ide1ta](https://github.com/ide1ta)
- add meta description for intrinsics of current nightly version
- update textmate with methods and types of current nightly version

## [3.5.3] - 28.10.2024

- add custom types handling in type analyzer - related to [#198](https://github.com/ayecue/greybel-vs/issues/198)
- fix issue related to building of larger projects which could lead to maximum call stack size exceeded error to be thrown - thanks for reporting to [@ide1ta](https://github.com/ide1ta)

## [3.5.4] - 04.11.2024

- extend custom types with virtual properties
- allow "custom type" type docs above new statements
- show inherited properties of custom types properly in autocomplete

## [3.5.5] - 09.11.2024

- improve definition provider
- add silence option to build and execute - thanks for the suggestion to [cantemizyurek](https://github.com/cantemizyurek)

## [3.5.6] - 10.11.2024

- properly handle cyclic isa defintions in type analyzer

## [3.5.7] - 10.11.2024

- include all custom type definitions of entities with multiple types

## [3.5.8] - 17.11.2024

- fix mock env folder deletion behaviour - thanks for reporting to [@ide1ta](https://github.com/ide1ta)

## [3.5.9] - 24.11.2024

- forbid keywords in uglify namespaces optimization - thanks for reporting to [@linuxgruven](https://github.com/linuxgruven)
- fix for iteration namespace optimization of __i_idx variables - thanks for reporting to [@linuxgruven](https://github.com/linuxgruven)

## [3.5.10] - 24.11.2024

- fix literal optimization for negative numeric values - thanks for reporting to [@linuxgruven](https://github.com/linuxgruven)

## [3.5.11] - 28.11.2024

- fix rnd intrinsic seed behaviour - thanks for reporting to GSQ
- fix bitwise intrinsic to properly do 64bit bitwise operations - thanks for reporting to GSQ

## [3.5.12] - 01.12.2024

- minor improvement to assumption logic of non existing properties

## [3.5.13] - 06.12.2024

- remove map and list properties from assignment registry resulting in less noise within the symbol provider
- include full namespace in symbol provider
- add new entity kinds to improve visibility of internal intrinsics in auto complete

## [3.5.14] - 07.12.2024

- fix file extension handling in build intrinsic - related to [#271](https://github.com/ayecue/greybel-vs/issues/271) - thanks for reporting to [@ide1ta](https://github.com/ide1ta)
- improve error reporting on file imports - should make it more clear what the reason for failure is

## [3.5.15] - 07.12.2024

- change type analyzer to only assume on define
- when merging internal definitions take first entity kind instead of using internal kind

## [3.5.16] - 09.12.2024

- prevent the transpiler from using special patterns when inserting transformed code - this fix resolves issues with code combinations that include special patterns such as $$, $&, $', $n, and $<name>