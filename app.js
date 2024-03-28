const express = require('express');
const cors = require('cors'); // Import the cors middleware
const fs = require('fs');
const app = express();

// Middleware for parsing JSON body
app.use(express.json());

app.use(cors());

// Path to the JSON file
const filePath = './movies.json';

// Function to read movie data from JSON file
function readMoviesFromFile() {
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData).movies;
}

// Function to write movie data to JSON file
function writeMoviesToFile(data) {
    fs.writeFileSync(filePath, JSON.stringify({ movies: data }, null, 2));
}

// Route to get all movies
app.get('/', (req, res) => {
    res.redirect('/movies');
});

// Route to get all movies
app.get('/movies', (req, res) => {
    const movies = readMoviesFromFile();
    res.json({ message: 'Movie List', data: movies });
});

// Route to add a new movie
app.post('/add_movies', (req, res) => {
    const movies = readMoviesFromFile();
    // Generate a new unique ID for the new movie
    const newMovieId = movies.length > 0 ? Math.max(...movies.map(movie => movie.id)) + 1 : 1;
    const newMovie = { id: newMovieId, ...req.body };
    movies.push(newMovie);
    writeMoviesToFile(movies);
    res.status(201).json({ message: 'New Movie added successfuly', data: newMovie });
});


// Route to get a specific movie by ID
app.get('/single_movies/:id', (req, res) => {
    const movies = readMoviesFromFile();
    const movie = movies.find(movie => movie.id === parseInt(req.params.id));
    if (movie) {
        res.json({ message: 'Movie Detail', data: movie });
    } else {
        res.status(401).json({ error: 'Movie not found' });
    }
});

// Route to add a new movie or update an existing movie
app.post('/update_movies/:id', (req, res) => {
    const movies = readMoviesFromFile();
    const movieId = parseInt(req.params.id);
    const existingMovieIndex = movies.findIndex(movie => movie.id === movieId);
    if (existingMovieIndex !== -1) {
        // Update existing movie
        movies[existingMovieIndex] = { id: movieId, ...req.body };
        const updatedMovie = movies[existingMovieIndex]
        writeMoviesToFile(movies);
        res.json({ message: 'Movie updated successfully', data: updatedMovie });
    } else {
        // Create new movie if it doesn't exist
        const newMovie = { id: movieId, ...req.body };
        movies.push(newMovie);
        writeMoviesToFile(movies);
        res.status(201).json({ message: 'Movie List', data: newMovie });
    }
});

// Route to delete a movie
app.delete('/delete_movies/:id', (req, res) => {
    const movies = readMoviesFromFile();
    const index = movies.findIndex(movie => movie.id === parseInt(req.params.id));
    if (index !== -1) {
        movies.splice(index, 1);
        writeMoviesToFile(movies);
        res.json({ message: 'Movie deleted' });
    } else {
        res.status(401).json({ error: 'Movie not found' });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
