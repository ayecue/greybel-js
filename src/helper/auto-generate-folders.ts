export const generateAutoGenerateFoldersCode = (
  rootDirectory: string,
  importPaths: string[]
): string => {
  return `
      getParentFolders = function(path)
        folders = []
        currentPath = parent_path(path)

        while (currentPath != "/")
          push(folders, currentPath)
          currentPath = parent_path(currentPath)
        end while

        return folders
      end function

      rootDirectory = "${rootDirectory.trim().replace(/\/$/, '')}"
      filePaths = [${importPaths.map((it) => `"${it}"`).join(',')}]
      myShell = get_shell
      myComputer = host_computer(myShell)
      visited = {}

      for filePath in filePaths
        absPath = rootDirectory + filePath
        folders = getParentFolders(absPath)
        idx = len(folders) - 1

        while idx >= 0
          folder = folders[idx]
          if not hasIndex(visited, folder) then
            visited[folder] = 1
            parentPath = replace_regex(parent_path(folder), "/$", "") + "/"
            basename = split(folder, "/")[-1]
            result = create_folder(myComputer, parentPath, basename)
            if result != 1 then
              print("Error when creating folder for " + folder + "! Reason: " + result)
            end if
          end if
          idx = idx - 1
        end while
      end for
    `
    .split('\n')
    .map((it) => it.trim())
    .filter((it) => it !== '')
    .join(';');
};
