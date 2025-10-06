import React, { useState } from "react";
import { dummyTrailers } from "../assets/assets";
import BlurCircle from "./BlurCircle";

const TrailerSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);

  // Convert watch?v= to embed/
  const getEmbedUrl = (url) => {
    return url.replace("watch?v=", "embed/");
  };

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
      <p className="text-gray-300 font-medium text-lg max-w-[960px] mx-auto">
        Trailers
      </p>

      <div className="relative mt-6">
        <BlurCircle top="-100px" right="-100px" />

        <iframe
          width="820"
          height="430"
          className="mx-auto max-w-full rounded-lg shadow-lg"
          src={getEmbedUrl(currentTrailer.videoUrl)}
          title="Trailer"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      {/* Trailer Thumbnails */}
      <div className="flex justify-center gap-4 mt-6 flex-wrap">
        {dummyTrailers.map((trailer, index) => (
          <img
            key={index}
            src={trailer.image}
            alt="Trailer Thumbnail"
            className={`w-40 cursor-pointer rounded-lg transition-all duration-300 ${
              currentTrailer.videoUrl === trailer.videoUrl
                ? "ring-4 ring-red-500"
                : "opacity-70 hover:opacity-100"
            }`}
            onClick={() => setCurrentTrailer(trailer)}
          />
        ))}
      </div>
    </div>
  );
};

export default TrailerSection;