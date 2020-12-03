const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const request = require('request')
const CONFIG = require('../config/fetchConfigs');
const UUID = require('./userCode');


const client_id = CONFIG.fetchOptions.client_id;
const client_secret = CONFIG.fetchOptions.client_secret;
const redirect_uri = CONFIG.fetchOptions.url;


/* OAuth for Spotify API
   triggered from front end - log in with spotify  */

const scope = 'user-top-read user-read-private user-read-email';

router.route('/login')
    .get((req, res) => {
        res.redirect('https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                response_type: 'code',
                client_id: client_id,
                scope: scope,
                redirect_uri: redirect_uri,
            }))
})


//redirect user to spotify login page
router.route('/callback')
    .get((req, res) => {
        const code = req.query.code || null;

        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
            },
            json: true
        };

        //Spotify API: retrieve data from Spotify API
        request.post(authOptions, function(error, response, body) {

            if (!error && response.statusCode === 200) {
                const access_token = body.access_token;

                // user profile information
                const options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };

                // storing the user profile information and generating UUID
                request.get(options, async function(error, response, body) {
                    let username = body.id;
                    let userInfo = await UUID.getUserInfo(username);

                    //store this info for account page
                    let userAccountData = {
                        user: userInfo,
                        spotify: body
                    }
                    console.log(userAccountData)
                });


                // redirect the access token to access the Spotify Web API
                res.redirect('http://localhost:9000/artist' + '?access_token=' + access_token);

            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    })


module.exports = router;