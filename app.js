const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fileUpload = require('express-fileupload');

const app = express();

// Middleware for parsing JSON body
app.use(express.json());

// Middleware for enabling CORS
app.use(cors());

// Middleware for file upload
app.use(fileUpload());

// Path to the JSON file
const filePath = './movies.json';

// Function to read movie data from JSON file
function readMoviesFromFile() {
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData).movies;
}

// Function to write movie data to JSON file
// function writeMoviesToFile(data) {
//     fs.writeFileSync(filePath, JSON.stringify({ movies: data }, null, 2));
// }
// Function to write movie data to JSON file
function writeMoviesToFile(data) {
    const jsonData = {
        movies: data
    };
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
}


// Function to generate full URL for an image
function getImageUrl(filename, req) {
    return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Route to get all movies
app.get('/', (req, res) => {
    res.redirect('/movies');
});

// Route to get all movies
app.get('/movies', (req, res) => {
    const movies = readMoviesFromFile().map(movie => {
        return { ...movie, image: getImageUrl(movie.image, req) };
    });
    res.json({ message: 'Movie List', data: movies });
});

// Route to add a new movie with image upload
app.post('/add_movies', (req, res) => {
    if (!req.files || !req.files.image) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    const image = req.files.image;
    const fileName = `image_${Date.now()}.png`; // Assuming images are PNG format, adjust if necessary
    const uploadPath = __dirname + '/uploads/' + fileName;

    image.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to upload image' });
        }

        const movies = readMoviesFromFile();
        const newMovieId = movies.length > 0 ? Math.max(...movies.map(movie => movie.id)) + 1 : 1;
        const newMovie = { id: newMovieId, ...req.body, image: fileName };
        movies.push(newMovie); // Append new movie to existing list
        writeMoviesToFile(movies); // Write updated movie list to file
        res.status(201).json({ message: 'New Movie added successfully', data: { ...newMovie, image: getImageUrl(newMovie.image, req) } });
    });
});


// Route to get a specific movie by ID
app.get('/single_movies/:id', (req, res) => {
    const movies = readMoviesFromFile();
    const movie = movies.find(movie => movie.id === parseInt(req.params.id));
    if (movie) {
        res.json({ message: 'Movie Detail', data: { ...movie, image: getImageUrl(movie.image, req) } });
    } else {
        res.status(404).json({ error: 'Movie not found' });
    }
});

// Route to update an existing movie
app.post('/update_movies/:id', (req, res) => {
    const movies = readMoviesFromFile();
    const movieId = parseInt(req.params.id);
    const existingMovieIndex = movies.findIndex(movie => movie.id === movieId);
    if (existingMovieIndex !== -1) {
        movies[existingMovieIndex] = { id: movieId, ...req.body };
        writeMoviesToFile(movies);
        res.json({ message: 'Movie updated successfully', data: { ...movies[existingMovieIndex], image: getImageUrl(movies[existingMovieIndex].image, req) } });
    } else {
        res.status(404).json({ error: 'Movie not found' });
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
        res.status(404).json({ error: 'Movie not found' });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
