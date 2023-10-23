const express = require("express");
const axios = require("axios");
const { spawn } = require("child_process");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

let movieName = "";


app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/", (req, res) => {
  movieName = req.body.movieName;
  res.redirect("/"+movieName);
});

app.get("/:movieName", async (req, res) => {
    const child = spawn("python", ["script.py", movieName]);
  
    child.stdout.on("data", async (data) => {
      const movieTitles = JSON.parse(data.toString().trim());
  
      console.log(movieTitles);
  
      const apiUrl = "https://api.themoviedb.org/3/search/movie";
      const apiKey = "71a86d6829df798aee15a20a7ea71235";
  
      const headers = {
        accept: "application/json",
      };
  
      const movieDetails = [];
  
      for (let i = 0; i < movieTitles.length; i++) {
        const query = {
          api_key: apiKey,
          query: movieTitles[i],
        };
  
        try {
          const response = await axios.get(apiUrl, { params: query, headers });
          const result = response.data.results[0];
          if (result) {
            movieDetails.push(result);
          }
        } catch (error) {
          console.error(
            `Error for query '${movieTitles[i]}':`,
            error.response ? error.response.data : error.message
          );
        }
      }
  
      console.log(movieDetails);
      res.render("output.ejs",{movieDetails:movieDetails});
    });
  
    child.on("close", (code) => {
      if (code !== 0) {
        console.error(`Child process exited with code ${code}`);
      }
    });
  });