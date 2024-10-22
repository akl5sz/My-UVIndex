import express, { response } from "express";
import axios from "axios";
import bodyParser from "body-parser";
import fs from "fs";
import moment from "moment";

var json = JSON.parse(fs.readFileSync('vitamin-d-intake.json', 'utf8'));

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const API_URL = "https://api.openuv.io/api/v1/";
const OpenUV_Api_Key = ""; //key not published on this github due to privacy concerns

app.get("/", (req, res) => {
    res.render("start.ejs");
})

app.post("/home", async (req,res) => {
    try {
        res.render("index.ejs");
        const config = {
            params : {
                "lat" : req.body.lat,
                "lng" : req.body.lng,
            },
            headers : {
                'x-access-token': OpenUV_Api_Key
              }
        };

        let dt;
        if(req.body.dt){
            let time = req.body.dt;
            let currentDate = moment().format("YYYY-MM-DD");
            let combinedDateTime = moment.utc(`${currentDate}T${time}:00`);
            const adjustedTime = combinedDateTime.add(5, 'hours');
            dt = adjustedTime.toISOString();
        } else {
            dt = moment().utc().toISOString();
        }
        const config2 = {
            params : {
                "lat" : req.body.lat,
                "lng" : req.body.lng,
            },
            headers : {
                'x-access-token': OpenUV_Api_Key
              }
        };
        const response = await axios.get(API_URL + "uv?", config);
        const responseForecast = await axios.get(API_URL + "forecast?", config2);

        let intensity;
        const uv = response.data.result.uv;
        if(uv >= 0 && uv < 3){
            intensity = "low";
        } else if(uv >=3 && uv < 6) {
            intensity = "moderate";
        } else if(uv >= 6 && uv < 8){
            intensity = "high";
        } else if(uv >= 8 && uv < 11){
            intensity = "very high";
        } else {
            intensity = "extreme";
        }

        let dailyIntake = json.st[req.body.st][intensity];

        const maxTimeUTC = moment.utc(response.data.result.uv_max_time);
        const adjustedTime = maxTimeUTC.subtract(5, 'hours');
        const adjustedTimeString = adjustedTime.format("HH:mm A");

        res.render("index.ejs", {
            content : response.data.result, 
            st : req.body.st, 
            intensity : intensity, 
            dailyIntake : dailyIntake, 
            uv_max_time : adjustedTimeString,
            lng : req.body.lng,
            lat : req.body.lat,
            forecast : responseForecast.data.result
        });
    } catch (error) {
        res.status(404).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});