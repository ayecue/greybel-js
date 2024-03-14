# Greybel-JS

CLI which provides a set of tools for working with GreyScript. GreyScript is a  scripting language used within [GreyHack](https://store.steampowered.com/app/605230/Grey_Hack/).

## Links

- Latest changes: [Changelog](/CHANGELOG.md)
- Projects using Greybel: [viper-3.0](https://github.com/cantemizyurek/viper-3.0)
- Demo Projects: [Minesweeper](https://github.com/ayecue/minesweeper-gs), [JSON](https://github.com/ayecue/json), [TEdit](https://github.com/ayecue/tedit)
- Greybel UI Demo: [greybel-ui](https://editor.greyscript.org)
- VSCode extension: [greybel-vs](https://github.com/ayecue/greybel-vs)
- GreyScript API: [GreyScript Documentation](https://documentation.greyscript.org)
- Grey Hack Image Transformer: [gh-image-transformer](https://github.com/ayecue/gh-image-transformer)
- Discord: [dedicated Greybel Discord](https://discord.gg/q8tR8F8u2M)

## Features

- [Simplify importing for small and big projects](#transpiler)
	- [Import your files into the game without copy + paste](#auto-create-files-in-game)
	- [Handle dependencies between code files](#dependency-management-transpiler)
	- [Environment variables while transpiling](#environment-variables-transpiler)
	- [Minor syntax additions](#syntax)
	- Minimizing your script, depending on the size of your project you can save up to 40%
		- optimizing literals (strings, booleans, numbers)
		- minifying namespaces
		- removing whitespaces + tabs
		- obfuscate your code (even though that's just a side effect of all the steps above)
	- Beautify your code (can be useful to deobfuscate code)
- [Execute/Test your code outside of GreyHack](#interpreter)
	- [Handle dependencies between code files](#dependency-management-interpreter)
	- [Local mock environment](#local-environment)
	- [GreyScript API support](#greyscript-api-support)
	- [Debug your code](#debugger-cli)
	- [TextMesh Pro Rich Text support](#textmesh-pro-rich-text-support-cli)
	- [Environment variables](#environment-variables-interpreter)
- [REPL for GreyScript](#repl)
- [Web UI](#web-ui)
	- [Share code](#share-code)
	- [Save code](#save-code)
	- [Debug your code](#debugger-web-ui)
	- [TextMesh Pro Rich Text support](#textmesh-pro-rich-text-support-web-ui)

# Install

```
npm i -g greybel-js
```

# Alternative setup via Docker

Execute the following commands to build the image:
```bash
docker pull crater44/greybel-cli
docker tag crater44/greybel-cli:latest greybel-cli
```
Now you can run any greybel-js related command via docker by using the following command:
```bash
docker run -i -v "$(pwd):/app" greybel-cli <your-greybel-command>
```
It'll create a volume on the fly in which the command gets executed and create the build folder if necessary. As it is a container it'll work isolated from the rest of your system.

To update the package you'll need to rebuild the image.

Hint: You can also create an alias to use greybel-js but it should be created as a function instead of a regular alias since the latter would cache the pwd command's value on the first execution:

```
greybel-cli() {
    docker run -i -v $(pwd):/app greybel-cli $@
}
```
After the alias is in place greybel-js can be used like this: 
```
greybel-cli greybel-execute path/file.src
```

# Transpiler
```
Transpiler CLI
Example: greybel <myscriptfile> [output]

Arguments:
	filepath                    File to compile
	output                      Output directory

Options:
  -V, --version                                  output the version number
  -ev, --env-files <file...>                     Specifiy environment variables file.
  -vr, --env-vars <var...>                       Specifiy environment variable definition.
  -en, --exclude-namespaces <namespace...>       Exclude namespaces from optimization. This option is only used in combination with uglifying.
  -dlo, --disable-literals-optimization          Disable literals optimization. This option is only used in combination with uglifying.
  -dno, --disable-namespaces-optimization        Disable namespace optimization. This option is only used in combination with uglifying.
  -u, --uglify                                   Minify your code.
  -b, --beautify                                 Beautify your code.
  -o, --obfuscation                              Allows the namespace optimization to use a wider range of characters in order to safe more
                                                 space.
  -id, --ingame-directory <ingameDirectory>      In-game directory target path.
  -i, --installer                                Create installer for GreyScript. Only use this option when there is at least one import_code
                                                 in place.
  -mc, --max-chars <number>                      Max amount of characters allowed per file. Installer files will be split depending on the
                                                 amount defined in this option. By default the maximum is 160k chars.
  -ac, --auto-compile                            Enables auto-compile within the installer or create-ingame feature. This option will also
                                                 delete all files in-game after building.
  -acp, --auto-compile-purge                     Specify this option if you would like all of the imported folders to be deleted after the
                                                 auto-compilation process is completed regardless of any files may remaining in those folders.
  -acn, --auto-compile-name <name>               Specify this option if you would like define a special name for the in-game binary.
  -ci, --create-ingame                           Enable transfer of your code files into Grey Hack.
  -cia, --create-ingame-agent-type <agent-type>  Agent type used for in-game transfer. You can choose between "headless" or "message-hook".
  -cim, --create-ingame-mode <mode>              Mode used for in-game transfer. You can choose between "local" or "public".
  -dbf, --disable-build-folder                   Disable the default behaviour of putting the output into a build folder. It will instead just
                                                 put it wherever you set the output destination to.
  -h, --help                                     display help for command
```

## Examples:
### Most common build command:
```
greybel /my/code/file.src
```

## Auto create files in-game

It is possible to automatically create transpiled files in the game. This can be activated by using the `--create-ingame` flag. Additionally, you can choose between two agents by using `--create-ingame-agent-type`. Depending on the agent there are certain prerequisites to fulfill or behaviors to watch out for.

### Headless

When you are using headless you are essentially connecting to the game without using the actual native game client. Depending on which mode you selected, either `local` or `public` the agent will import the files into either singleplayer or multiplayer.

By default `local` is selected. Keep in mind that the game needs to have a single-player session running for `local` to work. For `public` there is no need to have the game client running.

A minor caveat is that a Steam account and password need to be provided. The refresh token will be cached so no continued providing of credentials is required.

**Note**: This agent will potentially log you out of Grey Hack since Grey Hack only allows one active game session.

### Message Hook

The message-hook agent will essentially send messages to the game server through the game client. For that to work you'll have to install [BepInEx](https://github.com/BepInEx/BepInEx) first and then the plugin second. Here are the prerequisites:

- Install [BepInEx version 6.0.0-pre.1 UnityMono](https://github.com/BepInEx/BepInEx/releases/tag/v6.0.0-pre.1) for more details about the installation you can take a look [here](https://docs.bepinex.dev/master/articles/user_guide/installation/unity_mono.html)
- With [BepInEx](https://github.com/BepInEx/BepInEx) in place, you just need to download the [GreyHackMessageHook.dll](https://gist.github.com/ayecue/b45998fa9a8869e4bbfff0f448ac98f9/raw/7e8459630679d52f3e0275c13a2908ee5eff0d51/GreyHackMessageHook.dll) and put it into the plugins folder
- You may need to modify the Steam launch path to `"/path/to/Steam/steamapps/common/Grey Hack/run_bepinex.sh" %command%` unless you are using Windows

With all that done you can now start the game and start either a single-player or multiplayer session. You'll be now able to sync files with the game without getting disconnected.

Additionally, you won't need to provide any Steam credentials nor do you need to select a mode.

**Note**: For this agent to work you **have to have Grey Hack running**.

## Dependency Management (Transpiler)

Greybel enables you to split your code into different files which is useful to keep readability and also to make reusable code.

It is recommended to use [include](#include) and [import](#import) for small or medium-sized projects.

For big projects, [import_code](#import_code) should be used instead since the transpiler will bundle your files in a way that makes full use of the [import_code](#import_code) capabilities in the game to avoid exceeding the maximum character limit of **160.000**.

Cyclic dependencies will be detected as well. In case there is one an error will be thrown indicating which file is causing it.

A step by step guide is available [here](https://main.greyscript.org/manuals/useful-tools-for-greyscript.html#manage-your-dependencies) as well.

### Import

Used to import exported namespaces from a file. Features of this import functionality:
- supports relative imports
- only loads code when required
- does not pollute global scope
- only gets imported once regardless of how many times it got imported
- only exports what you want
- code will be appended to the root file which may cause exceeding the character limit of GreyHack, use [import_code](#import_code) instead if that is an issue

You can take a look at the [example code](/example/import) to get a better idea of how to use this feature.

### Include

Used to import the content of a file. Features of this import functionality:
- supports relative includes
- very easy to use
- will pollute global scope
- will include the content of a file every time, which may cause redundant code
- may cause exceeding the character limit of GreyHack, use [import_code](#import_code) instead if that is an issue

To get a better idea you can take a look at the following [example code](/example/include).

### import_code

Used to import code from a file. Features of this import functionality:
- keeps files separate in-game, which is useful to avoid the character limit
- supports nested `import_code`
- supports relative imports

Here is some [example code](/example/import-code).

By using the `--installer` flag Greybel will create one or more installer files depending on the size of your project. These installer files will essentially contain all different code files and logic to create all files in the game. So basically you just need to copy and paste the code of the installer files into the game and then compile + execute them. By using the `--auto-compile` flag additional logic will be appended that will automatically compile the project and remove all source files.

By using the `--ingame-directory` CLI parameter you can also define to which in-game space you want to import the files. By default `/root/` will be used.

Additionally, it is important to mention that **nested** `import_code` is supported as well. This is made possible by moving all imports into the entry file depending on their usage throughout the project. It is recommended to only use `import_code` at the head of the file since the import locations of nested files cannot be guaranteed.

## Environment Variables (Transpiler)

Greybel supports the injection of environment variables while transpiling. There are two ways of environment variables.

1. Use the `--env-files` CLI parameter to [define environment variables configuration files](/example/environment-variables/env.conf).
2. Use the `--env-vars TEST="hello world"` CLI parameter to define variables on the fly.

Here is an [example](/example/environment-variables) of environment variable injection.

## Syntax

Any valid MiniScript or GreyScript syntax is supported. Additionally, some minor syntax sugar is added to those languages. If you use those keep in mind to transpile your code first. Using these is completely optional though.

### While, For and Function - shorthand
```
while(true) print("hello world")
for item in [1, 2, 3] print(item)
test = function() return 42
```

### No trailing comma is required in maps or lists
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

### Math - shorthand
```
a /= b
a *= b
a -= b
a += b
```

### Bitwise - shorthand
```
a = b << c
a = b >> c
a = b >>> c
a = b | c
a = b & c
```

### Block comment
```
/*
	My block comment
*/
print("test")
```

# Interpreter
```
Interpreter CLI
Example: greybel-execute <myscriptfile>

Arguments:
	myscriptfile			File to execute

Options:
	-p, --params <params...>    Defines params used in script execution.
  -i, --interactive           Enter params in interactive mode instead of arguments.
  -d, --debug                 Enable debug mode which will cause to stop at debugger statements.
  -s, --seed <seed>           Define seed value which is used to generate entities.
  -ev, --env-files <file...>  Specifiy environment variables file.
  -vr, --env-vars <var...>    Specifiy environment variable definition.
```

For Windows, you can use something like PowerShell or [ConEmu](https://conemu.github.io/). Or just use the UI. GitBash is not recommended due to a [TTY issue with node](https://github.com/ayecue/greybel-js/issues/34).

## Dependency Management (Interpreter)

Dependencies will be dynamically loaded into the execution without any limitations. Cyclic dependencies are supported as well.

## Environment Variables (Interpreter)

Greybel supports the injection of environment variables for the interpreter as well. The way CLI parameters are used is identical to the ones of transpiling.

1. Use the `--env-files` CLI parameter to [define environment variables configuration files](/example/environment-variables/env.conf).
2. Use the `--env-vars TEST="hello world"` CLI parameter to define variables on the fly.

Here is an [example](/example/environment-variables) of environment variable injection.

## Local environment

[Greybel GreyHack Intrinsics](https://github.com/ayecue/greybel-gh-mock-intrinsics) will automatically generate a local environment. It will also generate other computers, networks, filesystems etc on the fly. Generating is by default based on a seed called `test`. The seed can be modified with the seed option. While using the same seed-generated entities should stay consistent.

The local computer setup is hard coded. The admin credentials are `root:test`. You will also have `crypto.so` and `metaxploit.so` on your local computer available.

Examples:
```
metax = include_lib("/lib/metaxploit.so") //returns metaxploit interface
print(metax) //prints metaxploit

myShell = get_shell("root", "test") //get local root shell
```

## Greyscript API support

The intrinsics to support the Greyscript API are provided by [Greybel Intrinsics](https://github.com/ayecue/greybel-intrinsics) and [Greybel GreyHack Intrinsics](https://github.com/ayecue/greybel-gh-mock-intrinsics). Keep in mind that not all of these functions are completely mocked. Also, only API that is available in the stable build will be implemented.

Not yet supported:
- `AptClient` - only polyfill which "returns not yet supported"
- `Blockchain` - only polyfill which "returns not yet supported"
- `Wallet` - only polyfill which "returns not yet supported"
- `SubWallet` - only polyfill which "returns not yet supported"
- `Coin` - only polyfill which "returns not yet supported"

## Debugger (CLI)
Pauses execution and enables you to inspect/debug your code. Additionally, you'll be able to inject code.
```
index = 1
print("Hello world!")
debugger
print("Another string!")
```

## TextMesh Pro Rich Text support (CLI)
[TextMesh Pro Rich Text](http://digitalnativestudios.com/textmeshpro/docs/rich-text/) is partially supported.

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

Note: For the CLI feature Greybel will try to transform TextMesh Pro Rich-Text tags into ANSI-Codes. Due to the nature of TextMesh Pro Rich-Text tags some formatting will get lost. If you are looking for a proper preview of your output in Grey Hack please check out [the preview output feature from the VSCode extension](https://github.com/ayecue/greybel-vs?tab=readme-ov-file#preview-output).

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

// can be used for debugging purposes, will return current stack trace
test = function
	print(testLib.get_stack_trace)
end function

test
```

# REPL
```
REPL CLI
Example: greybel-repl
```

For Windows, you can use something like PowerShell or [ConEmu](https://conemu.github.io/). Or just use the UI. GitBash is not recommended any more due to a [TTY issue with node](https://github.com/ayecue/greybel-js/issues/34).

REPL also features a [local environment](#local-environment) and [GreyScript API support](#greyscript-api-support)

# Web-UI
```
Web UI CLI
Example: greybel-ui
```

Simple UI which can be used for [minifying](#transpiler) and [executing](#interpreter) code. There is also a [VSCode extension](https://github.com/ayecue/greybel-vs) which includes a lot of neat features. Like for example a debugger with breakpoints etc.

![Web UI](/assets/emulator-ui-preview.png?raw=true "Web UI")

## Share code

This functionality can be used to share code with others without saving it. Keep in mind that the URL might become very long and may even exceed the URI size accepted by the online UI. If you want to share code without this limitation use the [save code functionality](#save-code) instead.

## Save code

This functionality can be used to save and also share code with others. Every time save is pressed a new id will get generated and appended to the browser URL which enables you to just copy and paste the URL and share your code with others.

## Debugger (Web-UI)

![Debugger UI](/assets/debugger-ui-preview.png?raw=true "Debugger UI")

## TextMesh Pro Rich Text support (Web-UI)
[TextMesh Pro Rich Text](http://digitalnativestudios.com/textmeshpro/docs/rich-text/) is partially supported.

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
* indent
</details>

Note: For the UI feature Greybel will try to transform TextMesh Pro Rich-Text tags into HTML. But due to the nature of TextMesh Pro Rich-Text tags some formatting will get lost. If you are looking for a proper preview of your output in Grey Hack please check out [the preview output feature from the VSCode extension](https://github.com/ayecue/greybel-vs?tab=readme-ov-file#preview-output).

# Todo

* implement missing intrinsics
* improve mock environment

# Contact

If you have any questions, feature requests or need help feel free to join the [dedicated Greybel Discord](https://discord.gg/q8tR8F8u2M).