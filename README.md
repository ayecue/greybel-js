# Greybel-JS

GreyScript transpiler/interpreter ([GreyHack](https://store.steampowered.com/app/605230/Grey_Hack/)).

## Links

- Latest changes: [Changelog](/CHANGELOG.md)
- Demo Projects: [Minesweeper](https://github.com/ayecue/minesweeper-gs), [JSON](https://github.com/ayecue/json), [TEdit](https://github.com/ayecue/tedit)
- Greybel UI Demo: [greybel-ui](https://editor.greyscript.org)
- VSCode extension: [greybel-vs](https://github.com/ayecue/greybel-vs)
- Greyscript API: [GreyScript Documentation](https://documentation.greyscript.org)

## Features

- [simplifying the process of importing your code into the game](#transpiler)
	- [imports](#importing) (supports [nested import_code](#nested-import_code))
	- [bundler](#when-to-use-the-installer-flag)
	- [environment variables](#envar)
	- [minor syntax additions](#syntax)
	- minimizing your script, depending on the size of your project you can save up to 40%
		- optimizing literals (strings, booleans, numbers)
		- minifying namespaces
		- removing whitespaces + tabs
		- obfuscate your code (even though that's just a side effect of all the steps above)
	- beautify your code (can be useful to deobfuscate code)
- [execute/test your code outside of GreyHack](#interpreter)
	- [local mock environment](#local-environment)
	- [Greyscript API support](#greyscript-api-support)
	- [debugger](#debugger)
	- [TextMesh Pro Rich Text support](#textmesh-pro-rich-text-support)
- [REPL for GreyScript](#repl)
- [Web UI with simplified features](#web-ui)
	- [share code](#share-code)

# Install

```
npm i -g greybel-js
```

# Transpiler
```
Transpiler CLI
Example: greybel <myscriptfile> [output]

Arguments:
	filepath                    File to compile
	output                      Output directory

Options:
	-V, --version				Output the version number
	-ev, --env-files <file...>		Environment variables files
	-vr, --env-vars <vars...>		Environment variables
	-en, --exclude-namespaces <vars...>	Exclude namespaces from optimization
	-u, --uglify				Uglify your code
	-b, --beautify				Beautify your code
	-h, --help				Display help for command
	-i, --installer				Create installer for GreyScript (Should be used if you use import_code)
	-mc, --maxChars				Amount of characters allowed in one file before splitting when creating installer
	-dno, --disable-namespaces-optimization	Disable namespace optimization
	-dlo, --disable-literals-optimization	Disable literals optimization
```

## Examples:
### Most common build command:
```
greybel /my/code/file.src
```

### When to use the installer flag
Use the installer flag when using `import_code`. 
```
greybel /my/code/file.src --installer
```
This will create an installer file which pretty much bundles all the files into one. Installer files exceeding the max char limit of Grey Hack will get splitted automatically.

## Envar
Envar will put environment variables into your script. Just keep in mind to use the `--env-files /path/env.conf` parameter. This might be useful if you want to use different variables for different environments. You can use multiple env files `--env-file /path/default.conf --env-file /path/env.conf`.

You can also define the envars via this parameter. `--env-vars random=SOME_VALUE --env-vars foo=123`
```
//File path: env.conf
# MY COMMENT
random=SOME_VALUE
foo=123

//File path: example.src
somevar = #envar random;
foovar = #envar foo;

print(somevar) //prints "SOME_VALUE"
print(foovar) //prints "123"
```

# Interpreter
```
Interpreter CLI
Example: greybel-execute <myscriptfile>

Options:
	-p, --params			Execution parameters
	-i, --interactive		Interactive parameter
	-s, --seed			Seed parameter
	-ev, --env-files <file...>	Environment variables files
	-vr, --env-vars <vars...>	Environment variables
```

For Windows you can use something like PowerShell or [ConEmu](https://conemu.github.io/). Or just use the UI. GitBash is not recommended anymore due to a [TTY issue with node](https://github.com/ayecue/greybel-js/issues/34).

## Local environment

[Greybel GreyHack Intrinsics](https://github.com/ayecue/greybel-gh-mock-intrinsics) will automatically generate a local environment. It will also generate other computers, networks, filesystems etc on the fly. Generating is by default based on a seed called `test`. The seed can be modified with the seed option. While using the same seed generated entities should stay consistent.

The local computer setup is hardcoded. The admin credentials are `root:test`. You will also have `crypto.so` and `metaxploit.so` at your local computer available.

Examples:
```
metax = include_lib("/lib/metaxploit.so") //returns metaxploit interface
print(metax) //prints metaxploit

myShell = get_shell("root", "test") //get local root shell
```

## Greyscript API support

The intrinsics to support the Greyscript API are provided by [Greybel Intrinsics](https://github.com/ayecue/greybel-intrinsics) and [Greybel GreyHack Intrinsics](https://github.com/ayecue/greybel-gh-mock-intrinsics). Keep in mind that not all of these functions are completly mocked. Also only API that is available in the stable build will be implemented.

Not yet supported:
- `AptClient` - only pollyfill which "returns not yet supported"
- `Blockchain` - only pollyfill which "returns not yet supported"
- `Wallet` - only pollyfill which "returns not yet supported"
- `SubWallet` - only pollyfill which "returns not yet supported"
- `Coin` - only pollyfill which "returns not yet supported"

## Debugger
Pauses execution and enables you to inspect/debug your code.
```
index = 1
print("Hello world!")
debugger
print("Another string!")
```

![Debugger UI](/assets/debugger-ui-preview.png?raw=true "Debugger UI")

## TextMesh Pro Rich Text support
[TextMesh Pro Rich Text](http://digitalnativestudios.com/textmeshpro/docs/rich-text/) is partially supported.

### CLI
<details>
<summary>Supports</summary>

* color
* mark
* underline
* italic
* bold
* strikethrough
* lowercase
* uppercase
</details>

### UI
<details>
<summary>Supports</summary>

* color
* mark
* underline
* italic
* bold
* strikethrough
* lowercase
* uppercase
* align
* cspace
* lineheight
* margin
* nobr
* pos
* size
* voffset
</details>

## TestLib
Adds testing methods for setting up envs and debugging. Keep in mind that this library is not available in the actual game.
```
testLib = include("/lib/testlib.so")

// returns all active shell sessions
sessions = testLib.sessions

// can be used to generate routers, get_router will do the same
router = testLib.get_or_create_router("12.12.12.12")

// can be used to get all computers with root access which are related to router
computers = testLib.get_computers_connected_to_router(router)
computer = computers.values[0]

// can be used to receive root shell of certain computer
shell = testLib.get_shell_for_computer(computer)

// can be used to receive root shell of certain file
shell = testLib.get_shell_for_file(computer.File("/lib"))

// can be used to receive computer with root access of certain file
computer = testLib.get_computer_for_file(computer.File("/lib"))

// can be used for debugging purposes, will call onError callback in case function fails
// onError gets called with an error message and information on where the error happened
failureFn = function
  get_shell(null, null)
end function

onError = function(errMessage, trace)
  print("An error appeared " + errMessage)
  print(trace)
end function

testLib.try_to_execute(@failureFn, @onError)

// can be used for debugging purposes, will create a breakpoint and go into debug mode on failure
testLib.try_to_execute_with_debug(@failureFn)
```

# REPL
```
REPL CLI
Example: greybel-repl
```

For Windows you can use something like PowerShell or [ConEmu](https://conemu.github.io/). Or just use the UI. GitBash is not recommended anymore due to a [TTY issue with node](https://github.com/ayecue/greybel-js/issues/34).

REPL also features a [local environment](#local-environment) and [greyscript API support](#greyscript-api-support)

# Web-UI
```
Web UI CLI
Example: greybel-ui
```

This is a simple UI where you can [minify code](#transpiler) and [execute code](#interpreter). There is also a VSCode extension. It features a lot of neat features. Like for example a debugger with breakpoints etc.

![Web UI](/assets/emulator-ui-preview.png?raw=true "Web UI")

## Share code

Use the share code button to generate an URL. Currently the implementation just uses the query params so watch out for [any browser limitations](https://stackoverflow.com/a/812962).

It's [planned in the future](#todo) to implement some kind of package manager.

# Syntax

Keep in mind that the following syntax is not valid in GreyScript. The transpiler can be used to transform code into valid GreyScript.

## While, For and Function - shorthand
```
while(true) print("hello world")
for item in [1, 2, 3] print(item)
test = function() return 42
```

## No trailing comma required in maps or lists
```
myList = [
	false,
	null
]

myMap = {
	"test": {
		"level2": {
			"bar": true
		}
	}
}
```

## Math - shorthand
```
a /= b
a *= b
a -= b
a += b
```

## Bitwise - shorthand
```
a = b << c
a = b >> c
a = b >>> c
a = b | c
a = b & c
```

# Importing

## import_code
The native `import_code` is supported as well.

The implementation in this parser enables you to build files in your actual file system via an additional attribute.
```
// The default import_code command will just be parsed but won't actually include a file from your file system
import_code("somefile.src");

// As you can see this will adds another string behind the actual parameter. This enables the parser to build a dependency in your file system.
import_code("somefile.src":"./myProject/test.src");
```

This going to be very useful if you want to use the new feature but still want your script files to get optimized.

Together with the `--installer` flag in the CLI it will bundle your files for you which makes it easier to copy/paste code from your file system into the game.

### Nested import_code
Nested `import_code` is supported now as well. Each nested `import_code` will be moved to the entry file when transpiling/building.

## Import
Import will use the relative path from the file it imports to.
```
//File path: library/hello-world.src
module.exports = function()
	print("Hello world!")
end function

//File path: library/hello-name.src
module.exports = function(name)
	print("Hello " + name + "!")
end function

//File path: example.src
#import HelloWord from library/hello-world;
#import HelloName from library/hello-name;

HelloWord() //prints "Hello world!"
HelloName("Joe") //prints "Hello Joe!"
```

## Include
Include will use the relative path from the file it imports to. This will just purely put the content of a file into your script.
```
//File path: library/hello-world.src
hello = function()
	print("Hello world!")
end function

//File path: example.src
#include library/hello-world;

hello() //prints "Hello world!"
```

# Todo

* implement package manager

# Contact

Generally you can just create an [issue](https://github.com/ayecue/greybel-js/issues) if you find a bug or got a feature request. Alternatively you can also contact me on discord `ayecue#9086`.