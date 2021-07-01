PasswordGenerator = {}

PasswordGenerator.MAX_PASSWORD_LENGTH = 15
PasswordGenerator.ALPHABETIC_CHARACTERS = "qwertzuiopasdfghjklyxcvbnm"
PasswordGenerator.NUMBER_CHARACTERS = "0123456789"
PasswordGenerator.ALPHA_NUMERIC = PasswordGenerator.ALPHABETIC_CHARACTERS + PasswordGenerator.ALPHABETIC_CHARACTERS.upper + PasswordGenerator.NUMBER_CHARACTERS

PasswordGenerator.constructor = function()
	me = self
	me.buffer = [0]
	me.characters = me.ALPHA_NUMERIC
	return me
end function

PasswordGenerator.increaseBuffer = function(i)
	me = self
	currentCharBuffer = me.buffer
	maxBufferSize = me.characters.len
	if (i == null) then i = currentCharBuffer.len - 1
	p = currentCharBuffer[i]
	p = p + 1
	currentCharBuffer[i] = p
	if (p == maxBufferSize) then
		currentCharBuffer[i] = 0
		if (i == 0) then
			currentCharBuffer.push(0)
		else
			me.increaseBuffer(i - 1)
		end if
	end if
end function

PasswordGenerator.gen = function()
	me = self
	currentCharBuffer = me.buffer
	generatorCharacters = me.characters
	password = ""
	index = 0
	
	while index < currentCharBuffer.len
		pointer = currentCharBuffer[index]
		password = password + generatorCharacters[pointer]
		if (index == currentCharBuffer.len - 1) then self.increaseBuffer()
		index = index + 1
	end while

	if (currentCharBuffer.len > me.MAX_PASSWORD_LENGTH) then
		return null
	end if
	
	return password
end function

pgen = (new PasswordGenerator).constructor()

index = 0
max = 10
result = []

while (index < max)
	result.push(pgen.gen())
	index = index + 1
end while

print(result)