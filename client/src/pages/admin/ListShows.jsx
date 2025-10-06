import React, { useEffect, useState } from 'react'
import { dummyShowsData } from '../../assets/assets';
import Title from '../../components/admin/Title';
import Loading from '../../components/Loading';
import dateFormat from '../../lib/dateFormat'




const ListShows = () => {

  const currency = import.meta.env.VITE_CURRENCY

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAllShows = async () => {
    try {

      setShows([{
        movie: dummyShowsData[0],
        showDateTime: "2025-06-30T02:30:00.000Z",
        showPrice: 59,
        occupiedSeats: {
          A1: "user_1",
          B1: "user_2",
          C1: "user_3"
        }
      }]);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }

  }

  useEffect(() => {
    getAllShows();
  }, []);

  return !loading ? (
    <>
      <Title text1="List" text2="Shows" />

      {/* 🟢 NEW CODE: Using Flexbox DIVs instead of a native table for reliable layout */}
      <div className='mt-6 bg-primary/10 border border-primary/20 rounded-lg overflow-hidden w-full max-w-4xl'>

        {/* Header Row */}
        <div className='flex items-center justify-between px-4 py-3 text-sm font-medium bg-primary/20'>

          {/* Columns styled with fractional widths and alignment */}
          <p className='w-1/4 text-left'>Movie Name</p>
          <p className='w-1/4 text-left'>Show Time</p>
          <p className='w-1/4 text-center'>Total Bookings</p>
          <p className='w-1/4 text-center'>Earnings</p>

        </div>

        {/* Data Rows */}
        {shows.map((show, index) => (
          <div key={index} className='flex items-center justify-between px-4 py-3 border-t border-primary/20 text-sm font-light'>

            {/* Movie Name Data */}
            <p className='w-1/4 text-left truncate'>{show.movie.title}</p>

            {/* Show Time Data */}
            <p className='w-1/4 text-left'>{dateFormat(show.showDateTime)}</p>

            {/* Total Bookings Data: Centered */}
            <p className='w-1/4 text-center'>{Object.keys(show.occupiedSeats).length}</p>

            {/* Earnings Data: Centered */}
            <p className='w-1/4 text-center'>{currency} {show.showPrice * Object.keys(show.occupiedSeats).length}</p>
          </div>
        ))}

      </div>
    </>
  ) : <Loading />
}

export default ListShows