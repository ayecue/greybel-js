AsciiGen = {}

map = {}

map.a = ["||¯|| ", "||_|| ", "|| || "]
map.b = ["||¯/ ", "|| \ ", "||_/ "]
map.c = ["||¯ ", "||  ", "||_ "]
map.d = ["||¯\\ ", "|| // ", "||//  "]
map.e = ["||¯ ", "||- ", "||_ "]
map.f = ["||¯ ", "||_ ", "||  "]
map.g = ["||¯¯  ", "|| \\ ", "||_|| "]
map.h = ["|| || ", "||-|| ", "|| || "]
map.i = ["|| ", "|| ", "|| "]
map.j = [" ¯||¯ ", "  ||  ", "|_||  "]
map.k = ["||  / ", "|| /  ", "||¯\\ "]
map.l = ["||  ", "||  ", "||_ "]
map.m = ["||\\/|| ", "||   || ", "||   || "]
map.n = ["||\\ || ", "|| \\|| ", "||  \|| "]
map.o = ["||¯|| ", "|| || ", "||_|| "]
map.p = ["||¯|| ", "||_|| ", "||    "]
map.q = ["||¯||  ", "|| ||  ", "||_||¬ "]
map.r = ["||¯|| ", "||¯\\ ", "|| || "]
map.s = ["||¯¯ ", " \\  ", "__|| "]
map.t = ["¯||¯ ", " ||  ", " ||  "]
map.u = ["|| || ", "|| || ", "||_|| "]
map.v = ["\\ || ", " \\|| ", "  \\| "]
map.w = ["\\ |\\ | ", " \\| \\| ", "  \\  \\ "]
map.x = ["\\  / ", " \\/  ", " //\  "]
map.y = ["\\  // ", " \\//  ", "  ||   "]
map.z = ["¯// ", "//  ", "||_ "]
map["0"] = ["||¯|| ", "||x|| ", "||_|| "]
map["1"] = ["'|| ", " || ", " || "]
map["2"] = ["¯¯|| ", "||¯  ", "||_  "]
map["3"] = ["¯|| ", "-|| ", "_|| "]
map["4"] = [" /|| ", "/_|| ", "  || "]
map["5"] = ["||¯¯ ", " ¯|| ", " _|| "]
map["6"] = ["||¯¯  ", "||¯|| ", "||_|| "]
map["7"] = ["¯¯// ", " //  ", "//   "]
map["8"] = ["||¯|| ", "||-|| ", "||_|| "]
map["9"] = ["||¯|| ", "  ¯|| ", "  //  "]
map[" "] = ["  ", "  ", "  "]

AsciiGen.MAP = map

AsciiGen.gen = function(str, colors)	
	r = [[], [], []]
	signs = self.MAP
	
	for char in str
		char = char.lower
		if (signs.hasIndex(char)) then
			r[0].push(signs[char][0])
			r[1].push(signs[char][1])
			r[2].push(signs[char][2])
		end if
	end for

	if (typeof(colors) == "string") then
		r[0] = ["<color=#" + colors + ">"] + r[0] + ["</color>"]
		r[1] = ["<color=#" + colors + ">"] + r[1] + ["</color>"]
		r[2] = ["<color=#" + colors + ">"] + r[2] + ["</color>"]
	else if (typeof(colors) == "list") then
		r[0] = ["<color=#" + colors[0] + ">"] + r[0] + ["</color>"]
		r[1] = ["<color=#" + colors[1] + ">"] + r[1] + ["</color>"]
		r[2] = ["<color=#" + colors[2] + ">"] + r[2] + ["</color>"]
	end if

	return [r[0].join(""), r[1].join(""), r[2].join("")].join("\n")
end function

print(AsciiGen.gen("Hallo"))