const { Pool } = require('pg');

const pl = new Pool({
	user: "postgres",
	password: process.env.PGPASSWORD,
	port: 5432,
	database: "autograder",
	max: 20,
	idleTimeoutMillis: 0,
	connectionTimeoutMillis: 10000,
	allowExitOnIdle: true
});

async function testSql() {
	pl.connect((err, client, release) => {
		if (err) {
			console.log("Error getting client");
			return;
		}
		let qry = "SELECT * FROM submissions WHERE id>270;";
		client.query(qry, (err, result) => {
			release();
			if (err) {
				console.log("an error occured while querying");
				return false;
			}
			console.log(result.rows);
		});
	});
}
async function checkAdmin(id){
	/*
	return new Promise((res, rej)=>{
		pl.connect((err, client, release)=>{
			if(err){
				console.log("Error checking admin", err);
				res(false);
			}
			let qry = "SELECT * FROM users WHERE id=$1 AND admin=false";
			client.query(qry, [id], (err, results)=>{
				release();
				if(err){
					console.log("error while query");
					res(false);
				}
				if(results.rows.length==0){
					console.log("OOPS");
					res(false);
				}else{
					res(true);
				}
			});
		});
	});
	*/
	return true;
}
async function grab(id) {
	return new Promise((resolve, reject) => {
		pl.connect((err, client, release) => {
			if (err) {
				console.log("Error getting client");
				resolve(false);
			}
			let qry = "SELECT * FROM problems WHERE pid = $1";
			client.query(qry, [id], (err, results) => {
				release();
				if (err) {
					console.log("an error occured while querying");
					resolve(false);
				}
				if (results.rows.length == 0) {
					resolve(false);
				}
				else {
					let ret = {
						id: id,
						title: results.rows[0].name,
						statement: results.rows[0].statement,
						secret: results.rows[0].secret,
						tl: results.rows[0].tl,
						ml: results.rows[0].ml,
						contestid: results.rows[0].contestid,
						checkerid: results.rows[0].checkerid
					}
					resolve(ret);
				}
			});
		});
	});
}
async function grabChecker(id) {
	return new Promise((resolve, reject) => {
		pl.connect((err, client, release) => {
			if (err) {
				console.log("Error getting client");
				resolve(false);
			}
			let qry = "SELECT * FROM checker WHERE id= $1";
			client.query(qry, [id], (err, results) => {
				release();
				if (err) {
					console.log("an error occured while querying for checker");
					resolve(false);
				}
				if (results.rows.length == 0) {
					resolve(false);
				}
				else {
					let ret = {
						id: id,
						code: results.rows[0].code,
						lang: results.rows[0].lang
					}
					resolve(ret);
				}
			});
		});
	});
}
async function grabAllProblems(isAdmin, cid) {
        return new Promise((resolve, reject) => {
                pl.connect((err, client, release) => {
                        if (err) {
                                console.log("Error getting client");
                                resolve(false);
                        }
                        let qry = "SELECT * FROM problems WHERE (problems.secret IS NULL OR problems.secret = false OR problems.secret = $1)";
                        let params = [];
			if (cid != undefined) {
				qry  = "SELECT * FROM problems WHERE problems.contestid = $1 AND (problems.secret IS NULL OR problems.secret = false OR problems.secret = $2)";
				params = [cid]
			}
			if(isAdmin){
				params.push(true)
			}else{
				params.push(null)
			}
			client.query(qry, params, (err, results) => {
                                release();
                                if (err) {
                                        console.log("an error occured while querying for problems");
                                        resolve(false);
                                }
                                if (results.rows.length == 0) {
                                        resolve(false);
                                }
                                else {
                                        resolve(results.rows);
                                }
                        });
                });
        });
}
async function grabSubs(user, contest) {
	return new Promise((resolve, reject) => {
		pl.connect((err, client, release) => {
			if (err) {
				console.log("Error getting client");
				resolve(false);
			}
			if(isNaN(contest)){
				contest = undefined;
			}
			if(isNaN(user)){
				user = undefined;
			}
			let qry = undefined;
			let params = [];
			if (contest == undefined && user == undefined) {
				qry = "SELECT * FROM submissions ORDER BY id ASC;";
			}
			else if (contest == undefined) {
				qry = "SELECT * FROM submissions WHERE submissions.usr = $1 ORDER BY id ASC;";
				params.push(user);
			}
			else if (user == undefined) {
				qry = "SELECT * FROM submissions WHERE submissions.contest = $1 ORDER BY id ASC;";
				params.push(contest);
			}
			else {
				qry = "SELECT * FROM submissions WHERE submissions.usr = $1 AND submissions.contest = $2 ORDER BY id ASC;";
				params.push(user);
				params.push(contest);
			}
			client.query(qry, params, (err, results) => {
				release();
				if (err) {
					console.log("an error occured while querying for submissions", err);
					resolve([]);
				}else if (results.rows.length == 0) {
					resolve([]);
				}
				else {
					retarr = [];
					for (let i=0; i<results.rows.length; i++) {
						let ret = {
							user: results.rows[i].usr,
							id: results.rows[i].id,
							verdict: results.rows[i].verdict,
							runtime: results.rows[i].runtime,
							problemname: results.rows[i].problemname,
							problemid: results.rows[i].problemid,
							timestamp: results.rows[i].timestamp,
							language: results.rows[i].language,
							contest: results.rows[i].contest
						}
						retarr.push(ret);
					}
					resolve(retarr);
				}
			});
		});
	});
}
async function grabStatus(id) {
	return new Promise((resolve, reject) => {
		pl.connect((err, client, release) => {
			if (err) {
				resolve(false);
			}
			let qry = "SELECT * FROM submissions WHERE id = $1";
			client.query(qry, [id], (err, results) => {
				release();
				if (err) {
					resolve(false);
				}
				if (results.rows.length == 0) {
					resolve(false);
				}
				else {
					//console.log(results.rows[0]);
					let ret = {
						user: results.rows[0].usr,
						verdict: results.rows[0].verdict,
						runtime: results.rows[0].runtime,
						problemname: results.rows[0].problemname,
						problemid: results.rows[0].problemid,
						code: results.rows[0].code,
						language: results.rows[0].language,
						insight: results.rows[0].insight,
						timestamp: results.rows[0].timestamp
					}
					resolve(ret);
				}
			});
		});
	});
}
async function grabProblem(id) {
	return new Promise((resolve, reject) => {
		pl.connect((err, client, release) => {
			if (err) {
				resolve(false);
			}
			let qry = "SELECT * FROM problems WHERE pid = $1";
			client.query(qry,[id], (err, results) => {
				release();
				if (err) {
					console.log(err);
				}
				if (results.rows.length == 0) {
					resolve(false);
				}else{
					let ret = {
						name: results.rows[0].name,
						cid: results.rows[0].contestid,
						tl: results.rows[0].tl,
						ml: results.rows[0].ml,
						sol: results.rows[0].solution,
						lang: results.rows[0].sollang,
						checkid: results.rows[0].checkerid,
						pts: results.rows[0].points,
						secret: results.rows[0].secret,
						statement: results.rows[0].statement,
						inputtxt: results.rows[0].inputtxt,
						outputtxt: results.rows[0].outputtxt,
						samples: results.rows[0].samples
					}
					resolve(ret);
				}
			});
		});
	});
}
async function insertSubmission(id, verdict, runtime, memory, insight) {
	return new Promise((resolve, reject) => {
		pl.connect((err, client, release) => {
			if (err) {
				console.log("Error getting client");
				resolve(false);
			}
			let qry = `UPDATE submissions SET verdict = $1, runtime = $2,memory = $3, insight = $4 WHERE id = $5;`;
			client.query(qry,[verdict, runtime, memory, insight, id], (err, results) => {
				release();
				if (err) {
					console.log("an error occured while querying to insert submission", err);
					resolve(false);
				}
				else if (results.rows.length == 0) {
					resolve(false);
				}
				else {
					resolve(false);
				}
			});
		});
	});
}
async function createSubmission(user, code, problem, language, problemname, cid, timestamp) {
	return new Promise((resolve, reject) => {
		pl.connect((err, client, release) => {
			if (err) {
				console.log("Error getting client");
				resolve(false);
			}
			let qry = `INSERT INTO submissions (usr, code, problemid, language, runtime, memory, verdict, problemname, contest, timestamp) values ($1, $2, $3, $4, -1, -1, 'RN', $5, $6, $7) RETURNING id`;
			let vals = [user, code, problem, language, problemname, cid, timestamp];
			client.query(qry, vals, (err, results) => {
				release();
				if (err) {
					console.log("an error occured while querying to create submission", err);
					resolve(false);
				}
				else if (results.rows.length == 0) {
					resolve(false);
				}
				else {
					resolve(results.rows[0].id);
				}
			});
		});
	});
}
async function grabProfile(id) {
	return new Promise((resolve, reject) => {
                pl.connect((err, client, release) => {
                        if (err) {
                                console.log("Error getting client");
                                resolve(false);
                        }
                        let qry = `SELECT * FROM users WHERE id = $1`;
                        client.query(qry, [id], (err, results) => {
                                release();
                                if (err) {
                                        console.log("an error occured while querying");
                                        resolve(false);
                                }
                                if (results.rows.length == 0) {
                                        resolve(false);
                                }
                                else {
                                        res = {
						username: results.rows[0].username,
						name: results.rows[0].display_name
					}
					resolve(res);
                                }
                        });
                });
        });
}
async function getProblems(){
	return new Promise((res, rej)=>{
		pl.connect((err, client, release)=>{
			if(err){
				console.log("Error getting prolbems");
				res(false);
			}
			let qry = "SELECT * FROM problems WHERE secret=false";//or u have access
			client.query(qry, (err, results)=>{
				release();
				if(err){
					console.log("error while query");
					res(false);
				}
				if(results.rows.length==0){
					res(false);
				}else{
					res(results.rows);
				}
			});
		});
	});
}
async function getUserProblems(){
	return new Promise((res, rej)=>{
		pl.connect((err, client, release)=>{
			let qry = 'SELECT ';
		});
	});
}
async function addTest(tid,pid, tval){
	return new Promise((res, rej)=>{
		pl.connect((err, client, release)=>{
			if(err){
				console.log("Error adding problem");
				res(false);
			}
			//console.log(tval, pid);
			let qry = `INSERT INTO test (points,pid, test)
			VALUES ($1, $2, $3) RETURNING id;`;
			client.query(qry, [pts, pid, tval], (err, results)=>{
				release();
				if(err){
					console.log("error while query");
					res(false);
				}
				res(true);
			});
		});
	});
}
async function updateChecker(checkid, checkercode, lang){
	return new Promise((res, rej)=>{
		pl.connect((err, client, release)=>{
			if(err){
				console.log("Error adding problem");
				res(false);
			}
			let qry = `UPDATE CHECKER SET code=$1, lang=$2 WHERE id = $3;`;
			client.query(qry, [checkercode, lang, checkid], (err, results)=>{
				release();
				if(err){
					console.log("error while query");
					res(false);
				}
				res(true);
			});
		});
	});
}
async function addChecker(checkid, checkercode, lang){
	return new Promise((res, rej)=>{
		pl.connect((err, client, release)=>{
			if(err){
				console.log("Error adding problem");
				res(false);
			}
			let qry = `INSERT INTO checker (code, lang)
			VALUES ($1, $2) RETURNING id;`;
			client.query(qry, [checkercode, lang], (err, results)=>{
				release();
				if(err){
					console.log("error while query");
					res(false);
				}
				res(true);
			});
		});
	});
}
async function addSol(pid, code, lang){//FIX
	return new Promise((res, rej)=>{
		pl.connect((err, client, release)=>{
			if(err){
				console.log("Error adding problem");
				res(false);
			}
			let qry = `UPDATE problems SET solution=$1, sollang=$3
			WHERE pid=$2`;
			client.query(qry, [code, pid, lang], (err, results)=>{
				release();
				if(err){
					console.log("error while query");
					res(false);
				}
				res(true);
			});
		});
	});
}
async function addProblem(pid, pname,cid,checkid, sol, state, tl, ml, inter, secret, inputtxt, outputtxt, samples, points){
	return new Promise((res, rej)=>{
		pl.connect((err, client, release)=>{
			if(err){
				console.log("Error adding problem");
				res(false);
			}
			console.log(pid, secret, inputtxt, outputtxt, samples);
			// pid | name | contestid | checkerid | solution | statement | tl | ml | interactive | secret | points 
			let qry = `INSERT INTO problems (pid, name, contestid, checkerid,solution, statement, tl, ml, interactive, secret, inputtxt, outputtxt, samples, points)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (pid)
			DO UPDATE SET 
				name = excluded.name,
				contestid= excluded.contestid,
				checkerid= excluded.checkerid,
				statement= excluded.statement,
				tl= excluded.tl,
				ml= excluded.ml,
				interactive= excluded.interactive,
				secret= excluded.secret,
				points = excluded.points,
				inputtxt = excluded.inputtxt,
				outputtxt = excluded.outputtxt,
				samples = excluded.samples
			`;
			client.query(qry, [pid, pname, cid, checkid, sol, state, tl, ml, inter, secret, inputtxt, outputtxt, samples, points], (err, results)=>{
				release();
				if(err){
					console.log(err);
					console.log("error while query");
					res(false);
				}
				res(results);
			});
		});
	});
}
async function grabUsers(){
        return new Promise((res, rej)=>{
                pl.connect((err, client, release)=>{
                        if(err){
                                console.log("Error getting prolbems");
                                res(false);
                        }
                        let qry = "SELECT * FROM users;";
                        client.query(qry, (err, results)=>{
                                release();
                                if(results.rows.length==0){
                                        res(false);
                                }else{
                                        res(results.rows);
                                }
                        });
                });
        });
}
async function grabContestProblems(cid) {
	return new Promise((res, rej)=>{
                pl.connect((err, client, release)=>{
                        if(err){
                                console.log("Error getting prolbems");
                                res(false);
                        }
                        let qry = `SELECT * FROM problems WHERE contestid = $1`;
                        console.log("CID HERE", cid);
			client.query(qry, [cid], (err, results)=>{
                                release();
                                if(results.rows.length==0){
                                        res(false);
                                }else{
                                        res(results.rows);
                                }
                        });
                });
        });
}
async function validateUser(id, password) {
	return new Promise((resolve, reject) => {
                pl.connect((err, client, release) => {
                        if (err) {
                                console.log("Error getting client");
                                resolve(false);
                        }
                        let qry = `SELECT * FROM users WHERE id = $1 AND pass = $2`;
                        client.query(qry, [id, password], (err, results) => {
                                release();
                                if (err) {
                                        console.log("an error occured while querying");
					console.log(err);
                                        resolve(false);
                                }
                                if (results.rows.length == 0) {
                                        resolve(false);
                                }
                                else {
					resolve(true);
                                }
                        });
                });
        });
}
module.exports = {
	grab: (id) => {
		if (Number(id))
			return grab(id);
		return;
	},
	grabChecker: (id) => {
		if (Number(id))
			return grabChecker(id);
	},
	grabAllProblems: (isAdmin, cid) => {
		return grabAllProblems(isAdmin, cid);
	},
	grabSubs: (user, contest) => {
		return grabSubs(user, contest);
	},
	grabStatus: (id) => {
		if (Number(id))
			return grabStatus(id);
		return;
	},
	grabProblem: (id) => {
		if (Number(id))
			return grabProblem(id);
		return;
	},
	grabTests: (id)=>{
		if (Number(id))
			return grabTests(id);
		return;
	},
	grabProfile: (id)=>{
		if (Number(id))
			return grabProfile(id);
		return;
	},
	insertSubmission: (id, verdict, runtime, memory, insight) => {
		return insertSubmission(id, verdict, runtime, memory, insight);
	},
	createSubmission: (user, code, problem, language, problemname, cid, timestamp) => {
		return createSubmission(user, code, problem, language, problemname, cid, timestamp);
	},
	testSql: () => {
		return testSql();
	},
	addProblem: (pid, pname,cid, checkid,sol, state, tl, ml, inter, secret, inputtxt, outputtxt, samples, points) => {
		return addProblem(pid, pname,cid,checkid, sol,state, tl, ml, inter, secret, inputtxt, outputtxt, samples, points);
	},
	addChecker: (checkid, code, lang)=>{
		return addChecker(checkid, code, lang);
	},
	updateChecker: (checkid, code, lang)=>{
		return updateChecker(checkid, code, lang);
	},
	addSol: (pid, code, lang)=>{
		return addSol(pid, code,lang);
	},
	getProblems: () =>{
		return getProblems();
	},
	checkAdmin: (id) =>{
		return checkAdmin(id);
	},
	grabUsers: () => {
		return grabUsers();
	},
	grabContestProblems: (cid) => {
		if (Number(cid))
			return grabContestProblems(cid);
		return;
	},
	validateUser: (id, password) => {
		return validateUser(id, password);
	}
}