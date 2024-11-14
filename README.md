# Greybel-JS

CLI that provides a set of tools for working with GreyScript. GreyScript is a scripting language used within [GreyHack](https://store.steampowered.com/app/605230/Grey_Hack/).

## Links

**Project Resources**
- [Changelog](https://github.com/ayecue/greybel-js/blob/main/CHANGELOG.md): View the latest changes and updates.
- [greybel-js CLI](https://github.com/ayecue/greybel-js): Command-line interface for Greybel.
- [GreyScript Documentation](https://documentation.greyscript.org): API documentation for GreyScript.
- [Greybel UI Demo](https://editor.greyscript.org): Online editor to write specifically GreyScript.
- [VSCode Extension](https://github.com/ayecue/greybel-vs): VSCode extension for GreyScript.
- [Language server](https://github.com/ayecue/greybel-languageserver/blob/main/packages/node/README.md): LSP supporting GreyScript.

**Demo Projects Using Greybel**
- [Viper 3.0](https://github.com/cantemizyurek/viper-3.0): Example project demonstrating Greybel.
- [Minesweeper](https://github.com/ayecue/minesweeper-gs): A Minesweeper game created in GreyScript.
- [JSON Parser](https://github.com/ayecue/json): JSON parsing functionality.
- [TEdit](https://github.com/ayecue/tedit): Text editor built with GreyScript.

**Grey Hack Tools**
- [Image Transformer](https://github.com/ayecue/gh-image-transformer): Tool for transforming images in Grey Hack.
- [Website Image Generator](https://github.com/ayecue/gh-website-image-generator): Tool for generating Grey Hack website images.

**Community**
- [Greybel Discord](https://discord.gg/q8tR8F8u2M): Join the community on Discord for support and discussion.

## Features

- **Easily manage imports for small and large projects**  
  - [Import files directly into the game without needing to copy-paste](#auto-create-files-in-game)
  - [Handle dependencies between different code files](#dependency-management-transpiler)
  - [Use environment variables during the transpilation process](#environment-variables-transpiler)
  - [Syntax enhancements for easier coding](#syntax)
  - **Minimize your scripts** to save up to 40% on large projects  
    - Optimize literals (strings, booleans, numbers)
    - Minify namespace names
    - Remove unnecessary whitespace and tabs
    - Obfuscate code (as a side effect of the above optimizations)
  - **Beautify your code** for easier readability (helpful for deobfuscation)

- **Run and test your code outside of GreyHack**  
  - [Manage file dependencies in the interpreter](#dependency-management-interpreter)
  - [Simulate a local mock environment for testing](#local-environment)
  - [Full support for the GreyScript API](#greyscript-api-support)
  - [Debug your code with ease](#debugger-cli)
  - [Support for TextMesh Pro Rich Text](#textmesh-pro-rich-text-support-cli)
  - [Use environment variables in your code execution](#environment-variables-interpreter)

- **Interactive REPL for GreyScript**  
  - Easily experiment with your code in a live environment

- **Web UI for enhanced coding experience**  
  - [Share your code easily](#share-code)
  - [Save your work directly in the web interface](#save-code)
  - [Debug your code within the web UI](#debugger-web-ui)
  - [TextMesh Pro Rich Text support in the web UI](#textmesh-pro-rich-text-support-web-ui)


# Install

```
npm i -g greybel-js
```

# Transpiler
```
Transpiler CLI
Example: greybel build <myscriptfile> [output]

Arguments:
	filepath                    File to compile
	output                      Output directory

Options:
  -V, --version                                  output the version number
  -si, --silence                                 Silences any uncessary noise.
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
  -pcmd, --post-command <command>                Specify this option if you would like to execute a post command.
  -dbf, --disable-build-folder                   Disable the default behaviour of putting the output into a build folder. It will instead just
                                                 put it wherever you set the output destination to.
  -h, --help                                     display help for command
```

## Examples:
### Most common build command:
```
greybel build /my/code/file.src
```

## Auto Create Files In-Game

You can automatically create transpiled files directly in the game using the `--create-ingame` flag. Additionally, you can specify which agent to use for this process by adding the `--create-ingame-agent-type` flag. There are two available agent types, and each comes with its own set of prerequisites and behaviors to be aware of.

#### Headless

When using headless mode, you connect to the game without the native game client. Depending on your selected mode, either `local` or `public`, the agent will import files into either a single-player or multiplayer session.

By default, `local` mode is selected. Note that for `local` to work, the game must have a single-player session running. In `public` mode, there is no need for the game client to be running.

One important requirement is that a Steam account and password must be provided. The refresh token will be cached, so you won’t need to provide credentials continuously. You can clear the refresh token at any time using the "Clear secrets" command.

**Note**: This agent may log you out of Grey Hack since the game only allows one active session at a time.

#### Message Hook

The message-hook agent allows you to send messages to the game server through the game client. To use this feature, you need to first install [BepInEx](https://github.com/BepInEx/BepInEx) and then the plugin. Below, you can find installation instructions for both versions of BepInEx.

##### BepInEx 5.x.x
1. **Download BepInEx 5.x.x**: [BepInEx v5.4.23.2](https://github.com/BepInEx/BepInEx/releases/tag/v5.4.23.2)
    - Install by extracting BepInEx files into your Grey Hack game folder (location of the game executable). See the [Installation Guide](https://docs.bepinex.dev/articles/user_guide/installation/index.html) if needed.
2. **Add the Plugin**: Download [GreyHackMessageHook5.dll](https://gist.github.com/ayecue/b45998fa9a8869e4bbfff0f448ac98f9/raw/af926c972880e331ec0c9d7f0cce1bea055c02bc/GreyHackMessageHook5.dll) and move it to the plugins folder in BepInEx.
3. **Configure Launch Options (macOS/Linux Only)**:
    - Go to Steam Library > Grey Hack > Properties > Launch Options.
      - **macOS**: `"/path/to/Steam/steamapps/common/Grey Hack/run_bepinex.sh" %command%`
      - **Linux**: `"/path/to/.steam/steam/steamapps/common/Grey Hack/run_bepinex.sh" || %command%`
4. **Launch Grey Hack** via Steam to load BepInEx 5 with the plugin.

##### BepInEx 6.x.x
1. **Download BepInEx 6.x.x**: [BepInEx version 6.0.0-pre.1 UnityMono](https://github.com/BepInEx/BepInEx/releases/tag/v6.0.0-pre.1)
    - Install by extracting BepInEx files into your Grey Hack game folder (location of the game executable). See the [Installation Guide](https://docs.bepinex.dev/master/articles/user_guide/installation/unity_mono.html) if needed.
2. **Add the Plugin**: Download [GreyHackMessageHook.dll](https://gist.github.com/ayecue/b45998fa9a8869e4bbfff0f448ac98f9/raw/af926c972880e331ec0c9d7f0cce1bea055c02bc/GreyHackMessageHook.dll) and move it to the plugins folder in BepInEx.
3. **Configure Launch Options (macOS/Linux Only)**:
    - Go to Steam Library > Grey Hack > Properties > Launch Options.
      - **macOS**: `"/path/to/Steam/steamapps/common/Grey Hack/run_bepinex.sh" %command%`
      - **Linux**: `"/path/to/.steam/steam/steamapps/common/Grey Hack/run_bepinex.sh" || %command%`
4. **Launch Grey Hack** via Steam to load BepInEx 6 with the plugin.

With all that done you can now start the game and start either a single-player or multiplayer session. You'll be now able to sync files with the game without getting disconnected.

Also, keep in mind that if you use BepInEx 6.x.x you'll use bleeding edge meaning that it won't be as stable as BepInEx 5.x.x leading to potential crashes. If you suffer too many crashes with 6.x.x may try out version 5.x.x!

Additionally, you won't need to provide any Steam credentials nor do you need to select a mode.

**Note**: For this agent to work you **have to have Grey Hack running**.

## Dependency Management (Transpiler)

Greybel allows you to split your code into multiple files, improving readability and making code reusable.

For small or medium-sized projects, it’s recommended to use [include](#include) and [import](#import). For larger projects, use [import_code](#import_code) to avoid exceeding the **160,000** character limit in GreyHack, as the transpiler bundles your files efficiently.

Greybel also detects cyclic dependencies, throwing an error with the problematic file.

For a detailed guide, refer to [this page](https://main.greyscript.org/manuals/useful-tools-for-greyscript.html#manage-your-dependencies).

### Import

Imports exported namespaces from another file with these features:
- Supports relative imports
- Loads code only when required
- Doesn’t pollute the global scope
- Only imported once, no matter how many times referenced
- Exports only what is needed
- Appends code to the root file (may exceed GreyHack’s character limit; use [import_code](#import_code) if this is an issue)

For an example, check out the [sample code](/example/import).

### Include

Imports the content of a file with these features:
- Supports relative includes
- Easy to use
- Pollutes the global scope
- Includes the file content every time, which may cause redundancy
- Could exceed the character limit in GreyHack; use [import_code](#import_code) instead

For an example, check out the [sample code](/example/include).

### import_code

Imports code from a file with these features:
- Keeps files separate in-game, preventing the character limit issue
- Supports nested `import_code`
- Supports relative imports

For an example, check out the [sample code](/example/import-code).

When using the `--installer` flag, Greybel creates installer files for your project. These files bundle all your code and logic for easy pasting into the game. After that, you can compile and execute them. The `--auto-compile` flag adds automatic compilation and source file removal.

You can also specify an in-game directory using the `--ingame-directory` CLI parameter, with `/root/` as the default.

**Note**: Nested `import_code` is supported. It’s recommended to place `import_code` at the top of files, as the import order of nested files is not guaranteed.

## Environment Variables (Transpiler)

Greybel supports the injection of environment variables while transpiling. There are two ways of environment variables.

1. Use the `--env-files` CLI parameter to [define environment variables configuration files](/example/environment-variables/env.conf).
2. Use the `--env-vars TEST="hello world"` CLI parameter to define variables on the fly.

Here is an [example](/example/environment-variables) of environment variable injection.

## Syntax

Any valid MiniScript or GreyScript syntax is supported. Additionally, some minor syntax sugar is added to those languages. If you use those keep in mind to transpile your code first. Using these is completely optional though.

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

### Filename expression
```
print(#filename)
```
The filename expression will be replaced with the string literal containing the name of the file before transpiling. Can be useful for debugging.

### Line expression
```
print(#line)
```
The line expression will be replaced with the number literal containing the line of the expression before transpiling. Can be useful for debugging.

### Envar expression
```
print(#envar MY_TEST_VAR)
```
The envar expression will be replaced with the value of the provided environment variable. Make sure you defined an environment variable for the provided namespace if there is no value found it will instead use `null`.

### Inject expression
```
print(#inject "path/to/file";)
```
The inject expression will be replaced with the content of whatever file exists at the provided path. In case the file does not exist it will be replaced with `null`. Content that gets injected will automatically be escaped.

# Interpreter
```
Interpreter CLI
Example: greybel execute <myscriptfile>

Arguments:
	myscriptfile			File to execute

Options:
  -si, --silence              Silences any uncessary noise.
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
Example: greybel repl
```

For Windows, you can use something like PowerShell or [ConEmu](https://conemu.github.io/). Or just use the UI. GitBash is not recommended any more due to a [TTY issue with node](https://github.com/ayecue/greybel-js/issues/34).

REPL also features a [local environment](#local-environment) and [GreyScript API support](#greyscript-api-support)

# Web-UI
```
Web UI CLI
Example: greybel ui
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