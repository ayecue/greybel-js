# Greybel-JS 0.3.2

[![Greybel-JS](https://circleci.com/gh/ayecue/greybel-js.svg?style=svg)](https://circleci.com/gh/ayecue/greybel-js)

GreyScript preprocessor/interpreter/emulator ([GreyHack](https://store.steampowered.com/app/605230/Grey_Hack/)).

Lexer and Parser using partly logic from [luaparse](https://www.npmjs.com/package/luaparse). It's heavily modified though to support GreyScript.

Also partly based on my GreyScript preprocessor written in GreyScript [greybel](https://github.com/ayecue/greybel). Without it's issues. That's mainly due to using a lexer and parser instead of string manipulation.

- Latest changes: [Changelog](/CHANGELOG.md)
- Demo Project: [TEdit](https://github.com/ayecue/tedit)

Features:
- supports shortcuts for blocks
- supports multiline lists
- supports multiline maps
- supports math shortcuts
- import files, used to load other files into script
- wraps imported files in function block to prevent variable shadowing
- include which unlike import just copy paste its content
- envar which puts values from one file or multiple env files into the script
- minimizing your script, depending on the size of your project you can save up to 40%
	- optimizing literals (strings, booleans, numbers)
	- minifying namespaces
	- removing whitespaces + tabs
	- obfuscate your code (even though that's just a side effect of all the steps above)
- includes interpreter + emulator (Grey Hack polyfills) which enables debugging code
- includes ui for interpreter + emulator and transpiler
- debugger feature (not completly implemented yet)
- installer feature
- supports import_code

# Install

```
npm i greybel-js
```

# CLI Usage
## Transpiler
```
Transpiler CLI
Example: greybel <myscriptfile> [output]

Arguments:
	filepath                    File to compile
	output                      Output directory

Options:
	-V, --version               	output the version number
	-ev, --env-files <file...>  	Environment varibales files
	-vr, --env-vars <vars...>   	Environment varibales
	-u, --uglify                	Uglify your code
	-h, --help                  	display help for command
	-i, --installer			Create installer for GreyScript (Should be used if you use import_code)
```

### Examples:
#### Most common build command:
```
greybel /my/code/file.src
```

You can use the installer feature if you are using `import_code`. 
```
greybel /my/code/file.src --installer
```
This will create an installer file. Instead of copy+pasting every single file you can just copy+paste the installer files into Grey Hack. The installer files will automatically get splitted if it is at the max character limit of a Grey Hack file.

To execute an installer you just have to create a file and paste the installer file content into it. Then you need to use the `build` command to compile it to an binary. Then just execute the binary. It will automatically create all the files in your Grey Hack file system.

## Emulator
```
Emulator CLI
Example: greybel-console --path "<path to steam common>/Grey Hack"

Options:
	-p, --path	Path to Grey Hack
```

For Windows you can use something like [gitbash](https://gitforwindows.org/). Or just use the UI.

Keep in mind that not all functionality is implemented yet. So certain parts of the Grey Hack API is not there.

```
Emulator shell commands:
	- run <filepath> //used to run scripts from your filesystem
	- reload
	- cd <path>
	- exit
	- clear
```

You can use the shell just like in the game. All native scripts like `ls` or `sudo` should work. All functionality that isn't supported yet will print an information text that indicates which exact method it is.

### Examples:
#### Most common emulator command:
```
greybel-console --path "./Library/Application\ Support/Steam/steamapps/common/Grey\ Hack"
```

![Emulator](/assets/emulator-preview.png?raw=true "Emulator")

## Emulator-UI
```
Emulator UI CLI
Example: greybel-ui

Options:
	-r, --refresh	Rebuilds UI.
```

Keep in mind that not all functionality is implemented yet. So certain parts of the Grey Hack API isn't there yet.

```
Emulator shell commands:
	- cd <path>
	- exit
	- clear
```

You can use the shell just like in the game. All native scripts like `ls` or `sudo` should work. All functionality that isn't supported yet will print an information text that indicates which exact method it is.

### Examples:
#### Most common emulator UI command:
```
greybel-ui
```

![Emulator UI](/assets/emulator-ui-preview.png?raw=true "Emulator UI")

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

## import_code
The native `import_code` is now supported as well. For now it's only available in the builder. The interpreter will not support this for now. Will be added in a later update.

The implementation in this parser enables you to build files in your actual file system via an additional attribute.
```
// The default import_code command will just be parsed but won't actually include a file from your file system
import_code("somefile.src");

// As you can see this will adds another string behind the actual parameter. This enables the parser to build a dependency in your file system.
import_code("somefile.src":"./myProject/test.src");
```

This going to be very useful if you want to use the new feature but still want your script files to get optimized.

Together with the new `--installer` flag in the CLI it will even build an installer file for you which makes it easier to copy paste code from your file system into the game.

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
Envar will put environment variables into your script. Just keep in mind to use the `--env-files /path/env.conf` parameter. This might be useful if you want to use different variables for different environments. You can use multiple env files `--env-file /path/default.conf /path/env.conf`.

Another thing you can do is defining the envars in the console command. `--env-vars test=value anothertest=value`
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
//debugger
```

![Debugger UI](/assets/debugger-ui-preview.png?raw=true "Debugger UI")

# Things to come
- add full support of Grey Hack API to emulator (delayed for now)
- port greybel-js to GreyScript to replace https://github.com/ayecue/greybel
- clean up codebase
- use typescript
- debugging (semi integrated)
- more functionality and possibly more syntax sugar
- security in terms of scoping
