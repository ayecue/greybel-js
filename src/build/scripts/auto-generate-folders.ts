export const generateAutoGenerateFoldersCode = (
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

      if BUILD_AUTO_COMPILE then
        rootDirectory = BUILD_RESOURCE_DESTINATION
      else
        rootDirectory = BUILD_DESTINATION
      end if

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
            existingEntity = File(myComputer, folder)
            if existingEntity != null then
              if is_folder(existingEntity) then
                idx = idx - 1
                continue
              end if
              exit("EXIT_CODE=1;EXIT_MESSAGE=Cannot create folder " + folder + " because a file with the same name already exists!;")
            end if
            result = create_folder(myComputer, parentPath, basename)
            if result != 1 then
              exit("EXIT_CODE=1;EXIT_MESSAGE=Error when creating folder for " + folder + "! Reason: " + result + ";")
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
