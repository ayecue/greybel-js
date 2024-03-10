/**
 * 
 * @param rootDirectory 
 * @param rootFilePath 
 * @param importPaths 
 * @param autoCompilePurge This parameter should be set to true if all of the imported folders should be deleted after the auto-compilation process is completed, otherwise it should be set to false.
 * @returns 
 */
export const generateAutoCompileCode = (
  rootDirectory: string,
  rootFilePath: string,
  importPaths: string[],
  autoCompilePurge : boolean
): string => {
  return `
      rootDirectory = "${rootDirectory.trim().replace(/\/$/, '')}"
      rootFilePath = "${rootFilePath}"
      filePaths = [${importPaths.map((it) => `"${it}"`).join(',')}]
      myShell = get_shell
      myComputer = host_computer(myShell)
      deleteAllImportedFoldersAfterAutoCompilation = ${autoCompilePurge}

      result = build(myShell, rootDirectory + rootFilePath, rootDirectory)
      if result != "" then exit("Error when building!")
      print("Build done in " + rootDirectory)

      remainingFolderMap = {}

      for filePath in filePaths
        absPath = rootDirectory + filePath
        entity = File(myComputer, absPath)

        if not entity then
          print("Couldn't find " + absPath)
          continue
        end if

        parentFolder = parent(entity)
        remainingFolderMap[path(parentFolder)] = 1

        delete(entity)
        print("Deleted " + entity.path)
      end for

      remainingFolderPaths = indexes(remainingFolderMap)
      currentFolderPath = pop(remainingFolderPaths)

      while currentFolderPath != null
        if rootDirectory.indexOf(currentFolderPath) == 0 then
          currentFolderPath = pop(remainingFolderPaths)
          continue
        end if

        folder = File(myComputer, currentFolderPath)

        if folder and ((folder.get_files.len == 0 and folder.get_folders.len == 0) or deleteAllImportedFoldersAfterAutoCompilation == true) then
          push(remainingFolderPaths, path(parent(folder)))
          delete(folder)
          print("Deleted " + folder.path)
        end if

        currentFolderPath = pop(remainingFolderPaths)
      end while
    `
    .split('\n')
    .map((it) => it.trim())
    .filter((it) => it !== '')
    .join(';');
};
