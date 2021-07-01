# Greybel-JS 0.2.3

GreyScript preprocessor ([GreyHack](https://store.steampowered.com/app/605230/Grey_Hack/)). Which adds new features to GreyScript.

Lexer and Parser using partly logic from [luaparse](https://www.npmjs.com/package/luaparse). It's heavily modified though to support GreyScript.

Also partly based on my GreyScript preprocessor written in GreyScript [greybel](https://github.com/ayecue/greybel). Without it's issues. That's mainly due to using a lexer and parser instead of string manipulation.

Latest changes: [Changelog](/CHANGELOG.md)

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

# Install

```
npm i greybel-js
```

# CLI Usage
## Compiler
```
Compiler CLI
Version: 0.2.3
Example: greybel <myscriptfile> [output]

Arguments:
	filepath                    File to compile
	output                      Output directory

Options:
	-V, --version               output the version number
	-ev, --env-files <file...>  Environment varibales files
	-vr, --env-vars <vars...>   Environment varibales
	-u, --uglify                Uglify your code
	-h, --help                  display help for command
```

### Examples:
#### Most common build command:
```
greybel /my/code/file.src
```

## Emulator
```
Emulator CLI
Version: 0.2.3
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
Version: 0.2.3
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
a++
a--
++a
--a
a /= b
a *= b
a -= b
a += b
a << b
a >> b
w = a >>> (b << c) >> a++
a | b
a & b
a ^ b
a=a++ + ++b
a=++a + --b
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
For now this will just put the scope object into the console so you can take a look what's in the current scope and also upper scopes.

In the future you will be able to inspect the scope via the console to get viable information. It will act like breakpoint in your code.
```
index = 1
print("Hello world!")
print("Another string!")
//debugger
```

# Things to come
- add full support of Grey Hack API to emulator
- add support for native `import_code`
- port greybel-js to GreyScript to replace https://github.com/ayecue/greybel
- clean up codebase
- use typescript
- debugging
- more functionality and possibly more syntax sugar
