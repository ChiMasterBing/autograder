require('dotenv').config();
const express = require('express');
const router = express.Router({ mergeParams: true });
const {grab, grabProblem, grabAllProblems, grabSubs, grabStatus, checkAdmin, createSubmission, grabProfile, getProblem, addProblem, testSql, addChecker, addTest, updateTest, addSol, makePublic, updateChecker, grabUsers, grabContestProblems, validateUser} = require("./sql");
const {queue, compileTests} = require("./runTests");

const {processFunction, getToken} = require("../oauth");
const {check} = require("../profile");

const FileReader = require('filereader');
const csvtojson = require('csvtojson');
const upload = require('express-fileupload');
const formidable = require('formidable').formidable;

const lastSubmission = new Map();
router.use(upload());

function getContestStart(cid) {	
        let contestStart;
	let startStr; // in UTC timezone, +4 from EST
        if (cid == 1)
		startStr="2023-10-06T18:30:00Z";
        else if (cid==2)
		startStr="2023-10-27T18:30:00Z";
	else if (cid==3)
		startStr="2024-01-12T19:30:00Z"; // changed to +5, probably cause of daylight saving stuff
	else if (cid==4)
		startStr="2024-02-23T19:30:00Z";
	else if (cid==202401)
		startStr="2024-05-11T14:00:00Z"; // back to +4
	else if (cid==202402)
		startStr="2024-05-11T16:30:00Z";
	else
		startStr="";
	contestStart=new Date(startStr).getTime();
	return contestStart;
}
function getContestEnd(cid) {	
	let endStr;
	let contestEnd; 
        if (cid == 1)
		endStr="2023-10-06T20:00:00Z";
        else if (cid==2)
		endStr="2023-10-27T20:00:00Z";
	else if (cid==3)
		endStr="2024-01-12T21:00:00Z";
	else if (cid==4)
		endStr="2024-02-23T21:00:00Z";
	else if (cid==202401)
		endStr="2024-05-11T15:30:00Z";
	else if (cid==202402 || cid == "202402")
		endStr="2024-05-11T19:30:00Z";
	else endStr="";
	contestEnd=new Date(endStr).getTime();
	return contestEnd;
}
function getLateTakers(cid) {
	//if(cid==3) return [1001731, 1001623, 1001620, 1001475, 1002158, 1001944, 1001092, 1002595, 1001904, 1001642];// anush devkar, armaan ahmed, anusha agarwal, kanishk sivanadam, max zhao, rishikesh narayana, samarth bhargav, nathan liang, esha m, navya arora
	//if(cid==4) return [1002636, 1001207, 1001608, 1002135];//svaran, avni, arjun, olivia
	return [];
}

router.get("/uploadfiletest", async (req, res) => {
	res.render("danielorz.ejs")
});

router.post('/uploadfiletest', function (req, res) {
	
  let sampleFile = req.files;
	console.log(sampleFile.files);
let filename = sampleFile.name;
	console.log(filename);
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file

  // Use the mv() method to place the file somewhere on your server
  //sampleFile.mv('/somewhere/on/your/server/filename.jpg', function(err) {
   // if (err)
    //  return res.status(500).send(err);

    res.send('File uploaded!');
  //});
});

router.get("/authlogin", async (req, res) => {
	if (req.session.loggedin) {
		res.redirect("/grade/profile");
	}
	else {
		let theurl = await getToken();
		res.redirect(theurl);
	}
});
router.get("/login", async (req, res)=>{ 
	let CODE = req.query.code;
	let data = await processFunction(CODE, req, res);
	await check(data.user_data, data.req, data.res);
});

router.get("/tjioilogin", (req, res) => {
	if (req.session.loggedin) {
		res.redirect('/grade/profile');
	} else {
		res.render('tjioiLogin');
	}
});
router.post("/tjioilogin", async (req, res) => {
	let id=parseInt(req.body.id);
	if (isNaN(id)) res.send("Invalid credentials");
	let password=req.body.password;
	let valid = await validateUser(id, password);
	if (valid) {
		let data={"id":id};
		await check(data, req, res);
	} else {
		res.send("Invalid credentials");
	}
});

