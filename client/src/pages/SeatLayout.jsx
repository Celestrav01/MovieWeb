import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets, dummyDateTimeData, dummyShowsData } from "../assets/assets";
import Loading from "../components/Loading";
import { ArrowRightIcon, ClockIcon, Group, Rows } from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import BlurCircle from "../components/BlurCircle";
import toast, { Toaster } from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const SeatLayout = () => {

  const groupRows = [["A","B"],["C","D"],["E","F"],["G","H"],["I","J"]]

  const {axios,getToken,user} = useAppContext()
  const { id, date } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats,setOccupiedSeats] = useState([])

  const navigate = useNavigate();

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

  const handleSeatClick = (seatId) =>{
    if(!selectedTime){
      return toast.error("Please select time first")
    }
    if(!selectedSeats.includes(seatId) && selectedSeats.length > 4){
      return toast.error("you can only select 5 seats")
    }
    if(occupiedSeats.includes(seatId)){
      return toast("seat booked already")
    }
    setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(seat => seat !== 
      seatId
    ):[...prev,seatId])
  }


  const renderSeats = (row,count = 9)=>{
    return(

      <div key={row} className="flex gap-2 mt-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({length:count},(_,i)=> {
          const seatId = `${row}${i + 1}`;
          return(
            <button key={seatId} onClick={()=> handleSeatClick(seatId)}
            className={`h-8 w-8 rounded border border-primary/60 cursor-pointer
              ${selectedSeats.includes(seatId) && "bg-primary text-white"}
              ${occupiedSeats.includes(seatId) && "opacity-50"}`}>
              {seatId}
            </button>
          );
        })}

      </div>

    </div>

    )
  }

  const getOccupiedSeats = async()=>{
    try {
      const {data} = await axios.get(`/api/booking/seats/${selectedTime.showId}`)
      if(data.success){
        setOccupiedSeats(data.occupiedSeats)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const bookTickets = async()=>{
    try {
      if(!user) return toast.error("Please login to proceed")
      
      if(!selectedTime || !selectedSeats.length) return toast.error("Please select time and seat first");

      const {data} = await axios.post('/api/booking/create',{showId : selectedTime.showId, selectedSeats},{ headers: {Authorization: `Bearer ${await getToken()}` }} )
      if(data.success){
        window.location.href = data.url;
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    if(selectedTime){ 
      getOccupiedSeats()  
    }
  },[selectedTime])

  useEffect(() => {
    getShow();
  }, []);

  return show ? (
    <div className="flex flex-col xl:flex-row px-6 md:px-16 lg:px-24 py-12 mt-30 md:pt-10 max-sm:mt-10">

    <div className="flex flex-col md:flex-row md:px-16 lg:px-0 py-10 gap-10 w-full ">
      {/* Available timings */}
      <div className="md:w-50 items-center bg-primary-dull/10 border border-primary/20 rounded-xl p-5 shadow-md self-start">
        <p className="text-lg font-semibold mb-4">Available Timing</p>
        <div className="space-y-2">
          {show.dateTime[date].map((items) => (
            <div
              key={items.time}
              onClick={() => setSelectedTime(items)}
              className={`flex items-center gap-2 px-4 py-2 w-max rounded-md cursor-pointer transition
              ${
                selectedTime?.time === items.time
                  ? "bg-primary text-white"
                  : "hover:bg-primary/20"
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              <p className="text-sm">{isoTimeFormat(items.time)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Seats Layout */}
      <div className="relative flex-5 flex flex-col items-center max-md:mt-16">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0px" right="0px" />
        <h1 className="text-center font-semibold text-2xl mb-7">Select Your Seat</h1>
        <div className="w-full flex justify-center mx-auto">

        <img src={assets.screenImage} alt="screen" className="w-3/4 max-w-lg block mx-auto object-contain" />
        </div>
        <p className="text-gray-400 text-sm mt-2 text-center">SCREEN THIS WAY</p>
        <div className="flex flex-col items-center mt-10 text-xs text-gray-300">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-4">
              {groupRows[0].map(row=> renderSeats(row))}
            </div>

            <div className="grid grid-cols-2 gap-10">
              {groupRows.slice(1).map((Rows, idx)=>(
                <div key={idx}>
                  {Rows.map(row => renderSeats(row))}

                </div>
              ))}

            </div>

        </div>
        <button onClick={bookTickets} className="flex
        items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull 
        transition rounded-full font-medium cursor-pointer active:scale-95">
          Proceed to Checkout
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4"/>
        </button>
      </div>
    </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;