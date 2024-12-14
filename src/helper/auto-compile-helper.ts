export interface GenerateAutoCompileCodeOptions {
  rootDirectory: string;
  rootFilePath: string;
  importPaths: string[];
  purge: boolean;
  binaryName: string | null;
  allowImport: boolean;
}

export const generateAutoCompileCode = ({
  rootDirectory,
  rootFilePath,
  importPaths,
  purge,
  binaryName,
  allowImport
}: GenerateAutoCompileCodeOptions): string => {
  return `
      rootDirectory = "${rootDirectory.trim().replace(/\/$/, '')}"
      rootFilePath = "${rootFilePath}"
      filePaths = [${importPaths.map((it) => `"${it}"`).join(',')}]
      binaryName = ${binaryName !== null ? `"${binaryName}"` : 'null'};
      myShell = get_shell
      myComputer = host_computer(myShell)
      purge = ${+purge}

      result = build(myShell, rootDirectory + rootFilePath, rootDirectory, ${allowImport ? 1 : 0})
      if result != "" then exit("Error when building! Reason: " + result)
      binary = File(myComputer, (rootDirectory + rootFilePath).replace("\\.[^.]*?$", ""))
      print("Build done. Output file: " + binary.path)

      if binaryName then
        if (binaryName != binary.name) then
          preExistingFile = File(myComputer, binary.path.replace("[^/]*?$", "") + binaryName)

          if preExistingFile then
            result = delete(preExistingFile)
            if result != "" then print("Deletion of pre-existing file failed! Reason: " + result) else print("Delete pre-existing " + binaryName + " done!")
          end if

          result = rename(binary, binaryName)
          if result != "" then print("Renaming failed! Reason: " + result) else print("Renaming to " + binaryName + " done!")
        else
          print("Skipping rename to " + binaryName)
        end if
      end if

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

        if folder and ((folder.get_files.len == 0 and folder.get_folders.len == 0) or purge) then
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