router.get("/info", checkLoggedIn, async (req, res) => {
	res.render("info", {tjioi: req.session.tjioi});
});

router.post("/logout", (req, res)=> {
	req.session.destroy();
	res.redirect("/");
});
router.get("/profile", checkLoggedIn, (req, res)=>{
	if (req.session.tjioi) {
		res.render("tjioiProfile", {name: req.session.name, username: req.session.username});
	} else {
		res.render("profile", {name: req.session.name, username: req.session.username});
	}
});
router.get("/profile/:id", checkLoggedIn, async (req, res) => {
	if (req.session.tjioi) {
		res.redirect("/grade/profile");
	} else {

	let vals = await grabProfile(req.params.id);
	if (vals == false) {
		res.send("No such user");
	}
	else {
		res.render("fprofile", {name: vals.name, username: vals.username});
	}

	}
});


router.get("/", async (req, res) => {
	res.redirect("/grade/profile");
});

router.get("/attendance", async (req, res) => {
	if (req.session.loggedin) {
		deviceClass = 'main';
		if (req.session.mobile) deviceClass = 'phone';
		res.render("attendance", {name: vals.name, username: vals.username, device: deviceClass});
	}
	else {
		res.redirect("/");
	}
});

router.post("/attendanceComplete", async (req, res) => {
        if (req.session.loggedin) {
        	let pass = req.body.pass;
		let block = req.body.block;
		res.send("Attendance complete, thank you.");
	}
	else {
		res.redirect("/");
	}
});

