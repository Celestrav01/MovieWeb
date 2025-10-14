import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dummyDateTimeData, dummyShowsData } from "../assets/assets";
import BlurCircle from "../components/BlurCircle";
import { Heart, PlayCircleIcon, StarIcon } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const {user,axios,image_base_url, getToken, shows, fetchFavoriteMovies,favoriteMovies} = useAppContext()
  const navigate = useNavigate()
  const { id } = useParams();
  const [show, setShow] = useState(null)

  const getShow = async () => {
    try {
      const {data} = await axios.get(`/api/show/${id}`)
      if(data.success){
       setShow(data)
      }
      
    } catch (error) {
      console.log(error)
    }
  };

  const handleFavorite = async()=>{
    try {
      if(!user) return toast.error("Please login to proceed");

      const {data} =  await axios.post('/api/user/update-favorite', {movieId : id},{ headers: {Authorization: `Bearer ${await getToken()}` }})

      if(data.success){
        await fetchFavoriteMovies()
        toast.success(data.message)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getShow();
  }, [id]);

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={image_base_url + show.movie.poster_path}
          alt=""
          className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
        />
        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">ENGLISH</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {show.movie.title}
          </h1>
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {show.movie.vote_average.toFixed(1)} User Rating
          </div>

          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">
            {show.movie.overview}
          </p>

          <p>
            {timeFormat(show.movie.runtime)} ·{" "}
            {show.movie.genres.map((genre) => genre.name).join(", ")} ·{" "}
            {show.movie.release_date.split("-")[0]}
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button
              className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800
              hover:bg-gray-900 transition rounded-md font-medium
              cursor-pointer active:scale-95"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </button>


            <button
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull
              transition rounded-md font-medium cursor-pointer active:scale-95"
              onClick={() => {
                const el = document.getElementById("dateselect");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  console.warn("❌ dateselect not found");
                }
              }}
            >
              Buy Tickets
            </button>

            <button onClick={handleFavorite} className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95">
              <Heart className={`w-5 h-5 ${favoriteMovies.find(movie => movie._id ===id) ? 'fill-primary text-primary' : ""}` } />
            </button>
          </div>
        </div>
      </div>


      <p className="text-lg font-medium mt-20">Favorite Cast</p>
      <div className="overflow-x-auto mt-8 pb-4">
        <div className="flex items-center gap-4 w-max px-4">
          {show.movie.casts?.slice(0, 8).map((cast, index) => (
            <div key={index} className="flex flex-col items-center w-20">
              <img
                src={image_base_url + cast.profile_path}
                alt={cast.name}
                className="rounded-full h-20 md:h-20 aspect-square object-cover"
              />
              <p className="text-center text-sm">{cast.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="dateselect" className="mt-20">
        <DateSelect dateTime={show.dateTime} id={id} />
      </div>

      <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>

      {/* === FIX APPLIED HERE: Restored dummyShowsData AND used Grid === */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
        {/* THIS LINE WAS CORRECTED: Used dummyShowsData */}
        {shows.slice(0, 4).map((movie, index) => (
          <MovieCard key={index} movie={movie} />
        ))}
      </div>
      {/* ======================================================== */}

      <div className="flex justify-center mt-20">
        <button onClick={() => navigate('/movies')} className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull 
        transition rounded-md font-medium cursor-pointer">Show more</button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;