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