const express = require("express");
const axios = require("axios");
const { spawn } = require("child_process");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const csv = require("csv-parser");
const fs = require("fs");
const socketIO = require("socket.io");
const http = require("http");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const movies = [];

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const genres = {
  "genres": [
    {
      "id": 28,
      "name": "Action"
    },
    {
      "id": 12,
      "name": "Adventure"
    },
    {
      "id": 16,
      "name": "Animation"
    },
    {
      "id": 35,
      "name": "Comedy"
    },
    {
      "id": 80,
      "name": "Crime"
    },
    {
      "id": 99,
      "name": "Documentary"
    },
    {
      "id": 18,
      "name": "Drama"
    },
    {
      "id": 10751,
      "name": "Family"
    },
    {
      "id": 14,
      "name": "Fantasy"
    },
    {
      "id": 36,
      "name": "History"
    },
    {
      "id": 27,
      "name": "Horror"
    },
    {
      "id": 10402,
      "name": "Music"
    },
    {
      "id": 9648,
      "name": "Mystery"
    },
    {
      "id": 10749,
      "name": "Romance"
    },
    {
      "id": 878,
      "name": "Science Fiction"
    },
    {
      "id": 10770,
      "name": "TV Movie"
    },
    {
      "id": 53,
      "name": "Thriller"
    },
    {
      "id": 10752,
      "name": "War"
    },
    {
      "id": 37,
      "name": "Western"
    }
  ]
}

const genresMap = new Map();

genres.genres.forEach(genre => {
  genresMap.set( genre.id,genre.name);
});

fs.createReadStream('main_data.csv')
    .pipe(csv())
    .on('data', (data) => {
        movies.push(data);
    })
    .on('end', () => {
        console.log('CSV file successfully processed');
    });



app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/", (req, res) => {
  // console.log(movieName);
  res.redirect("/"+ req.body.movieName);
});

app.get("/aboutUs", (req, res) => {
  res.sendFile(__dirname + "/about-us.html", (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
});

app.get("/:movieName", async (req, res) => {
    const movieName = req.params.movieName;
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

      console.log("Genres Map:", [...genresMap]);

      console.log(movieDetails);


      for (let i = 0; i < movieDetails.length; i++) {
        for (let j = 0; j < movieDetails[i].genre_ids.length; j++) {
          const genreId = movieDetails[i].genre_ids[j];
          const genreName = genresMap.get(genreId);
          movieDetails[i].genre_ids[j] = genreName;
         
        }
      }
      
  
      console.log(movieDetails);

    
      io.emit('apiComplete');
      res.render("output.ejs",{movieDetails:movieDetails});
    });
  
    child.on("close", (code) => {
      if (code !== 0) {
        console.error(`Child process exited with code ${code}`);
      }
    });
  });


  

  app.get('/api/suggestions', (req, res) => {
    const query = req.query.query.toLowerCase(); // Use toLowerCase() for case-insensitive search
    const results = movies.filter(movie => movie.movie_title.toLowerCase().includes(query));
    res.json(results);
});