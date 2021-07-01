Random = {}

Random.pool = {}
Random.defaultSeed = "random"

Random.createPool = function(seed, val)
	return { "seed": seed, "value": val, "generation": 0 }
end function

Random.calcSeed = function(seed)
	seedVal = 0
	pos = seed.len
	
	for char in seed
		seedVal = seedVal + char.code + pos
		pos = pos - 1
	end for
	
	return seedVal
end function

Random.gen = function(min, max, seed, inc)
	me = self
	pool = me.pool
	if (inc == null) then inc = true
	if (seed == null) then seed = me.defaultSeed
	if (pool.hasIndex(seed)) then
		ps = pool[seed]
		if (not inc) then return ps.value
		ps.generation = ps.generation + 1
		val = floor((rnd(ps.value + ps.generation) * (max - min)) + min)
		ps.value = val
		return val
	end if
	
	seedVal = me.calcSeed(seed)
	
	val = floor((rnd(seedVal) * (max - min)) + min)
	pool[seed] = me.createPool(seedVal, val)
	
	return val
end function

Random.seq = function(min, max, seed, amount, keepPool)
	me = self
	index = 0
	result = []
	while index < amount
		temp = me.gen(min, max, seed)
		result.push(temp )
		index = index + 1
	end while
	if (keepPool != true) then me.pool.remove(seed)
	return result
end function

Random.get = function(min, max)
	return self.gen(min, max)
end function

print(Random.get(100,500))
print(Random.seq(100,500, "test", 10))