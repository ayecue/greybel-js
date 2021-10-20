const interpreter = require('../src/interpreter');
const fs = require('fs');
const path = require('path');
const polyfills = require('../src/emulator/default/polyfills');
const md5 = require('../src/utils/md5');
const rnd = require('../src/utils/rng-provider')();
const testFolder = path.resolve(__dirname, 'scripts');

let echoMock;
const pseudoShell = {
	vm: {
		getTime: () => 0
	},
	tools: {
		md5: md5,
		rnd: rnd
	},
	echo: echoMock,
	prompt: (str) => 'test'
};
const mockAPI = {
	...polyfills(pseudoShell)
};

describe('interpreter', function() {
	beforeEach(function() {
		pseudoShell.echo = echoMock = jest.fn();
	});

	test('simple object script', async function() {
		const filepath = path.resolve(testFolder, 'simple-object.src');
		const code = fs.readFileSync(filepath, {
			encoding: 'utf-8'
		});
		let success;

		try {
			await interpreter({
				code: code,
				params: [],
				api: mockAPI
			});
			success = true;
		} catch (e) {
			console.log(`${filepath} failed with: `, e);
			success = false;
		}

		expect(success).toEqual(true);
		expect(echoMock).toBeCalledWith('was');
	});

	test('ascii script', async function() {
		const filepath = path.resolve(testFolder, 'ascii.src');
		const code = fs.readFileSync(filepath, {
			encoding: 'utf-8'
		});
		let success;

		try {
			await interpreter({
				code: code,
				params: [],
				api: mockAPI
			});
			success = true;
		} catch (e) {
			console.log(`${filepath} failed with: `, e);
			success = false;
		}

		expect(success).toEqual(true);
		expect(echoMock).toBeCalledWith('|| || ||¯|| ||  ||  ||¯|| \\n||-|| ||_|| ||  ||  || || \\n|| || || || ||_ ||_ ||_|| ');
	});

	test('password generator script', async function() {
		const filepath = path.resolve(testFolder, 'password-generator.src');
		const code = fs.readFileSync(filepath, {
			encoding: 'utf-8'
		});
		let success;

		try {
			await interpreter({
				code: code,
				params: [],
				api: mockAPI
			});
			success = true;
		} catch (e) {
			console.log(`${filepath} failed with: `, e);
			success = false;
		}

		expect(success).toEqual(true);
		expect(echoMock).toBeCalledWith('[q,w,e,r,t,z,u,i,o,p]');
	});

	test('pseudo crypto script', async function() {
		const filepath = path.resolve(testFolder, 'pseudo-crypto.src');
		const code = fs.readFileSync(filepath, {
			encoding: 'utf-8'
		});
		let success;

		try {
			await interpreter({
				code: code,
				params: [],
				api: mockAPI
			});
			success = true;
		} catch (e) {
			console.log(`${filepath} failed with: `, e);
			success = false;
		}

		expect(success).toEqual(true);
		expect(echoMock).toHaveBeenNthCalledWith(1, 'aMAYdPa=');
		expect(echoMock).toHaveBeenNthCalledWith(2, 'abcde');
	});

	test('random script', async function() {
		const filepath = path.resolve(testFolder, 'random.src');
		const code = fs.readFileSync(filepath, {
			encoding: 'utf-8'
		});
		let success;

		try {
			await interpreter({
				code: code,
				params: [],
				api: mockAPI
			});
			success = true;
		} catch (e) {
			console.log(`${filepath} failed with: `, e);
			success = false;
		}

		expect(success).toEqual(true);
		expect(echoMock).toHaveBeenNthCalledWith(1, '222');
		expect(echoMock).toHaveBeenNthCalledWith(2, '[481,286,146,221,280,411,472,272,403,204]');
	});

	test('negation script', async function() {
		const filepath = path.resolve(testFolder, 'negation.src');
		const code = fs.readFileSync(filepath, {
			encoding: 'utf-8'
		});
		let success;

		try {
			await interpreter({
				code: code,
				params: [],
				api: mockAPI
			});
			success = true;
		} catch (e) {
			console.log(`${filepath} failed with: `, e);
			success = false;
		}

		expect(success).toEqual(true);
		expect(echoMock).toHaveBeenNthCalledWith(1, '2');
		expect(echoMock).toHaveBeenNthCalledWith(2, '[-1,2,0]');
	});

	test('slice script', async function() {
		const filepath = path.resolve(testFolder, 'slice.src');
		const code = fs.readFileSync(filepath, {
			encoding: 'utf-8'
		});
		let success;

		try {
			await interpreter({
				code: code,
				params: [],
				api: mockAPI
			});
			success = true;
		} catch (e) {
			console.log(`${filepath} failed with: `, e);
			success = false;
		}

		expect(success).toEqual(true);
		expect(echoMock).toHaveBeenNthCalledWith(1, '[blahh,blahh,blahh,blahh,blahh,blahh,gad]');
	});
});