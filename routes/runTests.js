const {grabProblem, insertSubmission, grabStatus, grabTests, updateTestSol} = require("./displayProblem");
const execSync = require('child_process').execSync;
const fs = require('fs');


let tasks = [], tasksS = [];
let running = false;
function queue(pid, sid) {
	tasks.push(pid);
	tasksS.push(sid);
	console.log(pid, sid);
	if (!running) {
		run();
		running = true;
	}
}
async function compileTests(pid){
	let problem= await grabProblem(pid);
	console.log(problem);
	let solution = problem.sol;
	let lang = problem.lang;
	await grabTests(pid).then((tests)=>{
		console.log("tests", tests);
		for(let i = 0; i<tests.length; i++){
			if (lang== 'cpp') {
				fs.writeFileSync('test.cpp', solution);
				//write to correct file for code
				//output = execSync('test.in<sudo ./nsjail/nsjail --config nsjail/configs/executable.cfg', { encoding: 'utf-8' });  //pipe input into this
			}
			else if (lang== 'python') {
				console.log(solution);
				console.log("running python");
				fs.writeFileSync('routes/subcode/hello.py', solution);
				try {
					//output = await execSync('sudo ./nsjail/nsjail --config nsjail/configs/python.cfg > test.in', { encoding: 'utf-8' });
					//JOHNNY I CHNGED UR CODE CUZ IT WOULDNT COMPILE SRY
					output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/python.cfg < test.in', { encoding: 'utf-8' });
				}
				catch (error) {
					console.log("ERROR", error);
				}
				console.log("output was", output);
				updateTestSol(tests[i].id, output);
			}
			else if (lang== 'java') {
				fs.writeFileSync('test.java', solution);
				output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/java.cfg', { encoding: 'utf-8' });  
			}
			//fs.writeFileSync('test.cpp', solCode);
			//addSol(i.id, ans);
		}
	});
}
async function run() {
	if (tasks.length == 0) {
		running = false;
		return;
	}
	let task = tasks.shift();
	let sub = tasksS.shift();
	console.log(task, sub);
	let res = await grabProblem(task);
	let tests = await grabTests(task);
	let tl = res.tl;
	let ml = res.ml;
	console.log(tests);
	console.log(res);
	res = await grabStatus(sub);
	console.log("result", res);
	let userCode = res.code;

	let language = res.language;

	let output = undefined, fverdict = undefined, runtime = 420, memory = 100;

	for(let i = 0; i<tests.length; i++){
		let verdict = undefined;

		if (language == 'cpp') {
			fs.writeFileSync('test.cpp', userCode);
			//write to correct file for code
			output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/executable.cfg', { encoding: 'utf-8' });  //pipe input into this
		}
		else if (language == 'python') {
			console.log("running python");
			fs.writeFileSync('routes/subcode/hello.py', userCode);
			try {
				//output = await execSync('sudo ./nsjail/nsjail --config nsjail/configs/python.cfg > test.in', { encoding: 'utf-8' });
				//JOHNNY I CHNGED UR CODE CUZ IT WOULDNT COMPILE SRY
				output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/python.cfg > test.in', { encoding: 'utf-8' });
			}
			catch (error) {
				console.log("ERROR", error);
			}

			console.log("output was", output);
			if (output == undefined) {
				fverdict = "ER";
			}
			else if (output.includes("dan")) {
				console.log("inclies");
				fverdict = "AC";
			}
			else if (poutput == "dan") {
				fverdict = "AC";
				console.log("here", fverdict);
			}
			else {
				fverdict = "WA";
			}
		}
		else if (language == 'java') {
			fs.writeFileSync('test.java', userCode);
			output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/java.cfg', { encoding: 'utf-8' });  
		}
		//  verdict = execSync('sudo ./nsjail/nsjail --config nsjail/configs/checker.cfg', { encoding: 'utf-8' }); //pipe output into this 
	}
	console.log("after run", fverdict);
	insertSubmission(sub, fverdict, runtime, memory);

	//checker = undefined;
	userCode = undefined;
	//input = undefined;
	run();
}

module.exports = {
	queue: (pid, sid) => {
		return queue(pid, sid);
	},
	compileTests: (pid) => {
		return compileTests(pid);
	}
}
