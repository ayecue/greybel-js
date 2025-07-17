import { randomString } from './random-string.js';

const SHORTEST_NAME = 'dddd' as const;

export interface GenerateAutoCompileCodeOptions {
  rootDirectory: string;
  rootFilePaths: string[];
  importPaths: string[];
  purge: boolean;
  allowImport: boolean;
}

export const generateAutoCompileCode = ({
  rootDirectory,
  rootFilePaths,
  importPaths,
  purge,
  allowImport
}: GenerateAutoCompileCodeOptions): string => {
  return `
      tryGetFile = function(pc, path, maxTries = 100)
        handle = File(pc, path)
        tries = 0

        while (handle == null)
          if (tries > maxTries) then
            break
          end if

          handle = File(pc, path)
          tries = tries + 1
          print("Failed to get file """ + path + """. (" + tries + "/" + maxTries + " tries)")
          wait(0.1)
        end while

        return handle
      end function

      rootDirectory = "${rootDirectory.trim().replace(/\/$/, '')}"
      rootFilePaths = [${rootFilePaths.map((it) => `"${it}"`).join(',')}]
      filePaths = [${importPaths.map((it) => `"${it}"`).join(',')}]
      tmpDirectory = "${randomString(5)}"
      myShell = get_shell
      myComputer = host_computer(myShell)
      purge = ${+purge}

      for rootFilePath in rootFilePaths
        srcFile = tryGetFile(myComputer, rootDirectory + rootFilePath)
        if srcFile == null then exit("Couldn't find source file in " + rootDirectory + rootFilePath)

        fileName = name(srcFile)
        binaryName = replace_regex(fileName, "\\.[^.]+$", "")
        destination = parent_path(path(srcFile))

        result = create_folder(myComputer, destination, tmpDirectory)
        if result != 1 then exit("Error when creating temporary build folder! Reason: " + result)

        tmpFolder = tryGetFile(myComputer, destination + "/" + tmpDirectory)
        if tmpFolder == null then exit("Couldn't find temporary build folder in " + destination + "/" + tmpDirectory)

        result = copy(srcFile, tmpFolder.path, "${SHORTEST_NAME}.src")
        if result != 1 then exit("Error when moving source file into temporary build folder! Reason: " + result)

        tmpFile = tryGetFile(myComputer, tmpFolder.path + "/${SHORTEST_NAME}.src")
        if (tmpFile == null) then exit("Cannot find temporary file!")

        result = build(myShell, tmpFolder.path + "/${SHORTEST_NAME}.src", tmpFolder.path, ${
    allowImport ? 1 : 0
  })
        if result != "" then exit("Error when building! Reason: " + result)

        binaryFile = tryGetFile(myComputer, tmpFolder.path + "/${SHORTEST_NAME}")
        if binaryFile == null then exit("Couldn't find binary file in " + tmpFolder.path + "/${SHORTEST_NAME}")

        result = move(binaryFile, destination, binaryName)
        if result != 1 then exit("Error when moving binary file into destination folder! Reason: " + result)
        delete(tmpFolder)
      end for

      remainingFolderMap = {}

      for filePath in filePaths
        absPath = rootDirectory + filePath
        entity = tryGetFile(myComputer, absPath)

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
        if indexOf(rootDirectory, currentFolderPath) == 0 then
          currentFolderPath = pop(remainingFolderPaths)
          continue
        end if

        folder = tryGetFile(myComputer, currentFolderPath)
        if folder and ((len(get_files(folder)) == 0 and len(get_folders(folder)) == 0) or purge) then
          push(remainingFolderPaths, path(parent(folder)))
          delete(folder)
          print("Deleted " + folder.path)
        end if

        currentFolderPath = pop(remainingFolderPaths)
      end while

      print("Build done in " + destination)
    `
    .split('\n')
    .map((it) => it.trim())
    .filter((it) => it !== '')
    .join(';');
};