router.get("/contests", checkLoggedIn, async (req, res) => {
	if (req.session.admin) {
		res.render('contests', {tjioi:req.session.tjioi});
	} else {
		res.render('contests', {tjioi:req.session.tjioi});
		// res.redirect("/grade/profile");
		//res.send("Contests coming soon...");
	}
});
router.get("/contests/:id", checkLoggedIn, async (req, res) => {
	let cid = req.params.id;
	let problems = await grabContestProblems(cid);
	if (problems== undefined){
		problems = []
	}
	let time = (new Date()).getTime();
	let contestStart = getContestStart(req.params.id);
	let contestEnd = getContestEnd(req.params.id);
	let title = "In-House #"+cid;
	if (cid==202401) title="Practice Contest";
	else if(cid==202402) title="TJIOI 2024";
	let timeMessage = contestEnd;
	let timeType="end";
	if (time < contestStart) {
		timeType="start";
		timeMessage = contestStart;
	}
	var ordered=[];
	for(let i=0; i<problems.length; i++) {
		if(true) {
			ordered.push(problems[i]);
			ordered[ordered.length-1].solves=0;
			ordered[ordered.length-1].available = (!problems[i].secret || req.session.admin);
			ordered[ordered.length-1].users=[];
		}
	}

        let subs = await grabSubs(undefined, cid);
        let users = await grabUsers();
	// let subs=  [];
        for (let i=0; i<subs.length; i++) {
		if (parseInt(subs[i].timestamp)>getContestEnd(cid)) continue;
                let ind, pind;
                for (let j=0; j<users.length; j++) {
                        if (users[j].id == subs[i].user) {
                                ind = j;
                                break;
                        }
                }
                for (let j=0; j<ordered.length; j++) {
                        if (ordered[j].pid == subs[i].problemid) {
                                pind = j;
                                break;
                        }
                }
		if (pind==undefined) {
			console.log("error - cannot find matching problem for submission in rendering solve count");
			continue;
		}
		if (ind==undefined) {
			console.log("error - cannot find matching user for submission in rendering solve count");
			continue;
		}
                if (subs[i].verdict == "Accepted" || subs[i].verdict=="AC") {
			if (ordered[pind].users.includes(ind)) continue;
			ordered[pind].solves+=1;
			ordered[pind].users.push(ind);
                }
	}
	ordered.sort(function(a, b) {
		if (a.points==b.points)
			return a.pid>b.pid? 1:-1;
		return a.points>b.points? 1:-1;
	});
	
	if(ordered.length>0)
		res.render("contest", {title: title, problems: ordered, user: req.session.userid, cid: cid, timeStatus: timeMessage, timeType: timeType});
	else
		res.redirect('/grade/contests');
});
router.get("/contests/:id/standings", checkLoggedIn, async (req, res) => {
	let cid = req.params.id;
        let subs = await grabSubs(undefined, cid);
        let users = await grabUsers();
        let problems = await grabContestProblems(cid);
	problems.sort(function(a, b) {
		return a.pid>b.pid? 1 : -1;
	});
        let contestStart=getContestStart(cid);
	let contestEnd=getContestEnd(cid);

        let load = [];
        for (let i=0; i<users.length; i++) {
                let tmp = [];
                for (let j=0; j<problems.length; j++) {
                        tmp.push(0);
                }
                row = {
                        name: users[i].display_name,
                        id: users[i].id,
                        solved: 0,
                        problems: tmp,
                        penalty: 0
                }
                load.push(row);
        }
        subs.sort(function(a, b) {
                return parseInt(a.timestamp)>parseInt(b.timestamp)? 1 : -1;
        });
	
        for (let i=0; i<subs.length; i++) {
		let contestEnd2=contestEnd;
		let contestStart2=contestStart;
		if(cid==3) {
			if([1002379].includes(subs[i].user)) contestEnd2+=50*60000; // shaurya bisht
			if([1001533].includes(subs[i].user)) contestEnd2+=((4*24)*60+30)*60000; // yicong wang
			if(getLateTakers(3).includes(subs[i].user)) {
				contestEnd2+=(2*24+20)*60*60000;
			}
		}
		else if(cid==4) {
			if(getLateTakers(4).includes(subs[i].user)) {
				contestEnd2+=(3*24+4)*60*60000;
				contestStart2+=((3*24+4)*60-5)*60000;
			}
		}
		if(parseInt(subs[i].timestamp)>contestEnd2) continue;
		//console.log("timestamps:", subs[i].timestamp, contestEnd);
                let ind, pind;
                for (let j=0; j<load.length; j++) {
                        if (load[j].id == subs[i].user) {
                                ind = j;
                                break;
                        }
                }
                for (let j=0; j<problems.length; j++) {
                        if (problems[j].pid == subs[i].problemid) {
                                pind = j;
                                break;
                        }
                }
                if (subs[i].verdict == "Accepted" || subs[i].verdict=="AC") {
                        if (load[ind].problems[pind]>=1) {
                                continue;
                        }
                        load[ind].solved +=problems[pind].points;
                        if (Number.isInteger(parseInt(subs[i].timestamp))) {
                                let time = parseInt(subs[i].timestamp);
                                if (true||time > contestStart2) {
                                        load[ind].penalty += parseInt((time-contestStart2)/60000); // convert milliseconds to minutes
                                }
                                else {
                                        console.log("error, timestamp before contest start")
                                }
                        }
                        else {
                                console.log("error, invalid timestamp");
                        }
                        if (load[ind].problems[pind]<0) {
                                load[ind].penalty -= 10*load[ind].problems[pind];
                        }
                        load[ind].problems[pind] = 1-load[ind].problems[pind];
                }
                else {
                        if (load[ind].problems[pind] < 1) {
                                load[ind].problems[pind] -= 1;
                        }
                }
        }
        let load2 = [];
        for (let i=0; i<load.length; i++) {
                let val = load[i];
                if (val.solved > 0) {
			if(val.penalty<0) val.penalty=0;
                        if(val.penalty>0) load2.push(val);
                }
        }
        load2.sort(function(a,b){
                if (a.solved==b.solved) return a.penalty > b.penalty ? 1 : -1;
                return a.solved < b.solved ? 1 : -1;
        });
	for (let i=0; i<load2.length; i++) {
		if(i>0 && load2[i].solved==load2[i-1].solved && load2[i].penalty==load2[i-1].penalty) load2[i].rank=load2[i-1].rank;
		else load2[i].rank=i+1;
	}
	let title="In-House #"+cid;
	if (cid == 202401) title="Practice Contest";
	else if (cid == 202402) title="TJIOI 2024";
	res.render("standings", {title: title, user:
		req.session.userid, cid: cid, pnum: problems.length, load:
		load2}); });
