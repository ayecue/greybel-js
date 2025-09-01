export const generateContentHeader = (): string => {
  return `s = get_shell
      c = s.host_computer
      m = function(filePath, content, isNew)
      	segments = filePath.split("/")[1 : ]
      	fileName = segments.pop
      	for segment in segments
      		parentPath = "/" + segments[ : __segment_idx].join("/")
      		folderName = segment
      		if parentPath == "/" then
      			folderPath = "/" + folderName
      		else
      			folderPath = parentPath + "/" + folderName
      		end if
      		folderHandle = c.File(folderPath)
      		if folderHandle == null then
      			result = c.create_folder(parentPath, folderName) == 1
      			if result != 1 then exit("Could not create folder in """ + folderPath + """ due to: " + result)
      			print("New folder """ + folderPath + """ got created.")
      			folderHandle = c.File(folderPath)
      		end if
      		if not folderHandle.is_folder then exit("Entity at """ + folderPath + """ is not a folder. Installation got aborted.")
      	end for
      	parentPath = "/" + segments.join("/")
      	fileEntity = c.File(filePath)
      	if fileEntity == null then
      		result = c.touch(parentPath, fileName)
      		if result != 1 then exit("Could not create file in """ + filePath + """ due to: " + result)
      		fileEntity = c.File(filePath)
      	end if
      	if fileEntity == null then exit("Unable to get file at """ + filePath + """. Installation got aborted.")
      	if fileEntity.is_folder then exit("File at """ + filePath + """ is a folder but should be a source file. Installation got aborted.")
      	if fileEntity.is_binary then exit("File at """ + filePath + """ is a binary but should be a source file. Installation got aborted.")
      	if isNew then
      		fileEntity.set_content(content)
      		print("New file """ + filePath + """ got created.")
      	else
      		fileEntity.set_content(fileEntity.get_content + content)
      		print("Content got appended to """ + filePath + """.")
      	end if
      end function
      d = function
      	c.File(program_path).delete
      end function
    `
    .split('\n')
    .map((it) => it.trim())
    .filter((it) => it !== '')
    .join(';');
};
