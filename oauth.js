const { AuthorizationCode } = require('simple-oauth2');
const axios = require('axios');
const config = {
    client: {
        id: process.env.CLIENT_ID,
        secret: process.env.CLIENT_SECRET
    },
    auth: {
        tokenHost:     'https://ion.tjhsst.edu/oauth/',
        authorizePath: 'https://ion.tjhsst.edu/oauth/authorize',
        tokenPath:     'https://ion.tjhsst.edu/oauth/token/'
    }
};
const client = new AuthorizationCode(config);
async function getToken() {
    const login_url = client.authorizeURL({
        redirect_uri: process.env.CLIENT_REDIRECT_URI,
        scope: ['read']
    });
    return login_url;
}
async function processFunction(CODE, req, res2) {
    const tokenParams = {
        code: CODE,
        redirect_uri: process.env.CLIENT_REDIRECT_URI,
        scope: ['read']
    };
    try {
        let accessToken = await client.getToken(tokenParams); 
        let vals = undefined;
        await axios.get('https://ion.tjhsst.edu/api/profile?format=json', {
            headers: {
                'Authorization': 'Bearer '+ accessToken.token.access_token
            }
        }).then(res => {
            let user_data = res.data;
            req.session.id = user_data.id;
            req.session.accessToken = accessToken;
            
            vals = {
                user_data: user_data,
                req: req,
                res: res2
            }
        })
        .catch((error) => {
            console.log(error);
            res2.redirect("/");
        });
        return vals;
    } catch (error) {
        console.log('Access Token Error lol', error.message);
        return false;
    }
}

module.exports = {
    getToken: () => {
        return getToken();
    },
    processFunction: (CODE, req, res) => {
        return processFunction(CODE, req, res);
    } 
}