router.get("/contests/:id/status", checkLoggedIn, async (req, res) => {
        let user = req.query.user;
        let contest = req.query.contest;
        let admin = req.session.admin; //await checkAdmin(req.session.userid); //seems insecure but look at later :DD:D:D:D
        if (user == undefined && contest == undefined && !admin) {
                user = req.session.userid;
        }
	if (user != undefined) user=Number(user);
	if (contest != undefined) contest=Number(contest);
        let submissions = await grabSubs(user, contest);
	let cid = req.params.id;
	let title="In-House #"+cid;
	if (cid == 202401) title="Practice Contest";
	else if (cid == 202402) title="TJIOI 2024";

	
	if (contest != undefined) {
                let contestStart=getContestStart(cid);
                submissions=submissions.filter(function(elem) {
                        return req.session.admin || (elem.timestamp > contestStart);
                });
        }
	

        res.render("contestStatus", {title: title, user: req.session.userid, cid: cid, submissions: submissions});
});
router.get("/problemset", checkLoggedIn, async (req, res) => {
	let page = req.query.page;
	if (page == undefined) page = 0;
	let start = page*5; //write multipage later
	let vals = await grabAllProblems(req.session.admin);
	let lst = [];
	console.log(lst)

	for (let i=0; i<vals.length; i++) {
		let p = vals[i];
		if ((!p.secret || req.session.admin) && (req.session.tjioi ^ p.contestid<202400)) lst.push(p);
	}
	lst.sort(function(a, b) {
		return a.pid>b.pid?1:-1;
	});
	
	res.render("gradeProblemset", {problems: lst});
});
router.get("/problemset/:id", checkLoggedIn, async (req, res) => { //req.params.id
	let vals = await grabProblem(req.params.id);
	let contestStart=getContestStart(vals.cid);
	let userid=req.session.userid;
	if(vals.cid==3) {
		if([1002379].includes(userid)) contestStart+=50*60000; // shaurya bisht
		if([1001533].includes(userid)) contestStart+=((4*24)*60+30)*60000; // yicong wang
		if(getLateTakers(3).includes(userid)) contestStart+=(2*24+20)*60*60000;
	}
	else if(vals.cid==4) {
		if(getLateTakers(4).includes(userid)) contestStart+=(3*24+4)*60*60000; // 6:30 pm on monday
	}

	vals.title = vals.name;
	vals.pid = req.params.id;
	if(!req.session.admin && (new Date()).getTime()<=contestStart) {
		console.log(userid, "has tried to access problem early for contest", vals.cid, "at time", new Date().getTime());
		res.send("contest has not started");
		return;
	}

	//console.log(vals);

	let back  = req.query.back;
	if (back) {
		vals.back = back;
	}
	else {
		vals.back = "/grade/problemset";
	}

	if (req.session.admin || !vals.secret) {
		console.log("trying to render problem");
		res.render("gradeProblem", vals);
	}
	else {
		res.redirect("/grade/problemset");
	}
});
router.get("/submit", checkLoggedIn, async (req, res) => {
	user = req.query.user
	last = await grabSubs(user)
	problems = await grabAllProblems(req.session.admin);
	let problemname;
	for (let i=0; i<problems.length; i++) {
		if (problems[i].pid == req.query.problem) problemname = problems[i].name;
	}
	problems = problems.filter(function (elem) {
		return req.session.tjioi ^ elem.contestid < 202400;
	});
	problems.sort(function(a, b) {
		if (a.pid < b.pid) return -1;
		return 1; 
	});
	lastSub = last[last.length-1].language;
	res.render("gradeSubmit", {problemid: req.query.problem, problemname: problemname, lastlang: lastSub, problem: problems});
});

