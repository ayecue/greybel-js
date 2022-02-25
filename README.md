# Greybel-JS 1.1.4

GreyScript transpiler/interpreter ([GreyHack](https://store.steampowered.com/app/605230/Grey_Hack/)).

Lexer and Parser using partly logic from [luaparse](https://www.npmjs.com/package/luaparse). It's heavily modified though to support GreyScript.

Also partly based on my GreyScript preprocessor written in GreyScript [greybel](https://github.com/ayecue/greybel). Without it's issues. That's mainly due to using a lexer and parser instead of string manipulation.

## Links

- Latest changes: [Changelog](/CHANGELOG.md)
- Demo Project: [TEdit](https://github.com/ayecue/tedit)
- Greybel UI Demo: [greybel-ui](https://greybel-ui.netlify.app/)
- VSCode extension: [greyscript](https://github.com/ayecue/greyscript)

## Greybel Modules

These modules are used in this CLI. Feel free to create your own tool using these.

- [GreyScript Core](https://github.com/ayecue/greyscript-core)
- [Greybel Core](https://github.com/ayecue/greybel-core)
- [Greybel Transpiler](https://github.com/ayecue/greybel-transpiler)
- [Greybel Interpreter](https://github.com/ayecue/greybel-interpreter)
- [Greybel Intrinsics](https://github.com/ayecue/greybel-intrinsics)
- [Greybel GreyHack Intrinsics](https://github.com/ayecue/greybel-gh-mock-intrinsics)

## Features

- syntax sugar
	- shortcuts for blocks
	- multiline lists
	- multiline maps
	- math shortcuts
- import code via `#include` and `#import`
- environment variables via `#envar`
- minimizing your script, depending on the size of your project you can save up to 40%
	- optimizing literals (strings, booleans, numbers)
	- minifying namespaces
	- removing whitespaces + tabs
	- obfuscate your code (even though that's just a side effect of all the steps above)
- bundling of files
- interpreter for code execution
- REPL for GreyScript
- Web UI with simplified features

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
	-ev, --env-files <file...>		Environment varibales files
	-vr, --env-vars <vars...>		Environment varibales
	-en, --exclude-namespaces <vars...>	Exclude namespaces from optimization
	-u, --uglify				Uglify your code
	-h, --help				Display help for command
	-i, --installer				Create installer for GreyScript (Should be used if you use import_code)
	-dno, --disable-namespaces-optimization	Disable namespace optimization
	-dlo, --disable-literals-optimization	Disable literals optimization
```

## Examples:
### Most common build command:
```
greybel /my/code/file.src
```

You can use the installer feature if you are using `import_code`. 
```
greybel /my/code/file.src --installer
```
This will create an installer file which pretty much bundles all the files into one. Installer files exceeding the max char limit of Grey Hack will get splitted automatically.

# Syntax
## Block shortcuts
```
while(true) if (true) then print("hello"); print("world"); return false;
```

## Multiline lists
```
test = [
	[
		"value1",
		"value3",
		true
	],
	false,
	null
]
```

## Multiline maps
```
test = {
	"test": {
		"level2": {
			"enough": true
		}
	},
	"somelist": [
		0, 1, 2
	]
}
```

## Math shortcuts
```
a /= b
a *= b
a -= b
a += b
a << b
a >> b
w = a >>> (b << c) >> a
a | b
a & b
a ^ b
```

## import_code
The native `import_code` is now supported as well.

The implementation in this parser enables you to build files in your actual file system via an additional attribute.
```
// The default import_code command will just be parsed but won't actually include a file from your file system
import_code("somefile.src");

// As you can see this will adds another string behind the actual parameter. This enables the parser to build a dependency in your file system.
import_code("somefile.src":"./myProject/test.src");
```

This going to be very useful if you want to use the new feature but still want your script files to get optimized.

Together with the new `--installer` flag in the CLI it will even bundle your files for you which makes it easier to copy paste code from your file system into the game.

## Importing
Import will use the relative path from the file it imports to. Also keep in mind to not use the `.src` extension. It will automatically add the extension.
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

## Including
Include will use the relative path from the file it imports to. Also keep in mind to not use the `.src` extension. Unlike `import` this will not wrap the module. This will just purely put the content of a file into your script.
```
//File path: library/hello-world.src
hello = function()
	print("Hello world!")
end function

//File path: example.src
#include library/hello-world;

hello() //prints "Hello world!"
```

## Envar
Envar will put environment variables into your script. Just keep in mind to use the `--env-files /path/env.conf` parameter. This might be useful if you want to use different variables for different environments. You can use multiple env files `--env-file /path/default.conf --env-file /path/env.conf`.

Another thing you can do is defining the envars in the console command. `--env-vars test=value --env-vars anothertest=value`
```
//File path: env.conf
# MY COMMENT
random=SOME_VALUE

//File path: example.src
somevar = #envar random;

print(somevar) //prints "SOME_VALUE"
```

## Debugger
Enables you to see the variables in the current scope. It will also set a breakpoint and stop the code execution.
```
index = 1
print("Hello world!")
print("Another string!")
debugger
```

![Debugger UI](/assets/debugger-ui-preview.png?raw=true "Debugger UI")

# Interpreter
```
Interpreter CLI
Example: greybel-execute <myscriptfile>

Options:
	-p, --params	Execution parameters
```

For Windows you can use something like [gitbash](https://gitforwindows.org/). Or just use the UI.

# REPL
```
Emulator CLI
Example: greybel-repl
```

For Windows you can use something like [gitbash](https://gitforwindows.org/). Or just use the UI.

# Web-UI
```
Emulator UI CLI
Example: greybel-ui
```

This is a simple UI where you can minify code and execute code. There is also a VSCode extension. It features a lot of neat features. Like for example a debugger with breakpoints etc.

![Web UI](/assets/emulator-ui-preview.png?raw=true "Web UI")

# TODO
- debugging (semi integrated)
