import { StarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import timeFormat from '../lib/timeFormat';
import { useAppContext } from '../context/AppContext';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  const {image_base_url} = useAppContext()
  return (
    <div className="flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-full max-w-[220px]">
      <img
        onClick={() => {
          navigate(`/movies/${movie._id}`);
          scrollTo(0, 0);
        }}
        src={image_base_url + movie.backdrop_path}
        alt=""
        className="rounded-lg h-40 w-full object-cover object-center cursor-pointer"
      />

      {/* --- START OF FIX --- */}
      {/* This div is added to create a dedicated content area with a fixed height. 
        I am using h-16 (64px) which is enough for 2 lines of text.
      */}
      <div className="h-16 flex flex-col justify-start">
        <p className="font-semibold mt-2 truncate">{movie.title}</p>

        {/* This is the paragraph that was wrapping. It's now inside the fixed-height container. */}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(movie.release_date).getFullYear()} ·{' '}
          {movie.genres.slice(0, 2).map((genre) => genre.name).join(' | ')} ·{' '}
          {/* Moved to 'text-xs' to save a little space and reduce wrapping chance */}
          {timeFormat(movie.runtime)}
        </p>
      </div>
      {/* --- END OF FIX --- */}

      <div className="flex items-center justify-between mt-4 pb-2">
        <button
          onClick={() => {
            navigate(`/movies/${movie._id}`);
            scrollTo(0, 0);
          }}
          className="px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
        >
          Buy Tickets
        </button>
        <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
          <StarIcon className="w-4 h-4 text-primary fill-primary" />
          {movie.vote_average.toFixed(1)}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;