router.post("/status", checkLoggedIn, async (req, res) => { //eventually change to post to submit
	//sends file to another website
	

	let language = req.body.lang;
	//console.log(language);
	if (language != 'python' && language != 'cpp' && language != 'java') {
		console.log("invalid language");
		res.send("unacceptable code language");
		return;
	}

	let pid = req.body.problemid;
	if(pid ==""){
		res.send("You did not input any problem id");
		return;
	}

	let file = req.body.code;

	let problem = await grabProblem(pid);
	let cid = problem.cid;

	let problemname = problem.name;

	let today = new Date();
	let timestamp = today.getTime();

	if(req.files && Object.keys(req.files).length !=0){
		  let sampleFile = req.files.files;
		reg = /^.*\.(py|java|cpp)$/i
		language= sampleFile.name.match(reg)
		if(language==null){
			res.send("please change file extension");
			return;
		}
		language = language[1]

		if(language=="py"){
			language = 'python';
		}
		console.log(language);
		file = sampleFile.data.toString()
		console.log(file);
	}

	let contestStart=getContestStart(cid);
	let contestEnd=getContestEnd(cid);
	if (!req.session.admin && timestamp<=contestStart) {
		res.send("contest currently unavailable");
	}

	let prevts = lastSubmission.get(req.session.userid);
	if (prevts==undefined){
		prevts= -30000
	}
	if (timestamp-prevts>30000 || req.session.admin){
		let sid = await createSubmission(req.session.userid, file, pid, language, problemname, cid, timestamp);
		console.log("submission id:", sid);
		lastSubmission.set(req.session.userid, timestamp);
		await queue(pid, sid);
		res.redirect("/grade/status");
	}else{
		res.render("spamming");
		return;
	}
	
});

router.get("/status", checkLoggedIn, async (req, res) => {
	let user = req.query.user;
	let contest = req.query.contest;
	//let admin = await checkAdmin(req.session.userid); //seems insecure but look at later :DD:D:D:D
	let admin = req.session.admin;
	//console.log(user, contest, admin);
	if (user == undefined && contest == undefined && !admin) { //& !admin
		user = req.session.userid;
	}
	let submissions = await grabSubs(user, contest);

	/*
	if (contest != undefined) {
		let contestStart=getContestStart(parseInt(contest));
		submissions=submissions.filter(function(elem) {
			return req.session.admin || (elem.timestamp > contestStart);
		});
		res.send("SDKL:ASKD:LSA");
	}
	*/

	submissions=submissions.filter(function(elem) {
		return req.session.tjioi ^ elem.contest<202400;
	});
	let page = req.query.page;
	if (page == undefined) page=1;
	res.render("gradeStatus", {submissions: submissions, viewAsAdmin: admin, page: page});
});
router.get("/status/:id", checkLoggedIn, async (req, res) => { //req.params.id
	let vals = await grabStatus(req.params.id);
	if (vals.user == req.session.userid || req.session.admin) {
		if (!req.session.admin &&vals.insight!=undefined && vals.insight[0] == 'D') {
			vals.insight = "You cannot view feedback (not a sample testcase).";
			//vals.insight = vals.insight.substring(67);
		}
		vals.admin = req.session.admin;

		res.render("status", {submission: vals});
	}
	else {
		res.send("You do not have permission to view this submission.");
	}
});

function checkLoggedIn(req, res, next) {
	
	
	if (req.session.loggedin) {
		if (req.session.mobile) {
			res.redirect("/grade/attendance");
		}
		else {
			next();
		}
	}
	else {
		res.redirect("/");
	}
}

module.exports = router;