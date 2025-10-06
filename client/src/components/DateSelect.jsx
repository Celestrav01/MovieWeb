import { useState } from 'react';
import BlurCircle from './BlurCircle';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 

const DateSelect = ({ dateTime, id }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  
  const onDateCheck = () => {
    if (!selected) {
      toast.error('Please choose a date');
    } else {
      navigate(`/movies/${id}/${selected}`);
      scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="pt-24 "> 
      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8 py-5 px-6 md:px-8 bg-primary/10 border border-primary/20  rounded-lg">
        <BlurCircle top="-50px" left="100px" />

        <div className="w-full lg:w-auto text-white flex flex-col items-center lg:items-start">
          <p className="text-lg font-semibold mb-6 whitespace-nowrap">Choose Date</p> 
          
          <div className="flex items-center gap-2 w-full max-w-full"> 
           <button className="p-2 \mathbf{text-primary/90} \mathbf{hover:text-primary} transition focus:outline-none shrink-0">
            <ChevronLeft className="w-6 h-6" />
           </button>

            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar flex-grow"> 
              <div className="flex gap-3 pb-2 min-w-max"> 
                {Object.keys(dateTime).map((date) => {
                  const d = new Date(date);
                  const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayOfMonth = d.getDate();
                  return (
                    <button
                      key={date}
                      onClick={() => setSelected(date)}
                      className={`flex flex-col items-center justify-center 
                               min-w-[60px] h-14 rounded-lg border 
                        ${selected === date
                          ? 'bg-primary border-primary text-white' 
                          : 'bg-transparent  border border-primary/20 text-gray-300 hover:bg-primary/90  transition'}`}
                    >
                      <span className="text-xs font-normal">{dayOfWeek}</span>
                      <span className="text-xl font-medium">{dayOfMonth}</span>
                    </button>
                );
              })}
              </div>
            </div>

            <button className="p-2 \mathbf{text-primary/90} \mathbf{hover:text-primary} transition focus:outline-none shrink-0">
             <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <button
          onClick={onDateCheck}
          className="w-full lg:w-48 xl:w-60 py-2 bg-primary hover:bg-primary/90 
                 transition rounded-full text-lg font-medium whitespace-nowrap shrink-0"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default DateSelect;